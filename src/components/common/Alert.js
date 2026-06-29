import React, { useEffect, useState } from 'react';

const alertConfig = {
  success: {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: '\u2713',
    iconBg: '#d1fae5',
    iconColor: '#059669',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    icon: '\u2717',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    icon: '\u26A0',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: '\u2139',
    iconBg: '#dbeafe',
    iconColor: '#1a56db',
  },
};

export default function Alert({ type = 'info', message, onClose, dismissible = true }) {
  const [visible, setVisible] = useState(true);
  const config = alertConfig[type] || alertConfig.info;

  useEffect(() => {
    if (visible && (type === 'success' || type === 'info')) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '8px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        animation: 'lc-slideDown 0.3s ease-out',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      {/* Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: config.iconBg,
        color: config.iconColor,
        fontSize: '14px',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        {config.icon}
      </div>

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: '14px',
        color: '#111827',
        lineHeight: 1.5,
      }}>
        {message}
      </span>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}

      <style>{`
        @keyframes lc-slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
