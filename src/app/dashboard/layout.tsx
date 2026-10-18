'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
  LayoutDashboard,
  ShoppingBag,
  Layers,
  History,
  Settings,
  LogOut,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  LockKeyhole,
} from 'lucide-react';
import CountryDropdown from '@/components/CountryDropdown';

interface AuthState {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  tenant: {
    id: string;
    businessName: string;
    slug: string;
    phone: string;
    currency: string;
    plan: string;
    status: string;
    daysRemaining: number;
    isExpired: boolean;
    isPro: boolean;
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.role === 'SUPER_ADMIN') {
          router.push('/admin');
          return;
        }
        setAuth(data);
        if (data.tenant?.isExpired && pathname !== '/dashboard/paywall') {
          router.push('/dashboard/paywall');
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseGlow 1.5s infinite' }}>
          <Zap size={24} color="#fff" />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading store workspace...</p>
      </div>
    );
  }

  const tenant = auth?.tenant;
  const isPaywallPage = pathname === '/dashboard/paywall';
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/reports');
  const isPOS = pathname === '/dashboard/pos';
  const isCatalog = pathname === '/dashboard/catalog';
  const isOrders = pathname === '/dashboard/orders';
  const isSettings = pathname === '/dashboard/settings';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Trial Warning Banner */}
      {tenant && !tenant.isPro && !tenant.isExpired && tenant.daysRemaining <= 3 && !isPaywallPage && (
        <div className="dashboard-trial-banner">
          <div className="dashboard-trial-text">
            <AlertTriangle size={15} />
            <span>Notice: Only {tenant.daysRemaining} day{tenant.daysRemaining === 1 ? '' : 's'} remaining in your free trial!</span>
          </div>
          <Link href="/dashboard/paywall" className="dashboard-trial-link">
            Upgrade to Pro <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Top Header */}
      <header className="dashboard-header">
        {/* Brand & Plan */}
        <div className="dashboard-brand-wrapper">
          <Link href="/dashboard" className="dashboard-brand-link">
            <div className="dashboard-brand-icon">
              <Zap size={18} />
            </div>
            <div className="dashboard-brand-info">
              <div className="dashboard-brand-name">
                {tenant?.businessName || 'My Business'}
              </div>
              <div className="dashboard-brand-subtitle">
                Store Workspace • {tenant?.currency || '$'}
              </div>
            </div>
          </Link>

          {/* Trial / Plan Badge */}
          {tenant && (
            <div className="dashboard-badge-container">
              {tenant.isPro ? (
                <span className="badge badge-pro">
                  <Sparkles size={11} />
                  <span className="badge-text-full">PRO Plan</span>
                  <span className="badge-text-short">PRO</span>
                </span>
              ) : tenant.isExpired ? (
                <span className="badge badge-expired">
                  <ShieldAlert size={11} />
                  <span className="badge-text-full">Trial Expired</span>
                  <span className="badge-text-short">Expired</span>
                </span>
              ) : (
                <span className="badge badge-trial">
                  <span className="badge-text-full">{tenant.daysRemaining} Days Left</span>
                  <span className="badge-text-short">{tenant.daysRemaining}d</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Desktop Nav - visible on large screens (>1080px) */}
        {!tenant?.isExpired && (
          <nav className="dashboard-nav" aria-label="Desktop primary navigation">
            <Link href="/dashboard" className={`btn btn-sm ${isDashboard ? 'btn-primary' : 'btn-secondary'}`}>
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/pos" className={`btn btn-sm ${isPOS ? 'btn-primary' : 'btn-secondary'}`}>
              <ShoppingBag size={15} />
              <span>New Order</span>
            </Link>
            <Link href="/dashboard/catalog" className={`btn btn-sm ${isCatalog ? 'btn-primary' : 'btn-secondary'}`}>
              <Layers size={15} />
              <span>Products &amp; Menu</span>
            </Link>
            <Link href="/dashboard/orders" className={`btn btn-sm ${isOrders ? 'btn-primary' : 'btn-secondary'}`}>
              <History size={15} />
              <span>Order History</span>
            </Link>
            <Link href="/dashboard/settings" className={`btn btn-sm ${isSettings ? 'btn-primary' : 'btn-secondary'}`}>
              <Settings size={15} />
              <span>Settings</span>
            </Link>
          </nav>
        )}

        {/* Right Actions: Region + Logout (Theme switcher hidden) */}
        <div className="dashboard-right-actions">
          <CountryDropdown />
          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm dashboard-logout-btn"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span className="dashboard-logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {children}
      </main>

      {/* Floating Bottom Nav - 5 core destinations on tablet & mobile */}
      {!tenant?.isExpired && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <Link href="/dashboard" className={`bottom-nav-item${isDashboard ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><LayoutDashboard size={20} /></div>
            <span className="bottom-nav-label">Dashboard</span>
          </Link>
          <Link href="/dashboard/pos" className={`bottom-nav-item${isPOS ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><ShoppingBag size={20} /></div>
            <span className="bottom-nav-label">New Order</span>
          </Link>
          <Link href="/dashboard/catalog" className={`bottom-nav-item${isCatalog ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><Layers size={20} /></div>
            <span className="bottom-nav-label">Products</span>
          </Link>
          <Link href="/dashboard/orders" className={`bottom-nav-item${isOrders ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><History size={20} /></div>
            <span className="bottom-nav-label">History</span>
          </Link>
          <Link href="/dashboard/settings" className={`bottom-nav-item${isSettings ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><Settings size={20} /></div>
            <span className="bottom-nav-label">Settings</span>
          </Link>
        </nav>
      )}

      {/* Paywall bottom nav */}
      {tenant?.isExpired && (
        <nav className="bottom-nav bottom-nav-paywall" aria-label="Mobile navigation">
          <Link href="/dashboard/paywall" className={`bottom-nav-item${isPaywallPage ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><LockKeyhole size={20} /></div>
            <span className="bottom-nav-label">Upgrade</span>
          </Link>
          <button onClick={handleLogout} className="bottom-nav-item bottom-nav-btn" aria-label="Logout">
            <div className="bottom-nav-icon"><LogOut size={20} /></div>
            <span className="bottom-nav-label">Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
}
