import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import notificationService from '../../services/notificationService';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import AccountCard from '../../components/dashboard/AccountCard';
import TransactionTable from '../../components/dashboard/TransactionTable';
import QuickActions from '../../components/dashboard/QuickActions';
import { formatCurrency } from '../../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accountsData, transactionsData, unreadData] = await Promise.allSettled([
        accountService.getAccounts(),
        transactionService.getHistory({ page: 1, page_size: 1000 }),
        notificationService.getUnreadCount(),
      ]);

      if (accountsData.status === 'fulfilled') {
        const accs = Array.isArray(accountsData.value)
          ? accountsData.value
          : accountsData.value?.results || accountsData.value?.data || [];
        setAccounts(accs);
      }

      if (transactionsData.status === 'fulfilled') {
        const txs = Array.isArray(transactionsData.value)
          ? transactionsData.value
          : transactionsData.value?.results || transactionsData.value?.data || [];
        setTransactions(txs);
      }

      if (unreadData.status === 'fulfilled') {
        setUnreadCount(unreadData.value?.count ?? unreadData.value?.unread_count ?? 0);
      }

      if (accountsData.status === 'rejected') {
        throw accountsData.reason;
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const firstName = user?.first_name || 'Valued Customer';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const income = transactions
    .filter(t => ['deposit', 'transfer_in', 'credit', 'incoming'].includes((t.transaction_type || t.type || '').toLowerCase()) && (t.status || '').toLowerCase() === 'completed')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const expense = transactions
    .filter(t => ['withdrawal', 'transfer_out', 'payment', 'debit', 'outgoing'].includes((t.transaction_type || t.type || '').toLowerCase()) && (t.status || '').toLowerCase() === 'completed')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const handleQuickAction = useCallback((actionId) => {
    const routes = {
      transfer: '/transfer',
      deposit: '/deposit-withdraw',
      withdraw: '/deposit-withdraw',
      'pay-bills': '/bills',
      cards: '/cards',
      loans: '/loans',
      investments: '/investments',
      crypto: '/crypto-deposit',
    };
    if (routes[actionId]) {
      navigate(routes[actionId]);
    }
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.loadingContainer}>
            <LoadingSpinner size="lg" text="Loading your dashboard..." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container} className="cp-page-container">
          {/* Error Alert */}
          {error && (
            <div style={{ marginBottom: '24px' }}>
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          {/* Welcome Section */}
          <div style={styles.welcomeSection}>
            <div>
              <h1 style={styles.welcomeTitle}>Welcome back, {firstName}</h1>
              <p style={styles.welcomeDate}>{today}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div style={styles.statsGrid} className="cp-stats-grid">
            <StatCard
              title="Total Balance"
              value={formatCurrency(totalBalance)}
              subtitle="Across all accounts"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
            <StatCard
              title="Income"
              value={formatCurrency(income)}
              subtitle="Total earnings"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              }
            />
            <StatCard
              title="Expenses"
              value={formatCurrency(expense)}
              subtitle="Total spent"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
              }
            />
            <StatCard
              title="Accounts"
              value={accounts.length}
              subtitle="Active accounts"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <line x1="2" y1="9" x2="22" y2="9" />
                </svg>
              }
            />
            <StatCard
              title="Notifications"
              value={unreadCount}
              subtitle="Unread messages"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              }
            />
          </div>

          {/* Quick Actions */}
          <div style={styles.section}>
            <QuickActions onAction={handleQuickAction} />
          </div>

          {/* Accounts Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader} className="cp-section-header">
              <h2 style={styles.sectionTitle}>Your Accounts</h2>
              <Link to="/accounts" style={styles.viewAllLink}>
                View All Accounts →
              </Link>
            </div>
            {accounts.length > 0 ? (
              <div style={styles.accountsGrid} className="cp-accounts-grid">
                {accounts.slice(0, 4).map((account) => (
                  <AccountCard
                    key={account.id || account.account_number}
                    account={account}
                    onClick={() => navigate('/accounts')}
                  />
                ))}
              </div>
            ) : (
              <div style={styles.emptyCard}>
                <p style={styles.emptyText}>No accounts found. Create your first account to get started.</p>
                <Link to="/accounts" style={styles.createLink}>
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Recent Transactions Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader} className="cp-section-header">
              <h2 style={styles.sectionTitle}>Recent Transactions</h2>
              <Link to="/transactions" style={styles.viewAllLink}>
                View All Transactions →
              </Link>
            </div>
            <TransactionTable
              transactions={transactions.slice(0, 50)}
              onViewDetails={(tx) => navigate('/transactions')}
            />
          </div>
        </div>
      </div>
    </>
  );
}

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
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
  },
  welcomeSection: {
    marginBottom: '32px',
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 4px 0',
    lineHeight: 1.3,
  },
  welcomeDate: {
    fontSize: '15px',
    color: '#6b7280',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  viewAllLink: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a56db',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
  },
  accountsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0',
  },
  createLink: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ffffff',
    backgroundColor: '#1a56db',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.15s',
  },
};
