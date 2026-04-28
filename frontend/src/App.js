import "./App.css";
import { useState } from "react";

// Hooks
import useAuth from "./hooks/useAuth";
import useStudents from "./hooks/useStudents";

// Components
import AuthPage from "./components/AuthPage";
import Analytics from "./components/Analytics";
import StudentList from "./components/StudentList";
import StudentForm from "./components/StudentForm";
import StudentDetail from "./components/StudentDetail";

export default function StudentApp() {
  const { user, setUser, authChecked, handleLogout } = useAuth();
  const { students, loading, error, fetchStudents, deleteStudent } = useStudents(user, handleLogout);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState("list");
  const [editingStudent, setEditingStudent] = useState(null);
  const [detailStudent, setDetailStudent] = useState(null);

  const handleEditInit = (student) => {
    setEditingStudent(student);
    setActiveTab("add");
  };

  const closeForm = () => {
    setEditingStudent(null);
    setActiveTab("list");
  };

  const onFormSuccess = async () => {
    await fetchStudents();
    closeForm();
  };

  // Render guards
  if (!authChecked) {
    return <div className="app-wrapper splash"><p className="state-message">Loading…</p></div>;
  }
  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

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

      {/* Analytics Strip */}
      {students.length > 0 && <Analytics students={students} />}

      {/* Navigation Tabs */}
      <div className="tabs">
        <button className={activeTab === "list" ? "tab-active" : ""} onClick={closeForm}>
          Dashboard {students.length > 0 && <span className="tab-count">{students.length}</span>}
        </button>
        <button className={activeTab === "add" && !editingStudent ? "tab-active" : ""} 
          onClick={() => { setEditingStudent(null); setActiveTab("add"); }}>
          + Enroll Student
        </button>
        {editingStudent && (
          <button className="tab-active tab-edit-indicator">
            Editing: {editingStudent.name}
            <span className="tab-close" onClick={(e) => { e.stopPropagation(); closeForm(); }}>×</span>
          </button>
        )}
      </div>

      {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Main Content Areas */}
      {activeTab === "add" && (
        <StudentForm 
          editingStudent={editingStudent}
          onSuccess={onFormSuccess}
          onCancel={closeForm}
          handleLogout={handleLogout}
        />
      )}

      {activeTab === "list" && (
        <StudentList 
          students={students}
          loading={loading}
          fetchStudents={fetchStudents}
          setDetailStudent={setDetailStudent}
          onEdit={handleEditInit}
          onDelete={deleteStudent}
        />
      )}

      {/* Detail Modal Overlay */}
      {detailStudent && (
        <StudentDetail
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
          onEdit={(s) => { handleEditInit(s); setDetailStudent(null); }}
          onDelete={(id) => { deleteStudent(id); setDetailStudent(null); }}
        />
      )}
    </div>
  );
}