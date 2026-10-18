# Hynox BillDesk

> Multi-Tenant Cloud POS & Instant WhatsApp E-Receipt SaaS Platform.

Built with **Next.js (App Router)**, **TypeScript**, **MongoDB Atlas (Mongoose)**, and **Vanilla CSS**. Designed with rich aesthetics, curated green color palettes, full dark/light theme support, and responsive floating bottom navigation for mobile and tablet devices.

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
- **Database**: MongoDB Atlas via Mongoose
- **Styling**: Vanilla CSS (Custom tokens, glassmorphism, responsive breakpoints)
- **Icons**: Lucide React
- **Authentication**: JWT HTTP-Only Cookies & Bcrypt.js

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18.18+ or v20+)
- MongoDB Atlas Cluster (or local MongoDB instance)

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
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net"
MONGODB_DB_NAME="whatsapp_saas"
JWT_SECRET="your_secure_random_jwt_secret_token"
```

> **Note for MongoDB Atlas**: Ensure your IP address (or `0.0.0.0/0`) is added to your MongoDB Atlas cluster's **Network Access** list.

### 4. Initialize Database & Super Admin

Run the database setup script to purge dummy data and create the primary Super Admin account:

```bash
npm run db:fresh
```

Default Super Admin Credentials created:
- **Email**: `admin@saas.com`
- **Password**: `admin123456`

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
