import PhoneInput from "./PhoneInput";
import { UG_COURSES } from "../utils/constants";
import { isValidRollNo, isValidEmail } from "../utils/validators";

export default function BasicInfoFields({ 
  form, setForm, setField, formErrors, setFormErrors,
  stuCountry, setStuCountry, stuLocalPhone, setStuLocalPhone, totalSems 
}) {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label>Full Name *</label>
        <input type="text" value={form.name} onChange={setField("name")} placeholder="e.g. Arjun Sharma" className={formErrors.name ? "input-error" : ""} />
        {formErrors.name && <span className="field-error">{formErrors.name}</span>}
      </div>

      <div className="form-group">
        <label>Course *</label>
        <select value={form.course} onChange={setField("course")} className={formErrors.course ? "input-error" : ""}>
          <option value="">Select a UG course</option>
          {UG_COURSES.map((c) => (<option key={c.name} value={c.name}>{c.name} ({c.semesters} semesters)</option>))}
        </select>
        {formErrors.course && <span className="field-error">{formErrors.course}</span>}
      </div>

      <div className="form-group">
        <label>Year *</label>
        <select value={form.year} onChange={setField("year")} className={formErrors.year ? "input-error" : ""}>
          <option value="">Select year</option>
          {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        {formErrors.year && <span className="field-error">{formErrors.year}</span>}
      </div>

      <div className="form-group">
        <label>Current Semester *</label>
        <select value={form.currentSem} onChange={setField("currentSem")} className={formErrors.currentSem ? "input-error" : ""} disabled={!form.course}>
          <option value="">{form.course ? "Select semester" : "Select course first"}</option>
          {Array.from({ length: totalSems }, (_, i) => (<option key={i+1} value={i+1}>Semester {i+1}</option>))}
        </select>
        {formErrors.currentSem && <span className="field-error">{formErrors.currentSem}</span>}
      </div>

      <div className="form-group">
        <label>Roll Number *</label>
        <input type="text" value={form.rollno}
          onChange={(e) => { setForm((f) => ({ ...f, rollno: e.target.value })); setFormErrors((fe) => ({ ...fe, rollno: null })); }}
          onBlur={() => { if (form.rollno && !isValidRollNo(form.rollno)) setFormErrors((fe) => ({ ...fe, rollno: "2–30 alphanumeric chars." })); }}
          placeholder="e.g. CS-2024-001" className={formErrors.rollno ? "input-error" : ""} />
        {formErrors.rollno && <span className="field-error">{formErrors.rollno}</span>}
      </div>

      <div className="form-group">
        <label>Student Email *</label>
        <input type="email" value={form.email}
          onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFormErrors((fe) => ({ ...fe, email: null })); }}
          onBlur={() => { if (form.email && !isValidEmail(form.email)) setFormErrors((fe) => ({ ...fe, email: "Enter a valid email." })); }}
          placeholder="student@example.com" className={formErrors.email ? "input-error" : ""} />
        {formErrors.email && <span className="field-error">{formErrors.email}</span>}
      </div>

      <div className="form-group">
        <label>Phone Number *</label>
        <PhoneInput countryCode={stuCountry} onCountryChange={(c) => { setStuCountry(c); setFormErrors((fe) => ({ ...fe, phone: null })); }}
          localNumber={stuLocalPhone} onNumberChange={(v) => { setStuLocalPhone(v); setFormErrors((fe) => ({ ...fe, phone: null })); }}
          hasError={!!formErrors.phone} placeholder="98765 43210" />
        {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
      </div>

      <div className="form-group">
        <label>Address *</label>
        <input type="text" value={form.address} onChange={setField("address")} placeholder="Full postal address" className={formErrors.address ? "input-error" : ""} />
        {formErrors.address && <span className="field-error">{formErrors.address}</span>}
      </div>
    </div>
  );
}