import React from 'react';

export default function StatCard({ title, value, subtitle, icon, trend, trendValue }) {
  const isUp = trend === 'up';
  const trendColor = isUp ? '#059669' : '#dc2626';
  const trendIcon = isUp ? '\u2191' : '\u2193';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Icon circle */}
      {icon && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: '#eff6ff',
          color: '#1a56db',
          fontSize: '22px',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        minWidth: 0,
      }}>
        <p style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 500,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '4px',
        }}>
          {title}
        </p>

        <p style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {value}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
        }}>
          {/* Trend indicator */}
          {trend && trendValue && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '12px',
              fontWeight: 600,
              color: trendColor,
              backgroundColor: isUp ? '#ecfdf5' : '#fef2f2',
              padding: '2px 8px',
              borderRadius: '100px',
            }}>
              <span style={{ fontSize: '10px' }}>{trendIcon}</span>
              {trendValue}
            </span>
          )}

          {/* Subtitle */}
          {subtitle && (
            <span style={{
              fontSize: '13px',
              color: '#6b7280',
            }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
