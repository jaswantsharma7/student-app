import "./App.css";
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_URL;

const COURSES = [
  "Computer Science", "Mathematics", "Physics", "Engineering",
  "Business", "Design", "Medicine", "Law",
];

// ── Country codes ──
const COUNTRY_CODES = [
  { code: "+91", iso: "IN", name: "India", flag: "🇮🇳" },
  { code: "+1", iso: "US", name: "United States", flag: "🇺🇸" },
  { code: "+44", iso: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", iso: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "+1", iso: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "+86", iso: "CN", name: "China", flag: "🇨🇳" },
  { code: "+33", iso: "FR", name: "France", flag: "🇫🇷" },
  { code: "+49", iso: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "+81", iso: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "+82", iso: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "+55", iso: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "+7", iso: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "+27", iso: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "+52", iso: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "+62", iso: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "+92", iso: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "+880", iso: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+234", iso: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "+20", iso: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "+34", iso: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "+39", iso: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "+31", iso: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "+46", iso: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "+47", iso: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "+45", iso: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "+358", iso: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "+41", iso: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "+43", iso: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "+32", iso: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "+351", iso: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "+48", iso: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "+380", iso: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "+90", iso: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "+966", iso: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", iso: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "+972", iso: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "+65", iso: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "+60", iso: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "+66", iso: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "+84", iso: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "+63", iso: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "+94", iso: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", iso: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "+98", iso: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "+964", iso: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "+254", iso: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "+233", iso: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "+251", iso: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "+255", iso: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "+213", iso: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "+212", iso: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "+216", iso: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "+64", iso: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "+54", iso: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "+56", iso: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "+57", iso: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "+51", iso: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "+58", iso: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "+593", iso: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "+502", iso: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "+503", iso: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "+504", iso: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "+505", iso: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "+506", iso: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+507", iso: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "+53", iso: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "+1-876", iso: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "+30", iso: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "+36", iso: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "+420", iso: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "+421", iso: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "+40", iso: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "+359", iso: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "+385", iso: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "+381", iso: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "+370", iso: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "+371", iso: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "+372", iso: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "+353", iso: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "+354", iso: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "+352", iso: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "+356", iso: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "+357", iso: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "+850", iso: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "+886", iso: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "+852", iso: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "+853", iso: "MO", name: "Macau", flag: "🇲🇴" },
  { code: "+976", iso: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "+855", iso: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "+856", iso: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "+95", iso: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "+673", iso: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "+670", iso: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "+679", iso: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "+675", iso: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+677", iso: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "+93", iso: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "+374", iso: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "+994", iso: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "+375", iso: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "+995", iso: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "+7", iso: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "+996", iso: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+998", iso: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "+992", iso: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "+993", iso: "TM", name: "Turkmenistan", flag: "🇹🇲" },
];

// Default: India +91
const DEFAULT_COUNTRY = COUNTRY_CODES[0];

// ── Phone state helper ──
// Returns E.164: countryCode + localNumber (digits only)
const buildE164 = (countryCode, localNumber) => {
  const digits = localNumber.replace(/\D/g, "");
  return `${countryCode}${digits}`;
};

// ── Validation helpers ──
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const isValidLocalNumber = (v) => {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 13;
};

const isValidRollNo = (v) => /^[A-Za-z0-9\-/]{2,20}$/.test(v.trim());

// ── Token helpers ──
const getToken = () => localStorage.getItem("auth_token");
const setToken = (t) => localStorage.setItem("auth_token", t);
const clearToken = () => localStorage.removeItem("auth_token");

// ── Authenticated fetch ──
const authFetch = (path, options = {}) => {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};

// ─────────────────────────────────────────
//  COUNTRY CODE SELECTOR
// ─────────────────────────────────────────
function CountryCodeSelector({ value, onChange, hasError }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const selected = COUNTRY_CODES.find(
    (c) => c.iso === value.iso && c.code === value.code
  ) || DEFAULT_COUNTRY;

  const filtered = COUNTRY_CODES.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.code.includes(q)
    );
  });

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`country-selector${hasError ? " input-error" : ""}`} ref={dropdownRef}>
      <button
        type="button"
        className="country-trigger"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="country-flag">{selected.flag}</span>
        <span className="country-code-label">{selected.code}</span>
        <span className="country-iso">{selected.iso}</span>
        <svg className={`chevron${open ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="country-dropdown" role="listbox">
          <div className="country-search-wrap">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.3"/>
              <path d="M9.5 9.5l2.5 2.5" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="country-search"
            />
          </div>
          <div className="country-list">
            {filtered.length === 0 ? (
              <div className="country-empty">No results found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={`${c.iso}-${c.code}`}
                  type="button"
                  role="option"
                  aria-selected={c.iso === selected.iso && c.code === selected.code}
                  className={`country-option${c.iso === selected.iso && c.code === selected.code ? " selected" : ""}`}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="country-flag">{c.flag}</span>
                  <span className="country-name">{c.name}</span>
                  <span className="country-opt-meta">{c.iso} {c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
//  PHONE INPUT — country selector + number
// ─────────────────────────────────────────
function PhoneInput({ countryCode, onCountryChange, localNumber, onNumberChange, hasError, placeholder }) {
  return (
    <div className={`phone-input-row${hasError ? " has-error" : ""}`}>
      <CountryCodeSelector value={countryCode} onChange={onCountryChange} hasError={hasError} />
      <input
        type="tel"
        value={localNumber}
        onChange={(e) => onNumberChange(e.target.value)}
        placeholder={placeholder || "Phone number"}
        className={`phone-number-field${hasError ? " input-error" : ""}`}
        autoComplete="tel-national"
      />
    </div>
  );
}

// ─────────────────────────────────────────
//  OTP INPUT — 6 individual digit boxes
// ─────────────────────────────────────────
function OtpInput({ value, onChange, hasError }) {
  const inputs = useRef([]);
  const digits = (value || "      ").split("").concat(Array(6).fill(" ")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[i] && arr[i].trim()) {
        arr[i] = "";
        onChange(arr.join(""));
      } else if (i > 0) {
        arr[i - 1] = "";
        onChange(arr.join(""));
        inputs.current[i - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && i > 0) { inputs.current[i - 1]?.focus(); return; }
    if (e.key === "ArrowRight" && i < 5) { inputs.current[i + 1]?.focus(); return; }
  };

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const arr = value.split("").concat(Array(6).fill("")).slice(0, 6);
    arr[i] = char;
    onChange(arr.join(""));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    const nextFocus = Math.min(pasted.length, 5);
    inputs.current[nextFocus]?.focus();
  };

  return (
    <div className="otp-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`otp-box${hasError ? " input-error" : ""}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
//  AUTH PAGE
// ─────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  // Separate phone state
  const [regCountry, setRegCountry] = useState(DEFAULT_COUNTRY);
  const [regLocalPhone, setRegLocalPhone] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpErrors, setOtpErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState({ email: 0, phone: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((c) => ({
        email: c.email > 0 ? c.email - 1 : 0,
        phone: c.phone > 0 ? c.phone - 1 : 0,
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
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address.";
    if (!isValidLocalNumber(regLocalPhone)) errs.phone = "Enter a valid phone number (digits only).";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
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
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), phone: e164Phone, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setPendingEmail(form.email.trim());
      setResendCooldown({ email: 60, phone: 60 });
      setMode("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setOtpErrors({});
    const cleanEmail = emailOtp.replace(/\s/g, "");
    const cleanPhone = phoneOtp.replace(/\s/g, "");
    if (cleanEmail.length < 6 || cleanPhone.length < 6) {
      setError("Enter all 6 digits of both codes."); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (type) => {
    if (resendCooldown[type] > 0) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend code.");
      setSuccess(data.message);
      setResendCooldown((c) => ({ ...c, [type]: 60 }));
      if (type === "email") setEmailOtp("");
      else setPhoneOtp("");
    } catch (err) {
      setError(err.message);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setOtpErrors({});
    setForm({ email: "", password: "", confirmPassword: "" });
    setRegLocalPhone("");
    setRegCountry(DEFAULT_COUNTRY);
    setEmailOtp("");
    setPhoneOtp("");
  };

  // ── Verify OTP screen ──
  if (mode === "verify") {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2>Verify Your Identity</h2>
          <p className="auth-subtitle">
            Codes sent to <strong>{pendingEmail}</strong> and your phone.
          </p>

          {error && <p className="error">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <div className="form-group">
            <label>Email verification code</label>
            <OtpInput value={emailOtp} onChange={setEmailOtp} hasError={!!otpErrors.emailOtp} />
            {otpErrors.emailOtp && <span className="field-error">{otpErrors.emailOtp}</span>}
            <button
              className="link-btn resend-btn"
              onClick={() => handleResend("email")}
              disabled={resendCooldown.email > 0}
            >
              {resendCooldown.email > 0 ? `Resend email code (${resendCooldown.email}s)` : "Resend email code"}
            </button>
          </div>

          <div className="form-group">
            <label>SMS verification code</label>
            <OtpInput value={phoneOtp} onChange={setPhoneOtp} hasError={!!otpErrors.phoneOtp} />
            {otpErrors.phoneOtp && <span className="field-error">{otpErrors.phoneOtp}</span>}
            <button
              className="link-btn resend-btn"
              onClick={() => handleResend("phone")}
              disabled={resendCooldown.phone > 0}
            >
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

  // ── Login / Register screen ──
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
            type="email"
            value={form.email}
            onChange={setField("email")}
            onBlur={() => {
              if (form.email && !isValidEmail(form.email))
                setFieldErrors((fe) => ({ ...fe, email: "Enter a valid email address." }));
            }}
            placeholder="you@example.com"
            autoComplete="email"
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
            type="password"
            value={form.password}
            onChange={setField("password")}
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
              type="password"
              value={form.confirmPassword}
              onChange={setField("confirmPassword")}
              placeholder="Repeat password"
              autoComplete="new-password"
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

// ─────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────
export default function StudentApp() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student form fields
  const [form, setForm] = useState({
    name: "", age: "", course: "", rollno: "", university: "", email: "", address: "",
  });
  // Student phone — separate
  const [stuCountry, setStuCountry] = useState(DEFAULT_COUNTRY);
  const [stuLocalPhone, setStuLocalPhone] = useState("");

  const [activeTab, setActiveTab] = useState("list");
  const [editingStudent, setEditingStudent] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    authFetch("/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user) setUser(data.user);
        else clearToken();
      })
      .catch(() => clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  // Bug 1 fix: handleLogout is defined first so fetchStudents can safely
  // depend on it via useCallback without a stale-closure risk.
  const handleLogout = useCallback(() => {
    clearToken();
    setUser(null);
    setStudents([]);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/students");
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (user) fetchStudents();
  }, [user, fetchStudents]);

  const resetForm = () => {
    setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", address: "" });
    setStuCountry(DEFAULT_COUNTRY);
    setStuLocalPhone("");
    setFormErrors({});
  };

  const validateStudentForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.age || isNaN(form.age) || Number(form.age) < 1 || Number(form.age) > 120) errs.age = "Enter a valid age (1–120).";
    if (!form.course) errs.course = "Select a course.";
    if (!isValidRollNo(form.rollno)) errs.rollno = "Roll number must be 2–20 alphanumeric characters.";
    if (!form.university.trim()) errs.university = "University is required.";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address.";
    if (!isValidLocalNumber(stuLocalPhone)) errs.phone = "Enter a valid phone number.";
    if (!form.address.trim()) errs.address = "Address is required.";
    return errs;
  };

  const handleSubmit = async () => {
    setError(null);
    const errs = validateStudentForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    const e164Phone = buildE164(stuCountry.code, stuLocalPhone);
    try {
      const res = await authFetch("/students", {
        method: "POST",
        body: JSON.stringify({ ...form, age: Number(form.age), phone: e164Phone }),
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to add student");
      const newStudent = await res.json();
      setStudents((prev) => [newStudent, ...prev]);
      resetForm();
      setActiveTab("list");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    if (!id) { setError("Invalid student ID."); return; }
    try {
      const res = await authFetch(`/students/${id}`, { method: "DELETE" });
      if (res.status === 401) { handleLogout(); return; }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to delete student");
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    // Parse existing E.164 phone back to country + local
    const phone = student.phone || "";
    let matchedCountry = DEFAULT_COUNTRY;
    let local = phone;
    // Try to match stored E.164 against known codes (longest match first)
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (phone.startsWith(c.code)) {
        matchedCountry = c;
        local = phone.slice(c.code.length);
        break;
      }
    }
    setForm({
      name: student.name, age: student.age, course: student.course,
      rollno: student.rollno, university: student.university,
      email: student.email, address: student.address,
    });
    setStuCountry(matchedCountry);
    setStuLocalPhone(local);
    setActiveTab("add");
    setError(null);
  };

  const handleUpdate = async () => {
    setError(null);
    const errs = validateStudentForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    const e164Phone = buildE164(stuCountry.code, stuLocalPhone);
    try {
      const res = await authFetch(`/students/${editingStudent._id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, age: Number(form.age), phone: e164Phone }),
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to update student");
      const updatedStudent = await res.json();
      setStudents((prev) => prev.map((s) => s._id === updatedStudent._id ? updatedStudent : s));
      setEditingStudent(null);
      resetForm();
      setActiveTab("list");
    } catch (err) {
      setError(err.message);
    }
  };

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [field]: null }));
  };

  if (!authChecked) return (
    <div className="app-wrapper splash">
      <p className="state-message">Loading...</p>
    </div>
  );
  if (!user) return <AuthPage onAuth={(u) => setUser(u)} />;

  return (
    <div className="app-wrapper">
      <div className="app-header">
        <div className="app-brand">
          <h2>Student Registry</h2>
        </div>
        <div className="user-bar">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "list" ? "tab-active" : ""}
          onClick={() => setActiveTab("list")}
        >
          All Students
          {students.length > 0 && <span className="tab-count">{students.length}</span>}
        </button>
        <button
          className={activeTab === "add" && !editingStudent ? "tab-active" : ""}
          onClick={() => { setEditingStudent(null); resetForm(); setActiveTab("add"); }}
        >
          Add Student
        </button>
        {editingStudent && (
          <button className="tab-active tab-edit-indicator">
            Editing: {editingStudent.name}
            <span
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); setEditingStudent(null); resetForm(); setActiveTab("list"); }}
            >
              ×
            </span>
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {activeTab === "add" && (
        <div className="form-card">
          <div className="form-section-title">
            {editingStudent ? "Edit Student Record" : "New Student Enrollment"}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.name} onChange={setField("name")}
                placeholder="e.g. Arjun Sharma"
                className={formErrors.name ? "input-error" : ""}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label>Age</label>
              <input type="number" value={form.age} min="1" max="120"
                onChange={setField("age")}
                placeholder="e.g. 21"
                className={formErrors.age ? "input-error" : ""}
              />
              {formErrors.age && <span className="field-error">{formErrors.age}</span>}
            </div>

            <div className="form-group">
              <label>Course</label>
              <select value={form.course} onChange={setField("course")}
                className={formErrors.course ? "input-error" : ""}
              >
                <option value="">Select a course</option>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.course && <span className="field-error">{formErrors.course}</span>}
            </div>

            <div className="form-group">
              <label>Roll Number</label>
              <input type="text" value={form.rollno}
                onChange={(e) => { setForm({ ...form, rollno: e.target.value }); setFormErrors((fe) => ({ ...fe, rollno: null })); }}
                onBlur={() => {
                  if (form.rollno && !isValidRollNo(form.rollno))
                    setFormErrors((fe) => ({ ...fe, rollno: "2–20 alphanumeric characters (hyphens and slashes allowed)." }));
                }}
                placeholder="e.g. CS-2024-001"
                className={formErrors.rollno ? "input-error" : ""}
              />
              {formErrors.rollno && <span className="field-error">{formErrors.rollno}</span>}
            </div>

            <div className="form-group span-2">
              <label>University</label>
              <input type="text" value={form.university} onChange={setField("university")}
                placeholder="e.g. Delhi University"
                className={formErrors.university ? "input-error" : ""}
              />
              {formErrors.university && <span className="field-error">{formErrors.university}</span>}
            </div>

            <div className="form-group">
              <label>Student Email</label>
              <input type="email" value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormErrors((fe) => ({ ...fe, email: null })); }}
                onBlur={() => {
                  if (form.email && !isValidEmail(form.email))
                    setFormErrors((fe) => ({ ...fe, email: "Enter a valid email address." }));
                }}
                placeholder="student@example.com"
                className={formErrors.email ? "input-error" : ""}
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <PhoneInput
                countryCode={stuCountry}
                onCountryChange={(c) => { setStuCountry(c); setFormErrors((fe) => ({ ...fe, phone: null })); }}
                localNumber={stuLocalPhone}
                onNumberChange={(v) => { setStuLocalPhone(v); setFormErrors((fe) => ({ ...fe, phone: null })); }}
                hasError={!!formErrors.phone}
                placeholder="98765 43210"
              />
              {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
            </div>

            <div className="form-group span-2">
              <label>Address</label>
              <input type="text" value={form.address} onChange={setField("address")}
                placeholder="Full postal address"
                className={formErrors.address ? "input-error" : ""}
              />
              {formErrors.address && <span className="field-error">{formErrors.address}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-ghost" onClick={() => { resetForm(); setEditingStudent(null); setActiveTab("list"); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={editingStudent ? handleUpdate : handleSubmit}>
              {editingStudent ? "Save Changes" : "Enroll Student"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <div className="list-section">
          <div className="list-header">
            <p className="list-count">
              {students.length === 0 ? "No students enrolled yet." : `${students.length} student${students.length === 1 ? "" : "s"} enrolled`}
            </p>
            <button className="btn-ghost btn-sm" onClick={fetchStudents}>Refresh</button>
          </div>
          {loading ? (
            <p className="state-message">Loading students...</p>
          ) : students.length === 0 ? null : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Course</th>
                    <th>Roll No</th>
                    <th>University</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id || i}>
                      <td className="td-index">{i + 1}</td>
                      <td className="td-name">{s.name}</td>
                      <td>{s.age}</td>
                      <td><span className="course-pill">{s.course}</span></td>
                      <td className="td-mono">{s.rollno}</td>
                      <td>{s.university}</td>
                      <td className="td-email">{s.email}</td>
                      <td className="td-mono">{s.phone}</td>
                      <td className="td-address">{s.address}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-edit" onClick={() => handleEdit(s)}>Edit</button>
                          <button className="btn-delete" onClick={() => handleDelete(s._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}