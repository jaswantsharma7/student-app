export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isValidLocalNumber = (v) => {
  const digits = v.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 6 && digits.length <= 13;
};

export const isValidRollNo = (v) => /^[A-Za-z0-9\-/]{2,20}$/.test(v.trim());

export const buildE164 = (countryCode, localNumber) => {
  const digits = localNumber.replace(/\D/g, "").replace(/^0+/, "");
  return `${countryCode}${digits}`;
};