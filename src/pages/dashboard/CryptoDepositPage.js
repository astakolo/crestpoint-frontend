import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import cryptoService from '../../services/cryptoService';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/constants';

const CRYPTO_RATES = {
  BTC: 67500,
  ETH: 3450,
  USDT: 1,
};

const WALLET_ADDRESSES = [
  {
    crypto: 'BTC',
    label: 'Bitcoin (BTC)',
    icon: '\u20BF',
    network: 'Bitcoin Network',
    color: '#f59e0b',
    bg: '#fffbeb',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    warning: 'Only send BTC to this address. Sending any other asset may result in permanent loss.',
  },
  {
    crypto: 'ETH',
    label: 'Ethereum (ETH)',
    icon: '\u039E',
    network: 'ERC-20',
    color: '#6366f1',
    bg: '#eef2ff',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    warning: 'Only send ETH to this address. Do not send ERC-20 tokens unless specified.',
  },
  {
    crypto: 'USDT',
    label: 'Tether (USDT)',
    icon: '\u20AE',
    network: 'TRC-20',
    color: '#059669',
    bg: '#ecfdf5',
    address: 'TN2YqRhkJo8K6EvKqLzGenzFDLvxk4cJqB',
    warning: 'Only send USDT (TRC-20) to this address. Ensure you select TRC-20 network on your wallet.',
  },
];

const CRYPTO_OPTIONS = [
  { value: 'BTC', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'ETH', label: 'Ethereum (ETH)', icon: 'Ξ' },
  { value: 'USDT', label: 'Tether (USDT)', icon: '₮' },
];

const TABS = ['Wallet', 'Deposit', 'Withdraw', 'Deposit History'];

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669' },
  confirmed: { label: 'Confirmed', bg: '#ecfdf5', color: '#059669' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706' },
  processing: { label: 'Processing', bg: '#eff6ff', color: '#1a56db' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626' },
  rejected: { label: 'Rejected', bg: '#fef2f2', color: '#dc2626' },
  expired: { label: 'Expired', bg: '#fef2f2', color: '#dc2626' },
};

export default function CryptoDepositPage() {
  const [activeTab, setActiveTab] = useState('Wallet');

  // Wallet state
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState('');

  // Deposit form state
  const [crypto, setCrypto] = useState('BTC');
  const [usdAmount, setUsdAmount] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Deposit history state
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState('');

  const screenshotRef = useRef(null);

  // Withdrawal state
  const [withdrawCrypto, setWithdrawCrypto] = useState('BTC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Fetch wallet
  const fetchWallet = useCallback(async () => {
    setLoadingWallet(true);
    setWalletError('');
    try {
      const data = await cryptoService.getWallet();
      setWallet(data);
    } catch (err) {
      setWalletError(err?.response?.data?.detail || err?.message || 'Failed to load wallet');
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    setTxError('');
    try {
      const data = await cryptoService.getTransactions();
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setTransactions(items);
    } catch (err) {
      setTxError(err?.response?.data?.detail || err?.message || 'Failed to load transactions');
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Wallet' || activeTab === 'Withdraw') fetchWallet();
    if (activeTab === 'Deposit History') fetchTransactions();
  }, [activeTab, fetchWallet, fetchTransactions]);

  // Estimated crypto amount
  const estimatedCrypto = usdAmount && parseFloat(usdAmount) > 0
    ? (parseFloat(usdAmount) / CRYPTO_RATES[crypto]).toFixed(
        crypto === 'BTC' ? 8 : crypto === 'ETH' ? 6 : 2
      )
    : '0';

  const selectedCrypto = CRYPTO_OPTIONS.find((c) => c.value === crypto);

  // Handle screenshot
  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Copy wallet address
  const copyAddress = () => {
    const addr = wallet?.address || '';
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => {
      toast.success('Address copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy address');
    });
  };

  // Submit deposit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usdAmount || parseFloat(usdAmount) <= 0) {
      toast.error('Please enter a valid USD amount');
      return;
    }

    setSubmitting(true);
    try {
      if (screenshot) {
        const formData = new FormData();
        formData.append('crypto_currency', crypto);
        formData.append('usd_amount', usdAmount);
        formData.append('screenshot', screenshot);
        await cryptoService.createDeposit(formData);
      } else {
        await cryptoService.createDeposit({
          crypto_currency: crypto,
          usd_amount: parseFloat(usdAmount),
        });
      }

      toast.success('Crypto deposit submitted successfully');
      setUsdAmount('');
      setScreenshot(null);
      setScreenshotPreview(null);
      if (screenshotRef.current) screenshotRef.current.value = '';
      fetchWallet();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Deposit failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid crypto amount');
      return;
    }
    if (!withdrawDest.trim()) {
      toast.error('Please enter a destination wallet address');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      await cryptoService.createWithdrawal({
        crypto_currency: withdrawCrypto,
        amount: parseFloat(withdrawAmount),
        destination_address: withdrawDest.trim(),
      });
      toast.success('Crypto withdrawal submitted successfully');
      setWithdrawAmount('');
      setWithdrawDest('');
      fetchWallet();
      fetchTransactions();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Withdrawal failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmittingWithdraw(false);
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

  const truncateHash = (hash) => {
    if (!hash) return '—';
    return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;
  };

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.container}>
          {/* Page Header */}
          <h1 className="cp-page-title" style={s.pageTitle}>Crypto</h1>
          <p style={s.pageDescription}>
            Deposit and withdraw cryptocurrency from your CrestPoint Credit account.
          </p>

          {/* Tabs */}
          <div className="cp-tab-bar" style={s.tabBar}>
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

          {/* Tab: Wallet */}
          {activeTab === 'Wallet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Wallet Info Card */}
              {loadingWallet ? (
                <div style={s.card}>
                  <LoadingSpinner size="sm" text="Loading wallet..." />
                </div>
              ) : walletError ? (
                <div style={s.card}>
                  <div style={s.errorBox}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{walletError}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main wallet balance card */}
                  <div style={s.walletCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <p style={s.walletLabel}>Wallet Address</p>
                        <div style={s.addressRow}>
                          <span style={s.addressText}>{wallet?.address || 'N/A'}</span>
                          <button onClick={copyAddress} style={s.copyBtn} title="Copy address">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {wallet?.currency && (
                        <span style={s.walletCurrencyBadge}>
                          {wallet.currency}
                        </span>
                      )}
                    </div>

                    <div style={s.walletBalanceRow}>
                      <p style={s.walletLabel}>Balance</p>
                      <p style={s.walletBalance}>
                        {formatCurrency(wallet?.balance || 0, wallet?.currency || 'USD')}
                      </p>
                    </div>
                  </div>

                  {/* Deposit Wallet Addresses */}
                  <div className="cp-card" style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 20px 0' }}>
                      Deposit Wallet Addresses
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '20px' }}>
                      Send cryptocurrency to the appropriate address below. Only send the correct crypto type to each address.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {WALLET_ADDRESSES.map((wa) => (
                        <div key={wa.crypto} style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '10px',
                          border: '1px solid #e5e7eb',
                          padding: '16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '20px' }}>{wa.icon}</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{wa.label}</span>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, color: wa.color,
                              backgroundColor: wa.bg, padding: '2px 8px',
                              borderRadius: '100px', marginLeft: 'auto',
                            }}>{wa.network}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '13px', fontFamily: 'monospace', color: '#374151',
                              wordBreak: 'break-all', lineHeight: '20px', flex: 1,
                            }}>{wa.address}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(wa.address).then(() => {
                                  toast.success(`${wa.crypto} address copied`);
                                }).catch(() => {
                                  toast.error('Failed to copy address');
                                });
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '32px', height: '32px', borderRadius: '8px',
                                border: '1px solid #d1d5db', backgroundColor: '#ffffff',
                                color: '#6b7280', cursor: 'pointer', flexShrink: 0,
                                transition: 'all 0.15s',
                              }}
                              title={`Copy ${wa.crypto} address`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                          </div>
                          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '8px 0 0 0' }}>
                            {wa.warning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Deposit */}
          {activeTab === 'Deposit' && (
            <div className="cp-card" style={s.card}>
              <h2 style={s.sectionTitle}>New Deposit</h2>

              {/* Show selected crypto deposit address */}
              <div style={{
                backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '10px', padding: '14px 16px', marginBottom: '20px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                    Send {crypto} to this address:
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, color: '#059669',
                    backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '100px',
                  }}>
                    {WALLET_ADDRESSES.find(w => w.crypto === crypto)?.network}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px', fontFamily: 'monospace', color: '#374151',
                    wordBreak: 'break-all', lineHeight: '18px', flex: 1,
                  }}>
                    {WALLET_ADDRESSES.find(w => w.crypto === crypto)?.address}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const addr = WALLET_ADDRESSES.find(w => w.crypto === crypto)?.address;
                      if (addr) {
                        navigator.clipboard.writeText(addr).then(() => {
                          toast.success(`${crypto} address copied`);
                        }).catch(() => {});
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '30px', height: '30px', borderRadius: '6px',
                      border: '1px solid #86efac', backgroundColor: '#ffffff',
                      color: '#059669', cursor: 'pointer', flexShrink: 0,
                    }}
                    title="Copy address"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                  {/* Crypto Currency Selection */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={s.label}>Crypto Currency</label>
                    <div className="cp-crypto-grid" style={s.cryptoGrid}>
                      {CRYPTO_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCrypto(opt.value)}
                          style={{
                            ...s.cryptoOption,
                            ...(crypto === opt.value ? s.cryptoOptionActive : {}),
                          }}
                        >
                          <span style={{ fontSize: '20px', lineHeight: 1 }}>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* USD Amount */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={s.label}>Amount in USD</label>
                    <div style={s.inputPrefixWrapper}>
                      <span style={s.inputPrefix}>$</span>
                      <input
                        type="number"
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        style={s.inputWithPrefix}
                      />
                    </div>
                  </div>

                  {/* Estimated Crypto */}
                  {usdAmount && parseFloat(usdAmount) > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={s.label}>Estimated {crypto} Amount</label>
                      <div style={s.estimatedBox}>
                        <span style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                          {estimatedCrypto} <span style={{ fontSize: '16px', fontWeight: 500, color: '#6b7280' }}>{crypto}</span>
                        </span>
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Rate: 1 {crypto} = {formatCurrency(CRYPTO_RATES[crypto])} USD
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Screenshot */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={s.label}>Payment Screenshot <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                    {screenshotPreview ? (
                      <div style={s.previewContainer}>
                        <img src={screenshotPreview} alt="Payment screenshot" style={s.previewImage} />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotPreview(null);
                            if (screenshotRef.current) screenshotRef.current.value = '';
                          }}
                          style={s.previewRemove}
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <label style={s.fileUploadBox}>
                        <input
                          ref={screenshotRef}
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshot}
                          style={{ display: 'none' }}
                        />
                        <div style={{ textAlign: 'center' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Upload payment screenshot</p>
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>PNG, JPG, WEBP</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Deposit Summary */}
                  {usdAmount && parseFloat(usdAmount) > 0 && (
                    <div style={s.summaryCard}>
                      <h3 style={s.summaryTitle}>Deposit Summary</h3>
                      <div style={s.summaryRow}>
                        <span style={s.summaryLabel}>Currency</span>
                        <span style={s.summaryValue}>{selectedCrypto?.label}</span>
                      </div>
                      <div style={s.summaryRow}>
                        <span style={s.summaryLabel}>USD Amount</span>
                        <span style={s.summaryValue}>{formatCurrency(parseFloat(usdAmount))}</span>
                      </div>
                      <div style={s.summaryRow}>
                        <span style={s.summaryLabel}>Estimated {crypto}</span>
                        <span style={s.summaryValue}>{estimatedCrypto} {crypto}</span>
                      </div>
                      <div style={s.summaryRow}>
                        <span style={s.summaryLabel}>Screenshot</span>
                        <span style={s.summaryValue}>{screenshot ? 'Attached' : 'Not attached'}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          Submit Deposit
                        </>
                      )}
                    </button>
                    <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                </form>
              </div>
          )}

          {/* Tab: Withdraw */}
          {activeTab === 'Withdraw' && (
            <div className="cp-card" style={s.card}>
              {loadingWallet ? (
                <LoadingSpinner size="sm" text="Loading..." />
              ) : (
                <form onSubmit={handleWithdraw} style={s.form}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={s.label}>Select Cryptocurrency</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {CRYPTO_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setWithdrawCrypto(opt.value)}
                          style={{
                            flex: 1,
                            minWidth: '120px',
                            padding: '14px 16px',
                            borderRadius: '10px',
                            border: withdrawCrypto === opt.value ? '2px solid #1a56db' : '1px solid #e5e7eb',
                            backgroundColor: withdrawCrypto === opt.value ? '#eff6ff' : '#ffffff',
                            color: withdrawCrypto === opt.value ? '#1a56db' : '#374151',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={s.fieldGroup}>
                    <label style={s.label}>Amount ({withdrawCrypto})</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      style={s.input}
                      required
                    />
                    {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0' }}>
                        Estimated USD value: ${(parseFloat(withdrawAmount) * CRYPTO_RATES[withdrawCrypto]).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div style={s.fieldGroup}>
                    <label style={s.label}>Destination Wallet Address</label>
                    <input
                      type="text"
                      value={withdrawDest}
                      onChange={(e) => setWithdrawDest(e.target.value)}
                      style={s.input}
                      placeholder="0x..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingWithdraw}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: submittingWithdraw ? '#9ca3af' : '#1a56db',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: submittingWithdraw ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    {submittingWithdraw ? 'Submitting...' : 'Submit Withdrawal'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tab: Deposit History */}
          {activeTab === 'Deposit History' && (
            <div className="cp-card" style={s.card}>
              {loadingTx ? (
                <LoadingSpinner size="sm" text="Loading transactions..." />
              ) : txError ? (
                <div style={s.errorBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{txError}</span>
                </div>
              ) : transactions.length === 0 ? (
                <div style={s.emptyState}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    No crypto deposits yet. Make your first deposit to get started.
                  </p>
                </div>
              ) : (
                <div className="cp-table-wrapper" style={s.tableWrapper}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Date</th>
                        <th style={s.th}>Reference</th>
                        <th style={s.th}>Crypto</th>
                        <th style={s.th}>Amount</th>
                        <th style={s.th}>USD Amount</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>TX Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={tx.id || idx} style={s.tr}>
                          <td style={s.td}>{formatDate(tx.created_at || tx.date)}</td>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px' }}>
                            {tx.reference || tx.id || '—'}
                          </td>
                          <td style={s.td}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>
                              {tx.crypto_currency || tx.currency || '—'}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontWeight: 600, color: '#111827' }}>
                            {tx.crypto_amount != null ? `${tx.crypto_amount} ${tx.crypto_currency || ''}` : '—'}
                          </td>
                          <td style={{ ...s.td, fontWeight: 600, color: '#111827' }}>
                            {formatCurrency(tx.usd_amount || tx.amount, 'USD')}
                          </td>
                          <td style={s.td}>{getStatusBadge(tx.status)}</td>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '13px', color: '#1a56db' }}>
                            {tx.tx_hash ? (
                              <span title={tx.tx_hash}>{truncateHash(tx.tx_hash)}</span>
                            ) : '—'}
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
  // Wallet card
  walletCard: {
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    borderRadius: '12px',
    padding: '24px',
    color: '#ffffff',
  },
  walletLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 6px 0',
  },
  addressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  addressText: {
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#ffffff',
    wordBreak: 'break-all',
    lineHeight: '20px',
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.15s',
  },
  walletCurrencyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
  },
  walletBalanceRow: {
    borderTop: '1px solid rgba(255,255,255,0.2)',
    paddingTop: '16px',
  },
  walletBalance: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  // Form elements
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  },
  cryptoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  cryptoOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 12px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  cryptoOptionActive: {
    border: '2px solid #1a56db',
    backgroundColor: '#eff6ff',
    color: '#1a56db',
  },
  inputPrefixWrapper: {
    position: 'relative',
  },
  inputPrefix: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
    fontWeight: 600,
    color: '#6b7280',
    zIndex: 1,
  },
  inputWithPrefix: {
    width: '100%',
    padding: '10px 14px 10px 30px',
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
  estimatedBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  },
  fileUploadBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100px',
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
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: '140px',
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
  summaryCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '16px',
  },
  summaryTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 12px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#111827',
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