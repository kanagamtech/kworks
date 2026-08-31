export type UserRole = 'Manager' | 'Employee' | 'Admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  phone?: string;
  monthlyQuota?: number;
  status: 'Active' | 'Inactive';
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export type LeadSource = 
  | 'Website Form' 
  | 'Referral' 
  | 'LinkedIn' 
  | 'Inbound Call' 
  | 'Cold Outreach' 
  | 'Event / Conference' 
  | 'Other';

export type LeadStatus = 
  | 'New' 
  | 'Contacted' 
  | 'Qualified' 
  | 'Proposal Sent' 
  | 'Converted' 
  | 'Unqualified';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  createdBy?: string;
  estimatedValue: number;
  notes: string;
  autoFollowUp: boolean;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  companyId?: string;
  jobTitle: string;
  department: string;
  avatar?: string;
  status: 'Active' | 'Lead' | 'Customer' | 'Archived';
  owner: string;
  address?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  phone: string;
  website: string;
  location: string;
  annualRevenue: number;
  employeeCount: string;
  tier: 'Enterprise' | 'Mid-Market' | 'Startup' | 'SMB';
  owner: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type DealStage = 
  | 'Discovery' 
  | 'Proposal' 
  | 'Negotiation' 
  | 'Closed Won' 
  | 'Closed Lost';

export interface Deal {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  contactId?: string;
  company: string;
  companyId?: string;
  amount: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  salesperson: string;
  createdBy?: string;
  notes?: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// --- QUOTATIONS & COMMERCIAL PROPOSALS (NEW) ⭐ ---
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  company: string;
  companyId?: string;
  dealId?: string;
  dealTitle?: string;
  status: QuoteStatus;
  items: QuoteLineItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  currency: string;
  validUntil: string;
  termsAndConditions: string;
  notes?: string;
  createdBy: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type TaskType = 
  | 'Follow-up' 
  | 'Call' 
  | 'Meeting' 
  | 'Email' 
  | 'Demo' 
  | 'Contract' 
  | 'General';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  dueDate: string;
  dueTime: string;
  reminder: boolean;
  reminderDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  relatedToType?: 'Lead' | 'Contact' | 'Deal' | 'Company' | 'None';
  relatedToId?: string;
  relatedToName?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface EmailAttachment {
  name: string;
  size: string;
  type: string;
  data?: string;
}

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archived';

export interface Email {
  id: string;
  threadId?: string;
  direction: 'inbound' | 'outbound';
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  snippet?: string;
  folder: EmailFolder;
  isRead: boolean;
  isStarred: boolean;
  attachments?: EmailAttachment[];
  linkedType?: 'Lead' | 'Contact' | 'Deal' | 'Company' | 'None';
  linkedId?: string;
  linkedName?: string;
  templateUsed?: string;
  isAutomated?: boolean;
  automationRule?: string;
  sentAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'Welcome' | 'Follow-up' | 'Quotation' | 'Payment Reminder' | 'Thank You' | 'Meeting Confirmation' | 'General';
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
}

export type AutomationTrigger = 
  | 'LEAD_CREATED' 
  | 'DEAL_CREATED' 
  | 'DEAL_WON' 
  | 'NO_RESPONSE_3_DAYS' 
  | 'TASK_DUE_TOMORROW' 
  | 'WEBSITE_FORM_SUBMITTED';

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: AutomationTrigger;
  actionType: 'SEND_EMAIL' | 'CREATE_TASK' | 'UPDATE_STATUS' | 'NOTIFY_USER';
  templateId?: string;
  emailSubject?: string;
  emailBody?: string;
  isActive: boolean;
  executionsCount: number;
  lastExecutedAt?: string | null;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  targetType: string;
  targetId: string;
  targetName: string;
  targetEmail: string;
  status: 'Success' | 'Failed' | 'Skipped';
  message: string;
  payload?: any;
  executedAt: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  pipelineValue: number;
  openDealsCount: number;
  newLeadsCount: number;
  totalLeads: number;
  totalContacts: number;
  totalDeals: number;
  todayTasksCount: number;
  pendingFollowupsCount: number;
  winRate: number;
  conversionRate: number;
  emailsCount: number;
  unreadEmailsCount: number;
}

export interface EmployeePerformance {
  name: string;
  role: string;
  userRole?: UserRole;
  wonRevenue: number;
  dealsCount: number;
  leadsCount: number;
  tasksDone: number;
  monthlyQuota?: number;
}

// --- Sales Lifecycle & Revenue Forecasting Engine Types ⭐ ---
export type LeadLifecycleStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED';
export type DealForecastStage = 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type OrderLifecycleStatus = 'DRAFT_QUOTE' | 'QUOTE_SENT' | 'REVISED_QUOTE' | 'PO_RECEIVED' | 'SO_GENERATED' | 'FULFILLED';
export type PostSaleFeedbackStatus = 'SURVEY_SENT' | 'SATISFIED' | 'ESCALATED';

export interface ForecastStageConfig {
  stage: DealForecastStage;
  label: string;
  weight: number; // e.g. 0.20, 0.50, 0.80, 1.00, 0.00
  description: string;
  triggerAction: string;
}

export interface LifecycleItem {
  id: string;
  customerName: string;
  company: string;
  email: string;
  phone: string;
  assignedTo: string;
  estimatedValue: number;
  leadStatus: LeadLifecycleStatus;
  dealStage?: DealForecastStage;
  dealAmount?: number;
  orderStatus?: OrderLifecycleStatus;
  feedbackStatus?: PostSaleFeedbackStatus;
  satisfactionRating?: number; // 1 to 5
  feedbackNotes?: string;
  lastUpdated: string;
  createdAt: string;
  history: Array<{
    module: 'Lead' | 'Deal' | 'Order' | 'Feedback';
    from: string;
    to: string;
    timestamp: string;
    triggerNote: string;
  }>;
}
