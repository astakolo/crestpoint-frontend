import React from 'react';

const sizeMap = {
  sm: { spinner: 20, border: 2 },
  md: { spinner: 32, border: 3 },
  lg: { spinner: 48, border: 4 },
};

const textSizeMap = {
  sm: '12px',
  md: '14px',
  lg: '16px',
};

export default function LoadingSpinner({ size = 'md', text }) {
  const { spinner, border } = sizeMap[size] || sizeMap.md;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '24px',
    }}>
      <div style={{
        width: `${spinner}px`,
        height: `${spinner}px`,
        border: `${border}px solid #e5e7eb`,
        borderTopColor: '#1a56db',
        borderRadius: '50%',
        animation: 'lc-spin 0.8s linear infinite',
      }} />
      {text && (
        <span style={{
          fontSize: textSizeMap[size] || textSizeMap.md,
          color: '#6b7280',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {text}
        </span>
      )}
      <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
