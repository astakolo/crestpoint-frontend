import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminService';
import Navbar from '../../components/common/Navbar';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import InputField from '../../components/common/InputField';
import { formatCurrency, formatDate, maskAccountNumber, TRANSACTION_TYPES, TRANSACTION_STATUS } from '../../utils/constants';

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  completed: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Completed' },
  pending: { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Pending' },
  failed: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Failed' },
  reversed: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Reversed' },
  processing: { bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe', label: 'Processing' },
};

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'payment', label: 'Payment' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'processing', label: 'Processing' },
];

const PAGE_SIZE = 20;

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
  const { user } = useAuth();

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalVolumeToday: 0,
    todayTransactionCount: 0,
    flaggedCount: 0,
    failedCount: 0,
    pendingCount: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [searchRef, setSearchRef] = useState('');
  const [searchRefInput, setSearchRefInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // View details modal
  const [detailTx, setDetailTx] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Flag modal
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagTarget, setFlagTarget] = useState(null);
  const [flagLoading, setFlagLoading] = useState(false);

  // Reverse transaction modal
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reverseLoading, setReverseLoading] = useState(false);

  // CSV export
  const [exportLoading, setExportLoading] = useState(false);

  // Alert
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [showFilters, setShowFilters] = useState(false);

  // ─── Fetch transactions ─────────────────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
        ordering: '-created_at',
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (amountMin) params.amount_min = amountMin;
      if (amountMax) params.amount_max = amountMax;
      if (flaggedOnly) params.is_flagged = 'true';
      if (searchRef) params.reference = searchRef;

      const res = await adminApi.getTransactions(params);
      const data = res.data;
      setTransactions(data.results || data || []);
      setTotalCount(data.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to load transactions.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax, flaggedOnly, searchRef]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getTransactionStats();
      const data = res.data;
      setStats({
        totalVolumeToday: data.today_volume ?? 0,
        todayTransactionCount: data.today_transaction_count ?? 0,
        flaggedCount: data.flagged_count ?? 0,
        failedCount: data.failed_count ?? 0,
        pendingCount: data.pending_count ?? 0,
      });
    } catch {
      // Stats are non-critical
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSearchRef = (e) => {
    e.preventDefault();
    setSearchRef(searchRefInput);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setFlaggedOnly(false);
    setSearchRef('');
    setSearchRefInput('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || typeFilter || dateFrom || dateTo || amountMin || amountMax || flaggedOnly || searchRef;

  const handleViewDetails = (tx) => {
    setDetailTx(tx);
    setDetailModalOpen(true);
  };

  const handleOpenFlagModal = (tx) => {
    setFlagTarget(tx);
    setFlagReason('');
    setFlagModalOpen(true);
  };

  const handleFlagTransaction = async () => {
    if (!flagReason.trim()) {
      setAlert({ type: 'warning', message: 'Please provide a reason for flagging.' });
      return;
    }
    setFlagLoading(true);
    try {
      await adminApi.flagTransaction(flagTarget.id, flagReason);
      setAlert({ type: 'success', message: 'Transaction flagged successfully.' });
      setFlagModalOpen(false);
      setFlagTarget(null);
      setFlagReason('');
      fetchTransactions();
      fetchStats();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to flag transaction.',
      });
    } finally {
      setFlagLoading(false);
    }
  };

  const handleUnflagTransaction = async (txId) => {
    try {
      await adminApi.unflagTransaction(txId);
      setAlert({ type: 'success', message: 'Transaction unflagged successfully.' });
      fetchTransactions();
      fetchStats();
      if (detailTx?.id === txId) {
        setDetailTx(prev => ({ ...prev, is_flagged: false, flag_reason: null }));
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to unflag transaction.',
      });
    }
  };

  const handleOpenReverseModal = (tx) => {
    setReverseTarget(tx);
    setReverseReason('');
    setReverseModalOpen(true);
  };

  const handleReverseTransaction = async () => {
    if (!reverseReason.trim()) {
      setAlert({ type: 'warning', message: 'Please provide a reason for reversing.' });
      return;
    }
    setReverseLoading(true);
    try {
      await adminApi.reverseTransaction(reverseTarget.id, reverseReason);
      setAlert({ type: 'success', message: 'Transaction reversed successfully.' });
      setReverseModalOpen(false);
      setReverseTarget(null);
      setReverseReason('');
      setDetailModalOpen(false);
      setDetailTx(null);
      fetchTransactions();
      fetchStats();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to reverse transaction.',
      });
    } finally {
      setReverseLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;
      if (flaggedOnly) params.is_flagged = 'true';
      if (searchRef) params.reference = searchRef;
      const res = await adminApi.exportTransactionsCSV(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setAlert({ type: 'success', message: 'CSV exported successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to export CSV.' });
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ─── Badge ──────────────────────────────────────────────────────────────

  const StatusBadge = ({ status }) => {
    const config = STATUS_BADGE[status?.toLowerCase()] || STATUS_BADGE.pending;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 10px',
        borderRadius: '100px',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: config.color,
        }} />
        {config.label}
      </span>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <AdminLayout>
        <div style={{
          minHeight: 'calc(100vh - 64px - 3px)',
          backgroundColor: '#f9fafb',
          padding: '32px 24px',
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Alert */}
            {alert.message && (
              <div style={{ marginBottom: '24px' }}>
                <Alert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert({ type: '', message: '' })}
                />
              </div>
            )}

            {error && (
              <div style={{ marginBottom: '24px' }}>
                <Alert type="error" message={error} />
              </div>
            )}

            {/* Page Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}>
                Transaction Monitoring
              </h1>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleExportCSV}
                  loading={exportLoading}
                  disabled={exportLoading}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #1a56db',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Total Volume Today
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#111827',
                }}>
                  {formatCurrency(stats.totalVolumeToday)}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '11px',
                  color: '#6b7280',
                }}>
                  {stats.todayTransactionCount.toLocaleString()} transaction{stats.todayTransactionCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #dc2626',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Flagged Transactions
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#dc2626',
                }}>
                  {stats.flaggedCount.toLocaleString()}
                </p>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #dc2626',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Failed Transactions
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#dc2626',
                }}>
                  {stats.failedCount.toLocaleString()}
                </p>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #d97706',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Pending Transactions
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#d97706',
                }}>
                  {stats.pendingCount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Search + Filters */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '20px 24px',
              marginBottom: '20px',
            }}>
              {/* Search by reference */}
              <form
                onSubmit={handleSearchRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{
                  flex: '1 1 300px',
                  display: 'flex',
                  gap: '8px',
                  minWidth: '200px',
                }}>
                  <input
                    type="text"
                    value={searchRefInput}
                    onChange={(e) => setSearchRefInput(e.target.value)}
                    placeholder="Search by reference number..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: '#111827',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1a56db';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 86, 219, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <Button type="submit" variant="primary" size="md">
                    Search
                  </Button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    style={selectStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1a56db'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Type filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    style={selectStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1a56db'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    {TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Toggle filters panel */}
                  <Button
                    variant={showFilters ? 'primary' : 'secondary'}
                    size="md"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? 'Hide Filters' : 'More Filters'}
                  </Button>
                </div>
              </form>

              {/* Expanded filters */}
              {showFilters && (
                <div style={{
                  padding: '16px 0 0 0',
                  borderTop: '1px solid #e5e7eb',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  alignItems: 'end',
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '6px',
                    }}>
                      Date From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                      style={dateInputStyle}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '6px',
                    }}>
                      Date To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                      style={dateInputStyle}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '6px',
                    }}>
                      Min Amount
                    </label>
                    <input
                      type="number"
                      value={amountMin}
                      onChange={(e) => { setAmountMin(e.target.value); setCurrentPage(1); }}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={dateInputStyle}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6b7280',
                      marginBottom: '6px',
                    }}>
                      Max Amount
                    </label>
                    <input
                      type="number"
                      value={amountMax}
                      onChange={(e) => { setAmountMax(e.target.value); setCurrentPage(1); }}
                      placeholder="999999.99"
                      min="0"
                      step="0.01"
                      style={dateInputStyle}
                    />
                  </div>

                  {/* Flagged only toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingBottom: '4px',
                  }}>
                    <button
                      type="button"
                      onClick={() => { setFlaggedOnly(!flaggedOnly); setCurrentPage(1); }}
                      style={{
                        position: 'relative',
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: flaggedOnly ? '#dc2626' : '#d1d5db',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: flaggedOnly ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: flaggedOnly ? '#dc2626' : '#6b7280',
                    }}>
                      Flagged Only
                    </span>
                  </div>
                </div>
              )}

              {/* Result count + clear */}
              <div style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  Showing {totalCount} transaction{totalCount !== 1 ? 's' : ''}
                  {hasActiveFilters && ' (filtered)'}
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#1a56db',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      padding: '4px 0',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '48px',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <LoadingSpinner size="lg" text="Loading transactions..." />
              </div>
            ) : transactions.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}>
                <EmptyState
                  icon="\uD83D\uDCB3"
                  title="No transactions found"
                  description={hasActiveFilters
                    ? 'Try adjusting your search or filters.'
                    : 'No transactions match your criteria.'}
                  actionLabel="Clear Filters"
                  onAction={clearAllFilters}
                />
              </div>
            ) : (
              <>
                {/* Transactions Table */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}>
                      <thead>
                        <tr>
                          {[
                            'Reference',
                            'User',
                            'Account',
                            'Type',
                            'Amount',
                            'Status',
                            'Flagged',
                            'Date',
                            'Actions',
                          ].map(h => (
                            <th key={h} style={{
                              textAlign: 'left',
                              padding: '12px 16px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              backgroundColor: '#f9fafb',
                              borderBottom: '1px solid #e5e7eb',
                              whiteSpace: 'nowrap',
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => {
                          const isFlagged = tx.is_flagged || tx.flagged;
                          const txType = tx.type || '';
                          const isIncoming = ['credit', 'deposit', 'incoming', 'transfer_in'].includes(txType.toLowerCase());
                          const amountColor = isIncoming ? '#059669' : '#dc2626';
                          const amountPrefix = isIncoming ? '+' : '-';

                          return (
                            <tr
                              key={tx.id || idx}
                              style={{
                                backgroundColor: isFlagged ? '#fef2f250' : (idx % 2 === 0 ? '#ffffff' : '#f9fafb'),
                                transition: 'background-color 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isFlagged ? '#fef2f250' : (idx % 2 === 0 ? '#ffffff' : '#f9fafb');
                              }}
                            >
                              {/* Reference */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#6b7280',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                borderBottom: '1px solid #f3f4f6',
                                whiteSpace: 'nowrap',
                              }}>
                                {tx.reference || tx.id}
                              </td>

                              {/* User */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#111827',
                                fontWeight: 500,
                                borderBottom: '1px solid #f3f4f6',
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {tx.user_email || tx.user || '\u2014'}
                              </td>

                              {/* Account */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#6b7280',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                {tx.account_number
                                  ? maskAccountNumber(tx.account_number)
                                  : (tx.account || '\u2014')}
                              </td>

                              {/* Type */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                  textTransform: 'capitalize',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {txType.replace(/_/g, ' ')}
                                </span>
                              </td>

                              {/* Amount */}
                              <td style={{
                                padding: '12px 16px',
                                fontWeight: 600,
                                color: amountColor,
                                borderBottom: '1px solid #f3f4f6',
                                whiteSpace: 'nowrap',
                              }}>
                                {amountPrefix}{formatCurrency(tx.amount, tx.currency)}
                              </td>

                              {/* Status */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <StatusBadge status={tx.status} />
                              </td>

                              {/* Flagged */}
                              <td style={{
                                padding: '12px 16px',
                                textAlign: 'center',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '16px',
                              }}>
                                {isFlagged ? (
                                  <span title={`Flagged: ${tx.flag_reason || 'No reason'}`}>{'\u26A0\uFE0F'}</span>
                                ) : (
                                  <span style={{ color: '#d1d5db' }}>\u2014</span>
                                )}
                              </td>

                              {/* Date */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#6b7280',
                                fontSize: '12px',
                                borderBottom: '1px solid #f3f4f6',
                                whiteSpace: 'nowrap',
                              }}>
                                {formatDate(tx.created_at || tx.date)}
                              </td>

                              {/* Actions */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => handleViewDetails(tx)}
                                    style={actionBtnStyle('#1a56db', '#eff6ff', '#bfdbfe', '#dbeafe')}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                                  >
                                    Details
                                  </button>
                                  {isFlagged ? (
                                    <button
                                      onClick={() => handleUnflagTransaction(tx.id)}
                                      style={actionBtnStyle('#059669', '#ecfdf5', '#a7f3d0', '#d1fae5')}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d1fae5'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
                                    >
                                      Unflag
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenFlagModal(tx)}
                                      style={actionBtnStyle('#dc2626', '#fef2f2', '#fecaca', '#fee2e2')}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                                    >
                                      Flag
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* View Details Modal */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Transaction Details"
          size="lg"
        >
          {detailTx && (
            <div style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '20px',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: 'monospace',
                  }}>
                    {detailTx.reference || detailTx.id}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#6b7280',
                  }}>
                    {formatDate(detailTx.created_at || detailTx.date)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge status={detailTx.status} />
                  {(detailTx.is_flagged || detailTx.flagged) && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 10px',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: 500,
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                    }}>
                      {'\u26A0\uFE0F'} Flagged
                    </span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                marginBottom: '20px',
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Amount
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#111827',
                }}>
                  {formatCurrency(detailTx.amount, detailTx.currency)}
                </p>
              </div>

              {/* Details grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}>
                <DetailField label="Type" value={detailTx.type?.replace(/_/g, ' ') || '\u2014'} />
                <DetailField label="Status" value={
                  <StatusBadge status={detailTx.status} />
                } />
                <DetailField label="User (Email)" value={detailTx.user_email || detailTx.user || 'N/A'} />
                <DetailField label="Account" value={
                  detailTx.account_number
                    ? maskAccountNumber(detailTx.account_number)
                    : (detailTx.account || 'N/A')
                } />

                {/* Transfer details */}
                {(detailTx.type?.toLowerCase().includes('transfer') || detailTx.recipient_email || detailTx.sender_email) && (
                  <>
                    <DetailField
                      label="Sender"
                      value={detailTx.sender_email || detailTx.source_account || 'N/A'}
                    />
                    <DetailField
                      label="Recipient"
                      value={detailTx.recipient_email || detailTx.destination_account || 'N/A'}
                    />
                  </>
                )}

                <DetailField
                  label="Balance Before"
                  value={detailTx.balance_before != null ? formatCurrency(detailTx.balance_before) : 'N/A'}
                />
                <DetailField
                  label="Balance After"
                  value={detailTx.balance_after != null ? formatCurrency(detailTx.balance_after) : 'N/A'}
                />
                <DetailField label="Description" value={detailTx.description || 'No description'} />
                <DetailField
                  label="Created At"
                  value={formatDate(detailTx.created_at || detailTx.date)}
                />
              </div>

              {/* Flag status section */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: (detailTx.is_flagged || detailTx.flagged) ? '#fef2f2' : '#f9fafb',
                border: `1px solid ${(detailTx.is_flagged || detailTx.flagged) ? '#fecaca' : '#e5e7eb'}`,
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Flag Status
                </h4>
                {(detailTx.is_flagged || detailTx.flagged) ? (
                  <div>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: '13px',
                      color: '#dc2626',
                      fontWeight: 500,
                    }}>
                      {'\u26A0\uFE0F'} This transaction is flagged
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#374151',
                    }}>
                      <strong>Reason:</strong> {detailTx.flag_reason || 'No reason provided'}
                    </p>
                  </div>
                ) : (
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#6b7280',
                  }}>
                    This transaction is not flagged.
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}>
                {/* Reverse button - only for completed transactions */}
                {detailTx.status?.toLowerCase() === 'completed' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleOpenReverseModal(detailTx)}
                  >
                    {'\u21A9'} Reverse Transaction
                  </Button>
                )}
                {(detailTx.is_flagged || detailTx.flagged) ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUnflagTransaction(detailTx.id)}
                  >
                    Unflag Transaction
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenFlagModal(detailTx);
                    }}
                  >
                    {'\u26A0\uFE0F'} Flag Transaction
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Flag Transaction Modal */}
        <Modal
          isOpen={flagModalOpen}
          onClose={() => { setFlagModalOpen(false); setFlagTarget(null); setFlagReason(''); }}
          title="Flag Transaction"
          size="sm"
        >
          <div style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '20px',
                flexShrink: 0,
              }}>
                {'\u26A0\uFE0F'}
              </div>
              <div>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Flag Transaction
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#6b7280',
                }}>
                  {flagTarget?.reference || flagTarget?.id} &middot; {formatCurrency(flagTarget?.amount, flagTarget?.currency)}
                </p>
              </div>
            </div>

            <InputField
              label="Reason for flagging"
              name="flagReason"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g., Suspicious activity, unusual amount, etc."
              required
            />

            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => { setFlagModalOpen(false); setFlagTarget(null); setFlagReason(''); }}
                disabled={flagLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleFlagTransaction}
                loading={flagLoading}
                disabled={flagLoading || !flagReason.trim()}
              >
                Flag Transaction
              </Button>
            </div>
          </div>
        </Modal>

        {/* Reverse Transaction Modal */}
        <Modal
          isOpen={reverseModalOpen}
          onClose={() => { setReverseModalOpen(false); setReverseTarget(null); setReverseReason(''); }}
          title="Reverse Transaction"
          size="sm"
        >
          <div style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontSize: '20px',
                flexShrink: 0,
              }}>
                {'\u21A9'}
              </div>
              <div>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  Reverse Transaction
                </p>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '13px',
                  color: '#6b7280',
                }}>
                  {reverseTarget?.reference || reverseTarget?.id} &middot; {formatCurrency(reverseTarget?.amount, reverseTarget?.currency)}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#dc2626',
                  fontWeight: 500,
                }}>
                  This will create a reversal for this completed transaction. This action cannot be undone.
                </p>
              </div>
            </div>

            <InputField
              label="Reason for reversal"
              name="reverseReason"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="e.g., Duplicate transaction, unauthorized, etc."
              required
            />

            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => { setReverseModalOpen(false); setReverseTarget(null); setReverseReason(''); }}
                disabled={reverseLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleReverseTransaction}
                loading={reverseLoading}
                disabled={reverseLoading || !reverseReason.trim()}
              >
                Confirm Reverse
              </Button>
            </div>
          </div>
        </Modal>
      </AdminLayout>
    </>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function DetailField({ label, value }) {
  return (
    <div>
      <p style={{
        margin: '0 0 4px 0',
        fontSize: '12px',
        fontWeight: 500,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}>
        {label}
      </p>
      <p style={{
        margin: 0,
        fontSize: '14px',
        color: '#111827',
        textTransform: value && typeof value === 'string' && value !== value.toUpperCase() && value !== 'N/A' ? 'capitalize' : 'none',
      }}>
        {value || 'N/A'}
      </p>
    </div>
  );
}

// ─── Shared styles ──────────────────────────────────────────────────────────

const selectStyle = {
  padding: '10px 14px',
  fontSize: '14px',
  color: '#111827',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  outline: 'none',
  fontFamily: 'Inter, -apple-system, sans-serif',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  minWidth: '140px',
};

const dateInputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#111827',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  outline: 'none',
  fontFamily: 'Inter, -apple-system, sans-serif',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

function actionBtnStyle(color, bg, border, hoverBg) {
  return {
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 500,
    color: color,
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
    whiteSpace: 'nowrap',
  };
}