import { useState, useEffect } from "react";
import { DEFAULT_COUNTRY } from "../utils/constants";
import { isValidEmail, isValidLocalNumber, buildE164 } from "../utils/validators";
import { API_BASE, setToken } from "../utils/api";
import PhoneInput from "./PhoneInput";
import OtpInput from "./OtpInput";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [regCountry, setRegCountry]   = useState(DEFAULT_COUNTRY);
  const [regLocalPhone, setRegLocalPhone] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpErrors, setOtpErrors] = useState({});

  const [login2faEmail, setLogin2faEmail] = useState("");
  const [loginOtp,  setLoginOtp]  = useState("");
  const [loginOtpError, setLoginOtpError] = useState(null);

  const [resendCooldown, setResendCooldown] = useState({ email: 0, phone: 0, login: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((c) => ({
        email: c.email > 0 ? c.email - 1 : 0,
        phone: c.phone > 0 ? c.phone - 1 : 0,
        login: c.login > 0 ? c.login - 1 : 0,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: null }));
  };

  const validateRegisterFields = () => {
    const errs = {};
    if (!isValidEmail(form.email))            errs.email           = "Enter a valid email address.";
    if (!isValidLocalNumber(regLocalPhone))   errs.phone           = "Enter a valid phone number (6–13 digits).";
    if (form.password.length < 8)             errs.password        = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    return errs;
  };

  const handleRegister = async () => {
    setError(null);
    if (!form.email.trim() || !regLocalPhone.trim() || !form.password) {
      setError("All fields are required."); return;
    }
    const errs = validateRegisterFields();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    const e164Phone = buildE164(regCountry.code, regLocalPhone);
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), phone: e164Phone, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setPendingEmail(form.email.trim());
      setResendCooldown((c) => ({ ...c, email: 60, phone: 60 }));
      setMode("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null); setOtpErrors({});
    const cleanEmail = emailOtp.replace(/\s/g, "");
    const cleanPhone = phoneOtp.replace(/\s/g, "");
    if (cleanEmail.length < 6 || cleanPhone.length < 6) {
      setError("Enter all 6 digits of both codes."); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, emailOtp: cleanEmail, phoneOtp: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field === "emailOtp") setOtpErrors({ emailOtp: data.error });
        else if (data.field === "phoneOtp") setOtpErrors({ phoneOtp: data.error });
        else setError(data.error || "Verification failed.");
        return;
      }
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    if (!form.email.trim() || !form.password) {
      setError("Email and password are required."); return;
    }
    if (!isValidEmail(form.email)) {
      setFieldErrors({ email: "Enter a valid email address." }); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      setLogin2faEmail(data.email);
      setResendCooldown((c) => ({ ...c, login: 60 }));
      setMode("login2fa");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin2fa = async () => {
    setLoginOtpError(null);
    const clean = loginOtp.replace(/\s/g, "");
    if (clean.length < 6) { setLoginOtpError("Enter all 6 digits."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/auth/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login2faEmail, otp: clean }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginOtpError(data.error || "Verification failed."); return; }
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setLoginOtpError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLogin = async () => {
    if (resendCooldown.login > 0) return;
    setError(null); setSuccess(null);
    try {
      const res  = await fetch(`${API_BASE}/auth/login-resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login2faEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend code.");
      setSuccess(data.message);
      setResendCooldown((c) => ({ ...c, login: 60 }));
      setLoginOtp("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResend = async (type) => {
    if (resendCooldown[type] > 0) return;
    setError(null); setSuccess(null);
    try {
      const res  = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend code.");
      setSuccess(data.message);
      setResendCooldown((c) => ({ ...c, [type]: 60 }));
      if (type === "email") setEmailOtp(""); else setPhoneOtp("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (mode === "register") handleRegister();
    }
  };

  const switchMode = (next) => {
    setMode(next); setError(null); setSuccess(null);
    setFieldErrors({}); setOtpErrors({});
    setForm({ email: "", password: "", confirmPassword: "" });
    setRegLocalPhone(""); setRegCountry(DEFAULT_COUNTRY);
    setEmailOtp(""); setPhoneOtp(""); setLoginOtp("");
    setLoginOtpError(null);
  };

  if (mode === "login2fa") {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2>Check Your Email</h2>
          <p className="auth-subtitle">
            A sign-in code was sent to <strong>{login2faEmail}</strong>. Enter it below to continue.
          </p>

          {error   && <p className="error">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <div className="form-group" onKeyDown={(e) => { if (e.key === "Enter") handleLogin2fa(); }}>
            <label>Sign-in verification code</label>
            <OtpInput value={loginOtp} onChange={setLoginOtp} hasError={!!loginOtpError} />
            {loginOtpError && <span className="field-error">{loginOtpError}</span>}
            <button
              className="link-btn resend-btn"
              onClick={handleResendLogin}
              disabled={resendCooldown.login > 0}
            >
              {resendCooldown.login > 0
                ? `Resend code (${resendCooldown.login}s)`
                : "Resend code"}
            </button>
          </div>

          <button className="btn-primary auth-btn" onClick={handleLogin2fa} disabled={loading}>
            {loading ? "Verifying..." : "Confirm Sign In"}
          </button>

          <p className="auth-switch">
            Wrong account?{" "}
            <button className="link-btn" onClick={() => switchMode("login")}>Go back</button>
          </p>
        </div>
      </div>
    );
  }

  if (mode === "verify") {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2>Verify Your Identity</h2>
          <p className="auth-subtitle">
            Codes sent to <strong>{pendingEmail}</strong> and your phone.
          </p>

          {error   && <p className="error">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <div className="form-group">
            <label>Email verification code</label>
            <OtpInput value={emailOtp} onChange={setEmailOtp} hasError={!!otpErrors.emailOtp} />
            {otpErrors.emailOtp && <span className="field-error">{otpErrors.emailOtp}</span>}
            <button className="link-btn resend-btn" onClick={() => handleResend("email")} disabled={resendCooldown.email > 0}>
              {resendCooldown.email > 0 ? `Resend email code (${resendCooldown.email}s)` : "Resend email code"}
            </button>
          </div>

          <div className="form-group">
            <label>SMS verification code</label>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} hasError={!!otpErrors.phoneOtp} />
            {otpErrors.phoneOtp && <span className="field-error">{otpErrors.phoneOtp}</span>}
            <button className="link-btn resend-btn" onClick={() => handleResend("phone")} disabled={resendCooldown.phone > 0}>
              {resendCooldown.phone > 0 ? `Resend SMS code (${resendCooldown.phone}s)` : "Resend SMS code"}
            </button>
          </div>

          <button className="btn-primary auth-btn" onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify and Create Account"}
          </button>

          <p className="auth-switch">
            Wrong details?{" "}
            <button className="link-btn" onClick={() => switchMode("register")}>Go back</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Student Registry</h2>
        <p className="auth-subtitle">
          {mode === "login" ? "Sign in to your account" : "Create a new account"}
        </p>

        {error && <p className="error">{error}</p>}

        <div className="form-group">
          <label>Email address</label>
          <input
            type="email" value={form.email} onChange={setField("email")}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (form.email && !isValidEmail(form.email))
                setFieldErrors((fe) => ({ ...fe, email: "Enter a valid email address." }));
            }}
            placeholder="you@example.com" autoComplete="email"
            className={fieldErrors.email ? "input-error" : ""}
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </div>

        {mode === "register" && (
          <div className="form-group">
            <label>Phone number</label>
            <PhoneInput
              countryCode={regCountry}
              onCountryChange={(c) => { setRegCountry(c); setFieldErrors((fe) => ({ ...fe, phone: null })); }}
              localNumber={regLocalPhone}
              onNumberChange={(v) => { setRegLocalPhone(v); setFieldErrors((fe) => ({ ...fe, phone: null })); }}
              hasError={!!fieldErrors.phone}
              placeholder="98765 43210"
            />
            {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
          </div>
        )}

        <div className="form-group">
          <label>Password</label>
          <input
            type="password" value={form.password} onChange={setField("password")}
            onKeyDown={handleKeyDown}
            placeholder={mode === "register" ? "Min. 8 characters" : "Your password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={fieldErrors.password ? "input-error" : ""}
          />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </div>

        {mode === "register" && (
          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password" value={form.confirmPassword} onChange={setField("confirmPassword")}
              onKeyDown={handleKeyDown}
              placeholder="Repeat password" autoComplete="new-password"
              className={fieldErrors.confirmPassword ? "input-error" : ""}
            />
            {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
          </div>
        )}

        <button
          className="btn-primary auth-btn"
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Send Verification Codes"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button className="link-btn" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}