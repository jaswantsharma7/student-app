import { useState, useEffect, useRef } from "react";
import { SEARCH_FIELDS } from "../utils/constants";

export default function SearchBar({ query, onQuery, filterField, onFilter }) {
  const filterRef  = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedLabel = SEARCH_FIELDS.find((f) => f.value === filterField)?.label || "All fields";

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="search-bar-wrap">
      <div className="search-filter-wrap" ref={filterRef}>
        <button
          type="button"
          className="search-filter-btn"
          onClick={() => setFilterOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={filterOpen}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 2.5h11M3 6.5h7M5 10.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span>{selectedLabel}</span>
          <svg className={`chevron${filterOpen ? " open" : ""}`} width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {filterOpen && (
          <div className="search-filter-dropdown" role="listbox">
            {SEARCH_FIELDS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="option"
                aria-selected={f.value === filterField}
                className={`search-filter-option${f.value === filterField ? " selected" : ""}`}
                onClick={() => { onFilter(f.value); setFilterOpen(false); }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="search-input-wrap">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={`Search by ${selectedLabel.toLowerCase()}...`}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button className="search-clear" type="button" onClick={() => onQuery("")} aria-label="Clear search">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}