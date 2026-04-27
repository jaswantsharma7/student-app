const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const normalisePhone = require('../services/phoneNormalizer');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(authenticate);

const ALLOWED = ['name', 'course', 'year', 'currentSem', 'rollno', 'email', 'phone', 'address', 'semesters', 'cgpa'];

function pickFields(body, fields) {
  const out = {};
  for (const f of fields) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

router.get('/', async (req, res) => {
  try {
    const data = await Student.find({ userId: req.userId }).select('-userId').sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const fields = pickFields(req.body, ALLOWED);
    if (fields.phone) fields.phone = normalisePhone(fields.phone);
    fields.userId = req.userId;
    const newStudent = new Student(fields);
    await newStudent.save();
    const out = newStudent.toObject();
    delete out.userId;
    res.status(201).json(out);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(' ');
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id.trim();
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid student ID format' });

    const fields = pickFields(req.body, ALLOWED);
    if (fields.phone) fields.phone = normalisePhone(fields.phone);

    const updated = await Student.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: fields },
      { new: true, runValidators: true }
    ).select('-userId');

    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(' ');
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id.trim();
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid student ID format' });

    const deleted = await Student.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deleted) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;