import React from 'react';

const variantStyles = {
  primary: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    hoverBg: '#1e40af',
    activeBg: '#1e3a8a',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    hoverBg: '#e5e7eb',
    activeBg: '#d1d5db',
  },
  danger: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    hoverBg: '#b91c1c',
    activeBg: '#991b1b',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#1a56db',
    hoverBg: '#eff6ff',
    activeBg: '#dbeafe',
    border: '1px solid #1a56db',
  },
};

const sizeStyles = {
  sm: { padding: '6px 14px', fontSize: '13px', borderRadius: '6px' },
  md: { padding: '10px 20px', fontSize: '14px', borderRadius: '8px' },
  lg: { padding: '12px 28px', fontSize: '16px', borderRadius: '8px' },
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
}) {
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        lineHeight: '20px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: variantStyle.color,
        backgroundColor: isDisabled ? '#d1d5db' : variantStyle.backgroundColor,
        border: variantStyle.border || '1px solid transparent',
        borderRadius: sizeStyle.borderRadius,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
        opacity: isDisabled ? 0.65 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.backgroundColor;
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.activeBg;
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyle.hoverBg;
        }
      }}
    >
      {loading && (
        <span style={{
          display: 'inline-block',
          width: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
          height: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          animation: 'lc-spin 0.6s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {loading ? (
        <span style={{ opacity: 0.7 }}>{children}</span>
      ) : (
        children
      )}
      <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
