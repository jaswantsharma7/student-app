import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../utils/api";

export default function useStudents(user, handleLogout) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await authFetch("/students");
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to fetch students");
      setStudents(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => { 
    if (user) fetchStudents(); 
  }, [user, fetchStudents]);

  const deleteStudent = async (id) => {
    if (!id) return;
    setError(null);
    try {
      const res = await authFetch(`/students/${id}`, { method: "DELETE" });
      if (res.status === 401) { handleLogout(); return; }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to delete student");
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) { setError(err.message); }
  };

  return { students, loading, error, fetchStudents, deleteStudent };
}