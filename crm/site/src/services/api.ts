import {
  Lead,
  Contact,
  Company,
  Deal,
  Task,
  Email,
  EmailTemplate,
  AutomationRule,
  AutomationLog,
  DashboardMetrics,
  UserAccount,
  Quotation
} from '../types/crm';

const RAW_URL = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5001').trim().replace(/\/+$/, '');
const API_BASE = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL}/api`;

export const api = {
  // 0. User Account Management & Team Directory
  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // --- QUOTATIONS & COMMERCIAL PROPOSALS (NEW) ⭐ ---
  async getQuotes(scopedUser?: string): Promise<Quotation[]> {
    try {
      const url = scopedUser ? `${API_BASE}/quotes?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/quotes`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createQuote(quote: Partial<Quotation>): Promise<Quotation | null> {
    try {
      const res = await fetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateQuote(id: string, updates: Partial<Quotation>): Promise<Quotation | null> {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteQuote(id: string): Promise<Quotation[]> {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async sendQuoteEmail(id: string): Promise<{ quote: Quotation; email: any } | null> {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}/send`, { method: 'POST' });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async acceptQuote(id: string): Promise<{ quote: Quotation; deal: any } | null> {
    try {
      const res = await fetch(`${API_BASE}/quotes/${id}/accept`, { method: 'POST' });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async createUser(user: Partial<UserAccount>): Promise<UserAccount | null> {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteUser(id: string): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // 1. Dashboard (supports scoped user view)
  async getDashboard(scopedUser?: string): Promise<{ metrics: DashboardMetrics; todayTasks: Task[]; recentLeads: Lead[]; recentDeals: Deal[]; recentEmails: Email[] } | null> {
    try {
      const url = scopedUser ? `${API_BASE}/dashboard?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/dashboard`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : null;
    } catch (e) {
      console.warn('Dashboard fetch failed:', e);
      return null;
    }
  },

  // 2. Leads
  async getLeads(scopedUser?: string): Promise<Lead[]> {
    try {
      const url = scopedUser ? `${API_BASE}/leads?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/leads`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createLead(lead: Partial<Lead>): Promise<Lead | null> {
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteLead(id: string): Promise<Lead[]> {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async convertLead(id: string): Promise<{ contact: Contact; deal: Deal; company: Company } | null> {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}/convert`, { method: 'POST' });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  // 3. Contacts
  async getContacts(scopedUser?: string): Promise<Contact[]> {
    try {
      const url = scopedUser ? `${API_BASE}/contacts?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/contacts`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createContact(contact: Partial<Contact>): Promise<Contact | null> {
    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteContact(id: string): Promise<Contact[]> {
    try {
      const res = await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // 4. Companies
  async getCompanies(): Promise<Company[]> {
    try {
      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createCompany(comp: Partial<Company>): Promise<Company | null> {
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comp)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company | null> {
    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteCompany(id: string): Promise<Company[]> {
    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // 5. Deals
  async getDeals(scopedUser?: string): Promise<Deal[]> {
    try {
      const url = scopedUser ? `${API_BASE}/deals?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/deals`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createDeal(deal: Partial<Deal>): Promise<Deal | null> {
    try {
      const res = await fetch(`${API_BASE}/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteDeal(id: string): Promise<Deal[]> {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // 6. Tasks & Follow-ups
  async getTasks(scopedUser?: string): Promise<Task[]> {
    try {
      const url = scopedUser ? `${API_BASE}/tasks?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/tasks`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createTask(task: Partial<Task>): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteTask(id: string): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  // 7. Email Engine
  async getEmails(scopedUser?: string): Promise<Email[]> {
    try {
      const url = scopedUser ? `${API_BASE}/emails?user=${encodeURIComponent(scopedUser)}` : `${API_BASE}/emails`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async sendEmail(emailPayload: {
    to: string;
    toName?: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    templateId?: string;
    linkedType?: string;
    linkedId?: string;
    linkedName?: string;
    attachments?: any[];
  }): Promise<Email | null> {
    try {
      const res = await fetch(`${API_BASE}/emails/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async simulateInboundEmail(payload: {
    from: string;
    fromName?: string;
    subject: string;
    body: string;
    attachments?: any[];
  }): Promise<{ email: Email; matchedCustomer: any } | null> {
    try {
      const res = await fetch(`${API_BASE}/emails/simulate-inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data.success ? { email: data.data, matchedCustomer: data.matchedCustomer } : null;
    } catch {
      return null;
    }
  },

  async markEmailAsLead(id: string, leadData?: Partial<Lead>): Promise<{ lead: Lead; email: Email } | null> {
    try {
      const res = await fetch(`${API_BASE}/emails/${id}/mark-as-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData || {})
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email | null> {
    try {
      const res = await fetch(`${API_BASE}/emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteEmail(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/emails/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async identifyCustomerByEmail(email: string): Promise<{ type: string; id: string; name: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/emails/identify?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  // 8. Templates
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const res = await fetch(`${API_BASE}/templates`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async createTemplate(tpl: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      const res = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tpl)
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  // 9. Automations & Webhook
  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const res = await fetch(`${API_BASE}/automations/rules`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async toggleAutomationRule(id: string, isActive: boolean): Promise<AutomationRule | null> {
    try {
      const res = await fetch(`${API_BASE}/automations/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async getAutomationLogs(): Promise<AutomationLog[]> {
    try {
      const res = await fetch(`${API_BASE}/automations/logs`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async triggerAutomation(event: string, payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/automations/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload })
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async submitPublicLeadForm(formPayload: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    message?: string;
    estimatedBudget?: number;
  }): Promise<any> {
    try {
      const res = await fetch(`${RAW_URL}/webhook/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload)
      });
      const data = await res.json();
      return data.success ? data : null;
    } catch {
      return null;
    }
  },

  // 10. Reports
  async getReports(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  // 11. Reset DB
  async resetDatabase(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/db/reset`, { method: 'POST' });
      const data = await res.json();
      return !!data.success;
    } catch {
      return false;
    }
  }
};
