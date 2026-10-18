import type { Metadata } from 'next';
import './globals.css';
import { CountryProvider } from '@/context/CountryContext';

export const metadata: Metadata = {
  title: 'BillDesk | Multi-Tenant Vendor POS & WhatsApp Ordering SaaS',
  description:
    'Empower retail shops, artisan cafes, and service businesses with instant Point-of-Sale ordering and direct WhatsApp receipt dispatching. Zero external payment gateway required.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%2310b981%22/><text y=%22.85em%22 x=%2220%22 font-size=%2278%22 font-family=%22Arial%22 font-weight=%22bold%22 fill=%22white%22>B</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CountryProvider>{children}</CountryProvider>
      </body>
    </html>
  );
}
