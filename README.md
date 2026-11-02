# HYNOX Billing

> Multi-Tenant Cloud POS & Instant WhatsApp E-Receipt SaaS Platform.

Built with **Next.js (App Router)**, **TypeScript**, **Supabase**, and **Vanilla CSS**. Designed with rich aesthetics, curated green color palettes, full dark/light theme support, and responsive floating bottom navigation for mobile and tablet devices.

---

## Features

- **Multi-Tenant Architecture**: Complete data isolation across vendors with tenant-scoped collections (categories, products, orders).
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Global oversight, vendor management, trial extension (+7 days), PRO plan upgrades, and revenue analytics.
  - **Vendor**: Self-registration with an automated **15-day free trial**, catalog builder, POS terminal, and order history.
- **High-Velocity POS Terminal**:
  - Live category filters and real-time product search.
  - Multi-payment support: Cash, Card, UPI, and Online.
  - Automatic tax calculations, discounts, and real-time totals.
- **WhatsApp Order Dispatch**: Instant e-receipt generation with pre-formatted WhatsApp text dispatched directly via `wa.me` links (zero API keys or Meta approval required).
- **Paywall & Subscription Enforcement**: Trial countdown badges, trial-expiration blocking, and vendor upgrade workflows.
- **Modern Responsive Design**:
  - Exclusively curated emerald & forest green shades (no generic colors).
  - Pure black background in dark mode, pure white background in light mode.
  - Floating bottom navigation dock for seamless touch navigation on mobile and tablet screens.
  - Fully responsive grid layouts across desktop, tablet, and mobile.
- **Database Management Tooling**: One-command fresh database cleanup and single Super Admin creation script (`npm run db:fresh`).

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database and Auth**: Supabase Postgres, Auth, and Row Level Security
- **Styling**: Vanilla CSS (Custom tokens, glassmorphism, responsive breakpoints)
- **Icons**: Lucide React
- **Authentication**: JWT HTTP-Only Cookies & Bcrypt.js

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18.18+ or v20+)
- Access to the shared HYNOX Supabase project

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Hynox-org/hynox_billdesk.git
cd hynox_billdesk
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your variables in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
JWT_SECRET="your_secure_random_jwt_secret_token"
```

### 4. Database and Super Admin

Schema migrations and Super Admin provisioning are managed in Supabase. Destructive browser-accessible database reset and seed endpoints are disabled.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application:
- **Landing Page**: `http://localhost:3000/`
- **Vendor Registration**: `http://localhost:3000/register`
- **Login Portal**: `http://localhost:3000/login`
- **Super Admin Dashboard**: `http://localhost:3000/admin`
- **Vendor POS Terminal**: `http://localhost:3000/dashboard/pos`

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js dev server |
| `npm run build` | Builds production bundle |
| `npm run start` | Starts production server |
| `npm run db:fresh` | Cleans database and sets up Super Admin |
| `npm run lint` | Runs ESLint checks |

---

## License

Private repository owned by [Hynox-org](https://github.com/Hynox-org).



<!-- npm run db:fresh -->
