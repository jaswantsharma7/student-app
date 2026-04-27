import "./App.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  COURSES, UG_COURSES, COUNTRY_CODES, DEFAULT_COUNTRY, SEARCH_FIELDS,
  getSemesters, getGrade, calcSGPA, calcCGPA,
} from "./utils/constants";
import { isValidEmail, isValidLocalNumber, isValidRollNo, buildE164 } from "./utils/validators";
import { authFetch, getToken, clearToken } from "./utils/api";
import AuthPage from "./components/AuthPage";
import SearchBar from "./components/SearchBar";
import PhoneInput from "./components/PhoneInput";

// ── helpers ──────────────────────────────────────────────────────────────────
const emptySubject = () => ({ name: "", marks: "" });
const buildSemesters = (count) =>
  Array.from({ length: count }, (_, i) => ({
    semNumber: i + 1,
    subjects: [emptySubject()],
  }));

function gradeColor(letter) {
  if (letter === "O" || letter === "A+") return "grade-o";
  if (letter === "A")  return "grade-a";
  if (letter === "B+" || letter === "B") return "grade-b";
  if (letter === "C" || letter === "P") return "grade-c";
  return "grade-f";
}

// ── Analytics strip ───────────────────────────────────────────────────────────
function Analytics({ students }) {
  const total = students.length;
  const courseCounts = useMemo(() => {
    const map = {};
    students.forEach((s) => { map[s.course] = (map[s.course] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [students]);

  const cgpas = students.map((s) => parseFloat(s.cgpa)).filter((v) => !isNaN(v) && v > 0);
  const avgCGPA = cgpas.length ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : "—";
  const toppers = students.filter((s) => parseFloat(s.cgpa) >= 9).length;
  const atRisk  = students.filter((s) => parseFloat(s.cgpa) > 0 && parseFloat(s.cgpa) < 5).length;

  return (
    <div className="analytics-strip">
      <div className="stat-card">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total Students</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{avgCGPA}</span>
        <span className="stat-label">Avg CGPA</span>
      </div>
      <div className="stat-card accent-green">
        <span className="stat-value">{toppers}</span>
        <span className="stat-label">Toppers (≥9.0)</span>
      </div>
      <div className="stat-card accent-red">
        <span className="stat-value">{atRisk}</span>
        <span className="stat-label">At Risk (&lt;5.0)</span>
      </div>
      <div className="stat-card wide">
        <span className="stat-label" style={{ marginBottom: 8 }}>Top Courses</span>
        {courseCounts.length === 0 ? <span className="stat-empty">—</span> : (
          <div className="course-bars">
            {courseCounts.map(([name, count]) => (
              <div key={name} className="course-bar-row">
                <span className="course-bar-name">{name.replace(/\(.*\)/, "").trim()}</span>
                <div className="course-bar-track">
                  <div className="course-bar-fill" style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="course-bar-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Student Detail Modal ───────────────────────────────────────────────────────
function StudentDetail({ student, onClose, onEdit, onDelete }) {
  const totalSems = getSemesters(student.course);
  const completedSems = (student.semesters || []).filter(
    (sem) => sem.subjects?.some((s) => s.name?.trim() && s.marks !== null && s.marks !== undefined)
  ).length;
  const allDone = completedSems >= totalSems;
  const cgpa = student.cgpa;
  const cgpaGrade = cgpa ? getGrade((cgpa / 10) * 100) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-name">{student.name}</div>
            <div className="modal-meta">
              <span className="course-pill">{student.course}</span>
              <span className="modal-roll">Roll: {student.rollno}</span>
              {cgpa && (
                <span className={`cgpa-badge ${gradeColor(cgpaGrade?.letter)}`}>
                  {allDone ? "CGPA" : "CGPA so far"}: {cgpa} ({cgpaGrade?.letter})
                </span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Info grid */}
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-info-label">Year</span>
              <span className="detail-info-value">Year {student.year}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Current Semester</span>
              <span className="detail-info-value">Semester {student.currentSem}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Email</span>
              <span className="detail-info-value mono">{student.email}</span>
            </div>
            <div className="detail-info-item">
              <span className="detail-info-label">Phone</span>
              <span className="detail-info-value mono">{student.phone}</span>
            </div>
            <div className="detail-info-item span-2">
              <span className="detail-info-label">Address</span>
              <span className="detail-info-value">{student.address}</span>
            </div>
          </div>

          {/* Academics */}
          {student.semesters?.length > 0 && (
            <div className="academics-section">
              <div className="academics-title">Academic Record</div>
              <div className="semesters-list">
                {student.semesters.map((sem) => {
                  const validSubs = (sem.subjects || []).filter(
                    (s) => s.name?.trim() && s.marks !== null && s.marks !== undefined
                  );
                  if (validSubs.length === 0) return null;
                  const sgpa = calcSGPA(sem.subjects);
                  const avg  = validSubs.reduce((a, b) => a + Number(b.marks), 0) / validSubs.length;
                  const g    = getGrade(avg);
                  return (
                    <div key={sem.semNumber} className="sem-block">
                      <div className="sem-block-header">
                        <span className="sem-block-title">Semester {sem.semNumber}</span>
                        {sgpa !== null && (
                          <span className={`sgpa-chip ${gradeColor(g.letter)}`}>
                            SGPA: {sgpa} · {g.letter} — {g.label}
                          </span>
                        )}
                      </div>
                      <div className="subjects-table">
                        <div className="subjects-thead">
                          <span>Subject</span><span>Marks (%)</span><span>Grade</span>
                        </div>
                        {validSubs.map((subj, si) => {
                          const sg = getGrade(Number(subj.marks));
                          return (
                            <div key={si} className="subjects-trow">
                              <span>{subj.name}</span>
                              <span>{subj.marks}%</span>
                              <span className={`subject-grade ${gradeColor(sg.letter)}`}>{sg.letter}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-delete" onClick={() => { onDelete(student._id); onClose(); }}>Delete</button>
          <div style={{ flex: 1 }} />
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => { onEdit(student); onClose(); }}>Edit</button>
        </div>
      </div>
    </div>
  );
}

// ── Semester Marks Builder ─────────────────────────────────────────────────────
function SemesterMarksBuilder({ semesters, onChange }) {
  const [openSem, setOpenSem] = useState(0);

  const updateSubject = (semIdx, subIdx, field, value) => {
    const next = semesters.map((sem, si) =>
      si !== semIdx ? sem : {
        ...sem,
        subjects: sem.subjects.map((sub, sj) =>
          sj !== subIdx ? sub : { ...sub, [field]: value }
        ),
      }
    );
    onChange(next);
  };

  const addSubject = (semIdx) => {
    const next = semesters.map((sem, si) =>
      si !== semIdx ? sem : { ...sem, subjects: [...sem.subjects, emptySubject()] }
    );
    onChange(next);
  };

  const removeSubject = (semIdx, subIdx) => {
    const next = semesters.map((sem, si) =>
      si !== semIdx ? sem : { ...sem, subjects: sem.subjects.filter((_, sj) => sj !== subIdx) }
    );
    onChange(next);
  };

  return (
    <div className="sem-builder">
      {semesters.map((sem, si) => {
        const sgpa = calcSGPA(sem.subjects);
        const isOpen = openSem === si;
        return (
          <div key={si} className={`sem-accordion ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="sem-accordion-header"
              onClick={() => setOpenSem(isOpen ? -1 : si)}
            >
              <span className="sem-accordion-label">Semester {sem.semNumber}</span>
              {sgpa !== null && (
                <span className="sem-sgpa-preview">SGPA: {sgpa}</span>
              )}
              <span className="sem-accordion-chevron">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="sem-accordion-body">
                {sem.subjects.map((sub, sj) => (
                  <div key={sj} className="subject-row">
                    <input
                      className="subject-name-input"
                      type="text"
                      placeholder={`Subject ${sj + 1} name`}
                      value={sub.name}
                      onChange={(e) => updateSubject(si, sj, "name", e.target.value)}
                    />
                    <input
                      className="subject-marks-input"
                      type="number"
                      placeholder="Marks %"
                      min="0"
                      max="100"
                      value={sub.marks}
                      onChange={(e) => updateSubject(si, sj, "marks", e.target.value)}
                    />
                    {sem.subjects.length > 1 && (
                      <button
                        type="button"
                        className="subject-remove-btn"
                        onClick={() => removeSubject(si, sj)}
                        title="Remove subject"
                      >✕</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-subject-btn"
                  onClick={() => addSubject(si)}
                >
                  <span className="add-subject-icon">+</span> Add Subject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function StudentApp() {
  const [user,        setUser]        = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const blankForm = {
    name: "", course: "", year: "", currentSem: "",
    rollno: "", email: "", address: "",
  };
  const [form,         setForm]         = useState(blankForm);
  const [stuCountry,   setStuCountry]   = useState(DEFAULT_COUNTRY);
  const [stuLocalPhone,setStuLocalPhone]= useState("");
  const [semesters,    setSemesters]    = useState([]);
  const [formErrors,   setFormErrors]   = useState({});

  const [activeTab,      setActiveTab]      = useState("list");
  const [editingStudent, setEditingStudent] = useState(null);
  const [detailStudent,  setDetailStudent]  = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");

  // auth check
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

  // when course changes, rebuild semester slots
  useEffect(() => {
    if (!form.course) { setSemesters([]); return; }
    const count = getSemesters(form.course);
    setSemesters((prev) => {
      // preserve existing data, add/trim to fit
      const next = buildSemesters(count);
      return next.map((ns) => {
        const existing = prev.find((p) => p.semNumber === ns.semNumber);
        return existing || ns;
      });
    });
  }, [form.course]);

  const resetForm = () => {
    setForm(blankForm);
    setStuCountry(DEFAULT_COUNTRY); setStuLocalPhone("");
    setSemesters([]); setFormErrors({}); setEditingStudent(null);
  };

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [field]: null }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())             errs.name      = "Name is required.";
    if (!form.course)                  errs.course    = "Select a course.";
    if (!form.year || isNaN(form.year) || Number(form.year) < 1 || Number(form.year) > 5)
                                       errs.year      = "Enter a valid year (1–5).";
    if (!form.currentSem || isNaN(form.currentSem) || Number(form.currentSem) < 1)
                                       errs.currentSem = "Enter a valid semester.";
    if (!isValidRollNo(form.rollno))   errs.rollno    = "Roll No: 2–30 alphanumeric chars.";
    if (!isValidEmail(form.email))     errs.email     = "Enter a valid email.";
    if (!isValidLocalNumber(stuLocalPhone)) errs.phone = "Enter a valid phone number.";
    if (!form.address.trim())          errs.address   = "Address is required.";
    return errs;
  };

  // ── build payload ─────────────────────────────────────────────────────────
  const buildPayload = () => {
    const e164 = buildE164(stuCountry.code, stuLocalPhone);
    const cleanedSems = semesters.map((sem) => ({
      semNumber: sem.semNumber,
      subjects: sem.subjects.filter((s) => s.name?.trim()),
      sgpa: calcSGPA(sem.subjects),
    }));
    const cgpa = calcCGPA(cleanedSems) || null;
    return {
      name: form.name.trim(),
      course: form.course,
      year: Number(form.year),
      currentSem: Number(form.currentSem),
      rollno: form.rollno.trim(),
      email: form.email.trim(),
      phone: e164,
      address: form.address.trim(),
      semesters: cleanedSems,
      cgpa,
    };
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({}); setError(null);
    try {
      const res = await authFetch("/students", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add student");
      }
      await fetchStudents();
      resetForm(); setActiveTab("list");
    } catch (err) { setError(err.message); }
  };

  const handleUpdate = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({}); setError(null);
    try {
      const res = await authFetch(`/students/${editingStudent._id}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload()),
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update student");
      }
      await fetchStudents();
      resetForm(); setActiveTab("list");
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    setError(null);
    try {
      const res = await authFetch(`/students/${id}`, { method: "DELETE" });
      if (res.status === 401) { handleLogout(); return; }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to delete student");
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    const phone = student.phone || "";
    let matchedCountry = DEFAULT_COUNTRY;
    let local = phone;
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (phone.startsWith(c.code)) { matchedCountry = c; local = phone.slice(c.code.length); break; }
    }
    setForm({
      name: student.name, course: student.course,
      year: student.year, currentSem: student.currentSem,
      rollno: student.rollno, email: student.email, address: student.address,
    });
    setStuCountry(matchedCountry); setStuLocalPhone(local);
    // load saved semesters
    const totalSems = getSemesters(student.course);
    const freshSlots = buildSemesters(totalSems);
    const merged = freshSlots.map((slot) => {
      const saved = (student.semesters || []).find((s) => s.semNumber === slot.semNumber);
      return saved
        ? { ...saved, subjects: saved.subjects?.length ? saved.subjects : [emptySubject()] }
        : slot;
    });
    setSemesters(merged);
    setFormErrors({}); setActiveTab("add"); setError(null);
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      if (searchField === "all") {
        return (
          s.name?.toLowerCase().includes(q) ||
          s.course?.toLowerCase().includes(q) ||
          s.rollno?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q)
        );
      }
      return String(s[searchField] ?? "").toLowerCase().includes(q);
    });
  }, [students, searchQuery, searchField]);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (!authChecked) return (
    <div className="app-wrapper splash"><p className="state-message">Loading…</p></div>
  );
  if (!user) return <AuthPage onAuth={(u) => setUser(u)} />;

  const totalSems = form.course ? getSemesters(form.course) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-wrapper">
      {/* Header */}
      <div className="app-header">
        <div className="app-brand">
          <div className="brand-icon">🎓</div>
          <div>
            <div className="brand-title">Student Management System</div>
            <div className="brand-sub">Academic Registry & Analytics</div>
          </div>
        </div>
        <div className="user-bar">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      {/* Analytics */}
      {students.length > 0 && <Analytics students={students} />}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "list" ? "tab-active" : ""}
          onClick={() => { resetForm(); setActiveTab("list"); }}
        >
          Dashboard
          {students.length > 0 && <span className="tab-count">{students.length}</span>}
        </button>
        <button
          className={activeTab === "add" && !editingStudent ? "tab-active" : ""}
          onClick={() => { resetForm(); setActiveTab("add"); }}
        >
          + Enroll Student
        </button>
        {editingStudent && (
          <button className="tab-active tab-edit-indicator">
            Editing: {editingStudent.name}
            <span className="tab-close" onClick={(e) => { e.stopPropagation(); resetForm(); setActiveTab("list"); }}>×</span>
          </button>
        )}
      </div>

      {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* ── ADD / EDIT FORM ────────────────────────────────────────────────── */}
      {activeTab === "add" && (
        <div className="form-card">
          <div className="form-section-title">
            {editingStudent ? "✏️ Edit Student Record" : "🎓 New Student Enrollment"}
          </div>

          {/* Section: Basic Info */}
          <div className="form-section-subtitle">Basic Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={setField("name")}
                placeholder="e.g. Arjun Sharma"
                className={formErrors.name ? "input-error" : ""} />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label>Course *</label>
              <select value={form.course} onChange={setField("course")}
                className={formErrors.course ? "input-error" : ""}>
                <option value="">Select a UG course</option>
                {UG_COURSES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.semesters} semesters)</option>
                ))}
              </select>
              {formErrors.course && <span className="field-error">{formErrors.course}</span>}
            </div>

            <div className="form-group">
              <label>Year *</label>
              <select value={form.year} onChange={setField("year")}
                className={formErrors.year ? "input-error" : ""}>
                <option value="">Select year</option>
                {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
              {formErrors.year && <span className="field-error">{formErrors.year}</span>}
            </div>

            <div className="form-group">
              <label>Current Semester *</label>
              <select value={form.currentSem} onChange={setField("currentSem")}
                className={formErrors.currentSem ? "input-error" : ""}
                disabled={!form.course}>
                <option value="">{form.course ? "Select semester" : "Select course first"}</option>
                {Array.from({ length: totalSems }, (_, i) => (
                  <option key={i+1} value={i+1}>Semester {i+1}</option>
                ))}
              </select>
              {formErrors.currentSem && <span className="field-error">{formErrors.currentSem}</span>}
            </div>

            <div className="form-group">
              <label>Roll Number *</label>
              <input type="text" value={form.rollno}
                onChange={(e) => { setForm((f) => ({ ...f, rollno: e.target.value })); setFormErrors((fe) => ({ ...fe, rollno: null })); }}
                onBlur={() => { if (form.rollno && !isValidRollNo(form.rollno)) setFormErrors((fe) => ({ ...fe, rollno: "2–30 alphanumeric chars." })); }}
                placeholder="e.g. CS-2024-001"
                className={formErrors.rollno ? "input-error" : ""} />
              {formErrors.rollno && <span className="field-error">{formErrors.rollno}</span>}
            </div>

            <div className="form-group">
              <label>Student Email *</label>
              <input type="email" value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFormErrors((fe) => ({ ...fe, email: null })); }}
                onBlur={() => { if (form.email && !isValidEmail(form.email)) setFormErrors((fe) => ({ ...fe, email: "Enter a valid email." })); }}
                placeholder="student@example.com"
                className={formErrors.email ? "input-error" : ""} />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
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

            <div className="form-group">
              <label>Address *</label>
              <input type="text" value={form.address} onChange={setField("address")}
                placeholder="Full postal address"
                className={formErrors.address ? "input-error" : ""} />
              {formErrors.address && <span className="field-error">{formErrors.address}</span>}
            </div>
          </div>

          {/* Section: Academic Marks */}
          {semesters.length > 0 && (
            <>
              <div className="form-section-subtitle" style={{ marginTop: 28 }}>
                Academic Marks
                <span className="section-hint">Click a semester to expand · Leave blank to skip</span>
              </div>
              <SemesterMarksBuilder semesters={semesters} onChange={setSemesters} />

              {/* Live CGPA preview */}
              {(() => {
                const cgpa = calcCGPA(semesters);
                if (!cgpa) return null;
                const g = getGrade((cgpa / 10) * 100);
                return (
                  <div className="cgpa-preview">
                    <span className="cgpa-preview-label">Current CGPA</span>
                    <span className={`cgpa-preview-value ${gradeColor(g.letter)}`}>
                      {cgpa} — {g.letter} ({g.label})
                    </span>
                  </div>
                );
              })()}
            </>
          )}

          <div className="form-actions">
            <button className="btn-ghost" onClick={() => { resetForm(); setActiveTab("list"); }}>Cancel</button>
            <button className="btn-primary" onClick={editingStudent ? handleUpdate : handleSubmit}>
              {editingStudent ? "Save Changes" : "Enroll Student"}
            </button>
          </div>
        </div>
      )}

      {/* ── DASHBOARD / LIST ───────────────────────────────────────────────── */}
      {activeTab === "list" && (
        <div className="list-section">
          <div className="list-header">
            <p className="list-count">
              {students.length === 0
                ? "No students enrolled yet."
                : filteredStudents.length === students.length
                  ? `${students.length} student${students.length !== 1 ? "s" : ""} enrolled`
                  : `${filteredStudents.length} of ${students.length} students`}
            </p>
            <button className="btn-ghost btn-sm" onClick={fetchStudents}>↺ Refresh</button>
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
            <p className="state-message">Loading students…</p>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎓</div>
              <p className="empty-title">No students yet</p>
              <p className="empty-sub">Click "Enroll Student" to get started.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="search-empty">
              <p>No students match <strong>"{searchQuery}"</strong>.</p>
              <button className="link-btn" onClick={() => { setSearchQuery(""); setSearchField("all"); }}>Clear search</button>
            </div>
          ) : (
            <div className="student-cards-grid">
              {filteredStudents.map((s, i) => {
                const cgpa = s.cgpa ? parseFloat(s.cgpa) : null;
                const g = cgpa ? getGrade((cgpa / 10) * 100) : null;
                const totalSemCount = getSemesters(s.course);
                const completedCount = (s.semesters || []).filter(
                  (sem) => sem.subjects?.some((sub) => sub.name?.trim())
                ).length;
                return (
                  <div key={s._id || i} className="student-card" onClick={() => setDetailStudent(s)}>
                    <div className="student-card-top">
                      <div className="student-card-avatar">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-card-main">
                        <div className="student-card-name">{s.name}</div>
                        <div className="student-card-roll">{s.rollno}</div>
                      </div>
                      {cgpa && (
                        <div className={`card-cgpa-badge ${gradeColor(g?.letter)}`}>
                          {cgpa}<br/><span>{g?.letter}</span>
                        </div>
                      )}
                    </div>
                    <div className="student-card-course">
                      <span className="course-pill">{s.course}</span>
                    </div>
                    <div className="student-card-footer">
                      <span className="student-card-sem">
                        Sem {s.currentSem}/{totalSemCount}
                        {completedCount > 0 && ` · ${completedCount} recorded`}
                      </span>
                      <div className="card-action-btns" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-edit" onClick={() => handleEdit(s)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(s._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {detailStudent && (
        <StudentDetail
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
          onEdit={(s) => { handleEdit(s); setDetailStudent(null); }}
          onDelete={(id) => { handleDelete(id); setDetailStudent(null); }}
        />
      )}
    </div>
  );
}