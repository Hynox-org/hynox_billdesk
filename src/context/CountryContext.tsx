'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Country, COUNTRIES, DEFAULT_COUNTRY, detectBrowserCountry, getCountryByCode } from '@/lib/country';

interface CountryContextType {
  country: Country;
  setCountry: (country: Country) => void;
  setCountryByCode: (code: string) => void;
  countries: Country[];
}

const CountryContext = createContext<CountryContextType>({
  country: DEFAULT_COUNTRY,
  setCountry: () => {},
  setCountryByCode: () => {},
  countries: COUNTRIES,
});

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Detect country from browser on client mount
    const detected = detectBrowserCountry();
    setCountryState(detected);
    setMounted(true);

    // Sync across browser tabs or external events
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'hynox_billing_country_code' || e.key === 'billdesk_country_code') && e.newValue) {
        setCountryState(getCountryByCode(e.newValue));
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCountryState(getCountryByCode(customEvent.detail));
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('hynox_billing:country-change', handleCustomChange);
    window.addEventListener('billdesk:country-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hynox_billing:country-change', handleCustomChange);
      window.removeEventListener('billdesk:country-change', handleCustomChange);
    };
  }, []);

  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    try {
      localStorage.setItem('hynox_billing_country_code', newCountry.code);
      window.dispatchEvent(
        new CustomEvent('hynox_billing:country-change', { detail: newCountry.code })
      );
    } catch {
      // Ignore storage errors
    }
  };

  const setCountryByCode = (code: string) => {
    const matched = getCountryByCode(code);
    setCountry(matched);
  };

  const contextValue = useMemo(
    () => ({
      country,
      setCountry,
      setCountryByCode,
      countries: COUNTRIES,
    }),
    [country]
  );

  return (
    <CountryContext.Provider value={contextValue}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  return useContext(CountryContext);
}
