const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 900 },
});

module.exports = mongoose.model('PendingUser', pendingSchema);