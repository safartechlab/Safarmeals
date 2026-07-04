const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopName: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  cuisines: [{ type: String }],
  address: {
    houseNo: { type: String, required: true },
    streetName: { type: String, required: true },
    society: { type: String, default: '' },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 }
  },
  openingTime: { type: String, required: true }, // e.g. "09:00"
  closingTime: { type: String, required: true }, // e.g. "22:00"
  ratings: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false }
}, { timestamps: true });

// Index for powerful search
shopSchema.index({ shopName: 'text', cuisines: 'text', description: 'text' });

module.exports = mongoose.model('Shop', shopSchema);
