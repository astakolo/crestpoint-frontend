import React from 'react';

const ACCOUNT_TYPE_CONFIG = {
  savings: { label: 'Savings', bg: '#ecfdf5', color: '#059669' },
  current: { label: 'Current', bg: '#eff6ff', color: '#1a56db' },
  checking: { label: 'Checking', bg: '#eff6ff', color: '#1a56db' },
  fixed_deposit: { label: 'Fixed Deposit', bg: '#fffbeb', color: '#d97706' },
  default: { label: 'Account', bg: '#f3f4f6', color: '#374151' },
};

function maskAccountNumber(number) {
  if (!number) return '•••• •••• ••••';
  const str = String(number).replace(/\s/g, '');
  if (str.length <= 4) return str;
  const last4 = str.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

function formatBalance(balance, currency = 'USD') {
  const num = parseFloat(balance);
  if (isNaN(num)) return `${currency} 0.00`;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${formatted}`;
}

export default function AccountCard({ account = {}, onClick, selected = false }) {
  const accountType = (account.account_type || account.type || 'default').toLowerCase();
  const typeConfig = ACCOUNT_TYPE_CONFIG[accountType] || ACCOUNT_TYPE_CONFIG.default;
  const isFrozen = account.is_frozen === true;
  const isActive = account.is_active === true && !isFrozen;

  return (
    <div
      onClick={() => onClick?.(account)}
      style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: `2px solid ${selected ? '#1a56db' : '#e5e7eb'}`,
        boxShadow: selected
          ? '0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px #1a56db'
          : '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        fontFamily: 'Inter, -apple-system, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#93c5fd';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.07)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Top row: Type badge + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: typeConfig.bg,
            color: typeConfig.color,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {typeConfig.label}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isFrozen ? '#3b82f6' : isActive ? '#059669' : '#d1d5db',
          }} />
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
            {isFrozen ? 'Frozen' : isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Account number */}
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        fontFamily: '"Courier New", Courier, monospace',
        letterSpacing: '0.05em',
        marginBottom: '12px',
      }}>
        {maskAccountNumber(account.account_number || account.number)}
      </div>

      {/* Balance */}
      <div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>
          Available Balance
        </div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
          {formatBalance(account.balance || account.available_balance, account.currency)}
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
          {account.currency || 'USD'}
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          backgroundColor: '#1a56db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}
