const Shop = require('../models/Shop');
const Category = require('../models/Category');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const { uploadImage } = require('../middleware/uploadMiddleware');
const { getIO } = require('../utils/socket');
const { admin, isFirebaseReady } = require('../utils/firebaseAdmin');


// Helper to get Shop ID from owner user ID
const getShopByOwner = async (ownerId) => {
  const shop = await Shop.findOne({ ownerId });
  if (!shop) throw new Error('Restaurant profile not found for this owner account');
  return shop;
};

// @desc    Get Shop Owner's Restaurant details
// @route   GET /api/shop/profile
// @access  Private/ShopOwner
const getShopProfile = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// @desc    Update Shop Owner's Restaurant Profile
// @route   PUT /api/shop/profile
// @access  Private/ShopOwner
const updateShopProfile = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);

    shop.shopName = req.body.shopName || shop.shopName;
    shop.description = req.body.description || shop.description;
    shop.openingTime = req.body.openingTime || shop.openingTime;
    shop.closingTime = req.body.closingTime || shop.closingTime;

    if (req.body.cuisines) {
      shop.cuisines = typeof req.body.cuisines === 'string'
        ? req.body.cuisines.split(',').map(c => c.trim())
        : req.body.cuisines;
    }

    if (req.body.address) {
      const addr = typeof req.body.address === 'string' ? JSON.parse(req.body.address) : req.body.address;
      shop.address = { ...shop.address, ...addr };
    }

    // Handles files (logo/banner)
    if (req.files) {
      if (req.files.logo) {
        shop.logo = await uploadImage(req.files.logo[0]);
      }
      if (req.files.banner) {
        shop.banner = await uploadImage(req.files.banner[0]);
      }
    }

    await shop.save();
    res.status(200).json({ success: true, message: 'Restaurant profile updated successfully', data: shop });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CATEGORIES CRUD
// ==========================================

const getShopCategories = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const categories = await Category.find({ shopId: shop._id });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createShopCategory = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const { name } = req.body;

    let image = '';
    if (req.file) {
      image = await uploadImage(req.file);
    }

    const category = await Category.create({
      name,
      image,
      shopId: shop._id
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const deleteShopCategory = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const category = await Category.findOneAndDelete({ _id: req.params.id, shopId: shop._id });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
    }

    // Delete associated food items
    await FoodItem.deleteMany({ categoryId: category._id, shopId: shop._id });

    res.status(200).json({ success: true, message: 'Category and all associated food items deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FOOD ITEMS CRUD
// ==========================================

const getShopFoodItems = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const foods = await FoodItem.find({ shopId: shop._id }).populate('categoryId', 'name');
    res.status(200).json({ success: true, data: foods });
  } catch (error) {
    next(error);
  }
};

const createShopFoodItem = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const { name, description, price, discountPrice, categoryId, isVeg, isAvailable, preparationTime, ingredients } = req.body;

    let image = '';
    if (req.file) {
      image = await uploadImage(req.file);
    }

    const foodItem = await FoodItem.create({
      shopId: shop._id,
      categoryId,
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      image,
      isVeg: isVeg === 'true' || isVeg === true,
      isAvailable: isAvailable !== 'false' && isAvailable !== false,
      preparationTime: preparationTime ? Number(preparationTime) : 30,
      ingredients: ingredients ? (typeof ingredients === 'string' ? ingredients.split(',').map(i => i.trim()) : ingredients) : []
    });

    res.status(201).json({ success: true, data: foodItem });
  } catch (error) {
    next(error);
  }
};

const updateShopFoodItem = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const food = await FoodItem.findOne({ _id: req.params.id, shopId: shop._id });

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found or unauthorized' });
    }

    const { name, description, price, discountPrice, categoryId, isVeg, isAvailable, preparationTime, ingredients } = req.body;

    if (name) food.name = name;
    if (description) food.description = description;
    if (price !== undefined) food.price = Number(price);
    if (discountPrice !== undefined) food.discountPrice = Number(discountPrice);
    if (categoryId) food.categoryId = categoryId;
    if (isVeg !== undefined) food.isVeg = isVeg === 'true' || isVeg === true;
    if (isAvailable !== undefined) food.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (preparationTime !== undefined) food.preparationTime = Number(preparationTime);
    
    if (ingredients) {
      food.ingredients = typeof ingredients === 'string' ? ingredients.split(',').map(i => i.trim()) : ingredients;
    }

    if (req.file) {
      food.image = await uploadImage(req.file);
    }

    await food.save();
    res.status(200).json({ success: true, data: food });
  } catch (error) {
    next(error);
  }
};

const deleteShopFoodItem = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const food = await FoodItem.findOneAndDelete({ _id: req.params.id, shopId: shop._id });

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Food item successfully deleted' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ORDERS MANAGEMENT & SOCKET EMITS
// ==========================================

const getShopOrders = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const orders = await Order.find({ shopId: shop._id })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateShopOrderStatus = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const { status } = req.body;
    
    const order = await Order.findOne({ _id: req.params.id, shopId: shop._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }
    
    // Status Flow: Preparing → Ready for Pickup → Picked Up → Out for Delivery → Delivered
    if (status === 'Out for Delivery') {
      if (!order.deliveryOTP) {
        order.deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();
      }
    }

    if (status === 'Delivered') {
      const { otp } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, message: "Please provide the customer's 4-digit Delivery OTP to complete this handover!" });
      }
      if (order.deliveryOTP !== otp && otp !== '9999') { // '9999' serves as a developer master-bypass
        return res.status(400).json({ success: false, message: 'Incorrect Delivery OTP. Please check the code with the customer!' });
      }
      order.paymentStatus = 'Completed';
    }

    order.orderStatus = status;
    await order.save();

    // Trigger Real-Time Socket Updates
    const io = getIO();
    if (io) {
      // Emit status update to User room
      io.to(`user_${order.userId}`).emit('order_status_update', {
        orderId: order._id,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus
      });

      // Send status transition notifications to user
      let notifType = '';
      let notifMessage = '';

      if (status === 'Accepted') {
        notifType = 'order_accepted';
        notifMessage = `✅ Order Approved: Your order has been approved by ${shop.shopName}!`;
      } else if (status === 'Preparing') {
        notifType = 'preparing';
        notifMessage = `🍳 Preparing: Chef has started preparing your fresh meal!`;
      } else if (status === 'Ready for Pickup') {
        notifType = 'rider_assigned';
        notifMessage = `🛵 Rider Assigned: Delivery partner Rahul Sharma is at the restaurant.`;
      } else if (status === 'Picked Up') {
        notifType = 'picked_up';
        notifMessage = `🍔 Picked Up: Our delivery partner has picked up your food and is on the way!`;
      } else if (status === 'Delivered') {
        notifType = 'delivered';
        notifMessage = `🎉 Delivered: Order complete! Enjoy your delicious meal!`;
      }

      if (notifType && notifMessage) {
        io.to(`user_${order.userId}`).emit('delivery_notification', {
          orderId: order._id,
          type: notifType,
          message: notifMessage
        });
      }

      // Emit update to shop-dashboard channel
      io.to(`shop_${shop._id}`).emit('shop_dashboard_refresh');
    }

    // GPS Simulation for 'Picked Up' / active delivery
    if (status === 'Picked Up') {
      // Setup coordinates
      const startLat = shop.address?.latitude && shop.address?.latitude !== 0 ? shop.address.latitude : 40.7580;
      const startLng = shop.address?.longitude && shop.address?.longitude !== 0 ? shop.address.longitude : -73.9855;
      const endLat = order.deliveryAddress?.latitude && order.deliveryAddress?.latitude !== 0 ? order.deliveryAddress.latitude : 40.7527;
      const endLng = order.deliveryAddress?.longitude && order.deliveryAddress?.longitude !== 0 ? order.deliveryAddress.longitude : -73.9772;

      // Initialize Firestore document
      if (isFirebaseReady()) {
        try {
          const trackingDocRef = admin.firestore().collection('order_tracking').doc(order._id.toString());
          await trackingDocRef.set({
            orderId: order._id.toString(),
            riderName: "Rahul Sharma",
            riderPhone: "+91 98765 43210",
            status: 'Picked Up',
            latitude: startLat,
            longitude: startLng,
            restaurantLatitude: startLat,
            restaurantLongitude: startLng,
            customerLatitude: endLat,
            customerLongitude: endLng,
            eta: 15,
            progress: 0,
            updatedAt: new Date()
          });
          console.log(`Firestore order_tracking document initialized for order ${order._id}`);
        } catch (dbErr) {
          console.error('Failed to write initial tracking to Firestore:', dbErr.message);
        }
      }

      // Clear any existing simulation interval for this order
      global.orderSimulations = global.orderSimulations || {};
      if (global.orderSimulations[order._id.toString()]) {
        clearInterval(global.orderSimulations[order._id.toString()]);
        delete global.orderSimulations[order._id.toString()];
      }

      let progress = 0;
      const simulationInterval = setInterval(async () => {
        try {
          // Increment progress
          progress += 0.08; // takes ~12 steps (about 96 seconds at 8s ticks)
          if (progress >= 1.0) {
            progress = 1.0;
          }

          const currentLat = startLat + (endLat - startLat) * progress;
          const currentLng = startLng + (endLng - startLng) * progress;
          
          let simStatus = progress < 0.2 ? 'Picked Up' : 'Out for Delivery';
          const currentEta = Math.max(1, Math.round(15 * (1 - progress)));

          // Emit real-time tracking update via socket
          const currentIO = getIO();
          if (currentIO) {
            currentIO.to(`user_${order.userId}`).emit('rider_location_update', {
              orderId: order._id,
              latitude: currentLat,
              longitude: currentLng,
              eta: currentEta,
              progress,
              status: simStatus
            });

            // Trigger "Rider Nearby" alert if progress is around 80%
            if (progress >= 0.8 && progress < 0.88) {
              currentIO.to(`user_${order.userId}`).emit('delivery_notification', {
                orderId: order._id,
                type: 'rider_nearby',
                message: '🛵 Rider Rahul Sharma is nearby! Keep your 4-digit Delivery OTP ready.'
              });
            }
          }

          // Update Firestore
          if (isFirebaseReady()) {
            try {
              await admin.firestore().collection('order_tracking').doc(order._id.toString()).update({
                latitude: currentLat,
                longitude: currentLng,
                status: simStatus,
                eta: currentEta,
                progress,
                updatedAt: new Date()
              });
            } catch (fsErr) {
              console.error(`Failed to update Firestore tracking for order ${order._id}:`, fsErr.message);
            }
          }

          // If arrived, stop moving but do not delete until marked Delivered
          if (progress >= 1.0) {
            clearInterval(global.orderSimulations[order._id.toString()]);
          }
        } catch (err) {
          console.error(`Simulation loop error for order ${order._id}:`, err);
        }
      }, 8000);

      global.orderSimulations[order._id.toString()] = simulationInterval;

    } else if (['Delivered', 'Rejected', 'Cancelled'].includes(status)) {
      // Clear simulation interval
      if (global.orderSimulations && global.orderSimulations[order._id.toString()]) {
        clearInterval(global.orderSimulations[order._id.toString()]);
        delete global.orderSimulations[order._id.toString()];
        console.log(`Simulation cleared for order ${order._id} on status ${status}`);
      }

      // Update terminal state in Firestore
      if (isFirebaseReady()) {
        try {
          await admin.firestore().collection('order_tracking').doc(order._id.toString()).update({
            status,
            eta: 0,
            progress: 1.0,
            updatedAt: new Date()
          });
        } catch (fsErr) {
          console.error(`Failed to write terminal state to Firestore for order ${order._id}:`, fsErr.message);
        }
      }
    }

    res.status(200).json({ success: true, message: `Order status updated to '${status}'`, data: order });
  } catch (error) {
    next(error);
  }
};

// ==========================================

// SHOP ANALYTICS
// ==========================================

const getShopAnalytics = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);

    const totalOrders = await Order.countDocuments({ shopId: shop._id });
    const pendingOrders = await Order.countDocuments({ shopId: shop._id, orderStatus: 'Pending' });
    
    const deliveredOrders = await Order.find({ shopId: shop._id, orderStatus: 'Delivered' });
    const totalEarnings = deliveredOrders.reduce((sum, ord) => sum + ord.subtotal, 0); // Exclude delivery fees

    // Top selling food items
    const topFoods = await Order.aggregate([
      { $match: { shopId: shop._id, orderStatus: 'Delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodItemId',
          name: { $first: '$items.name' },
          soldQuantity: { $sum: '$items.quantity' },
          earnings: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { soldQuantity: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders,
          pendingOrders,
          totalEarnings,
          rating: shop.ratings,
          reviewCount: shop.reviewCount
        },
        topFoods
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// OFFERS / COUPONS CRUD
// ==========================================

const getShopOffers = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const offers = await Offer.find({ shopId: shop._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

const createShopOffer = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const { title, code, description, discountPercentage, maxDiscountAmount, minOrderAmount, expiryDate } = req.body;

    const offerExists = await Offer.findOne({ code: code.toUpperCase() });
    if (offerExists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const offer = await Offer.create({
      title,
      code: code.toUpperCase(),
      description,
      discountPercentage,
      maxDiscountAmount,
      minOrderAmount,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      shopId: shop._id
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

const deleteShopOffer = async (req, res, next) => {
  try {
    const shop = await getShopByOwner(req.user.id);
    const offer = await Offer.findOneAndDelete({ _id: req.params.id, shopId: shop._id });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Coupon code successfully deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
