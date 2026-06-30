import React, { useMemo } from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = useMemo(() => {
    const items = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
      return items;
    }

    // Always show first page
    items.push(1);

    if (currentPage > 3) {
      items.push('start-ellipsis');
    }

    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (currentPage < totalPages - 2) {
      items.push('end-ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    height: '36px',
    padding: '0 8px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, -apple-system, sans-serif',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s, color 0.15s',
  };

  const btnHover = {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  };

  const btnActive = {
    backgroundColor: '#1a56db',
    borderColor: '#1a56db',
    color: '#ffffff',
  };

  const btnDisabled = {
    opacity: 0.4,
    cursor: 'not-allowed',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    color: '#9ca3af',
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
      aria-label="Pagination"
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        style={{
          ...btnBase,
          ...(currentPage <= 1 ? btnDisabled : {}),
        }}
        onMouseEnter={(e) => {
          if (currentPage > 1) {
            Object.assign(e.currentTarget.style, btnHover);
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage > 1) {
            Object.assign(e.currentTarget.style, btnBase);
          }
        }}
        aria-label="Previous page"
      >
        &#8249;
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === 'start-ellipsis' || page === 'end-ellipsis') {
          return (
            <span
              key={page}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                color: '#6b7280',
                fontSize: '14px',
                userSelect: 'none',
              }}
            >
              &hellip;
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page)}
            style={{
              ...btnBase,
              ...(isActive ? btnActive : {}),
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                Object.assign(e.currentTarget.style, btnHover);
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                Object.assign(e.currentTarget.style, btnBase);
              }
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        style={{
          ...btnBase,
          ...(currentPage >= totalPages ? btnDisabled : {}),
        }}
        onMouseEnter={(e) => {
          if (currentPage < totalPages) {
            Object.assign(e.currentTarget.style, btnHover);
          }
        }}
        onMouseLeave={(e) => {
          if (currentPage < totalPages) {
            Object.assign(e.currentTarget.style, btnBase);
          }
        }}
        aria-label="Next page"
      >
        &#8250;
      </button>
    </nav>
  );
}
