const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Cart = require('../models/Cart');
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safarmeal';

async function testPlaceOrder() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Find test user
    const user = await User.findOne({ email: 'user@safarmeal.com' });
    if (!user) {
      console.error('Test user not found.');
      return;
    }

    // Find first shop
    const shop = await Shop.findOne();
    if (!shop) {
      console.error('No shops found.');
      return;
    }

    // Prepare a mock request body and req object
    const req = {
      user: user,
      body: {
        addressId: user.addresses[0]._id,
        paymentMethod: 'RAZORPAY',
        couponCode: undefined
      }
    };

    // Run the placeOrder logic manually
    const { placeOrder } = require('../controllers/orderController');

    // Create a mock res object
    const res = {
      status(code) {
        console.log('Response Status:', code);
        return this;
      },
      json(data) {
        console.log('Response Data:', JSON.stringify(data, null, 2));
        return this;
      }
    };

    const next = (err) => {
      if (err) {
        console.error('Error passed to next():', err);
      }
    };

    // Ensure cart exists with items
    let cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      cart = await Cart.create({ userId: user._id, items: [], totalAmount: 0 });
    }
    
    if (cart.items.length === 0) {
      const foodItem = await FoodItem.findOne({ shopId: shop._id });
      if (!foodItem) {
        console.error('No food items found for this shop.');
        return;
      }
      cart.items.push({
        foodItemId: foodItem._id,
        quantity: 1,
        price: foodItem.price
      });
      cart.shopId = shop._id;
      cart.totalAmount = foodItem.price;
      await cart.save();
      console.log('Seeded a food item into the user cart.');
    }

    console.log('Calling placeOrder...');
    await placeOrder(req, res, next);

  } catch (error) {
    console.error('Place order failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

testPlaceOrder();
