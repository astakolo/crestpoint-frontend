import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import checkService from '../../services/checkService';
import accountService from '../../services/accountService';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/constants';

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626' },
  processing: { label: 'Processing', bg: '#eff6ff', color: '#1a56db' },
  rejected: { label: 'Rejected', bg: '#fef2f2', color: '#dc2626' },
};

export default function CheckDepositPage() {
  // Accounts
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState('');

  // Form state
  const [selectedAccount, setSelectedAccount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Deposits history
  const [deposits, setDeposits] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [depositsError, setDepositsError] = useState('');

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    setAccountsError('');
    try {
      const data = await accountService.getAccounts();
      const accs = Array.isArray(data) ? data : data?.results || data?.data || [];
      setAccounts(accs.filter((a) => a.is_active && !a.is_frozen));
    } catch (err) {
      setAccountsError(err?.response?.data?.detail || err?.message || 'Failed to load accounts');
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Fetch deposits
  const fetchDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    setDepositsError('');
    try {
      const data = await checkService.getDeposits();
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setDeposits(items);
    } catch (err) {
      setDepositsError(err?.response?.data?.detail || err?.message || 'Failed to load deposit history');
    } finally {
      setLoadingDeposits(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchDeposits();
  }, [fetchAccounts, fetchDeposits]);

  // Handle file selection with preview
  const handleFrontImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setFrontPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBackImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setBackPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Submit deposit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!frontImage) {
      toast.error('Front image of the check is required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('account', selectedAccount);
      if (checkNumber) formData.append('check_number', checkNumber);
      formData.append('amount', amount);
      formData.append('front_image', frontImage);
      if (backImage) formData.append('back_image', backImage);

      await checkService.depositCheck(formData);
      toast.success('Check deposit submitted successfully');
      // Reset form
      setSelectedAccount(accounts.length > 0 ? accounts[0].id || accounts[0].account_number : '');
      setCheckNumber('');
      setAmount('');
      setFrontImage(null);
      setBackImage(null);
      setFrontPreview(null);
      setBackPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';
      // Refresh deposits
      fetchDeposits();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Deposit failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    const cfg = STATUS_CONFIG[s] || { label: status || 'Unknown', bg: '#f9fafb', color: '#6b7280' };
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '100px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: cfg.bg,
        color: cfg.color,
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: cfg.color,
        }} />
        {cfg.label}
      </span>
    );
  };

  const renderImagePreview = (src, label, onRemove) => (
    <div style={s.previewContainer}>
      <img src={src} alt={label} style={s.previewImage} />
      <button
        type="button"
        onClick={onRemove}
        style={s.previewRemove}
        title="Remove"
      >
        &times;
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.container}>
          {/* Page Header */}
          <h1 className="cp-page-title" style={s.pageTitle}>Check Deposit</h1>
          <p style={s.pageDescription}>
            Deposit checks into your account by uploading images of the front and back.
          </p>

          {/* Section 1: Deposit Form */}
          <div className="cp-card check-deposit-form-card" style={s.card}>
            <h2 style={s.sectionTitle}>Deposit a Check</h2>

            {loadingAccounts ? (
              <LoadingSpinner size="sm" text="Loading accounts..." />
            ) : accountsError ? (
              <Alert type="error" message={accountsError} onClose={() => setAccountsError('')} />
            ) : accounts.length === 0 ? (
              <div style={s.emptyState}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  No active accounts available. Please activate an account to deposit checks.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={s.formGrid}>
                  {/* Account Selector */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Account *</label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      style={s.select}
                    >
                      <option value="">Select account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                          {acc.account_type || 'Account'} — ****{acc.account_number?.slice(-4)} ({formatCurrency(acc.balance || 0, acc.currency)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Check Number */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Check Number <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    <input
                      type="text"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      placeholder="e.g. 1024"
                      style={s.input}
                    />
                  </div>

                  {/* Amount */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Amount *</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                      style={s.input}
                    />
                  </div>
                </div>

                {/* Image Uploads */}
                <div style={s.formGrid}>
                  {/* Front Image */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Front Image *</label>
                    {frontPreview ? (
                      renderImagePreview(frontPreview, 'Front of check', () => {
                        setFrontImage(null);
                        setFrontPreview(null);
                        if (frontInputRef.current) frontInputRef.current.value = '';
                      })
                    ) : (
                      <label style={s.fileUploadBox}>
                        <input
                          ref={frontInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFrontImage}
                          required
                          style={{ display: 'none' }}
                        />
                        <div style={{ textAlign: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Click to upload front of check</p>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>PNG, JPG, WEBP</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Back Image */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Back Image <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    {backPreview ? (
                      renderImagePreview(backPreview, 'Back of check', () => {
                        setBackImage(null);
                        setBackPreview(null);
                        if (backInputRef.current) backInputRef.current.value = '';
                      })
                    ) : (
                      <label style={s.fileUploadBox}>
                        <input
                          ref={backInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleBackImage}
                          style={{ display: 'none' }}
                        />
                        <div style={{ textAlign: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Click to upload back of check</p>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>PNG, JPG, WEBP</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '24px' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...s.primaryBtn,
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                    }}
                  >
                    {submitting ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'lc-spin 0.8s linear infinite',
                        }} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Deposit Check
                      </>
                    )}
                  </button>
                  <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </form>
            )}
          </div>

          {/* Section 2: Deposit History */}
          <div className="cp-card" style={{ ...s.card, marginTop: '24px' }}>
            <h2 style={s.sectionTitle}>Deposit History</h2>

            {loadingDeposits ? (
              <LoadingSpinner size="sm" text="Loading deposits..." />
            ) : depositsError ? (
              <Alert type="error" message={depositsError} onClose={() => setDepositsError('')} />
            ) : deposits.length === 0 ? (
              <div style={s.emptyState}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="7" y1="15" x2="13" y2="15" />
                </svg>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  No check deposits yet. Submit your first deposit above.
                </p>
              </div>
            ) : (
              <div className="cp-table-wrapper" style={s.tableWrapper}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Reference</th>
                      <th style={s.th}>Check #</th>
                      <th style={s.th}>Amount</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((dep, idx) => (
                      <tr key={dep.id || idx} style={s.tr}>
                        <td style={s.td}>{formatDate(dep.created_at || dep.date)}</td>
                        <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px' }}>
                          {dep.reference || dep.id || '—'}
                        </td>
                        <td style={s.td}>{dep.check_number || '—'}</td>
                        <td style={{ ...s.td, fontWeight: 600, color: '#111827' }}>
                          {formatCurrency(dep.amount, dep.currency)}
                        </td>
                        <td style={s.td}>{getStatusBadge(dep.status)}</td>
                        <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px' }}>
                          {dep.account_number
                            ? `****${dep.account_number.slice(-4)}`
                            : dep.account_label || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 20px 0',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#111827',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#111827',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  primaryBtn: {
    backgroundColor: '#1a56db',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  fileUploadBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '120px',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    padding: '20px',
    backgroundColor: '#f9fafb',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    minHeight: '120px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    display: 'block',
  },
  previewRemove: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '12px 16px',
    color: '#374151',
    whiteSpace: 'nowrap',
  },
};