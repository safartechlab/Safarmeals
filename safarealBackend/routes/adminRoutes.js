const express = require('express');
const router = express.Router();
const {
  createShopOwner,
  getAllRestaurants,
  updateRestaurantStatus,
  getAllOrders,
  getAllUsers,
  createOffer,
  getAllOffers,
  deleteOffer,
  getAdminAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply admin protection to all routes in this file
router.use(protect);
router.use(authorize('admin'));

router.post('/shopowner', createShopOwner);
router.get('/restaurants', getAllRestaurants);
router.put('/restaurants/:id/status', updateRestaurantStatus);
router.get('/orders', getAllOrders);
router.get('/users', getAllUsers);
router.post('/offers', createOffer);
router.get('/offers', getAllOffers);
router.delete('/offers/:id', deleteOffer);
router.get('/analytics', getAdminAnalytics);

module.exports = router;
