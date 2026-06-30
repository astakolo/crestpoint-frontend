import React, { useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../../services/notificationService';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/constants';

const PAGE_SIZE = 20;

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'transaction', label: 'Transaction' },
  { key: 'security', label: 'Security' },
  { key: 'system', label: 'System' },
];

const TYPE_ICONS = {
  transaction: '💳',
  security: '🔒',
  system: '⚙️',
  account: '🏦',
  kyc: '📋',
  default: '📩',
};

const TYPE_COLORS = {
  transaction: { bg: '#eff6ff', border: '#bfdbfe' },
  security: { bg: '#fef2f2', border: '#fecaca' },
  system: { bg: '#f9fafb', border: '#e5e7eb' },
  account: { bg: '#ecfdf5', border: '#a7f3d0' },
  kyc: { bg: '#fffbeb', border: '#fde68a' },
  default: { bg: '#f3f4f6', border: '#e5e7eb' },
};

function getTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const autoRefreshRef = useRef(null);

  const fetchNotifications = useCallback(async (page = 1, tab = 'all') => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
      };
      if (tab === 'unread') params.unread = true;
      else if (tab !== 'all') params.type = tab;

      const data = await notificationService.getNotifications(params);
      const items = Array.isArray(data) ? data : data?.results || data?.data || [];
      setNotifications(items);
      setTotalCount(data?.count ?? items.length);

      // Also get unread count
      try {
        const unreadData = await notificationService.getUnreadCount();
        setUnreadCount(unreadData?.count ?? unreadData?.unread_count ?? 0);
      } catch {
        // Count from current list
        setUnreadCount(items.filter((n) => !n.read).length);
      }
    } catch (err) {
      // Silently fail for non-critical feature
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(currentPage, activeTab);
  }, [currentPage, activeTab, fetchNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      fetchNotifications(currentPage, activeTab);
    }, 30000);
    return () => clearInterval(autoRefreshRef.current);
  }, [currentPage, activeTab, fetchNotifications]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.read) return;
    try {
      await notificationService.markAsRead([notification.id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setExpandedId(expandedId === notification.id ? null : notification.id);
    if (!notification.read) {
      handleMarkAsRead(notification);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div style={styles.container}>
          {/* Page Header */}
          <div className="cp-notif-header" style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <h1 style={styles.pageTitle}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={styles.unreadBadge}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="secondary"
                size="sm"
                loading={markingAll}
              >
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="cp-notif-tabs" style={styles.tabsContainer}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.key ? styles.tabActive : {}),
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          {loading && notifications.length === 0 ? (
            <div style={styles.loadingContainer}>
              <LoadingSpinner text="Loading notifications..." />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="No Notifications"
              description={
                activeTab === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."
              }
            />
          ) : (
            <div style={styles.notificationList}>
              {notifications.map((notification) => {
                const isExpanded = expandedId === notification.id;
                const typeKey = notification.type?.toLowerCase() || 'default';
                const icon = TYPE_ICONS[typeKey] || TYPE_ICONS.default;
                const colors = TYPE_COLORS[typeKey] || TYPE_COLORS.default;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      ...styles.notificationItem,
                      backgroundColor: notification.read ? '#ffffff' : '#f8faff',
                      borderColor: isExpanded ? '#1a56db' : notification.read ? '#e5e7eb' : '#dbeafe',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div style={styles.notificationHeader}>
                      <div style={styles.notificationLeft}>
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div style={styles.unreadDot} />
                        )}

                        {/* Type icon */}
                        <div style={{
                          ...styles.typeIcon,
                          backgroundColor: colors.bg,
                          border: `1px solid ${colors.border}`,
                        }}>
                          <span style={{ fontSize: '16px' }}>{icon}</span>
                        </div>

                        <div style={styles.notificationContent}>
                          <div style={styles.notificationTitleRow}>
                            <span style={{
                              ...styles.notificationTitle,
                              fontWeight: notification.read ? 500 : 600,
                              color: notification.read ? '#374151' : '#111827',
                            }}>
                              {notification.title || notification.subject || 'Notification'}
                            </span>
                            <span style={styles.notificationTime}>
                              {getTimeAgo(notification.created_at)}
                            </span>
                          </div>
                          <p style={{
                            ...styles.notificationMessage,
                            color: notification.read ? '#9ca3af' : '#6b7280',
                          }}>
                            {notification.message || notification.body || notification.preview || ''}
                          </p>
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div style={{
                        ...styles.expandIcon,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={styles.expandedContent}>
                        {(notification.message || notification.body) && (
                          <p style={styles.expandedText}>
                            {notification.message || notification.body}
                          </p>
                        )}
                        <div style={styles.expandedMeta}>
                          {notification.created_at && (
                            <span style={styles.metaItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {formatDate(notification.created_at)}
                            </span>
                          )}
                          {notification.type && (
                            <span style={styles.metaTag}>
                              {notification.type}
                            </span>
                          )}
                        </div>
                        {!notification.read && (
                          <div style={{ marginTop: '12px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification);
                              }}
                              style={styles.markReadBtn}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#dbeafe';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }}
                            >
                              Mark as read
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={styles.paginationContainer}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          {/* Auto-refresh indicator */}
          <style>{`
            @keyframes lc-dotPulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
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
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  unreadBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#1a56db',
    color: '#ffffff',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid #e5e7eb',
  },
  tab: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 0',
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  notificationHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  notificationLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    flexShrink: 0,
    marginTop: '8px',
    animation: 'lc-dotPulse 2s ease-in-out infinite',
  },
  typeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    flexShrink: 0,
    marginTop: '2px',
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '4px',
  },
  notificationTitle: {
    fontSize: '14px',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  notificationTime: {
    fontSize: '12px',
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: '13px',
    margin: 0,
    lineHeight: '18px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  expandIcon: {
    flexShrink: 0,
    marginTop: '4px',
    transition: 'transform 0.2s',
  },
  expandedContent: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  expandedText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '22px',
    margin: '0 0 12px 0',
  },
  expandedMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '12px',
    color: '#9ca3af',
    display: 'inline-flex',
    alignItems: 'center',
  },
  metaTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  markReadBtn: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#1a56db',
    backgroundColor: '#eff6ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'Inter, -apple-system, sans-serif',
    transition: 'background-color 0.15s',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 0',
  },
};
