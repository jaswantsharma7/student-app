import "./App.css";
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_BASE;

const COURSES = [
  "Computer Science", "Mathematics", "Physics", "Engineering",
  "Business", "Design", "Medicine", "Law",
];

// ── Validation helpers ──
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// Align frontend validation with backend logic
const isValidPhone = (v) => {
  const clean = v.trim();
  // Ensure it has a '+' and enough digits for Twilio to actually work
  return /^\+[\d]{10,15}$/.test(clean.replace(/[\s-]/g, ""));
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
//  mode: "login" | "register" | "verify"
// ─────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpErrors, setOtpErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState({ email: 0, phone: 0 });

  // Cooldown timer
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
    if (!isValidPhone(form.phone)) errs.phone = "Enter a valid phone number with country code.";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    return errs;
  };

  // Step 1: submit registration form → sends OTPs

  
  const handleRegister = async () => {
    setError(null);
    if (!form.email.trim() || !form.phone.trim() || !form.password) {
      setError("All fields are required."); return;
    }
    const errs = validateRegisterFields();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    let sanitizedPhone = form.phone.trim().replace(/[\s-]/g, "");
    if (!sanitizedPhone.startsWith("+")) {
      sanitizedPhone = "+" + sanitizedPhone;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
        email: form.email.trim(), 
        phone: sanitizedPhone, // Send the clean version
        password: form.password 
      }),
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

  // Step 2: submit OTPs → create account
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
    setForm({ email: "", phone: "", password: "", confirmPassword: "" });
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
            Codes were sent to <strong>{pendingEmail}</strong> and your phone. Enter both below.
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
          <label>Email</label>
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
            <label>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              onBlur={() => {
                if (form.phone && !isValidPhone(form.phone))
                  setFieldErrors((fe) => ({ ...fe, phone: "Enter a valid phone number with country code." }));
              }}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              className={fieldErrors.phone ? "input-error" : ""}
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
            <label>Confirm Password</label>
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
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Sign In"
            : "Send Verification Codes"}
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
  const [form, setForm] = useState({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) fetchStudents();
  }, [user, fetchStudents]);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setStudents([]);
  };

  const resetForm = () => {
    setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });
    setFormErrors({});
  };

  const validateStudentForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.age || isNaN(form.age) || Number(form.age) < 1 || Number(form.age) > 120) errs.age = "Enter a valid age (1–120).";
    if (!form.course) errs.course = "Select a course.";
    if (!isValidRollNo(form.rollno)) errs.rollno = "Roll number must be 2–20 alphanumeric characters (hyphens and slashes allowed).";
    if (!form.university.trim()) errs.university = "University is required.";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email address.";
    if (!isValidPhone(form.phone)) errs.phone = "Enter a valid phone number with country code.";
    if (!form.address.trim()) errs.address = "Address is required.";
    return errs;
  };

  const handleSubmit = async () => {
    setError(null);
    const errs = validateStudentForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    try {
      const res = await authFetch("/students", {
        method: "POST",
        body: JSON.stringify({ ...form, age: Number(form.age) }),
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
    setForm({ name: student.name, age: student.age, course: student.course, rollno: student.rollno, university: student.university, email: student.email, phone: student.phone, address: student.address });
    setActiveTab("add");
    setError(null);
  };

  const handleUpdate = async () => {
    setError(null);
    const errs = validateStudentForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    try {
      const res = await authFetch(`/students/${editingStudent._id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, age: Number(form.age) }),
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

  if (!authChecked) return <div className="app-wrapper"><p className="state-message">Loading...</p></div>;
  if (!user) return <AuthPage onAuth={(u) => setUser(u)} />;

  return (
    <div className="app-wrapper">
      <div className="app-header">
        <h2>Student Registry</h2>
        <div className="user-bar">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      <div className="tabs">
        <button onClick={() => setActiveTab("list")} disabled={activeTab === "list"}>All Students</button>
        {" "}
        <button
          onClick={() => { setEditingStudent(null); resetForm(); setActiveTab("add"); }}
          disabled={activeTab === "add" && !editingStudent}
        >
          Add Student
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {activeTab === "add" && (
        <div className="form-card">
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors((fe) => ({ ...fe, name: null })); }}
              placeholder="Full name"
              className={formErrors.name ? "input-error" : ""}
            />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>Age</label>
            <input type="number" value={form.age} min="1" max="120"
              onChange={(e) => { setForm({ ...form, age: e.target.value }); setFormErrors((fe) => ({ ...fe, age: null })); }}
              placeholder="Age"
              className={formErrors.age ? "input-error" : ""}
            />
            {formErrors.age && <span className="field-error">{formErrors.age}</span>}
          </div>

          <div className="form-group">
            <label>Course</label>
            <select value={form.course}
              onChange={(e) => { setForm({ ...form, course: e.target.value }); setFormErrors((fe) => ({ ...fe, course: null })); }}
              className={formErrors.course ? "input-error" : ""}
            >
              <option value="">Select a course</option>
              {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {formErrors.course && <span className="field-error">{formErrors.course}</span>}
          </div>

          <div className="form-group">
            <label>Roll No</label>
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

          <div className="form-group">
            <label>University</label>
            <input type="text" value={form.university}
              onChange={(e) => { setForm({ ...form, university: e.target.value }); setFormErrors((fe) => ({ ...fe, university: null })); }}
              placeholder="University name"
              className={formErrors.university ? "input-error" : ""}
            />
            {formErrors.university && <span className="field-error">{formErrors.university}</span>}
          </div>

          <div className="form-group">
            <label>Email</label>
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
            <input type="tel" value={form.phone}
              onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFormErrors((fe) => ({ ...fe, phone: null })); }}
              onBlur={() => {
                if (form.phone && !isValidPhone(form.phone))
                  setFormErrors((fe) => ({ ...fe, phone: "Enter a valid phone number with country code." }));
              }}
              placeholder="+91 98765 43210"
              className={formErrors.phone ? "input-error" : ""}
            />
            {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <input type="text" value={form.address}
              onChange={(e) => { setForm({ ...form, address: e.target.value }); setFormErrors((fe) => ({ ...fe, address: null })); }}
              placeholder="Full address"
              className={formErrors.address ? "input-error" : ""}
            />
            {formErrors.address && <span className="field-error">{formErrors.address}</span>}
          </div>

          <button className="btn-primary" onClick={editingStudent ? handleUpdate : handleSubmit}>
            {editingStudent ? "Update Student" : "Enroll Student"}
          </button>
        </div>
      )}

      {activeTab === "list" && (
        <div>
          <button className="btn-secondary" onClick={fetchStudents}>Refresh</button>
          {loading ? (
            <p className="state-message">Loading...</p>
          ) : students.length === 0 ? (
            <p className="state-message">No students enrolled yet.</p>
          ) : (
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id || i}>
                      <td>{i + 1}</td>
                      <td>{s.name}</td>
                      <td>{s.age}</td>
                      <td>{s.course}</td>
                      <td>{s.rollno}</td>
                      <td>{s.university}</td>
                      <td>{s.email}</td>
                      <td>{s.phone}</td>
                      <td>{s.address}</td>
                      <td>
                        <button className="btn-edit" onClick={() => handleEdit(s)}>Edit</button>
                        {" "}
                        <button className="btn-delete" onClick={() => handleDelete(s._id)}>Delete</button>
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
