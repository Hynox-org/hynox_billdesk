'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Phone,
} from 'lucide-react';

export default function OrdersReportPage() {
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
  const hourly = data?.hourlyDistribution || [];
  const peakHour = data?.peakHour;
  const recentOrders = data?.recentOrders || [];

  const maxHourlyOrders = Math.max(...hourly.map((h: any) => h.orders), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginBottom: '8px',
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Orders Volume & Fulfillment Report
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Analyze traffic peaks, hourly ticket flow, payment completion, and counter volume
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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Completed Tickets</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {rev.orderCount || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Processed through POS terminal
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Peak Traffic Hour</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--emerald)' }}>
            {peakHour ? peakHour.hourLabel : 'Consistent'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {peakHour ? `${peakHour.orders} tickets generated in this window` : 'No distinct peak hour'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Order Growth Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (rev.ordersGrowth || 0) >= 0 ? 'var(--primary)' : '#f87171' }}>
            {(rev.ordersGrowth || 0) >= 0 ? '+' : ''}{rev.ordersGrowth || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Compared to previous cycle
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Average Order Size</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}{(rev.averageOrderValue || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Average revenue per ticket
          </div>
        </div>
      </div>

      {/* Hourly Heatmap & Distribution */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
          24-Hour Traffic & Peak Distribution
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Understand your store's busiest hours to optimize counter staffing and food preparation.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(44px, 1fr))', gap: '8px' }}>
          {hourly.map((h: any) => {
            const heightPercent = Math.max(8, Math.round((h.orders / maxHourlyOrders) * 100));
            const isPeak = peakHour && peakHour.hour === h.hour && h.orders > 0;
            return (
              <div
                key={h.hour}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '140px',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isPeak ? 'var(--whatsapp)' : 'var(--text-secondary)' }}>
                  {h.orders > 0 ? h.orders : '0'}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    maxHeight: '90px',
                    minHeight: '6px',
                    borderRadius: '4px',
                    background: isPeak
                      ? 'var(--primary)'
                      : h.orders > 0
                      ? 'var(--primary-light)'
                      : 'var(--border-subtle)',
                    boxShadow: isPeak ? '0 0 10px var(--primary-glow)' : 'none',
                    transition: 'height 0.2s ease',
                  }}
                  title={`${h.hourLabel}: ${h.orders} orders (${currency}${h.revenue.toFixed(2)})`}
                />
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {h.hour % 3 === 0 ? h.hourLabel : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Audit Table */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Orders Log (Current Period)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--emerald-deep)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Order ID</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp Phone</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Items Count</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Billed</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Method</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                    #{o.orderNumber}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {o.customerName}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {o.customerPhone}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {o.itemsCount}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--emerald)' }}>
                    {currency}{o.totalAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                      {o.paymentStatus === 'PAID_CASH' ? 'Cash' : o.paymentStatus === 'PAID_ONLINE' ? 'Online' : o.paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
