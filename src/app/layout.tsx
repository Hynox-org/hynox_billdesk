import type { Metadata } from 'next';
import './globals.css';
import { CountryProvider } from '@/context/CountryContext';

export const metadata: Metadata = {
  title: 'HYNOX Billing | Multi-Tenant Vendor POS & WhatsApp Ordering SaaS',
  description:
    'Empower retail shops, artisan cafes, and service businesses with instant Point-of-Sale ordering and direct WhatsApp receipt dispatching. Zero external payment gateway required.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.setAttribute('data-theme','light');localStorage.setItem('hynox_billing_theme','light');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <CountryProvider>{children}</CountryProvider>
      </body>
    </html>
  );
}
