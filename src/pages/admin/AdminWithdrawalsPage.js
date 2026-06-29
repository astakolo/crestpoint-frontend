import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import transactionService from '../../services/transactionService';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="text-gray-500 mt-1">Review and approve or reject user withdrawal requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'pending' && requests.length > 0 && (
              <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-lg">No {filter === 'all' ? '' : filter + ' '}withdrawal requests</div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((wr) => (
            <div key={wr.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-gray-500">{wr.reference}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[wr.status] || 'bg-gray-100 text-gray-800'}`}>
                      {wr.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">User: </span>
                      <span className="font-medium text-gray-900">{wr.user_full_name || wr.user_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Account: </span>
                      <span className="font-mono text-gray-900">{wr.cp_account_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount: </span>
                      <span className="font-bold text-gray-900 text-base">
                        ${parseFloat(wr.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Requested: </span>
                      <span className="text-gray-900">
                        {wr.created_at ? format(new Date(wr.created_at), 'MMM dd, yyyy HH:mm') : '—'}
                      </span>
                    </div>
                    {wr.bank_name && (
                      <div>
                        <span className="text-gray-500">Bank: </span>
                        <span className="text-gray-900">{wr.bank_name}</span>
                        {wr.account_number && <span className="text-gray-400"> — ****{wr.account_number.slice(-4)}</span>}
                      </div>
                    )}
                    {wr.description && (
                      <div>
                        <span className="text-gray-500">Description: </span>
                        <span className="text-gray-900">{wr.description}</span>
                      </div>
                    )}
                    {wr.rejection_reason && (
                      <div className="sm:col-span-2 mt-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-xs font-medium text-red-700">Rejected: </span>
                        <span className="text-sm text-red-600">{wr.rejection_reason}</span>
                        {wr.reviewer_email && (
                          <span className="text-xs text-red-400 ml-2">by {wr.reviewer_email}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons (only for pending) */}
                {wr.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(wr.id)}
                      disabled={actionLoading[wr.id]}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading[wr.id] ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => openReject(wr.id)}
                      disabled={actionLoading[wr.id]}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Withdrawal Request</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection reason *</label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              rows={3}
              placeholder="Provide a reason for rejecting this request..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading[rejectModal.id]}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading[rejectModal.id] ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}