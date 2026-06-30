import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ADMIN_TABS = [
  { path: '/admin', label: 'Dashboard', icon: '\u2302' },
  { path: '/admin/users', label: 'Users', icon: '\u263A' },
  { path: '/admin/transactions', label: 'Transactions', icon: '\u2194' },
  { path: '/admin/withdrawals', label: 'Withdrawals', icon: '\u2193' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Admin top accent bar */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #1a56db 0%, #1e40af 50%, #111827 100%)',
      }} />

      {/* Admin tab navigation */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* Admin badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '16px',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#111827',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
            }}>
              A
            </div>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#111827',
              whiteSpace: 'nowrap',
            }}>
              Admin
            </span>
          </div>

          {/* Tab items */}
          {ADMIN_TABS.map((tab) => {
            const active = isActive(tab.path);
            const disabled = tab.disabled;

            return (
              <button
                key={tab.path}
                onClick={() => !disabled && navigate(tab.path)}
                disabled={disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  color: disabled
                    ? '#9ca3af'
                    : active
                      ? '#1a56db'
                      : '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #1a56db' : '2px solid transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  transition: 'color 0.15s, border-color 0.15s, background-color 0.15s',
                  opacity: disabled ? 0.5 : 1,
                  position: 'relative',
                  marginBottom: '-1px',
                }}
                onMouseEnter={(e) => {
                  if (!disabled && !active) {
                    e.currentTarget.style.color = '#1a56db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!disabled && !active) {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                <span>{tab.label}</span>
                {disabled && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    marginLeft: '2px',
                  }}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
