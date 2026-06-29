import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ───────── Animated counter hook ───────── */
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

/* ───────── SVG Icons (inline) ───────── */
const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconBolt = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconSmartphone = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const IconClock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconChart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconUsers = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ───────── Feature Card ───────── */
function FeatureCard({ icon, title, description, image, reverse }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '64px',
      padding: '40px 0',
    }}
    className="lp-feature-row"
    >
      <div style={{
        flex: '1 1 45%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: '#eff6ff',
          color: '#1a56db',
        }}>
          {icon}
        </div>
        <h3 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          lineHeight: 1.3,
        }}>{title}</h3>
        <p style={{
          fontSize: '16px',
          lineHeight: 1.7,
          color: '#64748b',
          margin: 0,
        }}>{description}</p>
      </div>
      <div style={{ flex: '1 1 45%' }}>
        <img
          src={image}
          alt={title}
          style={{
            width: '100%',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(26, 86, 219, 0.12)',
          }}
          loading="lazy"
        />
      </div>
      <style>{`
        @media (max-width: 900px) {
          .lp-feature-row {
            flex-direction: ${reverse ? 'column-reverse' : 'column'} !important;
            gap: 32px !important;
          }
          .lp-feature-row > div {
            flex: none !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ───────── Stat Counter ───────── */
function StatCounter({ value, suffix, label }) {
  const count = useCounter(value);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '40px',
        fontWeight: 800,
        color: '#ffffff',
        lineHeight: 1.1,
        fontFamily: 'Inter, sans-serif',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.7)',
        marginTop: '8px',
        fontWeight: 500,
      }}>{label}</div>
    </div>
  );
}

/* ───────── Testimonial Card ───────── */
function TestimonialCard({ quote, name, role, avatar }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{ fontSize: '32px', color: '#1a56db', lineHeight: 1 }}>&ldquo;</div>
      <p style={{
        fontSize: '15px',
        lineHeight: 1.7,
        color: '#334155',
        margin: 0,
        flex: 1,
      }}>{quote}</p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '20px',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#1a56db',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 700,
          flexShrink: 0,
        }}>{avatar}</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={S.page}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        ...S.nav,
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.08)' : 'none',
        backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}>
        <div style={S.navInner}>
          <a href="/" style={S.logo}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              marginRight: '10px',
            }}>C</span>
            CrestPoint Credit
          </a>
          <div style={S.navLinks} className="lp-nav-links">
            {['Features', 'Security', 'About'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                style={S.navLink}
                onMouseEnter={e => e.currentTarget.style.color = '#1a56db'}
                onMouseLeave={e => e.currentTarget.style.color = '#334155'}
              >{item}</a>
            ))}
          </div>
          <div style={S.navCta} className="lp-nav-cta">
            <Link to="/login" style={S.btnGhost}>Log In</Link>
            <Link to="/register" style={S.btnPrimary}>Open Account</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroContent}>
            <div style={S.heroBadge}>Trusted by 50,000+ customers worldwide</div>
            <h1 style={S.heroTitle}>
              Banking that moves <br />
              <span style={{ color: '#1a56db' }}>at the speed of life</span>
            </h1>
            <p style={S.heroSub}>
              CrestPoint Credit delivers a next-generation digital banking experience.
              Send money instantly, track spending in real time, and grow your wealth
              — all from one powerful platform built for the modern economy.
            </p>
            <div style={S.heroActions}>
              <Link to="/register" style={{
                ...S.btnPrimary,
                padding: '14px 32px',
                fontSize: '16px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                Get Started Free <IconArrowRight />
              </Link>
              <a href="#features" style={{
                ...S.btnGhost,
                padding: '14px 28px',
                fontSize: '16px',
                borderRadius: '12px',
              }}>
                Learn More
              </a>
            </div>
            <div style={S.heroTrust}>
              {['256-bit Encryption', 'FDIC Insured', '24/7 Support'].map(item => (
                <div key={item} style={S.trustItem}>
                  <span style={{ color: '#059669' }}><IconCheck /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.heroImageWrap} className="lp-hero-img">
            <img
              src="/images/hero.png"
              alt="CrestPoint Credit digital banking dashboard"
              style={S.heroImage}
            />
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section style={S.statsBar}>
        <StatCounter value={50000} suffix="+" label="Active Customers" />
        <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <StatCounter value={2} suffix="B+" label="Transactions Processed" />
        <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <StatCounter value={99} suffix=".9%" label="Uptime Guarantee" />
        <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <StatCounter value={150} suffix="+" label="Countries Served" />
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={S.section}>
        <div style={S.sectionInner}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px' }}>
            <div style={S.sectionBadge}>Features</div>
            <h2 style={S.sectionTitle}>Everything you need to manage your money</h2>
            <p style={S.sectionSub}>
              From instant transfers to smart insights, CrestPoint Credit gives you
              complete control over your finances with tools designed for how people
              actually bank today.
            </p>
          </div>

          <FeatureCard
            icon={<IconBolt />}
            title="Instant Transfers"
            description="Send money to anyone, anywhere, in seconds. Whether it's a one-time payment or a recurring transfer, CrestPoint processes your transactions in real time with zero hidden fees and full transparency on every step of the journey. Support for domestic wires, international remittances, and peer-to-peer payments — all from a single dashboard."
            image="/images/transfers.png"
          />

          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />

          <FeatureCard
            icon={<IconSmartphone />}
            title="Mobile-First Banking"
            description="Your entire financial life fits in your pocket. CrestPoint's responsive interface adapts seamlessly to any device — phone, tablet, or desktop. Check balances, deposit checks with your camera, approve transactions with biometric authentication, and receive instant push notifications for every activity on your account."
            image="/images/mobile.png"
            reverse
          />

          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' }} />

          <FeatureCard
            icon={<IconChart />}
            title="Smart Financial Insights"
            description="Go beyond simple balance tracking. CrestPoint automatically categorizes your spending, highlights trends, and delivers weekly financial health reports. Set savings goals, get alerts when you're approaching budget limits, and make data-driven decisions about your money with interactive charts and exportable statements."
            image="/images/hero.png"
          />
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section id="security" style={{ ...S.section, backgroundColor: '#f8fafc' }}>
        <div style={{ ...S.sectionInner, display: 'flex', alignItems: 'center', gap: '80px' }} className="lp-security-row">
          <div style={{ flex: '1 1 45%' }}>
            <img
              src="/images/security.png"
              alt="CrestPoint Credit security"
              style={{
                width: '100%',
                borderRadius: '20px',
                boxShadow: '0 24px 64px rgba(26, 86, 219, 0.10)',
              }}
              loading="lazy"
            />
          </div>
          <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={S.sectionBadge}>Security</div>
            <h2 style={{ ...S.sectionTitle, textAlign: 'left', maxWidth: 'none', margin: 0 }}>
              Your money is protected by military-grade security
            </h2>
            <p style={{ ...S.sectionSub, textAlign: 'left', maxWidth: 'none', margin: 0 }}>
              At CrestPoint Credit, security isn't an afterthought — it's the foundation.
              Every transaction, every login, every data point is shielded by multiple
              layers of protection that meet or exceed industry standards.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              {[
                { icon: <IconShield />, title: 'End-to-End Encryption', desc: 'AES-256 encryption protects your data in transit and at rest. No one — not even our own team — can read your financial information.' },
                { icon: <IconClock />, title: 'Real-Time Fraud Detection', desc: 'Our AI-powered system monitors every transaction 24/7, flagging suspicious activity instantly and locking accounts before damage is done.' },
                { icon: <IconUsers />, title: 'KYC & AML Compliance', desc: 'Full identity verification with government ID scanning, biometric checks, and ongoing transaction monitoring to prevent money laundering.' },
              ].map(item => (
                <div key={item.title} style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#eff6ff',
                    color: '#1a56db',
                    flexShrink: 0,
                  }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#64748b' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .lp-security-row {
              flex-direction: column !important;
              gap: 40px !important;
            }
            .lp-security-row > div {
              flex: none !important;
              width: 100% !important;
            }
          }
        `}</style>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={S.section}>
        <div style={S.sectionInner}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' }}>
            <div style={S.sectionBadge}>Testimonials</div>
            <h2 style={S.sectionTitle}>Loved by thousands of customers</h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
          className="lp-testimonials-grid"
          >
            <TestimonialCard
              quote="CrestPoint completely changed how I manage my finances. The instant transfers save me hours every week, and the real-time notifications give me total peace of mind. I've recommended it to everyone I know."
              name="Sarah Mitchell"
              role="Small Business Owner"
              avatar="SM"
            />
            <TestimonialCard
              quote="The security features are what won me over. Two-factor authentication, biometric login, and instant fraud alerts — I feel safer banking with CrestPoint than I ever did with my traditional bank."
              name="David Chen"
              role="Software Engineer"
              avatar="DC"
            />
            <TestimonialCard
              quote="As someone who sends money internationally regularly, CrestPoint's transfer speeds and transparent fee structure are a game changer. What used to take 3 days now takes seconds."
              name="Amara Okafor"
              role="Freelance Consultant"
              avatar="AO"
            />
          </div>
        </div>
      </section>

      {/* ─── TEAM / TRUST ─── */}
      <section id="about" style={{ ...S.section, backgroundColor: '#f8fafc' }}>
        <div style={S.sectionInner}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '80px',
          }}
          className="lp-about-row"
          >
            <div style={{ flex: '1 1 50%' }}>
              <div style={S.sectionBadge}>About Us</div>
              <h2 style={{ ...S.sectionTitle, textAlign: 'left', maxWidth: 'none', margin: 0 }}>
                Built by bankers, <br />designed for everyone
              </h2>
              <p style={{ ...S.sectionSub, textAlign: 'left', maxWidth: 'none', margin: '0 0 32px 0' }}>
                CrestPoint Credit was founded in 2022 by a team of financial industry veterans
                and technology innovators who saw a gap between what traditional banks offered
                and what modern customers needed. Our mission is simple: make world-class
                banking accessible, secure, and effortless for everyone — regardless of where
                they live or how much they earn.
              </p>
              <p style={{ ...S.sectionSub, textAlign: 'left', maxWidth: 'none', margin: '0 0 32px 0' }}>
                Headquartered in the United States with operations spanning six continents,
                CrestPoint serves individuals, small businesses, and enterprises with a unified
                platform that handles everything from daily transactions to complex treasury
                management. We hold full banking licenses and are regulated by top-tier
                financial authorities, ensuring your deposits are always protected.
              </p>
              <div style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Customers', value: '50K+' },
                  { label: 'Transaction Volume', value: '$2B+' },
                  { label: 'Countries', value: '150+' },
                  { label: 'Founded', value: '2022' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    padding: '16px 24px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    minWidth: '110px',
                  }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#1a56db' }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: '1 1 45%' }}>
              <img
                src="/images/team.png"
                alt="CrestPoint Credit team"
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  boxShadow: '0 24px 64px rgba(26, 86, 219, 0.10)',
                }}
                loading="lazy"
              />
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .lp-about-row {
              flex-direction: column !important;
              gap: 40px !important;
            }
            .lp-about-row > div {
              flex: none !important;
              width: 100% !important;
            }
          }
        `}</style>
      </section>

      {/* ─── CTA ─── */}
      <section style={S.ctaSection}>
        <div style={S.ctaInner}>
          <h2 style={{
            fontSize: '40px',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 16px 0',
            lineHeight: 1.2,
            textAlign: 'center',
          }}>
            Ready to experience <br />the future of banking?
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.8)',
            margin: '0 0 36px 0',
            textAlign: 'center',
            maxWidth: '500px',
            lineHeight: 1.6,
          }}>
            Open your free account in under 2 minutes.
            No minimum balance. No hidden fees. Just smarter banking.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1a56db',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              Open Free Account <IconArrowRight />
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px' }}>
            <div style={{ maxWidth: '300px' }}>
              <div style={{ ...S.logo, marginBottom: '12px', fontSize: '18px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  marginRight: '8px',
                }}>C</span>
                CrestPoint Credit
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#94a3b8', margin: 0 }}>
                Next-generation digital banking for the modern economy.
                Secure, fast, and built for everyone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Product',
                  links: ['Features', 'Security', 'Pricing', 'API Docs'],
                },
                {
                  title: 'Company',
                  links: ['About', 'Careers', 'Blog', 'Press'],
                },
                {
                  title: 'Legal',
                  links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'],
                },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {col.links.map(link => (
                      <a key={link} href="#" style={{
                        fontSize: '14px',
                        color: '#94a3b8',
                        textDecoration: 'none',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      >{link}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: '48px',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              &copy; {new Date().getFullYear()} CrestPoint Credit. All rights reserved.
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              NMLS #123456 | FDIC Insured
            </span>
          </div>
        </div>
      </footer>

      {/* ─── GLOBAL RESPONSIVE STYLES ─── */}
      <style>{`
        @media (max-width: 768px) {
          .lp-nav-links { display: none !important; }
          .lp-nav-cta { gap: 8px !important; }
          .lp-nav-cta a { padding: 8px 14px !important; font-size: 13px !important; }
          .lp-hero-img { display: none !important; }
          .lp-testimonials-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════
   STYLES
   ═══════════════════════════════════ */
const S = {
  page: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    overflowX: 'hidden',
  },

  /* NAV */
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '72px',
    zIndex: 1000,
    transition: 'box-shadow 0.3s, background-color 0.3s, backdrop-filter 0.3s',
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    letterSpacing: '-0.3px',
  },
  navLinks: {
    display: 'flex',
    gap: '8px',
  },
  navLink: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#334155',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'color 0.15s, background-color 0.15s',
  },
  navCta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  /* BUTTONS */
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#1a56db',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'background-color 0.15s, transform 0.15s',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155',
    backgroundColor: 'transparent',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'color 0.15s, background-color 0.15s',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
  },

  /* HERO */
  hero: {
    paddingTop: '140px',
    paddingBottom: '80px',
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '48px',
  },
  heroContent: {
    flex: '1 1 50%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    borderRadius: '100px',
    border: '1px solid #dbeafe',
    width: 'fit-content',
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.1,
    margin: 0,
    letterSpacing: '-0.03em',
  },
  heroSub: {
    fontSize: '18px',
    lineHeight: 1.7,
    color: '#64748b',
    margin: 0,
    maxWidth: '520px',
  },
  heroActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginTop: '8px',
  },
  heroTrust: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155',
  },
  heroImageWrap: {
    flex: '1 1 48%',
  },
  heroImage: {
    width: '100%',
    borderRadius: '20px',
    boxShadow: '0 32px 80px rgba(26, 86, 219, 0.15)',
  },

  /* STATS BAR */
  statsBar: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    padding: '64px 24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '48px',
    flexWrap: 'wrap',
  },

  /* SECTIONS */
  section: {
    padding: '100px 24px',
  },
  sectionInner: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  sectionBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    borderRadius: '100px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 16px 0',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    maxWidth: '600px',
  },
  sectionSub: {
    fontSize: '16px',
    lineHeight: 1.7,
    color: '#64748b',
    margin: '0 auto',
    maxWidth: '560px',
  },

  /* CTA */
  ctaSection: {
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 40%, #0f172a 100%)',
    padding: '100px 24px',
  },
  ctaInner: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  /* FOOTER */
  footer: {
    backgroundColor: '#0f172a',
    padding: '64px 24px 32px',
  },
  footerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
};