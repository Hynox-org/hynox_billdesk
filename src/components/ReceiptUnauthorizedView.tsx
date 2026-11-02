import React from 'react';
import Link from 'next/link';
import { ShieldAlert, FileText, LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';

interface ReceiptUnauthorizedViewProps {
  orderNumber?: string;
  pdfUrl?: string;
}

export default function ReceiptUnauthorizedView({
  orderNumber,
  pdfUrl,
}: ReceiptUnauthorizedViewProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base, #F6F9F7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'var(--font-sans, "Outfit", sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-card, #FFFFFF)',
          border: '1px solid var(--border-medium, rgba(8, 127, 91, 0.22))',
          borderRadius: '20px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(8, 127, 91, 0.06)',
          padding: '36px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top accent gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, var(--primary, #087F5B) 100%)',
          }}
        />

        {/* Security Shield Icon */}
        <div
          style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 18px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <ShieldAlert size={34} strokeWidth={2.2} />
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#b91c1c',
            fontSize: '0.74rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          <span>Access Restricted</span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-main, #111111)',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
          }}
        >
          You Are Not Authorized
        </h1>

        {/* Explanatory Subtitle */}
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary, rgba(17, 17, 17, 0.72))',
            lineHeight: 1.55,
            margin: '0 0 22px 0',
          }}
        >
          This interactive store management portal is reserved exclusively for verified store owners and cashier staff.
        </p>

        {/* Customer Callout (If an order number exists) */}
        {orderNumber && pdfUrl && (
          <div
            style={{
              background: 'var(--primary-light, #DDF3E8)',
              border: '1px solid var(--border-medium, rgba(8, 127, 91, 0.28))',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '22px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
                color: 'var(--primary, #087F5B)',
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              <FileText size={17} />
              <span>Looking for your customer bill?</span>
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-main, #111111)',
                lineHeight: 1.45,
                margin: '0 0 12px 0',
              }}
            >
              Your official PDF receipt for <strong>#{orderNumber}</strong> is available for public download without logging in.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '11px 16px',
                background: 'var(--primary, #087F5B)',
                color: '#ffffff',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px var(--primary-glow, rgba(8, 127, 91, 0.25))',
                transition: 'transform 0.15s ease',
              }}
            >
              <FileText size={16} />
              <span>Open 80mm PDF Receipt</span>
            </a>
          </div>
        )}

        {/* Staff Actions Cluster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '11px 16px',
              background: 'var(--bg-card, #FFFFFF)',
              color: 'var(--text-main, #111111)',
              border: '1px solid var(--border-medium, rgba(8, 127, 91, 0.28))',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <LogIn size={16} style={{ color: 'var(--primary, #087F5B)' }} />
            <span>Store Staff Login</span>
          </Link>

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '9px 16px',
              background: 'transparent',
              color: 'var(--text-muted, rgba(17, 17, 17, 0.52))',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.82rem',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Footer Brand Seal */}
        <div
          style={{
            marginTop: '26px',
            paddingTop: '16px',
            borderTop: '1px dashed var(--border-subtle, rgba(8, 127, 91, 0.14))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-muted, rgba(17, 17, 17, 0.52))',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--primary, #087F5B)' }} />
          <span>POWERED BY HYNOX BILLING</span>
        </div>
      </div>
    </div>
  );
}
