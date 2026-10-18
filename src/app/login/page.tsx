'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'FORGOT_EMAIL' | 'FORGOT_VERIFY';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown
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

  // Handle Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check role or expiration to redirect accordingly
      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (data.tenant?.isExpired) {
        router.push('/dashboard/paywall');
      } else {
        router.push('/dashboard/pos');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Password Reset OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setError('Please enter your account email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          type: 'FORGOT_PASSWORD',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch password reset code');
      }

      setMode('FORGOT_VERIFY');
      setResendCooldown(60);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(`A 6-digit reset code was dispatched to ${forgotEmail.trim()}`);
    } catch (err: any) {
      setError(err.message || 'Error sending reset code');
    } finally {
      setLoading(false);
    }
  };

  // Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError(null);
    setResending(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          type: 'FORGOT_PASSWORD',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setResendCooldown(60);
      setSuccessMsg('A fresh verification code has been dispatched to your email.');
    } catch (err: any) {
      setError(err.message || 'Error resending code');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Submit OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code from your email');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters in length');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // Transition back to login with success alert
      setMode('LOGIN');
      setEmail(forgotEmail.trim());
      setPassword('');
      setSuccessMsg('Your password has been successfully reset. Please sign in with your new password.');
    } catch (err: any) {
      setError(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-wrapper">
        {/* Brand Header */}
        <div className="auth-header">
          <Link href="/" className="auth-brand-link">
            <div className="auth-brand-icon">
              <Zap size={20} />
            </div>
            <span className="auth-brand-title">
              Bill<span style={{ color: 'var(--whatsapp)' }}>Desk</span>
            </span>
          </Link>

          <h1 className="auth-title">
            {mode === 'LOGIN' && 'Welcome back'}
            {mode === 'FORGOT_EMAIL' && 'Reset your password'}
            {mode === 'FORGOT_VERIFY' && 'Enter Verification Code'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'LOGIN' && 'Sign in to manage your Point of Sale catalog and orders'}
            {mode === 'FORGOT_EMAIL' && 'Enter your account email to receive a password reset verification code'}
            {mode === 'FORGOT_VERIFY' && `Enter the 6-digit code dispatched to ${forgotEmail}`}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel auth-card">
          {/* Error Banner */}
          {error && (
            <div className="auth-banner-error">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="auth-banner-success">
              <CheckCircle2 size={18} style={{ color: 'var(--whatsapp)', flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: Standard Login Form */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
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
                    style={{ paddingLeft: '38px' }}
                    placeholder="name@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="auth-password-header">
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_EMAIL');
                      setForgotEmail(email);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="auth-forgot-link"
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
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
                    style={{ paddingLeft: '38px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* MODE 2: Forgot Password - Request OTP */}
          {mode === 'FORGOT_EMAIL' && (
            <form onSubmit={handleRequestForgotOtp}>
              <div className="form-group">
                <label className="form-label">Registered Account Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
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
                    autoFocus
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="name@business.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  We will send a 6-digit verification code to this address.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-whatsapp auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Dispatching Verification Code...' : 'Send Verification Code'} <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: Forgot Password - Verify OTP & Set New Password */}
          {mode === 'FORGOT_VERIFY' && (
            <form onSubmit={handleResetPassword}>
              {/* 6-Digit Code */}
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                  6-Digit Verification Code
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                  Check your inbox for the code sent to {forgotEmail}
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
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
                    style={{ paddingLeft: '38px' }}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
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
                    style={{ paddingLeft: '38px' }}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-whatsapp auth-submit-btn"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Updating Password...' : 'Reset Password & Sign In'} <CheckCircle2 size={16} />
              </button>

              {/* Actions row: Resend & Cancel */}
              <div className="auth-otp-actions-row">
                <button
                  type="button"
                  onClick={() => {
                    setMode('FORGOT_EMAIL');
                    setError(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendForgotOtp}
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
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <div className="auth-footer">
          Don&apos;t have a business account yet?{' '}
          <Link href="/register" style={{ color: 'var(--whatsapp)', fontWeight: 600 }}>
            Start 15-Day Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
