import { useMemo } from "react";

export default function Analytics({ students }) {
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