const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

// Compound index to allow only one review per user per restaurant
reviewSchema.index({ userId: 1, shopId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
