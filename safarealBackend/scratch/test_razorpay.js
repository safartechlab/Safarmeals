const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Razorpay = require('razorpay');

console.log('Using Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Using Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Exists' : 'Missing');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key'
});

razorpay.orders.create({
  amount: 100, // 1 INR in paise
  currency: 'INR',
  receipt: 'receipt_test'
}).then(order => {
  console.log('Success! Razorpay Order:', order);
}).catch(err => {
  console.error('Razorpay Order Creation Failed with error:', err);
});
