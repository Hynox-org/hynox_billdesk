'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  MessageSquare,
  Download,
  Printer,
  Copy,
  Check,
  Plus,
  ExternalLink,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export interface ReceiptItemData {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sku?: string;
  discount?: number;
}

export interface ReceiptViewProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  createdAt: string;
  items: ReceiptItemData[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentId?: string;
  gstNumber?: string;
  showGst: boolean;
  googleProfileUrl?: string;
  showGoogle: boolean;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  whatsappUrl: string;
  receiptUrl: string;
}

export default function ReceiptView({
  orderNumber,
  customerName,
  customerPhone,
  customerEmail,
  notes,
  createdAt,
  items,
  subtotal,
  tax,
  discount,
  totalAmount,
  currency,
  paymentStatus,
  paymentMethod,
  paymentReference,
  paymentId,
  gstNumber,
  showGst,
  googleProfileUrl,
  showGoogle,
  businessName,
  businessAddress,
  businessPhone,
  whatsappUrl,
  receiptUrl,
}: ReceiptViewProps) {
  const [copied, setCopied] = useState(false);

  const dateObj = new Date(createdAt);
  const formattedDate = dateObj
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase();

  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentDisplayLabels: Record<string, string> = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI / QR',
    PAID_CASH: 'CASH',
    PAID_ONLINE: 'ONLINE / CARD / UPI',
    PENDING: 'PENDING',
    COD: 'CASH ON DELIVERY',
    PAID: 'PAID',
  };

  const paymentLabel = (
    paymentDisplayLabels[paymentStatus] ||
    paymentDisplayLabels[paymentMethod || ''] ||
    paymentMethod ||
    paymentStatus ||
    'CASH'
  ).toUpperCase();

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(receiptUrl || window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch (err) {
      console.error('Failed to copy receipt URL:', err);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="receipt-page-wrapper">
      <div className="receipt-two-section-layout">
        {/* ============================================================== */}
        {/* SECTION 1: ALL ACTION BUTTONS                                   */}
        {/* ============================================================== */}
        <aside className="receipt-actions-section receipt-screen-only">
          <div className="receipt-actions-card">
            {/* Action Card Header */}
            <div className="receipt-actions-header">
              <div>
                <span className="receipt-actions-subtitle">Manage Receipt</span>
                <h2 className="receipt-actions-title">Order Actions</h2>
              </div>
              <span className="receipt-status-pill receipt-status-paid">
                <CheckCircle2 size={13} />
                <span>Verified</span>
              </span>
            </div>

            {/* Action Buttons List */}
            <div className="receipt-actions-list">
              {/* Back to Orders */}
              <Link
                href="/dashboard/orders"
                className="btn btn-secondary receipt-action-btn"
                title="Return to Orders screen"
              >
                <ArrowLeft size={16} />
                <span>Back to Orders</span>
              </Link>

              {/* WhatsApp Share */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp receipt-action-btn"
                title="Send receipt to customer via WhatsApp"
              >
                <MessageSquare size={16} />
                <span>Share via WhatsApp</span>
              </a>

              {/* Download PDF */}
              <a
                href={`/api/receipts/${orderNumber}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary receipt-action-btn"
                title="Download official PDF invoice"
              >
                <Download size={16} style={{ color: 'var(--primary)' }} />
                <span>Download PDF</span>
              </a>

              {/* Print Receipt */}
              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary receipt-action-btn"
                title="Print thermal receipt"
              >
                <Printer size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>Print Receipt</span>
              </button>

              {/* New Order Link */}
              <Link
                href="/dashboard/pos"
                className="btn btn-secondary receipt-action-btn"
                title="Start a new sale in POS"
              >
                <Plus size={16} />
                <span>Take Next Order</span>
              </Link>
            </div>

            {/* Quick Context Summary */}
            <div className="receipt-actions-footer">
              <div className="receipt-actions-meta-row">
                <span>Receipt Number:</span>
                <strong className="receipt-mono-text">#{orderNumber}</strong>
              </div>
              <div className="receipt-actions-meta-row">
                <span>Total Amount:</span>
                <strong className="receipt-mono-text">
                  {currency}
                  {Number(totalAmount || 0).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* SECTION 2: THE ORDER BILL (EXACT RECEIPT UI STRUCTURE)          */}
        {/* ============================================================== */}
        <main className="receipt-bill-section">
          <div className="receipt-thermal-paper">
            {/* Top Sawtooth / Perforation Effect */}
            <div className="receipt-sawtooth-top" aria-hidden="true" />

            <div className="receipt-paper-body">
              {/* 1. Header: Store Information */}
              <header className="receipt-thermal-header">
                <h1 className="receipt-store-title">{businessName}</h1>
                {businessAddress && (
                  <p className="receipt-store-sub">{businessAddress}</p>
                )}
                {businessPhone && (
                  <p className="receipt-store-sub">TEL: {businessPhone}</p>
                )}
                {showGst && gstNumber && (
                  <p className="receipt-store-sub receipt-mono-text">
                    GSTIN: {gstNumber.toUpperCase()}
                  </p>
                )}
              </header>

              {/* Dashed Separator */}
              <div className="receipt-dashed-line" />

              {/* 2. Order Metadata & Customer */}
              <div className="receipt-meta-lines receipt-mono-text">
                <div className="receipt-meta-row">
                  <span className="receipt-meta-key">RECEIPT NO</span>
                  <span className="receipt-meta-val">#{orderNumber}</span>
                </div>
                <div className="receipt-meta-row">
                  <span className="receipt-meta-key">DATE</span>
                  <span className="receipt-meta-val">
                    {formattedDate} {formattedTime}
                  </span>
                </div>
                <div className="receipt-meta-row">
                  <span className="receipt-meta-key">CUSTOMER</span>
                  <span className="receipt-meta-val">
                    {customerName || 'VALUED CUSTOMER'}
                  </span>
                </div>
                {customerPhone && (
                  <div className="receipt-meta-row">
                    <span className="receipt-meta-key">CONTACT</span>
                    <span className="receipt-meta-val">+{customerPhone}</span>
                  </div>
                )}
                <div className="receipt-meta-row">
                  <span className="receipt-meta-key">PAYMENT</span>
                  <span className="receipt-meta-val">{paymentLabel} (PAID)</span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="receipt-dashed-line" />

              {/* 3. Itemized Bill Table */}
              <div className="receipt-items-thermal">
                <div className="receipt-items-thermal-head receipt-mono-text">
                  <span className="receipt-col-qty">QTY</span>
                  <span className="receipt-col-item">ITEM DESCRIPTION</span>
                  <span className="receipt-col-price">PRICE</span>
                  <span className="receipt-col-total">TOTAL</span>
                </div>

                <div className="receipt-dashed-line-thin" />

                <div className="receipt-items-thermal-body receipt-mono-text">
                  {items.map((item, idx) => (
                    <div key={idx} className="receipt-thermal-item-row">
                      <div className="receipt-thermal-item-main">
                        <span className="receipt-col-qty">{item.quantity}</span>
                        <div className="receipt-col-item">
                          <span className="receipt-item-name">{item.productName}</span>
                          {item.sku && (
                            <span className="receipt-item-sku-sub">
                              [SKU: {item.sku}]
                            </span>
                          )}
                        </div>
                        <span className="receipt-col-price">
                          {Number(item.unitPrice || 0).toFixed(2)}
                        </span>
                        <span className="receipt-col-total">
                          {Number(item.lineTotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="receipt-dashed-line" />

              {/* 4. Financial Totals & Breakdown */}
              <div className="receipt-totals-thermal receipt-mono-text">
                <div className="receipt-total-line">
                  <span>TOTAL ITEMS ({totalQuantity})</span>
                  <span>
                    {currency}
                    {Number(subtotal || 0).toFixed(2)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="receipt-total-line receipt-discount-text">
                    <span>DISCOUNT</span>
                    <span>
                      -{currency}
                      {Number(discount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="receipt-total-line">
                    <span>TAX / GST</span>
                    <span>
                      {currency}
                      {Number(tax || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Double Line Separator */}
                <div className="receipt-double-line" />

                <div className="receipt-grand-total-thermal">
                  <span className="receipt-grand-total-title">TOTAL AMOUNT</span>
                  <span className="receipt-grand-total-figure">
                    {currency}
                    {Number(totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Double Line Separator */}
                <div className="receipt-double-line" />

                <div className="receipt-total-line">
                  <span>AMOUNT PAID</span>
                  <span>
                    {currency}
                    {Number(totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="receipt-total-line">
                  <span>PAYMENT MODE</span>
                  <span>{paymentLabel}</span>
                </div>

                {paymentReference && (
                  <div className="receipt-total-line">
                    <span>TXN REF</span>
                    <span>{paymentReference}</span>
                  </div>
                )}

                {notes && (
                  <div className="receipt-order-note-line">
                    <span>NOTE:</span>
                    <p>{notes}</p>
                  </div>
                )}
              </div>

              {/* Dashed Separator */}
              <div className="receipt-dashed-line" />

              {/* 5. Barcode & Security Stamp */}
              <div className="receipt-barcode-section">
                <div className="receipt-barcode-thermal" aria-hidden="true">
                  ||| | |||| || ||| || |||| | ||| || |||| | ||| |||| | ||
                </div>
                <span className="receipt-barcode-caption receipt-mono-text">
                  *{orderNumber}*
                </span>
              </div>

              {/* 6. Google Review Notice (if enabled) */}
              {showGoogle && googleProfileUrl && (
                <div className="receipt-review-box receipt-screen-only">
                  <p className="receipt-review-text">
                    Enjoyed your experience? Review us on Google!
                  </p>
                  <a
                    href={googleProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="receipt-review-link"
                    title="Leave a Google review"
                  >
                    <span>Click here to leave a review</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* 7. Footer Appreciation */}
              <footer className="receipt-thermal-footer">
                <p className="receipt-appreciation-main">
                  *** THANK YOU FOR YOUR BUSINESS ***
                </p>
                <p className="receipt-appreciation-sub">PLEASE VISIT AGAIN</p>
                <div className="receipt-watermark-line">
                  <ShieldCheck size={12} />
                  <span>POWERED BY HYNOX BILLING</span>
                </div>
              </footer>
            </div>

            {/* Bottom Sawtooth / Perforation Effect */}
            <div className="receipt-sawtooth-bottom" aria-hidden="true" />
          </div>
        </main>
      </div>
    </div>
  );
}
