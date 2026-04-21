import "./App.css";
import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL;

const COURSES = [
  "Computer Science", "Mathematics", "Physics", "Engineering",
  "Business", "Design", "Medicine", "Law",
];

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
//  AUTH FORMS
// ─────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "register") {
      if (!form.phone.trim()) { setError("Phone number is required."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email.trim(), password: form.password }
        : { email: form.email.trim(), phone: form.phone.trim(), password: form.password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");

      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setForm({ email: "", phone: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Student Registry</h2>
        <p className="auth-subtitle">{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>

        {error && <p className="error">{error}</p>}

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
        </div>

        {mode === "register" && (
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" autoComplete="tel" />
          </div>
        )}

        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder={mode === "register" ? "Min. 8 characters" : "Your password"} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>

        {mode === "register" && (
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" autoComplete="new-password" />
          </div>
        )}

        <button className="btn-primary auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button className="link-btn" onClick={switchMode}>
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
  const [user, setUser] = useState(null);       // null = not checked yet
  const [authChecked, setAuthChecked] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });
  const [activeTab, setActiveTab] = useState("list");
  const [editingStudent, setEditingStudent] = useState(null);

  // On mount: verify stored token
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

  const handleAuth = (userData) => setUser(userData);

  const resetForm = () => setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.age || !form.course || !form.rollno.trim() || !form.university.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("All fields are required."); return;
    }
    setError(null);
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
    if (!form.name.trim() || !form.age || !form.course || !form.rollno.trim() || !form.university.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("All fields are required."); return;
    }
    setError(null);
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

  // ── Render guards ──
  if (!authChecked) return <div className="app-wrapper"><p className="state-message">Loading...</p></div>;
  if (!user) return <AuthPage onAuth={handleAuth} />;

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
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" />
          </div>
          <div className="form-group">
            <label>Course</label>
            <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">Select a course</option>
              {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Roll No</label>
            <input type="text" value={form.rollno} onChange={(e) => setForm({ ...form, rollno: e.target.value })} placeholder="Roll number" />
          </div>
          <div className="form-group">
            <label>University</label>
            <input type="text" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="University" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          </div>
          <div className="form-group full-width">
            <label>Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
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
