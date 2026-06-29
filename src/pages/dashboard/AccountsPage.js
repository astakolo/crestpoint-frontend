import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import AccountCard from '../../components/dashboard/AccountCard';
import TransactionTable from '../../components/dashboard/TransactionTable';
import { formatCurrency, formatDate, maskAccountNumber, ACCOUNT_TYPES } from '../../utils/constants';

const ACCOUNT_TYPE_OPTIONS = {
  savings: {
    label: 'Savings Account',
    icon: '🏦',
    description: 'Earn interest on your deposits. Ideal for long-term savings.',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  current: {
    label: 'Current Account',
    icon: '💳',
    description: 'Unlimited transactions. Perfect for daily banking needs.',
    color: '#1a56db',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
};

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create account modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Account detail modal
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountDetail, setAccountDetail] = useState(null);
  const [accountTransactions, setAccountTransactions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountService.getAccounts();
      setAccounts(Array.isArray(data) ? data : data?.results || data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSelectAccount = useCallback(async (account) => {
    setSelectedAccount(account);
    setDetailLoading(true);
    try {
      const [detail, txData] = await Promise.allSettled([
        accountService.getAccount(account.id),
        transactionService.getHistory({ account: account.id, page_size: 10 }),
      ]);

      if (detail.status === 'fulfilled') {
        setAccountDetail(detail.value);
      } else {
        setAccountDetail(account);
      }

      if (txData.status === 'fulfilled') {
        const txs = Array.isArray(txData.value)
          ? txData.value
          : txData.value?.results || txData.value?.data || [];
        setAccountTransactions(txs);
      }
    } catch (err) {
      // Still show what we have
      setAccountDetail(account);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCreateAccount = async () => {
    if (!selectedType) return;
    setCreating(true);
    setCreateError('');
    try {
      await accountService.createAccount({ account_type: selectedType });
      setShowCreateModal(false);
      setSelectedType('');
      setSuccess('Account created successfully!');
      setTimeout(() => setSuccess(''), 4000);
      fetchAccounts();
    } catch (err) {
      setCreateError(err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedType('');
    setCreateError('');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.loadingContainer}>
            <LoadingSpinner size="lg" text="Loading your accounts..." />
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
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>My Accounts</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              + Create New Account
            </Button>
          </div>

          {/* Alerts */}
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

          {/* Accounts Grid */}
          {accounts.length > 0 ? (
            <div style={styles.accountsGrid}>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id || account.account_number}
                  account={account}
                  onClick={handleSelectAccount}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🏦</div>
              <h3 style={styles.emptyTitle}>No Accounts Yet</h3>
              <p style={styles.emptyDescription}>
                You don't have any accounts yet. Create your first account to start banking with CrestPoint Credit.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Account
              </Button>
            </div>
          )}

          {/* Create Account Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={closeCreateModal}
            title="Create New Account"
          >
            {createError && (
              <div style={{ marginBottom: '20px' }}>
                <Alert type="error" message={createError} onClose={() => setCreateError('')} />
              </div>
            )}

            <p style={styles.modalDescription}>
              Choose the type of account you want to create. You can have multiple accounts of different types.
            </p>

            <div style={styles.typeGrid}>
              {Object.entries(ACCOUNT_TYPE_OPTIONS).map(([key, config]) => (
                <div
                  key={key}
                  onClick={() => setSelectedType(key)}
                  style={{
                    ...styles.typeCard,
                    borderColor: selectedType === key ? config.color : '#e5e7eb',
                    backgroundColor: selectedType === key ? config.bg : '#ffffff',
                    boxShadow: selectedType === key
                      ? `0 0 0 2px ${config.border}`
                      : '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}>
                    <span style={{ fontSize: '24px' }}>{config.icon}</span>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#111827',
                    }}>
                      {config.label}
                    </span>
                    {selectedType === key && (
                      <div style={{
                        marginLeft: 'auto',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: '18px',
                  }}>
                    {config.description}
                  </p>
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <Button variant="secondary" onClick={closeCreateModal} disabled={creating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAccount}
                loading={creating}
                disabled={!selectedType}
              >
                Create Account
              </Button>
            </div>
          </Modal>

          {/* Account Detail Modal */}
          <Modal
            isOpen={!!selectedAccount}
            onClose={() => {
              setSelectedAccount(null);
              setAccountDetail(null);
              setAccountTransactions([]);
            }}
            title="Account Details"
            size="lg"
          >
            {detailLoading ? (
              <LoadingSpinner text="Loading account details..." />
            ) : accountDetail ? (
              <div style={styles.detailContent}>
                {/* Account Info Card */}
                <div style={styles.detailCard}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Account Number</span>
                    <span style={styles.detailValue}>
                      {maskAccountNumber(accountDetail.account_number || accountDetail.number)}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Account Type</span>
                    <span style={{
                      ...styles.detailValue,
                      textTransform: 'capitalize',
                    }}>
                      {accountDetail.account_type || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Status</span>
                    <span style={styles.detailValue}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '100px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor:
                          (accountDetail.status || '').toLowerCase() === 'active' ? '#ecfdf5'
                          : (accountDetail.status || '').toLowerCase() === 'frozen' ? '#eff6ff'
                          : '#f3f4f6',
                        color:
                          (accountDetail.status || '').toLowerCase() === 'active' ? '#059669'
                          : (accountDetail.status || '').toLowerCase() === 'frozen' ? '#1a56db'
                          : '#6b7280',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor:
                            (accountDetail.status || '').toLowerCase() === 'active' ? '#059669'
                            : (accountDetail.status || '').toLowerCase() === 'frozen' ? '#1a56db'
                            : '#9ca3af',
                        }} />
                        {(accountDetail.status || '').charAt(0).toUpperCase() + (accountDetail.status || '').slice(1)}
                      </span>
                    </span>
                  </div>
                  <div style={styles.detailDivider} />
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Available Balance</span>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#111827',
                    }}>
                      {formatCurrency(accountDetail.balance || 0, accountDetail.currency)}
                    </span>
                  </div>
                  {accountDetail.currency && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Currency</span>
                      <span style={styles.detailValue}>{accountDetail.currency}</span>
                    </div>
                  )}
                  {accountDetail.created_at && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Opened On</span>
                      <span style={styles.detailValue}>{formatDate(accountDetail.created_at)}</span>
                    </div>
                  )}
                </div>

                {/* Recent Transactions for Account */}
                <h3 style={styles.detailSectionTitle}>Recent Transactions</h3>
                <TransactionTable transactions={accountTransactions} />
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>Unable to load account details.</p>
            )}
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  accountsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
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
    margin: '0 0 24px 0',
    maxWidth: '400px',
    lineHeight: '20px',
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px 0',
    lineHeight: '20px',
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  typeCard: {
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb',
  },
  detailContent: {},
  detailCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  detailDivider: {
    borderTop: '1px solid #e5e7eb',
    margin: '8px 0',
  },
  detailSectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 16px 0',
  },
};
