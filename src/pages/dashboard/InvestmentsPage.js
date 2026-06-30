import React, { useState, useEffect, useCallback, Component } from 'react';
import Navbar from '../../components/common/Navbar';
import investmentService from '../../services/investmentService';
import accountService from '../../services/accountService';
import toast from 'react-hot-toast';

// ErrorBoundary to catch runtime crashes and show feedback instead of white page
class InvestmentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[InvestmentsPage]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '48px 32px',
            textAlign: 'center',
            maxWidth: '420px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
              {this.state.error?.message || 'An unexpected error occurred loading this page.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#1a56db',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const TABS = [
  { key: 'market', label: 'Market' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'account', label: 'Investment Account' },
];

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

function formatNumber(num) {
  if (num == null) return '—';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState('market');

  // Market state
  const [stocks, setStocks] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketSearch, setMarketSearch] = useState('');

  // Portfolio state
  const [holdings, setHoldings] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState({
    total_invested: 0,
    current_value: 0,
    total_pnl: 0,
  });

  // Investment account state
  const [investmentAccount, setInvestmentAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [investmentTransactions, setInvestmentTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Bank accounts for deposit/buy modals
  const [bankAccounts, setBankAccounts] = useState([]);

  // Buy modal
  const [buyModal, setBuyModal] = useState({ open: false, stock: null });
  const [buyQuantity, setBuyQuantity] = useState('');
  const [buyAccountId, setBuyAccountId] = useState('');
  const [buying, setBuying] = useState(false);

  // Sell modal
  const [sellModal, setSellModal] = useState({ open: false, holding: null });
  const [sellQuantity, setSellQuantity] = useState('');
  const [selling, setSelling] = useState(false);

  // Deposit modal
  const [depositModal, setDepositModal] = useState(false);
  const [depositAccountId, setDepositAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Fetch bank accounts (used across tabs)
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const data = await accountService.getAccounts();
        const accs = Array.isArray(data) ? data : data?.results || data?.data || [];
        setBankAccounts(accs.filter((a) => (a.status || '').toLowerCase() === 'active'));
      } catch {
        // Non-critical
      }
    };
    fetchBankAccounts();
  }, []);

  // ── Market Tab ──────────────────────────────────────────────
  const fetchStocks = useCallback(async () => {
    setMarketLoading(true);
    setMarketError('');
    try {
      const data = await investmentService.getMarketStocks();
      setStocks(Array.isArray(data) ? data : data?.results || data?.stocks || []);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to load market data';
      setMarketError(msg);
      toast.error(msg);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'market') fetchStocks();
  }, [activeTab, fetchStocks]);

  const filteredStocks = stocks.filter((s) => {
    if (!marketSearch) return true;
    const q = marketSearch.toLowerCase();
    return (
      (s.symbol || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q)
    );
  });

  const openBuyModal = (stock) => {
    setBuyModal({ open: true, stock });
    setBuyQuantity('');
    setBuyAccountId(bankAccounts[0]?.id || '');
  };

  const closeBuyModal = () => {
    setBuyModal({ open: false, stock: null });
    setBuyQuantity('');
    setBuyAccountId('');
  };

  const handleBuy = async () => {
    const qty = parseInt(buyQuantity, 10);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!buyAccountId) {
      toast.error('Please select a bank account');
      return;
    }
    setBuying(true);
    try {
      await investmentService.buyStock({
        stock_id: buyModal.stock.id || buyModal.stock.symbol,
        symbol: buyModal.stock.symbol,
        quantity: qty,
        account_id: buyAccountId,
      });
      toast.success(`Successfully purchased ${qty} share${qty > 1 ? 's' : ''} of ${buyModal.stock.symbol}`);
      closeBuyModal();
      fetchStocks();
      // Refresh portfolio if already loaded
      fetchPortfolio();
      fetchInvestmentAccount();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  // ── Portfolio Tab ───────────────────────────────────────────
  const fetchPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    setPortfolioError('');
    try {
      const data = await investmentService.getPortfolio();
      const holdingsList = Array.isArray(data) ? data : data?.holdings || data?.results || [];
      setHoldings(holdingsList);
      setPortfolioSummary({
        total_invested: data?.total_invested || holdingsList.reduce((s, h) => s + (h.total_cost || 0), 0),
        current_value: data?.current_value || holdingsList.reduce((s, h) => s + (h.current_value || 0), 0),
        total_pnl: data?.total_pnl || holdingsList.reduce((s, h) => s + (h.pnl || 0), 0),
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to load portfolio';
      setPortfolioError(msg);
      toast.error(msg);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'portfolio') fetchPortfolio();
  }, [activeTab, fetchPortfolio]);

  const openSellModal = (holding) => {
    setSellModal({ open: true, holding });
    setSellQuantity('');
  };

  const closeSellModal = () => {
    setSellModal({ open: false, holding: null });
    setSellQuantity('');
  };

  const handleSell = async () => {
    const qty = parseInt(sellQuantity, 10);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    const maxQty = sellModal.holding.quantity;
    if (qty > maxQty) {
      toast.error(`Maximum sellable quantity is ${maxQty}`);
      return;
    }
    setSelling(true);
    try {
      await investmentService.sellStock({
        holding_id: sellModal.holding.id,
        symbol: sellModal.holding.symbol,
        quantity: qty,
      });
      toast.success(`Successfully sold ${qty} share${qty > 1 ? 's' : ''} of ${sellModal.holding.symbol}`);
      closeSellModal();
      fetchPortfolio();
      fetchInvestmentAccount();
      fetchInvestmentTransactions();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Sell failed');
    } finally {
      setSelling(false);
    }
  };

  // ── Investment Account Tab ──────────────────────────────────
  const fetchInvestmentAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError('');
    try {
      const data = await investmentService.getInvestmentAccount();
      setInvestmentAccount(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to load investment account';
      setAccountError(msg);
      toast.error(msg);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  const fetchInvestmentTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await investmentService.getHistory();
      setInvestmentTransactions(Array.isArray(data) ? data : data?.results || data?.transactions || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to load investment transactions');
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'account') {
      fetchInvestmentAccount();
      fetchInvestmentTransactions();
    }
  }, [activeTab, fetchInvestmentAccount, fetchInvestmentTransactions]);

  const openDepositModal = () => {
    setDepositModal(true);
    setDepositAmount('');
    setDepositAccountId(bankAccounts[0]?.id || '');
  };

  const closeDepositModal = () => {
    setDepositModal(false);
    setDepositAmount('');
    setDepositAccountId('');
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!depositAccountId) {
      toast.error('Please select a bank account');
      return;
    }
    setDepositing(true);
    try {
      await investmentService.depositToInvestment({
        account_id: depositAccountId,
        amount,
      });
      toast.success('Deposit successful');
      closeDepositModal();
      fetchInvestmentAccount();
      fetchInvestmentTransactions();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  // ── Computed values ─────────────────────────────────────────
  const buyTotal = buyModal.stock
    ? (parseFloat(buyQuantity) || 0) * (buyModal.stock.price || buyModal.stock.current_price || 0)
    : 0;

  const sellTotal = sellModal.holding
    ? (parseFloat(sellQuantity) || 0) * (sellModal.holding.current_price || sellModal.holding.price || 0)
    : 0;

  const pnlPercent = portfolioSummary.total_invested > 0
    ? ((portfolioSummary.total_pnl / portfolioSummary.total_invested) * 100)
    : 0;

  // Track API errors for display
  const [marketError, setMarketError] = useState('');
  const [portfolioError, setPortfolioError] = useState('');
  const [accountError, setAccountError] = useState('');

  return (
    <>
      <Navbar />
      <style>{`
        @keyframes cp-inv-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Page Header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>Investments</h1>
          </div>

          {/* Tabs */}
          <div style={styles.tabBar}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.key ? styles.tabActive : {}),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── MARKET TAB ─── */}
          {activeTab === 'market' && (
            <div>
              {/* Search */}
              <div style={styles.searchWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by symbol or name..."
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  style={styles.searchInput}
                />
                {marketSearch && (
                  <button onClick={() => setMarketSearch('')} style={styles.searchClear}>&times;</button>
                )}
              </div>

              {/* Stock Grid */}
              {marketLoading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner} />
                  <span style={styles.loadingText}>Loading market data...</span>
                </div>
              ) : marketError ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⚠️</div>
                  <h3 style={styles.emptyTitle}>Error Loading Market</h3>
                  <p style={styles.emptyDescription}>{marketError}</p>
                  <button onClick={fetchStocks} style={styles.retryBtn}>Retry</button>
                </div>
              ) : filteredStocks.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📈</div>
                  <h3 style={styles.emptyTitle}>No Stocks Found</h3>
                  <p style={styles.emptyDescription}>
                    {marketSearch ? 'Try adjusting your search terms.' : 'No market data available at this time.'}
                  </p>
                </div>
              ) : (
                <div style={styles.stockGrid}>
                  {filteredStocks.map((stock) => {
                    const change = stock.change_percent ?? stock.change ?? 0;
                    const isPositive = change >= 0;
                    const price = stock.price || stock.current_price || 0;
                    return (
                      <div key={stock.id || stock.symbol} style={styles.stockCard}>
                        <div style={styles.stockCardHeader}>
                          <span style={styles.stockSymbol}>{stock.symbol}</span>
                          <span style={{
                            ...styles.changeBadge,
                            backgroundColor: isPositive ? '#ecfdf5' : '#fef2f2',
                            color: isPositive ? '#059669' : '#dc2626',
                          }}>
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        </div>
                        <div style={styles.stockName}>{stock.name}</div>
                        <div style={styles.stockPrice}>{formatCurrency(price)}</div>
                        <div style={styles.stockMeta}>
                          <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Mkt Cap</span>
                            <span style={styles.metaValue}>{formatNumber(stock.market_cap)}</span>
                          </div>
                          <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Vol</span>
                            <span style={styles.metaValue}>{formatNumber(stock.volume)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => openBuyModal(stock)}
                          style={styles.buyBtn}
                        >
                          Buy
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── PORTFOLIO TAB ─── */}
          {activeTab === 'portfolio' && (
            <div>
              {portfolioLoading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner} />
                  <span style={styles.loadingText}>Loading portfolio...</span>
                </div>
              ) : portfolioError ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⚠️</div>
                  <h3 style={styles.emptyTitle}>Error Loading Portfolio</h3>
                  <p style={styles.emptyDescription}>{portfolioError}</p>
                  <button onClick={fetchPortfolio} style={styles.retryBtn}>Retry</button>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                      <span style={styles.summaryLabel}>Total Invested</span>
                      <span style={styles.summaryValue}>{formatCurrency(portfolioSummary.total_invested)}</span>
                    </div>
                    <div style={styles.summaryCard}>
                      <span style={styles.summaryLabel}>Current Value</span>
                      <span style={styles.summaryValue}>{formatCurrency(portfolioSummary.current_value)}</span>
                    </div>
                    <div style={styles.summaryCard}>
                      <span style={styles.summaryLabel}>Total P&L</span>
                      <span style={{
                        ...styles.summaryValue,
                        color: portfolioSummary.total_pnl >= 0 ? '#059669' : '#dc2626',
                      }}>
                        {portfolioSummary.total_pnl >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.total_pnl)}
                      </span>
                    </div>
                  </div>

                  {/* Holdings Table */}
                  {holdings.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📋</div>
                      <h3 style={styles.emptyTitle}>No Holdings</h3>
                      <p style={styles.emptyDescription}>
                        You don't have any investments yet. Visit the Market tab to buy stocks.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.tableCard}>
                      <div style={styles.tableOverflow}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Symbol</th>
                              <th style={styles.th}>Name</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Qty</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Avg Buy Price</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Current Price</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Current Value</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>P&L</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>% Change</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {holdings.map((h) => {
                              const avgPrice = h.avg_buy_price || h.average_price || 0;
                              const curPrice = h.current_price || h.price || 0;
                              const qty = h.quantity || 0;
                              const currentValue = h.current_value || (curPrice * qty);
                              const pnl = h.pnl != null ? h.pnl : (currentValue - avgPrice * qty);
                              const pctChange = avgPrice > 0 ? ((curPrice - avgPrice) / avgPrice) * 100 : 0;
                              const isPositive = pnl >= 0;
                              return (
                                <tr key={h.id || h.symbol} style={styles.tr}>
                                  <td style={styles.td}>
                                    <span style={{ fontWeight: 700, color: '#111827' }}>{h.symbol}</span>
                                  </td>
                                  <td style={styles.td}>{h.name}</td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{qty}</td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(avgPrice)}</td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(curPrice)}</td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(currentValue)}</td>
                                  <td style={{
                                    ...styles.td,
                                    textAlign: 'right',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    color: isPositive ? '#059669' : '#dc2626',
                                  }}>
                                    {isPositive ? '+' : ''}{formatCurrency(pnl)}
                                  </td>
                                  <td style={{
                                    ...styles.td,
                                    textAlign: 'right',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    color: isPositive ? '#059669' : '#dc2626',
                                  }}>
                                    {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
                                  </td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <button
                                      onClick={() => openSellModal(h)}
                                      style={styles.sellBtn}
                                    >
                                      Sell
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── INVESTMENT ACCOUNT TAB ─── */}
          {activeTab === 'account' && (
            <div>
              {accountLoading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner} />
                  <span style={styles.loadingText}>Loading account...</span>
                </div>
              ) : accountError ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>⚠️</div>
                  <h3 style={styles.emptyTitle}>Error Loading Account</h3>
                  <p style={styles.emptyDescription}>{accountError}</p>
                  <button onClick={() => { fetchInvestmentAccount(); fetchInvestmentTransactions(); }} style={styles.retryBtn}>Retry</button>
                </div>
              ) : (
                <>
                  {/* Account Balance Card */}
                  <div style={styles.accountBalanceCard}>
                    <div style={styles.accountBalanceHeader}>
                      <div>
                        <div style={styles.accountBalanceLabel}>Investment Account Balance</div>
                        <div style={styles.accountBalanceValue}>
                          {formatCurrency(investmentAccount?.balance || investmentAccount?.available_balance || 0)}
                        </div>
                      </div>
                      <button onClick={openDepositModal} style={styles.depositBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Deposit from Bank
                      </button>
                    </div>
                    {investmentAccount && (
                      <div style={styles.accountMetaRow}>
                        <span style={styles.accountMetaItem}>
                          Account #: {investmentAccount.account_number || '—'}
                        </span>
                        <span style={styles.accountMetaItem}>
                          Status: <span style={{ color: '#059669', fontWeight: 600 }}>{investmentAccount.status || 'Active'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Transaction History */}
                  <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Transaction History</h2>
                  </div>

                  {transactionsLoading ? (
                    <div style={styles.loadingContainer}>
                      <div style={styles.spinner} />
                      <span style={styles.loadingText}>Loading transactions...</span>
                    </div>
                  ) : investmentTransactions.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📜</div>
                      <h3 style={styles.emptyTitle}>No Transactions</h3>
                      <p style={styles.emptyDescription}>
                        Your investment transaction history will appear here.
                      </p>
                    </div>
                  ) : (
                    <div style={styles.tableCard}>
                      <div style={styles.tableOverflow}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Type</th>
                              <th style={styles.th}>Symbol</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Quantity</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Price</th>
                              <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investmentTransactions.map((tx, idx) => {
                              const type = (tx.type || tx.transaction_type || '').toLowerCase();
                              const status = (tx.status || '').toLowerCase();
                              return (
                                <tr key={tx.id || idx} style={styles.tr}>
                                  <td style={styles.td}>{formatDate(tx.date || tx.created_at)}</td>
                                  <td style={styles.td}>
                                    <span style={{
                                      ...styles.typeBadge,
                                      backgroundColor: type === 'buy' ? '#eff6ff' : type === 'sell' ? '#fef2f2' : '#ecfdf5',
                                      color: type === 'buy' ? '#1a56db' : type === 'sell' ? '#dc2626' : '#059669',
                                    }}>
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </span>
                                  </td>
                                  <td style={styles.td}>
                                    <span style={{ fontWeight: 600 }}>{tx.symbol || '—'}</span>
                                  </td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                                    {tx.quantity || '—'}
                                  </td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                                    {tx.price != null ? formatCurrency(tx.price) : '—'}
                                  </td>
                                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {formatCurrency(tx.amount || 0)}
                                  </td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <span style={{
                                      ...styles.statusBadge,
                                      backgroundColor: status === 'completed' ? '#ecfdf5' : status === 'pending' ? '#fffbeb' : '#f9fafb',
                                      color: status === 'completed' ? '#059669' : status === 'pending' ? '#d97706' : '#6b7280',
                                    }}>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── BUY MODAL ─── */}
      {buyModal.open && buyModal.stock && (
        <div style={styles.modalOverlay} onClick={closeBuyModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Buy Stock</h2>
              <button onClick={closeBuyModal} style={styles.modalClose}>&times;</button>
            </div>
            <div style={styles.modalBody}>
              {/* Stock Info */}
              <div style={styles.modalStockInfo}>
                <div>
                  <span style={styles.modalStockSymbol}>{buyModal.stock.symbol}</span>
                  <span style={styles.modalStockName}>{buyModal.stock.name}</span>
                </div>
                <div style={styles.modalStockPrice}>
                  {formatCurrency(buyModal.stock.price || buyModal.stock.current_price || 0)}
                </div>
              </div>

              {/* Quantity Input */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  placeholder="Enter number of shares"
                  style={styles.formInput}
                />
              </div>

              {/* Account Selector */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Pay From Account</label>
                <select
                  value={buyAccountId}
                  onChange={(e) => setBuyAccountId(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="">Select bank account</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                      {acc.account_type || 'Account'} — {acc.account_number} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Cost */}
              <div style={styles.modalTotal}>
                <span style={styles.modalTotalLabel}>Estimated Total</span>
                <span style={styles.modalTotalValue}>{formatCurrency(buyTotal)}</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeBuyModal} style={styles.btnSecondary}>Cancel</button>
              <button
                onClick={handleBuy}
                disabled={buying || !buyQuantity || !buyAccountId}
                style={{
                  ...styles.btnPrimary,
                  opacity: (buying || !buyQuantity || !buyAccountId) ? 0.5 : 1,
                  cursor: (buying || !buyQuantity || !buyAccountId) ? 'not-allowed' : 'pointer',
                }}
              >
                {buying ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SELL MODAL ─── */}
      {sellModal.open && sellModal.holding && (
        <div style={styles.modalOverlay} onClick={closeSellModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Sell Stock</h2>
              <button onClick={closeSellModal} style={styles.modalClose}>&times;</button>
            </div>
            <div style={styles.modalBody}>
              {/* Holding Info */}
              <div style={styles.modalStockInfo}>
                <div>
                  <span style={styles.modalStockSymbol}>{sellModal.holding.symbol}</span>
                  <span style={styles.modalStockName}>{sellModal.holding.name}</span>
                </div>
                <div style={styles.modalStockPrice}>
                  {formatCurrency(sellModal.holding.current_price || sellModal.holding.price || 0)}
                </div>
              </div>

              <div style={styles.maxQtyRow}>
                <span style={styles.maxQtyLabel}>Shares owned:</span>
                <span style={styles.maxQtyValue}>{sellModal.holding.quantity}</span>
              </div>

              {/* Quantity Input */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Quantity to Sell</label>
                <input
                  type="number"
                  min="1"
                  max={sellModal.holding.quantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  placeholder={`Max: ${sellModal.holding.quantity}`}
                  style={styles.formInput}
                />
              </div>

              {/* Total Proceeds */}
              <div style={styles.modalTotal}>
                <span style={styles.modalTotalLabel}>Estimated Proceeds</span>
                <span style={styles.modalTotalValue}>{formatCurrency(sellTotal)}</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeSellModal} style={styles.btnSecondary}>Cancel</button>
              <button
                onClick={handleSell}
                disabled={selling || !sellQuantity}
                style={{
                  ...styles.btnSell,
                  opacity: (selling || !sellQuantity) ? 0.5 : 1,
                  cursor: (selling || !sellQuantity) ? 'not-allowed' : 'pointer',
                }}
              >
                {selling ? 'Processing...' : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DEPOSIT MODAL ─── */}
      {depositModal && (
        <div style={styles.modalOverlay} onClick={closeDepositModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Deposit to Investment Account</h2>
              <button onClick={closeDepositModal} style={styles.modalClose}>&times;</button>
            </div>
            <div style={styles.modalBody}>
              {/* Account Selector */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>From Bank Account</label>
                <select
                  value={depositAccountId}
                  onChange={(e) => setDepositAccountId(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="">Select bank account</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id || acc.account_number} value={acc.id || acc.account_number}>
                      {acc.account_type || 'Account'} — {acc.account_number} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeDepositModal} style={styles.btnSecondary}>Cancel</button>
              <button
                onClick={handleDeposit}
                disabled={depositing || !depositAmount || !depositAccountId}
                style={{
                  ...styles.btnPrimary,
                  opacity: (depositing || !depositAmount || !depositAccountId) ? 0.5 : 1,
                  cursor: (depositing || !depositAmount || !depositAccountId) ? 'not-allowed' : 'pointer',
                }}
              >
                {depositing ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function InvestmentsPageWithErrorBoundary() {
  return (
    <InvestmentErrorBoundary>
      <InvestmentsPage />
    </InvestmentErrorBoundary>
  );
}

const styles = {
  // Page
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

  // Header
  pageHeader: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },

  // Tabs
  tabBar: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  tab: {
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
  tabActive: {
    color: '#1a56db',
    borderBottomColor: '#1a56db',
    fontWeight: 600,
  },

  // Search
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '0 16px',
    marginBottom: '24px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    padding: '12px 0',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  searchClear: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
  },

  // Stock Grid
  stockGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  stockCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.15s',
  },
  stockCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockSymbol: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
  },
  stockName: {
    fontSize: '13px',
    color: '#6b7280',
  },
  stockPrice: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
  },
  stockMeta: {
    display: 'flex',
    gap: '16px',
    marginTop: '4px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metaLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  changeBadge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '6px',
  },
  buyBtn: {
    marginTop: '8px',
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#1a56db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },

  // Summary Cards
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  summaryLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },

  // Table
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  tableOverflow: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
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
  sellBtn: {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },

  // Type & Status Badges
  typeBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },

  // Section Header
  sectionHeader: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },

  // Account Balance Card
  accountBalanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '28px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  accountBalanceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  accountBalanceLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    marginBottom: '4px',
  },
  accountBalanceValue: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#111827',
  },
  depositBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#1a56db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  accountMetaRow: {
    display: 'flex',
    gap: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  accountMetaItem: {
    fontSize: '13px',
    color: '#6b7280',
  },

  // Loading & Empty
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#1a56db',
    borderRadius: '50%',
    animation: 'cp-inv-spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#6b7280',
  },
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
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 8px 0',
  },
  emptyDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    marginBottom: '16px',
  },
  retryBtn: {
    marginTop: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#1a56db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 24px',
    borderTop: '1px solid #f3f4f6',
    backgroundColor: '#f9fafb',
  },

  // Modal Stock Info
  modalStockInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
  },
  modalStockSymbol: {
    display: 'block',
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginRight: '8px',
  },
  modalStockName: {
    display: 'block',
    fontSize: '13px',
    color: '#6b7280',
  },
  modalStockPrice: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
  },

  // Max Quantity Row
  maxQtyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  maxQtyLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  maxQtyValue: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
  },

  // Modal Total
  modalTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
  },
  modalTotalLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  modalTotalValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
  },

  // Form
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
  formInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  formSelect: {
    width: '100%',
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
  },

  // Buttons
  btnPrimary: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#1a56db',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  btnSecondary: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  btnSell: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
};