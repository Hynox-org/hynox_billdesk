'use client';

import React, { useEffect, useState } from 'react';
import {
  Lock,
  MessageSquare,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function PaywallPage() {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.tenant) setTenant(data.tenant);
      });
  }, []);

  const adminWhatsAppUrl = `https://wa.me/918870524355?text=${encodeURIComponent(
    `Hello HYNOX Billing Super Admin, I would like to upgrade my business (${tenant?.businessName || 'My Store'}) to the Pro Subscription plan.`
  )}`;

  return (
    <div
      style={{
        maxWidth: '820px',
        margin: '20px auto 60px',
        padding: '0 16px',
        textAlign: 'center',
      }}
    >
      {/* Lock Icon */}
      <div
        className="paywall-pulse"
        style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'var(--color-light-green)',
          border: '2px solid var(--border-medium)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <Lock size={38} />
      </div>

      <div className="badge badge-expired" style={{ marginBottom: '14px', padding: '6px 14px' }}>
        Trial Window Concluded
      </div>

      <h1
        style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
        }}
      >
        Your 15-Day Free Trial Has Expired
      </h1>

      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}
      >
        We hope you enjoyed using HYNOX Billing POS! Your Point of Sale ordering and catalog write operations
        have been safely paused for <strong>{tenant?.businessName || 'your business'}</strong>.
        Your existing orders and catalog records remain securely preserved.
      </p>

      {/* Offline Upgrade Instructions Box */}
      <div
        className="glass-panel"
        style={{
          padding: '36px',
          textAlign: 'left',
          marginBottom: '32px',
          border: '1px solid var(--border-medium)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={22} style={{ color: 'var(--whatsapp)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>How to Activate Pro Access</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
          As part of our zero-gateway architecture, subscription upgrades are verified offline and manually
          activated by our Super Administration team.
        </p>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-input)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Step 1
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-main)' }}>
              Contact Super Admin
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Send an instant WhatsApp message or email using the buttons below.
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-input)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--whatsapp)',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Step 2
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-main)' }}>
              Select Subscription Term
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Choose Monthly Pro ($19/mo) or Annual Unlimited with offline invoice/settlement.
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-input)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--emerald)',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Step 3
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-main)' }}>
              Instant Activation
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Super Admin flips your account flag to PRO or extends your trial.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a
            href={adminWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp btn-lg"
            style={{ flex: 1, minWidth: '260px' }}
          >
            <MessageSquare size={20} /> Upgrade via WhatsApp Support <ExternalLink size={16} />
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-secondary btn-lg"
          >
            <RefreshCw size={18} /> Check Activation Status
          </button>
        </div>
      </div>
    </div>
  );
}
