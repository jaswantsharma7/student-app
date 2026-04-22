import "./App.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import { COURSES, COUNTRY_CODES, DEFAULT_COUNTRY, SEARCH_FIELDS } from "./utils/constants";
import { isValidEmail, isValidLocalNumber, isValidRollNo, buildE164 } from "./utils/validators";
import { authFetch, getToken, clearToken } from "./utils/api";
import AuthPage from "./components/AuthPage";
import SearchBar from "./components/SearchBar";
import PhoneInput from "./components/PhoneInput";

export default function StudentApp() {
  const [user,         setUser]         = useState(null);
  const [authChecked,  setAuthChecked]  = useState(false);
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [form, setForm] = useState({
    name: "", age: "", course: "", rollno: "", university: "", email: "", address: "",
  });
  const [stuCountry,   setStuCountry]   = useState(DEFAULT_COUNTRY);
  const [stuLocalPhone,setStuLocalPhone]= useState("");

  const [activeTab,       setActiveTab]       = useState("list");
  const [editingStudent,  setEditingStudent]  = useState(null);
  const [formErrors,      setFormErrors]      = useState({});

  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchField,   setSearchField]   = useState("all");

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    authFetch("/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.user) setUser(data.user); else clearToken(); })
      .catch(() => clearToken())
      .finally(() => setAuthChecked(true));
  }, []);

  const handleLogout = useCallback(() => {
    clearToken(); setUser(null); setStudents([]);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await authFetch("/students");
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to fetch students");
      setStudents(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => { if (user) fetchStudents(); }, [user, fetchStudents]);

  const resetForm = () => {
    setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", address: "" });
    setStuCountry(DEFAULT_COUNTRY); setStuLocalPhone(""); setFormErrors({});
  };

  const validateStudentForm = () => {
    const errs = {};
    if (!form.name.trim())                                              errs.name       = "Name is required.";
    if (!form.age || isNaN(form.age) || Number(form.age) < 1 || Number(form.age) > 120) errs.age = "Enter a valid age (1–120).";
    if (!form.course)                                                   errs.course     = "Select a course.";
    if (!isValidRollNo(form.rollno))                                    errs.rollno     = "Roll number must be 2–20 alphanumeric characters.";
    if (!form.university.trim())                                        errs.university = "University is required.";
    if (!isValidEmail(form.email))                                      errs.email      = "Enter a valid email address.";
    if (!isValidLocalNumber(stuLocalPhone))                             errs.phone      = "Enter a valid phone number.";
    if (!form.address.trim())                                           errs.address    = "Address is required.";
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add student");
      }
      const newStudent = await res.json().catch(() => ({}));
      setStudents((prev) => [newStudent, ...prev]);
      await fetchStudents();
      resetForm(); setActiveTab("list");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    if (!id) { setError("Invalid student ID."); return; }
    try {
      const res  = await authFetch(`/students/${id}`, { method: "DELETE" });
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
    const phone  = student.phone || "";
    let matchedCountry = DEFAULT_COUNTRY;
    let local = phone;
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
    setStuCountry(matchedCountry); setStuLocalPhone(local);
    setActiveTab("add"); setError(null);
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update student");
      }
      const updatedStudent = await res.json();
      setStudents((prev) => prev.map((s) => s._id === updatedStudent._id ? updatedStudent : s));
      setEditingStudent(null); resetForm(); setActiveTab("list");
    } catch (err) {
      setError(err.message);
    }
  };

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [field]: null }));
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      if (searchField === "all") {
        return (
          s.name?.toLowerCase().includes(q) ||
          s.course?.toLowerCase().includes(q) ||
          s.rollno?.toLowerCase().includes(q) ||
          s.university?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q) ||
          String(s.age).includes(q)
        );
      }
      const val = String(s[searchField] ?? "").toLowerCase();
      return val.includes(q);
    });
  }, [students, searchQuery, searchField]);

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
            >×</span>
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
                placeholder="e.g. Arjun Sharma" className={formErrors.name ? "input-error" : ""}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label>Age</label>
              <input type="number" value={form.age} min="1" max="120" onChange={setField("age")}
                placeholder="e.g. 21" className={formErrors.age ? "input-error" : ""}
              />
              {formErrors.age && <span className="field-error">{formErrors.age}</span>}
            </div>

            <div className="form-group">
              <label>Course</label>
              <select value={form.course} onChange={setField("course")} className={formErrors.course ? "input-error" : ""}>
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
                placeholder="e.g. CS-2024-001" className={formErrors.rollno ? "input-error" : ""}
              />
              {formErrors.rollno && <span className="field-error">{formErrors.rollno}</span>}
            </div>

            <div className="form-group span-2">
              <label>University</label>
              <input type="text" value={form.university} onChange={setField("university")}
                placeholder="e.g. Delhi University" className={formErrors.university ? "input-error" : ""}
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
                placeholder="student@example.com" className={formErrors.email ? "input-error" : ""}
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
                placeholder="Full postal address" className={formErrors.address ? "input-error" : ""}
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
              {students.length === 0
                ? "No students enrolled yet."
                : filteredStudents.length === students.length
                  ? `${students.length} student${students.length === 1 ? "" : "s"} enrolled`
                  : `${filteredStudents.length} of ${students.length} students`}
            </p>
            <button className="btn-ghost btn-sm" onClick={fetchStudents}>Refresh</button>
          </div>

          {students.length > 0 && (
            <SearchBar
              query={searchQuery}
              onQuery={(q) => setSearchQuery(q)}
              filterField={searchField}
              onFilter={(f) => { setSearchField(f); setSearchQuery(""); }}
            />
          )}

          {loading ? (
            <p className="state-message">Loading students...</p>
          ) : students.length === 0 ? null : filteredStudents.length === 0 ? (
            <div className="search-empty">
              <p>No students match <strong>"{searchQuery}"</strong>{searchField !== "all" ? ` in ${SEARCH_FIELDS.find(f => f.value === searchField)?.label}` : ""}.</p>
              <button className="link-btn" onClick={() => { setSearchQuery(""); setSearchField("all"); }}>Clear search</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Age</th><th>Course</th><th>Roll No</th>
                    <th>University</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => (
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