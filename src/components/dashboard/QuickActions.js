import React from 'react';

const ACTIONS = [
  {
    id: 'transfer',
    label: 'Transfer Money',
    icon: '🔄',
    description: 'Send funds to another account',
    color: '#1a56db',
    hoverBg: '#eff6ff',
  },
  {
    id: 'deposit',
    label: 'Deposit',
    icon: '💰',
    description: 'Add funds to your account',
    color: '#059669',
    hoverBg: '#ecfdf5',
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    icon: '🏧',
    description: 'Withdraw from your account',
    color: '#d97706',
    hoverBg: '#fffbeb',
  },
  {
    id: 'pay-bills',
    label: 'Pay Bills',
    icon: '📱',
    description: 'Pay your utility bills',
    color: '#7c3aed',
    hoverBg: '#f5f3ff',
  },
];

function ActionCard({ action, onClick }) {
  return (
    <button
      onClick={() => onClick?.(action.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '24px 16px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s, background-color 0.15s',
        fontFamily: 'Inter, -apple-system, sans-serif',
        textAlign: 'center',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = action.color;
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.07)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.backgroundColor = action.hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.backgroundColor = '#ffffff';
      }}
    >
      <span style={{ fontSize: '32px', lineHeight: 1 }}>{action.icon}</span>
      <div>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '2px',
        }}>
          {action.label}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          lineHeight: '16px',
        }}>
          {action.description}
        </div>
      </div>
    </button>
  );
}

export default function QuickActions({ onAction }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Quick Actions</h3>
      <div className="lc-quick-actions-grid" style={styles.grid}>
        {ACTIONS.map((action) => (
          <ActionCard key={action.id} action={action} onClick={onAction} />
        ))}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .lc-quick-actions-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  heading: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
};


