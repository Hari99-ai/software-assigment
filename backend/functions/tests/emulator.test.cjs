const {test, before, after, beforeEach} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createHmac} = require('node:crypto');
const {initializeTestEnvironment, assertFails, assertSucceeds} = require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,Timestamp,serverTimestamp} = require('firebase/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run only through firebase emulators:exec');
process.env.GCLOUD_PROJECT = 'demo-aquapure-tests';
process.env.RAZORPAY_KEY_ID = 'rzp_test_local';
process.env.RAZORPAY_KEY_SECRET = 'local-test-secret';
let nextId = 0;
const payments = new Map();
require.cache[require.resolve('razorpay')] = {id:require.resolve('razorpay'),filename:require.resolve('razorpay'),loaded:true,exports:class FakeRazorpay {
  constructor(){
    this.orders={create:async params=>({id:`order_${++nextId}`,amount:params.amount,currency:params.currency})};
    this.payments={fetch:async id=>payments.get(id)};
  }
}};
const api = require('../lib/index');
const admin = require('firebase-admin');
const db = admin.firestore();
let env;
const context = uid => ({auth:{uid,token:{email:`${uid}@example.test`}}});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-aquapure-tests',firestore:{rules:fs.readFileSync('../firestore.rules','utf8')}});});
after(async()=>{await env.cleanup();await Promise.all(admin.apps.map(app=>app.delete()));});
beforeEach(async()=>{await env.clearFirestore();payments.clear();nextId=0;});
async function seed(stock=10){await db.doc('products/WP001').set({name:'Demo purifier',price:5000,wholesalePrice:3750,stock,available:true,image:'https://example.test/product.jpg'});await db.doc('users/customer').set({role:'customer',email:'customer@example.test'});}
async function quote(uid='customer'){return api.createRazorpayOrder.run({cartItems:[{productId:'WP001',quantity:1,price:1}],totalAmount:1},context(uid));}
function confirmation(order,uid='customer',amount=order.amount){const paymentId=`pay_${order.razorpayOrderId}`;payments.set(paymentId,{order_id:order.razorpayOrderId,amount,currency:'INR',status:'captured'});return [
 {razorpayOrderId:order.razorpayOrderId,razorpayPaymentId:paymentId,razorpaySignature:createHmac('sha256',process.env.RAZORPAY_KEY_SECRET).update(`${order.razorpayOrderId}|${paymentId}`).digest('hex'),deliveryAddress:{fullName:'Demo Customer',phone:'9876543210',street:'Demo Street',city:'Pune',state:'Maharashtra',pincode:'411001'}},context(uid)];}
test('rules block privilege escalation, cross-user access and direct paid-order creation',async()=>{
 const alice=env.authenticatedContext('alice',{email:'alice@example.test'}).firestore();
 await assertFails(setDoc(doc(alice,'users/alice'),{email:'alice@example.test',role:'admin',createdAt:Timestamp.now()}));
 await assertFails(setDoc(doc(alice,'users/alice'),{email:'alice@example.test',role:'customer',dealerStatus:'approved',createdAt:Timestamp.now()}));
 await assertSucceeds(setDoc(doc(alice,'users/alice'),{email:'alice@example.test',role:'customer',createdAt:Timestamp.now()}));
 await assertFails(updateDoc(doc(alice,'users/alice'),{role:'dealer'}));
 await assertFails(setDoc(doc(alice,'orders/fake'),{userId:'alice',paymentStatus:'paid'}));
 await db.doc('orders/bobs').set({userId:'bob'});
 await assertFails(getDoc(doc(alice,'orders/bobs')));
 await db.doc('users/admin').set({role:'admin'});
 const adminClient=env.authenticatedContext('admin').firestore();
 await assertSucceeds(getDoc(doc(adminClient,'orders/bobs')));
 await assertFails(updateDoc(doc(adminClient,'orders/bobs'),{paymentStatus:'paid'}));
});
test('quote ignores client price and uses wholesale only for approved dealer',async()=>{
 await seed();assert.equal((await quote()).amount,520000);
 await db.doc('users/dealer').set({role:'dealer',dealerStatus:'pending'});assert.equal((await quote('dealer')).amount,520000);
 await db.doc('users/dealer').update({dealerStatus:'approved'});assert.equal((await quote('dealer')).amount,395000);
 await assert.rejects(()=>api.createRazorpayOrder.run({cartItems:[{productId:'WP001',quantity:-1}]},context('customer')));
});
test('concurrent confirmation of one payment creates exactly one order and one stock deduction',async()=>{
 await seed();const order=await quote();const args=confirmation(order);
 const results=await Promise.all([api.verifyAndCreateOrder.run(...args),api.verifyAndCreateOrder.run(...args)]);
 assert.equal(results[0].orderId,results[1].orderId);
 assert.equal((await db.collection('orders').get()).size,1);
 assert.equal((await db.doc('products/WP001').get()).data().stock,9);
 assert.equal((await db.collection('notifications/customer/messages').get()).size,1);
});
test('two captured orders competing for last unit never oversell',async()=>{
 await seed(1);const first=await quote();const second=await quote();
 const results=await Promise.allSettled([api.verifyAndCreateOrder.run(...confirmation(first)),api.verifyAndCreateOrder.run(...confirmation(second))]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await db.doc('products/WP001').get()).data().stock,0);
});
test('mismatched capture amount and another user cannot fulfill order',async()=>{
 await seed();const order=await quote();await assert.rejects(()=>api.verifyAndCreateOrder.run(...confirmation(order,'customer',1)));
 await assert.rejects(()=>api.verifyAndCreateOrder.run(...confirmation(order,'other')));
 assert.equal((await db.collection('orders').get()).size,0);
});
test('dealer review resolves applicant from trusted application, not caller userId',async()=>{
 await seed();await db.doc('users/admin').set({role:'admin'});
 await db.doc('users/applicant').set({role:'customer'});
 await db.doc('dealerApplications/application').set({userId:'applicant',status:'pending'});
 await assert.rejects(()=>api.approveDealer.run({applicationId:'application'},context('customer')));
 await api.approveDealer.run({applicationId:'application',userId:'customer'},context('admin'));
 assert.equal((await db.doc('users/applicant').get()).data().role,'dealer');
 assert.equal((await db.doc('users/customer').get()).data().role,'customer');
 await api.setDealerAccess.run({applicationId:'application',enabled:false,note:'Local test'},context('admin'));
 assert.equal((await db.doc('users/applicant').get()).data().role,'customer');
});
test('service rules accept complete future requests and reject injected status or malformed address',async()=>{
 const alice=env.authenticatedContext('alice',{email:'alice@example.test'}).firestore();
 const booking={userId:'alice',serviceType:'installation',address:{fullName:'Demo',street:'Demo Street',city:'Pune',state:'Maharashtra',pincode:'411001',phone:'9876543210'},contactName:'Demo',contactPhone:'9876543210',preferredDate:Timestamp.fromMillis(Date.now()+86400000),preferredTime:'10:00 AM',status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(alice,'serviceBookings/good'),booking));
 await assertFails(setDoc(doc(alice,'serviceBookings/paid'),{...booking,status:'completed'}));
 await assertFails(setDoc(doc(alice,'serviceBookings/bad'),{...booking,address:{street:'incomplete'}}));
 await assertFails(updateDoc(doc(alice,'serviceBookings/good'),{userId:'bob'}));
});
test('admin transitions append audit history and enforce technician assignment and terminal states',async()=>{
 await db.doc('users/admin').set({role:'admin'});
 await db.doc('orders/status-order').set({userId:'customer',status:'confirmed'});
 await api.updateOrderStatus.run({orderId:'status-order',status:'processing',note:'Picked'},context('admin'));
 assert.equal((await db.doc('orders/status-order').get()).data().statusHistory[0].note,'Picked');
 await assert.rejects(()=>api.updateOrderStatus.run({orderId:'status-order',status:'delivered'},context('admin')));
 await db.doc('serviceBookings/service').set({userId:'customer',status:'confirmed'});
 await assert.rejects(()=>api.updateServiceStatus.run({bookingId:'service',status:'assigned'},context('admin')));
 await api.updateServiceStatus.run({bookingId:'service',status:'assigned',assignedTechnician:'Demo Technician',note:'Assigned'},context('admin'));
 assert.equal((await db.doc('serviceBookings/service').get()).data().assignedTechnician,'Demo Technician');
});
