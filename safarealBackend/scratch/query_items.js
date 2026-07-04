const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const FoodItem = require('../models/FoodItem');
const Shop = require('../models/Shop');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safarmeal';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const shops = await Shop.find();
    console.log('Total shops:', shops.length);
    for (const shop of shops) {
      const items = await FoodItem.find({ shopId: shop._id }).populate('categoryId');
      console.log(`Shop: ${shop.shopName} (ID: ${shop._id})`);
      console.log(`Items count: ${items.length}`);
      if (items.length > 0) {
        console.log('Sample items:');
        items.slice(0, 5).forEach(it => {
          console.log(` - ${it.name} (${it.categoryId ? it.categoryId.name : 'No Category'}): Price: ${it.price}, isVeg: ${it.isVeg}`);
        });
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
