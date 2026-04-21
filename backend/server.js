const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

require('dotenv').config();
const mongoose = require('mongoose');
const app = express();

// ── DNS fallback for Render ──
const { setServers } = require('node:dns/promises');
setServers(['8.8.8.8', '1.1.1.1']);

// ── CORS ──
const allowedOrigins = process.env.ALLOWED_ORIGINS;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
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
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  phone: {
    type: String, required: true, unique: true, trim: true,
    match: [/^\+?[\d][\d\s\-]{5,18}[\d]$/, 'Invalid phone number'],
  },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// OTP document — TTL index auto-deletes after 10 minutes
const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true },   // email or normalised phone
  type: { type: String, enum: ['email', 'phone'], required: true },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10 min TTL
});
otpSchema.index({ identifier: 1, type: 1 });
const OTP = mongoose.model('OTP', otpSchema);

// Pending registration — TTL 15 minutes, cleared after account created
const pendingSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 900 }, // 15 min TTL
});
const PendingUser = mongoose.model('PendingUser', pendingSchema);

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
    match: [/^\+?[\d][\d\s\-]{5,18}[\d]$/, 'Invalid student phone number'], 
  },
  address: { type: String, required: true, trim: true, maxlength: 300 },
});

const Student = mongoose.model('Student', studentSchema);

// ── OTP Services ──

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not account password)
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateOtp = () => {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailOtp = async (email, otp) => {
  await emailTransporter.sendMail({
    from: `"Student Registry" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your verification code',
    text: `Your email verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #e5e5e5; border-radius: 10px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 0 0 8px;">Email Verification</h2>
        <p style="font-size: 13px; color: #555; margin: 0 0 24px;">Use the code below to verify your email address for Student Registry.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #aaa; margin: 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

const sendPhoneOtp = async (phone, otp) => {
  // Normalise: ensure number starts with +
  const to = phone.startsWith('+') ? phone : `+${phone.replace(/[^\d]/g, '')}`;
  await twilioClient.messages.create({
    body: `Your Student Registry verification code is: ${otp}. Expires in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};

const storeOtp = async (identifier, type, otp) => {
  const otpHash = await bcrypt.hash(otp, 8);
  // Replace any existing OTP for this identifier+type
  await OTP.findOneAndDelete({ identifier, type });
  await OTP.create({ identifier, type, otpHash });
};

const verifyOtp = async (identifier, type, otp) => {
  const record = await OTP.findOne({ identifier, type });
  if (!record) return { ok: false, error: 'Code not found or expired. Request a new one.' };
  if (record.attempts >= 5) {
    await OTP.deleteOne({ _id: record._id });
    return { ok: false, error: 'Too many incorrect attempts. Request a new code.' };
  }
  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    const left = 5 - record.attempts;
    return { ok: false, error: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.` };
  }
  await OTP.deleteOne({ _id: record._id });
  return { ok: true };
};

// ── Auth Middleware ──
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
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
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f];
  return out;
};

// ── Health ──
app.get('/', (req, res) => res.json({ status: 'API running' }));

// ────────────────────────────────────────────────
//  REGISTRATION FLOW
//  Step 1: POST /auth/register  → save pending, send OTPs
//  Step 2: POST /auth/verify-otp → verify codes, finalise account
//  Step 3: POST /auth/resend-otp → resend one OTP
// ────────────────────────────────────────────────

// Step 1 — Register (save pending, send OTPs)
app.post('/auth/register', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password)
      return res.status(400).json({ error: 'Email, phone, and password are required.' });
    if (typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const normEmail = email.toLowerCase().trim();

    if (await User.findOne({ email: normEmail }))
      return res.status(409).json({ error: 'An account with this email already exists.' });
    if (await User.findOne({ phone: phone.trim() }))
      return res.status(409).json({ error: 'An account with this phone number already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);

    // Upsert pending record (handles re-registrations before expiry)
    await PendingUser.findOneAndDelete({ email: normEmail });
    await PendingUser.create({ email: normEmail, phone: phone.trim(), passwordHash });

    // Generate and send both OTPs concurrently
    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();

    await Promise.all([
      storeOtp(normEmail, 'email', emailOtp),
      storeOtp(phone.trim(), 'phone', phoneOtp),
    ]);

    // Send — run concurrently, report individual failures clearly
    const results = await Promise.allSettled([
      sendEmailOtp(normEmail, emailOtp),
      sendPhoneOtp(phone.trim(), phoneOtp),
    ]);

    const emailFailed = results[0].status === 'rejected';
    const phoneFailed = results[1].status === 'rejected';

    if (emailFailed || phoneFailed) {
      const failed = [emailFailed && 'email', phoneFailed && 'SMS'].filter(Boolean).join(' and ');
      console.error('OTP send failures:', results.map(r => r.reason?.message));
      return res.status(502).json({
        error: `Could not send verification code via ${failed}. Check your details and try again.`,
      });
    }

    res.status(200).json({ message: 'Verification codes sent to your email and phone.' });
  } catch (err) {
    if (err.code === 11000) {
      const field = err.keyPattern?.phone ? 'phone number' : 'email';
      return res.status(409).json({ error: `An account with this ${field} already exists.` });
    }
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(' ');
      return res.status(400).json({ error: msg });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Step 2 — Verify OTPs and create account
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, emailOtp, phoneOtp } = req.body;
    if (!email || !emailOtp || !phoneOtp)
      return res.status(400).json({ error: 'Email and both verification codes are required.' });

    const normEmail = email.toLowerCase().trim();

    const pending = await PendingUser.findOne({ email: normEmail });
    if (!pending)
      return res.status(400).json({ error: 'No pending registration found. Please register again.' });

    // Verify email OTP
    const emailResult = await verifyOtp(normEmail, 'email', emailOtp.trim());
    if (!emailResult.ok)
      return res.status(400).json({ error: `Email code: ${emailResult.error}`, field: 'emailOtp' });

    // Verify phone OTP
    const phoneResult = await verifyOtp(pending.phone, 'phone', phoneOtp.trim());
    if (!phoneResult.ok)
      return res.status(400).json({ error: `SMS code: ${phoneResult.error}`, field: 'phoneOtp' });

    // Both verified — create the real user
    // Guard against race condition (duplicate register attempts)
    if (await User.findOne({ email: normEmail }))
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = await User.create({
      email: normEmail,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      emailVerified: true,
      phoneVerified: true,
    });

    await PendingUser.deleteOne({ email: normEmail });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, phone: user.phone } });
  } catch (err) {
    if (err.code === 11000) {
      const field = err.keyPattern?.phone ? 'phone number' : 'email';
      return res.status(409).json({ error: `An account with this ${field} already exists.` });
    }
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Step 3 — Resend one OTP (email or phone)
app.post('/auth/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'email' | 'phone'
    if (!email || !['email', 'phone'].includes(type))
      return res.status(400).json({ error: 'Invalid request.' });

    const normEmail = email.toLowerCase().trim();
    const pending = await PendingUser.findOne({ email: normEmail });
    if (!pending)
      return res.status(400).json({ error: 'No pending registration found. Please register again.' });

    const otp = generateOtp();

    if (type === 'email') {
      await storeOtp(normEmail, 'email', otp);
      await sendEmailOtp(normEmail, otp);
    } else {
      await storeOtp(pending.phone, 'phone', otp);
      await sendPhoneOtp(pending.phone, otp);
    }

    res.json({ message: `A new code has been sent to your ${type === 'email' ? 'email' : 'phone'}.` });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Could not resend code. Please try again.' });
  }
});

// ── Login ──
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

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
