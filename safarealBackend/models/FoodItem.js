const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  ingredients: [{ type: String }],
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 30 }, // in minutes
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

// Text index for powerful food search
foodItemSchema.index({ name: 'text', description: 'text', ingredients: 'text' });

module.exports = mongoose.model('FoodItem', foodItemSchema);
