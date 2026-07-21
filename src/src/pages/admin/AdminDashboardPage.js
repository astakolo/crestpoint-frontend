import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminService';
import Navbar from '../../components/common/Navbar';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { formatCurrency, formatDate, USER_ROLES } from '../../utils/constants';

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArrowUpDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DollarCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <path d="M9 11h6a2 2 0 1 0 0-4h-3a2 2 0 0 1 0-4h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

function SnowflakeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M2 12l3-3 3 3" />
      <path d="M22 12l-3 3-3-3" />
      <path d="M2 12l3 3 3-3" />
      <path d="M22 12l-3-3-3 3" />
      <path d="M12 2l3 3-3 3" />
      <path d="M12 22l3-3-3-3" />
      <path d="M12 2l-3 3 3 3" />
      <path d="M12 22l-3-3 3-3" />
    </svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    todayVolume: 0,
    todayTransactionCount: 0,
    flaggedCount: 0,
    activeAccounts: 0,
    frozenAccounts: 0,
    failedCount: 0,
    pendingCount: 0,
  });
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getTransactionStats();
      const data = res.data;
      if (mountedRef.current) {
        setStats(prev => ({
          ...prev,
          totalBalance: data.total_balance ?? 0,
          todayVolume: data.today_volume ?? 0,
          todayTransactionCount: data.today_transaction_count ?? 0,
          flaggedCount: data.flagged_count ?? 0,
          activeAccounts: data.active_accounts ?? 0,
          frozenAccounts: data.frozen_accounts ?? 0,
          failedCount: data.failed_count ?? 0,
          pendingCount: data.pending_count ?? 0,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch transaction stats:', err);
    }
  }, []);

  const fetchFlaggedTransactions = useCallback(async () => {
    try {
      const res = await adminApi.getTransactions({
        is_flagged: true,
        page_size: 10,
      });
      const data = res.data;
      const results = data.results || data || [];
      if (mountedRef.current) {
        setFlaggedTransactions(results);
      }
    } catch (err) {
      console.error('Failed to fetch flagged transactions:', err);
    }
  }, []);

  const fetchRecentUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers({
        page_size: 5,
        ordering: '-created_at',
      });
      const data = res.data;
      const totalUsers = data.count ?? (Array.isArray(data.results) ? data.results.length : 0);
      if (mountedRef.current) {
        setRecentUsers(data.results || data || []);
        setStats(prev => ({ ...prev, totalUsers }));
      }
    } catch (err) {
      console.error('Failed to fetch recent users:', err);
    }
  }, []);

  // ─── Auto-refresh: 30-second polling ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchFlaggedTransactions();
      fetchRecentUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchFlaggedTransactions, fetchRecentUsers]);

  // ─── Initial Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([
          fetchStats(),
          fetchFlaggedTransactions(),
          fetchRecentUsers(),
        ]);
      } catch {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    loadAll();
  }, [fetchStats, fetchFlaggedTransactions, fetchRecentUsers]);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleUnflagTransaction = async (txId) => {
    try {
      await adminApi.unflagTransaction(txId);
      if (mountedRef.current) {
        setAlert({ type: 'success', message: 'Transaction unflagged successfully.' });
      }
      fetchFlaggedTransactions();
    } catch (err) {
      if (mountedRef.current) {
        setAlert({
          type: 'error',
          message: err.response?.data?.detail || 'Failed to unflag transaction.',
        });
      }
    }
  };

  // ─── System Status ──────────────────────────────────────────────────────

  const systemStatuses = [
    { label: 'API Health', status: 'Operational', color: '#059669' },
    { label: 'Database', status: 'Connected', color: '#059669' },
    { label: 'Celery Workers', status: 'Running', color: '#059669' },
    { label: 'Redis Cache', status: 'Connected', color: '#059669' },
  ];

  // ─── Quick Links ─────────────────────────────────────────────────────────

  const quickLinks = [
    { label: 'Manage Users', path: '/admin/users', description: 'View, search and manage all users', icon: '\uD83D\uDC65' },
    { label: 'Transaction Monitoring', path: '/admin/transactions', description: 'Monitor and flag transactions', icon: '\uD83D\uDCB3' },
    { label: 'System Settings', path: '#', description: 'Configure system parameters', icon: '\u2699\uFE0F' },
    { label: 'Audit Logs', path: '#', description: 'Review system audit trail', icon: '\uD83D\uDCDD' },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <AdminLayout>
          <div style={{
            minHeight: 'calc(100vh - 64px - 3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
          }}>
            <LoadingSpinner size="lg" text="Loading admin dashboard..." />
          </div>
        </AdminLayout>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <AdminLayout>
        <div style={{
          minHeight: 'calc(100vh - 64px - 3px)',
          backgroundColor: '#f9fafb',
          padding: '32px 24px',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#111827',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}>
                  Admin Dashboard
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#059669',
                    flexShrink: 0,
                  }} />
                  {user?.role || 'Admin'}
                </span>
              </div>
              <span style={{
                fontSize: '13px',
                color: '#6b7280',
              }}>
                {formatDate(new Date().toISOString())}
              </span>
            </div>

            {/* Stats Row 1 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '20px',
            }}>
              <div style={{ position: 'relative' }}>
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers.toLocaleString()}
                  subtitle="Registered accounts"
                  icon={<span style={{ color: '#1a56db' }}><UsersIcon /></span>}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  borderRadius: '12px 12px 0 0',
                  backgroundColor: '#1a56db',
                }} />
              </div>

              <div style={{ position: 'relative' }}>
                <StatCard
                  title="Total Balance"
                  value={formatCurrency(stats.totalBalance)}
                  subtitle="Platform-wide"
                  icon={<span style={{ color: '#7c3aed' }}><DollarCircleIcon /></span>}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  borderRadius: '12px 12px 0 0',
                  backgroundColor: '#7c3aed',
                }} />
              </div>

              <div style={{ position: 'relative' }}>
                <StatCard
                  title="Today's Volume"
                  value={formatCurrency(stats.todayVolume)}
                  subtitle={`${stats.todayTransactionCount} transactions`}
                  icon={<span style={{ color: '#059669' }}><ArrowUpDownIcon /></span>}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  borderRadius: '12px 12px 0 0',
                  backgroundColor: '#059669',
                }} />
              </div>

              <div style={{ position: 'relative' }}>
                <StatCard
                  title="Flagged"
                  value={stats.flaggedCount.toLocaleString()}
                  subtitle="Requires review"
                  icon={<span style={{ color: '#dc2626' }}><AlertTriangleIcon /></span>}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  borderRadius: '12px 12px 0 0',
                  backgroundColor: '#dc2626',
                }} />
              </div>
            </div>

            {/* Stats Row 2 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}>
              <div style={{ position: 'relative' }}>
                <StatCard
                  title="Frozen Accounts"
                  value={stats.frozenAccounts.toLocaleString()}
                  subtitle="Action required"
                  icon={<span style={{ color: '#dc2626' }}><SnowflakeIcon /></span>}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  borderRadius: '12px 12px 0 0',
                  backgroundColor: '#dc2626',
                }} />
              </div>

              <div style={{ position: 'relative' }}>
                <StatCard
                  title="Active Accounts"
                  value={stats.activeAccounts.toLocaleString()}
                  subtitle="Verified & operational"
                  icon={<span style={{ color: '#059669' }}><CheckCircleIcon /></span>}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  borderRadius: '12px 12px 0 0',
                  backgroundColor: '#059669',
                }} />
              </div>
            </div>

            {/* Two-column layout for flagged transactions + recent users */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
              gap: '24px',
              marginBottom: '32px',
            }}>
              {/* Recent Flagged Transactions */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#111827',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}>
                      Recent Flagged Transactions
                    </h2>
                    {stats.flaggedCount > 0 && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '22px',
                        height: '22px',
                        padding: '0 6px',
                        borderRadius: '100px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>
                        {stats.flaggedCount}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/transactions')}
                  >
                    View All
                  </Button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {flaggedTransactions.length === 0 ? (
                    <div style={{
                      padding: '32px 24px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px',
                    }}>
                      No flagged transactions
                    </div>
                  ) : (
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}>
                      <thead>
                        <tr>
                          {['Reference', 'User', 'Amount', 'Flag Reason', 'Date', 'Actions'].map(h => (
                            <th key={h} style={{
                              textAlign: 'left',
                              padding: '10px 16px',
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
                        {flaggedTransactions.slice(0, 5).map((tx, idx) => (
                          <tr
                            key={tx.id || idx}
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
                            <td style={{
                              padding: '10px 16px',
                              color: '#6b7280',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {tx.reference || tx.id}
                            </td>
                            <td style={{
                              padding: '10px 16px',
                              color: '#111827',
                              fontWeight: 500,
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {tx.user_email || tx.user || '\u2014'}
                            </td>
                            <td style={{
                              padding: '10px 16px',
                              fontWeight: 600,
                              color: '#dc2626',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {formatCurrency(tx.amount, tx.currency)}
                            </td>
                            <td style={{
                              padding: '10px 16px',
                              color: '#d97706',
                              fontSize: '12px',
                              maxWidth: '120px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {tx.flag_reason || 'No reason'}
                            </td>
                            <td style={{
                              padding: '10px 16px',
                              color: '#6b7280',
                              fontSize: '12px',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              {formatDate(tx.created_at || tx.date)}
                            </td>
                            <td style={{
                              padding: '10px 16px',
                              borderBottom: '1px solid #f3f4f6',
                            }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnflagTransaction(tx.id);
                                  }}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#059669',
                                    backgroundColor: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                    transition: 'background-color 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#d1fae5';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                                  }}
                                >
                                  Unflag
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/admin/transactions');
                                  }}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#1a56db',
                                    backgroundColor: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                    transition: 'background-color 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dbeafe';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#eff6ff';
                                  }}
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Recent User Registrations */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}>
                    Recent Registrations
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/users')}
                  >
                    View All
                  </Button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  {recentUsers.length === 0 ? (
                    <div style={{
                      padding: '32px 24px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px',
                    }}>
                      No recent registrations
                    </div>
                  ) : (
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}>
                      <thead>
                        <tr>
                          {['Email', 'Name', 'Role', 'Status', 'Date'].map(h => (
                            <th key={h} style={{
                              textAlign: 'left',
                              padding: '10px 16px',
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
                        {recentUsers.map((u, idx) => {
                          const roleName = u.role || 'customer';
                          const roleColors = {
                            admin: { bg: '#fef2f2', color: '#dc2626' },
                            customer: { bg: '#eff6ff', color: '#1a56db' },
                            support: { bg: '#fffbeb', color: '#d97706' },
                            auditor: { bg: '#f5f3ff', color: '#7c3aed' },
                          };
                          const rc = roleColors[roleName] || roleColors.customer;
                          const isActive = u.is_active !== false;
                          const statusColor = isActive ? '#059669' : '#dc2626';
                          const statusBg = isActive ? '#ecfdf5' : '#fef2f2';
                          const statusBorder = isActive ? '#a7f3d0' : '#fecaca';

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
                              <td style={{
                                padding: '10px 16px',
                                color: '#111827',
                                fontSize: '13px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                {u.email}
                              </td>
                              <td style={{
                                padding: '10px 16px',
                                color: '#111827',
                                fontWeight: 500,
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                {u.first_name && u.last_name
                                  ? `${u.first_name} ${u.last_name}`
                                  : u.first_name || '\u2014'}
                              </td>
                              <td style={{
                                padding: '10px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 8px',
                                  borderRadius: '100px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  backgroundColor: rc.bg,
                                  color: rc.color,
                                  textTransform: 'capitalize',
                                  border: `1px solid ${rc.color}20`,
                                }}>
                                  {roleName}
                                </span>
                              </td>
                              <td style={{
                                padding: '10px 16px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '100px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  backgroundColor: statusBg,
                                  color: statusColor,
                                  border: `1px solid ${statusBorder}`,
                                }}>
                                  <span style={{
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    backgroundColor: statusColor,
                                  }} />
                                  {isActive ? 'Active' : 'Locked'}
                                </span>
                              </td>
                              <td style={{
                                padding: '10px 16px',
                                color: '#6b7280',
                                fontSize: '12px',
                                borderBottom: '1px solid #f3f4f6',
                              }}>
                                {formatDate(u.created_at || u.date_joined)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px',
              marginBottom: '32px',
            }}>
              <h2 style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}>
                System Status
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                {systemStatuses.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: s.color,
                      flexShrink: 0,
                    }}>
                      <span style={{
                        position: 'absolute',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: s.color,
                        animation: 'lc-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        opacity: 0,
                      }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#111827',
                      }}>
                        {s.label}
                      </p>
                      <p style={{
                        margin: '2px 0 0 0',
                        fontSize: '12px',
                        color: s.color,
                        fontWeight: 500,
                      }}>
                        {s.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <style>{`
                @keyframes lc-pulse {
                  0% { transform: scale(1); opacity: 0.6; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
              `}</style>
            </div>

            {/* Quick Links */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '24px',
            }}>
              <h2 style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: '#111827',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}>
                Quick Links
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}>
                {quickLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1a56db';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(26, 86, 219, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{
                      fontSize: '24px',
                      lineHeight: 1,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}>
                      {link.icon}
                    </span>
                    <div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#111827',
                      }}>
                        {link.label}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#6b7280',
                        lineHeight: '16px',
                      }}>
                        {link.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
