const RAW_URL = ((import.meta as any).env?.VITE_API_URL || 'https://kworks-2q0c.onrender.com').trim().replace(/\/+$/, '');
const API_BASE = RAW_URL.endsWith('/api') ? RAW_URL : `${RAW_URL}/api`;

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kworks_access_token',
  REFRESH_TOKEN: 'kworks_refresh_token',
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/management/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      return data.accessToken;
    }
  } catch {
    // Ignore
  }
  return null;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

function getAuthHeaders(): HeadersInit {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

export const api = {
  async loginManagement(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/management/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        localStorage.setItem('kworks_user', JSON.stringify(data.user));
      }
      return data;
    } catch {
      return { success: false, message: 'Network error' };
    }
  },

  async logout() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem('kworks_user');
  },

  async getEmployees() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/employees`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async addEmployee(emp: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/employees`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetchWithAuth(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getAttendance() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/attendance`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async clearAttendance() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/attendance`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async deleteAttendance(id: string) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/attendance/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getFoodCounts() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/food`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getLeaves() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/leaves`);
      const data = await res.json();
      return data.success ? data.data : {};
    } catch {
      return {};
    }
  },

  async saveLeaves(leaveMap: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/leaves`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetchWithAuth(`${API_BASE}/notices`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async saveNotices(notices: any[]) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notices`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetchWithAuth(`${API_BASE}/polls`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async savePolls(polls: any[]) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/polls`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetchWithAuth(`${API_BASE}/tickets`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async getClaims() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/claims`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async updateClaimStatus(id: string, updates: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/claims/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
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
      const res = await fetchWithAuth(`${API_BASE}/companies`);
      const data = await res.json();
      return data.success ? data.data : ['kanagamtech', 'amsems'];
    } catch {
      return ['kanagamtech', 'amsems'];
    }
  },

  async addCompany(name: string) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/companies`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const res = await fetchWithAuth(`${API_BASE}/companies/${encodeURIComponent(name)}`, {
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
      const res = await fetchWithAuth(`${API_BASE}/notifications`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async addNotification(notif: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notif),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async getAppUpdate() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/app-updates`);
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async publishAppUpdate(updateData: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/app-updates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async getManagementUsers() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/management-users`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async addManagementUser(userData: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/management-users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async updateManagementUser(id: string, updates: any) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/management-users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },

  async deleteManagementUser(id: string) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/management-users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  async managementLogin(credentials: { email: string; password: string; role: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/management-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await res.json();
    } catch {
      return null;
    }
  },
};

export { API_BASE };