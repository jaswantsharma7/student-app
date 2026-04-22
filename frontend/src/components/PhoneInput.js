import CountryCodeSelector from "./CountryCodeSelector";

export default function PhoneInput({ countryCode, onCountryChange, localNumber, onNumberChange, hasError, placeholder }) {
  return (
    <div className={`phone-input-row${hasError ? " has-error" : ""}`}>
      <CountryCodeSelector value={countryCode} onChange={onCountryChange} hasError={hasError} />
      <input
        type="tel"
        value={localNumber}
        onChange={(e) => onNumberChange(e.target.value)}
        placeholder={placeholder || "Phone number"}
        className={`phone-number-field${hasError ? " input-error" : ""}`}
        autoComplete="tel-national"
      />
    </div>
  );
}