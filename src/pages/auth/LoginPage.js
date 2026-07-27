import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { validateEmail } from '../../utils/helpers';

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}****@${domain}`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithTokens, isAuthenticated, isLoading: authLoading } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  // Step 1: Email + Password
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Step 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpServerError, setOtpServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first OTP input when OTP step appears
  useEffect(() => {
    if (emailSent && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 100);
    }
  }, [emailSent]);

  // Parse backend error and return a user-friendly message
  const parseError = (error) => {
    if (!error.response) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    const data = error.response.data;
    const status = error.response.status;

    if (status === 429) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    if (status === 500 || status === 502 || status === 503) {
      return 'A server error occurred. Please try again later.';
    }

    // Field-specific errors
    const emailMsg = data.email?.[0];
    const otpMsg = data.otp?.[0];
    const nonField = data.non_field_errors?.[0];
    const detail = data.detail;
    const msg = data.message;

    // Known backend error messages
    const text = emailMsg || otpMsg || nonField || detail || msg || '';
    if (text.includes('pending KYC')) {
      return 'Your account is pending KYC verification. Please complete identity verification to activate your account.';
    }
    if (text.includes('temporarily locked')) {
      return 'Your account has been temporarily locked due to too many failed attempts. Please try again later.';
    }
    if (text.includes('Invalid email or password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (text.includes('expired')) {
      return 'Verification code has expired. Please request a new one.';
    }
    if (text.includes('Too many failed attempts')) {
      return 'Too many failed attempts. Please request a new verification code.';
    }
    if (text.includes('Invalid verification code')) {
      return 'Invalid verification code. Please check and try again.';
    }
    if (text.includes('Failed to send')) {
      return 'Failed to send verification email. Please try again.';
    }
    if (text.includes('not found')) {
      return 'Session expired. Please go back and log in again.';
    }

    return text || 'Something went wrong. Please try again.';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setSendingOTP(true);
    try {
      await authService.sendLoginOTP(email, password);
      setEmailSent(true);
      setLoginError('');
      setResendCooldown(60);
    } catch (error) {
      setLoginError(parseError(error));
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setOtpServerError('');
    setSendingOTP(true);
    try {
      await authService.sendLoginOTP(email, password);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setOtpServerError('');
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (error) {
      setOtpServerError(parseError(error));
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError('');

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length >= 1) {
      const newOtp = pasted.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      setOtp(newOtp);
      const nextEmpty = Math.min(pasted.length, 5);
      inputRefs.current[nextEmpty]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpServerError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      const { access, user: userData } = await authService.verifyLoginOTP(email, otpCode);
      await loginWithTokens({ access, user: userData });
      navigate(from, { replace: true });
    } catch (error) {
      const msg = parseError(error);
      // OTP-specific field errors go under the inputs
      if (error.response?.data?.otp) {
        setOtpError(msg);
      } else {
        setOtpServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setEmailSent(false);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpServerError('');
    setLoginError('');
  };

  if (authLoading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        {/* Branding */}
        <div style={styles.branding}>
          <span style={styles.logo}>CrestPoint Credit</span>
          <p style={styles.brandSubtext}>Digital Banking</p>
        </div>

        {!emailSent ? (
          /* ── Step 1: Login (Email + Password) ── */
          <>
            <h2 style={styles.heading}>Welcome back</h2>
            <p style={styles.subheading}>Sign in to your account</p>

            {loginError && (
              <div style={styles.errorBox}>
                <div style={styles.errorIconWrap}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <span style={styles.errorText}>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={styles.form}>
              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setLoginError(''); }}
                error={emailError}
                required
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                }
              />

              <InputField
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setLoginError(''); }}
                error={passwordError}
                required
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />

              <div style={{ textAlign: 'right' }}>
                <Link to="/forgot-password" style={styles.forgotLink}>
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" fullWidth loading={sendingOTP} size="lg">
                Login
              </Button>
            </form>
          </>
        ) : (
          /* ── Step 2: OTP Verification ── */
          <>
            {/* Success indicator */}
            <div style={styles.otpHeader}>
              <div style={styles.otpIconCircle}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
            </div>

            <h2 style={styles.heading}>Check your email</h2>
            <p style={styles.subheading}>
              We sent a 6-digit verification code to <strong style={{ color: '#111827' }}>{maskEmail(email)}</strong>
            </p>

            {otpServerError && (
              <div style={styles.errorBox}>
                <div style={styles.errorIconWrap}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <span style={styles.errorText}>{otpServerError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} style={styles.form}>
              <div style={styles.otpSection}>
                <div style={styles.otpInputs}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      style={{
                        ...styles.otpInput,
                        borderColor: otpError ? '#dc2626' : digit ? '#1a56db' : '#d1d5db',
                        boxShadow: otpError ? '0 0 0 1px #dc2626' : digit ? '0 0 0 1px #1a56db' : 'none',
                      }}
                    />
                  ))}
                </div>
                {otpError && <span style={styles.fieldError}>{otpError}</span>}
              </div>

              <Button type="submit" fullWidth loading={isSubmitting} size="lg">
                Verify
              </Button>

              <div style={styles.resendRow}>
                {resendCooldown > 0 ? (
                  <span style={styles.resendTextDisabled}>
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={sendingOTP}
                    style={styles.resendBtn}
                  >
                    {sendingOTP ? 'Sending...' : 'Resend code'}
                  </button>
                )}
              </div>

              <button type="button" onClick={handleBackToLogin} style={styles.backBtn}>
                ← Back to login
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account?</span>{' '}
          <Link to="/register" style={styles.footerLink}>
            Create an account
          </Link>
        </div>

        <div style={styles.securityNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          <span style={styles.securityText}>Your connection is encrypted and secure</span>
        </div>
      </div>

      <style>{`
        @keyframes lc-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1a56db 30%, #3b82f6 60%, #6b7280 100%)',
    padding: '24px',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'lc-spin 0.6s linear infinite',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: '14px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), 0 20px 25px rgba(0,0,0,0.15)',
    padding: '40px 32px',
    boxSizing: 'border-box',
  },
  branding: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a56db',
    display: 'block',
    marginBottom: '4px',
    letterSpacing: '-0.3px',
  },
  brandSubtext: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0',
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 6px 0',
    textAlign: 'center',
  },
  subheading: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
    lineHeight: '20px',
    textAlign: 'center',
  },
  // Error box
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 14px',
    marginBottom: '20px',
  },
  errorIconWrap: {
    flexShrink: 0,
    marginTop: '1px',
  },
  errorText: {
    fontSize: '13px',
    color: '#991b1b',
    lineHeight: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  // OTP step
  otpHeader: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  otpIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  otpInputs: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  otpInput: {
    width: '46px',
    height: '54px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 600,
    border: '2px solid #d1d5db',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  fieldError: {
    fontSize: '13px',
    color: '#dc2626',
    textAlign: 'center',
  },
  resendRow: {
    textAlign: 'center',
  },
  resendBtn: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a56db',
    background: 'none',
    border: 'none',
    padding: '4px 0',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  resendTextDisabled: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#9ca3af',
  },
  forgotLink: {
    fontSize: '14px',
    color: '#1a56db',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
  backBtn: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  footerLink: {
    fontSize: '14px',
    color: '#1a56db',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '20px',
  },
  securityText: {
    fontSize: '12px',
    color: '#9ca3af',
  },
};
