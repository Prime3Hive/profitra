const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async signUp(data: { email: string; password: string; name: string; btcWallet: string; usdtWallet: string }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signIn(data: { email: string; password: string }) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data: { name: string; btc_wallet: string; usdt_wallet: string }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Investment endpoints
  async getInvestmentPlans() {
    return this.request('/investments/plans');
  }

  async getInvestments() {
    return this.request('/investments');
  }

  async createInvestment(data: { plan_id: string; amount: number; is_reinvestment?: boolean }) {
    return this.request('/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Deposit endpoints
  async getDeposits() {
    return this.request('/deposits');
  }

  async createDepositRequest(data: { amount: number; currency: string; wallet_address: string }) {
    return this.request('/deposits/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transaction endpoints
  async getTransactions() {
    return this.request('/transactions');
  }

  // Admin endpoints
  async getUsers() {
    return this.request('/admin/users');
  }

  async getPendingDeposits() {
    return this.request('/admin/deposits/pending');
  }

  async confirmDeposit(depositId: string) {
    return this.request(`/admin/deposits/${depositId}/confirm`, {
      method: 'POST',
    });
  }

  async rejectDeposit(depositId: string) {
    return this.request(`/admin/deposits/${depositId}/reject`, {
      method: 'POST',
    });
  }

  async getAdminInvestments() {
    return this.request('/admin/investments');
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }
}

export const apiClient = new ApiClient();