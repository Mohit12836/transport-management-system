// Production API Client for Transport Management System
// Provides authenticated, typed access to Next.js /api/v1/* route handlers
// with seamless token propagation, network error recovery, and typed responses.

export interface ApiClientResponse<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tms_auth_token') || sessionStorage.getItem('tms_auth_token');
  }

  public setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tms_auth_token', token);
    }
  }

  public clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tms_auth_token');
      sessionStorage.removeItem('tms_auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiClientResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token && !headers['authorization']) {
      headers['authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => ({
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Failed to parse JSON response from server.' },
      }));

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Network request failed. Please check internet connection.',
        },
      };
    }
  }

  // Auth Operations
  async login(email: string, password: string) {
    const res = await this.request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.data?.token) {
      this.setAuthToken(res.data.token);
    }
    return res;
  }

  async getCurrentUser() {
    return this.request<any>('/api/v1/auth/me', { method: 'GET' });
  }

  // Consignment / LR Operations
  async getLRs() {
    return this.request<any[]>('/api/v1/bookings/lr', { method: 'GET' });
  }

  async createLR(payload: any) {
    return this.request<any>('/api/v1/bookings/lr', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Fleet Operations
  async getVehicles() {
    return this.request<any[]>('/api/v1/fleet/vehicles', { method: 'GET' });
  }

  async createVehicle(payload: any) {
    return this.request<any>('/api/v1/fleet/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDrivers() {
    return this.request<any[]>('/api/v1/fleet/drivers', { method: 'GET' });
  }

  async createDriver(payload: any) {
    return this.request<any>('/api/v1/fleet/drivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Trip Dispatch Operations
  async getTrips() {
    return this.request<any[]>('/api/v1/trips', { method: 'GET' });
  }

  async scheduleTrip(payload: any) {
    return this.request<any>('/api/v1/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTripStatus(tripId: string, payload: { targetStatus: string; odometerKm?: number; location?: string; reason?: string }) {
    return this.request<any>(`/api/v1/trips/${tripId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Trip Expenses
  async getTripExpenses(tripId: string) {
    return this.request<any[]>(`/api/v1/trips/${tripId}/expenses`, { method: 'GET' });
  }

  async submitTripExpense(tripId: string, payload: any) {
    return this.request<any>(`/api/v1/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // POD Operations
  async submitPOD(tripId: string, payload: any) {
    return this.request<any>(`/api/v1/trips/${tripId}/pod`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async reviewPOD(tripId: string, payload: { decision: 'verify' | 'reject'; rejectionReason?: string; podId?: string }) {
    return this.request<any>(`/api/v1/trips/${tripId}/pod`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // Financial Operations
  async settleTrip(tripId: string, payload: { shortageDeductions?: number; remarks?: string }) {
    return this.request<any>(`/api/v1/trips/${tripId}/settlement`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getInvoices() {
    return this.request<any[]>('/api/v1/finance/invoices', { method: 'GET' });
  }

  async createInvoice(payload: any) {
    return this.request<any>('/api/v1/finance/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getVendorBills() {
    return this.request<any[]>('/api/v1/finance/vendor-bills', { method: 'GET' });
  }

  async createVendorBill(payload: any) {
    return this.request<any>('/api/v1/finance/vendor-bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getJournals() {
    return this.request<any>('/api/v1/finance/journals', { method: 'GET' });
  }

  async getIntegrationsStatus() {
    return this.request<any>('/api/v1/integrations/status', { method: 'GET' });
  }
}

export const api = new ApiClient();
