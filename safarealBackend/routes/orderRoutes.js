const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  placeOrder,
  getUserOrders,
  getOrderDetails,
  initiateRazorpayPayment,
  verifyRazorpayPayment
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/cart', getCart);
router.post('/cart', addToCart);
router.put('/cart/item', updateCartItem);
router.post('/', placeOrder);
router.post('/razorpay/initiate', initiateRazorpayPayment);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.get('/', getUserOrders);
router.get('/:id', getOrderDetails);

module.exports = router;
