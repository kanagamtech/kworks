import React, { useState, useEffect } from 'react';
import { Quotation, Deal, Contact, Company } from '../types/crm';
import { COLORS, themeStyles, formatINR } from '../styles/theme';
import { INDIAN_STATES, detectStateFromText } from '../utils/gstHelper';
import { InvoiceDocumentPreview, InvoiceData } from '../components/InvoiceDocumentPreview';

interface QuotationsPageProps {
  quotes: Quotation[];
  deals: Deal[];
  contacts: Contact[];
  companies: Company[];
  onCreateQuote: (quote: Partial<Quotation>) => Promise<void>;
  onUpdateQuote: (id: string, updates: Partial<Quotation>) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  onSendQuoteEmail: (id: string) => Promise<void>;
  onAcceptQuote: (id: string) => Promise<void>;
}

export const QuotationsPage: React.FC<QuotationsPageProps> = ({
  quotes,
  deals,
  contacts,
  companies,
  onCreateQuote,
  onUpdateQuote,
  onDeleteQuote,
  onSendQuoteEmail,
  onAcceptQuote,
}) => {
  // Navigation View: 'builder' | 'list'
  const [activeView, setActiveView] = useState<'builder' | 'list'>('builder');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Loading States
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Form State: Document Type & Header
  const [invoiceType, setInvoiceType] = useState<'Proforma Invoice' | 'Quotation' | 'Tax Invoice' | 'Commercial Estimate'>('Proforma Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState('QM/26-27/024');
  const [quoteDate, setQuoteDate] = useState('25/08/2026');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra (27)');
  const [isInterState, setIsInterState] = useState(true);

  // Form State: Company / Issuer Details (Default QUANTUMMATE)
  const [companyName, setCompanyName] = useState('QUANTUMMATE India Private Limited');
  const [companyId, setCompanyId] = useState('U62099TZ2025PTC036070');
  const [companyAddress, setCompanyAddress] = useState(
    'Flat No : 758/2 , 759/2A, Site No: 88- 90, Covai Tech Park\nKovai Thirunagar, Kalapatty\nCoimbatore Tamil Nadu 641014\nIndia'
  );
  const [companyGstin, setCompanyGstin] = useState('33AABCQ1679F1ZJ');
  const [companyPhone, setCompanyPhone] = useState('9944888342');
  const [companyEmail, setCompanyEmail] = useState('quantummateindia@gmail.com');
  const [companyWebsite, setCompanyWebsite] = useState('https://quantummate.in/');

  // Form State: Bill To
  const [billToName, setBillToName] = useState('Phiroj Kalal');
  const [billToCompany, setBillToCompany] = useState('Greysim Learnings Foundation, Mumbai,');
  const [billToAddress, setBillToAddress] = useState('C-119,Kailas Industrial Complex,\nVeer Savarkar Marg, Vikhroli -West,');
  const [billToCityState, setBillToCityState] = useState('Mumbai, 400079 Maharashtra');
  const [billToCountry, setBillToCountry] = useState('India');

  // Form State: Ship To
  const [sameAsBillTo, setSameAsBillTo] = useState(true);
  const [shipToName, setShipToName] = useState('Phiroj Kalal');
  const [shipToCompany, setShipToCompany] = useState('Greysim Learnings Foundation, Mumbai,');
  const [shipToAddress, setShipToAddress] = useState('C-119, Kailas Industrial Complex,\nVeer Savarkar Marg, Vikhroli -West,');
  const [shipToCityState, setShipToCityState] = useState('Mumbai, 400079 Maharashtra');
  const [shipToCountry, setShipToCountry] = useState('India');

  // Form State: Line Items (Default sample matching user's invoice)
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unit: string; rate: number; amount: number }>>([
    {
      description: 'QM Multi MCU IoT Kit',
      quantity: 2,
      unit: 'NOS',
      rate: 40500,
      amount: 81000,
    },
  ]);

  // Form State: Bank Details (Fixed Defaults & Editable)
  const [bankName, setBankName] = useState('ICICI BANK');
  const [accountName, setAccountName] = useState('QUANTUMMATE India Pvt Ltd');
  const [accountNumber, setAccountNumber] = useState('728405001137');
  const [ifscCode, setIfscCode] = useState('ICIC0007284');

  // Form State: Terms & Conditions
  const [terms, setTerms] = useState<string[]>([
    'Payment Terms: 100% Advance',
    'Lead Time : 3-4 Weeks',
    'Validity: 30 Days',
    'Service Warranty:Hardware on-factory Service Warranty: 1 Year.',
    'Warranty : Not applicable for any consumables, battery, and Physical Damage, Water Logging, or Voltage Surge.',
    'Packing & Forwarding : Nil',
    'GST : 18 % mentioned Above',
  ]);

  const [notes, setNotes] = useState('Looking forward for your business.');
  const [signatoryName, setSignatoryName] = useState('Balamurugan S');
  const [signatorySignatureText, setSignatorySignatureText] = useState('S. Bala');

  // Auto-detect Place of Supply and GST type (IGST vs CGST+SGST) when Bill To address changes
  useEffect(() => {
    const combinedAddress = `${billToAddress} ${billToCityState} ${billToCountry}`;
    const detected = detectStateFromText(combinedAddress);
    if (detected) {
      setPlaceOfSupply(detected.display);
      // Tamil Nadu code is 33. If 33 -> Intra-State (CGST + SGST), Else -> Inter-State (IGST)
      setIsInterState(detected.code !== '33');
    }
  }, [billToAddress, billToCityState]);

  // Handle Place of Supply manual dropdown change
  const handlePlaceOfSupplyChange = (selectedStateDisplay: string) => {
    setPlaceOfSupply(selectedStateDisplay);
    const found = INDIAN_STATES.find((st) => st.display === selectedStateDisplay);
    if (found) {
      setIsInterState(found.code !== '33');
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const gstPercent = 18;
  const taxAmount = Math.round(subtotal * (gstPercent / 100));
  const grandTotal = subtotal + taxAmount;

  // Item helpers
  const handleAddItem = () => {
    setItems([
      ...items,
      { description: 'KwOrKs Biometric Sensor / IoT Terminal', quantity: 1, unit: 'NOS', rate: 25000, amount: 25000 },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    const it = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      it.amount = q * r;
    }
    updated[index] = it;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Auto-fill from CRM Deal or Contact
  const handleAutoFillFromDeal = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    setBillToName(deal.customerName || 'Authorized Executive');
    setBillToCompany(deal.company || 'Corporate Client');
    setBillToCityState('Mumbai, Maharashtra');
    setItems([
      {
        description: `${deal.title} — Enterprise Deployment`,
        quantity: 1,
        unit: 'SET',
        rate: deal.amount > 0 ? Math.round(deal.amount / 1.18) : 50000,
        amount: deal.amount > 0 ? Math.round(deal.amount / 1.18) : 50000,
      },
    ]);
  };

  // Construct current invoice data object for live preview & print
  const currentInvoiceData: InvoiceData = {
    invoiceType,
    invoiceNumber,
    quoteDate,
    placeOfSupply,
    isInterState,
    companyName,
    companyId,
    companyAddress,
    companyGstin,
    companyPhone,
    companyEmail,
    companyWebsite,
    billToName,
    billToCompany,
    billToAddress,
    billToCityState,
    billToCountry,
    shipToName: sameAsBillTo ? billToName : shipToName,
    shipToCompany: sameAsBillTo ? billToCompany : shipToCompany,
    shipToAddress: sameAsBillTo ? billToAddress : shipToAddress,
    shipToCityState: sameAsBillTo ? billToCityState : shipToCityState,
    shipToCountry: sameAsBillTo ? billToCountry : shipToCountry,
    items,
    subtotal,
    gstPercent,
    taxAmount,
    grandTotal,
    notes,
    bankName,
    accountName,
    accountNumber,
    ifscCode,
    terms,
    signatoryName,
    signatorySignatureText,
  };

  // Save to CRM Quotations Database
  const handleSaveQuotation = async () => {
    await onCreateQuote({
      quoteNumber: invoiceNumber,
      title: `${invoiceType}: ${billToCompany || billToName}`,
      customerName: billToName,
      customerEmail: billToCompany.toLowerCase().includes('@') ? billToCompany : `${billToName.toLowerCase().replace(/\s+/g, '.')}@${(billToCompany || 'client').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      company: billToCompany,
      status: 'Sent',
      items: items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.rate,
        amount: it.amount,
      })),
      subtotal,
      taxPercent: 18,
      taxAmount,
      grandTotal,
      currency: 'INR',
      validUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      termsAndConditions: terms.join('\n'),
      notes: `${notes}\nBank: ${bankName} | A/c: ${accountNumber} | IFSC: ${ifscCode}`,
    });
    setActiveView('list');
  };

  // 1-Click Send PDF to Customer Email
  const handleSendPDFToEmail = async () => {
    setIsSendingEmail(true);
    try {
      // 1. Save quote to CRM
      await onCreateQuote({
        quoteNumber: invoiceNumber,
        title: `${invoiceType}: ${billToCompany || billToName}`,
        customerName: billToName,
        customerEmail: billToCompany.toLowerCase().includes('@') ? billToCompany : 'customer@company.in',
        company: billToCompany,
        status: 'Sent',
        items: items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.rate,
          amount: it.amount,
        })),
        subtotal,
        taxPercent: 18,
        taxAmount,
        grandTotal,
        currency: 'INR',
        validUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        termsAndConditions: terms.join('\n'),
        notes: `${notes}\nBank: ${bankName} | A/c: ${accountNumber} | IFSC: ${ifscCode}`,
      });

      // 2. Trigger email send
      await onSendQuoteEmail(invoiceNumber);
      setActiveView('list');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // High-Resolution Direct PDF Download via html2pdf
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    const elem = document.getElementById('invoice-document-root');
    if (elem && (window as any).html2pdf) {
      const opt = {
        margin: [4, 4, 4, 4],
        filename: `${invoiceType.replace(/\s+/g, '_')}_${invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#FFFFFF' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      (window as any).html2pdf().set(opt).from(elem).save().then(() => {
        setIsDownloading(false);
      }).catch(() => {
        setIsDownloading(false);
        window.print();
      });
    } else {
      setIsDownloading(false);
      window.print();
    }
  };

  // Filtered list
  const filteredQuotes = quotes.filter((q) => {
    const term = search.toLowerCase();
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(term) ||
      q.title.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      q.company.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={themeStyles.pageContainer}>
      {/* Top Header & View Switcher */}
      <div className="no-print" style={themeStyles.headerRow}>
        <div>
          <h1 style={themeStyles.pageTitle}>
            <span>📜</span> Proforma Invoice &amp; Quotation Engine
          </h1>
          <div style={themeStyles.pageSubtitle}>
            Full HTML generator with Bill To / Ship To, automated Location &amp; GST detection (IGST vs CGST/SGST), Bank Details, and 1-Click PDF download
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px', border: `1px solid ${COLORS.borderGold}` }}>
            <button
              onClick={() => setActiveView('builder')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeView === 'builder' ? COLORS.goldAccent : 'transparent',
                color: activeView === 'builder' ? COLORS.textDark : '#FFFFFF',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              ✍️ Live Document Builder
            </button>
            <button
              onClick={() => setActiveView('list')}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeView === 'list' ? COLORS.goldAccent : 'transparent',
                color: activeView === 'list' ? COLORS.textDark : '#FFFFFF',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              📁 Saved CRM Quotes ({quotes.length})
            </button>
          </div>

          {activeView === 'builder' && (
            <>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                style={{ ...themeStyles.btnPrimary, backgroundColor: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>📥</span> {isDownloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={handleSendPDFToEmail}
                disabled={isSendingEmail}
                style={{ ...themeStyles.btnPrimary, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
              >
                <span>✉️</span> {isSendingEmail ? 'Dispatching...' : 'Send PDF to Email'}
              </button>
              <button
                onClick={() => window.print()}
                style={{ ...themeStyles.btnPrimary, backgroundColor: '#FFFFFF', color: COLORS.textDark }}
              >
                🖨️ Print
              </button>
            </>
          )}
        </div>
      </div>

      {activeView === 'builder' ? (
        /* ================= LIVE BUILDER & PREVIEW SPLIT VIEW ================= */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.1fr) minmax(500px, 1.3fr)', gap: '22px', alignItems: 'start' }}>
          {/* LEFT: INTERACTIVE CONTROLS FORM */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Auto-Fill Toolbar */}
            <div style={{ ...themeStyles.panel, padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldDark, textTransform: 'uppercase', marginBottom: '8px' }}>
                ⚡ QUICK PREFILL FROM CRM DEALS
              </div>
              <select
                style={themeStyles.fieldSelect}
                onChange={(e) => handleAutoFillFromDeal(e.target.value)}
              >
                <option value="">-- Auto-fill client &amp; scope from an active deal --</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.company} — {formatINR(d.amount)})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type & Place of Supply */}
            <div style={{ ...themeStyles.panel, padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '8px', marginBottom: '14px' }}>
                📄 Document Header &amp; GST Configuration
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>INVOICE TYPE</label>
                  <select
                    style={themeStyles.fieldSelect}
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value as any)}
                  >
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Commercial Estimate">Commercial Estimate</option>
                  </select>
                </div>

                <div>
                  <label style={themeStyles.fieldLabel}>QUOTE / INVOICE NUMBER</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>QUOTE DATE</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={themeStyles.fieldLabel}>
                    PLACE OF SUPPLY {isInterState ? '🏷️ (IGST 18% Inter-State)' : '🏷️ (CGST 9% + SGST 9% Intra-State)'}
                  </label>
                  <select
                    style={{ ...themeStyles.fieldSelect, fontWeight: 700, borderColor: isInterState ? '#2563EB' : '#2E8B57' }}
                    value={placeOfSupply}
                    onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.display}>
                        {st.display} {st.code === '33' ? '(Intra-State: CGST+SGST)' : '(Inter-State: IGST)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To Details */}
            <div style={{ ...themeStyles.panel, padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '8px', marginBottom: '14px' }}>
                🏢 Bill To &amp; Ship To Customer Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>CLIENT CONTACT NAME *</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={billToName}
                    onChange={(e) => setBillToName(e.target.value)}
                    placeholder="e.g. Phiroj Kalal"
                  />
                </div>
                <div>
                  <label style={themeStyles.fieldLabel}>ORGANIZATION / COMPANY *</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={billToCompany}
                    onChange={(e) => setBillToCompany(e.target.value)}
                    placeholder="e.g. Greysim Learnings Foundation"
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={themeStyles.fieldLabel}>STREET ADDRESS &amp; COMPLEX</label>
                <textarea
                  style={{ ...themeStyles.fieldInput, height: '54px', resize: 'vertical' }}
                  value={billToAddress}
                  onChange={(e) => setBillToAddress(e.target.value)}
                  placeholder="C-119, Kailas Industrial Complex, Veer Savarkar Marg..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>CITY, PINCODE &amp; STATE (AUTO-DETECTS GST)</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={billToCityState}
                    onChange={(e) => setBillToCityState(e.target.value)}
                    placeholder="Mumbai, 400079 Maharashtra"
                  />
                </div>
                <div>
                  <label style={themeStyles.fieldLabel}>COUNTRY</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={billToCountry}
                    onChange={(e) => setBillToCountry(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="sameShip"
                  checked={sameAsBillTo}
                  onChange={(e) => setSameAsBillTo(e.target.checked)}
                />
                <label htmlFor="sameShip" style={{ fontSize: '12px', fontWeight: 600, color: COLORS.textDark, cursor: 'pointer' }}>
                  Ship To address is same as Bill To address
                </label>
              </div>
            </div>

            {/* Line Items & Rates */}
            <div style={{ ...themeStyles.panel, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase' }}>
                  📦 Itemized Deliverables &amp; Rates
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#FAF6EF', border: `1px solid ${COLORS.borderGoldLight}`, borderRadius: '8px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '12px', color: COLORS.textDark }}>Item #{idx + 1}</strong>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#E05050', cursor: 'pointer', fontSize: '14px' }}
                        >
                          Remove ×
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <input
                        style={themeStyles.fieldInput}
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="Item name and full technical description"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 1.5fr', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#666' }}>QTY</label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          style={themeStyles.fieldInput}
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#666' }}>UNIT</label>
                        <input
                          style={themeStyles.fieldInput}
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                          placeholder="NOS / SET"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#666' }}>RATE (₹)</label>
                        <input
                          type="number"
                          style={themeStyles.fieldInput}
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(idx, 'rate', e.target.value)}
                        />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#666' }}>AMOUNT</div>
                        <strong style={{ fontSize: '13.5px', color: COLORS.textDark }}>
                          {formatINR(item.amount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details & Terms & Conditions Configuration */}
            <div style={{ ...themeStyles.panel, padding: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: COLORS.textDark, textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.borderGoldLight}`, paddingBottom: '8px', marginBottom: '14px' }}>
                🏦 Bank Account &amp; Legal Settlement Terms
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>BANK NAME</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={themeStyles.fieldLabel}>ACCOUNT NAME</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>ACCOUNT NUMBER</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label style={themeStyles.fieldLabel}>IFSC CODE</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <div>
                  <label style={themeStyles.fieldLabel}>AUTHORIZED SIGNATORY NAME</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={themeStyles.fieldLabel}>SIGNATURE SCRIPT TEXT</label>
                  <input
                    style={themeStyles.fieldInput}
                    value={signatorySignatureText}
                    onChange={(e) => setSignatorySignatureText(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={themeStyles.fieldLabel}>TERMS &amp; CONDITIONS</label>
                <textarea
                  style={{ ...themeStyles.fieldInput, height: '110px', resize: 'vertical', fontSize: '11.5px' }}
                  value={terms.join('\n')}
                  onChange={(e) => setTerms(e.target.value.split('\n'))}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={themeStyles.fieldLabel}>NOTES</label>
                <input
                  style={themeStyles.fieldInput}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                style={{ ...themeStyles.btnPrimary, flex: 1, backgroundColor: '#0284C7', color: '#FFFFFF' }}
              >
                📥 {isDownloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
              <button
                onClick={handleSendPDFToEmail}
                disabled={isSendingEmail}
                style={{ ...themeStyles.btnPrimary, flex: 1, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, fontWeight: 800 }}
              >
                ✉️ {isSendingEmail ? 'Dispatching...' : 'Send PDF to Email'}
              </button>
              <button
                onClick={handleSaveQuotation}
                style={{ ...themeStyles.btnPrimary, flex: 1, backgroundColor: '#2E8B57', color: '#FFFFFF' }}
              >
                💾 Save to CRM
              </button>
            </div>
          </div>

          {/* RIGHT: LIVE DOCUMENT PREVIEW (Pixel-Perfect A4 Proforma Invoice) */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: COLORS.goldAccent, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                👁️ LIVE DOCUMENT PDF PREVIEW (REAL-TIME RENDERING)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  style={{ ...themeStyles.btnSmall, backgroundColor: '#0284C7', color: '#FFFFFF', fontWeight: 800 }}
                >
                  📥 Download PDF
                </button>
                <button
                  onClick={handleSendPDFToEmail}
                  disabled={isSendingEmail}
                  style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, fontWeight: 800 }}
                >
                  ✉️ Send to Email
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ ...themeStyles.btnSmall, backgroundColor: '#FFFFFF', color: COLORS.textDark, fontWeight: 800 }}
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            <InvoiceDocumentPreview data={currentInvoiceData} onPrint={() => window.print()} onDownloadPDF={handleDownloadPDF} />
          </div>
        </div>
      ) : (
        /* ================= SAVED CRM QUOTATIONS DIRECTORY ================= */
        <div>
          {/* Filter Panel */}
          <div style={{ ...themeStyles.panel, padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <input
                style={{ ...themeStyles.fieldInput, flex: 2, minWidth: '240px' }}
                placeholder="Search quotations by quote #, customer, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {['ALL', 'Draft', 'Sent', 'Accepted', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: statusFilter === st ? `1.5px solid ${COLORS.goldAccent}` : '1px solid #CCC',
                      backgroundColor: statusFilter === st ? COLORS.goldAccent : '#FFFFFF',
                      color: statusFilter === st ? COLORS.textDark : '#555',
                      fontWeight: 800,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                    }}
                  >
                    {st === 'ALL' ? 'All Quotes' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quotations Table */}
          <div style={themeStyles.panel}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.borderGoldLight}`, color: COLORS.goldDark, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    <th style={{ padding: '12px 10px' }}>Quote #</th>
                    <th style={{ padding: '12px 10px' }}>Proposal Title</th>
                    <th style={{ padding: '12px 10px' }}>Customer &amp; Organization</th>
                    <th style={{ padding: '12px 10px' }}>Grand Total (₹ INR)</th>
                    <th style={{ padding: '12px 10px' }}>Valid Until</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: COLORS.textMuted, fontStyle: 'italic' }}>
                        No saved quotations found. Click "Live Document Builder" above to generate a new proforma quotation.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotes.map((q) => {
                      const isAccepted = q.status === 'Accepted';
                      const isSent = q.status === 'Sent';

                      return (
                        <tr
                          key={q.id}
                          style={{
                            borderBottom: '1px solid #F0E6D8',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6EF')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '14px 10px', fontWeight: 800, color: COLORS.textDark }}>
                            {q.quoteNumber}
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ fontWeight: 800, color: COLORS.textDark }}>{q.title}</div>
                            {q.dealTitle && (
                              <div style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '2px' }}>
                                💼 Linked Deal: {q.dealTitle}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ fontWeight: 700, color: COLORS.textDark }}>{q.customerName}</div>
                            <div style={{ fontSize: '11px', color: COLORS.goldDark }}>🏢 {q.company}</div>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <strong style={{ fontSize: '14.5px', color: COLORS.textDark }}>
                              {formatINR(q.grandTotal)}
                            </strong>
                            <div style={{ fontSize: '10.5px', color: COLORS.textMuted }}>Incl. 18% GST</div>
                          </td>
                          <td style={{ padding: '14px 10px', fontSize: '12px', color: '#555' }}>
                            📅 {q.validUntil}
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: isAccepted
                                  ? 'rgba(46, 139, 87, 0.15)'
                                  : isSent
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(215, 171, 106, 0.2)',
                                color: isAccepted ? '#2E8B57' : isSent ? '#2563EB' : COLORS.textDark,
                              }}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  // Load into builder
                                  setInvoiceNumber(q.quoteNumber);
                                  setBillToName(q.customerName);
                                  setBillToCompany(q.company);
                                  if (q.items && q.items.length > 0) {
                                    setItems(q.items.map((it) => ({
                                      description: it.description,
                                      quantity: it.quantity,
                                      unit: 'NOS',
                                      rate: it.unitPrice,
                                      amount: it.amount,
                                    })));
                                  }
                                  setActiveView('builder');
                                }}
                                style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.cardChampagne, color: COLORS.textDark, border: `1px solid ${COLORS.borderGold}` }}
                                title="Open in Live Document Preview"
                              >
                                👁️ Inspect / Print
                              </button>

                              {q.status !== 'Accepted' && (
                                <>
                                  <button
                                    onClick={() => onSendQuoteEmail(q.id)}
                                    style={{ ...themeStyles.btnSmall, backgroundColor: COLORS.goldAccent, color: COLORS.textDark, fontWeight: 800 }}
                                    title="Dispatch formal quotation email to client"
                                  >
                                    ✉️ Email
                                  </button>
                                  <button
                                    onClick={() => onAcceptQuote(q.id)}
                                    style={{ ...themeStyles.btnSmall, backgroundColor: '#2E8B57', color: '#FFFFFF', fontWeight: 800 }}
                                    title="Accept Quote & Win Deal"
                                  >
                                    ✅ Accept
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onDeleteQuote(q.id)}
                                style={{ ...themeStyles.btnSmall, backgroundColor: 'transparent', color: '#E05050', border: '1px solid #E05050' }}
                                title="Delete Quote"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
