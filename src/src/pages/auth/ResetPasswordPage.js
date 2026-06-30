import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { validatePassword } from '../../utils/helpers';

function getPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const met = Object.values(checks).filter(Boolean).length;
  let color = '#dc2626';
  if (met >= 4) color = '#059669';
  else if (met >= 2) color = '#d97706';
  return { checks, met, color };
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateField = (name) => {
    const newErrors = { ...errors };

    if (name === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const validation = validatePassword(formData.password);
        if (!validation.valid) {
          newErrors.password = validation.errors[0];
        } else {
          delete newErrors.password;
        }
      }
      // Re-validate confirm
      if (touched.confirmPassword && formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
      }
    } else if (name === 'confirmPassword') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const validateForm = () => {
    const newErrors = {};
    setTouched({ password: true, confirmPassword: true });

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const validation = validatePassword(formData.password);
      if (!validation.valid) newErrors.password = validation.errors[0];
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!token) {
      newErrors.token = 'Invalid or missing reset token';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await authService.confirmPasswordReset({
        token,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
      setIsSuccess(true);
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.token?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        'Failed to reset password. The link may have expired. Please request a new one.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <div style={styles.branding}>
            <span style={styles.logo}>🏦</span>
            <h1 style={styles.brandName}>CrestPoint Credit</h1>
          </div>

          <div style={styles.successContainer}>
            <div style={styles.successIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 style={styles.heading}>Password Reset Successful</h2>
            <p style={styles.subheading}>
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button fullWidth size="lg">
                Continue to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Missing token state
  if (!token) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.card}>
          <div style={styles.branding}>
            <span style={styles.logo}>🏦</span>
            <h1 style={styles.brandName}>CrestPoint Credit</h1>
          </div>

          <div style={styles.successContainer}>
            <div style={{ ...styles.successIcon, backgroundColor: '#fef2f2' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={styles.heading}>Invalid Reset Link</h2>
            <p style={styles.subheading}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
              <Button fullWidth size="lg" variant="outline">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Heading */}
        <h2 style={styles.heading}>Set New Password</h2>
        <p style={styles.subheading}>
          Enter your new password below. Make sure it's strong and secure.
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
            label="New Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Create a new password"
            error={touched.password ? errors.password : ''}
            required
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />

          {/* Password strength */}
          {formData.password && (
            <div style={styles.strengthContainer}>
              <div style={styles.strengthChecks}>
                {[
                  { key: 'length', label: '8+ characters', met: strength.checks.length },
                  { key: 'uppercase', label: 'Uppercase letter', met: strength.checks.uppercase },
                  { key: 'lowercase', label: 'Lowercase letter', met: strength.checks.lowercase },
                  { key: 'number', label: 'Number', met: strength.checks.number },
                ].map((req) => (
                  <div key={req.key} style={styles.strengthCheck}>
                    <span style={{
                      ...styles.checkIcon,
                      color: req.met ? strength.color : '#d1d5db',
                    }}>
                      {req.met ? '✓' : '○'}
                    </span>
                    <span style={{
                      ...styles.checkLabel,
                      color: req.met ? '#111827' : '#9ca3af',
                    }}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
              <div style={styles.strengthBarBg}>
                <div
                  style={{
                    ...styles.strengthBar,
                    width: `${(strength.met / 4) * 100}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
            </div>
          )}

          <InputField
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Confirm your new password"
            error={touched.confirmPassword ? errors.confirmPassword : ''}
            required
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
          />

          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Reset Password
          </Button>
        </form>

        {/* Back */}
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
  strengthContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  strengthChecks: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
  },
  strengthCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  checkIcon: {
    fontSize: '12px',
    fontWeight: 600,
    width: '14px',
    textAlign: 'center',
  },
  checkLabel: {
    fontSize: '12px',
    lineHeight: '16px',
  },
  strengthBarBg: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s, background-color 0.3s',
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
