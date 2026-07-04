const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }
}, { timestamps: true });

// Ensure categories are unique per shop
categorySchema.index({ name: 1, shopId: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
