import React from 'react';

export default function InputField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon,
}) {
  const hasError = !!error;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#111827',
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Left icon */}
        {icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: hasError ? '#dc2626' : '#6b7280',
            fontSize: '16px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}>
            {icon}
          </div>
        )}

        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: icon ? '10px 12px 10px 40px' : '10px 12px',
            fontSize: '14px',
            lineHeight: '20px',
            color: '#111827',
            backgroundColor: disabled ? '#f9fafb' : '#ffffff',
            border: `1px solid ${hasError ? '#dc2626' : '#e5e7eb'}`,
            borderRadius: '8px',
            outline: 'none',
            fontFamily: 'Inter, -apple-system, sans-serif',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: hasError ? '0 0 0 3px rgba(220, 38, 38, 0.1)' : 'none',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          onFocus={(e) => {
            if (!disabled && !hasError) {
              e.currentTarget.style.borderColor = '#1a56db';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 86, 219, 0.1)';
            }
          }}
          onBlur={(e) => {
            if (!hasError) {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />
      </div>

      {/* Error message */}
      {hasError && (
        <span style={{
          fontSize: '12px',
          color: '#dc2626',
          lineHeight: '16px',
        }}>
          {error}
        </span>
      )}
    </div>
  );
}
