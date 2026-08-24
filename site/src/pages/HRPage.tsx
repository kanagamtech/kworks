import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export const HRPage: React.FC = () => {
  const [bName, setBName] = useState('');
  const [bMonth, setBMonth] = useState('');
  const [bDay, setBDay] = useState('');
  const [bPhoto, setBPhoto] = useState<string | null>(null);
  const [bStatus, setBStatus] = useState('');

  const [aName, setAName] = useState('');
  const [aMonth, setAMonth] = useState('');
  const [aDay, setADay] = useState('');
  const [aYear, setAYear] = useState('');
  const [aStatus, setAStatus] = useState('');

  const [nTitle, setNTitle] = useState('');
  const [nBody, setNBody] = useState('');
  const [nDate, setNDate] = useState('');
  const [nStatus, setNStatus] = useState('');

  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    api.getNotices().then(setNotices);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bMonth || !bDay) {
      setBStatus('Please enter employee name, month, and day.');
      return;
    }
    setBName(''); setBMonth(''); setBDay(''); setBPhoto(null);
    setBStatus('Birthday uploaded successfully!');
  };

  const handleSaveAnniversary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aName || !aMonth || !aDay || !aYear) {
      setAStatus('Please enter employee name and join date.');
      return;
    }
    setAName(''); setAMonth(''); setADay(''); setAYear('');
    setAStatus('Anniversary added successfully!');
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nTitle || !nBody) {
      setNStatus('Please enter title and message body.');
      return;
    }
    const newNotice = {
      id: `n${Date.now()}`,
      title: nTitle.trim(),
      body: nBody.trim(),
      date: nDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      team: 'ALL',
    };
    const updated = [newNotice, ...notices];
    await api.saveNotices(updated);
    setNotices(updated);
    setNTitle(''); setNBody(''); setNDate('');
    setNStatus('Information published successfully!');
  };

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.siteTitle}>KwOrKs HR &amp; Manager Portal</h1>
          <p style={styles.siteSub}>Upload birthday photos, work anniversaries, and HR notices</p>
        </div>
      </header>

      <div style={styles.colsTwo}>
        {/* Left Column */}
        <div style={styles.col}>
          {/* Birthday Form */}
          <div style={styles.panelCard}>
            <h3 style={styles.cardTitle}>BIRTHDAY — UPLOAD WITH PHOTO</h3>
            <form onSubmit={handleSaveBirthday}>
              <label style={styles.fieldLabel}>EMPLOYEE NAME</label>
              <input style={styles.fieldInput} value={bName} onChange={(e) => setBName(e.target.value)} placeholder="e.g. Suresh Kumar" />

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>MONTH</label>
                  <input type="number" min="1" max="12" style={styles.fieldInput} value={bMonth} onChange={(e) => setBMonth(e.target.value)} placeholder="e.g. 8" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>DAY</label>
                  <input type="number" min="1" max="31" style={styles.fieldInput} value={bDay} onChange={(e) => setBDay(e.target.value)} placeholder="e.g. 14" />
                </div>
              </div>

              <label style={styles.fieldLabel}>PHOTO</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={styles.fileBtn} />
              {bPhoto && <img src={bPhoto} alt="" style={styles.photoPreview} />}

              {bStatus && <p style={styles.statusOkText}>{bStatus}</p>}
              <button type="submit" style={styles.btnPrimary}>Upload Birthday</button>
            </form>
          </div>

          {/* Work Anniversary Form */}
          <div style={styles.panelCard}>
            <h3 style={styles.cardTitle}>WORK ANNIVERSARY</h3>
            <form onSubmit={handleSaveAnniversary}>
              <label style={styles.fieldLabel}>EMPLOYEE NAME</label>
              <input style={styles.fieldInput} value={aName} onChange={(e) => setAName(e.target.value)} placeholder="e.g. Lakshmi Devi" />

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>JOIN MONTH</label>
                  <input type="number" min="1" max="12" style={styles.fieldInput} value={aMonth} onChange={(e) => setAMonth(e.target.value)} placeholder="e.g. 8" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>JOIN DAY</label>
                  <input type="number" min="1" max="31" style={styles.fieldInput} value={aDay} onChange={(e) => setADay(e.target.value)} placeholder="e.g. 21" />
                </div>
              </div>

              <label style={styles.fieldLabel}>JOIN YEAR</label>
              <input type="number" min="1990" max="2030" style={styles.fieldInput} value={aYear} onChange={(e) => setAYear(e.target.value)} placeholder="e.g. 2019" />

              {aStatus && <p style={styles.statusOkText}>{aStatus}</p>}
              <button type="submit" style={styles.btnPrimary}>Add Anniversary</button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.col}>
          <div style={styles.panelCard}>
            <h3 style={styles.cardTitle}>HR &amp; MANAGER INFORMATION</h3>
            <form onSubmit={handlePublishNotice}>
              <label style={styles.fieldLabel}>TITLE</label>
              <input style={styles.fieldInput} value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="e.g. Medical insurance renewal" />

              <label style={styles.fieldLabel}>MESSAGE</label>
              <textarea style={{ ...styles.fieldInput, height: '80px' }} value={nBody} onChange={(e) => setNBody(e.target.value)} placeholder="Write message..." />

              <label style={styles.fieldLabel}>DATE</label>
              <input style={styles.fieldInput} value={nDate} onChange={(e) => setNDate(e.target.value)} placeholder="e.g. Aug 20, 2026" />

              {nStatus && <p style={styles.statusOkText}>{nStatus}</p>}
              <button type="submit" style={styles.btnPrimary}>Publish Information</button>
            </form>

            <h4 style={{ ...styles.listTitle, marginTop: '20px' }}>PUBLISHED INFORMATION</h4>
            {notices.map((n) => (
              <div key={n.id} style={styles.listRow}>
                <div style={{ flex: 1 }}>
                  <div style={styles.empName}>{n.title}</div>
                  <div style={styles.empSub}>{n.body} &middot; {n.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: { padding: '18px', maxWidth: '1240px', margin: '0 auto' },
  header: { marginBottom: '20px' },
  siteTitle: { fontSize: '22px', fontWeight: 800, letterSpacing: '1.5px', color: '#FFFFFF' },
  siteSub: { color: '#E5D4B8', fontSize: '12px', marginTop: '3px' },
  colsTwo: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  col: { flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' },
  panelCard: { backgroundColor: '#FFFFFF', border: '2px solid #D7AB6A', borderRadius: '18px', padding: '22px', color: '#2B1022' },
  cardTitle: { fontSize: '14px', fontWeight: 800, color: '#2B1022', marginBottom: '12px', letterSpacing: '0.8px' },
  fieldLabel: { display: 'block', fontSize: '11px', fontWeight: 800, color: '#9C7B4E', marginTop: '10px', marginBottom: '4px', letterSpacing: '0.5px' },
  fieldInput: { width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #D7AB6A', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', color: '#2B1022' },
  fileBtn: { width: '100%', marginTop: '6px', color: '#2B1022' },
  photoPreview: { width: '64px', height: '64px', borderRadius: '32px', marginTop: '10px', display: 'block' },
  btnPrimary: { width: '100%', backgroundColor: '#D7AB6A', border: 'none', borderRadius: '10px', color: '#2B1022', fontSize: '13px', fontWeight: 800, padding: '12px', cursor: 'pointer', marginTop: '16px' },
  statusOkText: { color: '#2B1022', fontSize: '12.5px', fontWeight: 800, marginTop: '8px' },
  listTitle: { fontSize: '12px', fontWeight: 800, letterSpacing: '1.2px', color: '#D7AB6A', margin: '18px 0 8px' },
  listRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #E5D4B8', fontSize: '13px' },
  empName: { fontWeight: 800, color: '#2B1022', fontSize: '13px' },
  empSub: { color: '#9C7B4E', fontSize: '11.5px', marginTop: '2px' },
};
