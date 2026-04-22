import { useState, useEffect, useRef } from "react";
import { COUNTRY_CODES, DEFAULT_COUNTRY } from "../utils/constants";

export default function CountryCodeSelector({ value, onChange, hasError }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef   = useRef(null);

  const selected = COUNTRY_CODES.find(
    (c) => c.iso === value.iso && c.code === value.code
  ) || DEFAULT_COUNTRY;

  const filtered = COUNTRY_CODES.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q) ||
      c.code.includes(q)
    );
  });

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`country-selector${hasError ? " input-error" : ""}`} ref={dropdownRef}>
      <button
        type="button"
        className="country-trigger"
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="country-flag">{selected.flag}</span>
        <span className="country-code-label">{selected.code}</span>
        <span className="country-iso">{selected.iso}</span>
        <svg className={`chevron${open ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="country-dropdown" role="listbox">
          <div className="country-search-wrap">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.3"/>
              <path d="M9.5 9.5l2.5 2.5" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="country-search"
            />
          </div>
          <div className="country-list">
            {filtered.length === 0 ? (
              <div className="country-empty">No results found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={`${c.iso}-${c.code}`}
                  type="button"
                  role="option"
                  aria-selected={c.iso === selected.iso && c.code === selected.code}
                  className={`country-option${c.iso === selected.iso && c.code === selected.code ? " selected" : ""}`}
                  onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                >
                  <span className="country-flag">{c.flag}</span>
                  <span className="country-name">{c.name}</span>
                  <span className="country-opt-meta">{c.iso} {c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}