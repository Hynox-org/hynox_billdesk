'use client';

import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Lock, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';

type Plan = { id: 'REGULAR' | 'PREMIUM'; name: string; price: number; duration: string; days: number; description: string; featured?: boolean };
type TenantSummary = { businessName?: string };

const plans: readonly Plan[] = [
  { id: 'REGULAR', name: 'Regular', price: 299, duration: '1 month', days: 30, description: 'Flexible monthly access for growing stores.' },
  { id: 'PREMIUM', name: 'Premium', price: 799, duration: '3 months', days: 90, description: 'Best value with uninterrupted quarterly access.', featured: true },
] as const;

export default function PaywallPage() {
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [selected, setSelected] = useState<Plan['id']>('PREMIUM');

  useEffect(() => {
    fetch('/api/auth/me').then((res) => res.json()).then((data) => setTenant(data.tenant || null));
  }, []);

  const plan = plans.find((item) => item.id === selected)!;
  const message = `Hello HYNOX Billing Super Admin, I would like the ${plan.name} subscription (₹${plan.price} for ${plan.duration}) for ${tenant?.businessName || 'My Store'}.`;
  const adminWhatsAppUrl = `https://wa.me/918870524355?text=${encodeURIComponent(message)}`;

  return (
    <main style={{ maxWidth: 900, margin: '24px auto 64px', padding: '0 16px', textAlign: 'center' }}>
      <div className="paywall-pulse" style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-light-green)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}><Lock size={34} /></div>
      <div className="badge badge-expired" style={{ marginBottom: 12 }}>Subscription Required</div>
      <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>Choose Your HYNOX Billing Plan</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 28px', lineHeight: 1.6 }}>Your data is safely preserved. Select a plan to restore access for <strong>{tenant?.businessName || 'your store'}</strong>.</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 22 }} aria-label="Subscription plans">
        {plans.map((item) => {
          const active = selected === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setSelected(item.id)} aria-pressed={active}
              style={{ position: 'relative', textAlign: 'left', padding: 24, borderRadius: 18, border: `2px solid ${active ? 'var(--primary)' : 'var(--border-medium)'}`, background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', boxShadow: active ? '0 10px 30px var(--primary-glow)' : 'none' }}>
              {item.featured && <span className="badge badge-pro" style={{ position: 'absolute', right: 16, top: 16 }}><Sparkles size={11} /> Best Value</span>}
              <h2 style={{ fontSize: '1.35rem', marginBottom: 8 }}>{item.name}</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}><strong style={{ fontSize: '2.2rem' }}>₹{item.price}</strong><span style={{ color: 'var(--text-muted)' }}>/ {item.duration}</span></div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{item.description}</p>
              <div style={{ display: 'grid', gap: 8, fontSize: '.9rem' }}>
                <span><Check size={15} style={{ verticalAlign: 'middle', color: 'var(--whatsapp)' }} /> Full POS, catalog and orders</span>
                <span><Check size={15} style={{ verticalAlign: 'middle', color: 'var(--whatsapp)' }} /> Reports and exports</span>
                <span><Check size={15} style={{ verticalAlign: 'middle', color: 'var(--whatsapp)' }} /> {item.days} days of access</span>
              </div>
            </button>
          );
        })}
      </section>

      <div className="glass-panel" style={{ padding: 24, textAlign: 'left' }}>
        <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => window.alert(`Online payment for the ${plan.name} plan (₹${plan.price}) is coming soon. No charge was made and access was not changed.`)}>
          Pay ₹{plan.price} · {plan.name} <span style={{ fontSize: '.75rem', opacity: .8 }}>(Coming Soon)</span>
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: '.82rem', textAlign: 'center', margin: '10px 0 18px' }}>This is a payment placeholder. It never activates access without admin verification.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href={adminWhatsAppUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ flex: 1, minWidth: 240, justifyContent: 'center' }}><MessageSquare size={18} /> Request {plan.name} Activation <ExternalLink size={14} /></a>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-secondary"><RefreshCw size={17} /> Check Access</button>
        </div>
      </div>
    </main>
  );
}
