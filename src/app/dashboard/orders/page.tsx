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
  Receipt,
  X,
  Check,
  FileText,
  Download,
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
  currency?: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ todayRevenue: 0, todayCount: 0, avgOrder: 0 });
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{
    orderNumber: string;
    rawText: string;
    whatsappUrl: string;
    phone: string;
    totalAmount: number;
    pdfUrl?: string;
  } | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
        if (data.currency) setCurrency(data.currency);
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

  const handleViewReceipt = async (orderId: string) => {
    setViewingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.rawReceiptText) {
        const order = orders.find((o) => o._id === orderId);
        setSelectedReceipt({
          orderNumber: order?.orderNumber || '',
          rawText: data.rawReceiptText,
          whatsappUrl: data.whatsappUrl,
          phone: order?.customerPhone || '',
          totalAmount: order?.totalAmount || 0,
          pdfUrl: data.pdfUrl || `/api/receipts/${order?.orderNumber}/pdf`,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setViewingId(null);
    }
  };

  const handleSharePdf = async () => {
    if (!selectedReceipt) return;
    setSharingPdf(true);
    try {
      const pdfEndpoint = selectedReceipt.pdfUrl || `/api/receipts/${selectedReceipt.orderNumber}/pdf`;
      const res = await fetch(pdfEndpoint);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const file = new File([blob], `Receipt-${selectedReceipt.orderNumber}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt #${selectedReceipt.orderNumber}`,
          text: `Invoice #${selectedReceipt.orderNumber}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${selectedReceipt.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing PDF:', err);
      }
    } finally {
      setSharingPdf(false);
    }
  };

  const handleCopyReceipt = () => {
    if (selectedReceipt) {
      navigator.clipboard.writeText(selectedReceipt.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            {currency}{stats.todayRevenue.toFixed(2)}
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
            {currency}{stats.avgOrder.toFixed(2)}
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
            No orders recorded yet. Create your first order in the New Order page!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--emerald-deep)', borderBottom: '1px solid var(--border-subtle)' }}>
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
                      {o.currency || currency}{o.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-pro" style={{ fontSize: '0.7rem' }}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(o._id)}
                          disabled={viewingId === o._id}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '4px' }}
                          title="View order receipt"
                        >
                          <Receipt size={14} />
                          {viewingId === o._id ? 'Loading...' : 'View'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendWhatsApp(o._id)}
                          disabled={resendingId === o._id}
                          className="btn btn-whatsapp btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <MessageSquare size={14} />
                          {resendingId === o._id ? 'Opening...' : 'WhatsApp'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content pos-receipt-modal" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--whatsapp)',
                  }}
                >
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Receipt #{selectedReceipt.orderNumber}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Phone: {selectedReceipt.phone}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', borderRadius: '8px' }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Preview */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                whiteSpace: 'pre-line',
                maxHeight: '320px',
                overflowY: 'auto',
                marginBottom: '16px',
                lineHeight: 1.45,
              }}
            >
              {selectedReceipt.rawText}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.open(selectedReceipt.whatsappUrl, '_blank', 'noopener,noreferrer')}
                className="btn btn-whatsapp"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <MessageSquare size={16} />
                <span>Open in WhatsApp</span>
                <ExternalLink size={14} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSharePdf}
                  disabled={sharingPdf}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
                  title="Share PDF file to WhatsApp or device apps"
                >
                  <FileText size={15} style={{ color: 'var(--whatsapp)' }} />
                  <span>{sharingPdf ? 'Sharing...' : 'Share PDF'}</span>
                </button>

                <a
                  href={selectedReceipt.pdfUrl || `/api/receipts/${selectedReceipt.orderNumber}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '5px', textDecoration: 'none' }}
                  title="Download PDF invoice directly"
                >
                  <Download size={15} />
                  <span>Download PDF</span>
                </a>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {copied ? <Check size={16} style={{ color: 'var(--whatsapp)' }} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy Receipt'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
