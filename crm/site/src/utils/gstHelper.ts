export interface GSTState {
  code: string;
  name: string;
  display: string;
}

export const INDIAN_STATES: GSTState[] = [
  { code: '33', name: 'Tamil Nadu', display: 'Tamil Nadu (33)' },
  { code: '27', name: 'Maharashtra', display: 'Maharashtra (27)' },
  { code: '29', name: 'Karnataka', display: 'Karnataka (29)' },
  { code: '07', name: 'Delhi', display: 'Delhi (07)' },
  { code: '24', name: 'Gujarat', display: 'Gujarat (24)' },
  { code: '36', name: 'Telangana', display: 'Telangana (36)' },
  { code: '37', name: 'Andhra Pradesh', display: 'Andhra Pradesh (37)' },
  { code: '32', name: 'Kerala', display: 'Kerala (32)' },
  { code: '09', name: 'Uttar Pradesh', display: 'Uttar Pradesh (09)' },
  { code: '19', name: 'West Bengal', display: 'West Bengal (19)' },
  { code: '08', name: 'Rajasthan', display: 'Rajasthan (08)' },
  { code: '06', name: 'Haryana', display: 'Haryana (06)' },
  { code: '03', name: 'Punjab', display: 'Punjab (03)' },
  { code: '23', name: 'Madhya Pradesh', display: 'Madhya Pradesh (23)' },
  { code: '10', name: 'Bihar', display: 'Bihar (10)' },
  { code: '21', name: 'Odisha', display: 'Odisha (21)' },
  { code: '18', name: 'Assam', display: 'Assam (18)' },
  { code: '20', name: 'Jharkhand', display: 'Jharkhand (20)' },
  { code: '05', name: 'Uttarakhand', display: 'Uttarakhand (05)' },
  { code: '30', name: 'Goa', display: 'Goa (30)' },
  { code: '04', name: 'Chandigarh', display: 'Chandigarh (04)' },
  { code: '34', name: 'Puducherry', display: 'Puducherry (34)' },
  { code: '01', name: 'Jammu and Kashmir', display: 'Jammu and Kashmir (01)' },
  { code: '02', name: 'Himachal Pradesh', display: 'Himachal Pradesh (02)' },
  { code: '11', name: 'Sikkim', display: 'Sikkim (11)' },
  { code: '12', name: 'Arunachal Pradesh', display: 'Arunachal Pradesh (12)' },
  { code: '13', name: 'Nagaland', display: 'Nagaland (13)' },
  { code: '14', name: 'Manipur', display: 'Manipur (14)' },
  { code: '15', name: 'Mizoram', display: 'Mizoram (15)' },
  { code: '16', name: 'Tripura', display: 'Tripura (16)' },
  { code: '17', name: 'Meghalaya', display: 'Meghalaya (17)' },
  { code: '22', name: 'Chhattisgarh', display: 'Chhattisgarh (22)' },
];

/**
 * Auto-detect Indian state from address string or state name
 */
export function detectStateFromText(text: string): GSTState | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const st of INDIAN_STATES) {
    if (lower.includes(st.name.toLowerCase()) || lower.includes(`(${st.code})`)) {
      return st;
    }
  }
  return null;
}

/**
 * Convert number into Indian currency words format
 * e.g. 95580 => "Indian Rupee Ninety-Five Thousand Five Hundred Eighty Only"
 */
export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num === 0) return 'Indian Rupee Zero Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(Math.abs(num))).substr(-9);
  const match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return `Indian Rupee ${num} Only`;

  let str = '';
  const crore = Number(match[1]);
  const lakh = Number(match[2]);
  const thousand = Number(match[3]);
  const hundred = Number(match[4]);
  const remaining = Number(match[5]);

  if (crore > 0) {
    str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + 'Crore ';
  }
  if (lakh > 0) {
    str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + 'Lakh ';
  }
  if (thousand > 0) {
    str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + 'Thousand ';
  }
  if (hundred > 0) {
    str += a[hundred] + 'Hundred ';
  }
  if (remaining > 0) {
    str += (remaining < 20 ? a[remaining] : b[Math.floor(remaining / 10)] + (remaining % 10 !== 0 ? '-' + a[remaining % 10].trim() : ' '));
  }

  // Format nicely
  const cleanStr = str.replace(/\s+/g, ' ').trim();
  return `Indian Rupee ${cleanStr} Only`;
}
