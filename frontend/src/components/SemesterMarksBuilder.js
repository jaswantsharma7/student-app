import { useState } from "react";
import { calcSGPA } from "../utils/constants";
import { emptySubject } from "../utils/helpers";

export default function SemesterMarksBuilder({ semesters, onChange }) {
  const [openSem, setOpenSem] = useState(0);

  const updateSubject = (semIdx, subIdx, field, value) => {
    const next = semesters.map((sem, si) =>
      si !== semIdx ? sem : {
        ...sem,
        subjects: sem.subjects.map((sub, sj) => {
          if (sj !== subIdx) return sub;
          const updatedSub = { ...sub, [field]: value };
          
          // Auto calculate percentage
          const intM = Number(updatedSub.internalMarks) || 0;
          const maxIntM = Number(updatedSub.maxInternalMarks) || 0;
          const extM = Number(updatedSub.externalMarks) || 0;
          const maxExtM = Number(updatedSub.maxExternalMarks) || 0;
          const totalMax = maxIntM + maxExtM;
          
          if (totalMax > 0) {
            updatedSub.marks = parseFloat((((intM + extM) / totalMax) * 100).toFixed(2));
          } else {
            updatedSub.marks = "";
          }
          return updatedSub;
        }),
      }
    );
    onChange(next);
  };

  const addSubject = (semIdx) => {
    const next = semesters.map((sem, si) => {
      if (si !== semIdx) return sem;
      
      const newSubj = emptySubject();
      // If there's an existing subject, inherit its max marks
      if (sem.subjects.length > 0) {
        const lastSubject = sem.subjects[sem.subjects.length - 1];
        newSubj.maxInternalMarks = lastSubject.maxInternalMarks;
        newSubj.maxExternalMarks = lastSubject.maxExternalMarks;
      }

      return { ...sem, subjects: [...sem.subjects, newSubj] };
    });
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
                    
                    <div className="marks-group">
                      <span className="marks-group-label">Int.</span>
                      <input 
                        className="mark-input" type="number" min="0" placeholder="Marks" 
                        value={sub.internalMarks} onChange={(e) => updateSubject(si, sj, "internalMarks", e.target.value)} 
                      />
                      <span className="marks-group-sep">/</span>
                      <input 
                        className="mark-input" type="number" min="0" placeholder="Max" 
                        value={sub.maxInternalMarks} onChange={(e) => updateSubject(si, sj, "maxInternalMarks", e.target.value)} 
                      />
                    </div>

                    <div className="marks-group">
                      <span className="marks-group-label">Ext.</span>
                      <input 
                        className="mark-input" type="number" min="0" placeholder="Marks" 
                        value={sub.externalMarks} onChange={(e) => updateSubject(si, sj, "externalMarks", e.target.value)} 
                      />
                      <span className="marks-group-sep">/</span>
                      <input 
                        className="mark-input" type="number" min="0" placeholder="Max" 
                        value={sub.maxExternalMarks} onChange={(e) => updateSubject(si, sj, "maxExternalMarks", e.target.value)} 
                      />
                    </div>

                    <div className="subject-total-preview" title="Total Percentage">
                      {sub.marks !== "" && sub.marks !== null ? `${sub.marks}%` : "—"}
                    </div>

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

                {/* Semester Total Row */}
                {(() => {
                  const tInt = sem.subjects.reduce((sum, s) => sum + (Number(s.internalMarks) || 0), 0);
                  const tMaxInt = sem.subjects.reduce((sum, s) => sum + (Number(s.maxInternalMarks) || 0), 0);
                  const tExt = sem.subjects.reduce((sum, s) => sum + (Number(s.externalMarks) || 0), 0);
                  const tMaxExt = sem.subjects.reduce((sum, s) => sum + (Number(s.maxExternalMarks) || 0), 0);
                  const tObt = tInt + tExt;
                  const tMax = tMaxInt + tMaxExt;
                  const tPct = tMax > 0 ? ((tObt / tMax) * 100).toFixed(2) : 0;
                  return (
                    <div className="sem-total-row">
                      <span className="sem-total-label">Semester Marks:</span>
                      <span className="sem-total-value">{tObt} / {tMax}</span>
                      <span className="sem-total-pct">({tPct}%)</span>
                    </div>
                  );
                })()}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}