import React, { useEffect, useCallback, useRef } from 'react';

const sizeMap = {
  sm: '400px',
  md: '600px',
  lg: '800px',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  }, [onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      onClose?.();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        animation: 'lc-fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: sizeMap[size] || sizeMap.md,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '16px',
          animation: 'lc-scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes lc-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lc-scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
