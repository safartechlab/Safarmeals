const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "BITE50"
  description: { type: String, default: '' },
  discountPercentage: { type: Number, required: true, min: 1, max: 100 },
  maxDiscountAmount: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
