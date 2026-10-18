'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
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
import ThemeToggle from '@/components/ThemeToggle';
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
  const isPOS = pathname === '/dashboard/pos' || pathname === '/dashboard';
  const isCatalog = pathname === '/dashboard/catalog';
  const isOrders = pathname === '/dashboard/orders';
  const isSettings = pathname === '/dashboard/settings';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Trial Warning Banner */}
      {tenant && !tenant.isPro && !tenant.isExpired && tenant.daysRemaining <= 3 && !isPaywallPage && (
        <div style={{ background: 'linear-gradient(90deg, #064e3b 0%, #047857 100%)', color: '#ecfdf5', padding: '8px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, borderBottom: '1px solid rgba(74, 222, 128, 0.3)' }}>
          <AlertTriangle size={16} />
          <span>Notice: Only {tenant.daysRemaining} day{tenant.daysRemaining === 1 ? '' : 's'} remaining in your free trial!</span>
          <Link href="/dashboard/paywall" style={{ textDecoration: 'underline', marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            Upgrade to Pro <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Top Header */}
      <header className="dashboard-header" style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-header)', backdropFilter: 'blur(16px)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40, flexWrap: 'wrap', gap: '8px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard/pos" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #25D366 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px var(--whatsapp-glow)' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2, color: 'var(--text-main)' }}>
                {tenant?.businessName || 'My Business'}
              </div>
              <div className="dashboard-brand-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Store Workspace • {tenant?.currency || '$'}
              </div>
            </div>
          </Link>

          {/* Trial Badge */}
          {tenant && (
            <div>
              {tenant.isPro ? (
                <span className="badge badge-pro"><Sparkles size={12} /> PRO Plan</span>
              ) : tenant.isExpired ? (
                <span className="badge badge-expired"><ShieldAlert size={12} /> Trial Expired</span>
              ) : (
                <span className="badge badge-trial">{tenant.daysRemaining} Days Left</span>
              )}
            </div>
          )}
        </div>

        {/* Desktop Nav � hidden on tablet/mobile */}
        {!tenant?.isExpired && (
          <nav className="dashboard-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/dashboard/pos" className={`btn btn-sm ${isPOS ? 'btn-primary' : 'btn-secondary'}`}>
              <ShoppingBag size={16} /> New Order
            </Link>
            <Link href="/dashboard/catalog" className={`btn btn-sm ${isCatalog ? 'btn-primary' : 'btn-secondary'}`}>
              <Layers size={16} /> Products & Menu
            </Link>
            <Link href="/dashboard/orders" className={`btn btn-sm ${isOrders ? 'btn-primary' : 'btn-secondary'}`}>
              <History size={16} /> Order History
            </Link>
            <Link href="/dashboard/settings" className={`btn btn-sm ${isSettings ? 'btn-primary' : 'btn-secondary'}`}>
              <Settings size={16} /> Settings
            </Link>
          </nav>
        )}

        {/* Right: Country + Theme + Logout */}
        <div className="dashboard-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CountryDropdown />
          <ThemeToggle />
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out" style={{ padding: '8px 12px' }}>
            <LogOut size={16} />
            <span className="dashboard-brand-subtitle">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main" style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>

      {/* Floating Bottom Nav - tablet & mobile only, active vendor */}
      {!tenant?.isExpired && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <Link href="/dashboard/pos" className={`bottom-nav-item${isPOS ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><ShoppingBag size={22} /></div>
            <span className="bottom-nav-label">New Order</span>
          </Link>
          <Link href="/dashboard/catalog" className={`bottom-nav-item${isCatalog ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><Layers size={22} /></div>
            <span className="bottom-nav-label">Products</span>
          </Link>
          <Link href="/dashboard/orders" className={`bottom-nav-item${isOrders ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><History size={22} /></div>
            <span className="bottom-nav-label">History</span>
          </Link>
          <Link href="/dashboard/settings" className={`bottom-nav-item${isSettings ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><Settings size={22} /></div>
            <span className="bottom-nav-label">Settings</span>
          </Link>
          <button onClick={handleLogout} className="bottom-nav-item bottom-nav-btn" aria-label="Logout">
            <div className="bottom-nav-icon"><LogOut size={22} /></div>
            <span className="bottom-nav-label">Logout</span>
          </button>
        </nav>
      )}

      {/* Paywall bottom nav */}
      {tenant?.isExpired && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <Link href="/dashboard/paywall" className={`bottom-nav-item${isPaywallPage ? ' active' : ''}`}>
            <div className="bottom-nav-icon"><LockKeyhole size={22} /></div>
            <span className="bottom-nav-label">Upgrade</span>
          </Link>
          <button onClick={handleLogout} className="bottom-nav-item bottom-nav-btn" aria-label="Logout">
            <div className="bottom-nav-icon"><LogOut size={22} /></div>
            <span className="bottom-nav-label">Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
}
