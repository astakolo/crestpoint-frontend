import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import cardService from '../../services/cardService';
import accountService from '../../services/accountService';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/constants';

const TABS = ['My Cards', 'New Card'];

const TX_STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669' },
  successful: { label: 'Successful', bg: '#ecfdf5', color: '#059669' },
  pending: { label: 'Pending', bg: '#fffbeb', color: '#d97706' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626' },
  declined: { label: 'Declined', bg: '#fef2f2', color: '#dc2626' },
};

export default function CardsPage() {
  const [activeTab, setActiveTab] = useState('My Cards');

  // Accounts
  const [accounts, setAccounts] = useState([]);

  // Cards state
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState('');

  // Selected card for transactions
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardTransactions, setCardTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Show Details Modal
  const [detailsCard, setDetailsCard] = useState(null);

  // Add Funds Modal
  const [fundCard, setFundCard] = useState(null);
  const [fundAccountId, setFundAccountId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);

  // New Card Form
  const [newAccount, setNewAccount] = useState('');
  const [newCardType, setNewCardType] = useState('virtual');
  const [newBrand, setNewBrand] = useState('visa');
  const [newLimit, setNewLimit] = useState('');
  const [creating, setCreating] = useState(false);

  // Freeze/Unfreeze loading map
  const [freezeLoading, setFreezeLoading] = useState({});

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

  // Fetch cards
  const fetchCards = useCallback(async () => {
    setLoadingCards(true);
    setCardsError('');
    try {
      const data = await cardService.getCards();
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setCards(items);
      // Auto-select first card
      if (items.length > 0 && !selectedCardId) {
        setSelectedCardId(items[0].id);
      }
    } catch (err) {
      setCardsError(err?.response?.data?.detail || err?.message || 'Failed to load cards');
    } finally {
      setLoadingCards(false);
    }
  }, [selectedCardId]);

  // Fetch card transactions
  const fetchCardTransactions = useCallback(async (cardId) => {
    if (!cardId) return;
    setLoadingTx(true);
    try {
      const data = await cardService.getCardTransactions(cardId);
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setCardTransactions(items);
    } catch {
      setCardTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'My Cards') fetchCards();
  }, [activeTab, fetchCards]);

  useEffect(() => {
    if (selectedCardId && activeTab === 'My Cards') {
      fetchCardTransactions(selectedCardId);
    }
  }, [selectedCardId, activeTab, fetchCardTransactions]);

  // Handle card select
  const handleSelectCard = (cardId) => {
    setSelectedCardId(cardId);
  };

  // Freeze / Unfreeze
  const handleToggleFreeze = async (card) => {
    const isFrozen = card.status === 'frozen' || card.is_frozen;
    const id = card.id;
    setFreezeLoading((prev) => ({ ...prev, [id]: true }));
    try {
      if (isFrozen) {
        await cardService.unfreezeCard(id);
        toast.success('Card unfrozen successfully');
      } else {
        await cardService.freezeCard(id);
        toast.success('Card frozen successfully');
      }
      fetchCards();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Action failed';
      toast.error(msg);
    } finally {
      setFreezeLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Add Funds
  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!fundAccountId) {
      toast.error('Please select an account');
      return;
    }
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setFunding(true);
    try {
      await cardService.addFunds(fundCard.id, {
        account: fundAccountId,
        amount: parseFloat(fundAmount),
      });
      toast.success('Funds added successfully');
      setFundCard(null);
      setFundAccountId('');
      setFundAmount('');
      fetchCards();
      if (selectedCardId) fetchCardTransactions(selectedCardId);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to add funds';
      toast.error(msg);
    } finally {
      setFunding(false);
    }
  };

  // Create Card
  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newAccount) {
      toast.error('Please select an account');
      return;
    }
    if (!newLimit || parseFloat(newLimit) <= 0) {
      toast.error('Please enter a valid spending limit');
      return;
    }

    setCreating(true);
    try {
      await cardService.createCard({
        account: newAccount,
        card_type: newCardType,
        brand: newBrand,
        spending_limit: parseFloat(newLimit),
      });
      toast.success('Card created successfully');
      setNewAccount('');
      setNewCardType('virtual');
      setNewBrand('visa');
      setNewLimit('');
      setActiveTab('My Cards');
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to create card';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  // Mask card number in groups
  const maskCardNumber = (number) => {
    if (!number) return '•••• •••• •••• ••••';
    const clean = number.replace(/\s/g, '');
    if (clean.length < 8) return number;
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const formatCardDisplay = (number) => {
    if (!number) return '•••• •••• •••• ••••';
    const clean = number.replace(/\s/g, '');
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const getExpiryDisplay = (card) => {
    if (card.expiry_month && card.expiry_year) {
      return `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`;
    }
    if (card.expiry_date) {
      const d = new Date(card.expiry_date);
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
    }
    return '12/28';
  };

  const getCardholderName = (card) => {
    return card.cardholder_name || card.holder_name || card.user_name || 'CARDHOLDER NAME';
  };

  const getTxStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    const cfg = TX_STATUS_CONFIG[st] || { label: status || 'Unknown', bg: '#f9fafb', color: '#6b7280' };
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

  const selectedCard = cards.find((c) => c.id === selectedCardId);

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
        <div className="cp-page-header" style={s.container}>
          {/* Page Header */}
          <h1 className="cp-page-title" style={s.pageTitle}>Cards</h1>
          <p style={s.pageDescription}>
            Manage your virtual and physical debit/credit cards.
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

          {/* Tab: My Cards */}
          {activeTab === 'My Cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {loadingCards ? (
                <div className="cp-card" style={s.card}>
                  <LoadingSpinner size="sm" text="Loading cards..." />
                </div>
              ) : cardsError ? (
                <div className="cp-card" style={s.card}>
                  <div style={s.errorBox}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{cardsError}</span>
                  </div>
                </div>
              ) : cards.length === 0 ? (
                <div className="cp-card" style={s.card}>
                  <div style={s.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>
                      No cards yet. Create your first card to get started.
                    </p>
                    <button
                      onClick={() => setActiveTab('New Card')}
                      style={s.primaryBtn}
                    >
                      Create New Card
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cards Grid */}
                  <div className="cp-cards-grid" style={s.cardsGrid}>
                    {cards.map((card) => {
                      const isFrozen = card.status === 'frozen' || card.is_frozen;
                      const isSelected = card.id === selectedCardId;
                      return (
                        <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Card Visual */}
                          <div
                            onClick={() => handleSelectCard(card.id)}
                            style={{
                              ...s.creditCard,
                              ...(isSelected ? s.creditCardSelected : {}),
                              ...(isFrozen ? s.creditCardFrozen : {}),
                              cursor: 'pointer',
                            }}
                          >
                            {/* Frozen overlay */}
                            {isFrozen && (
                              <div style={s.frozenOverlay}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>FROZEN</span>
                              </div>
                            )}

                            {/* Card Header: Bank Name */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.9)' }}>
                                CrestPoint Credit
                              </span>
                              {/* Chip icon */}
                              <div style={s.chip}>
                                <div style={{ width: '20px', height: '14px', borderRadius: '3px', border: '1.5px solid rgba(200,170,50,0.6)' }} />
                                <div style={{ width: '20px', height: '14px', borderRadius: '3px', border: '1.5px solid rgba(200,170,50,0.4)', position: 'absolute', top: '2px', left: '2px' }} />
                              </div>
                            </div>

                            {/* Card Number */}
                            <p style={s.cardNumber}>{maskCardNumber(card.card_number || card.number)}</p>

                            {/* Card Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                              <div>
                                <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Card Holder</p>
                                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 500, color: '#ffffff', letterSpacing: '0.5px' }}>
                                  {getCardholderName(card)}
                                </p>
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Expires</p>
                                <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                                  {getExpiryDisplay(card)}
                                </p>
                              </div>
                              <div>
                                <span style={{
                                  fontSize: '18px',
                                  fontWeight: 700,
                                  color: '#ffffff',
                                  letterSpacing: '1px',
                                }}>
                                  {(card.brand || 'visa').toUpperCase() === 'MASTERCARD' ? 'Mastercard' : 'VISA'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="cp-card-actions" style={s.cardActions}>
                            <button
                              onClick={() => setDetailsCard(card)}
                              style={s.cardActionBtn}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              Show Details
                            </button>
                            <button
                              onClick={() => handleToggleFreeze(card)}
                              disabled={freezeLoading[card.id]}
                              style={{
                                ...s.cardActionBtn,
                                ...(isFrozen ? { color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' } : { color: '#d97706', backgroundColor: '#fffbeb', borderColor: '#fde68a' }),
                              }}
                            >
                              {freezeLoading[card.id] ? (
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  border: '2px solid rgba(0,0,0,0.1)',
                                  borderTopColor: 'currentColor',
                                  borderRadius: '50%',
                                  animation: 'lc-spin 0.8s linear infinite',
                                }} />
                              ) : isFrozen ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                  <line x1="6" y1="1" x2="6" y2="4" />
                                  <line x1="10" y1="1" x2="10" y2="4" />
                                  <line x1="14" y1="1" x2="14" y2="4" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                              )}
                              {isFrozen ? 'Unfreeze' : 'Freeze'}
                            </button>
                            <button
                              onClick={() => {
                                setFundCard(card);
                                if (accounts.length > 0) {
                                  setFundAccountId(accounts[0].id || accounts[0].account_number);
                                }
                              }}
                              style={{ ...s.cardActionBtn, color: '#1a56db', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                              Add Funds
                            </button>
                          </div>

                          {/* Card Balance */}
                          <div style={{
                            textAlign: 'center',
                            padding: '8px 0',
                          }}>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Balance: </span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {formatCurrency(card.balance || 0, card.currency)}
                            </span>
                            {card.spending_limit && (
                              <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '12px' }}>
                                Limit: {formatCurrency(card.spending_limit, card.currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>

                  {/* Card Transactions */}
                  {selectedCard && (
                    <div className="cp-card" style={s.card}>
                      <h2 style={s.sectionTitle}>
                        Card Transactions
                        <span style={{ fontSize: '14px', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
                          — {maskCardNumber(selectedCard.card_number || selectedCard.number)}
                        </span>
                      </h2>

                      {loadingTx ? (
                        <LoadingSpinner size="sm" text="Loading transactions..." />
                      ) : cardTransactions.length === 0 ? (
                        <div style={s.emptyState}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                          </svg>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                            No transactions on this card yet.
                          </p>
                        </div>
                      ) : (
                        <div className="cp-table-wrapper" style={s.tableWrapper}>
                          <table style={s.table}>
                            <thead>
                              <tr>
                                <th style={s.th}>Date</th>
                                <th style={s.th}>Merchant</th>
                                <th style={s.th}>Amount</th>
                                <th style={s.th}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cardTransactions.map((tx, idx) => (
                                <tr key={tx.id || idx} style={s.tr}>
                                  <td style={s.td}>{formatDate(tx.created_at || tx.date)}</td>
                                  <td style={{ ...s.td, fontWeight: 500, color: '#111827' }}>
                                    {tx.merchant || tx.description || '—'}
                                  </td>
                                  <td style={{ ...s.td, fontWeight: 600, color: '#dc2626' }}>
                                    -{formatCurrency(tx.amount, tx.currency)}
                                  </td>
                                  <td style={s.td}>{getTxStatusBadge(tx.status)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: New Card */}
          {activeTab === 'New Card' && (
            <div className="cp-card" style={s.card}>
              <h2 style={s.sectionTitle}>Create New Card</h2>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', lineHeight: '20px' }}>
                Link a card to your account for online payments and in-store purchases.
              </p>

              <form onSubmit={handleCreateCard}>
                <div style={s.formGrid}>
                  {/* Account */}
                  <div>
                    <label style={labelStyle}>Account to Link *</label>
                    <select
                      value={newAccount}
                      onChange={(e) => setNewAccount(e.target.value)}
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

                  {/* Card Type */}
                  <div>
                    <label style={labelStyle}>Card Type</label>
                    <select
                      value={newCardType}
                      onChange={(e) => setNewCardType(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="virtual">Virtual Card</option>
                      <option value="physical">Physical Card</option>
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label style={labelStyle}>Brand</label>
                    <select
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                    </select>
                  </div>

                  {/* Spending Limit */}
                  <div>
                    <label style={labelStyle}>Spending Limit *</label>
                    <input
                      type="number"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      placeholder="e.g. 5000.00"
                      min="1"
                      step="0.01"
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Card Preview */}
                {newAccount && (
                  <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                    <p style={{ ...labelStyle, marginBottom: '12px' }}>Card Preview</p>
                    <div style={{
                      ...s.creditCard,
                      cursor: 'default',
                      maxWidth: '380px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px', color: 'rgba(255,255,255,0.9)' }}>
                          CrestPoint Credit
                        </span>
                        <div style={s.chip}>
                          <div style={{ width: '20px', height: '14px', borderRadius: '3px', border: '1.5px solid rgba(200,170,50,0.6)' }} />
                          <div style={{ width: '20px', height: '14px', borderRadius: '3px', border: '1.5px solid rgba(200,170,50,0.4)', position: 'absolute', top: '2px', left: '2px' }} />
                        </div>
                      </div>

                      <p style={s.cardNumber}>•••• •••• •••• ••••</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Card Type</p>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                            {newCardType === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Limit</p>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                            {newLimit ? formatCurrency(parseFloat(newLimit)) : '—'}
                          </p>
                        </div>
                        <div>
                          <span style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#ffffff',
                            letterSpacing: '1px',
                          }}>
                            {newBrand === 'mastercard' ? 'Mastercard' : 'VISA'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      ...s.primaryBtn,
                      opacity: creating ? 0.7 : 1,
                      cursor: creating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                    }}
                  >
                    {creating ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'lc-spin 0.8s linear infinite',
                        }} />
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        Create Card
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Show Details Modal */}
      <Modal
        isOpen={!!detailsCard}
        onClose={() => setDetailsCard(null)}
        title="Card Details"
        size="sm"
      >
        {detailsCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Warning */}
            <div style={s.detailWarning}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Keep your card details secure. Never share this information.</span>
            </div>

            {/* Full Card Number */}
            <div className="cp-detail-flex-row" style={s.detailRow}>
              <span style={s.detailLabel}>Card Number</span>
              <span style={s.detailValue}>{formatCardDisplay(detailsCard.card_number || detailsCard.number)}</span>
            </div>

            {/* CVV */}
            <div className="cp-detail-flex-row" style={s.detailRow}>
              <span style={s.detailLabel}>CVV</span>
              <span style={s.detailValue}>{detailsCard.cvv || '•••'}</span>
            </div>

            {/* Cardholder */}
            <div className="cp-detail-flex-row" style={s.detailRow}>
              <span style={s.detailLabel}>Cardholder Name</span>
              <span style={s.detailValue}>{getCardholderName(detailsCard)}</span>
            </div>

            {/* Expiry */}
            <div className="cp-detail-flex-row" style={s.detailRow}>
              <span style={s.detailLabel}>Expiry Date</span>
              <span style={s.detailValue}>{getExpiryDisplay(detailsCard)}</span>
            </div>

            {/* Brand */}
            <div className="cp-detail-flex-row" style={s.detailRow}>
              <span style={s.detailLabel}>Brand</span>
              <span style={s.detailValue}>{(detailsCard.brand || 'visa').toUpperCase()}</span>
            </div>

            {/* Type */}
            <div className="cp-detail-flex-row" style={s.detailRow}>
              <span style={s.detailLabel}>Card Type</span>
              <span style={s.detailValue}>{(detailsCard.card_type || 'virtual').charAt(0).toUpperCase() + (detailsCard.card_type || 'virtual').slice(1)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        isOpen={!!fundCard}
        onClose={() => { setFundCard(null); setFundAccountId(''); setFundAmount(''); }}
        title="Add Funds to Card"
        size="sm"
      >
        {fundCard && (
          <form onSubmit={handleAddFunds}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Fund from Account */}
              <div>
                <label style={labelStyle}>Fund From Account *</label>
                <select
                  value={fundAccountId}
                  onChange={(e) => setFundAccountId(e.target.value)}
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
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Current card balance */}
              <div style={s.fundInfoBox}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Current Card Balance</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                  {formatCurrency(fundCard.balance || 0, fundCard.currency)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => { setFundCard(null); setFundAccountId(''); setFundAmount(''); }}
                style={s.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={funding}
                style={{
                  ...s.primaryBtn,
                  opacity: funding ? 0.7 : 1,
                  cursor: funding ? 'not-allowed' : 'pointer',
                }}
              >
                {funding ? 'Processing...' : 'Add Funds'}
              </button>
            </div>
          </form>
        )}
      </Modal>
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
  // Credit Card Visual
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },
  creditCard: {
    width: '100%',
    maxWidth: '380px',
    height: '200px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 100%)',
    padding: '24px',
    boxSizing: 'border-box',
    color: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(26, 86, 219, 0.3)',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  creditCardSelected: {
    boxShadow: '0 0 0 3px #93c5fd, 0 4px 16px rgba(26, 86, 219, 0.3)',
  },
  creditCardFrozen: {
    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    boxShadow: '0 4px 16px rgba(107, 114, 128, 0.3)',
  },
  frozenOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: '16px',
    zIndex: 2,
  },
  chip: {
    width: '36px',
    height: '26px',
    backgroundColor: '#fbbf24',
    borderRadius: '6px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  cardNumber: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 500,
    letterSpacing: '3px',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    maxWidth: '380px',
  },
  cardActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
    whiteSpace: 'nowrap',
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
  // Details Modal
  detailWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    color: '#92400e',
    fontSize: '13px',
    lineHeight: '18px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
  },
  fundInfoBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
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