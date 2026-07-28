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
  return `${local.slice(0, 2)}****@${domain}`;
}

function parseError(error) {
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  const { data, status } = error.response;
  if (status === 429) return 'Too many attempts. Please wait a moment before trying again.';
  if (status >= 500) return 'A server error occurred. Please try again later.';

  const text =
    data.email?.[0] ||
    data.otp?.[0] ||
    data.non_field_errors?.[0] ||
    data.detail ||
    data.message ||
    '';

  if (text.includes('pending KYC'))
    return 'Your account is pending KYC verification. Please complete identity verification to activate your account.';
  if (text.includes('temporarily locked'))
    return 'Your account has been temporarily locked due to too many failed attempts. Please try again later.';
  if (text.includes('Invalid email or password'))
    return 'Invalid email or password. Please check your credentials and try again.';
  if (text.includes('expired'))
    return 'Verification code has expired. Please request a new one.';
  if (text.includes('Too many failed attempts'))
    return 'Too many failed attempts. Please request a new verification code.';
  if (text.includes('Invalid verification code'))
    return 'Invalid verification code. Please check and try again.';
  if (text.includes('Failed to send'))
    return 'Failed to send verification email. Please try again.';
  if (text.includes('not found'))
    return 'Session expired. Please go back and log in again.';

  return text || 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithTokens, isAuthenticated, isLoading: authLoading } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = login, 2 = OTP
  const [loginError, setLoginError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpServerError, setOtpServerError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) navigate(from, { replace: true });
  }, [isAuthenticated, authLoading, navigate, from]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 150);
    }
  }, [step]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) { setEmailError('Email is required'); return; }
    if (!validateEmail(email)) { setEmailError('Please enter a valid email address'); return; }
    if (!password) { setPasswordError('Password is required'); return; }

    setLoading(true);
    try {
      await authService.sendLoginOTP(email, password);
      setStep(2);
      setResendCooldown(60);
      setLoginError('');
    } catch (err) {
      setLoginError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setOtpServerError('');
    setLoading(true);
    try {
      await authService.sendLoginOTP(email, password);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setOtpServerError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (digits.length >= 1) {
      setOtp(digits.split('').concat(['', '', '', '', '', '']).slice(0, 6));
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpServerError('');
    const code = otp.join('');
    if (code.length !== 6) { setOtpError('Please enter the complete 6-digit code'); return; }

    setLoading(true);
    try {
      const { access, user: userData } = await authService.verifyLoginOTP(email, code);
      await loginWithTokens({ access, user: userData });
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.otp) {
        setOtpError(parseError(err));
      } else {
        setOtpServerError(parseError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setOtpServerError('');
    setLoginError('');
  };

  if (authLoading) {
    return (
      <div style={S.page}>
        <div style={S.loadWrap}><div style={S.spinner}/><span style={S.loadTxt}>Loading...</span></div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.brand}>
          <span style={S.logo}>CrestPoint Credit</span>
          <p style={S.brandSub}>Digital Banking</p>
        </div>

        {step === 1 ? (
          <>
            <h2 style={S.heading}>Welcome back</h2>
            <p style={S.sub}>Sign in to your account</p>

            {loginError && (
              <div style={S.errBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span style={S.errTxt}>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={S.form}>
              <InputField label="Email Address" type="email" name="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setLoginError(''); }}
                error={emailError} required
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              />
              <InputField label="Password" type="password" name="password" value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setLoginError(''); }}
                error={passwordError} required
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
              <div style={{ textAlign: 'right' }}>
                <Link to="/forgot-password" style={S.link}>Forgot Password?</Link>
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Login</Button>
            </form>
          </>
        ) : (
          <>
            <div style={S.otpIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <h2 style={S.heading}>Check your email</h2>
            <p style={S.sub}>We sent a 6-digit code to <strong style={{color:'#111827'}}>{maskEmail(email)}</strong></p>

            {otpServerError && (
              <div style={S.errBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span style={S.errTxt}>{otpServerError}</span>
              </div>
            )}

            <form onSubmit={handleVerify} style={S.form}>
              <div style={S.otpSection}>
                <div style={S.otpInputs}>
                  {otp.map((d, i) => (
                    <input key={i} ref={(el) => (inputRefs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      style={{ ...S.otpInput, borderColor: otpError ? '#dc2626' : d ? '#1a56db' : '#d1d5db', boxShadow: otpError ? '0 0 0 1px #dc2626' : d ? '0 0 0 1px #1a56db' : 'none' }}
                    />
                  ))}
                </div>
                {otpError && <span style={S.fieldErr}>{otpError}</span>}
              </div>
              <Button type="submit" fullWidth loading={loading} size="lg">Verify</Button>
              <div style={S.resendRow}>
                {resendCooldown > 0 ? (
                  <span style={S.resendDisabled}>Resend code in {resendCooldown}s</span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading} style={S.resendBtn}>
                    {loading ? 'Sending...' : 'Resend code'}
                  </button>
                )}
              </div>
              <button type="button" onClick={handleBack} style={S.backBtn}>&larr; Back to login</button>
            </form>
          </>
        )}

        <div style={S.footer}>
          <span style={S.footerTxt}>Don't have an account?</span>{' '}
          <Link to="/register" style={S.footerLink}>Create an account</Link>
        </div>
        <div style={S.secNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          <span style={S.secTxt}>Your connection is encrypted and secure</span>
        </div>
      </div>
      <style>{`@keyframes lc-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1e3a8a 0%,#1a56db 30%,#3b82f6 60%,#6b7280 100%)', padding:'24px', fontFamily:'Inter,-apple-system,sans-serif' },
  loadWrap: { display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' },
  spinner: { width:'40px', height:'40px', border:'3px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'lc-spin 0.6s linear infinite' },
  loadTxt: { color:'#fff', fontSize:'14px' },
  card: { width:'100%', maxWidth:'420px', backgroundColor:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.1),0 20px 25px rgba(0,0,0,0.15)', padding:'40px 32px', boxSizing:'border-box' },
  brand: { textAlign:'center', marginBottom:'32px' },
  logo: { fontSize:'22px', fontWeight:700, color:'#1a56db', display:'block', marginBottom:'4px', letterSpacing:'-0.3px' },
  brandSub: { fontSize:'13px', color:'#6b7280', margin:'0', fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase' },
  heading: { fontSize:'20px', fontWeight:600, color:'#111827', margin:'0 0 6px', textAlign:'center' },
  sub: { fontSize:'14px', color:'#6b7280', margin:'0 0 24px', lineHeight:'20px', textAlign:'center' },
  errBox: { display:'flex', alignItems:'flex-start', gap:'10px', backgroundColor:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'12px 14px', marginBottom:'20px' },
  errTxt: { fontSize:'13px', color:'#991b1b', lineHeight:'18px' },
  form: { display:'flex', flexDirection:'column', gap:'20px' },
  otpIconWrap: { display:'flex', justifyContent:'center', marginBottom:'16px' },
  otpSection: { display:'flex', flexDirection:'column', gap:'10px' },
  otpInputs: { display:'flex', gap:'8px', justifyContent:'center' },
  otpInput: { width:'46px', height:'54px', textAlign:'center', fontSize:'20px', fontWeight:600, border:'2px solid #d1d5db', borderRadius:'10px', outline:'none', transition:'border-color 0.15s,box-shadow 0.15s', fontFamily:'Inter,-apple-system,sans-serif' },
  fieldErr: { fontSize:'13px', color:'#dc2626', textAlign:'center' },
  resendRow: { textAlign:'center' },
  resendBtn: { fontSize:'13px', fontWeight:500, color:'#1a56db', background:'none', border:'none', padding:'4px 0', cursor:'pointer', fontFamily:'Inter,-apple-system,sans-serif' },
  resendDisabled: { fontSize:'13px', fontWeight:500, color:'#9ca3af' },
  link: { fontSize:'14px', color:'#1a56db', textDecoration:'none', fontWeight:500, cursor:'pointer' },
  backBtn: { fontSize:'14px', fontWeight:500, color:'#6b7280', background:'none', border:'none', cursor:'pointer', padding:'4px 0', fontFamily:'Inter,-apple-system,sans-serif' },
  footer: { textAlign:'center', marginTop:'28px', paddingTop:'20px', borderTop:'1px solid #e5e7eb' },
  footerTxt: { fontSize:'14px', color:'#6b7280' },
  footerLink: { fontSize:'14px', color:'#1a56db', textDecoration:'none', fontWeight:600, cursor:'pointer' },
  secNote: { display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'20px' },
  secTxt: { fontSize:'12px', color:'#9ca3af' },
};
