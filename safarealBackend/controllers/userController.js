const Shop = require('../models/Shop');
const FoodItem = require('../models/FoodItem');
const Category = require('../models/Category');
const Review = require('../models/Review');
const User = require('../models/User');
const Offer = require('../models/Offer');
const getDistance = require('../utils/distance');

// @desc    Get all active/approved restaurants
// @route   GET /api/user/restaurants
// @access  Public
const getRestaurants = async (req, res, next) => {
  try {
    const { search, cuisine, rating, sort, lat, lng } = req.query;
    
    // Base filter
    const query = { isApproved: true, isSuspended: false };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisines = { $in: [new RegExp(cuisine, 'i')] };
    }

    // Rating filter (e.g. 4+ stars)
    if (rating) {
      query.ratings = { $gte: Number(rating) };
    }

    let findQuery = Shop.find(query);

    // Sorting
    if (sort === 'rating') {
      findQuery = findQuery.sort({ ratings: -1 });
    } else if (sort === 'newest') {
      findQuery = findQuery.sort({ createdAt: -1 });
    } else {
      findQuery = findQuery.sort({ ratings: -1 }); // Default to ratings
    }

    let shops = await findQuery;

    // Filter by distance (5 km radius) if user location (lat, lng) is provided
    if (lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      
      shops = shops.map(shop => {
        const shopObj = shop.toObject();
        if (shopObj.address && shopObj.address.latitude !== undefined && shopObj.address.longitude !== undefined) {
          shopObj.distance = getDistance(userLat, userLng, shopObj.address.latitude, shopObj.address.longitude);
        } else {
          shopObj.distance = null;
        }
        return shopObj;
      }).filter(shop => {
        if (shop.distance !== null && shop.distance !== undefined) {
          return shop.distance <= 5;
        }
        return true; // Keep legacy shops without coordinates
      });
    }

    res.status(200).json({ success: true, count: shops.length, data: shops });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant profile + Categories + Food Items
// @route   GET /api/user/restaurants/:id
// @access  Public
const getRestaurantDetails = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop || !shop.isApproved || shop.isSuspended) {
      return res.status(404).json({ success: false, message: 'Restaurant not found or unavailable' });
    }

    const categories = await Category.find({ shopId: shop._id });
    const foods = await FoodItem.find({ shopId: shop._id, isAvailable: true });
    const reviews = await Review.find({ shopId: shop._id })
      .populate('userId', 'name profileImage')
      .sort({ createdAt: -1 });
    const offers = await Offer.find({ shopId: shop._id, isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        restaurant: shop,
        categories,
        menuItems: foods,
        reviews,
        offers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search foods globally
// @route   GET /api/user/foods/search
// @access  Public
const searchFoods = async (req, res, next) => {
  try {
    const { query, isVeg, maxPrice, rating, shopId } = req.query;

    const filter = { isAvailable: true };

    if (shopId) {
      filter.shopId = shopId;
    }

    if (query) {
      // Find matching categories first
      const matchedCategories = await Category.find({ name: { $regex: query, $options: 'i' } });
      const categoryIds = matchedCategories.map(c => c._id);

      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { categoryId: { $in: categoryIds } }
      ];
    }

    if (isVeg !== undefined) {
      filter.isVeg = isVeg === 'true' || isVeg === true;
    }

    if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    const foods = await FoodItem.find(filter)
      .populate('shopId', 'shopName logo ratings address')
      .populate('categoryId', 'name');

    res.status(200).json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to shop
// @route   POST /api/user/restaurants/:id/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const shopId = req.params.id;
    const userId = req.user.id;

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ userId, shopId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this restaurant' });
    }

    // Create review
    const review = await Review.create({
      userId,
      shopId,
      rating: Number(rating),
      comment
    });

    // Recalculate average ratings
    const shopReviews = await Review.find({ shopId });
    const totalRating = shopReviews.reduce((sum, r) => sum + r.rating, 0);
    
    shop.ratings = Number((totalRating / shopReviews.length).toFixed(1));
    shop.reviewCount = shopReviews.length;
    await shop.save();

    res.status(201).json({ success: true, data: review, restaurantRating: shop.ratings });
  } catch (error) {
    next(error);
  }
};

// @desc    Save delivery address
// @route   POST /api/user/addresses
// @access  Private
const saveAddress = async (req, res, next) => {
  try {
    const { label, houseNo, streetName, society, addressLine, city, state, zipCode, isDefault, latitude, longitude } = req.body;
    const user = await User.findById(req.user.id);

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      label: label || 'Home',
      houseNo: houseNo || '',
      streetName: streetName || '',
      society: society || '',
      addressLine,
      city,
      state,
      zipCode,
      isDefault: isDefault || user.addresses.length === 0,
      latitude: latitude !== undefined ? Number(latitude) : 0,
      longitude: longitude !== undefined ? Number(longitude) : 0
    });

    await user.save();
    res.status(201).json({ success: true, message: 'Address saved successfully', data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete delivery address
// @route   DELETE /api/user/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
    
    // Ensure at least one default remains if addresses exist
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Address deleted successfully', data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle wishlist / favorite shop
// @route   POST /api/user/wishlist/:shopId
// @access  Private
const toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const shopId = req.params.shopId;

    const isFav = user.wishlist.includes(shopId);
    if (isFav) {
      user.wishlist = user.wishlist.filter(id => id.toString() !== shopId);
    } else {
      user.wishlist.push(shopId);
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: isFav ? 'Removed from favorites' : 'Added to favorites',
      wishlist: user.wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery address
// @route   PUT /api/user/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
  try {
    const { label, houseNo, streetName, society, addressLine, city, state, zipCode, isDefault, latitude, longitude } = req.body;
    const user = await User.findById(req.user.id);
    
    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    address.label = label || address.label;
    if (houseNo !== undefined) address.houseNo = houseNo;
    if (streetName !== undefined) address.streetName = streetName;
    if (society !== undefined) address.society = society;
    address.addressLine = addressLine !== undefined ? addressLine : address.addressLine;
    address.city = city !== undefined ? city : address.city;
    address.state = state !== undefined ? state : address.state;
    address.zipCode = zipCode !== undefined ? zipCode : address.zipCode;
    if (isDefault !== undefined) {
      address.isDefault = isDefault;
    }
    if (latitude !== undefined) address.latitude = Number(latitude);
    if (longitude !== undefined) address.longitude = Number(longitude);

    // Ensure at least one default remains if addresses exist
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Address updated successfully', data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active coupons
// @route   GET /api/user/offers
// @access  Private
const getActiveOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ isActive: true })
      .populate('shopId', 'shopName logo banner')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantDetails,
  searchFoods,
  createReview,
  saveAddress,
  updateAddress,
  deleteAddress,
  toggleWishlist,
  getActiveOffers
};
