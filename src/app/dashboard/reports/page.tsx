'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Award,
  CreditCard,
  Package,
  Users,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  Receipt,
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
  };
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
    }>;
  };
  inventoryHealth: {
    totalProducts: number;
    liveCounterProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export default function ReportsHubPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReportsData = async (selectedPeriod = period) => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/analytics?period=${selectedPeriod}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching reports analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportsData(period);
  }, [period]);

  const currency = data?.currency || '$';

  const reportModules = [
    {
      id: 'revenue',
      title: 'Revenue & Financial Statements',
      description: 'Gross sales receipts, taxable amounts, collected tax breakdown and discounts.',
      href: '/dashboard/reports/revenue',
      icon: TrendingUp,
      statLabel: 'Gross Revenue',
      statValue: `${currency}${data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}`,
      badge: `${data?.revenueSummary?.revenueGrowth && data.revenueSummary.revenueGrowth >= 0 ? '+' : ''}${data?.revenueSummary?.revenueGrowth ?? 0}% growth`,
      subMetrics: [
        { label: 'Subtotal', value: `${currency}${data?.revenueSummary?.totalSubtotal?.toFixed(2) || '0.00'}` },
        { label: 'Tax', value: `${currency}${data?.revenueSummary?.totalTax?.toFixed(2) || '0.00'}` },
        { label: 'Discounts', value: `${currency}${data?.revenueSummary?.totalDiscount?.toFixed(2) || '0.00'}` },
      ],
    },
    {
      id: 'orders',
      title: 'Order Volume & Rush Hours',
      description: 'Hourly order volume distribution, counter peak traffic, and ticket size trends.',
      href: '/dashboard/reports/orders',
      icon: ShoppingBag,
      statLabel: 'Processed Orders',
      statValue: `${data?.revenueSummary?.orderCount || 0} bills`,
      badge: data?.peakHour ? `Peak: ${data.peakHour.hourLabel}` : 'Evenly spaced',
      subMetrics: [
        { label: 'Avg Ticket (AOV)', value: `${currency}${data?.revenueSummary?.averageOrderValue?.toFixed(2) || '0.00'}` },
        { label: 'Peak Bills', value: data?.peakHour ? `${data.peakHour.orders} orders` : 'N/A' },
        { label: 'Growth', value: `${data?.revenueSummary?.ordersGrowth && data.revenueSummary.ordersGrowth >= 0 ? '+' : ''}${data?.revenueSummary?.ordersGrowth ?? 0}%` },
      ],
    },
    {
      id: 'products',
      title: 'Product & Menu Performance',
      description: 'Menu champions, units sold per product, category share, and top revenue drivers.',
      href: '/dashboard/reports/products',
      icon: Award,
      statLabel: 'Top Seller',
      statValue: data?.topProducts?.[0]?.name || 'No sales yet',
      badge: data?.topProducts?.[0] ? `${data.topProducts[0].unitsSold} units sold` : '0 units',
      subMetrics: [
        { label: 'Top Contributor', value: data?.topProducts?.[0] ? `${currency}${data.topProducts[0].totalRevenue.toFixed(2)}` : `${currency}0.00` },
        { label: 'Total Catalog', value: `${data?.inventoryHealth?.totalProducts || 0} items` },
        { label: 'Menu Share', value: data?.topProducts?.[0] ? `${data.topProducts[0].percentage}%` : '0%' },
      ],
    },
    {
      id: 'payments',
      title: 'Payment Settlements & Channels',
      description: 'Reconciliation of counter cash receipts, online UPI, and digital settlements.',
      href: '/dashboard/reports/payments',
      icon: CreditCard,
      statLabel: 'Primary Channel',
      statValue: data?.paymentBreakdown?.[0]?.label || 'Pending',
      badge: data?.paymentBreakdown?.[0] ? `${data.paymentBreakdown[0].percentage}% of total` : '0%',
      subMetrics: [
        { label: 'Recorded Channels', value: `${data?.paymentBreakdown?.length || 0} methods` },
        { label: 'Channel Bills', value: data?.paymentBreakdown?.[0] ? `${data.paymentBreakdown[0].count} orders` : '0' },
        { label: 'Settled Amount', value: data?.paymentBreakdown?.[0] ? `${currency}${data.paymentBreakdown[0].total.toFixed(2)}` : `${currency}0.00` },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory & Stock Health',
      description: 'Live counter inventory, critical stockout alerts, and restock warning levels.',
      href: '/dashboard/reports/inventory',
      icon: Package,
      statLabel: 'Catalog Items',
      statValue: `${data?.inventoryHealth?.totalProducts || 0} products`,
      badge:
        (data?.inventoryHealth?.lowStockCount ?? 0) > 0 || (data?.inventoryHealth?.outOfStockCount ?? 0) > 0
          ? `${(data?.inventoryHealth?.lowStockCount ?? 0) + (data?.inventoryHealth?.outOfStockCount ?? 0)} alerts`
          : 'Stock healthy',
      subMetrics: [
        { label: 'Fast POS Items', value: `${data?.inventoryHealth?.liveCounterProducts || 0}` },
        { label: 'Low Stock (<=5)', value: `${data?.inventoryHealth?.lowStockCount || 0}` },
        { label: 'Out of Stock', value: `${data?.inventoryHealth?.outOfStockCount || 0}` },
      ],
    },
    {
      id: 'customers',
      title: 'Customer Directory & Retention',
      description: 'Patron transaction frequency, repeat customer loyalty rates, and top buyers.',
      href: '/dashboard/reports/customers',
      icon: Users,
      statLabel: 'Total Patrons',
      statValue: `${data?.customerAnalytics?.totalCustomers || 0} unique`,
      badge: `${data?.customerAnalytics?.repeatRate || 0}% Repeat Rate`,
      subMetrics: [
        { label: 'Repeat Buyers', value: `${data?.customerAnalytics?.repeatCustomers || 0}` },
        { label: 'Top Spender', value: data?.customerAnalytics?.topCustomers?.[0]?.name ? data.customerAnalytics.topCustomers[0].name.slice(0, 12) : '—' },
        { label: 'Top Patron Total', value: data?.customerAnalytics?.topCustomers?.[0] ? `${currency}${data.customerAnalytics.topCustomers[0].totalSpent.toFixed(2)}` : `${currency}0.00` },
      ],
    },
  ];

  return (
    <div className="dashboard-page-container">
      {/* Top Header Navigation */}
      <section className="dashboard-hero-header" aria-label="Reports Hub Header">
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
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="dashboard-hero-title" style={{ margin: 0 }}>
              Business Reports &amp; Analytics Hub
            </h1>
          </div>
          <p className="dashboard-hero-subtitle">
            Consolidated operational statements, financial breakdowns, and inventory audit logs
          </p>
        </div>

        {/* Timeframe Filter Controls & Actions */}
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
            onClick={() => fetchReportsData(period)}
            disabled={refreshing}
            className="dashboard-refresh-btn"
            title="Refresh reports analytics"
            aria-label="Refresh reports analytics"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
            title="Print reports summary"
          >
            <Printer size={15} />
            <span style={{ fontSize: '0.8rem' }}>Print Hub</span>
          </button>
        </div>
      </section>

      {/* Summary KPI Strip */}
      <section className="dashboard-kpi-grid" aria-label="Executive Snapshot">
        <div className="dashboard-kpi-card is-static">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">Gross Sales</span>
            <span className="dashboard-kpi-badge">
              <TrendingUp size={12} />
              Sales
            </span>
          </div>
          <div className="dashboard-kpi-value accent-primary">
            {currency}{data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Net Subtotal: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalSubtotal?.toFixed(2) || '0.00'}</strong>
          </div>
        </div>

        <div className="dashboard-kpi-card is-static">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">Total Volume</span>
            <span className="dashboard-kpi-badge">
              <ShoppingBag size={12} />
              Volume
            </span>
          </div>
          <div className="dashboard-kpi-value">
            {data?.revenueSummary?.orderCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            AOV: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.averageOrderValue?.toFixed(2) || '0.00'}</strong>
          </div>
        </div>

        <div className="dashboard-kpi-card is-static">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">Collected Tax</span>
            <span className="dashboard-kpi-badge">
              <Receipt size={12} />
              Tax Audit
            </span>
          </div>
          <div className="dashboard-kpi-value">
            {currency}{data?.revenueSummary?.totalTax?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Discounts: <strong style={{ color: 'var(--text-main)' }}>{currency}{data?.revenueSummary?.totalDiscount?.toFixed(2) || '0.00'}</strong>
          </div>
        </div>

        <div className="dashboard-kpi-card is-static">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">Customer Patrons</span>
            <span className="dashboard-kpi-badge">
              <Users size={12} />
              Patrons
            </span>
          </div>
          <div className="dashboard-kpi-value">
            {data?.customerAnalytics?.totalCustomers || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Repeat Rate: <strong style={{ color: 'var(--primary)' }}>{data?.customerAnalytics?.repeatRate || 0}%</strong>
          </div>
        </div>
      </section>

      {/* Grouped Reports Directory (6 Comprehensive Modules) */}
      <section className="dashboard-reports-section" aria-label="Specialized Report Modules">
        <div className="dashboard-reports-header">
          <div className="dashboard-reports-header-left">
            <div className="dashboard-reports-icon">
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 className="dashboard-reports-title">Specialized Reporting Statements</h2>
              <p className="dashboard-reports-subtitle">
                Select any individual report below to inspect deep itemized breakdown, charts, and audit exports
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-reports-grid">
          {reportModules.map((rep) => {
            const IconComp = rep.icon;
            return (
              <Link key={rep.id} href={rep.href} className="dashboard-report-tile">
                <div>
                  <div className="dashboard-report-tile-top">
                    <div className="dashboard-report-tile-icon">
                      <IconComp size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="dashboard-report-tile-name">{rep.title}</div>
                      <div className="dashboard-report-tile-desc">{rep.description}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{rep.statLabel}:</span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {rep.statValue}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {rep.subMetrics.map((sm) => (
                        <span
                          key={sm.label}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--color-light-green)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {sm.label}: <strong style={{ color: 'var(--text-main)' }}>{sm.value}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="dashboard-report-tile-bottom">
                  <span className="dashboard-report-tile-stat">{rep.badge}</span>
                  <span className="dashboard-report-tile-action">
                    <span>Open Statement</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
