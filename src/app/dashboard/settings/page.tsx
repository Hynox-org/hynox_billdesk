'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Store,
  User,
  Lock,
  Shield,
  Save,
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  KeyRound,
  RefreshCw,
  Mail,
  FileText,
  Globe,
} from 'lucide-react';
import { useCountry } from '@/context/CountryContext';
import { BUSINESS_TYPES, getBusinessTypeDescription } from '@/lib/businessTypes';

interface SettingsData {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
  };
  tenant: {
    id: string;
    businessName: string;
    businessType?: string;
    slug: string;
    phone: string;
    currency: string;
    address: string;
    location?: string;
    city?: string;
    province?: string;
    provinceCode?: string;
    zip?: string;
    country?: string;
    defaultEmployee?: string;
    defaultTaxName?: string;
    defaultTax2Name?: string;
    deviceId?: string;
    gstNumber?: string;
    showGstOnReceipt?: boolean;
    googleProfileUrl?: string;
    showGoogleReviewOnReceipt?: boolean;
    plan: 'FREE_TRIAL' | 'PRO';
    status: string;
    trialStartsAt: string;
    trialEndsAt: string;
    daysRemaining: number;
    isExpired: boolean;
    isPro: boolean;
    createdAt: string;
  };
}

export default function SettingsPage() {
  const { country } = useCountry();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'business' | 'personal' | 'security'>('business');

  // Business Form State
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail shops');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('Main Store');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [zip, setZip] = useState('');
  const [countryName, setCountryName] = useState('');
  const [defaultEmployee, setDefaultEmployee] = useState('');
  const [defaultTaxName, setDefaultTaxName] = useState('GST 18%');
  const [defaultTax2Name, setDefaultTax2Name] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [currency, setCurrency] = useState('$');
  const [gstNumber, setGstNumber] = useState('');
  const [showGstOnReceipt, setShowGstOnReceipt] = useState(false);
  const [googleProfileUrl, setGoogleProfileUrl] = useState('');
  const [showGoogleReviewOnReceipt, setShowGoogleReviewOnReceipt] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessFeedback, setBusinessFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Personal Form State
  const [fullName, setFullName] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalFeedback, setPersonalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Reset State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const json = await res.json();
          setData(json);
          // Pre-populate forms
          setBusinessName(json.tenant?.businessName || '');
          setBusinessType(json.tenant?.businessType || 'Retail shops');
          let rawPhone = json.tenant?.phone || '';
          const cleanDial = country.dialCode.replace(/\D/g, '');
          if (rawPhone.startsWith(cleanDial) && rawPhone.length > cleanDial.length) {
            rawPhone = rawPhone.slice(cleanDial.length);
          }
          setPhone(rawPhone);
          setAddress(json.tenant?.address || '');
          setLocation(json.tenant?.location || 'Main Store');
          setCity(json.tenant?.city || '');
          setProvince(json.tenant?.province || '');
          setProvinceCode(json.tenant?.provinceCode || '');
          setZip(json.tenant?.zip || '');
          setCountryName(json.tenant?.country || '');
          setDefaultEmployee(json.tenant?.defaultEmployee || '');
          setDefaultTaxName(json.tenant?.defaultTaxName || 'GST 18%');
          setDefaultTax2Name(json.tenant?.defaultTax2Name || '');
          setDeviceId(json.tenant?.deviceId || '');
          setCurrency(json.tenant?.currency || '$');
          setGstNumber(json.tenant?.gstNumber || '');
          setShowGstOnReceipt(Boolean(json.tenant?.showGstOnReceipt));
          setGoogleProfileUrl(json.tenant?.googleProfileUrl || '');
          setShowGoogleReviewOnReceipt(Boolean(json.tenant?.showGoogleReviewOnReceipt));
          setFullName(json.user?.fullName || '');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [country.dialCode]);

  // Handle Business Form Save
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setBusinessFeedback(null);

    const dialDigits = country.dialCode.replace(/\D/g, '');
    let subscriberDigits = phone.replace(/\D/g, '');
    if (subscriberDigits.startsWith(dialDigits) && subscriberDigits.length > dialDigits.length) {
      subscriberDigits = subscriberDigits.slice(dialDigits.length);
    }
    const fullPhone = subscriberDigits ? `${dialDigits}${subscriberDigits}` : phone;

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessType,
          phone: fullPhone,
          address,
          location,
          city,
          province,
          provinceCode,
          zip,
          country: countryName,
          defaultEmployee,
          defaultTaxName,
          defaultTax2Name,
          deviceId,
          currency,
          gstNumber,
          showGstOnReceipt,
          googleProfileUrl,
          showGoogleReviewOnReceipt,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update business details');

      setBusinessFeedback({ type: 'success', text: 'Business profile and receipt visibility settings updated successfully!' });
      // Update local state
      if (data) {
        setData({
          ...data,
          tenant: {
            ...data.tenant,
            businessName,
            businessType,
            phone,
            address,
            location,
            city,
            province,
            provinceCode,
            zip,
            country: countryName,
            defaultEmployee,
            defaultTaxName,
            defaultTax2Name,
            deviceId,
            currency,
            gstNumber,
            showGstOnReceipt,
            googleProfileUrl,
            showGoogleReviewOnReceipt,
          },
        });
      }
    } catch (err: any) {
      setBusinessFeedback({ type: 'error', text: err.message || 'Error updating business settings' });
    } finally {
      setSavingBusiness(false);
    }
  };

  // Handle Personal Form Save
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setPersonalFeedback(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update personal profile');

      setPersonalFeedback({ type: 'success', text: 'Personal profile name updated successfully!' });
      if (data) {
        setData({
          ...data,
          user: { ...data.user, fullName },
        });
      }
    } catch (err: any) {
      setPersonalFeedback({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setSavingPersonal(false);
    }
  };

  // Request Email OTP for Password Reset (validates current password first)
  const handleRequestPasswordOtp = async () => {
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'Please enter your current password' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'New password and confirmation password do not match' });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordFeedback({ type: 'error', text: 'New password must be different from your current password' });
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch('/api/settings/password/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to dispatch verification code');

      setOtpSent(true);
      setResendCooldown(60);
      setPasswordOtp('');
      setPasswordFeedback({
        type: 'success',
        text: result.message || `Current password verified. A 6-digit verification code was sent to ${data?.user?.email}.`,
      });
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Error validating password' });
    } finally {
      setSendingOtp(false);
    }
  };

  // Resend Email OTP
  const handleResendPasswordOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setPasswordFeedback(null);
    setSendingOtp(true);

    try {
      const res = await fetch('/api/settings/password/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to resend code');

      setResendCooldown(60);
      setPasswordFeedback({
        type: 'success',
        text: `A fresh 6-digit verification code has been dispatched to ${data?.user?.email}.`,
      });
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Error resending code' });
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Password Reset Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!otpSent) {
      await handleRequestPasswordOtp();
      return;
    }

    if (!passwordOtp || passwordOtp.trim().length !== 6) {
      setPasswordFeedback({ type: 'error', text: 'Please enter the 6-digit verification code sent to your email' });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          otp: passwordOtp.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to reset password');

      setPasswordFeedback({
        type: 'success',
        text: 'Your password has been successfully reset! A confirmation notice was dispatched to your email.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
      setOtpSent(false);
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Error resetting password' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        Loading account settings...
      </div>
    );
  }

  const tenant = data?.tenant;
  const user = data?.user;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* Navigation Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`btn btn-sm ${activeTab === 'business' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '10px', gap: '6px' }}
        >
          <Store size={15} /> Business Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`btn btn-sm ${activeTab === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '10px', gap: '6px' }}
        >
          <User size={15} /> Personal Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '10px', gap: '6px' }}
        >
          <Key size={15} /> Security & Password
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: BUSINESS PROFILE                                             */}
      {/* =================================================================== */}
      {activeTab === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Editable Business Information Card */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Store size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Manage Business Details</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>These details appear on your printed and WhatsApp customer receipts.</p>
              </div>
            </div>

            {businessFeedback && (
              <div
                style={{
                  background: businessFeedback.type === 'success' ? 'rgba(6, 78, 59, 0.5)' : 'rgba(127, 29, 29, 0.4)',
                  border: `1px solid ${businessFeedback.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: businessFeedback.type === 'success' ? '#a7f3d0' : '#fecaca',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                {businessFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{businessFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveBusiness}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Business / Shop Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Type *</label>
                  <select
                    className="form-select"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.id} value={bt.name}>
                        {bt.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {getBusinessTypeDescription(businessType)}
                  </div>
                </div>

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
                      value={phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        const cleanDial = country.dialCode.replace(/\D/g, '');
                        if (val.startsWith(cleanDial) && val.length > cleanDial.length) {
                          val = val.slice(cleanDial.length);
                        }
                        setPhone(val);
                      }}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Currency Symbol *</label>
                  <select
                    className="form-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
                  >
                    <option value="$">$ (USD / CAD / AUD)</option>
                    <option value="₹">₹ (INR - India)</option>
                    <option value="€">€ (EUR - Eurozone)</option>
                    <option value="£">£ (GBP - United Kingdom)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="QAR">QAR (Qatari Riyal)</option>
                    <option value="S$">S$ (SGD - Singapore)</option>
                    <option value="RM">RM (MYR - Malaysia)</option>
                    <option value="₱">₱ (PHP - Philippines)</option>
                    <option value="৳">৳ (BDT - Bangladesh)</option>
                    <option value="₨">₨ (PKR / LKR - Rupee)</option>
                    <option value="¥">¥ (JPY / CNY - Japan / China)</option>
                    <option value="CHF">CHF (Swiss Franc)</option>
                    <option value="kr">kr (SEK / NOK / DKK - Nordic)</option>
                    <option value="R$">R$ (BRL - Brazil)</option>
                    <option value="R">R (ZAR - South Africa)</option>
                    <option value="KSh">KSh (KES - Kenya)</option>
                    <option value="₦">₦ (NGN - Nigeria)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Branch Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Main Store, Outlet 1"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Staff / Cashier Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cashier 1"
                    value={defaultEmployee}
                    onChange={(e) => setDefaultEmployee(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">POS Terminal / Device ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. POS-01"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                  />
                </div>
              </div>

              {/* Business Location & Address Section */}
              <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Store Address &amp; Export Location
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Used for orders billing &amp; shipping details in official export files.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. No. 20, Elementary School 2nd Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tiruppur, Chennai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State / Province</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tamil Nadu, Karnataka"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State Code (2-letter)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. TN, KA, MH"
                      value={provinceCode}
                      onChange={(e) => setProvinceCode(e.target.value.toUpperCase())}
                      style={{ textTransform: 'uppercase' }}
                      maxLength={4}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postal / Zip Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 641602"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. India or IN"
                      value={countryName}
                      onChange={(e) => setCountryName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Google Online Presence (Receipt Configuration) */}
              <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Tax &amp; Online Presence
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {/* GST & Tax Labels Card */}
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'var(--color-light-green)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                        }}
                      >
                        <FileText size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>GST &amp; Tax Configuration</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Tax Number and Export Tax Labels</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>GSTIN / Tax Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="GSTIN or Tax ID"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Tax 1 Label</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. GST 18%, IGST 18%"
                          value={defaultTaxName}
                          onChange={(e) => setDefaultTaxName(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>Tax 2 Label (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. SGST 9%"
                          value={defaultTax2Name}
                          onChange={(e) => setDefaultTax2Name(e.target.value)}
                        />
                      </div>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: showGstOnReceipt ? 'var(--color-light-green)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${showGstOnReceipt ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginTop: 'auto',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showGstOnReceipt}
                        onChange={(e) => setShowGstOnReceipt(e.target.checked)}
                        style={{
                          marginTop: '3px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: 'var(--whatsapp)',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                          Visible on Order Receipt
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          Display GST number under your business name on customer WhatsApp order receipts upon creation.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Google Profile Link Card */}
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563eb',
                        }}
                      >
                        <Globe size={16} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Google Profile Link</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Business Profile & Reviews</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Google Profile / Review URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="Google profile or review URL"
                        value={googleProfileUrl}
                        onChange={(e) => setGoogleProfileUrl(e.target.value)}
                      />
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: showGoogleReviewOnReceipt ? 'var(--color-light-green)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${showGoogleReviewOnReceipt ? 'var(--border-medium)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginTop: 'auto',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={showGoogleReviewOnReceipt}
                        onChange={(e) => setShowGoogleReviewOnReceipt(e.target.checked)}
                        style={{
                          marginTop: '3px',
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: 'var(--whatsapp)',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                          Visible on Order Receipt
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          Include a "Review us on Google" link at the bottom of customer WhatsApp order receipts upon creation.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="submit"
                  disabled={savingBusiness}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  <Save size={16} />
                  <span>{savingBusiness ? 'Saving Changes...' : 'Save Business Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Restricted Business Details Card */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--emerald-deep)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Restricted Store Details</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>These core platform identifiers and billing tiers are locked to protect data integrity.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {/* Unique Slug */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Store Identifier Slug</span>
                  <span className="badge badge-admin" style={{ fontSize: '0.68rem', gap: '4px' }}>
                    <Lock size={10} /> Locked
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  {tenant?.slug || '—'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Unique URL route assigned during self-registration.
                </div>
              </div>

              {/* Subscription Tier */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Subscription Tier</span>
                  <span className="badge badge-admin" style={{ fontSize: '0.68rem', gap: '4px' }}>
                    <Lock size={10} /> Managed
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tenant?.isPro ? (
                    <span className="badge badge-pro"><Sparkles size={12} /> PRO Plan</span>
                  ) : tenant?.isExpired ? (
                    <span className="badge badge-expired">Trial Expired</span>
                  ) : (
                    <span className="badge badge-trial">{tenant?.daysRemaining} Days Left</span>
                  )}
                  {!tenant?.isPro && (
                    <Link href="/dashboard/paywall" style={{ fontSize: '0.8rem', color: 'var(--whatsapp)', textDecoration: 'underline', marginLeft: 'auto', fontWeight: 600 }}>
                      Upgrade
                    </Link>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {tenant?.isPro ? 'Full access with no billing limits.' : `Trial expires: ${new Date(tenant?.trialEndsAt || '').toLocaleDateString()}`}
                </div>
              </div>

              {/* Account Status */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Account Status</span>
                  <span className="badge badge-admin" style={{ fontSize: '0.68rem', gap: '4px' }}>
                    <Lock size={10} /> Locked
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: tenant?.status === 'ACTIVE' ? 'var(--emerald)' : 'var(--moss-badge-text)' }}>
                  {tenant?.status || 'ACTIVE'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Monitored and managed by Super Admin plane.
                </div>
              </div>

              {/* Registration Date */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Store Provisioned Date</span>
                  <span className="badge badge-admin" style={{ fontSize: '0.68rem', gap: '4px' }}>
                    <Clock size={10} /> Record
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Initial vendor registration timestamp.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PERSONAL PROFILE                                             */}
      {/* =================================================================== */}
      {activeTab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <User size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Personal Profile</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage your personal identity as store administrator.</p>
              </div>
            </div>

            {personalFeedback && (
              <div
                style={{
                  background: personalFeedback.type === 'success' ? 'rgba(6, 78, 59, 0.5)' : 'rgba(127, 29, 29, 0.4)',
                  border: `1px solid ${personalFeedback.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: personalFeedback.type === 'success' ? '#a7f3d0' : '#fecaca',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                {personalFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{personalFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSavePersonal}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Full Name (Editable) */}
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Account Email (Restricted) */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Account Email Address</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--moss-badge-text)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={11} /> Locked
                    </span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ opacity: 0.65, cursor: 'not-allowed', background: 'var(--bg-input)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Primary authentication identity. To update your login email, contact system support.
                  </span>
                </div>

                {/* Account Role (Restricted) */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Assigned Access Role</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--moss-badge-text)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={11} /> Locked
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value="Store Owner (Vendor Role)"
                    disabled
                    style={{ opacity: 0.65, cursor: 'not-allowed', background: 'var(--bg-input)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Full privileges over menu catalog, POS billing, and WhatsApp receipts.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  <Save size={16} />
                  <span>{savingPersonal ? 'Saving Profile...' : 'Save Personal Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SECURITY & RESET PASSWORD                                    */}
      {/* =================================================================== */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Key size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Reset Account Password</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update your password credentials to keep your vendor store secure.</p>
              </div>
            </div>

            {passwordFeedback && (
              <div
                style={{
                  background: passwordFeedback.type === 'success' ? 'rgba(6, 78, 59, 0.5)' : 'rgba(127, 29, 29, 0.4)',
                  border: `1px solid ${passwordFeedback.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: passwordFeedback.type === 'success' ? '#a7f3d0' : '#fecaca',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                {passwordFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ maxWidth: '480px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your existing password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group" style={{ marginBottom: otpSent ? '14px' : '20px' }}>
                <label className="form-label">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* 6-Digit Email Verification Code */}
              {otpSent && (
                <div
                  className="form-group"
                  style={{
                    marginBottom: '20px',
                    background: 'var(--color-light-green)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--whatsapp)' }}>
                      <KeyRound size={15} /> 6-Digit Email Code *
                    </label>
                    <button
                      type="button"
                      onClick={handleResendPasswordOtp}
                      disabled={resendCooldown > 0 || sendingOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--whatsapp)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      <RefreshCw size={12} className={sendingOtp ? 'spin' : ''} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    className="form-input"
                    placeholder="123456"
                    value={passwordOtp}
                    onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      fontSize: '1.25rem',
                      letterSpacing: '6px',
                      fontWeight: 800,
                      textAlign: 'center',
                      fontFamily: 'monospace',
                    }}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block', textAlign: 'center' }}>
                    Code dispatched to <strong>{user?.email}</strong>. Check inbox or spam.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={savingPassword || sendingOtp || (otpSent && passwordOtp.length !== 6)}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  {otpSent ? (
                    <>
                      <Key size={16} />
                      <span>{savingPassword ? 'Verifying & Updating...' : 'Verify Code & Reset Password'}</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      <span>{sendingOtp ? 'Validating & Dispatching Code...' : 'Validate & Send Verification Code'}</span>
                    </>
                  )}
                </button>

                {otpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setPasswordOtp('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
