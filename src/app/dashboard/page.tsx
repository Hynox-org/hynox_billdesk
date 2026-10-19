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
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  History,
  Settings,
  Layers,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface AnalyticsData {
  currency: string;
  businessName: string;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Welcome & Controls */}
      <div className="glass-panel dashboard-exec-header">
        <div className="dashboard-exec-title-group">
          <div className="dashboard-exec-badge">
            <span className="dashboard-exec-dot" />
            <span className="dashboard-exec-badge-text">
              EXECUTIVE ANALYTICS OVERVIEW
            </span>
          </div>
          <h1 className="dashboard-exec-title">
            {data?.businessName ? `${data.businessName} Dashboard` : 'Vendor Store Dashboard'}
          </h1>
          <p className="dashboard-exec-desc">
            Monitor real-time revenue, order flow, inventory health, and customer retention.
          </p>
        </div>

        {/* Timeframe Filter Buttons & Refresh */}
        <div className="dashboard-timeframe-controls">
          <div className="dashboard-timeframe-pills">
            {(
              [
                { key: 'today', full: 'Today', short: 'Today', mini: 'Today' },
                { key: '7d', full: 'Last 7 Days', short: '7 Days', mini: '7D' },
                { key: '30d', full: 'Last 30 Days', short: '30 Days', mini: '30D' },
                { key: 'all', full: 'All Time', short: 'All Time', mini: 'All' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setPeriod(btn.key)}
                className={`btn btn-sm dashboard-timeframe-btn ${period === btn.key ? 'btn-primary' : 'btn-secondary'}`}
              >
                <span className="timeframe-text-full">{btn.full}</span>
                <span className="timeframe-text-short">{btn.short}</span>
                <span className="timeframe-text-mini">{btn.mini}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm dashboard-timeframe-refresh-btn"
            title="Refresh analytics data"
            aria-label="Refresh analytics data"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="dashboard-shortcuts-grid">
        <Link
          href="/dashboard/pos"
          className="glass-panel dashboard-shortcut-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(37, 211, 102, 0.15)',
                color: 'var(--whatsapp)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Take New Order</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Launch counter POS bill</div>
            </div>
          </div>
          <ArrowRight size={16} className="arrow-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>

        <Link
          href="/dashboard/catalog"
          className="glass-panel dashboard-shortcut-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Manage Products</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Update menu items & stock</div>
            </div>
          </div>
          <ArrowRight size={16} className="arrow-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>

        <Link
          href="/dashboard/orders"
          className="glass-panel dashboard-shortcut-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <History size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Orders</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Browse receipts & bills</div>
            </div>
          </div>
          <ArrowRight size={16} className="arrow-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>

        <Link
          href="/dashboard/settings"
          className="glass-panel dashboard-shortcut-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Store Settings</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currency, profile & security</div>
            </div>
          </div>
          <ArrowRight size={16} className="arrow-icon" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </Link>
      </div>

      {/* 6 Core Analytics Cards / Boxes Grid */}
      <div>
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">
            Analytics Breakdown & Dedicated Reports
          </h2>
          <span className="dashboard-section-subtitle">
            Click any card to open its full detailed report page
          </span>
        </div>

        <div className="dashboard-analytics-grid">
          {/* 1. Revenue & Sales Card */}
          <Link
            href="/dashboard/reports/revenue"
            className="glass-panel dashboard-analytics-card"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      color: 'var(--whatsapp)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Total Revenue & Sales
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Gross collections & sales volume</div>
                  </div>
                </div>
                <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                  {period === 'today' ? 'Today' : period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : 'All Time'}
                </span>
              </div>

              <div style={{ margin: '14px 0 10px' }}>
                <div className="dashboard-metric-value" style={{ color: 'var(--emerald)' }}>
                  {currency}
                  {data?.revenueSummary?.totalRevenue?.toFixed(2) || '0.00'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      color: (data?.revenueSummary?.revenueGrowth ?? 0) >= 0 ? '#10b981' : '#f87171',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <ArrowUpRight size={14} />
                    {(data?.revenueSummary?.revenueGrowth ?? 0) >= 0 ? '+' : ''}
                    {data?.revenueSummary?.revenueGrowth ?? 0}%
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>vs previous period</span>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Average Order Value (AOV):{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {currency}
                  {data?.revenueSummary?.averageOrderValue?.toFixed(2) || '0.00'}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--whatsapp)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>View Revenue Report</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* 2. Order Volume & Fulfillment Card */}
          <Link
            href="/dashboard/reports/orders"
            className="glass-panel dashboard-analytics-card"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Orders & Volume
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total tickets & counter transactions</div>
                  </div>
                </div>
                <span className="badge badge-trial" style={{ fontSize: '0.72rem' }}>
                  {data?.revenueSummary?.orderCount || 0} Orders
                </span>
              </div>

              <div style={{ margin: '14px 0 10px' }}>
                <div className="dashboard-metric-value" style={{ color: 'var(--text-main)' }}>
                  {data?.revenueSummary?.orderCount || 0}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>
                    Peak Hours:{' '}
                    <strong style={{ color: 'var(--text-main)' }}>
                      {data?.peakHour ? `${data.peakHour.hourLabel} (${data.peakHour.orders} orders)` : 'Consistent'}
                    </strong>
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Order Growth:{' '}
                <strong style={{ color: (data?.revenueSummary?.ordersGrowth ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
                  {(data?.revenueSummary?.ordersGrowth ?? 0) >= 0 ? '+' : ''}
                  {data?.revenueSummary?.ordersGrowth ?? 0}%
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--whatsapp)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>View Orders Report</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* 3. Product Performance & Top Sellers Card */}
          <Link
            href="/dashboard/reports/products"
            className="glass-panel dashboard-analytics-card"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#facc15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Award size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Product & Menu Performance
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Top selling items & menu distribution</div>
                  </div>
                </div>
                <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                  Top Ranked
                </span>
              </div>

              <div style={{ margin: '14px 0 10px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {data?.topProducts?.[0]?.name || 'No sales yet'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {data?.topProducts?.[0] ? (
                    <>
                      <strong style={{ color: 'var(--emerald)' }}>{data.topProducts[0].unitsSold} units</strong> sold • {currency}
                      {data.topProducts[0].totalRevenue.toFixed(2)} generated
                    </>
                  ) : (
                    'Add products to take your first order'
                  )}
                </div>
              </div>

              {/* Progress bar preview */}
              {data?.topProducts?.[0] && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    <span>Share of total sales</span>
                    <span>{data.topProducts[0].percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, data.topProducts[0].percentage)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #25D366 100%)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--whatsapp)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>View Product Report</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* 4. Inventory & Stock Health Card */}
          <Link
            href="/dashboard/reports/inventory"
            className="glass-panel dashboard-analytics-card"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(249, 115, 22, 0.15)',
                      color: '#fb923c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Inventory & Stock Health
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Stock levels, live counter & restock alerts</div>
                  </div>
                </div>
                {(data?.inventoryHealth?.lowStockCount ?? 0) > 0 || (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? (
                  <span className="badge badge-expired" style={{ fontSize: '0.72rem' }}>
                    Alerts Active
                  </span>
                ) : (
                  <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                    Healthy
                  </span>
                )}
              </div>

              <div style={{ margin: '14px 0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="dashboard-metric-value" style={{ color: 'var(--text-main)' }}>
                    {data?.inventoryHealth?.totalProducts || 0}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Catalog Items</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Tracked:{' '}
                    <strong style={{ color: 'var(--text-main)' }}>
                      {data?.inventoryHealth?.trackedProducts || 0}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Live Counter:{' '}
                    <strong style={{ color: 'var(--whatsapp)' }}>
                      {data?.inventoryHealth?.liveCounterProducts || 0}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Out of Stock:{' '}
                    <strong style={{ color: (data?.inventoryHealth?.outOfStockCount ?? 0) > 0 ? '#f87171' : 'var(--text-muted)' }}>
                      {data?.inventoryHealth?.outOfStockCount || 0}
                    </strong>
                  </div>
                </div>
              </div>

              {(data?.inventoryHealth?.lowStockCount ?? 0) > 0 && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{data?.inventoryHealth?.lowStockCount} item(s) are low in stock (&le; 5 units)</span>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--whatsapp)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>View Inventory Report</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* 5. Payment Methods Breakdown Card */}
          <Link
            href="/dashboard/reports/payments"
            className="glass-panel dashboard-analytics-card"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Payment Methods
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cash, Online & UPI collection split</div>
                  </div>
                </div>
                <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                  Settlement
                </span>
              </div>

              <div style={{ margin: '14px 0 10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data?.paymentBreakdown?.map((pm) => (
                    <div key={pm.method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{pm.label}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {currency}
                          {pm.total.toFixed(2)} ({pm.percentage}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pm.percentage}%`,
                            height: '100%',
                            background:
                              pm.method === 'PAID_CASH'
                                ? '#10b981'
                                : pm.method === 'PAID_ONLINE'
                                ? '#3b82f6'
                                : '#eab308',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--whatsapp)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>View Payments Report</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          {/* 6. Customer Insights & Retention Card */}
          <Link
            href="/dashboard/reports/customers"
            className="glass-panel dashboard-analytics-card"
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(20, 184, 166, 0.15)',
                      color: '#2dd4bf',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      Customer Insights & Retention
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unique patrons & repeat engagement</div>
                  </div>
                </div>
                <span className="badge badge-pro" style={{ fontSize: '0.72rem' }}>
                  {data?.customerAnalytics?.repeatRate || 0}% Repeat Rate
                </span>
              </div>

              <div style={{ margin: '14px 0 10px' }}>
                <div className="dashboard-metric-value" style={{ color: 'var(--text-main)' }}>
                  {data?.customerAnalytics?.totalCustomers || 0}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Total unique WhatsApp customer contacts
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Repeat Patrons</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emerald)' }}>
                      {data?.customerAnalytics?.repeatCustomers || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top Customer</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {data?.customerAnalytics?.topCustomers?.[0]?.name || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--whatsapp)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>View Customer Report</span>
              <ChevronRight size={16} />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders Overview Feed */}
      <div className="glass-panel dashboard-recent-orders-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Recent Orders Feed
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
              Latest transactions processed at counter
            </p>
          </div>
          <Link href="/dashboard/orders" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>View All Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {data?.recentOrders && data.recentOrders.length > 0 ? (
          <div className="dashboard-table-container">
            <table>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--emerald-deep)' }}>
                  <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Order #</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Items</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Payment</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      #{o.orderNumber}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{o.customerName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {o.itemsCount} item{o.itemsCount === 1 ? '' : 's'}
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
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            No recent orders found. Create your first order in POS!
          </div>
        )}
      </div>
    </div>
  );
}
