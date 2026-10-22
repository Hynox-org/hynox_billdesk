'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Printer,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';

export default function PaymentsReportPage() {
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
  const payments = data?.paymentBreakdown || [];
  const totalRevenue = data?.revenueSummary?.totalRevenue || 0;
  const totalOrders = data?.revenueSummary?.orderCount || 0;

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
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Payment Methods & Settlement Report
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Audit cash reconciliations, online payment receipts, and collection settlement ratios
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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Collections Billed</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
            {currency}{totalRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across all payment channels
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Cash In Hand</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}
            {(payments.find((p: any) => p.method === 'PAID_CASH')?.total || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Physical cash register collections
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Online & UPI Settled</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>
            {currency}
            {(payments.find((p: any) => p.method === 'PAID_ONLINE')?.total || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Digital payment transactions
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Transactions Count</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalOrders}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Total billed customer checkouts
          </div>
        </div>
      </div>

      {/* Payment Channel Split Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {payments.map((pm: any) => (
          <div
            key={pm.method}
            className="glass-panel"
            style={{
              padding: '22px',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  {pm.label}
                </span>
                <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                  {pm.percentage}% Share
                </span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)', marginBottom: '6px' }}>
                {currency}{pm.total.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {pm.count} transaction{pm.count === 1 ? '' : 's'} processed
              </div>
            </div>

            <div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pm.percentage}%`,
                    height: '100%',
                    background:
                      pm.method === 'PAID_CASH'
                        ? 'var(--primary)'
                        : pm.method === 'PAID_ONLINE'
                        ? '#3b82f6'
                        : '#eab308',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reconciliation Table */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Payment Method Reconciliation Ledger
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--emerald-deep)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Method</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Transactions</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Collected</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Average Ticket Size</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pm: any) => {
                const aov = pm.count > 0 ? (pm.total / pm.count).toFixed(2) : '0.00';
                return (
                  <tr key={pm.method} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {pm.label}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {pm.count}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--emerald)' }}>
                      {currency}{pm.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                      {currency}{aov}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {pm.percentage}%
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
