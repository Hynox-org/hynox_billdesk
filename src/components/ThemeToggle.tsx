'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('billdesk_theme') as 'dark' | 'light' | null;
    const initialTheme = saved || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('billdesk_theme', nextTheme);
  };

  if (!mounted) {
    return (
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn btn-secondary btn-sm"
      style={{
        padding: '7px 10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--whatsapp)',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-card)',
      }}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
