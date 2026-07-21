import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {/* Icon + Message */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}>
          {/* Warning/Info icon circle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: isDanger ? '#fef2f2' : '#eff6ff',
            color: isDanger ? '#dc2626' : '#1a56db',
            fontSize: '20px',
            flexShrink: 0,
            marginTop: '2px',
          }}>
            {isDanger ? '\u26A0' : '\u2139'}
          </div>

          <p style={{
            margin: 0,
            fontSize: '15px',
            lineHeight: '24px',
            color: '#374151',
          }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="md"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
