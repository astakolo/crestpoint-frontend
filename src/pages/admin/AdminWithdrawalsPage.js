import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import transactionService from '../../services/transactionService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import InputField from '../../components/common/InputField';

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
  animation: 'spin 0.8s linear infinite',
};

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [otpModal, setOtpModal] = useState({ open: false, userId: null, userEmail: '', userName: '', loading: false, generatedOtp: null });

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      const res = await transactionService.adminGetWithdrawalRequests(params);
      setRequests(res.results || res);
    } catch (err) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await transactionService.adminReviewWithdrawal(id, { action: 'approve' });
      toast.success('Withdrawal approved and processed');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const openReject = (id) => {
    setRejectModal({ open: true, id, reason: '' });
  };

  const handleReject = async () => {
    const { id, reason } = rejectModal;
    if (!reason.trim()) {
      toast.error('A rejection reason is required');
      return;
    }
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await transactionService.adminReviewWithdrawal(id, { action: 'reject', rejection_reason: reason });
      toast.success('Withdrawal rejected');
      setRejectModal({ open: false, id: null, reason: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.rejection_reason?.[0] || 'Failed to reject');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
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
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Withdrawal Requests</h1>
              <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14, margin: '4px 0 0' }}>Review and approve or reject user withdrawal requests</p>
            </div>
            <button
              onClick={() => setOtpModal({ open: true, userId: null, userEmail: '', userName: '', loading: false, generatedOtp: null })}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1a56db',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              Generate OTP
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {['pending', 'approved', 'rejected', 'all'].map((s) => {
              const isActive = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, color 0.15s',
                    backgroundColor: isActive ? '#1a56db' : '#f3f4f6',
                    color: isActive ? '#ffffff' : '#4b5563',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === 'pending' && requests.length > 0 && (
                    <span style={{
                      marginLeft: 6,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                      color: isActive ? '#ffffff' : '#4b5563',
                      fontSize: 12,
                      padding: '2px 6px',
                      borderRadius: 9999,
                      fontWeight: 500,
                    }}>
                      {requests.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          {requests.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: '48px 24px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#9ca3af', fontSize: 18 }}>
                No {filter === 'all' ? '' : filter + ' '}withdrawal requests
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {requests.map((wr) => {
                const statusStyle = STATUS_STYLES[wr.status] || { backgroundColor: '#f3f4f6', color: '#374151' };
                return (
                  <div key={wr.id} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
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

                        <div className="cp-wr-detail-grid" style={{
                          marginTop: 8,
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: '4px 32px',
                          fontSize: 14,
                        }}>
                          <div>
                            <span style={{ color: '#6b7280' }}>User: </span>
                            <span style={{ fontWeight: 500, color: '#111827' }}>{wr.user_full_name || wr.user_email}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Account: </span>
                            <span style={{ fontFamily: 'monospace', color: '#111827' }}>{wr.cp_account_number}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Amount: </span>
                            <span style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                              ${parseFloat(wr.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Requested: </span>
                            <span style={{ color: '#111827' }}>
                              {wr.created_at ? format(new Date(wr.created_at), 'MMM dd, yyyy HH:mm') : '—'}
                            </span>
                          </div>
                          {wr.bank_name && (
                            <div>
                              <span style={{ color: '#6b7280' }}>Bank: </span>
                              <span style={{ color: '#111827' }}>{wr.bank_name}</span>
                              {wr.account_number && <span style={{ color: '#9ca3af' }}> — ****{wr.account_number.slice(-4)}</span>}
                            </div>
                          )}
                          {wr.description && (
                            <div>
                              <span style={{ color: '#6b7280' }}>Description: </span>
                              <span style={{ color: '#111827' }}>{wr.description}</span>
                            </div>
                          )}
                          {wr.rejection_reason && (
                            <div style={{
                              gridColumn: '1 / -1',
                              marginTop: 4,
                              padding: '8px 12px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: 8,
                            }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#b91c1c' }}>Rejected: </span>
                              <span style={{ fontSize: 14, color: '#dc2626' }}>{wr.rejection_reason}</span>
                              {wr.reviewer_email && (
                                <span style={{ fontSize: 12, color: '#f87171', marginLeft: 8 }}>by {wr.reviewer_email}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons (only for pending) */}
                      {wr.status === 'pending' && (
                        <div className="cp-wr-actions" style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => handleApprove(wr.id)}
                            disabled={actionLoading[wr.id]}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 14,
                              fontWeight: 500,
                              cursor: actionLoading[wr.id] ? 'not-allowed' : 'pointer',
                              opacity: actionLoading[wr.id] ? 0.5 : 1,
                              transition: 'background-color 0.15s, opacity 0.15s',
                            }}
                          >
                            {actionLoading[wr.id] ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openReject(wr.id)}
                            disabled={actionLoading[wr.id]}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 8,
                              fontSize: 14,
                              fontWeight: 500,
                              cursor: actionLoading[wr.id] ? 'not-allowed' : 'pointer',
                              opacity: actionLoading[wr.id] ? 0.5 : 1,
                              transition: 'background-color 0.15s, opacity 0.15s',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejection modal */}
          {rejectModal.open && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: 440,
                margin: '0 16px',
                padding: 24,
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Reject Withdrawal Request</h3>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Rejection reason *</label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  rows={3}
                  placeholder="Provide a reason for rejecting this request..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 16,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#dc2626';
                    e.target.style.boxShadow = '0 0 0 2px rgba(220,38,38,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
                    style={{
                      padding: '8px 16px',
                      color: '#374151',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading[rejectModal.id]}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: actionLoading[rejectModal.id] ? 'not-allowed' : 'pointer',
                      opacity: actionLoading[rejectModal.id] ? 0.5 : 1,
                      transition: 'background-color 0.15s, opacity 0.15s',
                    }}
                  >
                    {actionLoading[rejectModal.id] ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OTP Generation Modal */}
          {otpModal.open && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{
                backgroundColor: '#ffffff', borderRadius: 12,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                width: '100%', maxWidth: 440, margin: '0 16px', padding: 24,
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Generate Withdrawal OTP</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Generate a one-time password for a user to submit a withdrawal request.</p>

                {!otpModal.generatedOtp ? (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>User ID *</label>
                      <input
                        type="number"
                        value={otpModal.userId || ''}
                        onChange={(e) => setOtpModal({ ...otpModal, userId: e.target.value ? parseInt(e.target.value) : '' })}
                        placeholder="Enter user ID"
                        style={{
                          width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                          borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button
                        onClick={() => setOtpModal({ open: false, userId: null, userEmail: '', userName: '', loading: false, generatedOtp: null })}
                        style={{ padding: '8px 16px', color: '#374151', backgroundColor: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!otpModal.userId) { toast.error('Please enter a user ID'); return; }
                          setOtpModal({ ...otpModal, loading: true });
                          try {
                            const result = await transactionService.adminGenerateOTP(otpModal.userId);
                            setOtpModal({ ...otpModal, loading: false, generatedOtp: result });
                            toast.success('OTP generated successfully');
                          } catch (err) {
                            toast.error(err.response?.data?.user_id?.[0] || err.response?.data?.detail || 'Failed to generate OTP');
                            setOtpModal({ ...otpModal, loading: false });
                          }
                        }}
                        disabled={otpModal.loading}
                        style={{
                          padding: '8px 16px', backgroundColor: '#1a56db', color: '#ffffff',
                          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
                          cursor: otpModal.loading ? 'not-allowed' : 'pointer',
                          opacity: otpModal.loading ? 0.5 : 1,
                        }}
                      >
                        {otpModal.loading ? 'Generating...' : 'Generate OTP'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      backgroundColor: '#f0fdf4', border: '2px dashed #059669', borderRadius: 12,
                      padding: '24px', textAlign: 'center', marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#059669', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>OTP Code</div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', fontFamily: 'monospace', letterSpacing: 6 }}>{otpModal.generatedOtp.code}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                        For: {otpModal.generatedOtp.user_full_name} ({otpModal.generatedOtp.user_email})
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        Expires: {otpModal.generatedOtp.expires_at ? format(new Date(otpModal.generatedOtp.expires_at), 'MMM dd, yyyy HH:mm') : '—'}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                      padding: '12px', marginBottom: 16, fontSize: 13, color: '#92400e',
                    }}>
                      Share this code with the user. It can only be used once and expires in 30 minutes.
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(otpModal.generatedOtp.code);
                            toast.success('OTP copied to clipboard');
                          } catch {
                            toast.error('Failed to copy');
                          }
                        }}
                        style={{
                          flex: 1, padding: '8px 16px', backgroundColor: '#f3f4f6', color: '#374151',
                          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Copy Code
                      </button>
                      <button
                        onClick={() => setOtpModal({ open: false, userId: null, userEmail: '', userName: '', loading: false, generatedOtp: null })}
                        style={{
                          flex: 1, padding: '8px 16px', backgroundColor: '#1a56db', color: '#ffffff',
                          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}