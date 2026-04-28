import { useState, useMemo } from "react";
import SearchBar from "./SearchBar";
import StudentCard from "./StudentCard";

export default function StudentList({ students, loading, fetchStudents, setDetailStudent, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      if (searchField === "all") {
        return (
          s.name?.toLowerCase().includes(q) || s.course?.toLowerCase().includes(q) ||
          s.rollno?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.toLowerCase().includes(q)
        );
      }
      return String(s[searchField] ?? "").toLowerCase().includes(q);
    });
  }, [students, searchQuery, searchField]);

  return (
    <div className="list-section">
      <div className="list-header">
        <p className="list-count">
          {students.length === 0 ? "No students enrolled yet." : filteredStudents.length === students.length ? `${students.length} students enrolled` : `${filteredStudents.length} of ${students.length} students`}
        </p>
        <button className="btn-ghost btn-sm" onClick={fetchStudents}>↺ Refresh</button>
      </div>

      {students.length > 0 && (
        <SearchBar query={searchQuery} onQuery={setSearchQuery} filterField={searchField} onFilter={(f) => { setSearchField(f); setSearchQuery(""); }} />
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
          {filteredStudents.map((s, i) => (
            <StudentCard key={s._id || i} s={s} onClick={setDetailStudent} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}