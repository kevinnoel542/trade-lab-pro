/**
 * Local Express API client — replaces Supabase calls for offline mode.
 * Configure API_BASE to point at your local Express server.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<{ data: T | null; error: any }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error: err };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: { message: e.message || 'Network error — is the server running?' } };
  }
}

// ── Accounts ──
export const api = {
  // Trading Accounts
  getAccounts: () => request<any[]>('/api/accounts'),
  createAccount: (body: any) => request<any>('/api/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (id: string, body: any) => request<any>(`/api/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: (id: string) => request<any>(`/api/accounts/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (accountId?: string) => {
    const qs = accountId ? `?account_id=${accountId}` : '';
    return request<any[]>(`/api/transactions${qs}`);
  },
  getAllTransactions: () => request<any[]>('/api/transactions'),
  createTransaction: (body: any) => request<any>('/api/transactions', { method: 'POST', body: JSON.stringify(body) }),

  // Trades
  getTrades: (accountId?: string) => {
    const qs = accountId ? `?account_id=${accountId}` : '';
    return request<any[]>(`/api/trades${qs}`);
  },
  createTrade: (body: any) => request<any>('/api/trades', { method: 'POST', body: JSON.stringify(body) }),
  updateTrade: (id: string, body: any) => request<any>(`/api/trades/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrade: (id: string) => request<any>(`/api/trades/${id}`, { method: 'DELETE' }),

  // Closed trades summary (for balance calc)
  getClosedSummary: () => request<any[]>('/api/trades/closed-summary'),

  // Screenshot upload
  uploadScreenshot: async (file: File, date: string, type: 'before' | 'after'): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('date', date);
    // The fieldname tells the server before/after
    formData.append('fieldname', type);
    try {
      const res = await fetch(`${API_BASE}/api/upload-screenshot`, { method: 'POST', body: formData });
      if (!res.ok) return null;
      const { url } = await res.json();
      // Return full URL so images display correctly
      return `${API_BASE}${url}`;
    } catch {
      return null;
    }
  },

  // Health check
  health: () => request<{ status: string }>('/api/health'),
};
