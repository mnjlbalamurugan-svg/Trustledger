const API_BASE = '/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
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
  uploadKYCSelfie: (payload: { application_id: string; image_type: string; image_data_base64: string }) =>
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
