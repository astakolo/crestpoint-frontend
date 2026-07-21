export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const ACCOUNT_TYPES = {
  savings: 'Savings',
  current: 'Current',
};

export const TRANSACTION_TYPES = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer_in: 'Received',
  transfer_out: 'Sent',
  payment: 'Payment',
};

export const TRANSACTION_STATUS = {
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
  reversed: 'Reversed',
};

export const KYC_STATUS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const USER_ROLES = {
  customer: 'Customer',
  admin: 'Admin',
  support: 'Support',
  auditor: 'Auditor',
};

export const PAYMENT_METHODS = {
  bank_transfer: 'Bank Transfer',
  send_money: 'Send Money',
  debit_card: 'Debit Card',
  credit_card: 'Credit Card',
  mobile_money: 'Mobile Money',
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatCurrency(amount, currency = 'USD') {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  return `${symbol}${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function maskAccountNumber(accountNumber) {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}
