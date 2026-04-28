import DetailInfoGrid from "./DetailInfoGrid";
import DetailAcademicRecord from "./DetailAcademicRecord";
import { getSemesters, getGrade } from "../utils/constants";
import { gradeColor } from "../utils/helpers";

export default function StudentDetail({ student, onClose, onEdit, onDelete }) {
  const totalSems = getSemesters(student.course);
  const completedSems = (student.semesters || []).filter(
    (sem) => sem.subjects?.some((s) => s.name?.trim() && s.marks !== null && s.marks !== undefined && s.marks !== "")
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
          <DetailInfoGrid student={student} />
          <DetailAcademicRecord semesters={student.semesters} />
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