import React, { useEffect } from 'react';
import { COLORS, themeStyles } from '../styles/theme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '640px',
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={themeStyles.modalOverlay} onClick={onClose}>
      <div
        style={{ ...themeStyles.modalCard, maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: COLORS.textDark, letterSpacing: '0.4px' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '22px',
              fontWeight: 800,
              color: COLORS.textMuted,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 8px',
            }}
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
