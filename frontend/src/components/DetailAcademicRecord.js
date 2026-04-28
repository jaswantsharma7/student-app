import { calcSGPA, getGrade } from "../utils/constants";
import { gradeColor, formatMark } from "../utils/helpers";

export default function DetailAcademicRecord({ semesters }) {
  if (!semesters || semesters.length === 0) return null;

  return (
    <div className="academics-section">
      <div className="academics-title">Academic Record</div>
      <div className="semesters-list">
        {semesters.map((sem) => {
          const validSubs = (sem.subjects || []).filter(
            (s) => s.name?.trim() && s.marks !== null && s.marks !== undefined && s.marks !== ""
          );
          if (validSubs.length === 0) return null;
          
          const sgpa = calcSGPA(sem.subjects);
          const avg = validSubs.reduce((a, b) => a + Number(b.marks), 0) / validSubs.length;
          const g = getGrade(avg);
          
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
                  <span className="subject-name-cell">Subject</span>
                  <span title="Internal Marks">Int.</span>
                  <span title="External Marks">Ext.</span>
                  <span title="Total Marks">Total</span>
                  <span title="Calculated Percentage">%</span>
                  <span>Grade</span>
                </div>
                {validSubs.map((subj, si) => {
                  const sg = getGrade(Number(subj.marks));
                  const obt = (Number(subj.internalMarks) || 0) + (Number(subj.externalMarks) || 0);
                  const max = (Number(subj.maxInternalMarks) || 0) + (Number(subj.maxExternalMarks) || 0);
                  return (
                    <div key={si} className="subjects-trow">
                      <span className="subject-name-cell" title={subj.name}>{subj.name}</span>
                      <span>{formatMark(subj.internalMarks)}/{formatMark(subj.maxInternalMarks)}</span>
                      <span>{formatMark(subj.externalMarks)}/{formatMark(subj.maxExternalMarks)}</span>
                      <span>{max > 0 ? `${obt}/${max}` : "—"}</span>
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
  );
}