import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Tenant } from '@/models/Tenant';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Phone,
  Store,
  ExternalLink,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface ReceiptPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function PublicReceiptPage(props: ReceiptPageProps) {
  const { orderNumber } = await props.params;
  if (!orderNumber) return notFound();

  const cleanOrderNumber = decodeURIComponent(orderNumber).trim();
  await connectToDatabase();

  const order = await Order.findOne({
    orderNumber: { $regex: new RegExp(`^${cleanOrderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (!order) return notFound();

  const tenant = await Tenant.findById(order.tenantId);

  const businessName = tenant?.businessName || 'Business Receipt';
  const businessAddress = tenant?.address || '';
  const businessPhone = tenant?.phone || '';
  const currency = order.currency || tenant?.currency || '$';

  const showGst = tenant ? Boolean(tenant.showGstOnReceipt) : Boolean(order.gstNumber);
  const gstNumber = order.gstNumber || (tenant ? tenant.gstNumber : '');

  const showGoogle = tenant ? Boolean(tenant.showGoogleReviewOnReceipt) : Boolean(order.googleProfileUrl);
  const googleProfileUrl = order.googleProfileUrl || (tenant ? tenant.googleProfileUrl : '');

  const dateFormatted = new Date(order.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabels: Record<string, string> = {
    CASH: 'Paid via Cash',
    CARD: 'Paid via Card',
    UPI: 'Paid via UPI / QR',
    PAID_CASH: 'Paid via Cash',
    PAID_ONLINE: 'Paid Online / Card / UPI',
    PENDING: 'Payment Pending',
    COD: 'Cash on Delivery',
  };

  const paymentDisplay = paymentLabels[order.paymentStatus] || order.paymentStatus || 'Paid via Cash';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Top Actions Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                color: 'var(--primary)',
                fontWeight: 700,
                background: 'var(--color-light-green)',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid var(--border-medium)',
              }}
            >
              <ShieldCheck size={14} /> Verified Digital Receipt
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={`/api/receipts/${order.orderNumber}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', textDecoration: 'none' }}
              title="Download official PDF invoice"
            >
              <Download size={14} /> Download PDF
            </a>
          </div>
        </div>

        {/* Main Printable Receipt Card */}
        <div
          className="glass-panel"
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Top Green Accent Bar */}
          <div style={{ height: '6px', background: 'var(--primary)' }} />

          <div style={{ padding: '24px 24px 16px' }}>
            {/* Header: Store Identity */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                  {businessName}
                </h1>
                {businessAddress && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                    {businessAddress}
                  </p>
                )}
                {businessPhone && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                    Contact: {businessPhone}
                  </p>
                )}
                {showGst && gstNumber && (
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 0' }}>
                    GSTIN: <span style={{ fontFamily: 'var(--font-mono)' }}>{gstNumber.toUpperCase()}</span>
                  </p>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Receipt Number
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--whatsapp)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  #{order.orderNumber}
                </span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {dateFormatted}
                </span>
              </div>
            </div>

            {/* Customer Information Strip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.84rem',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
                <strong style={{ color: 'var(--text-main)' }}>{order.customerName || 'Valued Customer'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                  +{order.customerPhone}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div style={{ padding: '16px 0 8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '8px', fontWeight: 700 }}>Item</th>
                    <th style={{ textAlign: 'center', paddingBottom: '8px', fontWeight: 700, width: '60px' }}>Qty</th>
                    <th style={{ textAlign: 'right', paddingBottom: '8px', fontWeight: 700, width: '90px' }}>Price</th>
                    <th style={{ textAlign: 'right', paddingBottom: '8px', fontWeight: 700, width: '90px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.productName}
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {currency}{item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                        {currency}{item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Totals Box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '10px', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>{currency}{order.subtotal.toFixed(2)}</span>
              </div>

              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '0.85rem', color: 'var(--emerald)', fontWeight: 600 }}>
                  <span>Discount:</span>
                  <span>-{currency}{order.discount.toFixed(2)}</span>
                </div>
              )}

              {order.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Tax:</span>
                  <span>{currency}{order.tax.toFixed(2)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '240px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  paddingTop: '8px',
                  marginTop: '4px',
                  borderTop: '2px solid var(--border-subtle)',
                }}
              >
                <span>Total:</span>
                <span style={{ color: 'var(--emerald)' }}>{currency}{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Badge */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--whatsapp)' }} />
                <span>Status: <strong>{paymentDisplay}</strong></span>
              </div>
            </div>

            {/* Google Review Banner (if enabled) */}
            {showGoogle && googleProfileUrl && (
              <div
                style={{
                  marginTop: '18px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#1d4ed8' }}>
                    Enjoyed your experience with us?
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Take a moment to review us on Google.
                  </span>
                </div>

                <a
                  href={googleProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    gap: '6px',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <Globe size={14} />
                  <span>Review on Google</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Footer note */}
            <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '8px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 4px', fontStyle: 'italic' }}>
                Thank you for your order! Have a great day.
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Powered by Hynox BillDesk
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
