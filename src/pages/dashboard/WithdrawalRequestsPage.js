import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';

const STATUS_STYLES = {
  pending: { backgroundColor: '#fffbeb', color: '#d97706' },
  approved: { backgroundColor: '#ecfdf5', color: '#059669' },
  rejected: { backgroundColor: '#fef2f2', color: '#dc2626' },
};

const spinnerStyle = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '3px solid #e5e7eb',
  borderTopColor: '#1a56db',
  animation: 'cp-wr-spin 0.8s linear infinite',
};

export default function WithdrawalRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    account_id: '',
    amount: '',
    otp_code: '',
    description: '',
    bank_name: '',
    account_number: '',
    routing_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wrRes, accRes] = await Promise.all([
        transactionService.getWithdrawalRequests(),
        accountService.getAccounts(),
      ]);
      const wrData = Array.isArray(wrRes) ? wrRes : wrRes?.results || [];
      const accData = Array.isArray(accRes) ? accRes : accRes?.results || [];
      setRequests(wrData);
      setAccounts(accData);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.account_id || !form.amount || !form.otp_code) {
      toast.error('Account, amount, and OTP code are required');
      return;
    }
    setSubmitting(true);
    try {
      await transactionService.createWithdrawalRequest({
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id),
        otp_code: form.otp_code.trim().toUpperCase(),
      });
      toast.success('Withdrawal request submitted successfully');
      setShowForm(false);
      setForm({ account_id: '', amount: '', otp_code: '', description: '', bank_name: '', account_number: '', routing_number: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.otp_code?.[0]
        || err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.amount?.[0]
        || err.response?.data?.detail
        || 'Failed to create withdrawal request';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = '#1a56db';
    e.target.style.boxShadow = '0 0 0 2px rgba(26,86,219,0.15)';
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#d1d5db';
    e.target.style.boxShadow = 'none';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <style>{`@keyframes cp-wr-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ paddingTop: '64px', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={spinnerStyle} />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="cp-page-container" style={{ paddingTop: '64px', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Inter, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <div className="cp-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Withdrawal Requests</h1>
              <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14, margin: '4px 0 0' }}>Request a withdrawal to your external bank account</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
              {showForm ? 'Cancel' : 'New Request'}
            </Button>
          </div>

          {/* Form */}
          {showForm && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 20px' }}>New Withdrawal Request</h2>
              <form onSubmit={handleSubmit}>
                <div className="cp-wr-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Account *</label>
                    <select
                      name="account_id"
                      value={form.account_id}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_number} — {acc.currency} ({acc.account_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Amount (USD) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={form.bank_name}
                      onChange={handleChange}
                      placeholder="e.g. Chase Bank"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={form.account_number}
                      onChange={handleChange}
                      placeholder="External bank account number"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                      OTP Code <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="otp_code"
                      value={form.otp_code}
                      onChange={handleChange}
                      placeholder="e.g. A3F1B2"
                      maxLength={8}
                      style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace, Inter, sans-serif' }}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      required
                    />
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>Enter the OTP provided by your account officer</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Routing Number</label>
                    <input
                      type="text"
                      name="routing_number"
                      value={form.routing_number}
                      onChange={handleChange}
                      placeholder="9-digit routing number"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Reason for withdrawal (optional)"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" loading={submitting} disabled={!form.account_id || !form.amount}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          {requests.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#9ca3af', fontSize: 18, marginBottom: 8 }}>No withdrawal requests</div>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Click "New Request" to submit your first withdrawal request.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {requests.map((wr) => {
                const statusStyle = STATUS_STYLES[wr.status] || { backgroundColor: '#f3f4f6', color: '#374151' };
                return (
                  <div key={wr.id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    padding: 20,
                  }}>
                    <div className="cp-wr-card-flex" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#6b7280' }}>{wr.reference}</span>
                          <span style={{
                            padding: '2px 10px',
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 500,
                            ...statusStyle,
                          }}>
                            {wr.status}
                          </span>
                        </div>

                        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginTop: 8 }}>
                          ${parseFloat(wr.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>

                        {wr.description && (
                          <p style={{ fontSize: 14, color: '#6b7280', margin: '6px 0 0' }}>{wr.description}</p>
                        )}

                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                          {wr.bank_name && <span>{wr.bank_name}</span>}
                          {wr.account_number && <span> — ****{wr.account_number.slice(-4)}</span>}
                        </div>

                        {wr.rejection_reason && (
                          <div style={{
                            marginTop: 12,
                            padding: '8px 12px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 8,
                          }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#b91c1c' }}>Rejection reason: </span>
                            <span style={{ fontSize: 14, color: '#dc2626' }}>{wr.rejection_reason}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 14, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {wr.created_at && format(new Date(wr.created_at), 'MMM dd, yyyy HH:mm')}
                        {wr.reviewed_at && (
                          <div style={{ marginTop: 4 }}>
                            Reviewed: {format(new Date(wr.reviewed_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}