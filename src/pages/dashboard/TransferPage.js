import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import TransferForm from '../../components/dashboard/TransferForm';
import { formatCurrency } from '../../utils/constants';

const TRANSFER_LIMITS = {
  single: 10000,
  daily: 50000,
};

export default function TransferPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Transfer state
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getAccounts();
      const accs = Array.isArray(data) ? data : data?.results || data?.data || [];
      setAccounts(accs.filter((a) => a.is_active && !a.is_frozen));
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleTransfer = async (transferData) => {
    setTransferring(true);
    setTransferError('');
    try {
      const result = await transactionService.transfer(transferData);
      setTransferResult(result);
      setShowSuccessModal(true);
      // Refresh accounts to get updated balances
      fetchAccounts();
    } catch (err) {
      const message = err?.response?.data?.detail
        || err?.response?.data?.error
        || err?.response?.data?.message
        || err?.message
        || 'Transfer failed. Please try again.';
      setTransferError(message);
    } finally {
      setTransferring(false);
    }
  };

  const handleTransferAnother = () => {
    setShowSuccessModal(false);
    setTransferResult(null);
    setTransferError('');
    fetchAccounts();
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

  if (error) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.container}>
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        </div>
      </>
    );
  }

  if (accounts.length === 0) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.container}>
            <h1 className="cp-page-title" style={styles.pageTitle}>Send Money</h1>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💳</div>
              <h3 style={styles.emptyTitle}>No Active Accounts</h3>
              <p style={styles.emptyDescription}>
                You need at least one active account to send money.
              </p>
            </div>
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
          <h1 className="cp-page-title" style={styles.pageTitle}>Send Money</h1>
          <p style={styles.pageDescription}>
            Send money to other CrestPoint Credit account holders instantly.
          </p>

          {/* Send Money Limits Info */}
          <div style={styles.limitsBox}>
            <div style={styles.limitsHeader}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span style={styles.limitsTitle}>Send Money Limits</span>
            </div>
            <div style={styles.limitsGrid}>
              <div style={styles.limitItem}>
                <span style={styles.limitLabel}>Per Transfer Limit</span>
                <span style={styles.limitValue}>{formatCurrency(TRANSFER_LIMITS.single)}</span>
              </div>
              <div style={styles.limitItem}>
                <span style={styles.limitLabel}>Daily Limit</span>
                <span style={styles.limitValue}>{formatCurrency(TRANSFER_LIMITS.daily)}</span>
              </div>
              <div style={styles.limitItem}>
                <span style={styles.limitLabel}>Today's Usage</span>
                <span style={{
                  ...styles.limitValue,
                  color: '#111827',
                }}>
                  {formatCurrency(0)}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#6b7280',
                    marginLeft: '8px',
                  }}>
                    ({formatCurrency(TRANSFER_LIMITS.daily)} remaining)
                  </span>
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div style={styles.progressBarBg}>
              <div style={{
                ...styles.progressBarFill,
                width: '0%',
                backgroundColor: '#1a56db',
              }} />
            </div>
          </div>

          {/* Error Alert */}
          {transferError && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="error" message={transferError} onClose={() => setTransferError('')} />
            </div>
          )}

          {/* Transfer Form */}
          <div style={styles.formCard}>
            <TransferForm
              accounts={accounts}
              onTransfer={handleTransfer}
              isLoading={transferring}
            />
          </div>

          {/* Success Modal */}
          <Modal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="Money Sent!"
            size="sm"
          >
            <div style={styles.successContent}>
              {/* Success Icon */}
              <div style={styles.successIconContainer}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <h3 style={styles.successTitle}>Money Sent Successfully!</h3>
              <p style={styles.successDescription}>
                Your money has been sent and the recipient will receive the funds instantly.
              </p>

              {transferResult && (
                <div style={styles.successDetails}>
                  {transferResult.reference && (
                    <div style={styles.successRow}>
                      <span style={styles.successLabel}>Reference</span>
                      <span style={styles.successValue}>{transferResult.reference}</span>
                    </div>
                  )}
                  {transferResult.amount != null && (
                    <div style={styles.successRow}>
                      <span style={styles.successLabel}>Amount</span>
                      <span style={styles.successValue}>
                        {formatCurrency(transferResult.amount, transferResult.currency)}
                      </span>
                    </div>
                  )}
                  {transferResult.recipient_account && (
                    <div style={styles.successRow}>
                      <span style={styles.successLabel}>Recipient</span>
                      <span style={styles.successValue}>{transferResult.recipient_account}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={styles.successActions}>
                <Button onClick={handleTransferAnother} variant="primary" fullWidth>
                  Send Another
                </Button>
                <Link to="/transactions" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" fullWidth style={{ marginTop: '8px' }}>
                    View Transactions
                  </Button>
                </Link>
              </div>
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
    maxWidth: '640px',
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
    lineHeight: '20px',
  },
  limitsBox: {
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    border: '1px solid #bfdbfe',
    padding: '20px',
    marginBottom: '24px',
  },
  limitsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  limitsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a56db',
  },
  limitsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  limitItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: '13px',
    color: '#374151',
  },
  limitValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: '#dbeafe',
    borderRadius: '100px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '100px',
    transition: 'width 0.3s ease',
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    marginBottom: '24px',
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
  successActions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
};
