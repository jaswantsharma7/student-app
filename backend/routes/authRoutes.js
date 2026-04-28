const express = require('express');
const authController = require('../controllers/authController');
const { registerLimiter, loginLimiter, otpLimiter, resendLimiter } = require('../middlewares/rateLimiters');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerLimiter, authController.register);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/login', loginLimiter, authController.login);
router.post('/login-verify', otpLimiter, authController.loginVerify);
router.post('/resend-otp', resendLimiter, authController.resendOtp);
router.post('/login-resend', resendLimiter, authController.loginResend);
router.get('/me', authenticate, authController.getMe);

module.exports = router;