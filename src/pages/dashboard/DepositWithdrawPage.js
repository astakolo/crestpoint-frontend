import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import InputField from '../../components/common/InputField';
import { formatCurrency, maskAccountNumber } from '../../utils/constants';

const DAILY_WITHDRAWAL_LIMIT = 25000;
const TABS = [
  { key: 'deposit', label: 'Deposit', icon: '💰' },
  { key: 'withdraw', label: 'Withdraw', icon: '🏧' },
];

export default function DepositWithdrawPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('deposit');

  // Form state
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Processing
  const [processing, setProcessing] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState(null);

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);

  // Daily withdrawal tracking
  const [dailyWithdrawn, setDailyWithdrawn] = useState(0);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getAccounts();
      const accs = Array.isArray(data) ? data : data?.results || data?.data || [];
      setAccounts(accs.filter((a) => (a.status || '').toLowerCase() === 'active'));
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Fetch daily withdrawal total
  useEffect(() => {
    if (accounts.length > 0 && activeTab === 'withdraw') {
      const fetchDailyTotal = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const data = await transactionService.getHistory({
            type: 'withdrawal',
            date_from: today,
            date_to: today,
            status: 'completed',
            page_size: 1000,
          });
          const txs = Array.isArray(data) ? data : data?.results || data?.data || [];
          const total = txs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
          setDailyWithdrawn(total);
        } catch {
          // Non-critical
        }
      };
      fetchDailyTotal();
    }
  }, [accounts, activeTab]);

  const selectedAccountData = accounts.find(
    (a) => (a.id || a.account_number) === selectedAccount
  );

  const remainingDaily = DAILY_WITHDRAWAL_LIMIT - dailyWithdrawn;
  const isWithdraw = activeTab === 'withdraw';

  const validateForm = () => {
    const errors = {};
    if (!selectedAccount) {
      errors.account = 'Please select an account';
    }
    const numAmount = parseFloat(amount);
    if (!amount || amount.trim() === '') {
      errors.amount = 'Amount is required';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (isWithdraw && selectedAccountData) {
      if (numAmount > parseFloat(selectedAccountData.balance || 0)) {
        errors.amount = `Insufficient funds. Available: ${formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}`;
      }
      if (numAmount > remainingDaily) {
        errors.amount = `Amount exceeds daily remaining limit of ${formatCurrency(remainingDaily)}`;
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setConfirmDetails({
      account: selectedAccountData,
      amount: parseFloat(amount),
      description: description,
      type: activeTab,
    });
    setShowConfirm(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmDetails) return;
    setProcessing(true);
    setError('');
    try {
      const payload = {
        account: confirmDetails.account.id || confirmDetails.account.account_number,
        amount: confirmDetails.amount,
        description: confirmDetails.description || undefined,
      };

      const result = isWithdraw
        ? await transactionService.withdraw(payload)
        : await transactionService.deposit(payload);

      setSuccessDetails({
        ...result,
        amount: confirmDetails.amount,
        currency: confirmDetails.account.currency,
        accountNumber: confirmDetails.account.account_number,
        type: activeTab,
      });
      setShowConfirm(false);
      setShowSuccessModal(true);
      // Reset form
      setAmount('');
      setDescription('');
      setFormErrors({});
      // Refresh accounts
      fetchAccounts();
    } catch (err) {
      const msg = err?.response?.data?.detail
        || err?.response?.data?.error
        || err?.response?.data?.message
        || err?.message
        || `${isWithdraw ? 'Withdrawal' : 'Deposit'} failed. Please try again.`;
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setAmount('');
    setDescription('');
    setFormErrors({});
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.loadingContainer}>
            <LoadingSpinner size="lg" text="Loading accounts..." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Page Header */}
          <h1 style={styles.pageTitle}>Deposit & Withdraw</h1>
          <p style={styles.pageDescription}>
            {isWithdraw
              ? 'Withdraw funds from your CrestPoint Credit account.'
              : 'Add funds to your CrestPoint Credit account.'}
          </p>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          {success && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="success" message={success} onClose={() => setSuccess('')} />
            </div>
          )}

          {/* Tab Toggle */}
          <div style={styles.tabToggle}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.key ? styles.tabButtonActive : {}),
                }}
              >
                <span style={{ marginRight: '6px' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* No accounts */}
          {accounts.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{isWithdraw ? '🏧' : '💰'}</div>
              <h3 style={styles.emptyTitle}>No Active Accounts</h3>
              <p style={styles.emptyDescription}>
                You need at least one active account to {isWithdraw ? 'withdraw from' : 'deposit into'}.
              </p>
            </div>
          ) : (
            /* Form Card */
            <div style={styles.formCard}>
              {/* Account Selection */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Select Account <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    setFormErrors((prev) => ({ ...prev, account: '' }));
                  }}
                  style={{
                    ...styles.selectInput,
                    borderColor: formErrors.account ? '#dc2626' : '#e5e7eb',
                  }}
                >
                  <option value="">Choose an account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                      {acc.account_type || 'Account'} — {maskAccountNumber(acc.account_number)} — {formatCurrency(acc.balance, acc.currency)}
                    </option>
                  ))}
                </select>
                {formErrors.account && (
                  <span style={styles.errorText}>{formErrors.account}</span>
                )}
              </div>

              {/* Current Balance Display */}
              {selectedAccountData && (
                <div style={styles.balanceBox}>
                  <div style={styles.balanceRow}>
                    <span style={styles.balanceLabel}>Current Balance</span>
                    <span style={styles.balanceValue}>
                      {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                    </span>
                  </div>
                  {isWithdraw && (
                    <>
                      <div style={styles.balanceRow}>
                        <span style={styles.balanceLabel}>Daily Withdrawal Limit</span>
                        <span style={styles.balanceValue}>
                          {formatCurrency(DAILY_WITHDRAWAL_LIMIT)}
                        </span>
                      </div>
                      <div style={styles.balanceRow}>
                        <span style={styles.balanceLabel}>Remaining Today</span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: remainingDaily <= 0 ? '#dc2626' : '#111827',
                        }}>
                          {formatCurrency(Math.max(0, remainingDaily))}
                        </span>
                      </div>
                      {remainingDaily <= 0 && (
                        <div style={styles.limitWarning}>
                          You have reached your daily withdrawal limit. Please try again tomorrow.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Amount <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={styles.amountWrapper}>
                  <span style={styles.currencyPrefix}>
                    {selectedAccountData?.currency === 'EUR' ? '€' : selectedAccountData?.currency === 'GBP' ? '£' : '$'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setFormErrors((prev) => ({ ...prev, amount: '' }));
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={isWithdraw && remainingDaily <= 0}
                    style={{
                      ...styles.amountInput,
                      borderColor: formErrors.amount ? '#dc2626' : '#e5e7eb',
                      cursor: isWithdraw && remainingDaily <= 0 ? 'not-allowed' : 'text',
                      opacity: isWithdraw && remainingDaily <= 0 ? 0.5 : 1,
                    }}
                  />
                </div>
                {formErrors.amount && (
                  <span style={styles.errorText}>{formErrors.amount}</span>
                )}
                {/* Quick amount buttons */}
                <div style={styles.quickAmounts}>
                  {[100, 500, 1000, 5000].map((qa) => (
                    <button
                      key={qa}
                      type="button"
                      onClick={() => {
                        setAmount(String(qa));
                        setFormErrors((prev) => ({ ...prev, amount: '' }));
                      }}
                      disabled={isWithdraw && remainingDaily <= 0}
                      style={{
                        ...styles.quickAmountBtn,
                        opacity: isWithdraw && remainingDaily <= 0 ? 0.5 : 1,
                      }}
                    >
                      {formatCurrency(qa)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`What is this ${isWithdraw ? 'withdrawal' : 'deposit'} for? (Optional)`}
                  rows={3}
                  style={styles.textarea}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                fullWidth
                size="lg"
                disabled={!selectedAccount || !amount}
              >
                {isWithdraw ? 'Withdraw Funds' : 'Deposit Funds'}
              </Button>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleConfirmAction}
            title={`Confirm ${isWithdraw ? 'Withdrawal' : 'Deposit'}`}
            message={`Are you sure you want to ${isWithdraw ? 'withdraw' : 'deposit'} ${formatCurrency(confirmDetails?.amount, confirmDetails?.account?.currency)} ${isWithdraw ? 'from' : 'to'} your account ending in ${maskAccountNumber(confirmDetails?.account?.account_number)}?`}
            confirmText={isWithdraw ? 'Confirm Withdrawal' : 'Confirm Deposit'}
            variant="default"
          />

          {/* Success Modal */}
          <Modal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title={isWithdraw ? 'Withdrawal Successful' : 'Deposit Successful'}
            size="sm"
          >
            <div style={styles.successContent}>
              <div style={styles.successIconContainer}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <h3 style={styles.successTitle}>
                {isWithdraw ? 'Withdrawal Completed!' : 'Deposit Completed!'}
              </h3>
              <p style={styles.successDescription}>
                {isWithdraw
                  ? 'The funds have been withdrawn from your account.'
                  : 'The funds have been credited to your account.'}
              </p>

              {successDetails && (
                <div style={styles.successDetails}>
                  <div style={styles.successRow}>
                    <span style={styles.successLabel}>Amount</span>
                    <span style={styles.successValue}>
                      {formatCurrency(successDetails.amount, successDetails.currency)}
                    </span>
                  </div>
                  {successDetails.reference && (
                    <div style={styles.successRow}>
                      <span style={styles.successLabel}>Reference</span>
                      <span style={styles.successValue}>{successDetails.reference}</span>
                    </div>
                  )}
                  {successDetails.accountNumber && (
                    <div style={styles.successRow}>
                      <span style={styles.successLabel}>Account</span>
                      <span style={styles.successValue}>
                        {maskAccountNumber(successDetails.accountNumber)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={() => setShowSuccessModal(false)}
                fullWidth
                style={{ marginTop: '16px' }}
              >
                Done
              </Button>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    paddingTop: '64px',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  pageDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
  },
  // Tab toggle
  tabToggle: {
    display: 'flex',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  tabButton: {
    flex: 1,
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'all 0.15s',
    textAlign: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    boxShadow: '0 1px 3px rgba(26, 86, 219, 0.3)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  emptyDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  // Form
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  selectInput: {
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
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  errorText: {
    fontSize: '12px',
    color: '#dc2626',
    lineHeight: '16px',
  },
  // Balance display
  balanceBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  balanceLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  balanceValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  limitWarning: {
    fontSize: '13px',
    color: '#dc2626',
    fontWeight: 500,
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  // Amount input
  amountWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    pointerEvents: 'none',
    zIndex: 1,
  },
  amountInput: {
    width: '100%',
    padding: '12px 12px 12px 32px',
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: '24px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  quickAmounts: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  quickAmountBtn: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'all 0.15s',
  },
  // Textarea
  textarea: {
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
    resize: 'vertical',
    minHeight: '72px',
    transition: 'border-color 0.15s',
  },
  // Success modal
  successContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  successDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 24px 0',
    lineHeight: '20px',
  },
  successDetails: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
  },
  successRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  successLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  successValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#111827',
  },
};
