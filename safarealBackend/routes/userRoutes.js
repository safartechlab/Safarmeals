const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurantDetails,
  searchFoods,
  createReview,
  saveAddress,
  updateAddress,
  deleteAddress,
  toggleWishlist,
  getActiveOffers
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/restaurants', getRestaurants);
router.get('/restaurants/:id', getRestaurantDetails);
router.get('/foods/search', searchFoods);
router.get('/offers', getActiveOffers);

// Protected routes
router.post('/restaurants/:id/reviews', protect, createReview);
router.post('/addresses', protect, saveAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.post('/wishlist/:shopId', protect, toggleWishlist);

module.exports = router;
