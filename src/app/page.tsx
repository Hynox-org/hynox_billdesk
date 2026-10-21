'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Zap,
  Store,
  ArrowRight,
  Clock,
  Sparkles,
  Receipt,
  Menu,
  X,
} from 'lucide-react';
import CountryDropdown from '@/components/CountryDropdown';
import { useCountry } from '@/context/CountryContext';

export default function LandingPage() {
  const { country } = useCountry();
  const [currency, setCurrency] = React.useState(country.currency || '$');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrency(country.currency || '$');
  }, [country.currency]);

  React.useEffect(() => {
    async function checkVendorCurrency() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.tenant?.currency) {
            setCurrency(data.tenant.currency);
          }
        }
      } catch {
        // Fallback to browser country currency
      }
    }
    checkVendorCurrency();
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const samplePhone = country.dialCode === '+1' ? '+1 (555) 019-2834' : `${country.dialCode} 98765 43210`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header className="landing-header">
        <div className="landing-brand-wrapper">
          <div className="landing-brand-icon">
            <Zap size={22} />
          </div>
          <div className="landing-header-brand-text">
            <div className="landing-brand-title">
              HYNOX <span style={{ color: 'var(--whatsapp)' }}>Billing</span>
            </div>
            <div className="landing-brand-subtitle">
              Multi-Tenant Orders & WhatsApp Receipts
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="landing-nav-btns landing-nav-desktop">
          <CountryDropdown />
          <Link href="/login" className="btn btn-secondary btn-sm landing-signin-btn">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm landing-register-btn">
            <span className="landing-register-text-full">Start 15-Day Free Trial</span>
            <span className="landing-register-text-short">Free Trial</span>
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="landing-hamburger-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <div className="landing-mobile-menu-section">
              <div className="landing-mobile-menu-section-title">Preferences</div>
              <div className="landing-mobile-prefs-row">
                <div className="landing-mobile-pref-item" style={{ flex: 1 }}>
                  <CountryDropdown />
                </div>
              </div>
            </div>

            <div className="landing-mobile-menu-divider" />

            <div className="landing-mobile-menu-section">
              <div className="landing-mobile-menu-section-title">Account & Access</div>
              <div className="landing-mobile-actions">
                <Link
                  href="/login"
                  className="btn btn-secondary btn-md landing-mobile-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary btn-md landing-mobile-btn landing-mobile-btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Store size={18} /> Start 15-Day Free Trial
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="landing-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="badge badge-trial landing-hero-badge">
            <Sparkles size={14} /> 15-Day Free Evaluation • Zero Gateway Required
          </div>

          <h1 className="landing-hero-title">
            Instant Point of Sale &{' '}
            <span className="gradient-text">
              WhatsApp Digital Receipts
            </span>
          </h1>

          <p className="landing-hero-desc">
            Empower your retail shop, cafe, boutique, or service counter with rapid catalog ordering.
            Generate formatted digital receipts and dispatch them directly to customer WhatsApp chats in one tap.
          </p>

          <div className="landing-hero-actions">
            <Link href="/register" className="btn btn-whatsapp btn-lg landing-hero-btn">
              <Store size={20} /> Register Your Business Now
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg landing-hero-btn">
              Sign In <ArrowRight size={18} />
            </Link>
          </div>

          <div className="landing-trust-row">
            <span>✓ No credit card required</span>
            <span>✓ Instant 15-day evaluation</span>
            <span>✓ Works on any mobile or desktop</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="landing-features-grid">
          <div className="glass-panel landing-feature-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.18)',
                color: 'var(--whatsapp)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <MessageSquare size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
              Direct WhatsApp Dispatch
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Eliminates expensive SMS gateways and printer paper jams. One click opens WhatsApp with a beautifully
              formatted, itemized receipt ready to send.
            </p>
          </div>

          <div className="glass-panel landing-feature-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.18)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Zap size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
              Instant Order Billing & Checkout
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              High-speed grid interface tailored for touchscreens and quick checkout. Add items to cart with single taps,
              auto-calculate taxes, and track today&apos;s revenue.
            </p>
          </div>

          <div className="glass-panel landing-feature-card">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.18)',
                color: 'var(--emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Clock size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
              15-Day Trial & RBAC
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Strict multi-tenant security isolating each business. Built-in 15-day trial engine with Super Admin
              manual extensions and Pro activation.
            </p>
          </div>
        </div>

        {/* Live Interactive Receipt Preview Section */}
        <div className="glass-panel landing-receipt-section">
          <div className="landing-receipt-header">
            <h2 className="landing-receipt-title">
              See How Your Customer Receives The Receipt
            </h2>
            <p className="landing-receipt-subtitle">
              Clean, professional, and formatted in WhatsApp markdown without requiring third-party API keys.
            </p>
          </div>

          <div className="landing-receipt-grid">
            {/* Left: What POS Generates */}
            <div className="landing-receipt-cart-box">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  <Receipt size={18} /> Point of Sale Cart Summary
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Oat Milk Flat White (x2)</span>
                  <span style={{ fontWeight: 600 }}>{currency}9.50</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Almond Croissant (x1)</span>
                  <span style={{ fontWeight: 600 }}>{currency}4.25</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span>Truffle Mushroom Panini (x1)</span>
                  <span style={{ fontWeight: 600 }}>{currency}9.75</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>Total Bill (Incl. Tax)</span>
                  <span style={{ color: 'var(--emerald)' }}>{currency}23.50</span>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Target Customer WhatsApp:
                </div>
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--whatsapp)',
                    border: '1px solid var(--border-subtle)',
                    wordBreak: 'break-all',
                  }}
                >
                  {samplePhone}
                </div>
              </div>
            </div>

            {/* Right: WhatsApp Chat Simulation */}
            <div className="landing-whatsapp-chat-box">
              <div className="landing-whatsapp-header">
                <div className="landing-merchant-avatar">
                  BB
                </div>
                <div>
                  <div className="landing-merchant-name">
                    Brew & Bite Artisan Cafe
                  </div>
                  <div className="landing-merchant-badge">Verified Merchant</div>
                </div>
              </div>

              {/* Message Bubble */}
              <div className="landing-whatsapp-bubble">
                {`*RECEIPT: #ORD-2610-8472*
*Brew & Bite Artisan Cafe*
Address: 742 Artisan Walkway
Contact: +1 555-019-2834
GST: 22AAAAA0000A1Z5
Date: Oct 18, 2026, 02:45 PM
Customer: Valued Customer
━━━━━━━━━━━━━━━━━━━━
• *Oat Milk Flat White*
  2 x ${currency}4.75 = *${currency}9.50*
• *Almond Croissant*
  1 x ${currency}4.25 = *${currency}4.25*
• *Truffle Mushroom Panini*
  1 x ${currency}9.75 = *${currency}9.75*
━━━━━━━━━━━━━━━━━━━━
Subtotal: ${currency}23.50
*TOTAL: ${currency}23.50*
━━━━━━━━━━━━━━━━━━━━
Payment: Paid via Cash

*Review us on Google:*
https://g.page/r/brew-and-bite/review

_Thank you for your order!_`}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="landing-demo-banner">
          <h3 className="landing-demo-title">
            Ready to test all user journeys immediately?
          </h3>
          <p className="landing-demo-desc">
            We have pre-seeded full demo accounts: Super Admin, Active 15-Day Vendor, and an Expired Trial account so you can
            verify the paywall and trial extensions right away.
          </p>
          <div className="landing-demo-actions">
            <Link href="/login" className="btn btn-primary landing-demo-btn">
              View Quick-Fill Demo Logins <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="btn btn-secondary landing-demo-btn">
              Create New Business Account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="landing-footer"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px 32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          backgroundColor: 'var(--bg-header)',
        }}
      >
        © 2026 HYNOX Billing. Multi-Tenant Architecture & Direct WhatsApp Order Dispatching.
      </footer>
    </div>
  );
}
