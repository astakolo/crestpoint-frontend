import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';
import { validateEmail } from '../../utils/helpers';

function parseError(error) {
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
   const { data, status } = error.response;
  if (status === 429) return 'Too many attempts. Please wait a moment before trying again.';
  if (status >= 500) return 'A server error occurred. Please try again later.';

  const msg =
    data.email?.[0] ||
    data.non_field_errors?.[0] ||
    data.detail ||
    data.message ||
    data.error ||
    '';

  if (msg.includes('pending KYC'))
    return 'Your account is pending KYC verification. Please complete identity verification to activate your account.';
  if (msg.includes('temporarily locked'))
    return 'Your account has been temporarily locked due to too many failed attempts. Please try again later.';
  if (msg.includes('Invalid email or password'))
    return 'Invalid email or password. Please check your credentials and try again.';

  return msg || 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !authLoading) navigate(from, { replace: true });
  }, [isAuthenticated, authLoading, navigate, from]);

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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setLoginError(parseError(err));
    } finally {
      setLoading(false);
    }
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
  link: { fontSize:'14px', color:'#1a56db', textDecoration:'none', fontWeight:500, cursor:'pointer' },
  footer: { textAlign:'center', marginTop:'28px', paddingTop:'20px', borderTop:'1px solid #e5e7eb' },
  footerTxt: { fontSize:'14px', color:'#6b7280' },
  footerLink: { fontSize:'14px', color:'#1a56db', textDecoration:'none', fontWeight:600, cursor:'pointer' },
  secNote: { display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'20px' },
  secTxt: { fontSize:'12px', color:'#9ca3af' },
};
