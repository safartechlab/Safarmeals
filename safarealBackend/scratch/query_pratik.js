const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const FoodItem = require('../models/FoodItem');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safarmeal';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find user by name "Pratik" (case insensitive regex or exact match)
    const users = await User.find({ name: /Pratik/i });
    console.log('Found users matching "Pratik":', users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    for (const user of users) {
      const shops = await Shop.find({ ownerId: user._id });
      console.log(`Shops for user ${user.name} (${user.role}):`);
      for (const shop of shops) {
        console.log(` - Shop ID: ${shop._id}, Name: ${shop.shopName}, Description: ${shop.description}`);
        const categories = await Category.find({ shopId: shop._id });
        console.log(`   Categories:`, categories.map(c => ({ id: c._id, name: c.name })));
        const items = await FoodItem.find({ shopId: shop._id });
        console.log(`   Items (${items.length}):`);
        items.forEach(it => {
          console.log(`     * Name: ${it.name}, Price: ${it.price}, Category: ${it.categoryId}`);
        });
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
