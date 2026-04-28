import useStudentForm from "../hooks/useStudentForm";
import BasicInfoFields from "./BasicInfoFields";
import SemesterMarksBuilder from "./SemesterMarksBuilder";
import { getGrade, calcCGPA } from "../utils/constants";
import { gradeColor } from "../utils/helpers";

export default function StudentForm({ editingStudent, onSuccess, onCancel, handleLogout }) {
  const {
    form, setForm, setField, formErrors, setFormErrors, submitError,
    stuCountry, setStuCountry, stuLocalPhone, setStuLocalPhone,
    semesters, setSemesters, totalSems, saveStudent
  } = useStudentForm(editingStudent, onSuccess, handleLogout);

  return (
    <div className="form-card">
      <div className="form-section-title">
        {editingStudent ? "✏️ Edit Student Record" : "🎓 New Student Enrollment"}
      </div>
      
      {submitError && <p className="error" style={{ marginBottom: 16 }}>{submitError}</p>}

      <div className="form-section-subtitle">Basic Information</div>
      <BasicInfoFields 
        form={form} setForm={setForm} setField={setField} formErrors={formErrors} setFormErrors={setFormErrors}
        stuCountry={stuCountry} setStuCountry={setStuCountry} stuLocalPhone={stuLocalPhone} setStuLocalPhone={setStuLocalPhone} totalSems={totalSems}
      />

      {semesters.length > 0 && (
        <>
          <div className="form-section-subtitle" style={{ marginTop: 28 }}>
            Academic Marks <span className="section-hint">Click a semester to expand · Leave blank to skip</span>
          </div>
          <SemesterMarksBuilder semesters={semesters} onChange={setSemesters} />

          {(() => {
            const cgpa = calcCGPA(semesters);
            if (!cgpa) return null;
            const g = getGrade((cgpa / 10) * 100);
            return (
              <div className="cgpa-preview">
                <span className="cgpa-preview-label">Current CGPA</span>
                <span className={`cgpa-preview-value ${gradeColor(g.letter)}`}>{cgpa} — {g.letter} ({g.label})</span>
              </div>
            );
          })()}
        </>
      )}

      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={saveStudent}>
          {editingStudent ? "Save Changes" : "Enroll Student"}
        </button>
      </div>
    </div>
  );
}