import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { validateEmail, validatePassword } from '../../utils/helpers';

function getPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const met = Object.values(checks).filter(Boolean).length;
  let color = '#dc2626'; // red
  if (met >= 4) color = '#059669'; // green
  else if (met >= 2) color = '#d97706'; // yellow
  return { checks, met, color };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateField = (name) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'firstName':
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'lastName':
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        } else {
          delete newErrors.lastName;
        }
        break;
      case 'email':
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (formData.phone && !/^[\d\s\-+()]{7,20}$/.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'password':
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
        // Also re-validate confirm password if it was touched
        if (touched.confirmPassword && formData.confirmPassword) {
          if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
      case 'confirmPassword':
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const validateForm = () => {
    const fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
    let allValid = true;
    const newErrors = {};

    fields.forEach((field) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      switch (field) {
        case 'firstName':
          if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
          break;
        case 'lastName':
          if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
          break;
        case 'email':
          if (!formData.email.trim()) newErrors.email = 'Email is required';
          else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
          break;
        case 'password':
          if (!formData.password) newErrors.password = 'Password is required';
          else {
            const validation = validatePassword(formData.password);
            if (!validation.valid) newErrors.password = validation.errors[0];
          }
          break;
        case 'confirmPassword':
          if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
          else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
          break;
        default:
          break;
      }
    });

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
      allValid = false;
    }

    if (formData.phone && !/^[\d\s\-+()]{7,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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
      await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      navigate('/dashboard', {
        state: { registrationSuccess: true },
      });
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        'Registration failed. Please try again.';
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
          <span style={styles.logo}>🏦</span>
          <h1 style={styles.brandName}>CrestPoint Credit</h1>
          <p style={styles.brandSubtext}>Digital Banking</p>
        </div>

        {/* Heading */}
        <h2 style={styles.heading}>Create your account</h2>
        <p style={styles.subheading}>Start banking with us in minutes</p>

        {/* Alert */}
        {serverError && (
          <div style={{ marginBottom: '20px' }}>
            <Alert type="error" message={serverError} onClose={() => setServerError('')} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name row */}
          <div style={styles.nameRow}>
            <div style={{ flex: 1 }}>
              <InputField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.firstName ? errors.firstName : ''}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <InputField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.lastName ? errors.lastName : ''}
                required
              />
            </div>
          </div>

          <InputField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : ''}
            required
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />

          <InputField
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.phone ? errors.phone : ''}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            }
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : ''}
            required
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />

          {/* Password strength indicator */}
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
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword ? errors.confirmPassword : ''}
            required
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
          />

          {/* Terms */}
          <div style={styles.termsRow}>
            <label style={styles.termsLabel}>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span style={styles.termsText}>
                I agree to the{' '}
                <span style={styles.termsLink}>Terms of Service</span>
                {' '}and{' '}
                <span style={styles.termsLink}>Privacy Policy</span>
              </span>
            </label>
            {errors.agreeTerms && (
              <span style={styles.termsError}>{errors.agreeTerms}</span>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" fullWidth loading={isSubmitting} size="lg">
            Create Account
          </Button>
        </form>

        {/* Login link */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Already have an account?</span>{' '}
          <Link to="/login" style={styles.footerLink}>
            Sign in
          </Link>
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
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), 0 20px 25px rgba(0,0,0,0.15)',
    padding: '36px 32px',
    boxSizing: 'border-box',
  },
  branding: {
    textAlign: 'center',
    marginBottom: '28px',
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
    margin: '0 0 4px 0',
    letterSpacing: '-0.025em',
  },
  brandSubtext: {
    fontSize: '12px',
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
    margin: '0 0 24px 0',
    lineHeight: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  nameRow: {
    display: 'flex',
    gap: '12px',
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
  termsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  termsLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#1a56db',
    cursor: 'pointer',
    marginTop: '2px',
    flexShrink: 0,
    borderRadius: '4px',
  },
  termsText: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '18px',
  },
  termsLink: {
    color: '#1a56db',
    cursor: 'pointer',
  },
  termsError: {
    fontSize: '12px',
    color: '#dc2626',
    marginLeft: '24px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
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
};
