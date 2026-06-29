import React from 'react';
import Button from './Button';

export default function EmptyState({ icon = '\uD83D\uDCCB', title, description, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Icon */}
      <div style={{
        fontSize: '56px',
        lineHeight: 1,
        marginBottom: '20px',
        filter: 'grayscale(0.2)',
      }}>
        {icon}
      </div>

      {/* Title */}
      <h3 style={{
        margin: 0,
        fontSize: '20px',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '8px',
      }}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6b7280',
          lineHeight: '20px',
          maxWidth: '400px',
          marginBottom: '24px',
        }}>
          {description}
        </p>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
