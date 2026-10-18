'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Printer,
  AlertCircle,
  CheckCircle2,
  Layers,
  Edit2,
  ExternalLink,
  Search,
} from 'lucide-react';

export default function InventoryReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOW' | 'OUT' | 'TRACKED' | 'LIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, prodRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/catalog/products'),
      ]);

      if (analyticsRes.ok && prodRes.ok) {
        const aData = await analyticsRes.json();
        const pData = await prodRes.json();
        setData(aData);
        setProducts(pData.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const inv = data?.inventoryHealth || {};
  const currency = data?.currency || '$';

  const filteredItems = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'LOW') {
      return p.trackStock && (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 5;
    }
    if (filterStatus === 'OUT') {
      return p.trackStock && (p.stockQuantity ?? 0) <= 0;
    }
    if (filterStatus === 'TRACKED') {
      return p.trackStock;
    }
    if (filterStatus === 'LIVE') {
      return !p.trackStock;
    }
    return true;
  });

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
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#fb923c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Inventory & Stock Health Report
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Monitor tracked item quantities, live counter items, stock-out warnings, and restock needs
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/dashboard/catalog" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} /> Open Products & Menu
          </Link>
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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Total Catalog Items</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {inv.totalProducts || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Active menu items in database
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Tracked Inventory</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald)' }}>
            {inv.trackedProducts || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {inv.liveCounterProducts || 0} live counter items (unlimited)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Low Stock Warning</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (inv.lowStockCount || 0) > 0 ? '#fb923c' : 'var(--text-main)' }}>
            {inv.lowStockCount || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Items with 5 or fewer units
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Out of Stock</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: (inv.outOfStockCount || 0) > 0 ? '#f87171' : 'var(--text-main)' }}>
            {inv.outOfStockCount || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Requires immediate replenishment
          </div>
        </div>
      </div>

      {/* Critical Stock Alerts Notice */}
      {(inv.lowStockCount > 0 || inv.outOfStockCount > 0) && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={24} style={{ color: '#f87171' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                Inventory Replenishment Required
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {inv.outOfStockCount} item(s) are currently sold out and {inv.lowStockCount} item(s) are running critically low.
              </div>
            </div>
          </div>
          <Link href="/dashboard/catalog" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            Restock in Catalog <ExternalLink size={14} style={{ marginLeft: '4px' }} />
          </Link>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { key: 'ALL', label: `All (${products.length})` },
                { key: 'LOW', label: `Low Stock (${inv.lowStockCount || 0})` },
                { key: 'OUT', label: `Out of Stock (${inv.outOfStockCount || 0})` },
                { key: 'TRACKED', label: `Tracked (${inv.trackedProducts || 0})` },
                { key: 'LIVE', label: `Live Counter (${inv.liveCounterProducts || 0})` },
              ] as const
            ).map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setFilterStatus(btn.key)}
                className={`btn btn-sm ${filterStatus === btn.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '10px', fontSize: '0.82rem' }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search items or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Detailed Inventory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Item Name</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>SKU</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Inventory Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Units</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((p) => {
                const isOut = p.trackStock && (p.stockQuantity ?? 0) <= 0;
                const isLow = p.trackStock && (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= 5;
                const isTracked = p.trackStock;

                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {typeof p.categoryId === 'object' ? p.categoryId?.name : 'General'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {p.sku || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--emerald)' }}>
                      {currency}{p.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isOut ? (
                        <span className="badge badge-expired">Out of Stock</span>
                      ) : isLow ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(249, 115, 22, 0.15)',
                            color: '#fb923c',
                            borderColor: 'rgba(249, 115, 22, 0.4)',
                          }}
                        >
                          Low Stock
                        </span>
                      ) : isTracked ? (
                        <span className="badge badge-pro">In Stock</span>
                      ) : (
                        <span className="badge badge-pro">Live Counter</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: isOut ? '#f87171' : isLow ? '#fb923c' : 'var(--text-main)' }}>
                      {isTracked ? `${p.stockQuantity ?? 0} units` : 'Unlimited (Live)'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link href="/dashboard/catalog" className="btn btn-secondary btn-sm" style={{ padding: '6px 10px' }}>
                        <Edit2 size={13} /> Edit
                      </Link>
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
