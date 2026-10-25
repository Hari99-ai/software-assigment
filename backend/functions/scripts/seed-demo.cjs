// Disposable local fixture only. Refuses to run against production services.
if(!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIREBASE_AUTH_EMULATOR_HOST)throw new Error('Set both Firestore and Auth emulator hosts; production seeding is prohibited.');
const admin=require('firebase-admin');const products=require('../lib/catalog.json');
admin.initializeApp({projectId:'demo-aquapure'});const db=admin.firestore();
const stamp=()=>admin.firestore.Timestamp.now();
(async()=>{
 for(const [uid,role] of [['demo-admin','admin'],['demo-customer','customer'],['demo-dealer','dealer']]){
  const fields={email:`${role}@example.test`,password:process.env.DEMO_PASSWORD||'AquaPureDemo2026!',displayName:`Demo ${role}`};
  try{await admin.auth().createUser({uid,...fields});}catch(e){if(e.code!=='auth/uid-already-exists'&&e.code!=='auth/email-already-exists')throw e;}
  await db.doc(`users/${uid}`).set({email:fields.email,displayName:fields.displayName,role,addresses:[],...(role==='dealer'?{dealerStatus:'approved'}:{}),createdAt:stamp()});
 }
 const batch=db.batch();for(const p of products)batch.set(db.doc(`products/${p.id}`),{...p,createdAt:stamp()});
 const address={fullName:'Demo Customer',phone:'9876543210',street:'Demonstration address',city:'Pune',state:'Maharashtra',pincode:'411001'};
 for(let i=0;i<7;i++){
  const p=products[i];batch.set(db.doc(`orders/demo_order_${i+1}`),{userId:i===2?'demo-dealer':'demo-customer',userType:i===2?'dealer':'customer',items:[{productId:p.id,name:p.name,price:p.price,quantity:1,image:p.image}],totalAmount:p.price,deliveryAddress:address,status:['confirmed','processing','shipped','delivered','confirmed','processing','delivered'][i],paymentStatus:'paid',createdAt:stamp(),updatedAt:stamp(),statusHistory:[]});
 }
 batch.set(db.doc('dealerApplications/demo-customer'),{userId:'demo-customer',businessName:'Demo Water Solutions',businessType:'Retailer',email:'customer@example.test',phone:'9876543210',city:'Pune',address:'Demonstration address',status:'pending',createdAt:stamp()});
 batch.set(db.doc('serviceBookings/demo-service'),{userId:'demo-customer',serviceType:'installation',purifierDetails:products[0].name,address,contactName:'Demo Customer',contactPhone:'9876543210',preferredDate:admin.firestore.Timestamp.fromMillis(Date.now()+86400000),preferredTime:'10:00 AM',status:'pending',createdAt:stamp()});
 await batch.commit();console.log('Local fixtures ready: admin@example.test, customer@example.test, dealer@example.test. Password: DEMO_PASSWORD or documented local default.');await admin.app().delete();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
