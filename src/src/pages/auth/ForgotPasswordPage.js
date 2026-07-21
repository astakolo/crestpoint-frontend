import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { validateEmail } from '../../utils/helpers';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (serverError) setServerError('');
  };

  const handleBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(email);
      // Always show success (security: don't reveal if email exists)
      setIsSubmitted(true);
    } catch (error) {
      // Even on error, show the same success message for security
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        {/* Branding */}
        <div style={styles.branding}>
          <span style={styles.logo}>🏦</span>
          <h1 style={styles.brandName}>CrestPoint Credit</h1>
        </div>

        {/* Icon */}
        <div style={styles.iconContainer}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m16 12-4-4-4 4" />
            <path d="M12 16V8" />
          </svg>
        </div>

        {!isSubmitted ? (
          <>
            {/* Heading */}
            <h2 style={styles.heading}>Reset Password</h2>
            <p style={styles.subheading}>
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            {/* Alert */}
            {serverError && (
              <div style={{ marginBottom: '20px' }}>
                <Alert type="error" message={serverError} onClose={() => setServerError('')} />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@example.com"
                error={emailError}
                required
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                }
              />

              <Button type="submit" fullWidth loading={isSubmitting} size="lg">
                Send Reset Instructions
              </Button>
            </form>
          </>
        ) : (
          <>
            {/* Success state */}
            <div style={styles.successContainer}>
              <div style={styles.successIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 style={styles.heading}>Check your email</h2>
              <p style={styles.subheading}>
                If an account exists with this email, you will receive password reset instructions.
              </p>
              <p style={styles.successNote}>
                Please check your spam folder if you don't see the email in your inbox.
              </p>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
              >
                Try a different email
              </Button>
            </div>
          </>
        )}

        {/* Back to login */}
        <div style={styles.footer}>
          <Link to="/login" style={styles.footerLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Sign In
          </Link>
        </div>
      </div>
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
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), 0 20px 25px rgba(0,0,0,0.15)',
    padding: '40px 32px',
    boxSizing: 'border-box',
  },
  branding: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logo: {
    fontSize: '36px',
    display: 'block',
    marginBottom: '6px',
  },
  brandName: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    margin: '0',
    letterSpacing: '-0.025em',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
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
    margin: '0 0 28px 0',
    lineHeight: '20px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  successContainer: {
    textAlign: 'center',
  },
  successIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    marginBottom: '16px',
  },
  successNote: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '0',
    marginTop: '4px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  footerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#1a56db',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
