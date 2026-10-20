'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, ChevronDown, Check, Search, X } from 'lucide-react';
import { useCountry } from '@/context/CountryContext';

export default function CountryDropdown() {
  const { country, setCountry, countries } = useCountry();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter countries based on query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [countries, searchQuery]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm country-dropdown-trigger"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.85rem',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`Country: ${country.name} (${country.dialCode})`}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--whatsapp)',
          }}
        >
          <Globe size={15} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              padding: '2px 5px',
              borderRadius: '4px',
              background: 'var(--color-light-green)',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
            }}
          >
            {country.code}
          </span>
          <span
            className="country-dropdown-dial"
            style={{
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            {country.dialCode}
          </span>
          <span
            className="country-dropdown-name"
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-main)',
              maxWidth: '90px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {country.name}
          </span>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="country-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '290px',
            maxHeight: '380px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header & Search */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-card-hover)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Region / Dial Code
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--color-light-green)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                }}
              >
                Auto-Detected
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                className="form-input"
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  fontSize: '0.8rem',
                  borderRadius: '6px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                }}
                placeholder="Search country or dial code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* List of Countries */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              padding: '6px',
              maxHeight: '260px',
            }}
          >
            {filteredCountries.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                No countries found for "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === country.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isSelected
                        ? 'var(--color-light-green)'
                        : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          background: isSelected
                            ? 'var(--whatsapp)'
                            : 'var(--bg-card-hover)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {c.code}
                      </span>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {c.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--whatsapp)' : 'var(--text-muted)',
                        }}
                      >
                        {c.dialCode}
                      </span>
                      {isSelected && <Check size={14} style={{ color: 'var(--whatsapp)' }} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
