import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { validateEmail } from '../../utils/helpers';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = error.response?.data?.non_field_errors?.[0] || detail || 'Invalid email or password. Please try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
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

        <h2 style={styles.heading}>Welcome back</h2>
        <p style={styles.subheading}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
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

          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Sign In
          </Button>
        </form>

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
  forgotLink: {
    fontSize: '14px',
    color: '#1a56db',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
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