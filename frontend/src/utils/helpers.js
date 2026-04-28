export const emptySubject = () => ({
  name: "",
  internalMarks: "", maxInternalMarks: "",
  externalMarks: "", maxExternalMarks: "",
  marks: ""
});

export const buildSemesters = (count) =>
  Array.from({ length: count }, (_, i) => ({
    semNumber: i + 1,
    subjects: [emptySubject()],
  }));

export function gradeColor(letter) {
  if (letter === "O" || letter === "A+") return "grade-o";
  if (letter === "A")  return "grade-a";
  if (letter === "B+" || letter === "B") return "grade-b";
  if (letter === "C" || letter === "P") return "grade-c";
  return "grade-f";
}

export function formatMark(val) {
  return (val !== null && val !== undefined && val !== "") ? val : "—";
}