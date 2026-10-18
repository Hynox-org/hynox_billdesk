'use client';

import { useEffect } from 'react';

export default function ThemeToggle() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.setItem('billdesk_theme', 'light');
    } catch {
      // ignore
    }
  }, []);

  return null;
}

