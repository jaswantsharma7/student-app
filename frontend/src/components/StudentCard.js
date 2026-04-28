import { getSemesters, getGrade } from "../utils/constants";
import { gradeColor } from "../utils/helpers";

export default function StudentCard({ s, onClick, onEdit, onDelete }) {
  const cgpa = s.cgpa ? parseFloat(s.cgpa) : null;
  const g = cgpa ? getGrade((cgpa / 10) * 100) : null;
  const totalSemCount = getSemesters(s.course);
  const completedCount = (s.semesters || []).filter(
    (sem) => sem.subjects?.some((sub) => sub.name?.trim())
  ).length;

  return (
    <div className="student-card" onClick={() => onClick(s)}>
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
          <button className="btn-edit" onClick={() => onEdit(s)}>Edit</button>
          <button className="btn-delete" onClick={() => onDelete(s._id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}