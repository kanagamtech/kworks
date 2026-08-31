import React, { useEffect, useState } from 'react';
import { ManagementPage } from './pages/ManagementPage';
import { HRPage } from './pages/HRPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPortal, setCurrentPortal] = useState<'management' | 'hr'>('management');

  // ── 20-Second Keep-Alive Heartbeat ──────────────────────────────────────────
  useEffect(() => {
    const rawUrl = ((import.meta as any).env?.VITE_API_URL || 'https://kworks-2q0c.onrender.com').trim().replace(/\/+$/, '');
    const healthUrl = `${rawUrl}/api/health`;
    const pulse = () => { fetch(healthUrl).catch(() => {}); };
    pulse();
    const interval = setInterval(pulse, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Portal Switcher Bar */}
      <div style={{ backgroundColor: 'rgba(26,9,22,0.95)', borderBottom: '1px solid #4A2040', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#D7AB6A' }}>KwOrKs Executive Portals</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #D7AB6A',
              backgroundColor: currentPortal === 'management' ? '#D7AB6A' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            onClick={() => setCurrentPortal('management')}
          >
            Management Portal
          </button>
          <button
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #D7AB6A',
              backgroundColor: currentPortal === 'hr' ? '#D7AB6A' : 'transparent',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            onClick={() => setCurrentPortal('hr')}
          >
            HR Portal
          </button>
        </div>
      </div>

      {/* Render Selected Portal */}
      <div style={{ flex: 1 }}>
        {currentPortal === 'management' ? <ManagementPage /> : <HRPage />}
      </div>
    </div>
  );
};
