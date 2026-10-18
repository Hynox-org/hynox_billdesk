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
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header
        className="landing-header"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          padding: '18px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--bg-header)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #25D366 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px var(--whatsapp-glow)',
            }}
          >
            <Zap size={22} />
          </div>
          <div className="landing-header-brand-text">
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Bill<span style={{ color: 'var(--whatsapp)' }}>Desk</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Multi-Tenant POS & WhatsApp Receipts
            </div>
          </div>
        </div>

        <nav className="landing-nav-btns" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ThemeToggle />
          <Link href="/login" className="btn btn-secondary btn-sm">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            <span className="landing-nav-subtitle">Start 15-Day Free Trial</span>
            <span className="show-mobile" style={{ display: 'none' }}>Register</span>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="landing-hero" style={{ flex: 1, padding: '60px 24px 80px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 60px' }}>
          <div
            className="badge badge-trial"
            style={{ marginBottom: '20px', padding: '6px 16px', fontSize: '0.85rem' }}
          >
            <Sparkles size={14} /> 15-Day Free Evaluation • Zero Gateway Required
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '24px',
              color: 'var(--text-main)',
            }}
          >
            Instant Point of Sale &{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              WhatsApp Digital Receipts
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '36px',
            }}
          >
            Empower your retail shop, cafe, boutique, or service counter with rapid catalog ordering.
            Generate formatted digital receipts and dispatch them directly to customer WhatsApp chats in one tap.
          </p>

          <div
            className="landing-hero-actions"
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}
          >
            <Link href="/register" className="btn btn-whatsapp btn-lg">
              <Store size={20} /> Register Your Business Now
            </Link>
            <Link href="/login" className="btn btn-secondary btn-lg">
              Demo Credentials & Sign In <ArrowRight size={18} />
            </Link>
          </div>

          <div className="landing-trust-row" style={{ display: 'flex', justifyContent: 'center', gap: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>✓ No credit card required</span>
            <span>✓ Instant 15-day evaluation</span>
            <span>✓ Works on any mobile or desktop</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div
          className="landing-features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}
        >
          <div className="glass-panel" style={{ padding: '32px' }}>
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

          <div className="glass-panel" style={{ padding: '32px' }}>
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
              Rapid POS Order Terminal
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              High-speed grid interface tailored for touchscreens and quick checkout. Add items to cart with single taps,
              auto-calculate taxes, and track today&apos;s revenue.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
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
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '960px', margin: '0 auto 64px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
              See How Your Customer Receives The Receipt
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Clean, professional, and formatted in WhatsApp markdown without requiring third-party API keys.
            </p>
          </div>

          <div
            className="landing-receipt-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {/* Left: What POS Generates */}
            <div
              style={{
                background: 'var(--bg-input)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-subtle)',
              }}
            >
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
                <span style={{ fontWeight: 600 }}>$9.50</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Almond Croissant (x1)</span>
                <span style={{ fontWeight: 600 }}>$4.25</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Truffle Mushroom Panini (x1)</span>
                <span style={{ fontWeight: 600 }}>$9.75</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 800, fontSize: '1.1rem' }}>
                <span>Total Bill (Incl. Tax)</span>
                <span style={{ color: 'var(--emerald)' }}>$23.50</span>
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
                  }}
                >
                  +1 (555) 019-2834
                </div>
              </div>
            </div>

            {/* Right: WhatsApp Chat Simulation */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  BB
                </div>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                    Brew & Bite Artisan Cafe
                  </div>
                  <div style={{ color: 'var(--whatsapp)', fontSize: '0.75rem', fontWeight: 600 }}>Verified Merchant</div>
                </div>
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  padding: '14px 16px',
                  borderRadius: '10px 10px 0 10px',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                {`RECEIPT: #ORD-2610-8472
Brew & Bite Artisan Cafe
Oct 17, 2026, 02:45 PM
Customer: Valued Customer
━━━━━━━━━━━━━━━━━━━━
• Oat Milk Flat White
  2 x $4.75 = $9.50
• Almond Croissant
  1 x $4.25 = $4.25
• Truffle Mushroom Panini
  1 x $9.75 = $9.75
━━━━━━━━━━━━━━━━━━━━
Subtotal: $23.50
TOTAL: $23.50
━━━━━━━━━━━━━━━━━━━━
Status: Paid via Cash
Address: 742 Evergreen Terrace
_Thank you for your order!_`}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Fast Login Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(37, 211, 102, 0.18) 100%)',
            border: '1px solid var(--border-medium)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
            Ready to test all user journeys immediately?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '640px', margin: '0 auto 24px' }}>
            We have pre-seeded full demo accounts: Super Admin, Active 15-Day Vendor, and an Expired Trial account so you can
            verify the paywall and trial extensions right away.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary">
              View Quick-Fill Demo Logins <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="btn btn-secondary">
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
        © 2026 BillDesk. Multi-Tenant Architecture & Direct WhatsApp Order Dispatching.
      </footer>
    </div>
  );
}
