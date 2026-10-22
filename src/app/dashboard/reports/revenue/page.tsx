'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeft,
  Calendar,
  Download,
  Printer,
  DollarSign,
  Percent,
  Receipt,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

export default function RevenueReportPage() {
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
  const rev = data?.revenueSummary || {};
  const timeline = data?.dailyTimeline || [];

  const maxDailyRevenue = Math.max(...timeline.map((t: any) => t.revenue), 1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back button & Header */}
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
                background: 'var(--color-light-green)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Revenue & Sales Report
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Comprehensive revenue auditing, gross sales, taxes, discounts, and AOV breakdown
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Action */}
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
            onClick={handlePrint}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Gross Revenue</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
            {currency}{(rev.totalRevenue || 0).toFixed(2)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', marginTop: '6px', color: (rev.revenueGrowth || 0) >= 0 ? 'var(--primary)' : '#f87171' }}>
            <ArrowUpRight size={14} />
            <span>{(rev.revenueGrowth || 0) >= 0 ? '+' : ''}{rev.revenueGrowth || 0}% vs previous</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Subtotal (Net Items)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}{(rev.totalSubtotal || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Item catalog sales
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Average Order Value (AOV)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}{(rev.averageOrderValue || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Across {rev.orderCount || 0} tickets
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tax & Discounts</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Tax: {currency}{(rev.totalTax || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#f87171', marginTop: '4px' }}>
            Discounts: -{currency}{(rev.totalDiscount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar Chart */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '18px' }}>
          Revenue Trend by Day
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {timeline.map((t: any) => {
            const barWidth = Math.max(2, Math.round((t.revenue / maxDailyRevenue) * 100));
            return (
              <div key={t.date} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 140px', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {t.label}
                </div>
                <div style={{ width: '100%', height: '14px', background: 'var(--border-subtle)', borderRadius: '7px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: 'var(--primary)',
                      borderRadius: '7px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.88rem', fontWeight: 700, color: 'var(--emerald)' }}>
                  {currency}{t.revenue.toFixed(2)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>
                    ({t.orders} ord)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Breakdown Data Table */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Detailed Timeline Ledger
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--emerald-deep)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Orders Count</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Gross Revenue</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Average Order Value</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Share %</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((t: any) => {
                const share = (rev.totalRevenue || 0) > 0 ? ((t.revenue / rev.totalRevenue) * 100).toFixed(1) : '0';
                return (
                  <tr key={t.date} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {t.label} ({t.date})
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {t.orders}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--emerald)' }}>
                      {currency}{t.revenue.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>
                      {currency}{t.aov.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {share}%
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
