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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import InputField from '../../components/common/InputField';
import { formatDate, USER_ROLES, KYC_STATUS } from '../../utils/constants';

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  admin: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  customer: { bg: '#eff6ff', color: '#1a56db', border: '#bfdbfe' },
  support: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  auditor: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
};

const STATUS_COLORS = {
  active: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  locked: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  unverified: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
};

const KYC_COLORS = {
  approved: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  pending: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
  { value: 'auditor', label: 'Auditor' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'locked', label: 'Locked' },
  { value: 'unverified', label: 'Unverified' },
];

const NOTIFICATION_TYPE_OPTIONS = [
  { value: '', label: 'Select type...' },
  { value: 'system', label: 'System' },
  { value: 'security', label: 'Security' },
  { value: 'account', label: 'Account' },
];

const PAGE_SIZE = 15;

// ─── Small action button helper ─────────────────────────────────────────────

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

function SmallBtn({ children, onClick, disabled, color = '#1a56db', bg = '#eff6ff', border = '#bfdbfe', hoverBg = '#dbeafe' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 500,
        color,
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, -apple-system, sans-serif',
        transition: 'background-color 0.15s',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = hoverBg; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = bg; }}
    >
      {children}
    </button>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user } = useAuth();

  // Data state
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & dialogs
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: null,
  });
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [actionLoading, setActionLoading] = useState('');

  // Batch selection
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Balance adjustment modal
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    account_id: '',
    amount: '',
    reason: '',
  });
  const [balanceError, setBalanceError] = useState('');
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);

  // Notification modal
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    notification_type: '',
  });
  const [notificationTargetUserIds, setNotificationTargetUserIds] = useState([]);
  const [notificationError, setNotificationError] = useState('');
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);

  // KYC rejection reason
  const [kycRejecting, setKycRejecting] = useState(false);
  const [kycRejectionReason, setKycRejectionReason] = useState('');
  const [kycSubmitLoading, setKycSubmitLoading] = useState(false);

  // Account freeze/unfreeze loading tracker
  const [accountActionLoading, setAccountActionLoading] = useState('');

  // ─── Fetch users ────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
        ordering: '-created_at',
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter === 'locked') params.is_active = 'false';
      if (statusFilter === 'active') params.is_active = 'true';
      if (statusFilter === 'unverified') params.kyc_status = 'pending';

      const res = await adminApi.getUsers(params);
      const data = res.data;
      setUsers(data.results || data || []);
      setTotalCount(data.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to load users.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Clear selections when page/filters change
  useEffect(() => {
    setSelectedUserIds([]);
  }, [currentPage, search, roleFilter, statusFilter]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setCurrentPage(1);
  };

  const handleViewUser = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await adminApi.getUserDetail(userId);
      setSelectedUser(res.data);
      setViewModalOpen(true);
      setKycRejecting(false);
      setKycRejectionReason('');
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load user details.' });
    } finally {
      setActionLoading('');
    }
  };

  const handleLockUser = (userData) => {
    setConfirmDialog({
      open: true,
      title: 'Lock User Account',
      message: `Are you sure you want to lock ${userData.first_name || userData.email}'s account? They will not be able to access their account until it is unlocked.`,
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(userData.id);
        try {
          await adminApi.lockUser(userData.id);
          setAlert({ type: 'success', message: `Account for ${userData.email} has been locked.` });
          fetchUsers();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || 'Failed to lock account.',
          });
        } finally {
          setActionLoading('');
        }
      },
    });
  };

  const handleUnlockUser = (userData) => {
    setConfirmDialog({
      open: true,
      title: 'Unlock User Account',
      message: `Are you sure you want to unlock ${userData.first_name || userData.email}'s account? They will regain access to their account.`,
      variant: 'default',
      onConfirm: async () => {
        setActionLoading(userData.id);
        try {
          await adminApi.unlockUser(userData.id);
          setAlert({ type: 'success', message: `Account for ${userData.email} has been unlocked.` });
          fetchUsers();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || 'Failed to unlock account.',
          });
        } finally {
          setActionLoading('');
        }
      },
    });
  };

  const handleVerifyUser = (userData) => {
    setConfirmDialog({
      open: true,
      title: 'Verify User',
      message: `Mark ${userData.first_name || userData.email} as verified? This will approve their KYC status.`,
      variant: 'default',
      onConfirm: async () => {
        setActionLoading(userData.id);
        try {
          await adminApi.verifyUser(userData.id);
          setAlert({ type: 'success', message: `${userData.email} has been verified.` });
          fetchUsers();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || 'Failed to verify user.',
          });
        } finally {
          setActionLoading('');
        }
      },
    });
  };

  const handleDeactivateUser = (userData) => {
    setConfirmDialog({
      open: true,
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate ${userData.first_name || userData.email}? This will immediately lock their account and revoke access.`,
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(userData.id);
        try {
          await adminApi.deactivateUser(userData.id);
          setAlert({ type: 'success', message: `${userData.email} has been deactivated.` });
          fetchUsers();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || 'Failed to deactivate user.',
          });
        } finally {
          setActionLoading('');
        }
      },
    });
  };

  // ─── Batch selection handlers ───────────────────────────────────────────

  const allOnPageSelected = users.length > 0 && users.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !users.some((u) => u.id === id)));
    } else {
      const pageIds = users.map((u) => u.id).filter(Boolean);
      setSelectedUserIds((prev) => {
        const merged = new Set([...prev, ...pageIds]);
        return Array.from(merged);
      });
    }
  };

  const handleSelectOne = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // ─── Batch lock/unlock ──────────────────────────────────────────────────

  const handleBatchLock = () => {
    const count = selectedUserIds.length;
    setConfirmDialog({
      open: true,
      title: 'Lock Selected Users',
      message: `Are you sure you want to lock ${count} user${count !== 1 ? 's' : ''}? They will not be able to access their accounts until unlocked.`,
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading('batch-lock');
        try {
          await adminApi.batchLock(selectedUserIds);
          setAlert({ type: 'success', message: `${count} user${count !== 1 ? 's' : ''} locked successfully.` });
          setSelectedUserIds([]);
          fetchUsers();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || 'Failed to lock selected users.',
          });
        } finally {
          setActionLoading('');
        }
      },
    });
  };

  const handleBatchUnlock = () => {
    const count = selectedUserIds.length;
    setConfirmDialog({
      open: true,
      title: 'Unlock Selected Users',
      message: `Are you sure you want to unlock ${count} user${count !== 1 ? 's' : ''}? They will regain access to their accounts.`,
      variant: 'default',
      onConfirm: async () => {
        setActionLoading('batch-unlock');
        try {
          await adminApi.batchUnlock(selectedUserIds);
          setAlert({ type: 'success', message: `${count} user${count !== 1 ? 's' : ''} unlocked successfully.` });
          setSelectedUserIds([]);
          fetchUsers();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.response?.data?.detail || 'Failed to unlock selected users.',
          });
        } finally {
          setActionLoading('');
        }
      },
    });
  };

  // ─── Balance adjustment ─────────────────────────────────────────────────

  const openBalanceModal = (userData) => {
    setBalanceForm({ account_id: '', amount: '', reason: '' });
    setBalanceError('');
    setSelectedUser(userData);
    setBalanceModalOpen(true);
  };

  const handleBalanceSubmit = async () => {
    if (!balanceForm.account_id) {
      setBalanceError('Please select an account.');
      return;
    }
    if (!balanceForm.amount || isNaN(Number(balanceForm.amount)) || Number(balanceForm.amount) === 0) {
      setBalanceError('Please enter a valid non-zero amount.');
      return;
    }
    if (!balanceForm.reason.trim()) {
      setBalanceError('Reason is required.');
      return;
    }
    setBalanceSubmitting(true);
    setBalanceError('');
    try {
      await adminApi.adjustBalance(selectedUser.id, {
        account_id: Number(balanceForm.account_id),
        amount: Number(balanceForm.amount),
        reason: balanceForm.reason.trim(),
      });
      setAlert({ type: 'success', message: `Balance adjusted for ${selectedUser.email}.` });
      setBalanceModalOpen(false);
      // Refresh user detail if view modal is open
      if (viewModalOpen && selectedUser) {
        const res = await adminApi.getUserDetail(selectedUser.id);
        setSelectedUser(res.data);
      }
    } catch (err) {
      setBalanceError(err.response?.data?.detail || err.response?.data?.message || 'Failed to adjust balance.');
    } finally {
      setBalanceSubmitting(false);
    }
  };

  // ─── Account freeze / unfreeze ──────────────────────────────────────────

  const handleFreezeAccount = (accountId) => {
    setConfirmDialog({
      open: true,
      title: 'Freeze Account',
      message: 'Are you sure you want to freeze this bank account? All transactions will be blocked.',
      variant: 'danger',
      onConfirm: async () => {
        setAccountActionLoading(accountId);
        try {
          await adminApi.freezeAccount(accountId);
          setAlert({ type: 'success', message: 'Account frozen successfully.' });
          // Refresh user detail
          if (selectedUser) {
            const res = await adminApi.getUserDetail(selectedUser.id);
            setSelectedUser(res.data);
          }
          fetchUsers();
        } catch (err) {
          setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to freeze account.' });
        } finally {
          setAccountActionLoading('');
        }
      },
    });
  };

  const handleUnfreezeAccount = (accountId) => {
    setConfirmDialog({
      open: true,
      title: 'Unfreeze Account',
      message: 'Are you sure you want to unfreeze this bank account? Transactions will resume.',
      variant: 'default',
      onConfirm: async () => {
        setAccountActionLoading(accountId);
        try {
          await adminApi.unfreezeAccount(accountId);
          setAlert({ type: 'success', message: 'Account unfrozen successfully.' });
          if (selectedUser) {
            const res = await adminApi.getUserDetail(selectedUser.id);
            setSelectedUser(res.data);
          }
          fetchUsers();
        } catch (err) {
          setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to unfreeze account.' });
        } finally {
          setAccountActionLoading('');
        }
      },
    });
  };

  // ─── KYC approve / reject ───────────────────────────────────────────────

  const handleApproveKYC = () => {
    if (!selectedUser?.kyc_document?.id) return;
    setConfirmDialog({
      open: true,
      title: 'Approve KYC',
      message: `Approve KYC for ${selectedUser.first_name || selectedUser.email}?`,
      variant: 'default',
      onConfirm: async () => {
        setKycSubmitLoading(true);
        try {
          await adminApi.reviewKYC({
            kyc_id: selectedUser.kyc_document.id,
            status: 'approved',
          });
          setAlert({ type: 'success', message: 'KYC approved successfully.' });
          const res = await adminApi.getUserDetail(selectedUser.id);
          setSelectedUser(res.data);
          fetchUsers();
        } catch (err) {
          setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to approve KYC.' });
        } finally {
          setKycSubmitLoading(false);
        }
      },
    });
  };

  const handleRejectKYC = async () => {
    if (!selectedUser?.kyc_document?.id) return;
    if (!kycRejectionReason.trim()) return;
    setKycSubmitLoading(true);
    try {
      await adminApi.reviewKYC({
        kyc_id: selectedUser.kyc_document.id,
        status: 'rejected',
        rejection_reason: kycRejectionReason.trim(),
      });
      setAlert({ type: 'success', message: 'KYC rejected.' });
      setKycRejecting(false);
      setKycRejectionReason('');
      const res = await adminApi.getUserDetail(selectedUser.id);
      setSelectedUser(res.data);
      fetchUsers();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.detail || 'Failed to reject KYC.' });
    } finally {
      setKycSubmitLoading(false);
    }
  };

  // ─── Send notification ──────────────────────────────────────────────────

  const openNotificationModal = (targetIds) => {
    setNotificationForm({ title: '', message: '', notification_type: '' });
    setNotificationError('');
    setNotificationTargetUserIds(targetIds || selectedUserIds.length > 0 ? selectedUserIds : []);
    setNotificationModalOpen(true);
  };

  const handleNotificationSubmit = async () => {
    if (!notificationForm.title.trim()) {
      setNotificationError('Title is required.');
      return;
    }
    if (!notificationForm.message.trim()) {
      setNotificationError('Message is required.');
      return;
    }
    if (!notificationForm.notification_type) {
      setNotificationError('Please select a notification type.');
      return;
    }
    if (notificationTargetUserIds.length === 0) {
      setNotificationError('No target users selected.');
      return;
    }
    setNotificationSubmitting(true);
    setNotificationError('');
    try {
      await adminApi.sendNotification({
        user_ids: notificationTargetUserIds,
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim(),
        notification_type: notificationForm.notification_type,
      });
      setAlert({ type: 'success', message: `Notification sent to ${notificationTargetUserIds.length} user${notificationTargetUserIds.length !== 1 ? 's' : ''}.` });
      setNotificationModalOpen(false);
    } catch (err) {
      setNotificationError(err.response?.data?.detail || 'Failed to send notification.');
    } finally {
      setNotificationSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ─── Badge helper ───────────────────────────────────────────────────────

  const Badge = ({ text, colors }) => {
    const c = colors || STATUS_COLORS.active;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '100px',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        textTransform: 'capitalize',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}>
        {text}
      </span>
    );
  };

  // ─── Shared select styles ───────────────────────────────────────────────

  const thStyle = {
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
                User Management
              </h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => openNotificationModal()}
                >
                  Send Notification
                </Button>
                <Button variant="primary" size="md" disabled>
                  + Create User
                </Button>
              </div>
            </div>

            {/* Filters bar */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '20px 24px',
              marginBottom: '20px',
            }}>
              <form
                onSubmit={handleSearch}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Search */}
                <div style={{
                  flex: '1 1 280px',
                  display: 'flex',
                  gap: '8px',
                  minWidth: '200px',
                }}>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by email or name..."
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
                  {search && (
                    <Button type="button" variant="secondary" size="md" onClick={clearSearch}>
                      Clear
                    </Button>
                  )}
                </div>

                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                  style={selectStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1a56db'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

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
              </form>

              {/* Result count */}
              <div style={{
                marginTop: '12px',
                fontSize: '13px',
                color: '#6b7280',
              }}>
                Showing {totalCount} user{totalCount !== 1 ? 's' : ''}
                {roleFilter && ` with role "${roleFilter}"`}
                {statusFilter && ` with status "${statusFilter}"`}
                {search && ` matching "${search}"`}
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
                <LoadingSpinner size="lg" text="Loading users..." />
              </div>
            ) : users.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}>
                <EmptyState
                  icon="\uD83D\uDC65"
                  title="No users found"
                  description={search || roleFilter || statusFilter
                    ? 'Try adjusting your search or filters.'
                    : 'No users have been registered yet.'}
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearch('');
                    setSearchInput('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                />
              </div>
            ) : (
              <>
                {/* Batch action bar */}
                {selectedUserIds.length > 0 && (
                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1a56db',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}>
                      {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleBatchLock}
                        loading={actionLoading === 'batch-lock'}
                      >
                        Lock Selected
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleBatchUnlock}
                        loading={actionLoading === 'batch-unlock'}
                      >
                        Unlock Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNotificationModal(selectedUserIds)}
                      >
                        Notify Selected
                      </Button>
                      <button
                        onClick={() => setSelectedUserIds([])}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#6b7280',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Users Table */}
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
                          <th style={{ ...thStyle, width: '40px', textAlign: 'center', padding: '12px 12px' }}>
                            <input
                              type="checkbox"
                              checked={allOnPageSelected}
                              onChange={handleSelectAll}
                              style={{
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer',
                                accentColor: '#1a56db',
                              }}
                            />
                          </th>
                          {[
                            'Email',
                            'Name',
                            'Role',
                            'Status',
                            'KYC Status',
                            'Failed Logins',
                            'Created',
                            'Actions',
                          ].map(h => (
                            <th key={h} style={thStyle}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, idx) => {
                          const roleName = u.role || 'customer';
                          const isActive = u.is_active !== false;
                          const isLocked = !isActive;
                          const kyc = u.kyc_status || 'pending';
                          const statusKey = isLocked ? 'locked' : (kyc === 'pending' ? 'unverified' : 'active');

                          return (
                            <tr
                              key={u.id || idx}
                              style={{
                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                                transition: 'background-color 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
                              }}
                            >
                              {/* Checkbox */}
                              <td style={{
                                padding: '12px 12px',
                                textAlign: 'center',
                                borderBottom: '1px solid #f3f4f6',
                                width: '40px',
                              }}>
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.includes(u.id)}
                                  onChange={() => handleSelectOne(u.id)}
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer',
                                    accentColor: '#1a56db',
                                  }}
                                />
                              </td>

                              {/* Email */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#111827',
                                fontSize: '13px',
                                borderBottom: '1px solid #f3f4f6',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {u.email}
                              </td>

                              {/* Name */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#111827',
                                fontWeight: 500,
                                borderBottom: '1px solid #f3f4f6',
                                whiteSpace: 'nowrap',
                              }}>
                                {u.first_name && u.last_name
                                  ? `${u.first_name} ${u.last_name}`
                                  : u.first_name || '\u2014'}
                              </td>

                              {/* Role */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <Badge text={roleName} colors={ROLE_COLORS[roleName]} />
                              </td>

                              {/* Status */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <Badge
                                  text={isLocked ? 'Locked' : (kyc === 'pending' ? 'Unverified' : 'Active')}
                                  colors={STATUS_COLORS[statusKey]}
                                />
                              </td>

                              {/* KYC Status */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <Badge text={kyc} colors={KYC_COLORS[kyc] || KYC_COLORS.pending} />
                              </td>

                              {/* Failed Login Attempts */}
                              <td style={{
                                padding: '12px 16px',
                                textAlign: 'center',
                                borderBottom: '1px solid #f3f4f6',
                                color: (u.failed_login_attempts || 0) > 3 ? '#dc2626' : '#111827',
                                fontWeight: (u.failed_login_attempts || 0) > 3 ? 600 : 400,
                              }}>
                                {u.failed_login_attempts || 0}
                              </td>

                              {/* Created */}
                              <td style={{
                                padding: '12px 16px',
                                color: '#6b7280',
                                fontSize: '12px',
                                borderBottom: '1px solid #f3f4f6',
                                whiteSpace: 'nowrap',
                              }}>
                                {formatDate(u.created_at || u.date_joined)}
                              </td>

                              {/* Actions */}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {/* View */}
                                  <SmallBtn onClick={() => handleViewUser(u.id)} disabled={actionLoading === u.id}>
                                    View
                                  </SmallBtn>

                                  {/* Adjust Balance */}
                                  {isActive && (
                                    <SmallBtn
                                      onClick={() => openBalanceModal(u)}
                                      disabled={actionLoading === u.id}
                                      color="#7c3aed"
                                      bg="#f5f3ff"
                                      border="#ddd6fe"
                                      hoverBg="#ede9fe"
                                    >
                                      Adjust Balance
                                    </SmallBtn>
                                  )}

                                  {/* Lock / Unlock */}
                                  {isLocked ? (
                                    <SmallBtn
                                      onClick={() => handleUnlockUser(u)}
                                      disabled={actionLoading === u.id}
                                      color="#059669"
                                      bg="#ecfdf5"
                                      border="#a7f3d0"
                                      hoverBg="#d1fae5"
                                    >
                                      Unlock
                                    </SmallBtn>
                                  ) : (
                                    <SmallBtn
                                      onClick={() => handleLockUser(u)}
                                      disabled={actionLoading === u.id}
                                      color="#dc2626"
                                      bg="#fef2f2"
                                      border="#fecaca"
                                      hoverBg="#fee2e2"
                                    >
                                      Lock
                                    </SmallBtn>
                                  )}

                                  {/* Verify (only show if not yet approved) */}
                                  {kyc !== 'approved' && (
                                    <SmallBtn
                                      onClick={() => handleVerifyUser(u)}
                                      disabled={actionLoading === u.id}
                                      color="#d97706"
                                      bg="#fffbeb"
                                      border="#fde68a"
                                      hoverBg="#fef3c7"
                                    >
                                      Verify
                                    </SmallBtn>
                                  )}

                                  {/* Deactivate */}
                                  {isActive && (
                                    <SmallBtn
                                      onClick={() => handleDeactivateUser(u)}
                                      disabled={actionLoading === u.id}
                                      color="#6b7280"
                                      bg="#f9fafb"
                                      border="#e5e7eb"
                                      hoverBg="#f3f4f6"
                                    >
                                      Deactivate
                                    </SmallBtn>
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

        {/* ─── View User Modal ──────────────────────────────────────────────── */}
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="User Details"
          size="lg"
        >
          {selectedUser && (
            <div style={{
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}>
              {/* User header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingBottom: '20px',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#1a56db',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                  }}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    {selectedUser.email}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <Badge
                      text={selectedUser.role || 'customer'}
                      colors={ROLE_COLORS[selectedUser.role] || ROLE_COLORS.customer}
                    />
                    <Badge
                      text={selectedUser.is_active !== false ? 'Active' : 'Locked'}
                      colors={selectedUser.is_active !== false ? STATUS_COLORS.active : STATUS_COLORS.locked}
                    />
                    <Badge
                      text={selectedUser.kyc_status || 'pending'}
                      colors={KYC_COLORS[selectedUser.kyc_status] || KYC_COLORS.pending}
                    />
                  </div>
                </div>
              </div>

              {/* KYC Section - show if pending */}
              {selectedUser.kyc_document && selectedUser.kyc_document.status === 'pending' && (
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: kycRejecting ? '12px' : '0',
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
                        KYC Verification Pending
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#92400e' }}>
                        Document type: {selectedUser.kyc_document.document_type || 'N/A'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <SmallBtn
                        onClick={handleApproveKYC}
                        disabled={kycSubmitLoading}
                        color="#059669"
                        bg="#ecfdf5"
                        border="#a7f3d0"
                        hoverBg="#d1fae5"
                      >
                        Approve KYC
                      </SmallBtn>
                      {!kycRejecting ? (
                        <SmallBtn
                          onClick={() => setKycRejecting(true)}
                          disabled={kycSubmitLoading}
                          color="#dc2626"
                          bg="#fef2f2"
                          border="#fecaca"
                          hoverBg="#fee2e2"
                        >
                          Reject KYC
                        </SmallBtn>
                      ) : (
                        <SmallBtn
                          onClick={() => { setKycRejecting(false); setKycRejectionReason(''); }}
                          color="#6b7280"
                          bg="#f9fafb"
                          border="#e5e7eb"
                          hoverBg="#f3f4f6"
                        >
                          Cancel
                        </SmallBtn>
                      )}
                    </div>
                  </div>
                  {kycRejecting && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                    }}>
                      <input
                        type="text"
                        value={kycRejectionReason}
                        onChange={(e) => setKycRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: '13px',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          outline: 'none',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#dc2626';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleRejectKYC}
                        disabled={!kycRejectionReason.trim() || kycSubmitLoading}
                        loading={kycSubmitLoading}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Details grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}>
                <DetailRow label="User ID" value={selectedUser.id} />
                <DetailRow label="Phone" value={selectedUser.phone_number || 'N/A'} />
                <DetailRow label="KYC Status" value={
                  <Badge
                    text={selectedUser.kyc_status || 'pending'}
                    colors={KYC_COLORS[selectedUser.kyc_status] || KYC_COLORS.pending}
                  />
                } />
                <DetailRow label="Failed Logins" value={selectedUser.failed_login_attempts || 0} />
                <DetailRow label="Last Login" value={formatDate(selectedUser.last_login)} />
                <DetailRow label="Created" value={formatDate(selectedUser.created_at || selectedUser.date_joined)} />
                <DetailRow label="Updated" value={formatDate(selectedUser.updated_at)} />
                <DetailRow
                  label="Account Locked"
                  value={
                    <span style={{
                      color: selectedUser.is_active === false ? '#dc2626' : '#059669',
                      fontWeight: 500,
                    }}>
                      {selectedUser.is_active === false ? 'Yes' : 'No'}
                    </span>
                  }
                />
              </div>

              {/* Bank accounts */}
              {selectedUser.accounts && selectedUser.accounts.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111827',
                  }}>
                    Bank Accounts ({selectedUser.accounts.length})
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {selectedUser.accounts.map((acc, i) => (
                      <div
                        key={acc.id || i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: acc.is_frozen ? '#fef2f2' : '#f9fafb',
                          border: `1px solid ${acc.is_frozen ? '#fecaca' : '#e5e7eb'}`,
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                            {acc.account_type || acc.type || 'Account'}
                            {acc.is_frozen && (
                              <Badge text="Frozen" colors={{ bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }} />
                            )}
                          </p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                            {acc.account_number || '\u2014'}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
                        }}>
                          {acc.balance != null ? `$${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {acc.is_frozen ? (
                            <SmallBtn
                              onClick={() => handleUnfreezeAccount(acc.id)}
                              disabled={accountActionLoading === acc.id}
                              color="#059669"
                              bg="#ecfdf5"
                              border="#a7f3d0"
                              hoverBg="#d1fae5"
                            >
                              Unfreeze
                            </SmallBtn>
                          ) : (
                            <SmallBtn
                              onClick={() => handleFreezeAccount(acc.id)}
                              disabled={accountActionLoading === acc.id}
                              color="#d97706"
                              bg="#fffbeb"
                              border="#fde68a"
                              hoverBg="#fef3c7"
                            >
                              Freeze
                            </SmallBtn>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.accounts && selectedUser.accounts.length === 0 && (
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '13px',
                }}>
                  No bank accounts found
                </div>
              )}

              {/* Action buttons at bottom */}
              <div style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNotificationModal([selectedUser.id])}
                >
                  Send Notification
                </Button>
                {selectedUser.is_active !== false && selectedUser.accounts && selectedUser.accounts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openBalanceModal(selectedUser);
                    }}
                  >
                    Adjust Balance
                  </Button>
                )}
                {selectedUser.is_active !== false ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setViewModalOpen(false);
                      handleLockUser(selectedUser);
                    }}
                  >
                    Lock Account
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setViewModalOpen(false);
                      handleUnlockUser(selectedUser);
                    }}
                  >
                    Unlock Account
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ─── Balance Adjustment Modal ─────────────────────────────────────── */}
        <Modal
          isOpen={balanceModalOpen}
          onClose={() => setBalanceModalOpen(false)}
          title="Adjust Balance"
          size="md"
        >
          <div style={{
            fontFamily: 'Inter, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Adjust balance for <strong style={{ color: '#111827' }}>{selectedUser?.email}</strong>.
              Use positive amounts to credit, negative to debit.
            </p>

            {balanceError && (
              <Alert type="error" message={balanceError} onClose={() => setBalanceError('')} />
            )}

            {/* Account selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
              }}>
                Account <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={balanceForm.account_id}
                onChange={(e) => setBalanceForm(prev => ({ ...prev, account_id: e.target.value }))}
                style={{
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
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1a56db'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <option value="">Select account...</option>
                {(selectedUser?.accounts || []).map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_type || acc.type || 'Account'} \u2014 {acc.account_number || acc.id} (Balance: ${Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <InputField
              label="Amount"
              type="number"
              name="balance-amount"
              value={balanceForm.amount}
              onChange={(e) => setBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="e.g. 500.00 or -200.00"
            />

            {/* Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
              }}>
                Reason <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={balanceForm.reason}
                onChange={(e) => setBalanceForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter the reason for this balance adjustment..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  resize: 'vertical',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxSizing: 'border-box',
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
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '8px',
            }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setBalanceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleBalanceSubmit}
                loading={balanceSubmitting}
              >
                Submit Adjustment
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Send Notification Modal ──────────────────────────────────────── */}
        <Modal
          isOpen={notificationModalOpen}
          onClose={() => setNotificationModalOpen(false)}
          title="Send Notification"
          size="md"
        >
          <div style={{
            fontFamily: 'Inter, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {notificationTargetUserIds.length === 1
                ? 'Send a notification to 1 selected user.'
                : `Send a notification to ${notificationTargetUserIds.length} selected users.`}
            </p>

            {notificationError && (
              <Alert type="error" message={notificationError} onClose={() => setNotificationError('')} />
            )}

            <InputField
              label="Title"
              type="text"
              name="notif-title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title..."
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
              }}>
                Notification Type <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={notificationForm.notification_type}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, notification_type: e.target.value }))}
                style={{
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
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1a56db'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                {NOTIFICATION_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
              }}>
                Message <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Write the notification message..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  resize: 'vertical',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxSizing: 'border-box',
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
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '8px',
            }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setNotificationModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleNotificationSubmit}
                loading={notificationSubmitting}
              >
                Send Notification
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.open}
          onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
        />
      </AdminLayout>
    </>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
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
      }}>
        {value || 'N/A'}
      </p>
    </div>
  );
}