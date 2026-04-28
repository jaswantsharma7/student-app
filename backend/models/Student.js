const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name:             { type: String, trim: true, maxlength: 100 },
  internalMarks:    { type: Number, min: 0, default: 0 },
  maxInternalMarks: { type: Number, min: 0, default: 0 },
  externalMarks:    { type: Number, min: 0, default: 0 },
  maxExternalMarks: { type: Number, min: 0, default: 0 },
  marks:            { type: Number, min: 0, max: 100 },
}, { _id: false });

const semesterSchema = new mongoose.Schema({
  semNumber: { type: Number, required: true },
  subjects:  { type: [subjectSchema], default: [] },
  sgpa:      { type: Number, default: null },
}, { _id: false });

const studentSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  course:     { type: String, required: true, trim: true, maxlength: 100 },
  year:       { type: Number, required: true, min: 1, max: 5 },
  currentSem: { type: Number, required: true, min: 1, max: 10 },
  rollno:     {
    type: String, required: true, trim: true, maxlength: 50,
    match: [/^[A-Za-z0-9\-\/]{2,30}$/, 'Roll number must be 2–30 alphanumeric characters'],
  },
  email: {
    type: String, required: true, trim: true, maxlength: 200,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid student email format'],
  },
  phone: {
    type: String, required: true, trim: true, maxlength: 30,
    match: [/^\+[\d]{7,15}$/, 'Invalid student phone number'],
  },
  address:    { type: String, required: true, trim: true, maxlength: 300 },
  semesters:  { type: [semesterSchema], default: [] },
  cgpa:       { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);