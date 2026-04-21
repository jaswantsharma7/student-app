const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const mongoose = require('mongoose');
const app = express();

// ── DNS fallback for Render ──
const { setServers } = require('node:dns/promises');
setServers(['8.8.8.8', '1.1.1.1']);

// ── CORS ──
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));

// ── MongoDB ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Atlas Connected'))
  .catch(err => console.log('Connection Error:', err));

// ── Schemas ──
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number'],
  },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  age: { type: Number, required: true, min: 1, max: 120 },
  course: { type: String, required: true, trim: true, maxlength: 100 },
  rollno: { type: String, required: true, trim: true, maxlength: 50 },
  university: { type: String, required: true, trim: true, maxlength: 150 },
  email: { type: String, required: true, trim: true, maxlength: 200 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  address: { type: String, required: true, trim: true, maxlength: 300 },
});

const Student = mongoose.model('Student', studentSchema);

// ── Auth Middleware ──
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const pickFields = (obj, fields) => {
  const out = {};
  for (const f of fields) {
    if (obj[f] !== undefined) out[f] = obj[f];
  }
  return out;
};

// ── Health ──
app.get('/', (req, res) => res.json({ status: 'API running' }));

// ── Register ──
app.post('/auth/register', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password)
      return res.status(400).json({ error: 'Email, phone, and password are required.' });
    if (typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    
    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ email, phone, passwordHash });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, phone: user.phone } });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'An account with this email already exists.' });
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(' ');
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── Login ──
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, phone: user.phone } });
  } catch {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Verify token ──
app.get('/auth/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email phone');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user._id, email: user.email, phone: user.phone } });
  } catch {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
});

// ── Students (all protected) ──
app.get('/students', authenticate, async (req, res) => {
  try {
    const data = await Student.find({ userId: req.userId }).select('-userId');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/students', authenticate, async (req, res) => {
  try {
    const fields = pickFields(req.body, ['name', 'age', 'course', 'rollno', 'university', 'email', 'phone', 'address']);
    fields.age = Number(fields.age);
    fields.userId = req.userId;
    const newStudent = new Student(fields);
    await newStudent.save();
    const out = newStudent.toObject();
    delete out.userId;
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/students/:id', authenticate, async (req, res) => {
  try {
    const id = req.params.id.trim();
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid student ID format' });

    const fields = pickFields(req.body, ['name', 'age', 'course', 'rollno', 'university', 'email', 'phone', 'address']);
    if (fields.age !== undefined) fields.age = Number(fields.age);

    const updated = await Student.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: fields },
      { new: true, runValidators: true }
    ).select('-userId');

    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/students/:id', authenticate, async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
