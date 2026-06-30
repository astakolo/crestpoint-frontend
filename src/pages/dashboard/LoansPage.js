import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import loanService from '../../services/loanService';
import accountService from '../../services/accountService';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/constants';

const TABS = ['My Loans', 'Apply for Loan', 'Loan Types'];

const LOAN_STATUS_CONFIG = {
  active: { label: 'Active', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  paid_off: { label: 'Paid Off', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  approved: { label: 'Approved', bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
  under_review: { label: 'Under Review', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  defaulted: { label: 'Defaulted', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  rejected: { label: 'Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  closed: { label: 'Closed', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
};

function StatusBadge({ status }) {
  const config = LOAN_STATUS_CONFIG[status?.toLowerCase()] || LOAN_STATUS_CONFIG.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
          marginRight: '6px',
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={detailRowStyles.row}>
      <span style={detailRowStyles.label}>{label}</span>
      <span style={detailRowStyles.value}>{value || 'N/A'}</span>
    </div>
  );
}

const detailRowStyles = {
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

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState(0);

  // My Loans state
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [loansError, setLoansError] = useState('');

  // Loan detail modal
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanDetail, setLoanDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Repayment state
  const [repayAccountId, setRepayAccountId] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [repaying, setRepaying] = useState(false);
  const [showRepayForm, setShowRepayForm] = useState(false);

  // Apply for Loan state
  const [loanTypes, setLoanTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyForm, setApplyForm] = useState({
    loan_type: '',
    amount: '',
    purpose: '',
    term_months: '',
    employment_status: '',
    monthly_income: '',
  });
  const [applyErrors, setApplyErrors] = useState({});

  // Loan Types tab state
  const [typesLoading, setTypesLoading] = useState(false);

  // Fetch user accounts (used in repay and apply)
  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountService.getAccounts();
      const accs = Array.isArray(data) ? data : data?.results || data?.data || [];
      setAccounts(accs.filter((a) => (a.status || '').toLowerCase() === 'active'));
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch loan types (used in apply and types tabs)
  const fetchLoanTypes = useCallback(async () => {
    setTypesLoading(true);
    try {
      const data = await loanService.getLoanTypes();
      const types = Array.isArray(data) ? data : data?.results || data?.data || [];
      setLoanTypes(types);
    } catch (err) {
      // Will handle in individual tabs
    } finally {
      setTypesLoading(false);
    }
  }, []);

  // Fetch user loans
  const fetchLoans = useCallback(async () => {
    setLoansLoading(true);
    setLoansError('');
    try {
      const data = await loanService.getLoans();
      const list = Array.isArray(data) ? data : data?.results || data?.data || [];
      setLoans(list);
    } catch (err) {
      setLoansError(err?.response?.data?.detail || err?.message || 'Failed to load loans');
    } finally {
      setLoansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (loanTypes.length === 0) fetchLoanTypes();
  }, [fetchLoanTypes, loanTypes.length]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Tab switching handler — pre-select type from Loan Types tab
  const handleTabChange = (index) => {
    setActiveTab(index);
    if (index === 0) fetchLoans();
  };

  const handleApplyFromType = (typeId) => {
    setApplyForm((prev) => ({ ...prev, loan_type: String(typeId) }));
    setActiveTab(1);
  };

  // --- Apply form handlers ---
  const handleApplyFieldChange = (field, value) => {
    setApplyForm((prev) => ({ ...prev, [field]: value }));
    setApplyErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateApplyForm = () => {
    const errors = {};
    if (!applyForm.loan_type) errors.loan_type = 'Please select a loan type';
    if (!applyForm.amount || parseFloat(applyForm.amount) <= 0) errors.amount = 'Enter a valid amount';
    if (!applyForm.purpose.trim()) errors.purpose = 'Please describe the loan purpose';
    if (!applyForm.term_months || parseInt(applyForm.term_months) <= 0) errors.term_months = 'Enter a valid term';
    if (!applyForm.employment_status) errors.employment_status = 'Select employment status';
    if (!applyForm.monthly_income || parseFloat(applyForm.monthly_income) <= 0) errors.monthly_income = 'Enter your monthly income';
    return errors;
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const errors = validateApplyForm();
    if (Object.keys(errors).length > 0) {
      setApplyErrors(errors);
      return;
    }
    setApplyLoading(true);
    try {
      await loanService.applyForLoan({
        loan_type: applyForm.loan_type,
        amount: parseFloat(applyForm.amount),
        purpose: applyForm.purpose.trim(),
        term_months: parseInt(applyForm.term_months),
        employment_status: applyForm.employment_status,
        monthly_income: parseFloat(applyForm.monthly_income),
      });
      toast.success('Loan application submitted successfully!');
      setApplyForm({
        loan_type: '',
        amount: '',
        purpose: '',
        term_months: '',
        employment_status: '',
        monthly_income: '',
      });
      setApplyErrors({});
      // Switch to My Loans tab
      setActiveTab(0);
      fetchLoans();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : '') ||
        err?.message ||
        'Failed to submit loan application';
      toast.error(msg);
    } finally {
      setApplyLoading(false);
    }
  };

  // --- Loan detail modal handlers ---
  const handleViewLoan = useCallback(async (loan) => {
    setSelectedLoan(loan);
    setLoanDetail(null);
    setShowRepayForm(false);
    setRepayAccountId('');
    setRepayAmount('');
    setDetailLoading(true);
    try {
      const data = await loanService.getLoan(loan.id);
      setLoanDetail(data);
    } catch {
      setLoanDetail(loan);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetailModal = () => {
    setSelectedLoan(null);
    setLoanDetail(null);
    setShowRepayForm(false);
    setRepayAccountId('');
    setRepayAmount('');
  };

  // --- Repayment handler ---
  const handleRepay = async (e) => {
    e.preventDefault();
    if (!repayAccountId) {
      toast.error('Please select an account');
      return;
    }
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast.error('Please enter a valid repayment amount');
      return;
    }
    setRepaying(true);
    try {
      await loanService.repayLoan(selectedLoan.id, {
        account_id: repayAccountId,
        amount: parseFloat(repayAmount),
      });
      toast.success('Repayment submitted successfully!');
      setShowRepayForm(false);
      setRepayAccountId('');
      setRepayAmount('');
      // Refresh loan detail and list
      try {
        const data = await loanService.getLoan(selectedLoan.id);
        setLoanDetail(data);
      } catch {
        // keep existing detail
      }
      fetchLoans();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Repayment failed';
      toast.error(msg);
    } finally {
      setRepaying(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <style>{`@keyframes loans-spinner-spin { to { transform: rotate(360deg); } }`}</style>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Page Header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>Loans</h1>
          </div>

          {/* Tab Bar */}
          <div style={styles.tabBar}>
            {TABS.map((tab, index) => (
              <button
                key={tab}
                onClick={() => handleTabChange(index)}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === index ? styles.tabButtonActive : styles.tabButtonInactive),
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {/* ==================== TAB 0: My Loans ==================== */}
            {activeTab === 0 && (
              <MyLoansTab
                loans={loans}
                loading={loansLoading}
                error={loansError}
                onRetry={fetchLoans}
                onViewLoan={handleViewLoan}
              />
            )}

            {/* ==================== TAB 1: Apply for Loan ==================== */}
            {activeTab === 1 && (
              <ApplyLoanTab
                loanTypes={loanTypes}
                accounts={accounts}
                form={applyForm}
                errors={applyErrors}
                loading={applyLoading}
                onFieldChange={handleApplyFieldChange}
                onSubmit={handleApplySubmit}
                preselectedType={applyForm.loan_type}
              />
            )}

            {/* ==================== TAB 2: Loan Types ==================== */}
            {activeTab === 2 && (
              <LoanTypesTab
                loanTypes={loanTypes}
                loading={typesLoading}
                onApply={handleApplyFromType}
              />
            )}
          </div>

          {/* ==================== Loan Detail Modal ==================== */}
          {selectedLoan && (
            <div style={styles.modalOverlay} onClick={closeDetailModal}>
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>Loan Details</h2>
                  <button onClick={closeDetailModal} style={styles.modalClose}>
                    &times;
                  </button>
                </div>

                {detailLoading ? (
                  <div style={styles.modalLoading}>
                    <div style={styles.spinner} />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Loading details...</span>
                  </div>
                ) : loanDetail ? (
                  <>
                    {/* Status */}
                    <div style={styles.modalStatusRow}>
                      <StatusBadge status={loanDetail.status} />
                    </div>

                    {/* Loan Info */}
                    <div style={styles.modalGrid}>
                      <DetailRow
                        label="Loan Type"
                        value={
                          loanDetail.loan_type_name ||
                          loanDetail.loan_type_display ||
                          (loanDetail.loan_type ? loanDetail.loan_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'N/A')
                        }
                      />
                      <DetailRow label="Principal" value={formatCurrency(loanDetail.principal || loanDetail.amount)} />
                      <DetailRow label="Outstanding Balance" value={formatCurrency(loanDetail.outstanding_balance)} />
                      <DetailRow label="Interest Rate" value={loanDetail.interest_rate != null ? `${loanDetail.interest_rate}%` : 'N/A'} />
                      <DetailRow label="Monthly Payment" value={formatCurrency(loanDetail.monthly_payment)} />
                      <DetailRow label="Term" value={loanDetail.term_months ? `${loanDetail.term_months} months` : 'N/A'} />
                      <DetailRow label="Next Payment Date" value={formatDate(loanDetail.next_payment_date)} />
                      <DetailRow label="Start Date" value={formatDate(loanDetail.start_date || loanDetail.created_at)} />
                      <DetailRow label="Maturity Date" value={formatDate(loanDetail.maturity_date || loanDetail.end_date)} />
                      <DetailRow label="Total Repaid" value={formatCurrency(loanDetail.total_repaid || loanDetail.amount_paid)} />
                      {loanDetail.purpose && <DetailRow label="Purpose" value={loanDetail.purpose} />}
                    </div>

                    {/* Repayment History */}
                    {loanDetail.repayments && loanDetail.repayments.length > 0 && (
                      <div style={styles.repaymentsSection}>
                        <h3 style={styles.repaymentsTitle}>Repayment History</h3>
                        <div style={styles.repaymentsTableWrap}>
                          <table style={styles.repaymentsTable}>
                            <thead>
                              <tr>
                                <th style={styles.repayTh}>Date</th>
                                <th style={styles.repayTh}>Amount</th>
                                <th style={styles.repayTh}>Status</th>
                                <th style={{ ...styles.repayTh, textAlign: 'right' }}>Reference</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loanDetail.repayments.map((rep, idx) => (
                                <tr key={rep.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                  <td style={styles.repayTd}>{formatDate(rep.date || rep.created_at)}</td>
                                  <td style={{ ...styles.repayTd, fontWeight: 600 }}>{formatCurrency(rep.amount)}</td>
                                  <td style={styles.repayTd}>
                                    <StatusBadge status={rep.status || 'completed'} />
                                  </td>
                                  <td style={{ ...styles.repayTd, textAlign: 'right', color: '#6b7280' }}>
                                    {rep.reference || rep.id || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Repay Button / Form */}
                    {loanDetail.status?.toLowerCase() === 'active' && (
                      <div style={styles.repaySection}>
                        {!showRepayForm ? (
                          <button
                            onClick={() => setShowRepayForm(true)}
                            style={styles.primaryButton}
                          >
                            Make a Repayment
                          </button>
                        ) : (
                          <form onSubmit={handleRepay} style={styles.repayForm}>
                            <h4 style={styles.repayFormTitle}>Repayment Details</h4>

                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>From Account</label>
                              <select
                                value={repayAccountId}
                                onChange={(e) => setRepayAccountId(e.target.value)}
                                style={styles.selectInput}
                              >
                                <option value="">Select account</option>
                                {accounts.map((acc) => (
                                  <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                                    {(acc.account_type || 'Account').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — {acc.account_number} ({formatCurrency(acc.balance)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={styles.formGroup}>
                              <label style={styles.formLabel}>
                                Amount
                                {loanDetail.monthly_payment && (
                                  <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '8px' }}>
                                    (Monthly: {formatCurrency(loanDetail.monthly_payment)})
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                placeholder="0.00"
                                style={styles.textInput}
                              />
                            </div>

                            <div style={styles.repayFormActions}>
                              <button
                                type="submit"
                                disabled={repaying}
                                style={{
                                  ...styles.primaryButton,
                                  opacity: repaying ? 0.7 : 1,
                                  cursor: repaying ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {repaying ? 'Processing...' : 'Submit Repayment'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowRepayForm(false);
                                  setRepayAccountId('');
                                  setRepayAmount('');
                                }}
                                style={styles.secondaryButton}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>
                    Unable to load loan details.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ====================================================================
// TAB COMPONENTS
// ====================================================================

function MyLoansTab({ loans, loading, error, onRetry, onViewLoan }) {
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '12px' }}>Loading loans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorBox}>
        <p style={styles.errorText}>{error}</p>
        <button onClick={onRetry} style={styles.secondaryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <p style={styles.emptyTitle}>No Loans Found</p>
        <p style={styles.emptyText}>
          You don&apos;t have any active loans. Browse loan types or apply for a new loan.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.loansGrid}>
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} onClick={() => onViewLoan(loan)} />
      ))}
    </div>
  );
}

function LoanCard({ loan, onClick }) {
  const status = loan.status?.toLowerCase() || 'pending';
  const typeName =
    loan.loan_type_name ||
    loan.loan_type_display ||
    (loan.loan_type ? loan.loan_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Loan');

  return (
    <div
      onClick={onClick}
      style={styles.loanCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#93c5fd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      <div style={styles.loanCardHeader}>
        <h3 style={styles.loanCardType}>{typeName}</h3>
        <StatusBadge status={status} />
      </div>

      <div style={styles.loanCardBody}>
        <div style={styles.loanCardRow}>
          <span style={styles.loanCardLabel}>Principal</span>
          <span style={styles.loanCardValue}>{formatCurrency(loan.principal || loan.amount)}</span>
        </div>
        <div style={styles.loanCardRow}>
          <span style={styles.loanCardLabel}>Outstanding Balance</span>
          <span style={{ ...styles.loanCardValue, fontWeight: 700, color: '#1a56db' }}>
            {formatCurrency(loan.outstanding_balance)}
          </span>
        </div>
        <div style={styles.loanCardRow}>
          <span style={styles.loanCardLabel}>Interest Rate</span>
          <span style={styles.loanCardValue}>{loan.interest_rate != null ? `${loan.interest_rate}%` : 'N/A'}</span>
        </div>
        <div style={styles.loanCardRow}>
          <span style={styles.loanCardLabel}>Monthly Payment</span>
          <span style={styles.loanCardValue}>{formatCurrency(loan.monthly_payment)}</span>
        </div>
        <div style={styles.loanCardRow}>
          <span style={styles.loanCardLabel}>Next Payment</span>
          <span style={styles.loanCardValue}>{formatDate(loan.next_payment_date)}</span>
        </div>
      </div>

      <div style={styles.loanCardFooter}>
        <span style={styles.loanCardViewText}>View Details</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}

function ApplyLoanTab({ loanTypes, accounts, form, errors, loading, onFieldChange, onSubmit, preselectedType }) {
  const inputStyle = {
    ...styles.textInput,
    borderColor: errors.amount || errors.term_months || errors.monthly_income ? '#dc2626' : '#e5e7eb',
  };

  return (
    <div style={styles.applyCard}>
      <div style={styles.applyCardHeader}>
        <h2 style={styles.applyTitle}>Apply for a Loan</h2>
        <p style={styles.applyDescription}>
          Fill out the form below to submit your loan application. Our team will review it and get back to you promptly.
        </p>
      </div>

      <form onSubmit={onSubmit} style={styles.applyForm}>
        {/* Loan Type */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Loan Type <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={form.loan_type}
            onChange={(e) => onFieldChange('loan_type', e.target.value)}
            style={{
              ...styles.selectInput,
              borderColor: errors.loan_type ? '#dc2626' : '#e5e7eb',
            }}
          >
            <option value="">Select loan type</option>
            {loanTypes.map((lt) => (
              <option key={lt.id || lt.name} value={lt.id || lt.name}>
                {lt.name || lt.display_name} {lt.interest_rate != null ? `(${lt.interest_rate}% APR)` : ''}
              </option>
            ))}
          </select>
          {errors.loan_type && <span style={styles.errorSpan}>{errors.loan_type}</span>}
        </div>

        {/* Amount */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Loan Amount ($) <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.amount}
            onChange={(e) => onFieldChange('amount', e.target.value)}
            placeholder="Enter amount"
            style={{
              ...inputStyle,
              borderColor: errors.amount ? '#dc2626' : '#e5e7eb',
            }}
          />
          {errors.amount && <span style={styles.errorSpan}>{errors.amount}</span>}
        </div>

        {/* Purpose */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Purpose <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea
            value={form.purpose}
            onChange={(e) => onFieldChange('purpose', e.target.value)}
            placeholder="Describe the purpose of this loan"
            rows={3}
            style={{
              ...styles.textarea,
              borderColor: errors.purpose ? '#dc2626' : '#e5e7eb',
            }}
          />
          {errors.purpose && <span style={styles.errorSpan}>{errors.purpose}</span>}
        </div>

        {/* Term */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Term (Months) <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="number"
            min="1"
            max="360"
            value={form.term_months}
            onChange={(e) => onFieldChange('term_months', e.target.value)}
            placeholder="e.g. 12"
            style={{
              ...inputStyle,
              borderColor: errors.term_months ? '#dc2626' : '#e5e7eb',
            }}
          />
          {errors.term_months && <span style={styles.errorSpan}>{errors.term_months}</span>}
        </div>

        {/* Employment Status */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Employment Status <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={form.employment_status}
            onChange={(e) => onFieldChange('employment_status', e.target.value)}
            style={{
              ...styles.selectInput,
              borderColor: errors.employment_status ? '#dc2626' : '#e5e7eb',
            }}
          >
            <option value="">Select status</option>
            <option value="employed">Employed</option>
            <option value="self_employed">Self-Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="retired">Retired</option>
          </select>
          {errors.employment_status && <span style={styles.errorSpan}>{errors.employment_status}</span>}
        </div>

        {/* Monthly Income */}
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Monthly Income ($) <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={form.monthly_income}
            onChange={(e) => onFieldChange('monthly_income', e.target.value)}
            placeholder="Enter monthly income"
            style={{
              ...inputStyle,
              borderColor: errors.monthly_income ? '#dc2626' : '#e5e7eb',
            }}
          />
          {errors.monthly_income && <span style={styles.errorSpan}>{errors.monthly_income}</span>}
        </div>

        {/* Submit */}
        <div style={styles.applyActions}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
            }}
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}

function LoanTypesTab({ loanTypes, loading, onApply }) {
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: '12px' }}>Loading loan types...</span>
      </div>
    );
  }

  if (loanTypes.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <p style={styles.emptyTitle}>No Loan Types Available</p>
        <p style={styles.emptyText}>
          There are currently no loan types available. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.typesGrid}>
      {loanTypes.map((lt) => {
        const typeId = lt.id || lt.name;
        return (
          <div key={typeId} style={styles.typeCard}>
            <div style={styles.typeCardHeader}>
              <h3 style={styles.typeName}>{lt.name || lt.display_name || 'Loan'}</h3>
              <span style={styles.typeRate}>{lt.interest_rate != null ? `${lt.interest_rate}% APR` : ''}</span>
            </div>

            {lt.description && (
              <p style={styles.typeDescription}>{lt.description}</p>
            )}

            <div style={styles.typeDetailsGrid}>
              <div style={styles.typeDetailItem}>
                <span style={styles.typeDetailLabel}>Min Amount</span>
                <span style={styles.typeDetailValue}>{formatCurrency(lt.min_amount)}</span>
              </div>
              <div style={styles.typeDetailItem}>
                <span style={styles.typeDetailLabel}>Max Amount</span>
                <span style={styles.typeDetailValue}>{formatCurrency(lt.max_amount)}</span>
              </div>
              <div style={styles.typeDetailItem}>
                <span style={styles.typeDetailLabel}>Max Term</span>
                <span style={styles.typeDetailValue}>{lt.max_term_months ? `${lt.max_term_months} months` : 'N/A'}</span>
              </div>
            </div>

            <button
              onClick={() => onApply(typeId)}
              style={styles.typeApplyButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1648b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a56db';
              }}
            >
              Apply Now
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ====================================================================
// STYLES
// ====================================================================

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
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },

  // Tab bar
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0',
  },
  tabButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'Inter, -apple-system, sans-serif',
    marginBottom: '-1px',
  },
  tabButtonActive: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    borderBottom: '2px solid #1a56db',
  },
  tabButtonInactive: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    borderBottom: '2px solid transparent',
  },
  tabContent: {
    minHeight: '400px',
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#1a56db',
    borderRadius: '50%',
    animation: 'loans-spinner-spin 0.6s linear infinite',
  },

  // Error
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '48px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    textAlign: 'center',
  },
  errorText: {
    fontSize: '14px',
    color: '#dc2626',
    margin: 0,
  },

  // Empty state
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
    margin: 0,
    maxWidth: '360px',
    lineHeight: '20px',
  },

  // Loans grid
  loansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '20px',
  },
  loanCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
  },
  loanCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  loanCardType: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    textTransform: 'capitalize',
  },
  loanCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  loanCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanCardLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  loanCardValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  loanCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  loanCardViewText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a56db',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  modalClose: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  modalLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '48px 24px',
  },
  modalStatusRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 24px 0 24px',
  },
  modalGrid: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '4px 20px',
    margin: '16px 24px',
  },

  // Repayments section
  repaymentsSection: {
    padding: '0 24px',
    marginBottom: '16px',
  },
  repaymentsTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 12px 0',
  },
  repaymentsTableWrap: {
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  repaymentsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  repayTh: {
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  repayTd: {
    padding: '10px 14px',
    fontSize: '13px',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
    whiteSpace: 'nowrap',
  },

  // Repay section
  repaySection: {
    padding: '0 24px 24px 24px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '20px',
  },
  repayForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  repayFormTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  repayFormActions: {
    display: 'flex',
    gap: '8px',
    paddingTop: '4px',
  },

  // Apply form
  applyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '28px',
    maxWidth: '640px',
  },
  applyCardHeader: {
    marginBottom: '24px',
  },
  applyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  applyDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '20px',
  },
  applyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  applyActions: {
    paddingTop: '4px',
  },

  // Form elements
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  textInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  selectInput: {
    width: '100%',
    padding: '10px 14px',
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
    appearance: 'auto',
    boxSizing: 'border-box',
  },
  errorSpan: {
    fontSize: '12px',
    color: '#dc2626',
    fontWeight: 500,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#374151',
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loan Types grid
  typesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  typeCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'box-shadow 0.15s ease',
  },
  typeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  typeName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  typeRate: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    padding: '4px 10px',
    borderRadius: '100px',
    whiteSpace: 'nowrap',
  },
  typeDescription: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '20px',
    margin: '0 0 16px 0',
  },
  typeDetailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  typeDetailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeDetailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  typeDetailValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  },
  typeApplyButton: {
    marginTop: 'auto',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
};