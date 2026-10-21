'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Store,
  Briefcase,
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
import CountryDropdown from '@/components/CountryDropdown';
import { useCountry } from '@/context/CountryContext';
import { BUSINESS_TYPES, getBusinessTypeDescription } from '@/lib/businessTypes';

export default function RegisterPage() {
  const router = useRouter();
  const { country } = useCountry();
  const [step, setStep] = useState<'form' | 'otp'>('form');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'Retail shops',
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
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
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

    if (!formData.businessType) {
      setError('Please select your business type');
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
          email: formData.email.trim().toLowerCase(),
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
          email: formData.email.trim().toLowerCase(),
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
          email: formData.email.trim().toLowerCase(),
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
    <div className="auth-page-container">
      {/* Country Dropdown */}
      <div className="auth-top-controls">
        <CountryDropdown />
      </div>

      <div className="auth-wrapper auth-wrapper-register">
        {/* Header */}
        <div className="auth-header">
          <Link href="/" className="auth-brand-link">
            <div className="auth-brand-icon">
              <Zap size={20} />
            </div>
            <span className="auth-brand-title">
              HYNOX <span style={{ color: 'var(--whatsapp)' }}>Billing</span>
            </span>
          </Link>
          <div>
            <div
              className="badge badge-trial"
              style={{ marginBottom: '12px', padding: '4px 12px' }}
            >
              <Sparkles size={12} /> Instant 15-Day Free Trial Provisioned
            </div>
          </div>
          <h1 className="auth-title">
            {step === 'form' ? 'Register Your Business' : 'Verify Your Email'}
          </h1>
          <p className="auth-subtitle">
            {step === 'form'
              ? 'Set up your store catalog and start dispatching WhatsApp receipts in minutes'
              : `Enter the 6-digit verification code dispatched to ${formData.email}`}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel auth-card">
          {error && (
            <div className="auth-banner-error">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
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
                    placeholder="Full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label">
                  Email Address *
                </label>
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
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
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
                    placeholder="Business / Store name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Business Type */}
              <div className="form-group">
                <label className="form-label">Business Type *</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <select
                    className="form-select"
                    style={{ paddingLeft: '36px' }}
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    required
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.id} value={bt.name}>
                        {bt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginTop: '6px',
                    padding: '6px 10px',
                    background: 'var(--color-light-green)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    lineHeight: '1.4',
                  }}
                >
                  <strong style={{ color: 'var(--primary)' }}>{formData.businessType}:</strong>{' '}
                  {getBusinessTypeDescription(formData.businessType)}
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
                <label className="form-label">
                  Business WhatsApp Phone *
                </label>
                <div className="phone-fixed-input-group">
                  <div
                    className="phone-fixed-prefix"
                    title={`${country.name} (${country.dialCode})`}
                  >
                    <span className="phone-fixed-prefix-code">{country.code}</span>
                    <span>{country.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    className="form-input phone-fixed-input"
                    placeholder="Phone number"
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
                className="btn btn-whatsapp auth-submit-btn"
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
                  padding: '8px 0 20px 0',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--color-light-green)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    color: 'var(--primary)',
                  }}
                >
                  <Mail size={26} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                  Enter Verification Code
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  We sent a 6-digit confirmation code to:
                </p>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--whatsapp)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {formData.email}
                </div>
              </div>

              {/* 6-Digit OTP Input */}
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                  6-Digit Email Code
                </label>
                <div className="auth-otp-wrapper">
                  <KeyRound
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--whatsapp)',
                      zIndex: 1,
                    }}
                  />
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    className="form-input auth-otp-input"
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
                className="btn btn-whatsapp auth-submit-btn"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying & Provisioning Workspace...' : 'Verify & Launch Store Workspace'}
                <CheckCircle2 size={18} />
              </button>

              {/* Actions row: Resend & Edit Details */}
              <div className="auth-otp-actions-row">
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

        <div className="auth-footer">
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--whatsapp)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
