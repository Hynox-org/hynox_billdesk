'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Store,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Search,
  MessageSquare,
  ExternalLink,
  DollarSign,
  TrendingUp,
  LogOut,
  RefreshCw,
  Plus,
  Ban,
  Check,
} from 'lucide-react';

interface TenantItem {
  id: string;
  businessName: string;
  slug: string;
  phone: string;
  currency: string;
  address: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  plan: 'FREE_TRIAL' | 'PRO';
  trialStartsAt: string;
  trialEndsAt: string;
  daysRemaining: number;
  isExpired: boolean;
  isPro: boolean;
  createdAt: string;
  owner: {
    fullName: string;
    email: string;
    isActive: boolean;
  } | null;
  productCount: number;
  totalOrders: number;
  totalGmv: number;
}

interface Stats {
  totalTenants: number;
  activeTrials: number;
  expiredTrials: number;
  proSubscribers: number;
  totalOrders: number;
  totalGmv: number;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [router]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAction = async (tenantId: string, action: string, extra?: Record<string, any>) => {
    setActionLoading(`${tenantId}-${action}`);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify(data.message || 'Action completed successfully');
      fetchAdminData();
    } catch (err: any) {
      notify(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.businessName.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.toLowerCase().includes(search.toLowerCase()) ||
      t.owner?.email.toLowerCase().includes(search.toLowerCase()) ||
      t.owner?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Header */}
      <header
        className="admin-header"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-header)',
          backdropFilter: 'blur(16px)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Super Admin Control Plane
            </div>
            <div className="admin-header-title-sub" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Global Multi-Tenant SaaS Oversight & Subscription Manager
            </div>
          </div>
        </div>

        <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchAdminData}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Admin Surface */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {notification && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
            }}
          >
            <Check size={18} />
            <span>{notification}</span>
          </div>
        )}

        {/* Global KPIs */}
        {stats && (
          <div
            className="admin-kpi-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Total Tenants
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalTenants}</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--whatsapp)', marginBottom: '6px' }}>
                Active Free Trials
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--whatsapp)' }}>
                {stats.activeTrials}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Expired Trials (Paywall)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--moss-badge-text)' }}>
                {stats.expiredTrials}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--emerald)', marginBottom: '6px' }}>
                Pro Subscribers
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
                {stats.proSubscribers}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '6px' }}>
                Platform Orders
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                {stats.totalOrders}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--whatsapp)', marginBottom: '6px' }}>
                Total Merchant GMV
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--whatsapp)' }}>
                ${stats.totalGmv.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px' }}
              placeholder="Filter businesses by name, phone, or owner email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tenants Table */}
        <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Registered Businesses & Free Trial Monitoring ({filteredTenants.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading tenants...
            </div>
          ) : filteredTenants.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No tenants matched the search criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--emerald-deep)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Business & Owner</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>WhatsApp Contact</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Plan & Status</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Trial Countdown</th>
                    <th className="admin-col-stats" style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>Items / Orders</th>
                    <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      Admin Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.businessName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {t.owner?.fullName} • {t.owner?.email}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <a
                          href={`https://wa.me/${t.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hello ${t.businessName}, this is HYNOX Billing Super Admin regarding your account.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--whatsapp)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <MessageSquare size={13} /> {t.phone} <ExternalLink size={11} />
                        </a>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {t.isPro ? (
                            <span className="badge badge-pro">PRO</span>
                          ) : (
                            <span className="badge badge-trial">Trial</span>
                          )}

                          {t.status === 'EXPIRED' || t.isExpired ? (
                            <span className="badge badge-expired">Expired</span>
                          ) : t.status === 'SUSPENDED' ? (
                            <span className="badge badge-expired">Suspended</span>
                          ) : (
                            <span className="badge badge-pro" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                              Active
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {t.isPro ? (
                          <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>Unlimited Pro</span>
                        ) : t.isExpired ? (
                          <span style={{ color: 'var(--moss-badge-text)', fontWeight: 700 }}>0 Days (Locked)</span>
                        ) : (
                          <div>
                            <span style={{ color: 'var(--whatsapp)', fontWeight: 700 }}>
                              {t.daysRemaining} days remaining
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Ends {new Date(t.trialEndsAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="admin-col-stats" style={{ padding: '14px 18px' }}>
                        <div>{t.productCount} products</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {t.totalOrders} orders ({t.currency || '$'}{t.totalGmv.toFixed(2)})
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {/* Extend Trial */}
                          <button
                            type="button"
                            onClick={() => handleAction(t.id, 'EXTEND_TRIAL', { days: 15 })}
                            disabled={actionLoading === `${t.id}-EXTEND_TRIAL`}
                            className="btn btn-secondary btn-sm"
                            title="Add +15 days to trial and reactivate"
                            style={{ fontSize: '0.75rem', padding: '5px 9px' }}
                          >
                            <Plus size={12} /> +15d Trial
                          </button>

                          {/* Activate Pro */}
                          {!t.isPro ? (
                            <button
                              type="button"
                              onClick={() => handleAction(t.id, 'ACTIVATE_PRO')}
                              disabled={actionLoading === `${t.id}-ACTIVATE_PRO`}
                              className="btn btn-primary btn-sm"
                              title="Manually upgrade to Pro plan"
                              style={{ fontSize: '0.75rem', padding: '5px 9px' }}
                            >
                              <Sparkles size={12} /> Activate Pro
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAction(t.id, 'DOWNGRADE_TRIAL')}
                              disabled={actionLoading === `${t.id}-DOWNGRADE_TRIAL`}
                              className="btn btn-secondary btn-sm"
                              title="Revert back to Free Trial"
                              style={{ fontSize: '0.75rem', padding: '5px 9px' }}
                            >
                              Downgrade
                            </button>
                          )}

                          {/* Suspend / Reactivate */}
                          {t.status === 'SUSPENDED' ? (
                            <button
                              type="button"
                              onClick={() => handleAction(t.id, 'SET_STATUS', { status: 'ACTIVE' })}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '5px 9px', color: 'var(--emerald)' }}
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAction(t.id, 'SET_STATUS', { status: 'SUSPENDED' })}
                              className="btn btn-danger btn-sm"
                              title="Suspend this tenant"
                              style={{ fontSize: '0.75rem', padding: '5px 9px' }}
                            >
                              <Ban size={12} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
