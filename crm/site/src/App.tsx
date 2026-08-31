import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { TopNav, CRMTab } from './components/TopNav';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PublicFormModal } from './pages/PublicFormModal';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { AccountsContactsPage } from './pages/AccountsContactsPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { DealsPage } from './pages/DealsPage';
import { TasksPage } from './pages/TasksPage';
import { EmailPage } from './pages/EmailPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ForecastPage } from './pages/ForecastPage';
import { AccountManagementPage } from './pages/AccountManagementPage';
import { COLORS } from './styles/theme';
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
} from './types/crm';

export const App: React.FC = () => {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<CRMTab>('dashboard');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [portalMode, setPortalMode] = useState<'crm' | 'management_link' | 'hr_link'>('crm');

  // Modals & Toast State
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);
  const [isComposeEmailOpen, setIsComposeEmailOpen] = useState(false);
  const [emailPrefill, setEmailPrefill] = useState<{ to: string; toName?: string; linkedId?: string; subject?: string; body?: string } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // CRM Data States
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [recentEmails, setRecentEmails] = useState<Email[]>([]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', message: string, title?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load of users
  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
      if (fetchedUsers.length > 0 && !currentUser) {
        setCurrentUser(fetchedUsers[0]);
      }
    };
    loadUsers();
  }, []);

  // Load all CRM datasets (Scoped by active user role)
  const loadAllCRMData = async (userToScope?: UserAccount | null) => {
    try {
      const activeU = userToScope !== undefined ? userToScope : currentUser;
      const scopedUserName = (activeU && activeU.role === 'Employee') ? activeU.name : undefined;

      const [dash, lds, cts, cps, dls, qts, tsks, emls, tpls, rls, lgs, usrs] = await Promise.all([
        api.getDashboard(scopedUserName),
        api.getLeads(scopedUserName),
        api.getContacts(scopedUserName),
        api.getCompanies(),
        api.getDeals(scopedUserName),
        api.getQuotes(scopedUserName),
        api.getTasks(scopedUserName),
        api.getEmails(scopedUserName),
        api.getTemplates(),
        api.getAutomationRules(),
        api.getAutomationLogs(),
        api.getUsers(),
      ]);

      if (dash) {
        setMetrics(dash.metrics);
        setTodayTasks(dash.todayTasks || []);
        setRecentLeads(dash.recentLeads || []);
        setRecentDeals(dash.recentDeals || []);
        setRecentEmails(dash.recentEmails || []);
      }

      setLeads(lds);
      setContacts(cts);
      setCompanies(cps);
      setDeals(dls);
      setQuotes(qts);
      setTasks(tsks);
      setEmails(emls);
      setTemplates(tpls);
      setAutomationRules(rls);
      setAutomationLogs(lgs);
      if (usrs.length > 0) setUsers(usrs);
    } catch (e) {
      console.warn('Error syncing CRM data:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllCRMData(currentUser);
      const interval = setInterval(() => loadAllCRMData(currentUser), 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, currentUser?.role]);

  const handleUserPersonaChange = (newUser: UserAccount) => {
    setCurrentUser(newUser);
    loadAllCRMData(newUser);
    // If switching to Employee and on 'team' tab, navigate back to dashboard
    if (newUser.role === 'Employee' && activeTab === 'team') {
      setActiveTab('dashboard');
    }
    addToast(
      'info',
      `Switched active persona to ${newUser.name} (${newUser.role === 'Manager' ? '👑 Manager - All Accounts Access' : '👤 Employee - Scoped to Assigned Data Only'})`,
      'Persona Switched'
    );
  };

  // --- Handlers for User Accounts (Manager Only) ---
  const handleAddUser = async (userData: Partial<UserAccount>) => {
    const created = await api.createUser(userData);
    if (created) {
      setUsers([created, ...users]);
      addToast('success', `Team Member "${created.name}" created with role: ${created.role}.`, 'Team Member Added');
      loadAllCRMData();
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserAccount>) => {
    const updated = await api.updateUser(id, updates);
    if (updated) {
      setUsers(users.map((u) => (u.id === id ? updated : u)));
      if (currentUser?.id === id) {
        setCurrentUser(updated);
      }
      addToast('info', `Account updated for ${updated.name}. Role: ${updated.role}`);
      loadAllCRMData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    const remaining = await api.deleteUser(id);
    setUsers(remaining);
    addToast('warning', 'Team member removed.');
    loadAllCRMData();
  };

  // --- Handlers for Quotations ⭐ (NEW) ---
  const handleCreateQuote = async (quoteData: Partial<Quotation>) => {
    const created = await api.createQuote({
      ...quoteData,
      createdBy: currentUser?.name || 'Rajesh Raman',
    });
    if (created) {
      setQuotes([created, ...quotes]);
      addToast('success', `Commercial Quotation "${created.quoteNumber}" generated for ${created.company}!`, 'Quote Generated');
      loadAllCRMData();
    }
  };

  const handleUpdateQuote = async (id: string, updates: Partial<Quotation>) => {
    const updated = await api.updateQuote(id, updates);
    if (updated) {
      setQuotes(quotes.map((q) => (q.id === id ? updated : q)));
      addToast('info', `Quotation ${updated.quoteNumber} updated.`);
      loadAllCRMData();
    }
  };

  const handleDeleteQuote = async (id: string) => {
    const remaining = await api.deleteQuote(id);
    setQuotes(remaining);
    addToast('warning', 'Quotation removed.');
    loadAllCRMData();
  };

  const handleSendQuoteEmail = async (id: string) => {
    const res = await api.sendQuoteEmail(id);
    if (res) {
      setQuotes(quotes.map((q) => (q.id === id ? res.quote : q)));
      addToast('success', `Official commercial quotation email dispatched to ${res.quote.customerEmail}!`, 'Quote Dispatched');
      loadAllCRMData();
    }
  };

  const handleAcceptQuote = async (id: string) => {
    const res = await api.acceptQuote(id);
    if (res) {
      setQuotes(quotes.map((q) => (q.id === id ? res.quote : q)));
      addToast('success', `🎉 Quotation accepted! Linked Deal updated to Closed Won!`, 'Deal Closed Won!');
      loadAllCRMData();
    }
  };

  // --- Handlers for Leads ---
  const handleAddLead = async (leadData: Partial<Lead>) => {
    const created = await api.createLead({
      ...leadData,
      createdBy: currentUser?.name || 'Rajesh Raman',
    });
    if (created) {
      setLeads([created, ...leads]);
      addToast('success', `Lead "${created.name}" created! Automated Welcome Email dispatched.`, 'Lead Created & Automated');
      loadAllCRMData();
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    const updated = await api.updateLead(id, updates);
    if (updated) {
      setLeads(leads.map((l) => (l.id === id ? updated : l)));
      addToast('info', `Lead status updated to ${updated.status}.`);
      loadAllCRMData();
    }
  };

  const handleDeleteLead = async (id: string) => {
    const remaining = await api.deleteLead(id);
    setLeads(remaining);
    addToast('warning', 'Lead deleted from system.');
    loadAllCRMData();
  };

  const handleConvertLead = async (id: string) => {
    const res = await api.convertLead(id);
    if (res) {
      addToast('success', `Lead converted to Contact "${res.contact.name}" and Deal "${res.deal.title}"! Automated quotation email sent.`, 'Lead Converted!');
      loadAllCRMData();
    }
  };

  // --- Handlers for Contacts & Companies ---
  const handleAddContact = async (contactData: Partial<Contact>) => {
    const created = await api.createContact({
      ...contactData,
      owner: currentUser?.name || 'Rajesh Raman',
    });
    if (created) {
      setContacts([created, ...contacts]);
      addToast('success', `Customer Contact "${created.name}" added successfully.`);
      loadAllCRMData();
    }
  };

  const handleUpdateContact = async (id: string, updates: Partial<Contact>) => {
    const updated = await api.updateContact(id, updates);
    if (updated) {
      setContacts(contacts.map((c) => (c.id === id ? updated : c)));
      loadAllCRMData();
    }
  };

  const handleDeleteContact = async (id: string) => {
    const remaining = await api.deleteContact(id);
    setContacts(remaining);
    addToast('warning', 'Contact deleted.');
    loadAllCRMData();
  };

  const handleAddCompany = async (compData: Partial<Company>) => {
    const created = await api.createCompany({
      ...compData,
      owner: currentUser?.name || 'Rajesh Raman',
    });
    if (created) {
      setCompanies([created, ...companies]);
      addToast('success', `Organization "${created.name}" registered successfully.`);
      loadAllCRMData();
    }
  };

  const handleUpdateCompany = async (id: string, updates: Partial<Company>) => {
    const updated = await api.updateCompany(id, updates);
    if (updated) {
      setCompanies(companies.map((c) => (c.id === id ? updated : c)));
      loadAllCRMData();
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const remaining = await api.deleteCompany(id);
    setCompanies(remaining);
    addToast('warning', 'Company removed.');
    loadAllCRMData();
  };

  // --- Handlers for Deals ---
  const handleAddDeal = async (dealData: Partial<Deal>) => {
    const created = await api.createDeal({
      ...dealData,
      salesperson: dealData.salesperson || currentUser?.name || 'Rajesh Raman',
      createdBy: currentUser?.name || 'Rajesh Raman',
    });
    if (created) {
      setDeals([created, ...deals]);
      addToast('success', `Deal Opportunity "${created.title}" logged in pipeline.`);
      loadAllCRMData();
    }
  };

  const handleUpdateDeal = async (id: string, updates: Partial<Deal>) => {
    const updated = await api.updateDeal(id, updates);
    if (updated) {
      setDeals(deals.map((d) => (d.id === id ? updated : d)));
      if (updates.stage === 'Closed Won') {
        addToast('success', `🎉 Closed Won! Deal "${updated.title}" won! Automated onboarding dispatched.`, 'Deal Won!');
      } else {
        addToast('info', `Deal "${updated.title}" updated to ${updated.stage}.`);
      }
      loadAllCRMData();
    }
  };

  const handleDeleteDeal = async (id: string) => {
    const remaining = await api.deleteDeal(id);
    setDeals(remaining);
    addToast('warning', 'Deal opportunity removed.');
    loadAllCRMData();
  };

  // --- Handlers for Tasks ---
  const handleAddTask = async (taskData: Partial<Task>) => {
    const created = await api.createTask({
      ...taskData,
      assignedTo: taskData.assignedTo || currentUser?.name || 'Rajesh Raman',
    });
    if (created) {
      setTasks([created, ...tasks]);
      addToast('success', `Task "${created.title}" scheduled for ${created.dueDate}.`);
      loadAllCRMData();
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const updated = await api.updateTask(id, updates);
    if (updated) {
      setTasks(tasks.map((t) => (t.id === id ? updated : t)));
      loadAllCRMData();
    }
  };

  const handleDeleteTask = async (id: string) => {
    const remaining = await api.deleteTask(id);
    setTasks(remaining);
    addToast('warning', 'Task removed.');
    loadAllCRMData();
  };

  // --- Handlers for Emails ---
  const handleSendEmail = async (emailData: any) => {
    const sent = await api.sendEmail({
      ...emailData,
      fromName: `${currentUser?.name || 'Rajesh Raman'} (KwOrKs CRM)`,
    });
    if (sent) {
      setEmails([sent, ...emails]);
      setIsComposeEmailOpen(false);
      setEmailPrefill(null);
      addToast('success', `Email successfully sent to ${sent.toName || sent.to}.`, 'Email Dispatched');
      loadAllCRMData();
    }
  };

  const handleMarkEmailAsLead = async (emailId: string) => {
    const res = await api.markEmailAsLead(emailId);
    if (res) {
      setLeads([res.lead, ...leads]);
      setEmails(emails.map((e) => (e.id === emailId ? res.email : e)));
      addToast(
        'success',
        `🎉 "${res.lead.name}" (${res.lead.company}) marked as CRM Lead! Automated Welcome Email dispatched.`,
        'Lead Ingested from Email'
      );
      loadAllCRMData();
    }
  };

  const handleSimulateInbound = async (simData: any) => {
    const res = await api.simulateInboundEmail(simData);
    if (res) {
      setEmails([res.email, ...emails]);
      addToast('info', `Inbound email received from ${res.email.fromName || res.email.from}. Customer ID: ${res.matchedCustomer ? res.matchedCustomer.name : 'New Customer'}`, 'Inbound Email Arrived');
      loadAllCRMData();
    }
  };

  const handleUpdateEmail = async (id: string, updates: Partial<Email>) => {
    const updated = await api.updateEmail(id, updates);
    if (updated) {
      setEmails(emails.map((e) => (e.id === id ? updated : e)));
      loadAllCRMData();
    }
  };

  const handleDeleteEmail = async (id: string) => {
    const remaining = await api.deleteEmail(id);
    setEmails(remaining);
    loadAllCRMData();
  };

  const handleCreateTemplate = async (tpl: Partial<EmailTemplate>) => {
    const created = await api.createTemplate(tpl);
    if (created) {
      setTemplates([created, ...templates]);
      addToast('success', `Email template "${created.name}" saved.`);
      loadAllCRMData();
    }
  };

  const handleUpdateTemplate = async (id: string, updates: Partial<EmailTemplate>) => {
    const updated = await api.createTemplate({ ...updates, id });
    if (updated) {
      setTemplates(templates.map((t) => (t.id === id ? updated : t)));
      loadAllCRMData();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const remaining = await api.deleteEmail(id);
    setTemplates(remaining);
    loadAllCRMData();
  };

  const handleToggleAutomationRule = async (id: string, isActive: boolean) => {
    const updated = await api.toggleAutomationRule(id, isActive);
    if (updated) {
      setAutomationRules(automationRules.map((r) => (r.id === id ? updated : r)));
      addToast('info', `Automation rule "${updated.name}" is now ${isActive ? 'ACTIVE' : 'PAUSED'}.`);
      loadAllCRMData();
    }
  };

  const handlePublicFormSuccess = (lead: { id: string; name: string; company: string; email: string; assignedTo: string } | null) => {
    if (lead) {
      addToast('success', `🎉 New Web Lead Ingested: "${lead.name}" (${lead.company})! Automated welcome email dispatched to ${lead.email}.`, 'Public Inbound Submission');
    }
    loadAllCRMData();
  };

  // Cross-Navigation Helpers
  const openComposeWithRecipient = (toEmail: string, toName: string, linkedId?: string) => {
    setEmailPrefill({ to: toEmail, toName, linkedId, subject: '' });
    setActiveTab('email');
  };

  const openQuickEmailForLead = (lead: Lead) => {
    setEmailPrefill({
      to: lead.email,
      toName: lead.name,
      linkedId: lead.id,
      subject: `KwOrKs Platform Overview for ${lead.company || lead.name}`,
    });
    setActiveTab('email');
  };

  const unreadInboxCount = emails.filter((e) => e.folder === 'inbox' && !e.isRead).length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'Completed').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: COLORS.bgWine }}>
      {/* Top Portal Switcher Bar */}
      <div style={{ backgroundColor: 'rgba(26,9,22,0.98)', borderBottom: `1px solid ${COLORS.borderWine}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: COLORS.goldAccent }}>
            KwOrKs Unified Executive Portals
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPortalMode('crm')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${COLORS.goldAccent}`,
              backgroundColor: portalMode === 'crm' ? COLORS.goldAccent : 'transparent',
              color: portalMode === 'crm' ? COLORS.textDark : '#FFFFFF',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            💼 CRM Portal (Active)
          </button>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.borderGoldLight}`,
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '12px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🏢 Management Portal &rarr;
          </a>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.borderGoldLight}`,
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '12px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            👥 HR Portal &rarr;
          </a>
        </div>
      </div>

      {/* Main CRM Navigation */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPublicForm={() => setIsPublicFormOpen(true)}
        users={users}
        currentUser={currentUser}
        onUserChange={handleUserPersonaChange}
        unreadEmailCount={unreadInboxCount}
        pendingTasksCount={pendingTasksCount}
        quotesCount={quotes.length}
      />

      {/* Active Page View */}
      <main style={{ flex: 1, paddingBottom: '40px' }}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            metrics={metrics}
            todayTasks={todayTasks}
            recentLeads={recentLeads}
            recentDeals={recentDeals}
            recentEmails={recentEmails}
            onNavigateTab={setActiveTab}
            onOpenNewLead={() => setActiveTab('leads')}
            onOpenNewDeal={() => setActiveTab('deals')}
            onOpenNewTask={() => setActiveTab('tasks')}
            onOpenComposeEmail={() => {
              setEmailPrefill(null);
              setIsComposeEmailOpen(true);
            }}
            onCompleteTask={(id) => handleUpdateTask(id, { status: 'Completed' })}
          />
        )}

        {/* Unified Tab: Accounts & Contacts (1-Tab 360° Drilldown: Contacts ➔ Company ➔ Deals) */}
        {activeTab === 'accounts' && (
          <AccountsContactsPage
            contacts={contacts}
            companies={companies}
            deals={deals}
            emails={emails}
            quotes={quotes}
            tasks={tasks}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
            onOpenComposeEmail={openComposeWithRecipient}
            onOpenNewDealForCompany={(comp) => setActiveTab('deals')}
            onOpenNewQuoteForCompany={(comp, contact) => setActiveTab('quotes')}
          />
        )}

        {activeTab === 'leads' && (
          <LeadsPage
            leads={leads}
            users={users}
            currentUser={currentUser}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onConvertLead={handleConvertLead}
            onQuickEmail={openQuickEmailForLead}
          />
        )}

        {/* Commercial Quotations Generator & Management Tab ⭐ (NEW) */}
        {activeTab === 'quotes' && (
          <QuotationsPage
            quotes={quotes}
            deals={deals}
            contacts={contacts}
            companies={companies}
            onCreateQuote={handleCreateQuote}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            onSendQuoteEmail={handleSendQuoteEmail}
            onAcceptQuote={handleAcceptQuote}
          />
        )}

        {activeTab === 'deals' && (
          <DealsPage
            deals={deals}
            users={users}
            currentUser={currentUser}
            onAddDeal={handleAddDeal}
            onUpdateDeal={handleUpdateDeal}
            onDeleteDeal={handleDeleteDeal}
            onOpenComposeEmail={openComposeWithRecipient}
          />
        )}

        {/* Sales Lifecycle & Weighted Revenue Forecasting Tab ⭐ (NEW) */}
        {activeTab === 'forecast' && (
          <ForecastPage
            leads={leads}
            deals={deals}
            quotes={quotes}
            onConvertLeadToDeal={handleConvertLead}
            onCreateQuote={handleCreateQuote}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksPage
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'email' && (
          <EmailPage
            emails={emails}
            templates={templates}
            contacts={contacts}
            leads={leads}
            deals={deals}
            onSendEmail={handleSendEmail}
            onSimulateInbound={handleSimulateInbound}
            onUpdateEmail={handleUpdateEmail}
            onDeleteEmail={handleDeleteEmail}
            onMarkAsLead={handleMarkEmailAsLead}
            composeModalOpen={isComposeEmailOpen}
            onCloseCompose={() => setIsComposeEmailOpen(false)}
            onOpenCompose={() => setIsComposeEmailOpen(true)}
            prefillEmail={emailPrefill}
          />
        )}

        {activeTab === 'reports' && <ReportsPage />}

        {/* Manager-Only Team Management Tab */}
        {activeTab === 'team' && (
          <AccountManagementPage
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Public Web Form Ingestion Modal Simulator */}
      <PublicFormModal
        isOpen={isPublicFormOpen}
        onClose={() => setIsPublicFormOpen(false)}
        onLeadCaptured={handlePublicFormSuccess}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
