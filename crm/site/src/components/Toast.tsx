import React from 'react';
import { COLORS } from '../styles/theme';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
      }}
    >
      {toasts.map((t) => {
        const bg =
          t.type === 'success' ? '#2E8B57' :
          t.type === 'error' ? '#E05050' :
          t.type === 'warning' ? '#D7AB6A' : '#3B82F6';

        const icon =
          t.type === 'success' ? '✅' :
          t.type === 'error' ? '❌' :
          t.type === 'warning' ? '⚠️' : '⚡';

        return (
          <div
            key={t.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderLeft: `6px solid ${bg}`,
              borderTop: `1px solid ${COLORS.borderGoldLight}`,
              borderRight: `1px solid ${COLORS.borderGoldLight}`,
              borderBottom: `1px solid ${COLORS.borderGoldLight}`,
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: COLORS.textDark,
              animation: 'slideIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: '18px', marginTop: '2px' }}>{icon}</span>
            <div style={{ flex: 1 }}>
              {t.title && (
                <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, marginBottom: '2px' }}>
                  {t.title}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#444', lineHeight: 1.4 }}>
                {t.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
