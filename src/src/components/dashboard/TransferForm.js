import React, { useState, useMemo } from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { validatePassword } from '../../utils/helpers';

function maskAccountNumber(number) {
  if (!number) return '';
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

export default function TransferForm({ accounts = [], onTransfer, isLoading = false }) {
  const [formData, setFormData] = useState({
    sourceAccount: '',
    recipientAccount: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const selectedSource = accounts.find(
    (a) => (a.id || a.account_number) === formData.sourceAccount
  );

  const transferFee = useMemo(() => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) return 0;
    if (parseFloat(formData.amount) > 5000) return 5.00;
    return 0;
  }, [formData.amount]);

  // Validation
  const validateField = (name) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'sourceAccount':
        if (!formData.sourceAccount) {
          newErrors.sourceAccount = 'Please select a source account';
        } else {
          delete newErrors.sourceAccount;
        }
        break;
      case 'recipientAccount':
        if (!formData.recipientAccount.trim()) {
          newErrors.recipientAccount = 'Recipient account number is required';
        } else if (!/^\d{12}$/.test(formData.recipientAccount.replace(/\s/g, ''))) {
          newErrors.recipientAccount = 'Account number must be 12 digits';
        } else if (formData.sourceAccount && formData.recipientAccount.replace(/\s/g, '') === selectedSource?.account_number?.replace(/\s/g, '')) {
          newErrors.recipientAccount = 'Cannot transfer to your own account';
        } else {
          delete newErrors.recipientAccount;
        }
        break;
      case 'amount':
        const numAmount = parseFloat(formData.amount);
        if (!formData.amount || formData.amount.trim() === '') {
          newErrors.amount = 'Amount is required';
        } else if (isNaN(numAmount) || numAmount <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        } else if (selectedSource && numAmount > parseFloat(selectedSource.balance || 0)) {
          newErrors.amount = `Insufficient funds. Available: ${formatBalance(selectedSource.balance, selectedSource.currency)}`;
        } else if (selectedSource && numAmount + transferFee > parseFloat(selectedSource.balance || 0)) {
          newErrors.amount = `Amount plus fee exceeds available balance`;
        } else {
          delete newErrors.amount;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
    setShowSummary(false);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateForm = () => {
    const fields = ['sourceAccount', 'recipientAccount', 'amount'];
    let allValid = true;

    fields.forEach((field) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const valid = validateField(field);
      if (!valid) allValid = false;
    });

    return allValid;
  };

  const handleReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowSummary(true);
    }
  };

  const handleConfirm = () => {
    setServerError('');
    const transferData = {
      source_account: formData.sourceAccount,
      recipient_account: formData.recipientAccount.replace(/\s/g, ''),
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
    };

    onTransfer?.(transferData);
  };

  const handleCancelSummary = () => {
    setShowSummary(false);
  };

  return (
    <div style={styles.container}>
      {serverError && (
        <div style={{ marginBottom: '20px' }}>
          <Alert type="error" message={serverError} onClose={() => setServerError('')} />
        </div>
      )}

      {showSummary && selectedSource ? (
        /* Transfer Summary */
        <div style={styles.summaryContainer}>
          <h3 style={styles.summaryHeading}>Transfer Summary</h3>

          <div style={styles.summaryCard}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>From</span>
              <span style={styles.summaryValue}>
                {selectedSource.account_type || 'Account'} — {maskAccountNumber(selectedSource.account_number)}
              </span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>To</span>
              <span style={styles.summaryValue}>
                {formData.recipientAccount.replace(/(.{4})/g, '$1 ').trim()}
              </span>
            </div>
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Amount</span>
              <span style={{ ...styles.summaryValue, fontWeight: 600 }}>
                {formatBalance(formData.amount, selectedSource.currency || 'USD')}
              </span>
            </div>
            {transferFee > 0 && (
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>Fee</span>
                <span style={{ ...styles.summaryValue, color: '#6b7280' }}>
                  {formatBalance(transferFee, selectedSource.currency || 'USD')}
                </span>
              </div>
            )}
            {formData.description && (
              <>
                <div style={styles.divider} />
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Description</span>
                  <span style={{ ...styles.summaryValue, color: '#6b7280', fontStyle: 'italic' }}>
                    {formData.description}
                  </span>
                </div>
              </>
            )}
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={{ ...styles.summaryLabel, fontWeight: 600, color: '#111827' }}>Total</span>
              <span style={{ ...styles.summaryValue, fontWeight: 700, color: '#111827', fontSize: '16px' }}>
                {formatBalance(
                  (parseFloat(formData.amount) || 0) + transferFee,
                  selectedSource.currency || 'USD'
                )}
              </span>
            </div>
          </div>

          <div style={styles.summaryActions}>
            <Button variant="secondary" onClick={handleCancelSummary} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} loading={isLoading}>
              Confirm Transfer
            </Button>
          </div>
        </div>
      ) : (
        /* Transfer Form */
        <form onSubmit={handleReview} style={styles.form}>
          {/* Source account */}
          <div style={styles.fieldGroup}>
            <label style={styles.selectLabel}>
              Source Account
              <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
            </label>
            <select
              name="sourceAccount"
              value={formData.sourceAccount}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.select,
                borderColor: touched.sourceAccount && errors.sourceAccount ? '#dc2626' : '#e5e7eb',
              }}
            >
              <option value="">Select an account</option>
              {accounts.map((acc) => {
                const key = acc.id || acc.account_number;
                return (
                  <option key={key} value={key}>
                    {acc.account_type || 'Account'} — {maskAccountNumber(acc.account_number)} — {formatBalance(acc.balance, acc.currency)}
                  </option>
                );
              })}
            </select>
            {touched.sourceAccount && errors.sourceAccount && (
              <span style={styles.errorText}>{errors.sourceAccount}</span>
            )}
          </div>

          {/* Recipient */}
          <InputField
            label="Recipient Account Number"
            name="recipientAccount"
            value={formData.recipientAccount}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter 12-digit account number"
            error={touched.recipientAccount ? errors.recipientAccount : ''}
            required
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />

          {/* Amount */}
          <div style={styles.fieldGroup}>
            <label style={styles.selectLabel}>
              Amount
              <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={styles.currencyPrefix}>
                {selectedSource?.currency === 'EUR' ? '€' : selectedSource?.currency === 'GBP' ? '£' : '$'}
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{
                  ...styles.amountInput,
                  borderColor: touched.amount && errors.amount ? '#dc2626' : '#e5e7eb',
                }}
              />
            </div>
            {touched.amount && errors.amount && (
              <span style={styles.errorText}>{errors.amount}</span>
            )}
            {selectedSource && (
              <span style={styles.availableBalance}>
                Available: {formatBalance(selectedSource.balance, selectedSource.currency)}
              </span>
            )}
          </div>

          {/* Fee notice */}
          {transferFee > 0 && (
            <div style={styles.feeNotice}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ color: '#d97706', fontSize: '13px' }}>
                A fee of {formatBalance(transferFee, selectedSource?.currency || 'USD')} applies for transfers above $5,000.00
              </span>
            </div>
          )}

          {/* Description */}
          <InputField
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What's this transfer for?"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          />

          {/* Submit */}
          <Button type="submit" fullWidth size="lg">
            Review Transfer
          </Button>
        </form>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  selectLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
    cursor: 'pointer',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
    pointerEvents: 'none',
  },
  amountInput: {
    width: '100%',
    padding: '10px 12px 10px 32px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
  },
  errorText: {
    fontSize: '12px',
    color: '#dc2626',
    lineHeight: '16px',
  },
  availableBalance: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  feeNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
  },
  /* Summary styles */
  summaryContainer: {
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  summaryHeading: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 20px 0',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '14px',
    color: '#111827',
    textAlign: 'right',
  },
  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '4px 0',
  },
  summaryActions: {
    display: 'flex',
    gap: '12px',
  },
  summaryActions: {
    display: 'flex',
    gap: '12px',
  },
};
