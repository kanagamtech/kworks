const fs = require('fs');
const path = require('path');
const { connectMongoDB, getIsConnected, Models } = require('./mongo');

const DB_FILE = path.join(__dirname, 'crm_db.json');

const INITIAL_USERS = [
  {
    id: 'USR-01',
    name: 'Rajesh Raman',
    email: 'rajesh@kworks.com',
    role: 'Manager',
    title: 'Senior Sales & Operations Manager',
    department: 'Enterprise Sales & Operations',
    phone: '+91 98401 55678',
    monthlyQuota: 1500000,
    status: 'Active',
    avatar: ''
  },
  {
    id: 'USR-02',
    name: 'Ananya Iyer',
    email: 'ananya@kworks.com',
    role: 'Employee',
    title: 'Enterprise Account Executive',
    department: 'Strategic Accounts',
    phone: '+91 98840 99887',
    monthlyQuota: 800000,
    status: 'Active',
    avatar: ''
  },
  {
    id: 'USR-03',
    name: 'Vikram Sen',
    email: 'vikram@kworks.com',
    role: 'Employee',
    title: 'Inbound Sales Representative',
    department: 'SMB & Regional Growth',
    phone: '+91 97909 11223',
    monthlyQuota: 450000,
    status: 'Active',
    avatar: ''
  },
  {
    id: 'USR-04',
    name: 'Admin Executive',
    email: 'admin@kworks.com',
    role: 'Admin',
    title: 'Chief CRM Administrator',
    department: 'Executive Management',
    phone: '+91 94440 00001',
    monthlyQuota: 2500000,
    status: 'Active',
    avatar: ''
  }
];

const INITIAL_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Welcome & Introduction',
    category: 'Welcome',
    subject: 'Welcome to KwOrKs, {{name}}! Let’s elevate your enterprise operations',
    body: 'Hi {{name}},\n\nThank you for reaching out to us at {{company}}! We are thrilled to introduce KwOrKs CRM and Enterprise Workforce suite to your team.\n\nOur team is eager to learn more about your goals and show you how our integrated solutions can streamline your sales pipelines, team coordination, and client relationships.\n\nWould you have 15 minutes this week for a brief introductory discovery call?\n\nBest regards,\n{{salesperson}}\nKwOrKs Enterprise Solutions',
    variables: ['name', 'company', 'salesperson']
  },
  {
    id: 'tpl-2',
    name: 'Follow-up on Proposal',
    category: 'Follow-up',
    subject: 'Checking in on our proposal for {{company}}',
    body: 'Hi {{name}},\n\nI hope you are having a productive week! I wanted to quickly follow up regarding the enterprise proposal we shared recently for {{company}}.\n\nDo you or your leadership team have any questions regarding the deliverables, timeline, or pricing details?\n\nLooking forward to hearing your thoughts.\n\nWarm regards,\n{{salesperson}}\nKwOrKs Enterprise Solutions',
    variables: ['name', 'company', 'salesperson']
  },
  {
    id: 'tpl-3',
    name: 'Quotation & Pricing Breakdown',
    category: 'Quotation',
    subject: 'KwOrKs Official Commercial Quotation: {{deal_title}}',
    body: 'Dear {{name}},\n\nThank you for considering KwOrKs. Attached to this email is our comprehensive commercial proposal for {{deal_title}} amounting to ₹{{deal_amount}} (INR).\n\nSummary of Scope:\n- Dedicated Enterprise Cloud Deployment\n- Unlimited Team Access & Biometric Telemetry Sync\n- 24/7 Priority SLA & Custom Workflow Integrations\n\nPlease review and let us know if you need any adjustments.\n\nBest regards,\n{{salesperson}}\nKwOrKs Enterprise Solutions',
    variables: ['name', 'deal_title', 'deal_amount', 'salesperson']
  },
  {
    id: 'tpl-4',
    name: 'Payment & Invoice Reminder',
    category: 'Payment Reminder',
    subject: 'Friendly Reminder: Invoice Pending for {{company}}',
    body: 'Dear {{name}},\n\nThis is a friendly reminder from KwOrKs Accounts that invoice for {{deal_title}} (₹{{deal_amount}}) is scheduled for settlement.\n\nIf you have already initiated the transfer, please disregard this note. Otherwise, kindly confirm the payment reference at your earliest convenience.\n\nWarm regards,\nFinance & Accounts Team\nKwOrKs Enterprise',
    variables: ['name', 'company', 'deal_title', 'deal_amount']
  },
  {
    id: 'tpl-5',
    name: 'Deal Won & Thank You',
    category: 'Thank You',
    subject: 'Welcome aboard! We are excited to partner with {{company}}',
    body: 'Dear {{name}},\n\nOn behalf of the entire KwOrKs leadership, thank you for choosing KwOrKs! We are honored to be your technology and workforce management partner for {{deal_title}}.\n\nOur Customer Success Team will reach out within 24 hours to begin your seamless onboarding process.\n\nCheers to a fruitful partnership!\n\nWarm regards,\n{{salesperson}}\nKwOrKs Executive Team',
    variables: ['name', 'company', 'deal_title', 'salesperson']
  },
  {
    id: 'tpl-6',
    name: 'Meeting Confirmation',
    category: 'Meeting Confirmation',
    subject: 'Meeting Confirmed: KwOrKs CRM Discovery with {{company}}',
    body: 'Hi {{name}},\n\nThis email confirms our upcoming meeting.\n\nAgenda:\n1. Review of {{company}}\'s workflow requirements\n2. Live KwOrKs CRM & Biometrics demonstration\n3. Q&A and next steps\n\nLooking forward to speaking with you!\n\nBest regards,\n{{salesperson}}',
    variables: ['name', 'company', 'salesperson']
  }
];

const INITIAL_AUTOMATION_RULES = [
  {
    id: 'auto-1',
    name: 'New Lead Welcome Email',
    triggerEvent: 'LEAD_CREATED',
    actionType: 'SEND_EMAIL',
    templateId: 'tpl-1',
    emailSubject: 'Welcome to KwOrKs, {{name}}! Let’s elevate your enterprise operations',
    isActive: true,
    executionsCount: 4,
    lastExecutedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'auto-2',
    name: 'Deal Created Quotation Dispatch',
    triggerEvent: 'DEAL_CREATED',
    actionType: 'SEND_EMAIL',
    templateId: 'tpl-3',
    emailSubject: 'KwOrKs Official Commercial Quotation: {{deal_title}}',
    isActive: true,
    executionsCount: 2,
    lastExecutedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'auto-3',
    name: 'Deal Won Confirmation & Onboarding',
    triggerEvent: 'DEAL_WON',
    actionType: 'SEND_EMAIL',
    templateId: 'tpl-5',
    emailSubject: 'Welcome aboard! We are excited to partner with {{company}}',
    isActive: true,
    executionsCount: 3,
    lastExecutedAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'auto-4',
    name: 'Auto Follow-up for Inactive Leads (3 Days)',
    triggerEvent: 'NO_RESPONSE_3_DAYS',
    actionType: 'SEND_EMAIL',
    templateId: 'tpl-2',
    emailSubject: 'Checking in on our proposal for {{company}}',
    isActive: true,
    executionsCount: 6,
    lastExecutedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'auto-5',
    name: 'Task Due Tomorrow Staff Reminder',
    triggerEvent: 'TASK_DUE_TOMORROW',
    actionType: 'NOTIFY_USER',
    templateId: '',
    emailSubject: 'Reminder: Task "{{task_title}}" is due tomorrow',
    isActive: true,
    executionsCount: 8,
    lastExecutedAt: new Date(Date.now() - 18000000).toISOString()
  },
  {
    id: 'auto-6',
    name: 'Website Form Submission Lead Ingestion',
    triggerEvent: 'WEBSITE_FORM_SUBMITTED',
    actionType: 'SEND_EMAIL',
    templateId: 'tpl-1',
    emailSubject: 'Welcome to KwOrKs, {{name}}! We received your inquiry',
    isActive: true,
    executionsCount: 12,
    lastExecutedAt: new Date(Date.now() - 900000).toISOString()
  }
];

const INITIAL_QUOTES = [
  {
    id: 'QT-101',
    quoteNumber: 'QT-2026-001',
    title: 'Apex Fleet & Shift Telemetry Commercial Quotation',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@apexlogistics.io',
    customerPhone: '+91 98401 22345',
    company: 'Apex Global Logistics',
    companyId: 'CMP-301',
    dealId: 'DL-401',
    dealTitle: 'Apex Fleet & Staff Attendance Rollout',
    status: 'Sent',
    items: [
      {
        description: 'KwOrKs Enterprise Biometric Facial Recognition Cloud (500 User Tier)',
        quantity: 1,
        unitPrice: 1800000,
        discountPercent: 10,
        amount: 1620000
      },
      {
        description: 'Rugged Facial Recognition Kiosk Hardware Terminals with GPS Lock',
        quantity: 8,
        unitPrice: 100000,
        discountPercent: 5,
        amount: 760000
      },
      {
        description: 'Annual Dedicated SLA Support, Onboarding & Shift Cafeteria Integration',
        quantity: 1,
        unitPrice: 420000,
        discountPercent: 0,
        amount: 420000
      }
    ],
    subtotal: 2800000,
    taxPercent: 18,
    taxAmount: 504000,
    discountAmount: 220000,
    grandTotal: 3304000,
    currency: 'INR',
    validUntil: '2026-09-30',
    termsAndConditions: '1. Quotation validity: 30 days.\n2. Payment terms: 50% advance, 50% on deployment.\n3. GST 18% applied as per statutory norms.\n4. Comprehensive 1-year on-site hardware warranty included.',
    notes: 'Priority logistics discount applied for Bangalore and Chennai regional hubs.',
    createdBy: 'Rajesh Raman',
    sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    acceptedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'QT-102',
    quoteNumber: 'QT-2026-002',
    title: 'Vance Capital Multi-Region Enterprise License Proposal',
    customerName: 'Alexander Vance',
    customerEmail: 'a.vance@vancecap.com',
    customerPhone: '+91 98409 33211',
    company: 'Vance Capital Partners',
    companyId: 'CMP-302',
    dealId: 'DL-402',
    dealTitle: 'Vance Capital Global Enterprise Suite',
    status: 'Draft',
    items: [
      {
        description: 'KwOrKs Global Zero-Trust Workforce Cloud (Unlimited Multi-Branch)',
        quantity: 1,
        unitPrice: 5500000,
        discountPercent: 0,
        amount: 5500000
      },
      {
        description: 'Custom SAML 2.0 / Okta Identity Sync & HRMS Automated Payroll Integration',
        quantity: 1,
        unitPrice: 2000000,
        discountPercent: 0,
        amount: 2000000
      }
    ],
    subtotal: 7500000,
    taxPercent: 18,
    taxAmount: 1350000,
    discountAmount: 0,
    grandTotal: 8850000,
    currency: 'INR',
    validUntil: '2026-09-15',
    termsAndConditions: '1. Proposal valid for 15 business days.\n2. Payment terms: Net 30 upon MSA signature.\n3. SOC-2 Type II audit report provided under NDA.',
    notes: 'Awaiting legal sign-off from Alexander Vance.',
    createdBy: 'Ananya Iyer',
    sentAt: null,
    acceptedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'QT-103',
    quoteNumber: 'QT-2026-003',
    title: 'Deshmukh Infra Construction Sites Biometrics Terminals',
    customerName: 'Rohan Deshmukh',
    customerEmail: 'rohan.d@deshmukinfra.in',
    customerPhone: '+91 98220 77889',
    company: 'Deshmukh Infrastructure Ltd',
    companyId: 'CMP-304',
    dealId: 'DL-405',
    dealTitle: 'Deshmukh Infra Site Biometrics Setup',
    status: 'Sent',
    items: [
      {
        description: 'KwOrKs Construction Site GPS Geofenced Attendance Package',
        quantity: 1,
        unitPrice: 2600000,
        discountPercent: 0,
        amount: 2600000
      },
      {
        description: 'Heavy-Duty Waterproof Cellular Biometric Face Scanner Tablets',
        quantity: 12,
        unitPrice: 100000,
        discountPercent: 0,
        amount: 1200000
      }
    ],
    subtotal: 3800000,
    taxPercent: 18,
    taxAmount: 684000,
    discountAmount: 0,
    grandTotal: 4484000,
    currency: 'INR',
    validUntil: '2026-10-10',
    termsAndConditions: '1. Quotation validity: 30 days.\n2. Payment: 40% Advance, 60% on device commissioning.',
    notes: 'Site installation scheduled across 6 Pune metro construction yards.',
    createdBy: 'Vikram Sen',
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    acceptedAt: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const INITIAL_DATA = {
  users: INITIAL_USERS,
  quotes: INITIAL_QUOTES,
  leads: [
    {
      id: 'LD-101',
      name: 'Priya Sharma',
      company: 'Apex Global Logistics',
      email: 'priya.sharma@apexlogistics.io',
      phone: '+91 98401 22345',
      source: 'Website Form',
      status: 'Qualified',
      assignedTo: 'Rajesh Raman',
      createdBy: 'Rajesh Raman',
      estimatedValue: 2400000,
      notes: 'Requested a demo of GPS geofencing biometric shift tracking and CRM integration.',
      autoFollowUp: true,
      lastContactedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'LD-102',
      name: 'Alexander Vance',
      company: 'Vance Capital Partners',
      email: 'a.vance@vancecap.com',
      phone: '+91 98409 33211',
      source: 'LinkedIn',
      status: 'Proposal Sent',
      assignedTo: 'Ananya Iyer',
      createdBy: 'Ananya Iyer',
      estimatedValue: 6500000,
      notes: 'Enterprise contract for 300+ branch employees across Mumbai, Bangalore and Chennai.',
      autoFollowUp: true,
      lastContactedAt: new Date(Date.now() - 43200000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'LD-103',
      name: 'Karthik Subramanian',
      company: 'Zenith Tech Systems',
      email: 'karthik@zenithtech.in',
      phone: '+91 97890 55678',
      source: 'Referral',
      status: 'New',
      assignedTo: 'Rajesh Raman',
      createdBy: 'Rajesh Raman',
      estimatedValue: 1850000,
      notes: 'Referred by Kanagam Tech. Looking for cloud-based staff and lead portal.',
      autoFollowUp: true,
      lastContactedAt: null,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'LD-104',
      name: 'Elena Rostova',
      company: 'Nordic Freight Corp',
      email: 'elena.rostova@nordicfreight.eu',
      phone: '+91 98111 45678',
      source: 'Inbound Call',
      status: 'Contacted',
      assignedTo: 'Ananya Iyer',
      createdBy: 'Ananya Iyer',
      estimatedValue: 4200000,
      notes: 'Interested in meal counts and multi-company organizational setup.',
      autoFollowUp: true,
      lastContactedAt: new Date(Date.now() - 172800000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'LD-105',
      name: 'Rohan Deshmukh',
      company: 'Deshmukh Infrastructure Ltd',
      email: 'rohan.d@deshmukinfra.in',
      phone: '+91 98220 77889',
      source: 'Cold Outreach',
      status: 'New',
      assignedTo: 'Vikram Sen',
      createdBy: 'Vikram Sen',
      estimatedValue: 3100000,
      notes: 'Needs biometric check-ins at 6 construction sites in Pune.',
      autoFollowUp: true,
      lastContactedAt: null,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'LD-106',
      name: 'Nadia Al-Mansoor',
      company: 'Gulf Horizon Trading India',
      email: 'nadia@gulfhorizon.in',
      phone: '+91 98410 22114',
      source: 'Website Form',
      status: 'Contacted',
      assignedTo: 'Vikram Sen',
      createdBy: 'Vikram Sen',
      estimatedValue: 5200000,
      notes: 'Multi-lingual workforce requirement for distribution hub.',
      autoFollowUp: true,
      lastContactedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  contacts: [
    {
      id: 'CT-201',
      name: 'Priya Sharma',
      email: 'priya.sharma@apexlogistics.io',
      phone: '+91 98401 22345',
      company: 'Apex Global Logistics',
      companyId: 'CMP-301',
      jobTitle: 'VP of Human Resources',
      department: 'Executive HR',
      avatar: '',
      status: 'Customer',
      owner: 'Rajesh Raman',
      address: 'Level 8, Prestige Tech Park, Bengaluru',
      notes: 'Key decision maker for South Asia branch deployment.',
      tags: ['VIP', 'Logistics', 'Enterprise'],
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
      id: 'CT-202',
      name: 'Alexander Vance',
      email: 'a.vance@vancecap.com',
      phone: '+91 98409 33211',
      company: 'Vance Capital Partners',
      companyId: 'CMP-302',
      jobTitle: 'Managing Partner',
      department: 'Executive Board',
      avatar: '',
      status: 'Active',
      owner: 'Ananya Iyer',
      address: 'BKC Financial District, Bandra East, Mumbai',
      notes: 'Requires custom SSO and SAML identity federation integration.',
      tags: ['Finance', 'High-Value'],
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
    },
    {
      id: 'CT-203',
      name: 'Meera Nambiar',
      email: 'meera.nambiar@kanagamtech.com',
      phone: '+91 94440 12890',
      company: 'Kanagam Technologies',
      companyId: 'CMP-303',
      jobTitle: 'Operations Director',
      department: 'Operations',
      avatar: '',
      status: 'Customer',
      owner: 'Rajesh Raman',
      address: 'Mount Road Commercial Complex, Chennai',
      notes: 'Active KwOrKs Enterprise partner division.',
      tags: ['Parent Division', 'Direct Partner'],
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
    },
    {
      id: 'CT-204',
      name: 'Rohan Deshmukh',
      email: 'rohan.d@deshmukinfra.in',
      phone: '+91 98220 77889',
      company: 'Deshmukh Infrastructure Ltd',
      companyId: 'CMP-304',
      jobTitle: 'Chief Projects Officer',
      department: 'Site Engineering',
      avatar: '',
      status: 'Lead',
      owner: 'Vikram Sen',
      address: 'Baner Tech Center, Pune, India',
      notes: 'Needs heavy-duty outdoor facial scanning devices.',
      tags: ['Construction', 'New Account'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  companies: [
    {
      id: 'CMP-301',
      name: 'Apex Global Logistics',
      domain: 'apexlogistics.io',
      industry: 'Supply Chain & Logistics',
      phone: '+91 80 4400 9000',
      website: 'https://apexlogistics.io',
      location: 'Bengaluru, India',
      annualRevenue: 120000000,
      employeeCount: '500-1000',
      tier: 'Enterprise',
      owner: 'Rajesh Raman',
      notes: 'Fleet drivers and warehouse shifts management rollout.',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
    },
    {
      id: 'CMP-302',
      name: 'Vance Capital Partners',
      domain: 'vancecap.com',
      industry: 'Investment Banking & Venture',
      phone: '+91 22 8900 0000',
      website: 'https://vancecap.com',
      location: 'Mumbai, India',
      annualRevenue: 450000000,
      employeeCount: '100-250',
      tier: 'Enterprise',
      owner: 'Ananya Iyer',
      notes: 'Multi-office high security compliance setup.',
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      id: 'CMP-303',
      name: 'Kanagam Technologies',
      domain: 'kanagamtech.com',
      industry: 'Information Technology & Cloud',
      phone: '+91 44 2850 1100',
      website: 'https://kanagam.tech',
      location: 'Chennai, India',
      annualRevenue: 85000000,
      employeeCount: '50-100',
      tier: 'Mid-Market',
      owner: 'Rajesh Raman',
      notes: 'Primary headquarters development lab.',
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
    },
    {
      id: 'CMP-304',
      name: 'Deshmukh Infrastructure Ltd',
      domain: 'deshmukinfra.in',
      industry: 'Civil Engineering & Contracting',
      phone: '+91 20 6700 8800',
      website: 'https://deshmukinfra.in',
      location: 'Pune, India',
      annualRevenue: 180000000,
      employeeCount: '250-500',
      tier: 'Enterprise',
      owner: 'Vikram Sen',
      notes: '6 project sites requiring mobile GPS and offline biometric sync.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ],
  deals: [
    {
      id: 'DL-401',
      title: 'Apex Fleet & Staff Attendance Rollout',
      customerName: 'Priya Sharma',
      customerEmail: 'priya.sharma@apexlogistics.io',
      contactId: 'CT-201',
      company: 'Apex Global Logistics',
      companyId: 'CMP-301',
      amount: 2800000,
      currency: 'INR',
      stage: 'Proposal',
      probability: 70,
      expectedCloseDate: '2026-09-15',
      salesperson: 'Rajesh Raman',
      createdBy: 'Rajesh Raman',
      notes: 'Custom face verification camera kiosks included.',
      closedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: 'DL-402',
      title: 'Vance Capital Global Enterprise Suite',
      customerName: 'Alexander Vance',
      customerEmail: 'a.vance@vancecap.com',
      contactId: 'CT-202',
      company: 'Vance Capital Partners',
      companyId: 'CMP-302',
      amount: 7500000,
      currency: 'INR',
      stage: 'Negotiation',
      probability: 85,
      expectedCloseDate: '2026-09-01',
      salesperson: 'Ananya Iyer',
      createdBy: 'Ananya Iyer',
      notes: 'Legal reviewing master services agreement (MSA).',
      closedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
      id: 'DL-403',
      title: 'Kanagam Cloud Operations License 2026',
      customerName: 'Meera Nambiar',
      customerEmail: 'meera.nambiar@kanagamtech.com',
      contactId: 'CT-203',
      company: 'Kanagam Technologies',
      companyId: 'CMP-303',
      amount: 3200000,
      currency: 'INR',
      stage: 'Closed Won',
      probability: 100,
      expectedCloseDate: '2026-08-20',
      salesperson: 'Rajesh Raman',
      createdBy: 'Rajesh Raman',
      notes: 'Deal finalized and fully invoiced.',
      closedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString()
    },
    {
      id: 'DL-404',
      title: 'Zenith Tech Pilot Implementation',
      customerName: 'Karthik Subramanian',
      customerEmail: 'karthik@zenithtech.in',
      contactId: '',
      company: 'Zenith Tech Systems',
      companyId: '',
      amount: 1450000,
      currency: 'INR',
      stage: 'Discovery',
      probability: 30,
      expectedCloseDate: '2026-09-30',
      salesperson: 'Rajesh Raman',
      createdBy: 'Rajesh Raman',
      notes: 'Initial requirements analysis scheduled for Friday.',
      closedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 'DL-405',
      title: 'Deshmukh Infra Site Biometrics Setup',
      customerName: 'Rohan Deshmukh',
      customerEmail: 'rohan.d@deshmukinfra.in',
      contactId: 'CT-204',
      company: 'Deshmukh Infrastructure Ltd',
      companyId: 'CMP-304',
      amount: 3800000,
      currency: 'INR',
      stage: 'Proposal',
      probability: 60,
      expectedCloseDate: '2026-10-10',
      salesperson: 'Vikram Sen',
      createdBy: 'Vikram Sen',
      notes: 'Proposal for 12 rugged tablet kiosks and GPS attendance licenses.',
      closedAt: null,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  tasks: [
    {
      id: 'TSK-501',
      title: 'Send Revised Commercial Quotation to Alexander Vance',
      description: 'Update pricing table to reflect 3-year term discount (15%) and include SLA guarantee addon.',
      type: 'Contract',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '16:00',
      reminder: true,
      priority: 'High',
      status: 'Pending',
      assignedTo: 'Ananya Iyer',
      relatedToType: 'Deal',
      relatedToId: 'DL-402',
      relatedToName: 'Vance Capital Global Enterprise Suite',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'TSK-502',
      title: 'Schedule Product Architecture Demo with Priya Sharma',
      description: 'Demonstrate offline face recognition telemetry and instant meal-count dashboard to logistics team.',
      type: 'Demo',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      dueTime: '11:30',
      reminder: true,
      priority: 'High',
      status: 'Pending',
      assignedTo: 'Rajesh Raman',
      relatedToType: 'Lead',
      relatedToId: 'LD-101',
      relatedToName: 'Priya Sharma (Apex Global)',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'TSK-503',
      title: 'Conduct 3-Day Inactivity Follow-up for Elena Rostova',
      description: 'Check if European logistics division received the security compliance whitepaper.',
      type: 'Follow-up',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '14:00',
      reminder: true,
      priority: 'Medium',
      status: 'Pending',
      assignedTo: 'Ananya Iyer',
      relatedToType: 'Lead',
      relatedToId: 'LD-104',
      relatedToName: 'Elena Rostova',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: 'TSK-504',
      title: 'Call Rohan Deshmukh regarding Site Geofence Kiosks',
      description: 'Verify cellular signal strength and tablet mounting specs at site #3.',
      type: 'Call',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '15:30',
      reminder: true,
      priority: 'High',
      status: 'Pending',
      assignedTo: 'Vikram Sen',
      relatedToType: 'Deal',
      relatedToId: 'DL-405',
      relatedToName: 'Deshmukh Infra Site Biometrics Setup',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  emails: [
    {
      id: 'EML-601',
      threadId: 'TH-01',
      direction: 'inbound',
      from: 'priya.sharma@apexlogistics.io',
      fromName: 'Priya Sharma',
      to: 'crm@kworks.com',
      toName: 'KwOrKs Enterprise Sales',
      cc: 'operations@apexlogistics.io',
      bcc: '',
      subject: 'Inquiry regarding KwOrKs Biometric Shift Attendance for 500+ Drivers',
      body: 'Hello KwOrKs Sales Team,\n\nWe came across your enterprise platform and are looking for a solution that combines facial recognition attendance with GPS location telemetry for our logistics fleet across 4 hubs.\n\nCould we arrange an interactive demonstration this week? We would also like to see how food count planning works for our shift cafeterias.\n\nThanks & regards,\nPriya Sharma\nVP of Human Resources\nApex Global Logistics',
      snippet: 'We came across your enterprise platform and are looking for a solution that combines facial recognition attendance...',
      folder: 'inbox',
      isRead: true,
      isStarred: true,
      attachments: [
        { name: 'Apex_Fleet_Hub_Locations.pdf', size: '1.4 MB', type: 'application/pdf', data: '' }
      ],
      linkedType: 'Lead',
      linkedId: 'LD-101',
      linkedName: 'Priya Sharma',
      templateUsed: '',
      isAutomated: false,
      automationRule: '',
      sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'EML-602',
      threadId: 'TH-01',
      direction: 'outbound',
      from: 'crm@kworks.com',
      fromName: 'Rajesh Raman (KwOrKs CRM)',
      to: 'priya.sharma@apexlogistics.io',
      toName: 'Priya Sharma',
      cc: '',
      bcc: '',
      subject: 'Re: Inquiry regarding KwOrKs Biometric Shift Attendance for 500+ Drivers',
      body: 'Hi Priya,\n\nThank you for reaching out to KwOrKs! We would be delighted to demonstrate our biometric facial recognition system, live GPS telemetry locks, and cafeteria food-planning modules.\n\nI have scheduled a personalized demo session for tomorrow at 11:30 AM IST. Please find the calendar invite attached.\n\nBest regards,\nRajesh Raman\nSenior Enterprise Solutions Specialist\nKwOrKs Platform',
      snippet: 'Thank you for reaching out to KwOrKs! We would be delighted to demonstrate our biometric facial recognition system...',
      folder: 'sent',
      isRead: true,
      isStarred: false,
      attachments: [
        { name: 'KwOrKs_Enterprise_Overview_2026.pdf', size: '2.8 MB', type: 'application/pdf', data: '' }
      ],
      linkedType: 'Lead',
      linkedId: 'LD-101',
      linkedName: 'Priya Sharma',
      templateUsed: 'tpl-1',
      isAutomated: true,
      automationRule: 'auto-1 (New Lead Welcome Email)',
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      receivedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'EML-603',
      threadId: 'TH-02',
      direction: 'outbound',
      from: 'crm@kworks.com',
      fromName: 'Ananya Iyer (KwOrKs CRM)',
      to: 'a.vance@vancecap.com',
      toName: 'Alexander Vance',
      cc: 'legal@kworks.com',
      bcc: 'executive@kworks.com',
      subject: 'KwOrKs Official Commercial Quotation: Vance Capital Global Enterprise Suite',
      body: 'Dear Alexander,\n\nThank you for considering KwOrKs. Attached to this email is our comprehensive commercial proposal for the Vance Capital Global Enterprise Suite amounting to ₹75,00,000 (INR).\n\nSummary of Scope:\n- Multi-region SOC2 compliant cloud infrastructure\n- Zero-trust Biometric facial telemetry with spectacles-invariance\n- Custom SSO and HRIS synchronization\n- Dedicated Customer Success Manager\n\nPlease let us know if your executive committee has any questions.\n\nWarm regards,\nAnanya Iyer\nVP of Enterprise Accounts\nKwOrKs Platform',
      snippet: 'Attached to this email is our comprehensive commercial proposal for the Vance Capital Global Enterprise Suite...',
      folder: 'sent',
      isRead: true,
      isStarred: true,
      attachments: [
        { name: 'Vance_Capital_Commercial_Quotation_v2.pdf', size: '3.1 MB', type: 'application/pdf', data: '' }
      ],
      linkedType: 'Deal',
      linkedId: 'DL-402',
      linkedName: 'Vance Capital Global Enterprise Suite',
      templateUsed: 'tpl-3',
      isAutomated: true,
      automationRule: 'auto-2 (Deal Created Quotation Dispatch)',
      sentAt: new Date(Date.now() - 43200000).toISOString(),
      receivedAt: new Date(Date.now() - 43200000).toISOString(),
      createdAt: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: 'EML-604',
      threadId: 'TH-03',
      direction: 'outbound',
      from: 'crm@kworks.com',
      fromName: 'Vikram Sen (KwOrKs CRM)',
      to: 'rohan.d@deshmukinfra.in',
      toName: 'Rohan Deshmukh',
      cc: '',
      bcc: '',
      subject: 'KwOrKs Commercial Quotation: Deshmukh Infra Site Biometrics Setup',
      body: 'Hi Rohan,\n\nThank you for your interest. Attached is our quote for 12 site tablet kiosks and offline facial scanning licenses.\n\nBest regards,\nVikram Sen\nInbound Sales Representative\nKwOrKs Platform',
      snippet: 'Thank you for your interest. Attached is our quote for 12 site tablet kiosks...',
      folder: 'sent',
      isRead: true,
      isStarred: false,
      attachments: [],
      linkedType: 'Deal',
      linkedId: 'DL-405',
      linkedName: 'Deshmukh Infra Site Biometrics Setup',
      templateUsed: 'tpl-3',
      isAutomated: true,
      automationRule: 'auto-2 (Deal Created Quotation Dispatch)',
      sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  templates: INITIAL_TEMPLATES,
  automationRules: INITIAL_AUTOMATION_RULES,
  automationLogs: [
    {
      id: 'LOG-701',
      ruleId: 'auto-1',
      ruleName: 'New Lead Welcome Email',
      triggerEvent: 'LEAD_CREATED',
      targetType: 'Lead',
      targetId: 'LD-101',
      targetName: 'Priya Sharma',
      targetEmail: 'priya.sharma@apexlogistics.io',
      status: 'Success',
      message: 'Automated welcome email successfully dispatched to priya.sharma@apexlogistics.io',
      payload: { templateId: 'tpl-1', subject: 'Welcome to KwOrKs, Priya Sharma!' },
      executedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'LOG-702',
      ruleId: 'auto-2',
      ruleName: 'Deal Created Quotation Dispatch',
      triggerEvent: 'DEAL_CREATED',
      targetType: 'Deal',
      targetId: 'DL-402',
      targetName: 'Vance Capital Global Enterprise Suite',
      targetEmail: 'a.vance@vancecap.com',
      status: 'Success',
      message: 'Quotation email dispatched to customer a.vance@vancecap.com for ₹75,00,000 deal.',
      payload: { amount: 7500000, company: 'Vance Capital Partners' },
      executedAt: new Date(Date.now() - 43200000).toISOString()
    }
  ]
};

class CRMDatabase {
  constructor() {
    this.data = this.load();
    this.initMongo();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...INITIAL_DATA,
          ...parsed,
          users: (parsed.users && parsed.users.length) ? parsed.users : INITIAL_USERS,
          quotes: (parsed.quotes && parsed.quotes.length) ? parsed.quotes : INITIAL_QUOTES,
          templates: (parsed.templates && parsed.templates.length) ? parsed.templates : INITIAL_TEMPLATES,
          automationRules: (parsed.automationRules && parsed.automationRules.length) ? parsed.automationRules : INITIAL_AUTOMATION_RULES,
        };
      }
    } catch (e) {
      console.error('Error reading crm_db.json, initializing defaults:', e.message);
    }
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save(fresh);
    return fresh;
  }

  save(dataToSave) {
    const toWrite = dataToSave || this.data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(toWrite, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed writing crm_db.json:', e.message);
    }
  }

  async initMongo() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
    if (mongoUri) {
      const connected = await connectMongoDB(mongoUri);
      if (connected) {
        await this.syncToMongo();
      }
    }
  }

  async syncToMongo() {
    if (!getIsConnected()) return;
    try {
      for (const u of this.data.users) {
        await Models.User?.updateOne({ id: u.id }, u, { upsert: true }).catch(() => {});
      }
      for (const q of (this.data.quotes || [])) {
        await Models.Quote?.updateOne({ id: q.id }, q, { upsert: true }).catch(() => {});
      }
      for (const lead of this.data.leads) {
        await Models.Lead.updateOne({ id: lead.id }, lead, { upsert: true }).catch(() => {});
      }
      for (const contact of this.data.contacts) {
        await Models.Contact.updateOne({ id: contact.id }, contact, { upsert: true }).catch(() => {});
      }
      for (const comp of this.data.companies) {
        await Models.Company.updateOne({ id: comp.id }, comp, { upsert: true }).catch(() => {});
      }
      for (const deal of this.data.deals) {
        await Models.Deal.updateOne({ id: deal.id }, deal, { upsert: true }).catch(() => {});
      }
      for (const task of this.data.tasks) {
        await Models.Task.updateOne({ id: task.id }, task, { upsert: true }).catch(() => {});
      }
      for (const email of this.data.emails) {
        await Models.Email.updateOne({ id: email.id }, email, { upsert: true }).catch(() => {});
      }
      for (const tpl of this.data.templates) {
        await Models.Template.updateOne({ id: tpl.id }, tpl, { upsert: true }).catch(() => {});
      }
      for (const rule of this.data.automationRules) {
        await Models.AutomationRule.updateOne({ id: rule.id }, rule, { upsert: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Sync error:', e.message);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save(this.data);
    return this.data;
  }

  // --- USER ACCOUNTS MANAGEMENT ---
  getUsers() { return this.data.users || INITIAL_USERS; }
  getUserById(id) { return this.getUsers().find(u => u.id === id); }
  getUserByName(name) { return this.getUsers().find(u => u.name.toLowerCase() === (name || '').toLowerCase()); }
  createUser(user) {
    const newUser = {
      id: user.id || `USR-${Math.floor(10 + Math.random() * 90)}`,
      name: user.name || 'New Team Member',
      email: user.email || '',
      role: user.role || 'Employee',
      title: user.title || 'Sales Representative',
      department: user.department || 'Sales & Business Development',
      phone: user.phone || '',
      monthlyQuota: Number(user.monthlyQuota) || 500000,
      status: user.status || 'Active',
      avatar: user.avatar || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users = [newUser, ...(this.data.users || [])];
    this.save();
    return newUser;
  }
  updateUser(id, updates) {
    const idx = (this.data.users || []).findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }
  deleteUser(id) {
    this.data.users = (this.data.users || []).filter(u => u.id !== id);
    this.save();
    return this.data.users;
  }

  // --- QUOTATIONS MANAGEMENT ⭐ (NEW) ---
  getQuotes(scopedUser = null) {
    const all = this.data.quotes || INITIAL_QUOTES;
    if (!scopedUser) return all;
    const userObj = this.getUserByName(scopedUser);
    if (userObj && userObj.role === 'Employee') {
      return all.filter(q => q.createdBy === userObj.name);
    }
    return all;
  }
  getQuoteById(id) { return (this.data.quotes || []).find(q => q.id === id); }
  createQuote(quote, createdBy = 'Rajesh Raman') {
    const nextNum = (this.data.quotes || []).length + 1;
    const quoteNum = quote.quoteNumber || `QT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
    
    // calculate totals
    const items = Array.isArray(quote.items) ? quote.items : [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.unitPrice) * Number(item.quantity || 1))), 0);
    const taxPercent = quote.taxPercent !== undefined ? Number(quote.taxPercent) : 18;
    const discountAmount = Number(quote.discountAmount) || 0;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxable * (taxPercent / 100));
    const grandTotal = taxable + taxAmount;

    const newQuote = {
      id: quote.id || `QT-${Math.floor(100 + Math.random() * 900)}`,
      quoteNumber: quoteNum,
      title: quote.title || 'Official Commercial Quotation',
      customerName: quote.customerName || '',
      customerEmail: quote.customerEmail || '',
      customerPhone: quote.customerPhone || '',
      company: quote.company || '',
      companyId: quote.companyId || '',
      dealId: quote.dealId || '',
      dealTitle: quote.dealTitle || '',
      status: quote.status || 'Draft',
      items: items.map(it => ({
        description: it.description || 'Enterprise Module',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        discountPercent: Number(it.discountPercent) || 0,
        amount: Number(it.amount) || ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1))
      })),
      subtotal: quote.subtotal || subtotal,
      taxPercent: taxPercent,
      taxAmount: quote.taxAmount || taxAmount,
      discountAmount: discountAmount,
      grandTotal: quote.grandTotal || grandTotal,
      currency: quote.currency || 'INR',
      validUntil: quote.validUntil || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      termsAndConditions: quote.termsAndConditions || '1. Quotation validity: 30 days.\n2. Payment terms: 50% advance, 50% on deployment.\n3. GST 18% applied as per Indian statutory norms.\n4. Comprehensive 1-year priority SLA support included.',
      notes: quote.notes || '',
      createdBy: quote.createdBy || createdBy,
      sentAt: quote.status === 'Sent' ? new Date().toISOString() : null,
      acceptedAt: quote.status === 'Accepted' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.quotes = [newQuote, ...(this.data.quotes || [])];
    this.save();
    if (getIsConnected()) Models.Quote.create(newQuote).catch(() => {});
    return newQuote;
  }
  updateQuote(id, updates) {
    const idx = (this.data.quotes || []).findIndex(q => q.id === id);
    if (idx === -1) return null;
    const existing = this.data.quotes[idx];
    const isNowAccepted = updates.status === 'Accepted' && existing.status !== 'Accepted';
    const isNowSent = updates.status === 'Sent' && existing.status !== 'Sent';

    this.data.quotes[idx] = {
      ...existing,
      ...updates,
      acceptedAt: isNowAccepted ? new Date().toISOString() : existing.acceptedAt,
      sentAt: isNowSent ? new Date().toISOString() : existing.sentAt,
      updatedAt: new Date().toISOString()
    };
    this.save();
    if (getIsConnected()) Models.Quote.updateOne({ id }, updates).catch(() => {});
    return this.data.quotes[idx];
  }
  deleteQuote(id) {
    this.data.quotes = (this.data.quotes || []).filter(q => q.id !== id);
    this.save();
    if (getIsConnected()) Models.Quote.deleteOne({ id }).catch(() => {});
    return this.data.quotes;
  }

  // --- LEADS ---
  getLeads(scopedUser = null) {
    const all = this.data.leads || [];
    if (!scopedUser) return all;
    const userObj = this.getUserByName(scopedUser);
    if (userObj && userObj.role === 'Employee') {
      return all.filter(l => l.assignedTo === userObj.name || l.createdBy === userObj.name);
    }
    return all;
  }
  getLeadById(id) { return (this.data.leads || []).find(l => l.id === id); }
  createLead(lead, createdBy = 'Rajesh Raman') {
    const newLead = {
      id: lead.id || `LD-${Math.floor(100 + Math.random() * 900)}`,
      name: lead.name || 'Unnamed Lead',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'Website Form',
      status: lead.status || 'New',
      assignedTo: lead.assignedTo || createdBy,
      createdBy: createdBy,
      estimatedValue: Number(lead.estimatedValue) || 0,
      notes: lead.notes || '',
      autoFollowUp: lead.autoFollowUp !== undefined ? lead.autoFollowUp : true,
      lastContactedAt: lead.lastContactedAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.leads = [newLead, ...(this.data.leads || [])];
    this.save();
    if (getIsConnected()) Models.Lead.create(newLead).catch(() => {});
    return newLead;
  }
  updateLead(id, updates) {
    const idx = (this.data.leads || []).findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.data.leads[idx] = { ...this.data.leads[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    if (getIsConnected()) Models.Lead.updateOne({ id }, updates).catch(() => {});
    return this.data.leads[idx];
  }
  deleteLead(id) {
    this.data.leads = (this.data.leads || []).filter(l => l.id !== id);
    this.save();
    if (getIsConnected()) Models.Lead.deleteOne({ id }).catch(() => {});
    return this.data.leads;
  }

  // --- CONTACTS ---
  getContacts(scopedUser = null) {
    const all = this.data.contacts || [];
    if (!scopedUser) return all;
    const userObj = this.getUserByName(scopedUser);
    if (userObj && userObj.role === 'Employee') {
      return all.filter(c => c.owner === userObj.name);
    }
    return all;
  }
  getContactById(id) { return (this.data.contacts || []).find(c => c.id === id); }
  createContact(contact, createdBy = 'Rajesh Raman') {
    const newContact = {
      id: contact.id || `CT-${Math.floor(100 + Math.random() * 900)}`,
      name: contact.name || 'Unnamed Contact',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      companyId: contact.companyId || '',
      jobTitle: contact.jobTitle || 'Executive',
      department: contact.department || 'General',
      avatar: contact.avatar || '',
      status: contact.status || 'Active',
      owner: contact.owner || createdBy,
      address: contact.address || '',
      notes: contact.notes || '',
      tags: Array.isArray(contact.tags) ? contact.tags : ['New'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.contacts = [newContact, ...(this.data.contacts || [])];
    this.save();
    if (getIsConnected()) Models.Contact.create(newContact).catch(() => {});
    return newContact;
  }
  updateContact(id, updates) {
    const idx = (this.data.contacts || []).findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.contacts[idx] = { ...this.data.contacts[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    if (getIsConnected()) Models.Contact.updateOne({ id }, updates).catch(() => {});
    return this.data.contacts[idx];
  }
  deleteContact(id) {
    this.data.contacts = (this.data.contacts || []).filter(c => c.id !== id);
    this.save();
    if (getIsConnected()) Models.Contact.deleteOne({ id }).catch(() => {});
    return this.data.contacts;
  }

  // --- COMPANIES ---
  getCompanies() { return this.data.companies || []; }
  getCompanyById(id) { return (this.data.companies || []).find(c => c.id === id); }
  createCompany(comp, createdBy = 'Rajesh Raman') {
    const newComp = {
      id: comp.id || `CMP-${Math.floor(100 + Math.random() * 900)}`,
      name: comp.name || 'New Organization',
      domain: comp.domain || '',
      industry: comp.industry || 'Technology',
      phone: comp.phone || '',
      website: comp.website || '',
      location: comp.location || 'Remote',
      annualRevenue: Number(comp.annualRevenue) || 0,
      employeeCount: comp.employeeCount || '10-50',
      tier: comp.tier || 'SMB',
      owner: comp.owner || createdBy,
      notes: comp.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.companies = [newComp, ...(this.data.companies || [])];
    this.save();
    if (getIsConnected()) Models.Company.create(newComp).catch(() => {});
    return newComp;
  }
  updateCompany(id, updates) {
    const idx = (this.data.companies || []).findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.companies[idx] = { ...this.data.companies[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    if (getIsConnected()) Models.Company.updateOne({ id }, updates).catch(() => {});
    return this.data.companies[idx];
  }
  deleteCompany(id) {
    this.data.companies = (this.data.companies || []).filter(c => c.id !== id);
    this.save();
    if (getIsConnected()) Models.Company.deleteOne({ id }).catch(() => {});
    return this.data.companies;
  }

  // --- DEALS ---
  getDeals(scopedUser = null) {
    const all = this.data.deals || [];
    if (!scopedUser) return all;
    const userObj = this.getUserByName(scopedUser);
    if (userObj && userObj.role === 'Employee') {
      return all.filter(d => d.salesperson === userObj.name || d.createdBy === userObj.name);
    }
    return all;
  }
  getDealById(id) { return (this.data.deals || []).find(d => d.id === id); }
  createDeal(deal, createdBy = 'Rajesh Raman') {
    const stageProbMap = {
      'Discovery': 20,
      'Proposal': 50,
      'Negotiation': 80,
      'Closed Won': 100,
      'Closed Lost': 0
    };
    const stage = deal.stage || 'Discovery';
    const newDeal = {
      id: deal.id || `DL-${Math.floor(100 + Math.random() * 900)}`,
      title: deal.title || 'New Deal Opportunity',
      customerName: deal.customerName || '',
      customerEmail: deal.customerEmail || '',
      contactId: deal.contactId || '',
      company: deal.company || '',
      companyId: deal.companyId || '',
      amount: Number(deal.amount) || 0,
      currency: deal.currency || 'INR',
      stage: stage,
      probability: deal.probability !== undefined ? Number(deal.probability) : (stageProbMap[stage] || 20),
      expectedCloseDate: deal.expectedCloseDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      salesperson: deal.salesperson || createdBy,
      createdBy: createdBy,
      notes: deal.notes || '',
      closedAt: stage === 'Closed Won' || stage === 'Closed Lost' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.deals = [newDeal, ...(this.data.deals || [])];
    this.save();
    if (getIsConnected()) Models.Deal.create(newDeal).catch(() => {});
    return newDeal;
  }
  updateDeal(id, updates) {
    const idx = (this.data.deals || []).findIndex(d => d.id === id);
    if (idx === -1) return null;
    const existing = this.data.deals[idx];
    const isNowWon = updates.stage === 'Closed Won' && existing.stage !== 'Closed Won';
    const isNowLost = updates.stage === 'Closed Lost' && existing.stage !== 'Closed Lost';
    const closedAt = (isNowWon || isNowLost) ? new Date().toISOString() : (updates.stage && !['Closed Won', 'Closed Lost'].includes(updates.stage) ? null : existing.closedAt);

    this.data.deals[idx] = { 
      ...existing, 
      ...updates, 
      closedAt,
      updatedAt: new Date().toISOString() 
    };
    this.save();
    if (getIsConnected()) Models.Deal.updateOne({ id }, updates).catch(() => {});
    return this.data.deals[idx];
  }
  deleteDeal(id) {
    this.data.deals = (this.data.deals || []).filter(d => d.id !== id);
    this.save();
    if (getIsConnected()) Models.Deal.deleteOne({ id }).catch(() => {});
    return this.data.deals;
  }

  // --- TASKS ---
  getTasks(scopedUser = null) {
    const all = this.data.tasks || [];
    if (!scopedUser) return all;
    const userObj = this.getUserByName(scopedUser);
    if (userObj && userObj.role === 'Employee') {
      return all.filter(t => t.assignedTo === userObj.name);
    }
    return all;
  }
  getTaskById(id) { return (this.data.tasks || []).find(t => t.id === id); }
  createTask(task, createdBy = 'Rajesh Raman') {
    const newTask = {
      id: task.id || `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: task.title || 'New Follow-up Task',
      description: task.description || '',
      type: task.type || 'Follow-up',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      dueTime: task.dueTime || '17:00',
      reminder: task.reminder !== undefined ? task.reminder : true,
      reminderDate: task.reminderDate || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Pending',
      assignedTo: task.assignedTo || createdBy,
      relatedToType: task.relatedToType || 'None',
      relatedToId: task.relatedToId || '',
      relatedToName: task.relatedToName || '',
      completedAt: task.status === 'Completed' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.tasks = [newTask, ...(this.data.tasks || [])];
    this.save();
    if (getIsConnected()) Models.Task.create(newTask).catch(() => {});
    return newTask;
  }
  updateTask(id, updates) {
    const idx = (this.data.tasks || []).findIndex(t => t.id === id);
    if (idx === -1) return null;
    const existing = this.data.tasks[idx];
    const completedAt = updates.status === 'Completed' && existing.status !== 'Completed' ? new Date().toISOString() : (updates.status === 'Pending' ? null : existing.completedAt);

    this.data.tasks[idx] = { 
      ...existing, 
      ...updates, 
      completedAt,
      updatedAt: new Date().toISOString() 
    };
    this.save();
    if (getIsConnected()) Models.Task.updateOne({ id }, updates).catch(() => {});
    return this.data.tasks[idx];
  }
  deleteTask(id) {
    this.data.tasks = (this.data.tasks || []).filter(t => t.id !== id);
    this.save();
    if (getIsConnected()) Models.Task.deleteOne({ id }).catch(() => {});
    return this.data.tasks;
  }

  // --- EMAILS ---
  getEmails(scopedUser = null) {
    const all = this.data.emails || [];
    if (!scopedUser) return all;
    const userObj = this.getUserByName(scopedUser);
    if (userObj && userObj.role === 'Employee') {
      const userLeads = this.getLeads(scopedUser).map(l => l.email.toLowerCase());
      const userContacts = this.getContacts(scopedUser).map(c => c.email.toLowerCase());
      return all.filter(e => 
        e.from.toLowerCase().includes(userObj.email.toLowerCase()) ||
        e.to.toLowerCase().includes(userObj.email.toLowerCase()) ||
        (e.fromName && e.fromName.includes(userObj.name)) ||
        (e.toName && e.toName.includes(userObj.name)) ||
        userLeads.includes(e.from.toLowerCase()) ||
        userLeads.includes(e.to.toLowerCase()) ||
        userContacts.includes(e.from.toLowerCase()) ||
        userContacts.includes(e.to.toLowerCase())
      );
    }
    return all;
  }
  getEmailById(id) { return (this.data.emails || []).find(e => e.id === id); }
  createEmail(email) {
    const snippet = (email.body || '').replace(/<[^>]*>?/gm, '').slice(0, 140) + '...';
    const newEmail = {
      id: email.id || `EML-${Math.floor(100 + Math.random() * 900)}`,
      threadId: email.threadId || `TH-${Math.floor(10 + Math.random() * 90)}`,
      direction: email.direction || 'outbound',
      from: email.from || 'crm@kworks.com',
      fromName: email.fromName || 'KwOrKs CRM',
      to: email.to || '',
      toName: email.toName || '',
      cc: email.cc || '',
      bcc: email.bcc || '',
      subject: email.subject || 'No Subject',
      body: email.body || '',
      snippet: email.snippet || snippet,
      folder: email.folder || (email.direction === 'inbound' ? 'inbox' : 'sent'),
      isRead: email.isRead !== undefined ? email.isRead : (email.direction === 'outbound'),
      isStarred: email.isStarred || false,
      attachments: Array.isArray(email.attachments) ? email.attachments : [],
      linkedType: email.linkedType || 'None',
      linkedId: email.linkedId || '',
      linkedName: email.linkedName || '',
      templateUsed: email.templateUsed || '',
      isAutomated: !!email.isAutomated,
      automationRule: email.automationRule || '',
      sentAt: email.sentAt || new Date().toISOString(),
      receivedAt: email.receivedAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.data.emails = [newEmail, ...(this.data.emails || [])];
    this.save();
    if (getIsConnected()) Models.Email.create(newEmail).catch(() => {});
    return newEmail;
  }
  updateEmail(id, updates) {
    const idx = (this.data.emails || []).findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.emails[idx] = { ...this.data.emails[idx], ...updates };
    this.save();
    if (getIsConnected()) Models.Email.updateOne({ id }, updates).catch(() => {});
    return this.data.emails[idx];
  }
  deleteEmail(id) {
    const email = this.getEmailById(id);
    if (email && email.folder !== 'trash') {
      return this.updateEmail(id, { folder: 'trash' });
    }
    this.data.emails = (this.data.emails || []).filter(e => e.id !== id);
    this.save();
    if (getIsConnected()) Models.Email.deleteOne({ id }).catch(() => {});
    return this.data.emails;
  }

  // --- TEMPLATES ---
  getTemplates() { return this.data.templates || []; }
  getTemplateById(id) { return this.getTemplates().find(t => t.id === id); }
  createTemplate(tpl) {
    const newTpl = {
      id: tpl.id || `tpl-${Date.now()}`,
      name: tpl.name || 'Custom Email Template',
      category: tpl.category || 'General',
      subject: tpl.subject || '',
      body: tpl.body || '',
      variables: Array.isArray(tpl.variables) ? tpl.variables : ['name', 'company', 'salesperson'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.templates = [newTpl, ...(this.data.templates || [])];
    this.save();
    if (getIsConnected()) Models.Template.create(newTpl).catch(() => {});
    return newTpl;
  }
  updateTemplate(id, updates) {
    const idx = (this.data.templates || []).findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.templates[idx] = { ...this.data.templates[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    if (getIsConnected()) Models.Template.updateOne({ id }, updates).catch(() => {});
    return this.data.templates[idx];
  }
  deleteTemplate(id) {
    this.data.templates = (this.data.templates || []).filter(t => t.id !== id);
    this.save();
    if (getIsConnected()) Models.Template.deleteOne({ id }).catch(() => {});
    return this.data.templates;
  }

  // --- AUTOMATIONS & LOGS ---
  getAutomationRules() { return this.data.automationRules || []; }
  getAutomationLogs() { return this.data.automationLogs || []; }
  updateAutomationRule(id, updates) {
    const idx = (this.data.automationRules || []).findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.automationRules[idx] = { ...this.data.automationRules[idx], ...updates };
    this.save();
    if (getIsConnected()) Models.AutomationRule.updateOne({ id }, updates).catch(() => {});
    return this.data.automationRules[idx];
  }
  logAutomation(log) {
    const newLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      ruleId: log.ruleId || '',
      ruleName: log.ruleName || 'Automated Action',
      triggerEvent: log.triggerEvent || '',
      targetType: log.targetType || '',
      targetId: log.targetId || '',
      targetName: log.targetName || '',
      targetEmail: log.targetEmail || '',
      status: log.status || 'Success',
      message: log.message || '',
      payload: log.payload || {},
      executedAt: new Date().toISOString()
    };
    this.data.automationLogs = [newLog, ...(this.data.automationLogs || [])].slice(0, 50);
    this.save();
    if (getIsConnected()) Models.AutomationLog.create(newLog).catch(() => {});
    return newLog;
  }
}

module.exports = new CRMDatabase();
