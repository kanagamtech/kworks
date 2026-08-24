const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000') + '/api';

export const api = {
  async getEmployees() {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async addEmployee(emp: any) {
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteEmployee(id: string) {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getAttendance() {
    try {
      const res = await fetch(`${API_BASE}/attendance`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async clearAttendance() {
    try {
      const res = await fetch(`${API_BASE}/attendance`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async deleteAttendance(id: string) {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getFoodCounts() {
    try {
      const res = await fetch(`${API_BASE}/food`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getLeaves() {
    try {
      const res = await fetch(`${API_BASE}/leaves`);
      const data = await res.json();
      return data.success ? data.data : {};
    } catch {
      return {};
    }
  },

  async saveLeaves(leaveMap: any) {
    try {
      const res = await fetch(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveMap),
      });
      const data = await res.json();
      return data.success ? data.data : {};
    } catch {
      return {};
    }
  },

  async getNotices() {
    try {
      const res = await fetch(`${API_BASE}/notices`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async saveNotices(notices: any[]) {
    try {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notices),
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getPolls() {
    try {
      const res = await fetch(`${API_BASE}/polls`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async savePolls(polls: any[]) {
    try {
      const res = await fetch(`${API_BASE}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(polls),
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getTickets() {
    try {
      const res = await fetch(`${API_BASE}/tickets`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getClaims() {
    try {
      const res = await fetch(`${API_BASE}/claims`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async updateClaimStatus(id: string, updates: any) {
    try {
      const res = await fetch(`${API_BASE}/claims/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async getCompanies() {
    try {
      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();
      return data.success ? data.data : ['kanagamtech', 'amsems'];
    } catch {
      return ['kanagamtech', 'amsems'];
    }
  },

  async addCompany(name: string) {
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async deleteCompany(name: string) {
    try {
      const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getNotifications() {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async addNotification(notif: any) {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notif),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },
};
