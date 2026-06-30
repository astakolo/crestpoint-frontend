import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import notificationService from '../../services/notificationService';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/transfer', label: 'Transfer' },
  { to: '/notifications', label: 'Notifications', hasBadge: true },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin Dashboard' },
];

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#6b7280',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s, color 0.15s',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
  fontFamily: 'Inter, -apple-system, sans-serif',
};

const activeLinkStyle = {
  ...linkStyle,
  backgroundColor: '#eff6ff',
  color: '#1a56db',
};

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count ?? data.unread_count ?? 0);
    } catch {
      // Silently ignore - notifications are non-critical
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Continue redirect even if logout fails
    }
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNavLink = (navLink) => {
    const active = isActive(navLink.to);
    return (
      <Link
        key={navLink.to}
        to={navLink.to}
        style={active ? activeLinkStyle : linkStyle}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#111827';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }
        }}
      >
        {navLink.label}
        {navLink.hasBadge && unreadCount > 0 && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            borderRadius: '100px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        zIndex: 900,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
        }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a56db',
              textDecoration: 'none',
              letterSpacing: '-0.3px',
              flexShrink: 0,
            }}
          >
            CrestPoint Credit
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
            className="cp-desktop-nav"
            >
              {NAV_LINKS.map(renderNavLink)}
              {user?.role === 'admin' && ADMIN_LINKS.map(renderNavLink)}
            </div>
          )}

          {/* Right Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0,
          }}>
            {isAuthenticated ? (
              <>
                {/* User Info - Desktop */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  className="cp-desktop-nav"
                >
                  {/* Avatar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#1a56db',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {getInitials(user?.first_name, user?.last_name) || 'U'}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    minWidth: 0,
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      lineHeight: '18px',
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#6b7280',
                      lineHeight: '14px',
                    }}>
                      {user?.role || 'Customer'}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '7px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#dc2626',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      transition: 'background-color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                  >
                    Logout
                  </button>
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: '#111827',
                    cursor: 'pointer',
                    fontSize: '22px',
                  }}
                  className="cp-mobile-burger"
                  aria-label="Toggle navigation menu"
                >
                  {mobileOpen ? '\u2715' : '\u2630'}
                </button>
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              className="cp-desktop-nav"
              >
                <Link
                  to="/login"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1a56db',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#ffffff',
                    backgroundColor: '#1a56db',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e40af';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a56db';
                  }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isAuthenticated && mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 899,
            backgroundColor: 'rgba(0,0,0,0.3)',
            top: '64px',
            animation: 'cp-fadeIn 0.2s ease-out',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      {isAuthenticated && mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            right: 0,
            bottom: 0,
            width: '280px',
            maxWidth: '85vw',
            backgroundColor: '#ffffff',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 900,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            animation: 'cp-slideLeft 0.25s ease-out',
            overflowY: 'auto',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {/* User info mobile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#1a56db',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {getInitials(user?.first_name, user?.last_name) || 'U'}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
              }}>
                {user?.first_name} {user?.last_name}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#6b7280',
                textTransform: 'capitalize',
              }}>
                {user?.role || 'Customer'}
              </span>
            </div>
          </div>

          {NAV_LINKS.map(renderNavLink)}
          {user?.role === 'admin' && ADMIN_LINKS.map(renderNavLink)}

          <div style={{
            borderTop: '1px solid #e5e7eb',
            marginTop: '8px',
            paddingTop: '12px',
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, sans-serif',
                textAlign: 'left',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Responsive styles and animations */}
      <style>{`
        @keyframes cp-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cp-slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .cp-desktop-nav {
            display: none !important;
          }
          .cp-mobile-burger {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
