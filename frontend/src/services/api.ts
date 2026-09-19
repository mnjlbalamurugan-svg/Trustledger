const DEFAULT_PROD_URL = 'https://trustledger-4hrj.onrender.com';

const getApiBase = (): string => {
  const metaEnv = (import.meta as any).env;
  const envUrl = (metaEnv?.VITE_API_URL as string)?.trim();
  const raw = envUrl || (metaEnv?.PROD ? DEFAULT_PROD_URL : '/api');
  const cleaned = raw.replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const API_BASE = getApiBase();

export function getAuthToken(): string | null {
  return localStorage.getItem('trustledger_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('trustledger_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('trustledger_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  const fullUrl = `${API_BASE}${endpoint}`;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(`Network error: Unable to reach backend at ${fullUrl}. Please verify your connection.`);
  }

  // Safely read response text first to handle empty, HTML, or JSON responses
  const text = await response.text();
  let data: any = null;

  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`Server error HTTP ${response.status}: ${text.slice(0, 150)}`);
      }
      throw new Error(`Unexpected non-JSON response from server (HTTP ${response.status})`);
    }
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
    if (data) {
      if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        // Handle FastAPI 422 validation error arrays cleanly
        errorMsg = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
      } else if (data.message && typeof data.message === 'string') {
        errorMsg = data.message;
      } else if (typeof data === 'string') {
        errorMsg = data;
      }
    } else if (!text || text.trim().length === 0) {
      errorMsg = `Server returned an empty response (HTTP ${response.status}).`;
    }
    throw new Error(errorMsg);
  }

  // Success with empty body
  if (data === null) {
    return {} as T;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getGoogleAuthUrl: () =>
    request<{ configured: boolean; message?: string; url?: string }>('/auth/google/url'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),
  getRiskTrend: () => request<any[]>('/dashboard/risk-trend'),
  getDashboardAlerts: () => request<any[]>('/dashboard/alerts'),
  getAuditEvents: () => request<any[]>('/dashboard/audit-events'),

  // Applications
  getApplications: (params?: { search?: string; risk_level?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.risk_level) query.append('risk_level', params.risk_level);
    if (params?.status) query.append('status', params.status);
    return request<any[]>(`/applications?${query.toString()}`);
  },
  createApplication: (payload: any) =>
    request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getApplicationDetail: (idOrNumber: string) =>
    request<any>(`/applications/${idOrNumber}`),
  updateApplicationStatus: (idOrNumber: string, status: string, reason?: string) =>
    request<{ message: string; status: string }>(`/applications/${idOrNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    }),
  markForManualReview: (idOrNumber: string) =>
    request<{ message: string; status: string; application_number: string }>(
      `/applications/${idOrNumber}/manual-review`,
      { method: 'POST' }
    ),

  // Documents
  getDocuments: (applicationId?: string) => {
    const url = applicationId ? `/documents?application_id=${applicationId}` : '/documents';
    return request<any[]>(url);
  },
  uploadDocument: (formData: FormData) =>
    request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    }),
  getDocumentDetail: (docId: string) =>
    request<any>(`/documents/${docId}`),

  // KYC
  getKYCSession: (applicationId: string) =>
    request<any>(`/kyc/session?application_id=${applicationId}`, { method: 'POST' }),
  uploadKYCDocument: (payload: { application_id: string; image_type: string; image_data_base64: string }) =>
    request<any>('/kyc/document', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadKYCSelfie: (payload: { application_id: string; image_type: string; image_data_base64: string; capture_source?: string; motion_score?: number }) =>
    request<any>('/kyc/selfie', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  checkLiveness: (sessionId: string) =>
    request<any>('/kyc/liveness', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
  checkFaceMatch: (sessionId: string) =>
    request<any>('/kyc/face-match', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
  checkImageIntegrity: (sessionId: string) =>
    request<any>('/kyc/image-integrity', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
  completeKYC: (sessionId: string) =>
    request<any>(`/kyc/${sessionId}/complete`, { method: 'POST' }),

  // Network
  getNetworkGraph: (idOrNumber?: string) => {
    const url = idOrNumber ? `/network/${idOrNumber}` : '/network';
    return request<any>(url);
  },

  // Ledger
  getLedgerRecords: (applicationId?: string) => {
    const url = applicationId ? `/ledger?application_id=${applicationId}` : '/ledger';
    return request<any[]>(url);
  },
  verifyLedger: () => request<any>('/ledger/verify', { method: 'POST' }),

  // Alerts
  getAlerts: (params?: { severity?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    return request<any[]>(`/alerts?${query.toString()}`);
  },
  updateAlertStatus: (alertId: string, status: 'REVIEWED' | 'RESOLVED') =>
    request<any>(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Reports
  getReportsSummary: () => request<any>('/reports/summary'),
  getExportUrl: () => `${API_BASE}/reports/export`,
};
