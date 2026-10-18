'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  Copy,
  Clock,
  Phone,
  CheckCircle2,
} from 'lucide-react';

interface OrderItem {
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ todayRevenue: 0, todayCount: 0, avgOrder: 0 });
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleResendWhatsApp = async (orderId: string) => {
    setResendingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Point of Sale Order History
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Audit all recorded transactions and instantly re-dispatch WhatsApp digital receipts
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Today&apos;s Revenue</span>
            <DollarSign size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ${stats.todayRevenue.toFixed(2)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Today&apos;s Orders</span>
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.todayCount}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Average Ticket Size</span>
            <TrendingUp size={18} style={{ color: 'var(--whatsapp)' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            ${stats.avgOrder.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Past Orders ({orders.length})</h3>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading transactions...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No orders recorded yet. Make your first sale in the POS Terminal!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Date & Time</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Items</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                      {o.orderNumber}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(o.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{o.customerName || 'Valued Customer'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--whatsapp)', fontFamily: 'var(--font-mono)' }}>
                        +{o.customerPhone}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--emerald)' }}>
                      ${o.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-pro" style={{ fontSize: '0.7rem' }}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleResendWhatsApp(o._id)}
                        disabled={resendingId === o._id}
                        className="btn btn-whatsapp btn-sm"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <MessageSquare size={14} />
                        {resendingId === o._id ? 'Opening...' : 'Resend Receipt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
