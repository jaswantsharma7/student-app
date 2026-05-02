const { Resend } = require('resend');
const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Student Registry <student-registry@resend.dev>';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmailOtp = async (email, otp, subject, purpose) => {
  const purposeLabel = purpose || 'verification';
  const purposeTitle = purposeLabel.charAt(0).toUpperCase() + purposeLabel.slice(1);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: subject || 'Your verification code',
    text: `Your ${purposeLabel} code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 420px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #e5e5e5; border-radius: 10px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 0 0 8px;">Student Registry — ${purposeTitle}</h2>
        <p style="font-size: 13px; color: #555; margin: 0 0 24px;">Use the code below to complete your ${purposeLabel}.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #aaa; margin: 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
};

// ─── OTP storage / verification (unchanged) ───────────────────────────────────
const storeOtp = async (identifier, type, otp) => {
  const otpHash = await bcrypt.hash(otp, 8);
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

module.exports = { generateOtp, sendEmailOtp, storeOtp, verifyOtp };
