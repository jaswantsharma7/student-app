// UG Courses with semester counts
export const UG_COURSES = [
  { name: "B.Tech (Computer Science)",       semesters: 8 },
  { name: "B.Tech (Electronics & Comm.)",    semesters: 8 },
  { name: "B.Tech (Mechanical Engineering)", semesters: 8 },
  { name: "B.Tech (Civil Engineering)",      semesters: 8 },
  { name: "B.Tech (Electrical Engineering)", semesters: 8 },
  { name: "B.Tech (Information Technology)", semesters: 8 },
  { name: "B.Sc (Computer Science)",         semesters: 6 },
  { name: "B.Sc (Physics)",                  semesters: 6 },
  { name: "B.Sc (Chemistry)",                semesters: 6 },
  { name: "B.Sc (Mathematics)",              semesters: 6 },
  { name: "B.Sc (Biology)",                  semesters: 6 },
  { name: "B.Sc (Statistics)",               semesters: 6 },
  { name: "BCA (Computer Applications)",     semesters: 6 },
  { name: "BBA (Business Administration)",   semesters: 6 },
  { name: "B.Com (Commerce)",                semesters: 6 },
  { name: "B.Com (Honours)",                 semesters: 6 },
  { name: "BA (Economics)",                  semesters: 6 },
  { name: "BA (English Literature)",         semesters: 6 },
  { name: "BA (History)",                    semesters: 6 },
  { name: "BA (Political Science)",          semesters: 6 },
  { name: "BA (Psychology)",                 semesters: 6 },
  { name: "BA (Sociology)",                  semesters: 6 },
  { name: "B.Arch (Architecture)",           semesters: 10 },
  { name: "MBBS (Medicine)",                 semesters: 10 },
  { name: "BDS (Dental Surgery)",            semesters: 8 },
  { name: "B.Pharm (Pharmacy)",              semesters: 8 },
  { name: "LLB (Law)",                       semesters: 6 },
  { name: "B.Ed (Education)",                semesters: 4 },
  { name: "BHM (Hotel Management)",          semesters: 8 },
  { name: "B.Des (Design)",                  semesters: 8 },
];

export const COURSES = UG_COURSES.map((c) => c.name);

export const getSemesters = (courseName) => {
  const found = UG_COURSES.find((c) => c.name === courseName);
  return found ? found.semesters : 6;
};

// Grade thresholds (10-point SGPA scale based on marks %)
export const getGrade = (pct) => {
  if (pct >= 90) return { letter: "O",  points: 10, label: "Outstanding" };
  if (pct >= 80) return { letter: "A+", points: 9,  label: "Excellent"   };
  if (pct >= 70) return { letter: "A",  points: 8,  label: "Very Good"   };
  if (pct >= 60) return { letter: "B+", points: 7,  label: "Good"        };
  if (pct >= 50) return { letter: "B",  points: 6,  label: "Above Avg"   };
  if (pct >= 45) return { letter: "C",  points: 5,  label: "Average"     };
  if (pct >= 40) return { letter: "P",  points: 4,  label: "Pass"        };
  return           { letter: "F",  points: 0,  label: "Fail"        };
};

export const calcSGPA = (subjects) => {
  if (!subjects || subjects.length === 0) return null;
  const valid = subjects.filter((s) => s.name?.trim() && s.marks !== "" && !isNaN(Number(s.marks)));
  if (valid.length === 0) return null;
  const totalPct = valid.reduce((sum, s) => sum + Number(s.marks), 0) / valid.length;
  return parseFloat(getGrade(totalPct).points.toFixed(2));
};

export const calcCGPA = (semesters) => {
  const sgpas = semesters
    .map((sem) => calcSGPA(sem.subjects))
    .filter((g) => g !== null);
  if (sgpas.length === 0) return null;
  return parseFloat((sgpas.reduce((a, b) => a + b, 0) / sgpas.length).toFixed(2));
};

export const COUNTRY_CODES = [
  { code: "+91", iso: "IN", name: "India", flag: "🇮🇳" },
  { code: "+1", iso: "US", name: "United States", flag: "🇺🇸" },
  { code: "+44", iso: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", iso: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "+1", iso: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "+86", iso: "CN", name: "China", flag: "🇨🇳" },
  { code: "+33", iso: "FR", name: "France", flag: "🇫🇷" },
  { code: "+49", iso: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "+81", iso: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "+82", iso: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "+55", iso: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "+7", iso: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "+27", iso: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "+52", iso: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "+92", iso: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "+880", iso: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+234", iso: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "+65", iso: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "+94", iso: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+977", iso: "NP", name: "Nepal", flag: "🇳🇵" },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0];

export const SEARCH_FIELDS = [
  { value: "all",    label: "All fields" },
  { value: "name",   label: "Name"       },
  { value: "course", label: "Course"     },
  { value: "rollno", label: "Roll No"    },
  { value: "email",  label: "Email"      },
  { value: "phone",  label: "Phone"      },
];