import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════════ */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

/* ═══════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK (for scroll-triggered animations)
   ═══════════════════════════════════════════════════════════════ */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el); } },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICONS
   ═══════════════════════════════════════════════════════════════ */
const IconBolt = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconGlobe = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconChart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconBitcoin = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-1.216-6.893m2.078 1.042 1.563-8.864m-4.396 7.822-1.216-6.894" />
  </svg>
);
const IconCard = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconReceipt = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" />
  </svg>
);
const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M9 12l2 2 4-4" />
  </svg>
);
const IconLock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconEye = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconUser = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconChevronDown = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconStar = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke={filled ? '#f59e0b' : '#d1d5db'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   STYLE CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const COLORS = {
  primary: '#1a56db',
  primaryDark: '#1444b0',
  primaryLight: '#e8eefb',
  dark: '#0f172a',
  secondary: '#64748b',
  light: '#f8fafc',
  white: '#ffffff',
  border: '#e2e8f0',
  bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  heroGradient: 'linear-gradient(135deg, #f0f5ff 0%, #e8eefb 40%, #f8fafc 100%)',
  ctaGradient: 'linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #1a56db 100%)',
};

const FONTS = {
  heading: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 700 },
  subheading: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 600 },
  body: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 400 },
  small: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 500, fontSize: '0.875rem' },
};

/* ═══════════════════════════════════════════════════════════════
   ANIMATED SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════ */
function AnimatedSection({ children, style, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Animated stat counters */
  const customers = useCounter(50000, 2000);
  const transactions = useCounter(2, 2000);
  const uptime = useCounter(99, 2000);
  const countries = useCounter(150, 2000);
  const currencies = useCounter(25, 2000);

  /* ──────────── FAQ DATA ──────────── */
  const faqs = [
    { q: 'What fees does CrestPoint Credit charge?', a: 'We offer some of the lowest fees in the industry. Standard transfers start at just $0.99. Premium accounts enjoy free transfers and priority processing. There are no hidden fees — everything is transparent in your account dashboard.' },
    { q: 'How secure is my money with CrestPoint Credit?', a: 'Your funds are protected with 256-bit AES encryption, two-factor authentication, and real-time fraud monitoring. We are fully regulated and comply with KYC/AML requirements. Your deposits are held in segregated accounts with tier-1 banking partners.' },
    { q: 'Which currencies can I hold in my account?', a: 'We support 25+ currencies including USD, EUR, GBP, AUD, CAD, JPY, CHF, and many more. You can hold multiple currencies simultaneously and convert between them at competitive exchange rates with no hidden markups.' },
    { q: 'How fast are international transfers?', a: 'Most transfers are completed within minutes. USD transfers via ACH take 1-2 business days, while SWIFT international transfers typically settle in 1-3 business days. Crypto deposits are confirmed within minutes on the blockchain.' },
    { q: 'How do I open an account?', a: 'Opening an account takes under 2 minutes. Simply provide your email, create a password, and complete our quick KYC verification with a valid ID. Once verified, you can immediately fund your account and start banking.' },
    { q: 'Can I use CrestPoint Credit on my phone?', a: 'Absolutely! CrestPoint Credit is fully responsive and works beautifully on all devices. We also offer native mobile apps for iOS and Android with biometric login, push notifications, and all the features you love on desktop.' },
  ];

  /* ──────────── CURRENCY DATA ──────────── */
  const currencyCards = [
    { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar', desc: 'The world\'s primary reserve currency. Send, receive, and hold USD with competitive rates.' },
    { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar', desc: 'Hold and manage AUD for seamless transactions across the Asia-Pacific region.' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro', desc: 'The official currency of 20 European countries. Ideal for European business and travel.' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound', desc: 'One of the oldest currencies in the world. Manage GBP for UK transactions effortlessly.' },
    { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar', desc: 'Hold CAD for North American trade and personal transfers with ease.' },
    { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen', desc: 'Access the third most traded currency globally for Asian market operations.' },
  ];

  /* ──────────── PRODUCT DATA ──────────── */
  const products = [
    { title: 'Savings Accounts', desc: 'Earn up to 4.5% APY with our high-yield savings accounts. Your money grows while staying accessible.', img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop' },
    { title: 'Investment Plans', desc: 'Diversified portfolios managed by experts. Start investing with as little as $100.', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop' },
    { title: 'Crypto Trading', desc: 'Buy, sell, and hold Bitcoin, Ethereum, and 50+ cryptocurrencies with low fees.', img: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&auto=format&fit=crop' },
    { title: 'Virtual Cards', desc: 'Instant virtual cards for online payments. Create, freeze, and manage cards in real time.', img: 'https://images.unsplash.com/photo-1579566346927-c68383817a25?w=600&auto=format&fit=crop' },
    { title: 'Bill Payments', desc: 'Pay utilities, subscriptions, and invoices across 150+ countries from one dashboard.', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop' },
    { title: 'Loan Services', desc: 'Personal and business loans with competitive rates. Get approved in minutes, funded in hours.', img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop' },
  ];

  /* ──────────── FEATURES DATA ──────────── */
  const features = [
    { icon: <IconBolt />, title: 'Instant Transfers', desc: 'Send money anywhere in the world in seconds, not days. Real-time processing with instant confirmation.' },
    { icon: <IconGlobe />, title: 'Multi-Currency Accounts', desc: 'Hold, exchange, and manage USD, AUD, EUR, GBP, and 25+ currencies with zero hidden conversion fees.' },
    { icon: <IconChart />, title: 'Smart Investments', desc: 'Grow your wealth with AI-powered investment portfolios. Automated rebalancing and smart asset allocation.' },
    { icon: <IconBitcoin />, title: 'Crypto Trading', desc: 'Buy, sell, and hold 50+ cryptocurrencies. Seamless integration with your traditional banking accounts.' },
    { icon: <IconCard />, title: 'Virtual Cards', desc: 'Generate instant virtual cards for secure online shopping. Set spending limits and freeze with one tap.' },
    { icon: <IconReceipt />, title: 'Bill Payments', desc: 'Pay bills across 150+ countries from a single dashboard. Automated scheduling and payment reminders.' },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ ...FONTS.body, color: COLORS.dark, background: COLORS.white, overflowX: 'hidden' }}>
      {/* ──── EMBEDDED CSS: @media & @keyframes ──── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .lp-fade-in-up { animation: fadeInUp 0.8s ease forwards; }
        .lp-fade-in { animation: fadeIn 0.6s ease forwards; }
        .lp-slide-right { animation: slideRight 0.7s ease forwards; }
        .lp-float { animation: float 3s ease-in-out infinite; }

        @media (max-width: 1024px) {
          .lp-hero-grid { flex-direction: column !important; text-align: center; }
          .lp-hero-text { align-items: center !important; }
          .lp-hero-buttons { justify-content: center !important; }
          .lp-hero-badges { justify-content: center !important; }
          .lp-hero-image-wrap { display: none !important; }
          .lp-features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-currency-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-product-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-testimonial-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-testimonial-grid > :last-child { grid-column: span 2; }
          .lp-security-grid { flex-direction: column !important; }
          .lp-security-img-wrap { display: none !important; }
          .lp-footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-currency-grid { grid-template-columns: 1fr !important; }
          .lp-product-grid { grid-template-columns: 1fr !important; }
          .lp-testimonial-grid { grid-template-columns: 1fr !important; }
          .lp-testimonial-grid > :last-child { grid-column: span 1; }
          .lp-footer-grid { grid-template-columns: 1fr !important; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-steps-grid { flex-direction: column !important; align-items: center !important; }
          .lp-step-line { display: none !important; }
          .lp-partners-scroll { overflow-x: auto; flex-wrap: nowrap !important; }
          .lp-cta-buttons { flex-direction: column !important; align-items: center !important; }
          .lp-about-grid { flex-direction: column !important; }
          .lp-about-img-wrap { width: 100% !important; }
          .lp-mobile-nav { display: flex !important; }
          .lp-desktop-nav { display: none !important; }
        }
        @media (min-width: 769px) {
          .lp-mobile-nav { display: none !important; }
        }
        .lp-custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .lp-custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .lp-custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .lp-custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* ════════════════════════════════════════════════════════
          1. ENHANCED NAVBAR
          ════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', ...FONTS.heading, fontSize: 20, fontWeight: 800 }}>C</div>
            <span style={{ ...FONTS.heading, fontSize: 20, color: COLORS.dark, letterSpacing: '-0.5px' }}>CrestPoint <span style={{ color: COLORS.primary }}>Credit</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="lp-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Features', 'Products', 'Currencies', 'Security', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ textDecoration: 'none', color: COLORS.secondary, fontSize: 15, fontWeight: 500, transition: 'color 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = COLORS.primary} onMouseLeave={e => e.target.style.color = COLORS.secondary}
              >{item}</a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="lp-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/login" style={{ textDecoration: 'none', padding: '9px 20px', borderRadius: 10, color: COLORS.primary, fontSize: 15, fontWeight: 600, border: `1.5px solid ${COLORS.primary}`, background: 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = COLORS.primaryLight; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >Log In</Link>
            <Link to="/register" style={{ textDecoration: 'none', padding: '9px 24px', borderRadius: 10, background: COLORS.primary, color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,86,219,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.background = COLORS.primaryDark; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,86,219,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = COLORS.primary; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,86,219,0.3)'; }}
            >Open Account</Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="lp-mobile-nav" onClick={() => setMobileMenu(!mobileMenu)} style={{ background: 'none', border: 'none', color: COLORS.dark, cursor: 'pointer', padding: 8, display: 'none', alignItems: 'center', justifyContent: 'center' }}>
            {mobileMenu ? <IconX /> : <IconMenu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenu && (
          <div className="lp-fade-in" style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, borderTop: `1px solid ${COLORS.border}` }}>
            {['Features', 'Products', 'Currencies', 'Security', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)} style={{ textDecoration: 'none', color: COLORS.dark, fontSize: 16, fontWeight: 500, padding: '8px 0' }}>{item}</a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <Link to="/login" onClick={() => setMobileMenu(false)} style={{ textDecoration: 'none', padding: '12px 20px', borderRadius: 10, color: COLORS.primary, fontSize: 15, fontWeight: 600, border: `1.5px solid ${COLORS.primary}`, textAlign: 'center' }}>Log In</Link>
              <Link to="/register" onClick={() => setMobileMenu(false)} style={{ textDecoration: 'none', padding: '12px 20px', borderRadius: 10, background: COLORS.primary, color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'center' }}>Open Account</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════════════════════
          2. HERO SECTION
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: COLORS.heroGradient, paddingTop: 120, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(26,86,219,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(26,86,219,0.03)', pointerEvents: 'none' }} />

        <div className="lp-hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 60 }}>
          {/* Hero Text */}
          <div className="lp-hero-text" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
            <div className="lp-fade-in-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(26,86,219,0.08)', color: COLORS.primary, fontSize: 14, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.primary, display: 'inline-block' }} />
              Now Available in 150+ Countries
            </div>
            <h1 className="lp-fade-in-up" style={{ ...FONTS.heading, fontSize: 52, lineHeight: 1.1, color: COLORS.dark, letterSpacing: '-1.5px', animationDelay: '0.1s' }}>
              The Future of{' '}
              <span style={{ background: `linear-gradient(135deg, ${COLORS.primary}, #6366f1)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Banking</span>{' '}
              is Here
            </h1>
            <p className="lp-fade-in-up" style={{ ...FONTS.body, fontSize: 18, lineHeight: 1.7, color: COLORS.secondary, maxWidth: 520, animationDelay: '0.2s' }}>
              Experience seamless multi-currency banking, lightning-fast international transfers, and smart investment tools — all from one powerful platform. No hidden fees, no borders.
            </p>
            <div className="lp-hero-buttons lp-fade-in-up" style={{ display: 'flex', gap: 14, animationDelay: '0.3s' }}>
              <Link to="/register" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: COLORS.primary, color: '#fff', fontSize: 16, fontWeight: 600, boxShadow: '0 4px 16px rgba(26,86,219,0.35)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,86,219,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,86,219,0.35)'; }}
              >Get Started Free <IconArrowRight /></Link>
              <a href="#features" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: '#fff', color: COLORS.dark, fontSize: 16, fontWeight: 600, border: `1.5px solid ${COLORS.border}`, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.color = COLORS.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.dark; }}
              >Learn More</a>
            </div>
            {/* Trust Badges */}
            <div className="lp-hero-badges lp-fade-in-up" style={{ display: 'flex', gap: 24, marginTop: 12, animationDelay: '0.4s', flexWrap: 'wrap' }}>
              {[
                { icon: <IconLock />, text: '256-bit Encryption' },
                { icon: <IconGlobe />, text: 'Multi-Currency Support' },
                { icon: <IconEye />, text: '24/7 Support' },
              ].map((badge, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.secondary, fontSize: 14, fontWeight: 500 }}>
                  <span style={{ color: COLORS.primary }}>{badge.icon}</span>
                  {badge.text}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="lp-hero-image-wrap" style={{ flex: 1, position: 'relative' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop" alt="Banking Dashboard" style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(26,86,219,0.05), rgba(99,102,241,0.08))' }} />
            </div>
            {/* Floating card */}
            <div className="lp-float" style={{ position: 'absolute', bottom: -20, left: -30, background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <IconCheck />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark }}>Transfer Complete</div>
                <div style={{ fontSize: 12, color: COLORS.secondary }}>$2,450.00 → USD Account</div>
              </div>
            </div>
            {/* Floating card 2 */}
            <div className="lp-float" style={{ position: 'absolute', top: 20, right: -20, background: '#fff', borderRadius: 14, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', animationDelay: '1.5s' }}>
              <div style={{ fontSize: 12, color: COLORS.secondary, marginBottom: 4 }}>Portfolio Growth</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>+12.4%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          3. PARTNER / TRUST LOGOS BAR
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: '28px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="lp-partners-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 36, flexWrap: 'wrap' }}>
            {[
              { symbol: '$', code: 'USD', flag: '🇺🇸' },
              { symbol: 'A$', code: 'AUD', flag: '🇦🇺' },
              { symbol: '€', code: 'EUR', flag: '🇪🇺' },
              { symbol: '£', code: 'GBP', flag: '🇬🇧' },
              { symbol: 'C$', code: 'CAD', flag: '🇨🇦' },
              { symbol: '¥', code: 'JPY', flag: '🇯🇵' },
              { symbol: 'Fr', code: 'CHF', flag: '🇨🇭' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.secondary }}>
                <span style={{ fontSize: 24 }}>{c.flag}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.dark }}>{c.code}</span>
              </div>
            ))}
            <div style={{ width: 1, height: 32, background: COLORS.border, margin: '0 8px' }} />
            <p style={{ ...FONTS.small, color: COLORS.secondary, fontSize: 14, maxWidth: 320, lineHeight: 1.5, margin: 0 }}>
              Trusted across <strong style={{ color: COLORS.dark }}>150+ countries</strong> with multi-currency support
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          4. STATS BAR
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section style={{ background: COLORS.bgGradient, padding: '60px 0' }}>
          <div className="lp-stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
            {[
              { value: customers.toLocaleString() + '+', label: 'Active Customers' },
              { value: '$' + transactions + 'B+', label: 'Transactions' },
              { value: uptime + '.9%', label: 'Uptime' },
              { value: countries + '+', label: 'Countries' },
              { value: currencies + '+', label: 'Currencies' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ ...FONTS.heading, fontSize: 36, color: '#fff', letterSpacing: '-1px', marginBottom: 6 }}>{stat.value}</div>
                <div style={{ ...FONTS.small, fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          5. FEATURES SECTION (3x2 GRID)
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section id="features" style={{ padding: '100px 0', background: COLORS.light }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Why CrestPoint Credit
              </div>
              <h2 style={{ ...FONTS.heading, fontSize: 40, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16 }}>Everything You Need in One Platform</h2>
              <p style={{ ...FONTS.body, fontSize: 17, color: COLORS.secondary, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                From instant transfers to smart investments, we provide all the tools you need to manage your finances effectively.
              </p>
            </div>
            <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {features.map((f, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}`, transition: 'all 0.3s ease', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = COLORS.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: COLORS.primaryLight, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    {f.icon}
                  </div>
                  <h3 style={{ ...FONTS.subheading, fontSize: 19, color: COLORS.dark, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ ...FONTS.body, fontSize: 15, color: COLORS.secondary, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          6. CURRENCY SHOWCASE SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section id="currencies" style={{ padding: '100px 0', background: COLORS.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Multi-Currency Banking
              </div>
              <h2 style={{ ...FONTS.heading, fontSize: 40, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16 }}>Bank in Your Preferred Currency</h2>
              <p style={{ ...FONTS.body, fontSize: 17, color: COLORS.secondary, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                Hold and manage multiple currencies in a single account. Convert instantly at competitive exchange rates.
              </p>
            </div>
            <div className="lp-currency-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {currencyCards.map((c, i) => (
                <div key={i} style={{ background: COLORS.light, borderRadius: 16, padding: '28px 24px', border: `1px solid ${COLORS.border}`, transition: 'all 0.3s ease', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = COLORS.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 32 }}>{c.flag}</span>
                      <div>
                        <div style={{ ...FONTS.subheading, fontSize: 20, color: COLORS.dark }}>{c.code}</div>
                        <div style={{ fontSize: 13, color: COLORS.secondary }}>{c.name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.primary, opacity: 0.7 }}>{c.symbol}</div>
                  </div>
                  <p style={{ ...FONTS.body, fontSize: 14, color: COLORS.secondary, lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          7. HOW IT WORKS SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section style={{ padding: '100px 0', background: COLORS.light }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Simple Process
              </div>
              <h2 style={{ ...FONTS.heading, fontSize: 40, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16 }}>Get Started in 3 Easy Steps</h2>
              <p style={{ ...FONTS.body, fontSize: 17, color: COLORS.secondary, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                Opening your account and starting to bank takes just a few minutes.
              </p>
            </div>
            <div className="lp-steps-grid" style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
              {[
                { num: '01', title: 'Create Your Account', desc: 'Sign up in under 2 minutes with just your email. No paperwork, no branch visits needed.' },
                { num: '02', title: 'Verify & Fund', desc: 'Quick KYC verification with a valid ID. Then deposit via bank transfer, card, or cryptocurrency.' },
                { num: '03', title: 'Start Banking', desc: 'Transfer, invest, pay bills, and manage your money from anywhere in the world.' },
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '0 16px' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: COLORS.primary, color: '#fff', ...FONTS.heading, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 16px rgba(26,86,219,0.3)' }}>
                      {step.num}
                    </div>
                    <h3 style={{ ...FONTS.subheading, fontSize: 20, color: COLORS.dark, marginBottom: 10 }}>{step.title}</h3>
                    <p style={{ ...FONTS.body, fontSize: 15, color: COLORS.secondary, lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                  </div>
                  {i < 2 && <div className="lp-step-line" style={{ width: 60, height: 2, background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.border})`, marginTop: 36, flexShrink: 0 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          8. SECURITY SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section id="security" style={{ padding: '100px 0', background: COLORS.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div className="lp-security-grid" style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
              {/* Image */}
              <div className="lp-security-img-wrap" style={{ flex: 1 }}>
                <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}>
                  <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop" alt="Mobile Security" style={{ width: '100%', height: 440, objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
                  Bank-Grade Security
                </div>
                <h2 style={{ ...FONTS.heading, fontSize: 38, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16, lineHeight: 1.2 }}>
                  Your Money is Protected by the Best in the Business
                </h2>
                <p style={{ ...FONTS.body, fontSize: 16, color: COLORS.secondary, lineHeight: 1.7, marginBottom: 36 }}>
                  We employ multiple layers of security to ensure your funds and personal data remain safe at all times.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {[
                    { icon: <IconLock />, title: 'End-to-End Encryption', desc: 'All data is encrypted with 256-bit AES — the same standard used by major financial institutions worldwide.' },
                    { icon: <IconEye />, title: 'Real-Time Fraud Detection', desc: 'Our AI-powered monitoring system detects and prevents suspicious activity in real time, 24/7.' },
                    { icon: <IconShield />, title: 'KYC & AML Compliance', desc: 'Full regulatory compliance with identity verification and anti-money laundering protocols.' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.primaryLight, color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 style={{ ...FONTS.subheading, fontSize: 17, color: COLORS.dark, marginBottom: 6 }}>{item.title}</h4>
                        <p style={{ ...FONTS.body, fontSize: 14, color: COLORS.secondary, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          9. PRODUCT SHOWCASE SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section id="products" style={{ padding: '100px 0', background: COLORS.light }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Our Products
              </div>
              <h2 style={{ ...FONTS.heading, fontSize: 40, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16 }}>Comprehensive Financial Solutions</h2>
              <p style={{ ...FONTS.body, fontSize: 17, color: COLORS.secondary, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                From savings to crypto, loans to bills — everything you need in one place.
              </p>
            </div>
            <div className="lp-product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {products.map((p, i) => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 280, cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}`, transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
                >
                  <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.4) 50%, transparent 100%)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <h3 style={{ ...FONTS.subheading, fontSize: 20, color: '#fff', marginBottom: 8 }}>{p.title}</h3>
                    <p style={{ ...FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                    <a href="#products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontSize: 14, fontWeight: 600, marginTop: 12, textDecoration: 'none' }}>
                      Learn More <IconArrowRight />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          10. TESTIMONIALS SECTION (3 CARDS)
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section style={{ padding: '100px 0', background: COLORS.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                Testimonials
              </div>
              <h2 style={{ ...FONTS.heading, fontSize: 40, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16 }}>Loved by Thousands of Customers</h2>
              <p style={{ ...FONTS.body, fontSize: 17, color: COLORS.secondary, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                See what our customers say about their experience with CrestPoint Credit.
              </p>
            </div>
            <div className="lp-testimonial-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { name: 'Sarah Mitchell', role: 'Freelance Designer', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&auto=format&fit=crop', text: 'CrestPoint Credit has completely transformed how I manage my international payments. The multi-currency feature saves me hundreds in conversion fees every month. Absolutely brilliant platform!' },
                { name: 'James Rodriguez', role: 'E-Commerce Owner', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop', text: 'Running a global business requires a reliable banking partner. CrestPoint delivers with instant transfers, great rates, and an intuitive dashboard. My team loves the virtual cards feature.' },
                { name: 'Emma Thompson', role: 'Digital Nomad', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop', text: 'As someone who travels constantly, having access to multiple currencies in one account is a game-changer. The app is beautiful, fast, and the 24/7 support team is incredibly helpful.' },
              ].map((t, i) => (
                <div key={i} style={{ background: COLORS.light, borderRadius: 16, padding: 32, border: `1px solid ${COLORS.border}`, transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {[0, 1, 2, 3, 4].map(s => <IconStar key={s} filled={true} />)}
                  </div>
                  <p style={{ ...FONTS.body, fontSize: 15, color: COLORS.secondary, lineHeight: 1.7, marginBottom: 24, margin: '0 0 24px 0', fontStyle: 'italic' }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={t.avatar} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.border}` }} />
                    <div>
                      <div style={{ ...FONTS.subheading, fontSize: 15, color: COLORS.dark }}>{t.name}</div>
                      <div style={{ fontSize: 13, color: COLORS.secondary }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          11. FAQ SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section style={{ padding: '100px 0', background: COLORS.light }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                FAQ
              </div>
              <h2 style={{ ...FONTS.heading, fontSize: 40, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16 }}>Frequently Asked Questions</h2>
              <p style={{ ...FONTS.body, fontSize: 17, color: COLORS.secondary, lineHeight: 1.7 }}>
                Got questions? We&apos;ve got answers. Find everything you need to know about CrestPoint Credit.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: 'hidden', transition: 'all 0.3s ease', ...(isOpen ? { borderColor: COLORS.primary, boxShadow: '0 4px 16px rgba(26,86,219,0.08)' } : {}) }}>
                    <button onClick={() => setOpenFaq(isOpen ? null : i)} style={{ width: '100%', background: 'none', border: 'none', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', color: COLORS.dark }}>
                      <span style={{ ...FONTS.subheading, fontSize: 16, paddingRight: 16 }}>{faq.q}</span>
                      <span style={{ color: COLORS.primary, flexShrink: 0 }}><IconChevronDown open={isOpen} /></span>
                    </button>
                    <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease, padding 0.3s ease', padding: isOpen ? '0 24px 20px' : '0 24px' }}>
                      <p style={{ ...FONTS.body, fontSize: 15, color: COLORS.secondary, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          12. ABOUT SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section id="about" style={{ padding: '100px 0', background: COLORS.white }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div className="lp-about-grid" style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
              {/* Image */}
              <div className="lp-about-img-wrap" style={{ flex: 1 }}>
                <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.1)' }}>
                  <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=700&auto=format&fit=crop" alt="Our Team" style={{ width: '100%', height: 400, objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: COLORS.primaryLight, color: COLORS.primary, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
                  About Us
                </div>
                <h2 style={{ ...FONTS.heading, fontSize: 38, color: COLORS.dark, letterSpacing: '-1px', marginBottom: 16, lineHeight: 1.2 }}>
                  Built by Banking Experts, for the Modern World
                </h2>
                <p style={{ ...FONTS.body, fontSize: 16, color: COLORS.secondary, lineHeight: 1.75, marginBottom: 20 }}>
                  CrestPoint Credit was founded in 2020 with a simple mission: make world-class financial services accessible to everyone, everywhere. Our team of seasoned bankers, technologists, and designers came together to build a platform that combines the reliability of traditional banking with the innovation of fintech.
                </p>
                <p style={{ ...FONTS.body, fontSize: 16, color: COLORS.secondary, lineHeight: 1.75, marginBottom: 28 }}>
                  Today, we serve over 50,000 customers across 150+ countries, processing billions in transactions annually. We&apos;re regulated by multiple financial authorities and backed by tier-1 banking partners to ensure your money is always safe.
                </p>
                <div style={{ display: 'flex', gap: 32 }}>
                  {[
                    { value: '50K+', label: 'Customers' },
                    { value: '150+', label: 'Countries' },
                    { value: '$2B+', label: 'Processed' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ ...FONTS.heading, fontSize: 28, color: COLORS.primary, letterSpacing: '-0.5px' }}>{s.value}</div>
                      <div style={{ fontSize: 14, color: COLORS.secondary, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          13. CTA SECTION
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <section style={{ padding: '100px 0', background: COLORS.ctaGradient, position: 'relative', overflow: 'hidden' }}>
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h2 style={{ ...FONTS.heading, fontSize: 40, color: '#fff', letterSpacing: '-1px', marginBottom: 16, lineHeight: 1.2 }}>
              Ready to Experience the Future of Banking?
            </h2>
            <p style={{ ...FONTS.body, fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 36 }}>
              Join 50,000+ customers who trust CrestPoint Credit with their finances. Open your free account in under 2 minutes.
            </p>
            <div className="lp-cta-buttons" style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link to="/register" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 12, background: '#fff', color: COLORS.primary, fontSize: 16, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
              >Open Free Account <IconArrowRight /></Link>
              <Link to="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 12, background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 600, border: '2px solid rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
              >Sign In</Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          14. ENHANCED FOOTER
          ════════════════════════════════════════════════════════ */}
      <footer style={{ background: COLORS.dark, padding: '70px 0 0', color: 'rgba(255,255,255,0.7)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="lp-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 50 }}>
            {/* Brand Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', ...FONTS.heading, fontSize: 20, fontWeight: 800 }}>C</div>
                <span style={{ ...FONTS.heading, fontSize: 20, color: '#fff', letterSpacing: '-0.5px' }}>CrestPoint <span style={{ color: '#60a5fa' }}>Credit</span></span>
              </div>
              <p style={{ ...FONTS.body, fontSize: 14, lineHeight: 1.7, marginBottom: 24, maxWidth: 280 }}>
                The modern banking platform built for a global world. Multi-currency accounts, instant transfers, and smart investments — all in one place.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { icon: <IconTwitter />, label: 'Twitter' },
                  { icon: <IconLinkedIn />, label: 'LinkedIn' },
                  { icon: <IconInstagram />, label: 'Instagram' },
                  { icon: <IconFacebook />, label: 'Facebook' },
                ].map((s, i) => (
                  <a key={i} href="#" aria-label={s.label} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = COLORS.primary; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >{s.icon}</a>
                ))}
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 style={{ ...FONTS.subheading, fontSize: 15, color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Savings Accounts', 'Investment Plans', 'Crypto Trading', 'Virtual Cards', 'Bill Payments', 'Loan Services'].map((item, i) => (
                  <a key={i} href="#products" style={{ ...FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  >{item}</a>
                ))}
              </div>
            </div>

            {/* Company Column */}
            <div>
              <h4 style={{ ...FONTS.subheading, fontSize: 15, color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['About Us', 'Careers', 'Press', 'Blog', 'Partners', 'Contact'].map((item, i) => (
                  <a key={i} href="#about" style={{ ...FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  >{item}</a>
                ))}
              </div>
            </div>

            {/* Legal Column */}
            <div>
              <h4 style={{ ...FONTS.subheading, fontSize: 15, color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'AML Policy', 'Regulatory Info', 'Disclosures'].map((item, i) => (
                  <a key={i} href="#" style={{ ...FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  >{item}</a>
                ))}
              </div>
            </div>

            {/* Support Column */}
            <div>
              <h4 style={{ ...FONTS.subheading, fontSize: 15, color: '#fff', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Help Center', 'FAQ', 'Live Chat', 'Email Support', 'Report an Issue', 'Status Page'].map((item, i) => (
                  <a key={i} href="#" style={{ ...FONTS.body, fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  >{item}</a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright / Regulatory Bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ ...FONTS.body, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              &copy; {new Date().getFullYear()} CrestPoint Credit. All rights reserved.
            </p>
            <p style={{ ...FONTS.body, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'right', maxWidth: 600, lineHeight: 1.5 }}>
              CrestPoint Credit is a registered financial institution. Deposits are insured up to $250,000. Trading in cryptocurrencies involves significant risk. Please read our risk disclosure before investing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}