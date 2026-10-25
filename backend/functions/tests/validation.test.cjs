const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createHmac} = require('node:crypto');
const {validateCart, validateAddress, validSignature, calculateQuote} = require('../lib/validation');
test('rejects tampered quantities, paths, duplicate products and oversized carts', () => {
  for (const quantity of [-1, 0, 0.5, '2', NaN, 1001]) assert.throws(() => validateCart([{productId:'WP001', quantity}]));
  assert.throws(() => validateCart([{productId:'users/admin',quantity:1}]));
  assert.throws(() => validateCart([{productId:'A',quantity:1},{productId:'A',quantity:2}]));
  assert.throws(() => validateCart(Array.from({length:51},(_,i)=>({productId:`p${i}`,quantity:1}))));
  assert.deepEqual(validateCart([{productId:'WP001',quantity:5,price:1}]), [{productId:'WP001',quantity:5}]);
});
test('server totals use integer paise and include shipping at the threshold', () => {
  assert.deepEqual(calculateQuote([{price:9999.99,quantity:1}]), {subtotalPaise:999999,deliveryPaise:20000,amount:1019999});
  assert.equal(calculateQuote([{price:2500,quantity:4}]).amount,1000000);
  assert.throws(() => calculateQuote([{price:-100,quantity:1}]));
});
test('HMAC verifies exact payment and fails closed without secret', () => {
  const sig=createHmac('sha256','secret').update('order_1|pay_1').digest('hex');
  assert.equal(validSignature('order_1','pay_1',sig,'secret'),true);
  assert.equal(validSignature('order_2','pay_1',sig,'secret'),false);
  assert.equal(validSignature('order_1','pay_1','short','secret'),false);
  assert.equal(validSignature('order_1','pay_1',sig,''),false);
});
test('address is allowlisted and validated', () => {
  assert.throws(() => validateAddress({}));
  const address={fullName:' Jane ',phone:'9876543210',street:'1 Main St',city:'Pune',state:'MH',pincode:'411001',role:'admin'};
  assert.equal(validateAddress(address).fullName,'Jane');
  assert.equal(validateAddress(address).role,undefined);
});
