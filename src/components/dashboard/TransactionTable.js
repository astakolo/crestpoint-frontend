import React, { useState, useMemo } from 'react';

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  reversed: { label: 'Reversed', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  processing: { label: 'Processing', bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
};

function formatCurrency(amount, currency = 'USD') {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${currency} 0.00`;
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${formatted}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: config.color,
        marginRight: '6px',
        flexShrink: 0,
      }} />
      {config.label}
    </span>
  );
}

function TransactionRow({ transaction, onViewDetails, showAccount, isEven }) {
  const isIncoming = ['credit', 'deposit', 'incoming'].includes(
    transaction.type?.toLowerCase()
  );
  const amountColor = isIncoming ? '#059669' : '#dc2626';
  const amountPrefix = isIncoming ? '+' : '-';

  return (
    <tr
      onClick={() => onViewDetails?.(transaction)}
      style={{
        backgroundColor: isEven ? '#f9fafb' : '#ffffff',
        cursor: onViewDetails ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#eff6ff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isEven ? '#f9fafb' : '#ffffff';
      }}
    >
      <td style={styles.td}>
        <span style={{ fontWeight: 500, color: '#111827' }}>
          {formatDate(transaction.date || transaction.created_at)}
        </span>
      </td>
      <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
        {transaction.reference || transaction.id || '—'}
      </td>
      <td style={styles.td}>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: '#f3f4f6',
          color: '#374151',
          textTransform: 'capitalize',
        }}>
          {transaction.type || '—'}
        </span>
      </td>
      <td style={{ ...styles.td, textAlign: 'right' }}>
        <span style={{ fontWeight: 600, color: amountColor }}>
          {amountPrefix}{formatCurrency(transaction.amount, transaction.currency)}
        </span>
      </td>
      <td style={{ ...styles.td, textAlign: 'center' }}>
        <StatusBadge status={transaction.status} />
      </td>
      {showAccount && (
        <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
          {transaction.account_number || transaction.account || '—'}
        </td>
      )}
    </tr>
  );
}

function TransactionCard({ transaction, onViewDetails, showAccount }) {
  const isIncoming = ['credit', 'deposit', 'incoming'].includes(
    transaction.type?.toLowerCase()
  );
  const amountColor = isIncoming ? '#059669' : '#dc2626';
  const amountPrefix = isIncoming ? '+' : '-';

  return (
    <div
      onClick={() => onViewDetails?.(transaction)}
      style={{
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        cursor: onViewDetails ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px', textTransform: 'capitalize' }}>
            {transaction.type || 'Transaction'}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {formatDate(transaction.date || transaction.created_at)}
          </div>
        </div>
        <span style={{ fontWeight: 600, color: amountColor, fontSize: '16px' }}>
          {amountPrefix}{formatCurrency(transaction.amount, transaction.currency)}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {transaction.reference || transaction.id || '—'}
        </span>
        <StatusBadge status={transaction.status} />
      </div>
      {showAccount && transaction.account_number && (
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
          Account: {transaction.account_number}
        </div>
      )}
    </div>
  );
}

export default function TransactionTable({
  transactions = [],
  onViewDetails,
  showAccount = false,
}) {
  const [useMobile, setUseMobile] = useState(false);

  // Simple media query detection
  useState(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setUseMobile(mq.matches);
    const handler = (e) => setUseMobile(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  });

  const headers = showAccount
    ? ['Date', 'Reference', 'Type', 'Amount', 'Status', 'Account']
    : ['Date', 'Reference', 'Type', 'Amount', 'Status'];

  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <p style={styles.emptyTitle}>No Transactions Found</p>
        <p style={styles.emptyText}>
          There are no transactions to display yet. Transactions will appear here once you start using your account.
        </p>
      </div>
    );
  }

  // Mobile card view
  if (useMobile) {
    return (
      <div style={styles.mobileContainer}>
        {transactions.map((tx, idx) => (
          <TransactionCard
            key={tx.id || idx}
            transaction={tx}
            onViewDetails={onViewDetails}
            showAccount={showAccount}
          />
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={styles.th}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => (
            <TransactionRow
              key={tx.id || idx}
              transaction={tx}
              onViewDetails={onViewDetails}
              showAccount={showAccount}
              isEven={idx % 2 === 0}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
    whiteSpace: 'nowrap',
  },
  mobileContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  emptyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#f9fafb',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    maxWidth: '320px',
    lineHeight: '20px',
  },
};
