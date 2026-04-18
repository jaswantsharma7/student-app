import "./App.css";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

const COURSES = ["Computer Science", "Mathematics", "Physics", "Engineering", "Business", "Design", "Medicine", "Law"];
const BRANCHES = ["Software", "Hardware", "AI", "Data Science", "Mechanical", "Civil", "Electrical", "Chemical"];

export default function StudentApp() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", course: "", branch: "", domain: "", rollno: "", university: "", email: "", phone: "", address: "" });
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.age || !form.course || !form.branch.trim() || !form.domain.trim() || !form.rollno.trim() || !form.university.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("All fields are required.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      if (!res.ok) throw new Error("Failed to add student");
      const newStudent = await res.json();
      setStudents((prev) => [newStudent, ...prev]);
      setForm({ name: "", age: "", course: "", branch: "", domain: "", rollno: "", university: "", email: "", phone: "", address: "" });
      setActiveTab("list");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-wrapper">


      <h2>Student Registry</h2>

      <div className="tabs">
        <button onClick={() => setActiveTab("list")} disabled={activeTab === "list"}>All Students</button>
        {" "}
        <button onClick={() => setActiveTab("add")} disabled={activeTab === "add"}>Add Student</button>
      </div>

      {error && <p className="error">{error}</p>}

      {activeTab === "add" && (

        <div className="form-card">

          <div className="form-group">
            <label>Name: </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label>Age: </label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="Age"
            />
          </div>

          <div className="form-group">
            <label>Course: </label>
            <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">Select a course</option>
              {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Branch: </label>
            <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
              <option value="">Select a branch</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Domain: </label>
            <input
              type="text"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="Domain"
            />
          </div>

          <div className="form-group">
            <label>Roll no: </label>
            <input
              type="text"
              value={form.rollno}
              onChange={(e) => setForm({ ...form, rollno: e.target.value })}
              placeholder="Roll number"
            />
          </div>

          <div className="form-group">
            <label>University: </label>
            <input
              type="text"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              placeholder="University"
            />
          </div>

          <div className="form-group">
            <label>Email: </label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
            />
          </div>

          <div className="form-group">
            <label>Phone Number: </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>

          <div className="form-group full-width">
            <label>Address: </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Address"
            />
          </div>
          
          <button className="btn-primary" onClick={handleSubmit}>
            Enroll Student
          </button>
        </div>

      )}

      {activeTab === "list" && (

        <div>
          <button className="btn-secondary" onClick={fetchStudents}>
            Refresh
          </button>
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
                  <th>Branch</th>
                  <th>Domain</th>
                  <th>Roll No</th>
                  <th>University</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id || i}>
                    <td>{i + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.age}</td>
                    <td>{s.course}</td>
                    <td>{s.branch}</td>
                    <td>{s.domain}</td>
                    <td>{s.rollno}</td>
                    <td>{s.university}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>{s.address}</td>
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
