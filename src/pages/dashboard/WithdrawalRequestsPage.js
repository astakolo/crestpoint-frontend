import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
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
      setRequests(wrRes.results || wrRes);
      setAccounts(accRes.results || accRes);
    } catch (err) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.account_id || !form.amount) {
      toast.error('Account and amount are required');
      return;
    }
    setSubmitting(true);
    try {
      await transactionService.createWithdrawalRequest({
        ...form,
        amount: parseFloat(form.amount),
        account_id: parseInt(form.account_id),
      });
      toast.success('Withdrawal request submitted successfully');
      setShowForm(false);
      setForm({ account_id: '', amount: '', description: '', bank_name: '', account_number: '', routing_number: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.amount?.[0]
        || err.response?.data?.detail
        || 'Failed to create withdrawal request';
      toast.error(msg);
    } finally {
      setSubmitting(false);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-500 mt-1">Request a withdrawal to your external bank account</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Withdrawal Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                <select
                  name="account_id"
                  value={form.account_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD) *</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  placeholder="e.g. Chase Bank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={form.account_number}
                  onChange={handleChange}
                  placeholder="External bank account number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                <input
                  type="text"
                  name="routing_number"
                  value={form.routing_number}
                  onChange={handleChange}
                  placeholder="9-digit routing number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Reason for withdrawal (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">No withdrawal requests</div>
          <p className="text-gray-500 text-sm">Click "New Request" to submit your first withdrawal request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((wr) => (
            <div key={wr.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-500">{wr.reference}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[wr.status] || 'bg-gray-100 text-gray-800'}`}>
                      {wr.status}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    ${parseFloat(wr.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {wr.description && (
                    <p className="text-sm text-gray-600">{wr.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {wr.bank_name && <span>{wr.bank_name}</span>}
                    {wr.account_number && <span> — ****{wr.account_number.slice(-4)}</span>}
                  </div>
                  {wr.rejection_reason && (
                    <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-xs font-medium text-red-700">Rejection reason: </span>
                      <span className="text-sm text-red-600">{wr.rejection_reason}</span>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {wr.created_at && format(new Date(wr.created_at), 'MMM dd, yyyy HH:mm')}
                  {wr.reviewed_at && (
                    <div className="mt-1">
                      Reviewed: {format(new Date(wr.reviewed_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
