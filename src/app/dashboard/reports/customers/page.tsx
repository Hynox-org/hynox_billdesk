'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Printer,
  Phone,
  MessageSquare,
  Award,
  TrendingUp,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function CustomersReportPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period]);

  const currency = data?.currency || '$';
  const cust = data?.customerAnalytics || {};
  const topCustomers = cust.topCustomers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Link
              href="/dashboard/reports"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.85rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> Reports Hub
            </Link>
            <span style={{ color: 'var(--border-medium)', fontSize: '0.8rem' }}>/</span>
            <Link
              href="/dashboard"
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(20, 184, 166, 0.15)',
                color: '#2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Customer Insights & Retention Report
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Analyze repeat visits, patron loyalty, top spenders, and WhatsApp contact engagement
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-input)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {(
              [
                { key: 'today', label: 'Today' },
                { key: '7d', label: 'Last 7 Days' },
                { key: '30d', label: 'Last 30 Days' },
                { key: 'all', label: 'All Time' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setPeriod(btn.key)}
                className={`btn btn-sm ${period === btn.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Unique Customers</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {cust.totalCustomers || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Unique phone numbers billed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Repeat Patrons</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
            {cust.repeatCustomers || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Customers with &gt; 1 order
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Customer Retention Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--whatsapp)' }}>
            {cust.repeatRate || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Patron return frequency
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Top Patron Spend</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}{(topCustomers[0]?.totalSpent || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {topCustomers[0]?.name || '—'} ({topCustomers[0]?.ordersCount || 0} orders)
          </div>
        </div>
      </div>

      {/* Top Customers Leaderboard */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Top Customers Leaderboard (By Cumulative Spend)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--emerald-deep)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, width: '60px' }}>Rank</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp Number</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Orders Placed</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spent</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Average per Order</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c: any, idx: number) => {
                const aov = c.ordersCount > 0 ? (c.totalSpent / c.ordersCount).toFixed(2) : '0.00';
                return (
                  <tr key={c.phone + idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: idx < 3 ? 'var(--whatsapp)' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {c.phone}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <span className="badge badge-trial" style={{ fontSize: '0.75rem' }}>
                        {c.ordersCount} order{c.ordersCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--emerald)' }}>
                      {currency}{c.totalSpent.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                      {currency}{aov}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(c.lastOrderDate).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
