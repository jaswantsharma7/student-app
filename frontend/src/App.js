import "./App.css";
import { useState, useEffect } from "react";

const API_BASE = "https://backend-timh.onrender.com";

const COURSES = ["Computer Science", "Mathematics", "Physics", "Engineering", "Business", "Design", "Medicine", "Law"];

export default function StudentApp() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });
  const [activeTab, setActiveTab] = useState("list");
  const [editingStudent, setEditingStudent] = useState(null);

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
    if (!form.name.trim() || !form.age || !form.course || !form.rollno.trim() || !form.university.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
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
      setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });
      setActiveTab("list");
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDelete = async (id) => {
    setError(null);
    if (!id) { setError("Invalid student ID."); return; }
    console.log("Deleting student with _id:", id);
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      console.log("Delete response:", res.status, body);
      if (!res.ok) {
        throw new Error((body.error || "Failed to delete student") + " (status " + res.status + ")");
      }
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
      setError("All fields are required.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/students/${editingStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      if (!res.ok) throw new Error("Failed to update student");
      const updatedStudent = await res.json();
      setStudents((prev) => prev.map((s) => s._id === updatedStudent._id ? updatedStudent : s));
      setEditingStudent(null);
      setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" });
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
        <button onClick={() => { setEditingStudent(null); setForm({ name: "", age: "", course: "", rollno: "", university: "", email: "", phone: "", address: "" }); setActiveTab("add"); }} disabled={activeTab === "add" && !editingStudent}>Add Student</button>
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
          
          <button className="btn-primary" onClick={editingStudent ? handleUpdate : handleSubmit}>
            {editingStudent ? "Update Student" : "Enroll Student"}
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