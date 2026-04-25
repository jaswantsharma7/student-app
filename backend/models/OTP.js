const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  type: { type: String, enum: ['email', 'login'], required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});
otpSchema.index({ identifier: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);