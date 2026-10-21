'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  CreditCard,
  Users,
  Award,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  RefreshCw,
  Layers,
  ChevronRight,
  Receipt,
  Calendar,
  CheckCircle2,
  Settings,
} from 'lucide-react';

interface AnalyticsData {
  currency: string;
  businessName: string;
  businessType?: string;
  period: string;
  revenueSummary: {
    totalRevenue: number;
    totalSubtotal: number;
    totalTax: number;
    totalDiscount: number;
    orderCount: number;
    averageOrderValue: number;
    revenueGrowth: number;
    ordersGrowth: number;
    prevRevenue: number;
    prevCount: number;
  };
  dailyTimeline: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
    aov: number;
  }>;
  peakHour: { hour: number; hourLabel: string; orders: number; revenue: number } | null;
  topProducts: Array<{
    name: string;
    unitsSold: number;
    totalRevenue: number;
    percentage: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    label: string;
    count: number;
    total: number;
    percentage: number;
  }>;
  customerAnalytics: {
    totalCustomers: number;
    repeatCustomers: number;
    repeatRate: number;
    topCustomers: Array<{
      name: string;
      phone: string;
      ordersCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }>;
  };
  inventoryHealth: {
    totalProducts: number;
    trackedProducts: number;
    liveCounterProducts: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockList: Array<{ _id: string; name: string; sku: string; stockQuantity: number }>;
    outOfStockList: Array<{ _id: string; name: string; sku: string; stockQuantity: number }>;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    itemsCount: number;
  }>;
}

export default function VendorDashboardPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (selectedPeriod = period) => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/analytics?period=${selectedPeriod}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const currency = data?.currency || '$';

  // Helper for formatting growth
  const renderGrowthPill = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span className={`dashboard-kpi-growth ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {isPositive ? '+' : ''}{growth}%
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="dashboard-page-container">
        <div className="dashboard-hero-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '220px', height: '28px', background: 'var(--color-light-green)', borderRadius: '8px' }} />
            <div style={{ width: '160px', height: '16px', background: 'var(--color-soft-white)', borderRadius: '6px' }} />
          </div>
          <div style={{ width: '240px', height: '36px', background: 'var(--color-soft-white)', borderRadius: '10px' }} />
        </div>
        <div className="dashboard-kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-kpi-card" style={{ height: '140px', background: 'var(--bg-card)' }}>
              <div style={{ width: '100px', height: '14px', background: 'var(--color-soft-white)', borderRadius: '4px' }} />
              <div style={{ width: '140px', height: '36px', background: 'var(--color-light-green)', borderRadius: '8px', margin: '14px 0' }} />
              <div style={{ width: '80px', height: '12px', background: 'var(--color-soft-white)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate maximum revenue day for the timeline sparkline
  const maxDayRevenue = Math.max(1, ...(data?.dailyTimeline?.map((d) => d.revenue) || [1]));

  return (
    <div className="dashboard-page-container">
      {/* 1. Executive Top Header */}
      <section className="dashboard-hero-header" aria-label="Dashboard Overview Header">
        <div>
          <div className="dashboard-hero-greeting">
            <span className="dashboard-status-indicator">
              <span className="dashboard-pulse-dot" />
              Live Store Operations
            </span>
          </div>
          <h1 className="dashboard-hero-title" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>{data?.businessName || 'Business Dashboard'}</span>
            {data?.businessType && (
              <span className="dashboard-kpi-badge" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {data.businessType}
              </span>
            )}
          </h1>
          <p className="dashboard-hero-subtitle">
            Executive sales overview, operational metrics and real-time counter activity
          </p>
        </div>

        {/* Timeframe Filter Controls & Refresh */}
        <div className="dashboard-controls-cluster">
          <div className="dashboard-timeframe-pills" role="group" aria-label="Timeframe selection">
            {(
              [
                { key: 'today', label: 'Today' },
                { key: '7d', label: 'Last 7D' },
                { key: '30d', label: 'Last 30D' },
                { key: 'all', label: 'All Time' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setPeriod(btn.key)}
                className={`dashboard-timeframe-btn ${period === btn.key ? 'active' : ''}`}
                aria-pressed={period === btn.key}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            disabled={refreshing}
            className="dashboard-refresh-btn"
            title="Refresh analytics data"
            aria-label="Refresh analytics data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* 2. Operational Action Shortcuts Strip */}
      <section className="dashboard-shortcuts-grid" aria-label="Quick Actions">
        <Link href="/dashboard/pos" className="dashboard-shortcut-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="dashboard-shortcut-icon">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="dashboard-shortcut-title">Take New Order</div>
              <div className="dashboard-shortcut-desc">Launch rapid counter POS bill</div>
            </div>
          </div>
          <ArrowRight size={16} className="dashboard-shortcut-arrow" />
        </Link>

        <Link href="/dashboard/catalog" className="dashboard-shortcut-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="dashboard-shortcut-icon">
              <Layers size={22} />
            </div>
            <div>
              <div className="dashboard-shortcut-title">Manage Products</div>
              <div className="dashboard-shortcut-desc">Menu items, pricing &amp; stock</div>
            </div>
          </div>
          <ArrowRight size={16} className="dashboard-shortcut-arrow" />
        </Link>

        <Link href="/dashboard/orders" className="dashboard-shortcut-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="dashboard-shortcut-icon">
              <Receipt size={22} />
            </div>
            <div>
              <div className="dashboard-shortcut-title">Order Receipts</div>
              <div className="dashboard-shortcut-desc">Search, filter &amp; export bills</div>
            </div>
          </div>
          <ArrowRight size={16} className="dashboard-shortcut-arrow" />
        </Link>

        <Link href="/dashboard/settings" className="dashboard-shortcut-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="dashboard-shortcut-icon">
              <Settings size={22} />
            </div>
            <div>
              <div className="dashboard-shortcut-title">Store Settings</div>
              <div className="dashboard-shortcut-desc">Store profile, currency &amp; security</div>
            </div>
          </div>
          <ArrowRight size={16} className="dashboard-shortcut-arrow" />
        </Link>
      </section>

      {/* 3. Primary KPI Performance Stats (4 Cards) */}
      <section className="dashboard-kpi-grid" aria-label="Key Performance Indicators">
        {/* Card 1: Total Revenue */}
        <Link href="/dashboard/reports/revenue" className="dashboard-kpi-card">
          <div>
            <div className="dashboard-kpi-top">
              <span className="dashboard-kpi-label">Gross Revenue</span>
              <span className="dashboard-kpi-badge">
                <TrendingUp size={12} />
                Sales
              </span>
            </div>
            <div className="dashboard-kpi-value accent-primary">
              {currency}{data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {renderGrowthPill(data?.revenueSummary?.revenueGrowth ?? 0)}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>vs previous period</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalSubtotal?.toFixed(2) || '0.00'}</strong></span>
              <span>Tax: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalTax?.toFixed(2) || '0.00'}</strong></span>
            </div>
          </div>
          <div className="dashboard-kpi-footer">
            <span>View Revenue Analytics</span>
            <ChevronRight size={15} />
          </div>
        </Link>

        {/* Card 2: Total Orders */}
        <Link href="/dashboard/reports/orders" className="dashboard-kpi-card">
          <div>
            <div className="dashboard-kpi-top">
              <span className="dashboard-kpi-label">Total Orders</span>
              <span className="dashboard-kpi-badge">
                <ShoppingBag size={12} />
                Volume
              </span>
            </div>
            <div className="dashboard-kpi-value">
              {data?.revenueSummary?.orderCount || 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {renderGrowthPill(data?.revenueSummary?.ordersGrowth ?? 0)}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>processed orders</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Peak hour: <strong style={{ color: 'var(--text-main)' }}>{data?.peakHour ? `${data.peakHour.hourLabel} (${data.peakHour.orders} bills)` : 'Evenly spaced'}</strong>
            </div>
          </div>
          <div className="dashboard-kpi-footer">
            <span>View Orders Report</span>
            <ChevronRight size={15} />
          </div>
        </Link>

        {/* Card 3: Average Order Value (AOV) */}
        <Link href="/dashboard/reports/revenue" className="dashboard-kpi-card">
          <div>
            <div className="dashboard-kpi-top">
              <span className="dashboard-kpi-label">Average Order Value</span>
              <span className="dashboard-kpi-badge">
                <Award size={12} />
                AOV
              </span>
            </div>
            <div className="dashboard-kpi-value">
              {currency}{data?.revenueSummary?.averageOrderValue?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Average basket size per counter receipt
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total discounts:</span>
              <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalDiscount?.toFixed(2) || '0.00'}</strong>
            </div>
          </div>
          <div className="dashboard-kpi-footer">
            <span>View Ticket Size Trends</span>
            <ChevronRight size={15} />
          </div>
        </Link>

        {/* Card 4: Customer Base & Retention */}
        <Link href="/dashboard/reports/customers" className="dashboard-kpi-card">
          <div>
            <div className="dashboard-kpi-top">
              <span className="dashboard-kpi-label">Customer Reach</span>
              <span className="dashboard-kpi-badge">
                <Users size={12} />
                Patrons
              </span>
            </div>
            <div className="dashboard-kpi-value">
              {data?.customerAnalytics?.totalCustomers || 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="dashboard-kpi-growth positive">
                {data?.customerAnalytics?.repeatRate || 0}% Repeat Rate
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>loyalty engagement</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Repeat buyers: <strong style={{ color: 'var(--text-main)' }}>{data?.customerAnalytics?.repeatCustomers || 0}</strong></span>
              <span>Top spender: <strong style={{ color: 'var(--text-main)' }}>{data?.customerAnalytics?.topCustomers?.[0]?.name ? data.customerAnalytics.topCustomers[0].name.slice(0, 10) : '—'}</strong></span>
            </div>
          </div>
          <div className="dashboard-kpi-footer">
            <span>View Customer Directory</span>
            <ChevronRight size={15} />
          </div>
        </Link>
      </section>

      {/* 4. Deep Operational Analytics (2x2 Grid) */}
      <section className="dashboard-analytics-grid" aria-label="Deep Operational Analytics">
        {/* Card A: Top Ranked Products */}
        <Link href="/dashboard/reports/products" className="dashboard-analytics-card">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <Award size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Menu Champions &amp; Top Products</h2>
                  <p className="dashboard-analytics-subtitle">Highest volume and revenue generators</p>
                </div>
              </div>
              <span className="dashboard-kpi-badge">Top Sellers</span>
            </div>

            {data?.topProducts && data.topProducts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.topProducts.slice(0, 4).map((p, idx) => (
                  <div key={p.name} className="dashboard-ranked-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span className="dashboard-rank-pill">#{idx + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="dashboard-ranked-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div className="dashboard-ranked-qty">
                          {p.unitsSold} units sold ({p.percentage}% of total sales)
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-ranked-stats">
                      <div className="dashboard-ranked-rev">{currency}{p.totalRevenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No product sales recorded yet in this timeframe.
              </div>
            )}
          </div>

          <div className="dashboard-kpi-footer">
            <span>Open Comprehensive Product Report</span>
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Card B: Payment Settlements & Methods */}
        <Link href="/dashboard/reports/payments" className="dashboard-analytics-card">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Payment Settlements &amp; Channels</h2>
                  <p className="dashboard-analytics-subtitle">Counter cash vs digital &amp; online collections</p>
                </div>
              </div>
              <span className="dashboard-kpi-badge">Collections</span>
            </div>

            {data?.paymentBreakdown && data.paymentBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {data.paymentBreakdown.map((pm) => (
                  <div key={pm.method} className="dashboard-payment-row">
                    <div className="dashboard-payment-label-row">
                      <span className="dashboard-payment-name">{pm.label} ({pm.count} bills)</span>
                      <span className="dashboard-payment-total">
                        {currency}{pm.total.toFixed(2)} &bull; {pm.percentage}%
                      </span>
                    </div>
                    <div className="dashboard-progress-track">
                      <div
                        className="dashboard-progress-fill"
                        style={{
                          width: `${Math.min(100, pm.percentage)}%`,
                          background:
                            pm.method === 'PAID_CASH'
                              ? 'var(--primary)'
                              : pm.method === 'PAID_ONLINE'
                              ? '#0284c7'
                              : '#d97706',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No payment activity recorded yet.
              </div>
            )}
          </div>

          <div className="dashboard-kpi-footer">
            <span>Open Payment Settlements Report</span>
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Card C: Inventory & Stock Health */}
        <Link href="/dashboard/reports/inventory" className="dashboard-analytics-card">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <Package size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Catalog &amp; Inventory Health</h2>
                  <p className="dashboard-analytics-subtitle">Live stock counters, low items &amp; restock alerts</p>
                </div>
              </div>
              {(data?.inventoryHealth?.lowStockCount ?? 0) > 0 || (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? (
                <span className="dashboard-kpi-growth negative">Restock Needed</span>
              ) : (
                <span className="dashboard-kpi-growth positive">Stock Healthy</span>
              )}
            </div>

            <div className="dashboard-stock-grid">
              <div className="dashboard-stock-box">
                <div className="dashboard-stock-num">{data?.inventoryHealth?.totalProducts || 0}</div>
                <div className="dashboard-stock-title">Total Catalog Products</div>
              </div>

              <div className="dashboard-stock-box">
                <div className="dashboard-stock-num" style={{ color: 'var(--primary)' }}>
                  {data?.inventoryHealth?.liveCounterProducts || 0}
                </div>
                <div className="dashboard-stock-title">Fast POS Items</div>
              </div>

              <div className="dashboard-stock-box">
                <div className="dashboard-stock-num" style={{ color: (data?.inventoryHealth?.lowStockCount ?? 0) > 0 ? '#b91c1c' : 'var(--text-main)' }}>
                  {data?.inventoryHealth?.lowStockCount || 0}
                </div>
                <div className="dashboard-stock-title">Low Stock (&le; 5 units)</div>
              </div>

              <div className="dashboard-stock-box">
                <div className="dashboard-stock-num" style={{ color: (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? '#b91c1c' : 'var(--text-main)' }}>
                  {data?.inventoryHealth?.outOfStockCount || 0}
                </div>
                <div className="dashboard-stock-title">Out of Stock</div>
              </div>
            </div>

            {(data?.inventoryHealth?.lowStockCount ?? 0) > 0 || (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? (
              <div className="dashboard-alert-banner">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>
                  {(data?.inventoryHealth?.outOfStockCount ?? 0) > 0
                    ? `${data?.inventoryHealth?.outOfStockCount} item(s) are completely out of stock.`
                    : `${data?.inventoryHealth?.lowStockCount} item(s) are running low on inventory.`}
                </span>
              </div>
            ) : (
              <div className="dashboard-alert-banner-ok">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>All tracked catalog items are currently within safe inventory thresholds.</span>
              </div>
            )}
          </div>

          <div className="dashboard-kpi-footer">
            <span>Open Inventory Health Manager</span>
            <ChevronRight size={16} />
          </div>
        </Link>

        {/* Card D: Daily Sales Timeline Activity */}
        <Link href="/dashboard/reports/revenue" className="dashboard-analytics-card">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <Calendar size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Daily Sales Activity Timeline</h2>
                  <p className="dashboard-analytics-subtitle">Progression and revenue distribution over time</p>
                </div>
              </div>
              <span className="dashboard-kpi-badge">Timeline</span>
            </div>

            {data?.dailyTimeline && data.dailyTimeline.length > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '110px', padding: '10px 0 6px', overflowX: 'auto' }}>
                  {data.dailyTimeline.slice(-14).map((d) => {
                    const heightPercent = Math.max(8, Math.round((d.revenue / maxDayRevenue) * 100));
                    return (
                      <div key={d.date} style={{ flex: 1, minWidth: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }} title={`${d.label}: ${currency}${d.revenue.toFixed(2)} (${d.orders} orders)`}>
                        <div
                          style={{
                            width: '100%',
                            height: `${heightPercent}%`,
                            background: d.revenue > 0 ? 'var(--primary)' : 'var(--color-light-green)',
                            borderRadius: '4px 4px 2px 2px',
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {d.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Recent 14-day sales cadence</span>
                  <span>Highest day: <strong style={{ color: 'var(--primary)' }}>{currency}{maxDayRevenue.toFixed(2)}</strong></span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No daily activity recorded for this selected period.
              </div>
            )}
          </div>

          <div className="dashboard-kpi-footer">
            <span>Explore Full Daily Revenue Breakdown</span>
            <ChevronRight size={16} />
          </div>
        </Link>
      </section>

      {/* 5. Recent Orders Live Feed */}
      <section className="dashboard-recent-orders-card" aria-label="Recent Orders Feed">
        <div className="dashboard-recent-header">
          <div>
            <h2 className="dashboard-recent-title">Recent Orders Feed</h2>
            <p className="dashboard-recent-subtitle">Latest counter bills and customer transactions</p>
          </div>
          <Link href="/dashboard/orders" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>View All Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {data?.recentOrders && data.recentOrders.length > 0 ? (
          <>
            {/* Desktop Table View (>768px) */}
            <div className="dashboard-desktop-table-wrap">
              <table className="dashboard-data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name &amp; Phone</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-main)' }}>
                        <Link href={`/receipt/${o.orderNumber}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{o.customerName || 'Valued Customer'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{o.customerPhone || 'Counter Walk-in'}</div>
                      </td>
                      <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                        {o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                        {currency}{o.totalAmount.toFixed(2)}
                      </td>
                      <td>
                        <span className="dashboard-kpi-badge">
                          {o.paymentStatus === 'PAID_CASH'
                            ? 'Cash'
                            : o.paymentStatus === 'PAID_ONLINE'
                            ? 'Online / UPI'
                            : o.paymentStatus}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/receipt/${o.orderNumber}`} className="btn btn-secondary btn-sm" style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Row View (<=768px) */}
            <div className="dashboard-mobile-orders-list">
              {data.recentOrders.map((o) => (
                <Link key={o._id} href={`/receipt/${o.orderNumber}`} className="dashboard-mobile-order-row">
                  <div className="dashboard-mobile-order-top">
                    <span className="dashboard-mobile-order-num">#{o.orderNumber}</span>
                    <span className="dashboard-mobile-order-time">
                      {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="dashboard-mobile-order-body">
                    <div>
                      <div className="dashboard-mobile-cust-name">{o.customerName || 'Valued Customer'}</div>
                      <div className="dashboard-mobile-cust-phone">{o.customerPhone || 'Counter Walk-in'}</div>
                    </div>
                    <span className="dashboard-kpi-badge">
                      {o.paymentStatus === 'PAID_CASH'
                        ? 'Cash'
                        : o.paymentStatus === 'PAID_ONLINE'
                        ? 'Online / UPI'
                        : o.paymentStatus}
                    </span>
                  </div>

                  <div className="dashboard-mobile-order-bottom">
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="dashboard-mobile-order-total">{currency}{o.totalAmount.toFixed(2)}</span>
                      <ChevronRight size={16} style={{ color: 'var(--primary)' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 12px' }}>No orders found for this timeframe</p>
            <Link href="/dashboard/pos" className="btn btn-primary btn-sm">
              <ShoppingBag size={15} />
              <span>Create First POS Order</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
