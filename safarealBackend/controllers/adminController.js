const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Offer = require('../models/Offer');

// @desc    Create a shop owner account and automatically approve/assign a mock shop
// @route   POST /api/admin/shopowner
// @access  Private/Admin
const createShopOwner = async (req, res, next) => {
  try {
    const { name, email, phone, password, shopName, description, cuisines, address, openingTime, closingTime } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 1. Create User with role 'shopowner'
    const shopOwner = await User.create({
      name,
      email,
      phone,
      password,
      role: 'shopowner'
    });

    // 2. Create Shop associated with owner
    const shop = await Shop.create({
      ownerId: shopOwner._id,
      shopName,
      description,
      cuisines: cuisines || [],
      address,
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '22:00',
      isApproved: true // Auto-approved when admin creates it directly!
    });

    res.status(201).json({
      success: true,
      message: 'Shop owner and restaurant profile successfully created',
      data: {
        shopOwner: {
          id: shopOwner._id,
          name: shopOwner.name,
          email: shopOwner.email,
          role: shopOwner.role
        },
        shop
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all restaurants/shops
// @route   GET /api/admin/restaurants
// @access  Private/Admin
const getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Shop.find().populate('ownerId', 'name email phone');
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve, Block or Suspend a Shop
// @route   PUT /api/admin/restaurants/:id/status
// @access  Private/Admin
const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { isApproved, isSuspended } = req.body;
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (isApproved !== undefined) shop.isApproved = isApproved;
    if (isSuspended !== undefined) shop.isSuspended = isSuspended;

    await shop.save();

    res.status(200).json({
      success: true,
      message: `Shop status updated successfully. Approved: ${shop.isApproved}, Suspended: ${shop.isSuspended}`,
      data: shop
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders globally
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('shopId', 'shopName logo')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (non-admin, non-shopowner)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create promo offer / banner coupon
// @route   POST /api/admin/offers
// @access  Private/Admin
const createOffer = async (req, res, next) => {
  try {
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
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all offers
// @route   GET /api/admin/offers
// @access  Private/Admin
const getAllOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Coupon status or Delete
// @route   DELETE /api/admin/offers/:id
// @access  Private/Admin
const deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    res.status(200).json({ success: true, message: 'Promo code successfully deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin analytics overview
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRestaurants = await Shop.countDocuments();
    const totalOrdersCount = await Order.countDocuments();

    // Aggregations
    const revenueAggregate = await Order.aggregate([
      { $match: { orderStatus: 'Delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalCommission: { $sum: '$commissionPaid' }
        }
      }
    ]);

    const totalRevenue = revenueAggregate[0]?.totalRevenue || 0;
    const totalCommission = revenueAggregate[0]?.totalCommission || 0;

    // Last 7 days orders graph
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const graphData = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, orderStatus: 'Delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top Selling Restaurants
    const topRestaurants = await Order.aggregate([
      { $match: { orderStatus: 'Delivered' } },
      {
        $group: {
          _id: '$shopId',
          totalSales: { $sum: '$totalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shopDetails'
        }
      },
      { $unwind: '$shopDetails' },
      {
        $project: {
          shopName: '$shopDetails.shopName',
          logo: '$shopDetails.logo',
          totalSales: 1,
          ordersCount: 1
        }
      }
    ]);

    // Order status ratios
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalRestaurants,
          totalOrders: totalOrdersCount,
          totalRevenue,
          totalCommission
        },
        graphData,
        topRestaurants,
        statusStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShopOwner,
  getAllRestaurants,
  updateRestaurantStatus,
  getAllOrders,
  getAllUsers,
  createOffer,
  getAllOffers,
  deleteOffer,
  getAdminAnalytics
};
