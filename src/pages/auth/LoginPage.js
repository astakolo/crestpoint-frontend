import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { validateEmail } from '../../utils/helpers';

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  const masked = '****';
  return `${visible}${masked}@${domain}`;
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

  // Step 2: OTP only
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [serverError, setServerError] = useState('');
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

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    setServerError('');
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
      setResendCooldown(60);
    } catch (error) {
      const emailMsg = error.response?.data?.email?.[0];
      const detail = error.response?.data?.detail;
      const message = emailMsg || detail || 'Failed to send verification code. Please try again.';
      setServerError(message);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setSendingOTP(true);
    try {
      await authService.sendLoginOTP(email, password);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (error) {
      setOtpError('Failed to resend code. Please try again.');
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

    // Auto-focus next input
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
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setOtpError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify OTP — backend returns JWT tokens directly
      const { user: userData } = await authService.verifyLoginOTP(email, otpCode);
      await loginWithTokens({ user: userData });
      navigate(from, { replace: true });
    } catch (error) {
      if (error.response?.data?.otp) {
        setOtpError(error.response.data.otp);
      } else {
        const message =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.response?.data?.non_field_errors?.[0] ||
          'Verification failed. Please try again.';
        setServerError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToEmail = () => {
    setEmailSent(false);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setServerError('');
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

        {/* Alert */}
        {serverError && (
          <div style={{ marginBottom: '20px' }}>
            <Alert type="error" message={serverError} onClose={() => setServerError('')} />
          </div>
        )}

        {!emailSent ? (
          /* ── Step 1: Enter Email + Password ── */
          <>
            <h2 style={styles.heading}>Welcome back</h2>
            <p style={styles.subheading}>Enter your credentials to receive a verification code</p>

            <form onSubmit={handleSendOTP} style={styles.form}>
              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
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
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                error={passwordError}
                required
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />

              {/* Forgot password */}
              <div style={{ textAlign: 'right' }}>
                <Link to="/forgot-password" style={styles.forgotLink}>
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" fullWidth loading={sendingOTP} size="lg">
                Send Verification Code
              </Button>
            </form>
          </>
        ) : (
          /* ── Step 2: OTP Only (credentials already verified) ── */
          <>
            <h2 style={styles.heading}>Verify your identity</h2>
            <p style={styles.subheading}>
              We sent a code to <strong style={{ color: '#111827' }}>{maskEmail(email)}</strong>
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* OTP Input */}
              <div style={styles.otpSection}>
                <label style={styles.otpLabel}>Verification Code</label>
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
                      }}
                    />
                  ))}
                </div>
                {otpError && <span style={styles.fieldError}>{otpError}</span>}
                <div style={styles.resendRow}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || sendingOTP}
                    style={{
                      ...styles.resendBtn,
                      color: resendCooldown > 0 ? '#9ca3af' : '#1a56db',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend code'}
                  </button>
                </div>
              </div>

              <Button type="submit" fullWidth loading={isSubmitting} size="lg">
                Sign In
              </Button>

              <button type="button" onClick={handleBackToEmail} style={styles.backBtn}>
                Use a different email
              </button>
            </form>
          </>
        )}

        {/* Register link */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account?</span>{' '}
          <Link to="/register" style={styles.footerLink}>
            Create an account
          </Link>
        </div>

        {/* Security note */}
        <div style={styles.securityNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          <span style={styles.securityText}>
            Your connection is encrypted and secure
          </span>
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
  },
  subheading: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 28px 0',
    lineHeight: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  otpSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  otpLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  },
  otpInputs: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  otpInput: {
    width: '44px',
    height: '52px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 600,
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s',
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
    background: 'none',
    border: 'none',
    padding: '4px 0',
    fontFamily: 'Inter, -apple-system, sans-serif',
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