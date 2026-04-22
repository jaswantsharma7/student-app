import { useRef } from "react";

export default function OtpInput({ value, onChange, hasError }) {
  const inputs = useRef([]);
  const digits  = (value || "      ").split("").concat(Array(6).fill(" ")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[i] && arr[i].trim()) {
        arr[i] = ""; onChange(arr.join(""));
      } else if (i > 0) {
        arr[i - 1] = ""; onChange(arr.join(""));
        inputs.current[i - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft"  && i > 0) { inputs.current[i - 1]?.focus(); return; }
    if (e.key === "ArrowRight" && i < 5) { inputs.current[i + 1]?.focus(); return; }
  };

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const arr = value.split("").concat(Array(6).fill("")).slice(0, 6);
    arr[i] = char;
    onChange(arr.join(""));
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="otp-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`otp-box${hasError ? " input-error" : ""}`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}