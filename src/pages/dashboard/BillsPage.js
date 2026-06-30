import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import billService from '../../services/billService';
import accountService from '../../services/accountService';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/constants';

const TABS = ['Pay Bills', 'Payment History'];

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669' },
  successful: { label: 'Successful', bg: '#ecfdf5', color: '#059669' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706' },
  processing: { label: 'Processing', bg: '#eff6ff', color: '#1a56db' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626' },
  reversed: { label: 'Reversed', bg: '#f9fafb', color: '#6b7280' },
};

const BILLER_CATEGORIES = [
  { value: 'electricity', label: 'Electricity', emoji: '⚡' },
  { value: 'water', label: 'Water', emoji: '💧' },
  { value: 'internet', label: 'Internet', emoji: '🌐' },
  { value: 'phone', label: 'Phone', emoji: '📱' },
  { value: 'cable_tv', label: 'Cable TV', emoji: '📺' },
  { value: 'insurance', label: 'Insurance', emoji: '🛡️' },
  { value: 'rent', label: 'Rent', emoji: '🏠' },
  { value: 'other', label: 'Other', emoji: '📄' },
];

export default function BillsPage() {
  const [activeTab, setActiveTab] = useState('Pay Bills');

  // Accounts
  const [accounts, setAccounts] = useState([]);

  // Billers
  const [billers, setBillers] = useState([]);
  const [loadingBillers, setLoadingBillers] = useState(true);

  // Payment history
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState('');

  // Add Biller Modal
  const [showAddBiller, setShowAddBiller] = useState(false);
  const [billerNickname, setBillerNickname] = useState('');
  const [billerCategory, setBillerCategory] = useState('electricity');
  const [billerAccountNumber, setBillerAccountNumber] = useState('');
  const [savingBiller, setSavingBiller] = useState(false);

  // Delete Biller Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Pay Bill Form
  const [payBillerId, setPayBillerId] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNarration, setPayNarration] = useState('');
  const [paying, setPaying] = useState(false);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountService.getAccounts();
        const accs = Array.isArray(data) ? data : data?.results || data?.data || [];
        setAccounts(accs.filter((a) => a.is_active && !a.is_frozen));
      } catch {
        // Non-critical
      }
    };
    fetchAccounts();
  }, []);

  // Fetch billers
  const fetchBillers = useCallback(async () => {
    setLoadingBillers(true);
    try {
      const data = await billService.getBillers();
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setBillers(items);
    } catch {
      setBillers([]);
    } finally {
      setLoadingBillers(false);
    }
  }, []);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    setPaymentsError('');
    try {
      const data = await billService.getPayments();
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setPayments(items);
    } catch (err) {
      setPaymentsError(err?.response?.data?.detail || err?.message || 'Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Pay Bills') fetchBillers();
    if (activeTab === 'Payment History') fetchPayments();
  }, [activeTab, fetchBillers, fetchPayments]);

  // Save Biller
  const handleSaveBiller = async (e) => {
    e.preventDefault();
    if (!billerNickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }
    if (!billerAccountNumber.trim()) {
      toast.error('Please enter the biller account number');
      return;
    }

    setSavingBiller(true);
    try {
      await billService.saveBiller({
        nickname: billerNickname.trim(),
        category: billerCategory,
        account_number: billerAccountNumber.trim(),
      });
      toast.success('Biller saved successfully');
      setShowAddBiller(false);
      setBillerNickname('');
      setBillerCategory('electricity');
      setBillerAccountNumber('');
      fetchBillers();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to save biller';
      toast.error(msg);
    } finally {
      setSavingBiller(false);
    }
  };

  // Delete Biller
  const handleDeleteBiller = async () => {
    if (!deleteTarget) return;
    try {
      await billService.deleteBiller(deleteTarget.id);
      toast.success('Biller removed');
      fetchBillers();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to delete biller';
      toast.error(msg);
    } finally {
      setDeleteTarget(null);
    }
  };

  // Pay Bill
  const handlePayBill = async (e) => {
    e.preventDefault();

    if (!payBillerId) {
      toast.error('Please select a biller');
      return;
    }
    if (!payAccountId) {
      toast.error('Please select an account to pay from');
      return;
    }
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setPaying(true);
    try {
      await billService.payBill({
        biller: payBillerId,
        account: payAccountId,
        amount: parseFloat(payAmount),
        narration: payNarration.trim() || undefined,
      });
      toast.success('Bill payment submitted successfully');
      setPayBillerId('');
      setPayAccountId('');
      setPayAmount('');
      setPayNarration('');
      fetchBillers();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Payment failed. Please try again.';
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    const cfg = STATUS_CONFIG[st] || { label: status || 'Unknown', bg: '#f9fafb', color: '#6b7280' };
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

  const getCategoryEmoji = (cat) => {
    const found = BILLER_CATEGORIES.find((c) => c.value === cat);
    return found ? found.emoji : '📄';
  };

  const getCategoryLabel = (cat) => {
    const found = BILLER_CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : cat || 'Other';
  };

  const selectStyle = {
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
  };

  const inputStyle = {
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
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  };

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.container}>
          {/* Page Header */}
          <h1 style={s.pageTitle}>Bill Payments</h1>
          <p style={s.pageDescription}>
            Pay your bills and manage saved billers.
          </p>

          {/* Tabs */}
          <div style={s.tabBar}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...s.tabBtn,
                  ...(activeTab === tab ? s.tabBtnActive : {}),
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab: Pay Bills */}
          {activeTab === 'Pay Bills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Saved Billers Section */}
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={s.sectionTitle}>Saved Billers</h2>
                  <button onClick={() => setShowAddBiller(true)} style={s.addBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Biller
                  </button>
                </div>

                {loadingBillers ? (
                  <LoadingSpinner size="sm" text="Loading billers..." />
                ) : billers.length === 0 ? (
                  <div style={s.emptyState}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                      No saved billers. Add a biller to get started.
                    </p>
                  </div>
                ) : (
                  <div style={s.billerGrid}>
                    {billers.map((biller) => (
                      <div key={biller.id} style={s.billerCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>{getCategoryEmoji(biller.category)}</span>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                {biller.nickname || biller.name || 'Biller'}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                                {getCategoryLabel(biller.category)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setDeleteTarget(biller)}
                            style={s.deleteIcon}
                            title="Remove biller"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Account #</p>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', fontFamily: 'monospace', color: '#374151' }}>
                            {biller.account_number || biller.biller_account || '—'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setPayBillerId(biller.id);
                            if (!payAccountId && accounts.length > 0) {
                              setPayAccountId(accounts[0].id || accounts[0].account_number);
                            }
                          }}
                          style={s.payBillerBtn}
                        >
                          Pay
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pay Bill Form */}
              <div style={s.card}>
                <h2 style={s.sectionTitle}>Pay a Bill</h2>

                <form onSubmit={handlePayBill}>
                  <div style={s.formGrid}>
                    {/* Biller Selection */}
                    <div>
                      <label style={labelStyle}>Biller *</label>
                      <select
                        value={payBillerId}
                        onChange={(e) => setPayBillerId(e.target.value)}
                        style={selectStyle}
                        required
                      >
                        <option value="">Select biller</option>
                        {billers.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nickname || b.name} — {getCategoryLabel(b.category)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account to Pay From */}
                    <div>
                      <label style={labelStyle}>Account to Pay From *</label>
                      <select
                        value={payAccountId}
                        onChange={(e) => setPayAccountId(e.target.value)}
                        style={selectStyle}
                        required
                      >
                        <option value="">Select account</option>
                        {accounts.map((acc) => (
                          <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                            {acc.account_type || 'Account'} — ****{acc.account_number?.slice(-4)} ({formatCurrency(acc.balance || 0, acc.currency)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label style={labelStyle}>Amount *</label>
                      <input
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        style={inputStyle}
                      />
                    </div>

                    {/* Narration */}
                    <div>
                      <label style={labelStyle}>Narration <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <input
                        type="text"
                        value={payNarration}
                        onChange={(e) => setPayNarration(e.target.value)}
                        placeholder="e.g. January electricity bill"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="submit"
                      disabled={paying}
                      style={{
                        ...s.primaryBtn,
                        opacity: paying ? 0.7 : 1,
                        cursor: paying ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center',
                      }}
                    >
                      {paying ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'lc-spin 0.8s linear infinite',
                          }} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                          Pay Bill
                        </>
                      )}
                    </button>
                    <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab: Payment History */}
          {activeTab === 'Payment History' && (
            <div style={s.card}>
              {loadingPayments ? (
                <LoadingSpinner size="sm" text="Loading payment history..." />
              ) : paymentsError ? (
                <div style={s.errorBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{paymentsError}</span>
                </div>
              ) : payments.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    No bill payments yet. Pay your first bill to see it here.
                  </p>
                </div>
              ) : (
                <div style={s.tableWrapper}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Date</th>
                        <th style={s.th}>Reference</th>
                        <th style={s.th}>Biller</th>
                        <th style={s.th}>Amount</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pm, idx) => (
                        <tr key={pm.id || idx} style={s.tr}>
                          <td style={s.td}>{formatDate(pm.created_at || pm.date)}</td>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px' }}>
                            {pm.reference || pm.id || '—'}
                          </td>
                          <td style={{ ...s.td, fontWeight: 500, color: '#111827' }}>
                            {pm.biller_name || pm.biller_nickname || pm.biller || '—'}
                          </td>
                          <td style={{ ...s.td, fontWeight: 600, color: '#111827' }}>
                            {formatCurrency(pm.amount, pm.currency)}
                          </td>
                          <td style={s.td}>{getStatusBadge(pm.status)}</td>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px' }}>
                            {pm.account_number
                              ? `****${pm.account_number.slice(-4)}`
                              : pm.account_label || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Biller Modal */}
      <Modal
        isOpen={showAddBiller}
        onClose={() => setShowAddBiller(false)}
        title="Add New Biller"
        size="sm"
      >
        <form onSubmit={handleSaveBiller}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nickname *</label>
              <input
                type="text"
                value={billerNickname}
                onChange={(e) => setBillerNickname(e.target.value)}
                placeholder="e.g. City Power & Light"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={billerCategory}
                onChange={(e) => setBillerCategory(e.target.value)}
                style={selectStyle}
              >
                {BILLER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Biller Account Number *</label>
              <input
                type="text"
                value={billerAccountNumber}
                onChange={(e) => setBillerAccountNumber(e.target.value)}
                placeholder="Enter biller account / reference number"
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setShowAddBiller(false)}
              style={s.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingBiller}
              style={{
                ...s.primaryBtn,
                opacity: savingBiller ? 0.7 : 1,
                cursor: savingBiller ? 'not-allowed' : 'pointer',
              }}
            >
              {savingBiller ? 'Saving...' : 'Save Biller'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Biller Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBiller}
        title="Remove Biller"
        message={`Are you sure you want to remove "${deleteTarget?.nickname || deleteTarget?.name || 'this biller'}"? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
      />
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
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0',
  },
  tabBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'color 0.15s, border-color 0.15s',
    marginBottom: '-1px',
  },
  tabBtnActive: {
    color: '#1a56db',
    borderBottomColor: '#1a56db',
    fontWeight: 600,
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  billerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  },
  billerCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    padding: '16px',
    position: 'relative',
    transition: 'border-color 0.15s',
  },
  deleteIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'color 0.15s, background-color 0.15s',
  },
  payBillerBtn: {
    display: 'block',
    width: '100%',
    marginTop: '12px',
    padding: '8px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
    textAlign: 'center',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
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
  cancelBtn: {
    backgroundColor: '#ffffff',
    color: '#374151',
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  // Table
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
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
};