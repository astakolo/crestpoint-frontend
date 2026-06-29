import React, { useState, useEffect, useCallback } from 'react';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import TransactionTable from '../../components/dashboard/TransactionTable';
import { formatCurrency, formatDate, maskAccountNumber, TRANSACTION_TYPES, TRANSACTION_STATUS } from '../../utils/constants';

const PAGE_SIZE = 15;

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  reversed: { label: 'Reversed', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  processing: { label: 'Processing', bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
};

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    account: '',
    type: '',
    status: '',
    date_from: '',
    date_to: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  // Transaction detail modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [txDetail, setTxDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch accounts for filter dropdown
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountService.getAccounts();
        setAccounts(Array.isArray(data) ? data : data?.results || data?.data || []);
      } catch {
        // Non-critical
      }
    };
    fetchAccounts();
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1, filterParams = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ...filterParams,
      };
      const data = await transactionService.getHistory(params);
      const txs = Array.isArray(data) ? data : data?.results || data?.data || [];
      setTransactions(txs);
      setTotalCount(data?.count ?? txs.length);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(currentPage, appliedFilters);
  }, [currentPage, appliedFilters, fetchTransactions]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, totalCount);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    const cleaned = {};
    if (filters.account) cleaned.account = filters.account;
    if (filters.type) cleaned.type = filters.type;
    if (filters.status) cleaned.status = filters.status;
    if (filters.date_from) cleaned.date_from = filters.date_from;
    if (filters.date_to) cleaned.date_to = filters.date_to;
    setAppliedFilters(cleaned);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ account: '', type: '', status: '', date_from: '', date_to: '' });
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewTransaction = useCallback(async (tx) => {
    setSelectedTransaction(tx);
    setDetailLoading(true);
    try {
      const data = await transactionService.getTransaction(tx.id);
      setTxDetail(data);
    } catch {
      setTxDetail(tx);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetailModal = () => {
    setSelectedTransaction(null);
    setTxDetail(null);
  };

  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container} className="cp-page-container">
          {/* Page Header */}
          <div style={styles.pageHeader} className="cp-page-header">
            <h1 style={styles.pageTitle}>Transaction History</h1>
            {totalCount > 0 && (
              <span style={styles.countBadge}>
                Showing {showingFrom}–{showingTo} of {totalCount} transactions
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          {/* Filters Bar */}
          <div style={styles.filtersBar}>
            <div style={styles.filtersRow} className="cp-filters-grid">
              {/* Account Filter */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Account</label>
                <select
                  value={filters.account}
                  onChange={(e) => handleFilterChange('account', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                      {acc.account_type || 'Account'} — {maskAccountNumber(acc.account_number)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="transfer_in">Transfer In</option>
                  <option value="transfer_out">Transfer Out</option>
                </select>
              </div>

              {/* Status Filter */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Date From */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Date To */}
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={styles.filterActions} className="cp-filter-actions">
              <Button onClick={handleApplyFilters} size="sm">
                Apply Filters
              </Button>
              <Button onClick={handleClearFilters} variant="secondary" size="sm">
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {Object.keys(appliedFilters).length > 0 && (
            <div style={styles.activeFilters} className="cp-active-filters">
              <span style={styles.activeFiltersLabel}>Active filters:</span>
              {appliedFilters.account && (
                <span style={styles.filterTag}>
                  Account
                  <button onClick={() => { handleFilterChange('account', ''); handleApplyFilters(); }} style={styles.filterTagClose}>&times;</button>
                </span>
              )}
              {appliedFilters.type && (
                <span style={styles.filterTag}>
                  Type: {appliedFilters.type.replace('_', ' ')}
                  <button onClick={() => { handleFilterChange('type', ''); handleApplyFilters(); }} style={styles.filterTagClose}>&times;</button>
                </span>
              )}
              {appliedFilters.status && (
                <span style={styles.filterTag}>
                  Status: {appliedFilters.status}
                  <button onClick={() => { handleFilterChange('status', ''); handleApplyFilters(); }} style={styles.filterTagClose}>&times;</button>
                </span>
              )}
              {appliedFilters.date_from && (
                <span style={styles.filterTag}>
                  From: {appliedFilters.date_from}
                  <button onClick={() => { handleFilterChange('date_from', ''); handleApplyFilters(); }} style={styles.filterTagClose}>&times;</button>
                </span>
              )}
              {appliedFilters.date_to && (
                <span style={styles.filterTag}>
                  To: {appliedFilters.date_to}
                  <button onClick={() => { handleFilterChange('date_to', ''); handleApplyFilters(); }} style={styles.filterTagClose}>&times;</button>
                </span>
              )}
            </div>
          )}

          {/* Transactions Table */}
          {loading ? (
            <div style={styles.loadingContainer}>
              <LoadingSpinner text="Loading transactions..." />
            </div>
          ) : (
            <>
              <TransactionTable
                transactions={transactions}
                onViewDetails={handleViewTransaction}
                showAccount={Object.keys(appliedFilters).length > 0 || accounts.length > 1}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.paginationContainer}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}

          {/* Transaction Detail Modal */}
          <Modal
            isOpen={!!selectedTransaction}
            onClose={closeDetailModal}
            title="Transaction Details"
            size="md"
          >
            {detailLoading ? (
              <LoadingSpinner text="Loading details..." />
            ) : txDetail ? (
              <div style={styles.detailContent}>
                {/* Status badge */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 16px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: STATUS_CONFIG[txDetail.status?.toLowerCase()]?.bg || '#f3f4f6',
                    color: STATUS_CONFIG[txDetail.status?.toLowerCase()]?.color || '#374151',
                    border: `1px solid ${STATUS_CONFIG[txDetail.status?.toLowerCase()]?.border || '#e5e7eb'}`,
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: STATUS_CONFIG[txDetail.status?.toLowerCase()]?.color || '#9ca3af',
                    }} />
                    {txDetail.status?.charAt(0).toUpperCase() + (txDetail.status || '').slice(1)}
                  </span>
                </div>

                {/* Amount */}
                <div style={styles.detailAmount}>
                  <span style={{
                    color: ['credit', 'deposit', 'transfer_in'].includes(txDetail.type?.toLowerCase()) ? '#059669' : '#dc2626',
                  }}>
                    {['credit', 'deposit', 'transfer_in'].includes(txDetail.type?.toLowerCase()) ? '+' : '-'}
                    {formatCurrency(txDetail.amount, txDetail.currency)}
                  </span>
                </div>

                {/* Details Grid */}
                <div style={styles.detailGrid}>
                  <DetailRow label="Reference" value={txDetail.reference || txDetail.id || 'N/A'} />
                  <DetailRow label="Type" value={(txDetail.type || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
                  <DetailRow label="Date" value={formatDate(txDetail.date || txDetail.created_at)} />
                  {txDetail.description && (
                    <DetailRow label="Description" value={txDetail.description} />
                  )}
                  {txDetail.balance_before != null && (
                    <DetailRow label="Balance Before" value={formatCurrency(txDetail.balance_before, txDetail.currency)} />
                  )}
                  {txDetail.balance_after != null && (
                    <DetailRow label="Balance After" value={formatCurrency(txDetail.balance_after, txDetail.currency)} />
                  )}
                  {txDetail.account_number && (
                    <DetailRow label="Account" value={maskAccountNumber(txDetail.account_number)} />
                  )}
                  {txDetail.recipient_account && (
                    <DetailRow label="Recipient Account" value={maskAccountNumber(txDetail.recipient_account)} />
                  )}
                  {txDetail.sender_account && (
                    <DetailRow label="Sender Account" value={maskAccountNumber(txDetail.sender_account)} />
                  )}
                  {txDetail.fee != null && (
                    <DetailRow label="Fee" value={formatCurrency(txDetail.fee, txDetail.currency)} />
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>Unable to load transaction details.</p>
            )}
          </Modal>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={detailStyles.row}>
      <span style={detailStyles.label}>{label}</span>
      <span style={detailStyles.value}>{value}</span>
    </div>
  );
}

const detailStyles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  label: {
    fontSize: '13px',
    color: '#6b7280',
    flexShrink: 0,
    marginRight: '16px',
  },
  value: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
};

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
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  countBadge: {
    fontSize: '13px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '4px 12px',
    borderRadius: '100px',
  },
  filtersBar: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    marginBottom: '16px',
  },
  filtersRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  activeFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  activeFiltersLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  filterTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
  },
  filterTagClose: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    color: '#1a56db',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    padding: 0,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 0',
  },
  detailContent: {},
  detailAmount: {
    textAlign: 'center',
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '24px',
  },
  detailGrid: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '4px 20px',
  },
};
