const express = require('express');
const router = express.Router();
const {
  getShopProfile,
  updateShopProfile,
  getShopCategories,
  createShopCategory,
  deleteShopCategory,
  getShopFoodItems,
  createShopFoodItem,
  updateShopFoodItem,
  deleteShopFoodItem,
  getShopOrders,
  updateShopOrderStatus,
  getShopAnalytics,
  getShopOffers,
  createShopOffer,
  deleteShopOffer
} = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Protect all routes
router.use(protect);
router.use(authorize('shopowner'));

// Profile
router.get('/profile', getShopProfile);
router.put('/profile', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), updateShopProfile);

// Categories
router.get('/categories', getShopCategories);
router.post('/categories', upload.single('image'), createShopCategory);
router.delete('/categories/:id', deleteShopCategory);

// Food Items
router.get('/foods', getShopFoodItems);
router.post('/foods', upload.single('image'), createShopFoodItem);
router.put('/foods/:id', upload.single('image'), updateShopFoodItem);
router.delete('/foods/:id', deleteShopFoodItem);

// Orders
router.get('/orders', getShopOrders);
router.put('/orders/:id/status', updateShopOrderStatus);

// Analytics
router.get('/analytics', getShopAnalytics);

// Coupons/Offers
router.get('/offers', getShopOffers);
router.post('/offers', createShopOffer);
router.delete('/offers/:id', deleteShopOffer);

module.exports = router;
