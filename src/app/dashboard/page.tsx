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
  BarChart3,
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

  // Visualization calculations & sparkline data
  const revenueTrendPoints = data?.dailyTimeline?.map((d) => d.revenue) || [0];
  const ordersTrendPoints = data?.dailyTimeline?.map((d) => d.orders) || [0];
  const maxDayRevenue = Math.max(1, ...(data?.dailyTimeline?.map((d) => d.revenue) || [1]));
  const maxDayOrders = Math.max(1, ...(data?.dailyTimeline?.map((d) => d.orders) || [1]));
  const totalTimelineRev = data?.dailyTimeline?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const avgDayRevenue = data?.dailyTimeline && data.dailyTimeline.length > 0 ? totalTimelineRev / data.dailyTimeline.length : 0;
  const avgLinePercent = Math.min(90, Math.max(10, Math.round((avgDayRevenue / maxDayRevenue) * 100)));

  // Sparkline area & path computation
  const getAreaSparkline = (points: number[], width = 220, height = 44) => {
    if (!points || points.length === 0) return { linePath: '', areaPath: '', lastX: 0, lastY: 0 };
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const padding = 4;
    const availHeight = height - padding * 2;

    const coords = points.map((val, idx) => {
      const x = points.length === 1 ? width / 2 : (idx / (points.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * availHeight;
      return { x, y };
    });

    if (coords.length === 1) {
      return {
        linePath: `M 0,${coords[0].y} L ${width},${coords[0].y}`,
        areaPath: `M 0,${coords[0].y} L ${width},${coords[0].y} L ${width},${height} L 0,${height} Z`,
        lastX: coords[0].x,
        lastY: coords[0].y,
      };
    }

    const linePath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
    const lastPt = coords[coords.length - 1] || { x: width, y: height / 2 };

    return { linePath, areaPath, lastX: lastPt.x, lastY: lastPt.y };
  };

  const { linePath, areaPath, lastX, lastY } = getAreaSparkline(revenueTrendPoints.slice(-14), 220, 44);

  // Circular Retention Gauge for Customer Reach
  const renderRetentionRing = (pct: number) => {
    const clampedPct = Math.min(100, Math.max(0, pct));
    const radius = 20;
    const circumference = 2 * Math.PI * radius; // ~125.66
    const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="transparent"
            stroke="var(--color-light-green)"
            strokeWidth="5"
          />
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
            {clampedPct}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Repeat Customer Rate
          </div>
        </div>
      </div>
    );
  };

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

        <Link href="/dashboard/reports" className="dashboard-shortcut-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="dashboard-shortcut-icon">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="dashboard-shortcut-title">Business Reports</div>
              <div className="dashboard-shortcut-desc">Specialized statements &amp; audits</div>
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

      {/* 3. Primary KPI Performance Stats (Redesigned 4 Stat Panels) */}
      <section className="dashboard-kpi-grid" aria-label="Key Performance Indicators">
        {/* Card 1: Total Revenue */}
        <div className="dashboard-kpi-card is-static">
          <div>
            <div className="dashboard-kpi-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="dashboard-kpi-icon-pill">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="dashboard-kpi-label">Gross Revenue</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Realized sales turnover</div>
                </div>
              </div>
              {renderGrowthPill(data?.revenueSummary?.revenueGrowth ?? 0)}
            </div>

            <div className="dashboard-kpi-value-row">
              <div className="dashboard-kpi-value accent-primary">
                {currency}{data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
            </div>

            {/* Embedded SVG Area Sparkline */}
            <div className="dashboard-kpi-viz-container">
              <svg width="100%" height="44" viewBox="0 0 220 44" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="kpi-rev-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill="url(#kpi-rev-grad)" />}
                {linePath && <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
                {lastX > 0 && <circle cx={lastX} cy={lastY} r="3.5" fill="var(--primary)" stroke="var(--bg-card)" strokeWidth="2" />}
              </svg>
            </div>
          </div>

          <div className="dashboard-kpi-submetrics">
            <div className="dashboard-kpi-submetrics-item">
              <span className="dashboard-kpi-dot" />
              <span>Subtotal: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalSubtotal?.toFixed(2) || '0.00'}</strong></span>
            </div>
            <div className="dashboard-kpi-submetrics-item">
              <span className="dashboard-kpi-dot secondary" />
              <span>Tax: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalTax?.toFixed(2) || '0.00'}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="dashboard-kpi-card is-static">
          <div>
            <div className="dashboard-kpi-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="dashboard-kpi-icon-pill">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div className="dashboard-kpi-label">Total Orders</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Completed counter bills</div>
                </div>
              </div>
              {renderGrowthPill(data?.revenueSummary?.ordersGrowth ?? 0)}
            </div>

            <div className="dashboard-kpi-value-row">
              <div className="dashboard-kpi-value">
                {data?.revenueSummary?.orderCount || 0}
              </div>
            </div>

            {/* Embedded Micro Bar Chart */}
            <div className="dashboard-kpi-viz-container">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', height: '44px', padding: '2px 0' }}>
                {ordersTrendPoints.slice(-14).map((cnt, idx) => {
                  const pct = Math.max(12, Math.round((cnt / maxDayOrders) * 100));
                  const isPeak = cnt > 0 && cnt === maxDayOrders;
                  return (
                    <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${pct}%`,
                          borderRadius: '3px 3px 1px 1px',
                          background: isPeak ? 'var(--primary)' : 'var(--color-light-green)',
                          transition: 'height 0.25s ease',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="dashboard-kpi-submetrics">
            <div className="dashboard-kpi-submetrics-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Clock size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>Peak: <strong style={{ color: 'var(--text-main)' }}>{data?.peakHour ? data.peakHour.hourLabel : 'Evenly spaced'}</strong></span>
            </div>
            <div className="dashboard-kpi-submetrics-item" style={{ flexShrink: 0 }}>
              <span className="dashboard-kpi-dot" />
              <span><strong>{data?.peakHour?.orders || 0}</strong> bills</span>
            </div>
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="dashboard-kpi-card is-static">
          <div>
            <div className="dashboard-kpi-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="dashboard-kpi-icon-pill">
                  <Award size={18} />
                </div>
                <div>
                  <div className="dashboard-kpi-label">Average Ticket (AOV)</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Average spend per receipt</div>
                </div>
              </div>
              <span className="dashboard-kpi-growth neutral">
                AOV
              </span>
            </div>

            <div className="dashboard-kpi-value-row">
              <div className="dashboard-kpi-value">
                {currency}{data?.revenueSummary?.averageOrderValue?.toFixed(2) || '0.00'}
              </div>
            </div>

            {/* Visual Efficiency Ratio Meter */}
            <div className="dashboard-kpi-viz-container">
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <span>Net Basket Realization</span>
                  <strong style={{ color: 'var(--primary)' }}>
                    {data?.revenueSummary?.totalSubtotal && data.revenueSummary.totalSubtotal > 0
                      ? `${Math.max(0, 100 - Number(((data.revenueSummary.totalDiscount / data.revenueSummary.totalSubtotal) * 100).toFixed(0)))}%`
                      : '100%'}
                  </strong>
                </div>
                <div style={{ width: '100%', height: '8px', borderRadius: '9999px', background: 'var(--color-light-green)', display: 'flex', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${data?.revenueSummary?.totalSubtotal && data.revenueSummary.totalSubtotal > 0
                        ? Math.max(10, 100 - Number(((data.revenueSummary.totalDiscount / data.revenueSummary.totalSubtotal) * 100).toFixed(0)))
                        : 100}%`,
                      background: 'var(--primary)',
                      height: '100%',
                    }}
                  />
                  <div
                    style={{
                      width: `${data?.revenueSummary?.totalSubtotal && data.revenueSummary.totalSubtotal > 0
                        ? Math.min(90, Number(((data.revenueSummary.totalDiscount / data.revenueSummary.totalSubtotal) * 100).toFixed(0)))
                        : 0}%`,
                      background: '#f59e0b',
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-kpi-submetrics">
            <div className="dashboard-kpi-submetrics-item">
              <span className="dashboard-kpi-dot" />
              <span>Discounts: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalDiscount?.toFixed(2) || '0.00'}</strong></span>
            </div>
            <div className="dashboard-kpi-submetrics-item">
              <span className="dashboard-kpi-dot secondary" />
              <span>Basket Rate: <strong style={{ color: 'var(--text-main)' }}>Stable</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Customer Base & Retention */}
        <div className="dashboard-kpi-card is-static">
          <div>
            <div className="dashboard-kpi-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="dashboard-kpi-icon-pill">
                  <Users size={18} />
                </div>
                <div>
                  <div className="dashboard-kpi-label">Customer Reach</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Unique store shoppers</div>
                </div>
              </div>
              <span className="dashboard-kpi-growth positive">
                {data?.customerAnalytics?.repeatRate || 0}% Repeat
              </span>
            </div>

            <div className="dashboard-kpi-value-row">
              <div className="dashboard-kpi-value">
                {data?.customerAnalytics?.totalCustomers || 0}
              </div>
            </div>

            {/* Circular Retention Ring */}
            <div className="dashboard-kpi-viz-container">
              {renderRetentionRing(data?.customerAnalytics?.repeatRate || 0)}
            </div>
          </div>

          <div className="dashboard-kpi-submetrics">
            <div className="dashboard-kpi-submetrics-item">
              <span className="dashboard-kpi-dot" />
              <span>Repeat: <strong style={{ color: 'var(--text-main)' }}>{data?.customerAnalytics?.repeatCustomers || 0} patrons</strong></span>
            </div>
            <div className="dashboard-kpi-submetrics-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span className="dashboard-kpi-dot secondary" />
              <span>Top: <strong style={{ color: 'var(--text-main)' }}>{data?.customerAnalytics?.topCustomers?.[0]?.name ? data.customerAnalytics.topCustomers[0].name.slice(0, 10) : '—'}</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Deep Operational Analytics (4 Redesigned Visual Panels) */}
      <section className="dashboard-analytics-grid" aria-label="Deep Operational Analytics">
        {/* Panel 1: Daily Sales Activity & Cadence */}
        <div className="dashboard-analytics-card is-static">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <Calendar size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Daily Sales Cadence &amp; Velocity</h2>
                  <p className="dashboard-analytics-subtitle">Progression, peaks, and daily run-rate over time</p>
                </div>
              </div>
              <span className="dashboard-kpi-badge">
                Peak: {currency}{maxDayRevenue.toFixed(2)}
              </span>
            </div>

            {data?.dailyTimeline && data.dailyTimeline.length > 0 ? (
              <div className="dashboard-timeline-chart-container">
                <div className="dashboard-timeline-bars-frame">
                  {/* Dashed Average Benchmark Line */}
                  <div className="dashboard-timeline-benchmark-line" style={{ bottom: `${avgLinePercent}%` }}>
                    <span className="dashboard-timeline-benchmark-tag">Avg: {currency}{avgDayRevenue.toFixed(0)}</span>
                  </div>

                  {data.dailyTimeline.slice(-14).map((d) => {
                    const heightPercent = Math.max(10, Math.round((d.revenue / maxDayRevenue) * 100));
                    const isAboveAvg = d.revenue >= avgDayRevenue && d.revenue > 0;
                    return (
                      <div
                        key={d.date}
                        className="dashboard-timeline-bar-col"
                        title={`${d.label}: ${currency}${d.revenue.toFixed(2)} (${d.orders} bills)`}
                      >
                        <div
                          className={`dashboard-timeline-bar-fill ${isAboveAvg ? 'active' : ''}`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="dashboard-timeline-bar-label">
                          {d.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="dashboard-timeline-stats-cluster">
                  <div className="dashboard-timeline-stat-chip">
                    <div className="dashboard-timeline-stat-chip-label">Peak Daily High</div>
                    <div className="dashboard-timeline-stat-chip-val" style={{ color: 'var(--primary)' }}>
                      {currency}{maxDayRevenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="dashboard-timeline-stat-chip">
                    <div className="dashboard-timeline-stat-chip-label">Daily Average Run Rate</div>
                    <div className="dashboard-timeline-stat-chip-val">
                      {currency}{avgDayRevenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="dashboard-timeline-stat-chip">
                    <div className="dashboard-timeline-stat-chip-label">Active Trade Days</div>
                    <div className="dashboard-timeline-stat-chip-val">
                      {data.dailyTimeline.filter((d) => d.revenue > 0).length} of {data.dailyTimeline.length}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No daily activity recorded for this selected period.
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Top Ranked Products */}
        <div className="dashboard-analytics-card is-static">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <Award size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Menu Champions &amp; Top Products</h2>
                  <p className="dashboard-analytics-subtitle">Highest volume and revenue contributors</p>
                </div>
              </div>
              <span className="dashboard-kpi-badge">
                {data?.topProducts?.length || 0} Ranked Items
              </span>
            </div>

            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="dashboard-ranked-list">
                {data.topProducts.slice(0, 4).map((p, idx) => {
                  const medalClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : 'standard';
                  return (
                    <div key={p.name} className="dashboard-ranked-card">
                      <div className="dashboard-ranked-card-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <span className={`dashboard-medal-badge ${medalClass}`}>#{idx + 1}</span>
                          <div className="dashboard-ranked-title-wrap">
                            <div className="dashboard-ranked-title">{p.name}</div>
                            <div className="dashboard-ranked-metric-pill">
                              {p.unitsSold} units sold &bull; {p.percentage}% of gross sales
                            </div>
                          </div>
                        </div>
                        <div className="dashboard-ranked-rev-val">
                          {currency}{p.totalRevenue.toFixed(2)}
                        </div>
                      </div>

                      <div className="dashboard-ranked-share-track">
                        <div
                          className="dashboard-ranked-share-fill"
                          style={{ width: `${Math.min(100, Math.max(6, p.percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No product sales recorded yet in this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Payment Settlements & Channels */}
        <div className="dashboard-analytics-card is-static">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Payment Settlements &amp; Channels</h2>
                  <p className="dashboard-analytics-subtitle">Counter cash vs digital UPI &amp; online reconciliations</p>
                </div>
              </div>
              <span className="dashboard-kpi-badge">
                Total: {currency}{data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}
              </span>
            </div>

            {data?.paymentBreakdown && data.paymentBreakdown.length > 0 ? (
              <div className="dashboard-payment-overview">
                {/* Unified Segmented Strip */}
                <div className="dashboard-payment-unified-strip">
                  {data.paymentBreakdown.map((pm) => {
                    const color =
                      pm.method === 'PAID_CASH'
                        ? 'var(--primary)'
                        : pm.method === 'PAID_ONLINE'
                        ? '#0284c7'
                        : pm.method === 'COD'
                        ? '#d97706'
                        : '#e11d48';
                    return (
                      <div
                        key={pm.method}
                        className="dashboard-payment-strip-segment"
                        style={{
                          width: `${Math.max(2, pm.percentage)}%`,
                          background: color,
                        }}
                        title={`${pm.label}: ${pm.percentage}% (${currency}${pm.total.toFixed(2)})`}
                      />
                    );
                  })}
                </div>

                {/* 2x2 Grid of Channel Cards */}
                <div className="dashboard-payment-channels-grid">
                  {data.paymentBreakdown.map((pm) => (
                    <div key={pm.method} className="dashboard-payment-channel-card">
                      <div className="dashboard-payment-channel-card-top">
                        <span className="dashboard-payment-channel-name">{pm.label}</span>
                        <span className="dashboard-payment-channel-pct">{pm.percentage}%</span>
                      </div>
                      <div className="dashboard-payment-channel-amt">
                        {currency}{pm.total.toFixed(2)}
                      </div>
                      <div className="dashboard-payment-channel-bills">
                        {pm.count} counter receipt{pm.count === 1 ? '' : 's'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                No payment activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Panel 4: Catalog & Stock Health */}
        <div className="dashboard-analytics-card is-static">
          <div>
            <div className="dashboard-analytics-card-header">
              <div className="dashboard-analytics-header-left">
                <div className="dashboard-analytics-icon-wrap">
                  <Package size={22} />
                </div>
                <div>
                  <h2 className="dashboard-analytics-title">Catalog &amp; Inventory Health</h2>
                  <p className="dashboard-analytics-subtitle">Stock counters, threshold levels &amp; restock alerts</p>
                </div>
              </div>
              {(data?.inventoryHealth?.lowStockCount ?? 0) > 0 || (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? (
                <span className="dashboard-kpi-growth negative">Restock Needed</span>
              ) : (
                <span className="dashboard-kpi-growth positive">Stock Healthy</span>
              )}
            </div>

            <div className="dashboard-inventory-redesign">
              {/* 3-Card Health Level Matrix */}
              <div className="dashboard-inventory-tri-grid">
                <div className="dashboard-inventory-tri-card safe">
                  <div className="dashboard-inventory-tri-num safe">
                    {data?.inventoryHealth?.inStockCount ??
                      Math.max(
                        0,
                        (data?.inventoryHealth?.totalProducts || 0) -
                          ((data?.inventoryHealth?.lowStockCount || 0) + (data?.inventoryHealth?.outOfStockCount || 0))
                      )}
                  </div>
                  <div className="dashboard-inventory-tri-label">In Stock Safe</div>
                </div>

                <div className="dashboard-inventory-tri-card warning">
                  <div className="dashboard-inventory-tri-num warning">
                    {data?.inventoryHealth?.lowStockCount || 0}
                  </div>
                  <div className="dashboard-inventory-tri-label">Low Stock (&le;5)</div>
                </div>

                <div className="dashboard-inventory-tri-card danger">
                  <div className="dashboard-inventory-tri-num danger">
                    {data?.inventoryHealth?.outOfStockCount || 0}
                  </div>
                  <div className="dashboard-inventory-tri-label">Out of Stock</div>
                </div>
              </div>

              {/* Counter vs Tracked Inventory Distribution */}
              <div className="dashboard-inventory-split-bar-box">
                <div className="dashboard-inventory-split-labels">
                  <span>Fast Counter Items: <strong>{data?.inventoryHealth?.liveCounterProducts || 0}</strong></span>
                  <span>Tracked Inventory: <strong>{data?.inventoryHealth?.trackedProducts || 0}</strong></span>
                </div>
                <div className="dashboard-inventory-split-track">
                  <div
                    style={{
                      width: `${data?.inventoryHealth?.totalProducts
                        ? Math.max(10, Math.round(((data.inventoryHealth.liveCounterProducts || 0) / data.inventoryHealth.totalProducts) * 100))
                        : 50}%`,
                      background: 'var(--primary)',
                      height: '100%',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      background: 'var(--color-light-green)',
                      height: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Critical Alert Banner / Ticker */}
              {(data?.inventoryHealth?.lowStockCount ?? 0) > 0 || (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? (
                <div className="dashboard-alert-banner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={17} style={{ flexShrink: 0 }} />
                    <span>
                      {(data?.inventoryHealth?.outOfStockCount ?? 0) > 0
                        ? `${data?.inventoryHealth?.outOfStockCount} item(s) are completely out of stock.`
                        : `${data?.inventoryHealth?.lowStockCount} item(s) have reached reorder thresholds.`}
                    </span>
                  </div>
                  {(data?.inventoryHealth?.outOfStockList?.length || 0) > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {data?.inventoryHealth?.outOfStockList?.slice(0, 3).map((item) => (
                        <span key={item._id} className="dashboard-critical-item-chip">
                          <strong>{item.name}</strong>: 0 units
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="dashboard-alert-banner-ok">
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>All tracked catalog items are currently within safe operational inventory levels.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Grouped Business Reports & Statements Hub Directory */}
      {/* <section className="dashboard-reports-section" aria-label="Grouped Business Reports Hub">
        <div className="dashboard-reports-header">
          <div className="dashboard-reports-header-left">
            <div className="dashboard-reports-icon">
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 className="dashboard-reports-title">Business Reports &amp; Statements Directory</h2>
              <p className="dashboard-reports-subtitle">
                Access deep financial breakdowns, counter traffic patterns, and itemized catalog reports
              </p>
            </div>
          </div>
          <Link href="/dashboard/reports" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Open Reports Hub</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dashboard-reports-grid">
          <Link href="/dashboard/reports/revenue" className="dashboard-report-tile">
            <div>
              <div className="dashboard-report-tile-top">
                <div className="dashboard-report-tile-icon">
                  <TrendingUp size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dashboard-report-tile-name">Revenue &amp; Financials</div>
                  <div className="dashboard-report-tile-desc">Tax collections, net sales, subtotal &amp; discount audit</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Gross Sales: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}</strong>
              </div>
            </div>
            <div className="dashboard-report-tile-bottom">
              <span className="dashboard-report-tile-stat">
                {data?.revenueSummary?.revenueGrowth && data.revenueSummary.revenueGrowth >= 0 ? '+' : ''}{data?.revenueSummary?.revenueGrowth ?? 0}%
              </span>
              <span className="dashboard-report-tile-action">
                <span>View Statement</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link href="/dashboard/reports/orders" className="dashboard-report-tile">
            <div>
              <div className="dashboard-report-tile-top">
                <div className="dashboard-report-tile-icon">
                  <ShoppingBag size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dashboard-report-tile-name">Order Volume &amp; Rush Hours</div>
                  <div className="dashboard-report-tile-desc">Hourly order velocity, counter rush peak &amp; ticket sizes</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Volume: <strong style={{ color: 'var(--text-main)' }}>{data?.revenueSummary?.orderCount || 0} processed bills</strong>
              </div>
            </div>
            <div className="dashboard-report-tile-bottom">
              <span className="dashboard-report-tile-stat">
                {data?.peakHour ? data.peakHour.hourLabel : 'Hourly'}
              </span>
              <span className="dashboard-report-tile-action">
                <span>View Hourly Report</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link href="/dashboard/reports/products" className="dashboard-report-tile">
            <div>
              <div className="dashboard-report-tile-top">
                <div className="dashboard-report-tile-icon">
                  <Award size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dashboard-report-tile-name">Menu Champions &amp; Products</div>
                  <div className="dashboard-report-tile-desc">Units sold ranking, top revenue driver &amp; menu performance</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Leader: <strong style={{ color: 'var(--text-main)' }}>{data?.topProducts?.[0]?.name || 'Catalog items'}</strong>
              </div>
            </div>
            <div className="dashboard-report-tile-bottom">
              <span className="dashboard-report-tile-stat">
                {data?.topProducts?.[0] ? `${data.topProducts[0].unitsSold} sold` : 'Rankings'}
              </span>
              <span className="dashboard-report-tile-action">
                <span>View Rankings</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link href="/dashboard/reports/payments" className="dashboard-report-tile">
            <div>
              <div className="dashboard-report-tile-top">
                <div className="dashboard-report-tile-icon">
                  <CreditCard size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dashboard-report-tile-name">Payment Settlements</div>
                  <div className="dashboard-report-tile-desc">Counter cash reconciliation vs digital UPI collections</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Top Channel: <strong style={{ color: 'var(--text-main)' }}>{data?.paymentBreakdown?.[0]?.label || 'Recorded channels'}</strong>
              </div>
            </div>
            <div className="dashboard-report-tile-bottom">
              <span className="dashboard-report-tile-stat">
                {data?.paymentBreakdown?.[0] ? `${data.paymentBreakdown[0].percentage}%` : 'Settlements'}
              </span>
              <span className="dashboard-report-tile-action">
                <span>View Reconciliation</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link href="/dashboard/reports/inventory" className="dashboard-report-tile">
            <div>
              <div className="dashboard-report-tile-top">
                <div className="dashboard-report-tile-icon">
                  <Package size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dashboard-report-tile-name">Catalog &amp; Inventory Health</div>
                  <div className="dashboard-report-tile-desc">Live counter stock balances, restock alerts &amp; low stock units</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Catalog Size: <strong style={{ color: 'var(--text-main)' }}>{data?.inventoryHealth?.totalProducts || 0} items</strong>
              </div>
            </div>
            <div className="dashboard-report-tile-bottom">
              <span className="dashboard-report-tile-stat" style={{ color: ((data?.inventoryHealth?.lowStockCount ?? 0) + (data?.inventoryHealth?.outOfStockCount ?? 0)) > 0 ? '#b91c1c' : 'var(--primary)' }}>
                {((data?.inventoryHealth?.lowStockCount ?? 0) + (data?.inventoryHealth?.outOfStockCount ?? 0)) > 0
                  ? `${(data?.inventoryHealth?.lowStockCount ?? 0) + (data?.inventoryHealth?.outOfStockCount ?? 0)} alerts`
                  : 'Healthy'}
              </span>
              <span className="dashboard-report-tile-action">
                <span>View Stock Manager</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link href="/dashboard/reports/customers" className="dashboard-report-tile">
            <div>
              <div className="dashboard-report-tile-top">
                <div className="dashboard-report-tile-icon">
                  <Users size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="dashboard-report-tile-name">Customer Directory &amp; Loyalty</div>
                  <div className="dashboard-report-tile-desc">Repeat customer retention rates, patron directory &amp; top spenders</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Patrons: <strong style={{ color: 'var(--text-main)' }}>{data?.customerAnalytics?.totalCustomers || 0} registered</strong>
              </div>
            </div>
            <div className="dashboard-report-tile-bottom">
              <span className="dashboard-report-tile-stat">
                {data?.customerAnalytics?.repeatRate || 0}% Repeat
              </span>
              <span className="dashboard-report-tile-action">
                <span>View Directory</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section> */}

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
