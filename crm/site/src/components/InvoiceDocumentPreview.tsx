import React from 'react';
import { numberToWordsIndian } from '../utils/gstHelper';

export interface InvoiceData {
  invoiceType: 'Proforma Invoice' | 'Quotation' | 'Tax Invoice' | 'Commercial Estimate';
  invoiceNumber: string;
  quoteDate: string;
  placeOfSupply: string;
  isInterState: boolean;

  // Company Info
  companyName: string;
  companyId: string;
  companyAddress: string;
  companyGstin: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;

  // Bill To
  billToName: string;
  billToCompany: string;
  billToAddress: string;
  billToCityState: string;
  billToCountry: string;

  // Ship To
  shipToName: string;
  shipToCompany: string;
  shipToAddress: string;
  shipToCityState: string;
  shipToCountry: string;

  // Line items
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;

  // Totals
  subtotal: number;
  gstPercent: number;
  taxAmount: number;
  grandTotal: number;

  // Additional Info
  notes: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  terms: string[];
  signatoryName: string;
  signatorySignatureText: string;
}

interface InvoiceDocumentPreviewProps {
  data: InvoiceData;
  onPrint?: () => void;
  onDownloadPDF?: () => void;
}

export const InvoiceDocumentPreview: React.FC<InvoiceDocumentPreviewProps> = ({ data }) => {
  const isInterState = data.isInterState;
  const wordsTotal = numberToWordsIndian(data.grandTotal);

  return (
    <div
      id="invoice-document-root"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '9pt',
        lineHeight: 1.35,
        padding: '24px 28px',
        border: '1.2px solid #333333',
        maxWidth: '780px',
        margin: '0 auto',
        boxSizing: 'border-box',
        boxShadow: '0 4px 25px rgba(0,0,0,0.18)',
        position: 'relative',
      }}
    >
      {/* 1. TOP HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        {/* Top Left: Logo + Company Info */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', maxWidth: '58%' }}>
          {/* Logo SVG */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '95px' }}>
            <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="42" stroke="#00A3C4" strokeWidth="4" fill="none" opacity="0.3"/>
              <ellipse cx="50" cy="50" rx="38" ry="16" stroke="#00A3C4" strokeWidth="4" fill="none" transform="rotate(30 50 50)"/>
              <ellipse cx="50" cy="50" rx="38" ry="16" stroke="#00A3C4" strokeWidth="4" fill="none" transform="rotate(90 50 50)"/>
              <ellipse cx="50" cy="50" rx="38" ry="16" stroke="#00A3C4" strokeWidth="4" fill="none" transform="rotate(150 50 50)"/>
              <circle cx="50" cy="50" r="10" fill="#00A3C4"/>
            </svg>
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#1B365D', letterSpacing: '0.4px', marginTop: '2px', textAlign: 'center' }}>
              QUANTUMMATE<span style={{ fontSize: '7px', verticalAlign: 'super' }}>™</span>
            </div>
          </div>

          {/* Company Details Text */}
          <div style={{ fontSize: '8.5pt', color: '#111111' }}>
            <div style={{ fontSize: '12pt', fontWeight: 800, color: '#000000', marginBottom: '3px', lineHeight: 1.15 }}>
              {data.companyName}
            </div>
            <div>Company ID : {data.companyId}</div>
            <div style={{ whiteSpace: 'pre-line' }}>{data.companyAddress}</div>
            <div style={{ fontWeight: 700, marginTop: '2px' }}>GSTIN {data.companyGstin}</div>
            <div>{data.companyPhone}</div>
            <div>{data.companyEmail}</div>
            <div style={{ color: '#0066CC' }}>{data.companyWebsite}</div>
          </div>
        </div>

        {/* Top Right: Title & Metadata */}
        <div style={{ textAlign: 'right', minWidth: '40%' }}>
          <div style={{ fontSize: '24pt', fontWeight: 400, color: '#000000', marginBottom: '8px', letterSpacing: '-0.3px' }}>
            {data.invoiceType}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', fontSize: '8.5pt', textAlign: 'left', marginTop: '4px' }}>
            <div style={{ fontWeight: 700 }}>#</div>
            <div>: <strong>{data.invoiceNumber}</strong></div>

            <div style={{ fontWeight: 700 }}>Quote Date</div>
            <div>: {data.quoteDate}</div>

            <div style={{ fontWeight: 700 }}>Place Of Supply</div>
            <div>: {data.placeOfSupply}</div>
          </div>
        </div>
      </div>

      {/* 2. BILL TO / SHIP TO BOX (Two columns with border) */}
      <div style={{ border: '1px solid #333333', display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '10px', fontSize: '8.5pt' }}>
        {/* Bill To */}
        <div style={{ borderRight: '1px solid #333333', padding: '6px 10px' }}>
          <div style={{ fontWeight: 800, fontSize: '9pt', borderBottom: '1px solid #E0E0E0', paddingBottom: '2px', marginBottom: '4px' }}>
            Bill To
          </div>
          <div style={{ fontWeight: 800 }}>{data.billToName}</div>
          <div>{data.billToCompany}</div>
          <div style={{ whiteSpace: 'pre-line' }}>{data.billToAddress}</div>
          <div>{data.billToCityState}</div>
          <div>{data.billToCountry}</div>
        </div>

        {/* Ship To */}
        <div style={{ padding: '6px 10px' }}>
          <div style={{ fontWeight: 800, fontSize: '9pt', borderBottom: '1px solid #E0E0E0', paddingBottom: '2px', marginBottom: '4px' }}>
            Ship To
          </div>
          <div>{data.shipToCompany || data.billToCompany}</div>
          <div style={{ whiteSpace: 'pre-line' }}>{data.shipToAddress || data.billToAddress}</div>
          <div>{data.shipToCityState || data.billToCityState}</div>
          <div>{data.shipToCountry || data.billToCountry}</div>
        </div>
      </div>

      {/* 3. MAIN LINE ITEMS TABLE */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #333333',
          marginBottom: '0px',
          fontSize: '8.5pt',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #333333' }}>
            <th style={{ border: '1px solid #333333', padding: '5px 4px', width: '28px', textAlign: 'center' }}>#</th>
            <th style={{ border: '1px solid #333333', padding: '5px 8px' }}>Item &amp; Description</th>
            <th style={{ border: '1px solid #333333', padding: '5px 4px', width: '55px', textAlign: 'center' }}>Qty</th>
            <th style={{ border: '1px solid #333333', padding: '5px 6px', width: '75px', textAlign: 'right' }}>Rate</th>
            {isInterState ? (
              <>
                <th style={{ border: '1px solid #333333', padding: '2px', width: '40px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800 }}>IGST</div>
                  <div style={{ fontSize: '7.5pt' }}>%</div>
                </th>
                <th style={{ border: '1px solid #333333', padding: '2px 4px', width: '70px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>IGST</div>
                  <div style={{ fontSize: '7.5pt' }}>Amt</div>
                </th>
              </>
            ) : (
              <>
                <th style={{ border: '1px solid #333333', padding: '2px', width: '40px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800 }}>CGST</div>
                  <div style={{ fontSize: '7.5pt' }}>9%</div>
                </th>
                <th style={{ border: '1px solid #333333', padding: '2px', width: '40px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800 }}>SGST</div>
                  <div style={{ fontSize: '7.5pt' }}>9%</div>
                </th>
                <th style={{ border: '1px solid #333333', padding: '2px 4px', width: '70px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>Tax</div>
                  <div style={{ fontSize: '7.5pt' }}>Amt</div>
                </th>
              </>
            )}
            <th style={{ border: '1px solid #333333', padding: '5px 6px', width: '80px', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => {
            const tax = item.amount * 0.18;
            const cgst = item.amount * 0.09;
            const sgst = item.amount * 0.09;

            return (
              <tr key={idx}>
                <td style={{ border: '1px solid #333333', padding: '6px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                  {idx + 1}
                </td>
                <td style={{ border: '1px solid #333333', padding: '6px 8px', fontWeight: 600, verticalAlign: 'top' }}>
                  {item.description}
                </td>
                <td style={{ border: '1px solid #333333', padding: '6px 4px', textAlign: 'center', verticalAlign: 'top' }}>
                  <div>{Number(item.quantity).toFixed(2)}</div>
                  <div style={{ fontSize: '7.5pt', color: '#555' }}>{item.unit || 'NOS'}</div>
                </td>
                <td style={{ border: '1px solid #333333', padding: '6px 6px', textAlign: 'right', verticalAlign: 'top' }}>
                  {Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                {isInterState ? (
                  <>
                    <td style={{ border: '1px solid #333333', padding: '6px 2px', textAlign: 'center', verticalAlign: 'top' }}>
                      18%
                    </td>
                    <td style={{ border: '1px solid #333333', padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>
                      {tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ border: '1px solid #333333', padding: '6px 2px', textAlign: 'center', verticalAlign: 'top' }}>
                      {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ border: '1px solid #333333', padding: '6px 2px', textAlign: 'center', verticalAlign: 'top' }}>
                      {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ border: '1px solid #333333', padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>
                      {tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </>
                )}
                <td style={{ border: '1px solid #333333', padding: '6px 6px', textAlign: 'right', fontWeight: 700, verticalAlign: 'top' }}>
                  {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 4. BOTTOM SECTION: LEFT (WORDS + NOTES + BANK + TERMS) VS RIGHT (TOTALS + SIGNATURE) */}
      <div style={{ border: '1px solid #333333', borderTop: 'none', display: 'grid', gridTemplateColumns: '1.25fr 1fr', fontSize: '8.5pt' }}>
        {/* Left Side: Words, Notes, Bank, Terms */}
        <div style={{ borderRight: '1px solid #333333', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Words */}
          <div>
            <div style={{ fontWeight: 800, fontSize: '8.5pt' }}>Total In Words</div>
            <div style={{ fontStyle: 'italic', fontWeight: 600 }}>{wordsTotal}</div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontWeight: 800, fontSize: '8.5pt' }}>Notes</div>
            <div>{data.notes || 'Looking forward for your business.'}</div>
          </div>

          {/* Bank Details */}
          <div style={{ marginTop: '2px' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt' }}>Bank Account Details:</div>
            <div>Bank Name: <strong>{data.bankName}</strong></div>
            <div>A/c Name: <strong>{data.accountName}</strong></div>
            <div>A/c No: <strong>{data.accountNumber}</strong></div>
            <div>IFSC Code: <strong>{data.ifscCode}</strong></div>
          </div>

          {/* Terms & Conditions */}
          <div style={{ marginTop: '2px' }}>
            <div style={{ fontWeight: 800, fontSize: '8.5pt' }}>Terms &amp; Conditions</div>
            <div style={{ fontSize: '8pt', lineHeight: 1.35, whiteSpace: 'pre-line' }}>
              {data.terms.join('\n')}
            </div>
          </div>
        </div>

        {/* Right Side: Sub Total, GST, Grand Total & Signature */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Sub Total & Tax Rows */}
          <div style={{ borderBottom: '1px solid #333333', padding: '6px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span>Sub Total</span>
              <strong>{Number(data.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>

            {isInterState ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>IGST18 (18%)</span>
                <span>{Number(data.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>CGST9 (9%)</span>
                  <span>{(Number(data.taxAmount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>SGST9 (9%)</span>
                  <span>{(Number(data.taxAmount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 2px 0', borderTop: '1px solid #CCCCCC', marginTop: '4px', fontWeight: 900, fontSize: '9.5pt' }}>
              <span>Total</span>
              <span>₹{Number(data.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Signature Block */}
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', fontWeight: 700 }}>
              {data.signatoryName || 'Balamurugan S'}
            </div>

            {/* Realistic Cursive Digital Signature Rendering */}
            <div
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive",
                fontSize: '28px',
                color: '#111827',
                margin: '6px 0',
                transform: 'rotate(-4deg)',
              }}
            >
              {data.signatorySignatureText || 'S. Bala'}
            </div>

            <div style={{ borderTop: '1px solid #333333', width: '80%', margin: '4px auto 0 auto', paddingTop: '2px', fontSize: '8pt' }}>
              Authorized Signature
            </div>
          </div>
        </div>
      </div>

      {/* Page Number on bottom right */}
      <div style={{ textAlign: 'right', fontSize: '8pt', color: '#666', marginTop: '6px' }}>
        1
      </div>
    </div>
  );
};
