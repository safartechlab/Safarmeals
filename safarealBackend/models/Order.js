const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [{
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  deliveryAddress: {
    label: { type: String, default: 'Home' },
    houseNo: { type: String, default: '' },
    streetName: { type: String, default: '' },
    society: { type: String, default: '' },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 }
  },
  paymentMethod: { type: String, enum: ['COD', 'STRIPE', 'RAZORPAY'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  subtotal: { type: Number, required: true },
  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  commissionPaid: { type: Number, default: 0 }, // Generated commission for admin (e.g. 10% of subtotal)
  deliveryOTP: { type: String, default: null },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  razorpaySignature: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
