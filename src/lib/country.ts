export interface Country {
  code: string;       // ISO 2-letter e.g. 'IN', 'US'
  name: string;       // Full name e.g. 'India'
  dialCode: string;   // Phone prefix e.g. '+91'
  currency: string;   // Currency symbol e.g. '₹'
}

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dialCode: '+91', currency: '₹' },
  { code: 'US', name: 'United States', dialCode: '+1', currency: '$' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: '£' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', currency: 'AED' },
  { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CA$' },
  { code: 'AU', name: 'Australia', dialCode: '+61', currency: 'A$' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', currency: 'S$' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', currency: 'SAR' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', currency: 'QAR' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', currency: 'KWD' },
  { code: 'OM', name: 'Oman', dialCode: '+968', currency: 'OMR' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', currency: 'BHD' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', currency: 'RM' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', currency: 'Rp' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', currency: '₱' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', currency: '฿' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', currency: '₫' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', currency: 'PKR' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', currency: '৳' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', currency: 'LKR' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', currency: 'NPR' },
  { code: 'DE', name: 'Germany', dialCode: '+49', currency: '€' },
  { code: 'FR', name: 'France', dialCode: '+33', currency: '€' },
  { code: 'IT', name: 'Italy', dialCode: '+39', currency: '€' },
  { code: 'ES', name: 'Spain', dialCode: '+34', currency: '€' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', currency: '€' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', currency: 'CHF' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', currency: '€' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', currency: 'kr' },
  { code: 'NO', name: 'Norway', dialCode: '+47', currency: 'kr' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', currency: 'kr' },
  { code: 'PL', name: 'Poland', dialCode: '+48', currency: 'zł' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', currency: '₺' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', currency: 'R' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: '₦' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', currency: 'KSh' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', currency: 'E£' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', currency: 'R$' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', currency: 'MX$' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', currency: 'NZ$' },
  { code: 'JP', name: 'Japan', dialCode: '+81', currency: '¥' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', currency: '₩' },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]; // India (+91)

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'Europe/London': 'GB',
  'Asia/Dubai': 'AE',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Asia/Singapore': 'SG',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Muscat': 'OM',
  'Asia/Bahrain': 'BH',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL',
  'Europe/Zurich': 'CH',
  'Europe/Dublin': 'IE',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Warsaw': 'PL',
  'Europe/Istanbul': 'TR',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Cairo': 'EG',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'Pacific/Auckland': 'NZ',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
};

/**
 * Automatically inspects the browser environment (localStorage, IANA timezone, navigator language)
 * to resolve the user's default country and dial code.
 */
export function detectBrowserCountry(): Country {
  if (typeof window === 'undefined') {
    return DEFAULT_COUNTRY;
  }

  // 1. Check persisted selection in localStorage
  try {
    const saved = localStorage.getItem('billdesk_country_code');
    if (saved) {
      const matched = COUNTRIES.find((c) => c.code.toUpperCase() === saved.toUpperCase());
      if (matched) return matched;
    }
  } catch {
    // Ignore storage errors
  }

  // 2. Check IANA timezone
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone) {
      // Direct lookup
      const directCode = TIMEZONE_TO_COUNTRY[timeZone];
      if (directCode) {
        const matched = COUNTRIES.find((c) => c.code === directCode);
        if (matched) return matched;
      }

      // Prefix check e.g. 'Asia/Kolkata'
      for (const [tzKey, cCode] of Object.entries(TIMEZONE_TO_COUNTRY)) {
        if (timeZone.toLowerCase().includes(tzKey.toLowerCase())) {
          const matched = COUNTRIES.find((c) => c.code === cCode);
          if (matched) return matched;
        }
      }
    }
  } catch {
    // Ignore timezone detection errors
  }

  // 3. Check browser language (e.g. 'en-IN' -> 'IN')
  try {
    const langs = [
      navigator.language,
      ...(navigator.languages || []),
    ].filter(Boolean);

    for (const lang of langs) {
      const parts = lang.split(/[-_]/);
      if (parts.length > 1) {
        const regionCode = parts[1].toUpperCase();
        const matched = COUNTRIES.find((c) => c.code === regionCode);
        if (matched) return matched;
      }
    }
  } catch {
    // Ignore language detection errors
  }

  return DEFAULT_COUNTRY;
}

export function getCountryByCode(code: string): Country {
  const upper = code.toUpperCase().trim();
  return COUNTRIES.find((c) => c.code === upper) || DEFAULT_COUNTRY;
}
