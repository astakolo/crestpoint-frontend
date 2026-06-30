import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div style={styles.pageContainer}>
      <div style={styles.content}>
        <span style={styles.errorCode}>404</span>
        <h1 style={styles.heading}>Page Not Found</h1>
        <p style={styles.description}>
          Sorry, the page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the homepage.
        </p>
        <div style={styles.actions}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button size="lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go Home
            </Button>
          </Link>
        </div>
        <p style={styles.helpText}>
          If you believe this is an error, please{' '}
          <span style={styles.helpLink}>contact support</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '24px',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  content: {
    textAlign: 'center',
    maxWidth: '480px',
  },
  errorCode: {
    fontSize: '120px',
    fontWeight: 800,
    lineHeight: 1,
    color: '#e5e7eb',
    letterSpacing: '-0.05em',
    display: 'block',
    marginBottom: '16px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: '0 0 12px 0',
  },
  description: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '24px',
    margin: '0 0 32px 0',
  },
  actions: {
    marginBottom: '32px',
  },
  helpText: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0',
  },
  helpLink: {
    color: '#1a56db',
    cursor: 'pointer',
    fontWeight: 500,
  },
};
