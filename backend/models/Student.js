const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  age: { type: Number, required: true, min: 1, max: 120 },
  course: { type: String, required: true, trim: true, maxlength: 100 },
  rollno: {
    type: String, required: true, trim: true, maxlength: 50,
    match: [/^[A-Za-z0-9\-\/]{2,20}$/, 'Roll number must be 2–20 alphanumeric characters'],
  },
  university: { type: String, required: true, trim: true, maxlength: 150 },
  email: {
    type: String, required: true, trim: true, maxlength: 200,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid student email format'],
  },
  phone: {
    type: String, required: true, trim: true, maxlength: 30,
    match: [/^\+[\d]{7,15}$/, 'Invalid student phone number'],
  },
  address: { type: String, required: true, trim: true, maxlength: 300 },
});

module.exports = mongoose.model('Student', studentSchema);