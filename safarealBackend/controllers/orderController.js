const Cart = require('../models/Cart');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');
const Offer = require('../models/Offer');
const Shop = require('../models/Shop');
const { getIO } = require('../utils/socket');
const getDistance = require('../utils/distance');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key'
});

// Helper to recalculate total cart amount
const recalculateCart = async (cart) => {
  let total = 0;
  for (const item of cart.items) {
    total += item.quantity * item.price;
  }
  cart.totalAmount = total;
  if (cart.items.length === 0) {
    cart.shopId = null;
  }
  await cart.save();
  return cart;
};

// @desc    Get user's cart
// @route   GET /api/orders/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.foodItemId', 'name image price discountPrice isVeg isAvailable');
      
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [], totalAmount: 0 });
    }
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Add / Update Item in Cart
// @route   POST /api/orders/cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { foodItemId, quantity, forceClear } = req.body;
    
    // Check if food exists
    const food = await FoodItem.findById(foodItemId);
    if (!food || !food.isAvailable) {
      return res.status(404).json({ success: false, message: 'Food item not available' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [], totalAmount: 0 });
    }

    // Multi-Vendor Cart Check
    if (cart.shopId && cart.shopId.toString() !== food.shopId.toString() && cart.items.length > 0) {
      if (forceClear) {
        // Clear cart for new restaurant
        cart.items = [];
        cart.shopId = food.shopId;
      } else {
        // Return warning code
        return res.status(409).json({
          success: false,
          conflict: true,
          message: 'Items in cart belong to another restaurant. Clear cart and add this item?'
        });
      }
    }

    if (!cart.shopId) {
      cart.shopId = food.shopId;
    }

    // Determine correct price
    const itemPrice = food.discountPrice > 0 ? food.discountPrice : food.price;

    // Check if item exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.foodItemId.toString() === foodItemId);
    
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += Number(quantity || 1);
    } else {
      cart.items.push({
        foodItemId,
        quantity: Number(quantity || 1),
        price: itemPrice
      });
    }

    await recalculateCart(cart);
    
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.foodItemId', 'name image price discountPrice isVeg isAvailable');

    res.status(200).json({ success: true, message: 'Added to cart successfully', data: populatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of item or remove it
// @route   PUT /api/orders/cart/item
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { foodItemId, quantity } = req.body; // quantity can be absolute, or 0 to delete
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.foodItemId.toString() === foodItemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await recalculateCart(cart);

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.foodItemId', 'name image price discountPrice isVeg isAvailable');

    res.status(200).json({ success: true, data: populatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Place Order from Cart
// @route   POST /api/orders
// @access  Private
// @desc    Place Order from Cart (COD only)
// @route   POST /api/orders
// @access  Private
const placeOrder = async (req, res, next) => {
  try {
    const { addressId, paymentMethod, couponCode } = req.body;

    if (paymentMethod && paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Invalid payment method. Use dedicated routes for online payment.' });
    }

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.foodItemId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Get user address
    const user = await req.user;
    const address = user.addresses.id(addressId) || user.addresses.find(a => a.isDefault) || user.addresses[0];
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'Please provide a valid delivery address' });
    }

    const shop = await Shop.findById(cart.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Distance Radius Check (Max 5 km)
    if (address.latitude && address.longitude && shop.address && shop.address.latitude && shop.address.longitude) {
      const distance = getDistance(address.latitude, address.longitude, shop.address.latitude, shop.address.longitude);
      if (distance > 5) {
        return res.status(400).json({
          success: false,
          message: `Delivery rejected: The selected address is ${distance.toFixed(2)} km away from the restaurant. We only deliver within a 5 km radius.`
        });
      }
    }

    const subtotal = cart.totalAmount;
    let discount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Offer.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
      }

      // Check shop alignment
      if (coupon.shopId && coupon.shopId.toString() !== cart.shopId.toString()) {
        return res.status(400).json({ success: false, message: 'This coupon is not valid for this restaurant' });
      }

      // Check min order amount alignment
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrderAmount} required to apply this coupon` });
      }

      // Check expiration
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'This coupon code has expired' });
      }

      // Enforce single use per user check (non-cancelled / non-rejected orders)
      const alreadyUsed = await Order.findOne({
        userId: req.user.id,
        couponCode: couponCode.toUpperCase(),
        orderStatus: { $nin: ['Cancelled', 'Rejected'] }
      });
      if (alreadyUsed) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon code!' });
      }

      discount = Math.min((subtotal * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
    }

    const deliveryFee = 40; // Flat delivery fee
    const taxes = Math.round((subtotal - discount) * 0.05); // 5% GST
    const totalAmount = Math.max((subtotal - discount) + deliveryFee + taxes, 0);

    // Compute admin commission (10% flat of the final food amount after discount)
    const commissionPaid = Math.round((subtotal - discount) * 0.10);

    // Build items payload
    const orderItems = cart.items.map(item => ({
      foodItemId: item.foodItemId._id,
      name: item.foodItemId.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Generate unique 4-digit Delivery OTP upon placement
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create({
      userId: req.user.id,
      shopId: cart.shopId,
      items: orderItems,
      deliveryAddress: {
        label: address.label,
        houseNo: address.houseNo || '',
        streetName: address.streetName || '',
        society: address.society || '',
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        latitude: address.latitude || 0,
        longitude: address.longitude || 0
      },
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      subtotal,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      discountAmount: discount,
      deliveryFee,
      taxes,
      totalAmount,
      commissionPaid,
      deliveryOTP
    });

    // Clear user cart atomically
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [], shopId: null, totalAmount: 0 }
    );

    // Trigger Real-Time Socket updates for the Shop Owner
    const io = getIO();
    if (io) {
      // Emit to shop room that a new order arrived!
      io.to(`shop_${order.shopId}`).emit('new_order', {
        orderId: order._id,
        message: `New order received from ${req.user.name}!`,
        order
      });
    }

    res.status(201).json({ success: true, message: 'Order placed successfully!', order });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Razorpay Payment Order (returns razorpay order details, doesn't create Order in DB)
// @route   POST /api/orders/razorpay/initiate
// @access  Private
const initiateRazorpayPayment = async (req, res, next) => {
  try {
    const { addressId, couponCode } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.foodItemId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Get user address
    const user = await req.user;
    const address = user.addresses.id(addressId) || user.addresses.find(a => a.isDefault) || user.addresses[0];
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'Please provide a valid delivery address' });
    }

    const shop = await Shop.findById(cart.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Distance Radius Check (Max 5 km)
    if (address.latitude && address.longitude && shop.address && shop.address.latitude && shop.address.longitude) {
      const distance = getDistance(address.latitude, address.longitude, shop.address.latitude, shop.address.longitude);
      if (distance > 5) {
        return res.status(400).json({
          success: false,
          message: `Delivery rejected: The selected address is ${distance.toFixed(2)} km away from the restaurant. We only deliver within a 5 km radius.`
        });
      }
    }

    const subtotal = cart.totalAmount;
    let discount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Offer.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
      }

      // Check shop alignment
      if (coupon.shopId && coupon.shopId.toString() !== cart.shopId.toString()) {
        return res.status(400).json({ success: false, message: 'This coupon is not valid for this restaurant' });
      }

      // Check min order amount alignment
      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrderAmount} required to apply this coupon` });
      }

      // Check expiration
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ success: false, message: 'This coupon code has expired' });
      }

      // Enforce single use per user check (non-cancelled / non-rejected orders)
      const alreadyUsed = await Order.findOne({
        userId: req.user.id,
        couponCode: couponCode.toUpperCase(),
        orderStatus: { $nin: ['Cancelled', 'Rejected'] }
      });
      if (alreadyUsed) {
        return res.status(400).json({ success: false, message: 'You have already used this coupon code!' });
      }

      discount = Math.min((subtotal * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
    }

    const deliveryFee = 40; // Flat delivery fee
    const taxes = Math.round((subtotal - discount) * 0.05); // 5% GST
    const totalAmount = Math.max((subtotal - discount) + deliveryFee + taxes, 0);

    const isPlaceholder = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder');
    let razorpayOrder = null;

    if (isPlaceholder) {
      console.log('Razorpay placeholder credentials detected. Generating mock order.');
      razorpayOrder = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: Math.round(totalAmount * 100),
        currency: 'INR'
      };
    } else {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        });
      } catch (error) {
        console.error('Razorpay order creation failed:', error);
        if (error.statusCode === 401) {
          console.log('Razorpay authentication failed. Falling back to mock order.');
          razorpayOrder = {
            id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
            amount: Math.round(totalAmount * 100),
            currency: 'INR'
          };
        } else {
          return res.status(500).json({ success: false, message: 'Failed to initialize Razorpay payment. Please try again.' });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Razorpay order generated successfully!',
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's order history
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('shopId', 'shopName logo banner')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'shopName logo banner phone address')
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Role safety - check owner
    if (req.user.role === 'user' && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Signature & complete/create order in DB
// @route   POST /api/orders/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { addressId, couponCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'All Razorpay parameters are required.' });
    }

    const isMock = razorpayOrderId && razorpayOrderId.startsWith('order_mock_');
    if (!isMock) {
      const crypto = require('crypto');
      const secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key';
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
      }
    }

    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.foodItemId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Get user address
    const user = await req.user;
    const address = user.addresses.id(addressId) || user.addresses.find(a => a.isDefault) || user.addresses[0];
    
    if (!address) {
      return res.status(400).json({ success: false, message: 'Please provide a valid delivery address' });
    }

    const shop = await Shop.findById(cart.shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Distance Radius Check (Max 5 km)
    if (address.latitude && address.longitude && shop.address && shop.address.latitude && shop.address.longitude) {
      const distance = getDistance(address.latitude, address.longitude, shop.address.latitude, shop.address.longitude);
      if (distance > 5) {
        return res.status(400).json({
          success: false,
          message: `Delivery rejected: The selected address is ${distance.toFixed(2)} km away from the restaurant. We only deliver within a 5 km radius.`
        });
      }
    }

    const subtotal = cart.totalAmount;
    let discount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Offer.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        if (!coupon.shopId || coupon.shopId.toString() === cart.shopId.toString()) {
          if (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) {
            if (!coupon.expiryDate || new Date(coupon.expiryDate) >= new Date()) {
              const alreadyUsed = await Order.findOne({
                userId: req.user.id,
                couponCode: couponCode.toUpperCase(),
                orderStatus: { $nin: ['Cancelled', 'Rejected'] }
              });
              if (!alreadyUsed) {
                discount = Math.min((subtotal * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
              }
            }
          }
        }
      }
    }

    const deliveryFee = 40;
    const taxes = Math.round((subtotal - discount) * 0.05);
    const totalAmount = Math.max((subtotal - discount) + deliveryFee + taxes, 0);

    const commissionPaid = Math.round((subtotal - discount) * 0.10);

    const orderItems = cart.items.map(item => ({
      foodItemId: item.foodItemId._id,
      name: item.foodItemId.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Generate unique 4-digit Delivery OTP upon placement
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();

    const order = await Order.create({
      userId: req.user.id,
      shopId: cart.shopId,
      items: orderItems,
      deliveryAddress: {
        label: address.label,
        houseNo: address.houseNo || '',
        streetName: address.streetName || '',
        society: address.society || '',
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        latitude: address.latitude || 0,
        longitude: address.longitude || 0
      },
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'Completed',
      orderStatus: 'Pending',
      subtotal,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      discountAmount: discount,
      deliveryFee,
      taxes,
      totalAmount,
      commissionPaid,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      deliveryOTP
    });

    // Clear cart atomically
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [], shopId: null, totalAmount: 0 }
    );

    // Trigger Real-Time Socket updates for the Shop Owner
    const io = getIO();
    if (io) {
      io.to(`shop_${order.shopId}`).emit('new_order', {
        orderId: order._id,
        message: `New order received from ${req.user.name}!`,
        order
      });
    }

    res.status(200).json({ success: true, message: 'Payment verified and order placed successfully!', order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  placeOrder,
  getUserOrders,
  getOrderDetails,
  initiateRazorpayPayment,
  verifyRazorpayPayment
};
