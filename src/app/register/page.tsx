'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Store,
  User,
  Mail,
  Lock,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import CountryDropdown from '@/components/CountryDropdown';
import { useCountry } from '@/context/CountryContext';

export default function RegisterPage() {
  const router = useRouter();
  const { country } = useCountry();
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    address: '',
    currency: '$',
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Request OTP from server
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your business email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.businessName.trim()) {
      setError('Please enter your business / store name');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your WhatsApp business phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          type: 'REGISTER',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('otp');
      setResendCooldown(60);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Error sending verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError(null);
    setResending(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          type: 'REGISTER',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Error resending code');
    } finally {
      setResending(false);
    }
  };

  // Submit OTP & Complete Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email');
      return;
    }

    setLoading(true);

    const dialDigits = country.dialCode.replace(/\D/g, '');
    let subscriberDigits = formData.phone.replace(/\D/g, '');
    if (subscriberDigits.startsWith(dialDigits) && subscriberDigits.length > dialDigits.length) {
      subscriberDigits = subscriberDigits.slice(dialDigits.length);
    }
    const fullPhone = subscriberDigits ? `${dialDigits}${subscriberDigits}` : formData.phone;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: fullPhone,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      // Automatically routed directly to their dedicated Vendor Dashboard POS
      router.push('/dashboard/pos');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        position: 'relative',
      }}
    >
      {/* Floating Country & Theme in Top Right */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CountryDropdown />
        <ThemeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #25D366 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px var(--whatsapp-glow)',
              }}
            >
              <Zap size={20} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Bill<span style={{ color: 'var(--whatsapp)' }}>Desk</span>
            </span>
          </Link>
          <div
            className="badge badge-trial"
            style={{ marginBottom: '12px', padding: '4px 12px' }}
          >
            <Sparkles size={12} /> Instant 15-Day Free Trial Provisioned
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
            {step === 'form' ? 'Register Your Business' : 'Verify Your Email'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {step === 'form'
              ? 'Set up your store catalog and start dispatching WhatsApp receipts in minutes'
              : `Enter the 6-digit verification code dispatched to ${formData.email}`}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(6, 78, 59, 0.5)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#a7f3d0',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleRequestOtp}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User
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
                    style={{ paddingLeft: '36px' }}
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label">Business Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail
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
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    placeholder="john@yourstore.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  A 6-digit verification code will be sent to this email before activating your account.
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock
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
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Business Name */}
              <div className="form-group">
                <label className="form-label">Store / Company Name *</label>
                <div style={{ position: 'relative' }}>
                  <Store
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
                    style={{ paddingLeft: '36px' }}
                    placeholder="e.g. Acme Artisan Bakery"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Currency Preference */}
              <div className="form-group">
                <label className="form-label">Store Currency *</label>
                <select
                  className="form-select"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  required
                >
                  <option value="$">$ (USD / CAD / AUD)</option>
                  <option value="₹">₹ (INR - India)</option>
                  <option value="£">£ (GBP - United Kingdom)</option>
                  <option value="€">€ (EUR - European Union)</option>
                  <option value="AED">AED (United Arab Emirates)</option>
                  <option value="SAR">SAR (Saudi Arabia)</option>
                  <option value="S$">S$ (SGD - Singapore)</option>
                  <option value="RM">RM (MYR - Malaysia)</option>
                  <option value="Rp">Rp (IDR - Indonesia)</option>
                  <option value="₱">₱ (PHP - Philippines)</option>
                  <option value="฿">฿ (THB - Thailand)</option>
                  <option value="PKR">PKR (Pakistan)</option>
                  <option value="৳">৳ (BDT - Bangladesh)</option>
                  <option value="LKR">LKR (Sri Lanka)</option>
                  <option value="NPR">NPR (Nepal)</option>
                  <option value="R">R (ZAR - South Africa)</option>
                  <option value="₦">₦ (NGN - Nigeria)</option>
                  <option value="KSh">KSh (KES - Kenya)</option>
                </select>
              </div>

              {/* Business WhatsApp Phone with Fixed Country Code */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Business WhatsApp Phone *</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Country: {country.name} ({country.dialCode})
                  </span>
                </label>
                <div className="phone-fixed-input-group">
                  <div
                    className="phone-fixed-prefix"
                    title={`Fixed Country Dial Code: ${country.name} (${country.dialCode})`}
                  >
                    <span className="phone-fixed-prefix-code">{country.code}</span>
                    <span>{country.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    className="form-input phone-fixed-input"
                    placeholder="e.g. 98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      const cleanDial = country.dialCode.replace(/\D/g, '');
                      if (val.startsWith(cleanDial) && val.length > cleanDial.length) {
                        val = val.slice(cleanDial.length);
                      }
                      setFormData({ ...formData, phone: val });
                    }}
                    required
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Dial code {country.dialCode} is fixed from header selection. Stored as: {country.dialCode} {formData.phone || '...'}
                </div>
              </div>

              {/* Store Address */}
              <div className="form-group">
                <label className="form-label">Store Address (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <MapPin
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
                    style={{ paddingLeft: '36px' }}
                    placeholder="Street, City, State"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-whatsapp"
                style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Sending Verification Code...' : 'Verify Email & Create Workspace'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* OTP Verification Screen */
            <form onSubmit={handleVerifyAndRegister}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px 0 24px 0',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(37, 211, 102, 0.12)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'var(--whatsapp)',
                  }}
                >
                  <Mail size={28} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                  Enter Verification Code
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  We sent a 6-digit confirmation code to:
                </p>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--whatsapp)', marginTop: '4px' }}>
                  {formData.email}
                </div>
              </div>

              {/* 6-Digit OTP Input */}
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                  6-Digit Email Code
                </label>
                <div style={{ position: 'relative', maxWidth: '280px', margin: '0 auto' }}>
                  <KeyRound
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--whatsapp)',
                    }}
                  />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    className="form-input"
                    style={{
                      paddingLeft: '42px',
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      letterSpacing: '8px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                    }}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                  Code valid for 10 minutes. Check your inbox or spam folder.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-whatsapp"
                style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying & Provisioning Workspace...' : 'Verify & Launch Store Workspace'}
                <CheckCircle2 size={18} />
              </button>

              {/* Actions row: Resend & Edit Details */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setError(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: resendCooldown > 0 ? 0.6 : 1,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw size={14} className={resending ? 'spin' : ''} />
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--whatsapp)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
