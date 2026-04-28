export default function DetailInfoGrid({ student }) {
  return (
    <div className="detail-info-grid">
      <div className="detail-info-item">
        <span className="detail-info-label">Year</span>
        <span className="detail-info-value">Year {student.year}</span>
      </div>
      <div className="detail-info-item">
        <span className="detail-info-label">Current Semester</span>
        <span className="detail-info-value">Semester {student.currentSem}</span>
      </div>
      <div className="detail-info-item">
        <span className="detail-info-label">Email</span>
        <span className="detail-info-value mono">{student.email}</span>
      </div>
      <div className="detail-info-item">
        <span className="detail-info-label">Phone</span>
        <span className="detail-info-value mono">{student.phone}</span>
      </div>
      <div className="detail-info-item span-2">
        <span className="detail-info-label">Address</span>
        <span className="detail-info-value">{student.address}</span>
      </div>
    </div>
  );
}