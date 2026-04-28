import { useState, useEffect } from "react";
import { authFetch } from "../utils/api";
import { getSemesters, calcSGPA, calcCGPA, COUNTRY_CODES, DEFAULT_COUNTRY } from "../utils/constants";
import { isValidEmail, isValidLocalNumber, isValidRollNo, buildE164 } from "../utils/validators";
import { buildSemesters } from "../utils/helpers";

export default function useStudentForm(editingStudent, onSuccess, handleLogout) {
  const blankForm = { name: "", course: "", year: "", currentSem: "", rollno: "", email: "", address: "" };
  
  const [form, setForm] = useState(blankForm);
  const [stuCountry, setStuCountry] = useState(DEFAULT_COUNTRY);
  const [stuLocalPhone, setStuLocalPhone] = useState("");
  const [semesters, setSemesters] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const totalSems = form.course ? getSemesters(form.course) : 0;

  // Initialize Data
  useEffect(() => {
    if (editingStudent) {
      const phone = editingStudent.phone || "";
      let matchedCountry = DEFAULT_COUNTRY;
      let local = phone;
      const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
      for (const c of sorted) {
        if (phone.startsWith(c.code)) { matchedCountry = c; local = phone.slice(c.code.length); break; }
      }
      setForm({
        name: editingStudent.name, course: editingStudent.course,
        year: editingStudent.year, currentSem: editingStudent.currentSem,
        rollno: editingStudent.rollno, email: editingStudent.email, address: editingStudent.address,
      });
      setStuCountry(matchedCountry); 
      setStuLocalPhone(local);
      
      const freshSlots = buildSemesters(getSemesters(editingStudent.course));
      const merged = freshSlots.map((slot) => {
        const saved = (editingStudent.semesters || []).find((s) => s.semNumber === slot.semNumber);
        if (saved && saved.subjects?.length) {
          return {
            ...saved,
            subjects: saved.subjects.map(sub => ({
              ...sub,
              internalMarks: sub.internalMarks === null ? "" : sub.internalMarks,
              maxInternalMarks: sub.maxInternalMarks === null ? "" : sub.maxInternalMarks,
              externalMarks: sub.externalMarks === null ? "" : sub.externalMarks,
              maxExternalMarks: sub.maxExternalMarks === null ? "" : sub.maxExternalMarks,
              marks: sub.marks === null ? "" : sub.marks
            }))
          };
        }
        return slot;
      });
      setSemesters(merged);
    } else {
      setForm(blankForm);
      setStuCountry(DEFAULT_COUNTRY);
      setStuLocalPhone("");
      setSemesters([]);
    }
    setFormErrors({});
    setSubmitError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingStudent]);

  // Rebuild semesters on course change
  useEffect(() => {
    if (!editingStudent && form.course) {
      const count = getSemesters(form.course);
      setSemesters((prev) => {
        const next = buildSemesters(count);
        return next.map((ns) => prev.find((p) => p.semNumber === ns.semNumber) || ns);
      });
    }
  }, [form.course, editingStudent]);

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFormErrors((fe) => ({ ...fe, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.course) errs.course = "Select a course.";
    if (!form.year || isNaN(form.year) || Number(form.year) < 1 || Number(form.year) > 5) errs.year = "Enter a valid year (1–5).";
    if (!form.currentSem || isNaN(form.currentSem) || Number(form.currentSem) < 1) errs.currentSem = "Enter a valid semester.";
    if (!isValidRollNo(form.rollno)) errs.rollno = "Roll No: 2–30 alphanumeric chars.";
    if (!isValidEmail(form.email)) errs.email = "Enter a valid email.";
    if (!isValidLocalNumber(stuLocalPhone)) errs.phone = "Enter a valid phone number.";
    if (!form.address.trim()) errs.address = "Address is required.";
    return errs;
  };

  const buildPayload = () => {
    const cleanedSems = semesters.map((sem) => ({
      semNumber: sem.semNumber,
      subjects: sem.subjects.filter((s) => s.name?.trim()).map(s => ({
        name: s.name,
        internalMarks: s.internalMarks !== "" && s.internalMarks !== null ? Number(s.internalMarks) : null,
        maxInternalMarks: s.maxInternalMarks !== "" && s.maxInternalMarks !== null ? Number(s.maxInternalMarks) : null,
        externalMarks: s.externalMarks !== "" && s.externalMarks !== null ? Number(s.externalMarks) : null,
        maxExternalMarks: s.maxExternalMarks !== "" && s.maxExternalMarks !== null ? Number(s.maxExternalMarks) : null,
        marks: s.marks !== "" && s.marks !== null ? Number(s.marks) : null
      })),
      sgpa: calcSGPA(sem.subjects),
    }));
    return {
      ...form,
      name: form.name.trim(), year: Number(form.year), currentSem: Number(form.currentSem),
      rollno: form.rollno.trim(), email: form.email.trim(), address: form.address.trim(),
      phone: buildE164(stuCountry.code, stuLocalPhone), 
      semesters: cleanedSems, 
      cgpa: calcCGPA(cleanedSems) || null,
    };
  };

  const saveStudent = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({}); setSubmitError(null);
    try {
      const endpoint = editingStudent ? `/students/${editingStudent._id}` : "/students";
      const method = editingStudent ? "PUT" : "POST";
      const res = await authFetch(endpoint, { method, body: JSON.stringify(buildPayload()) });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to save student`);
      }
      onSuccess();
    } catch (err) { setSubmitError(err.message); }
  };

  return {
    form, setForm, setField, formErrors, setFormErrors, submitError,
    stuCountry, setStuCountry, stuLocalPhone, setStuLocalPhone,
    semesters, setSemesters, totalSems, saveStudent
  };
}