const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const normalisePhone = require('../services/phoneNormalizer');
const { generateOtp, sendEmailOtp, storeOtp, verifyOtp } = require('../services/otpService');

exports.register = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password)
      return res.status(400).json({ error: 'Email, phone, and password are required.' });
    if (typeof password !== 'string' || password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const normEmail = email.toLowerCase().trim();
    const normPhone = normalisePhone(phone);

    if (await User.findOne({ email: normEmail }))
      return res.status(409).json({ error: 'An account with this email already exists.' });
    if (await User.findOne({ phone: normPhone }))
      return res.status(409).json({ error: 'An account with this phone number already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);

    await PendingUser.findOneAndUpdate(
      { email: normEmail },
      {
        $set: {
          email: normEmail,
          phone: normPhone,
          passwordHash,
          emailVerified: false,
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const emailOtp = generateOtp();
    await storeOtp(normEmail, 'email', emailOtp);

    try {
      await sendEmailOtp(normEmail, emailOtp, 'Your email verification code', 'email verification');
    } catch (sendErr) {
      console.error('OTP send failure:', sendErr);
      return res.status(502).json({
        error: 'Could not send verification code via email. Check your details and try again.',
      });
    }

    res.status(200).json({ message: 'Verification code sent to your email.' });
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
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, emailOtp } = req.body;
    if (!email || !emailOtp)
      return res.status(400).json({ error: 'Email and verification code are required.' });

    const normEmail = email.toLowerCase().trim();
    const pending = await PendingUser.findOne({ email: normEmail });
    if (!pending)
      return res.status(400).json({ error: 'No pending registration found. Please register again.' });

    const emailResult = await verifyOtp(normEmail, 'email', emailOtp.trim());
    if (!emailResult.ok)
      return res.status(400).json({ error: `Email code: ${emailResult.error}`, field: 'emailOtp' });

    if (await User.findOne({ email: normEmail }))
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = await User.create({
      email: normEmail,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      emailVerified: true,
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
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      await bcrypt.compare(password, '$2a$12$placeholderHashToPreventTimingLeak000000000000000000000');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    const otp = generateOtp();
    await storeOtp(user.email, 'login', otp);
    await sendEmailOtp(
      user.email,
      otp,
      'Your sign-in verification code',
      'sign-in verification'
    );

    res.json({ pending2fa: true, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

exports.loginVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: 'Email and verification code are required.' });

    const normEmail = email.toLowerCase().trim();
    const result = await verifyOtp(normEmail, 'login', otp.trim());
    if (!result.ok)
      return res.status(400).json({ error: result.error });

    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('Login verify error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || type !== 'email')
      return res.status(400).json({ error: 'Invalid request.' });

    const normEmail = email.toLowerCase().trim();
    const pending = await PendingUser.findOne({ email: normEmail });
    if (!pending)
      return res.status(400).json({ error: 'No pending registration found. Please register again.' });

    const otp = generateOtp();
    await storeOtp(normEmail, 'email', otp);
    await sendEmailOtp(normEmail, otp, 'Your email verification code', 'email verification');

    res.json({ message: 'A new code has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Could not resend code. Please try again.' });
  }
};

exports.loginResend = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const normEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normEmail });
    if (user) {
      const otp = generateOtp();
      await storeOtp(normEmail, 'login', otp);
      await sendEmailOtp(normEmail, otp, 'Your sign-in verification code', 'sign-in verification');
    }

    res.json({ message: 'A new sign-in code has been sent to your email.' });
  } catch (err) {
    console.error('Login resend error:', err);
    res.status(500).json({ error: 'Could not resend code. Please try again.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('email phone');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user._id, email: user.email, phone: user.phone } });
  } catch {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
};