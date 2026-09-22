import { User, Project, Scene, ShareLink, AuditLog, AdminMetrics, ExportRecord } from '../types';

const TOKEN_KEY = 'remodelai_session_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errMsg = `Error HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        errMsg = errorData.error || errorData.message || errMsg;
      } catch {
        // use default
      }
      throw new Error(errMsg);
    }

    return res.json();
  }

  // --- AUTH ---
  public async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async loginWithGoogle(email?: string, name?: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });
    this.setToken(res.token);
    return res;
  }

  public async register(name: string, email: string, password: string): Promise<{ user: User; token: string; verificationCode?: string }> {
    const res = await this.request<{ user: User; token: string; verificationCode?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async verifyEmail(userId: string, code: string): Promise<{ user: User; token: string }> {
    const res = await this.request<{ user: User; token: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ userId, code })
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User } | null> {
    try {
      return await this.request<{ user: User }>('/api/auth/me');
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    this.setToken(null);
  }

  public async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/auth/users');
  }

  // --- PROJECTS ---
  public async getProjects(userId?: string): Promise<Project[]> {
    const url = userId ? `/api/projects?userId=${encodeURIComponent(userId)}` : '/api/projects';
    return this.request<Project[]>(url);
  }

  public async getProjectById(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  public async createProject(
    data: { name: string; dimensions?: { width: number; length: number; height: number } } | Project
  ): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  }

  public async duplicateProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}/duplicate`, {
      method: 'POST'
    });
  }

  // --- SHARES ---
  public async createShare(projectId: string): Promise<ShareLink> {
    return this.request<ShareLink>('/api/shares', {
      method: 'POST',
      body: JSON.stringify({ projectId })
    });
  }

  public async getShareByToken(token: string): Promise<{ share: ShareLink; project: Project }> {
    return this.request<{ share: ShareLink; project: Project }>(`/api/shares/${token}`);
  }

  public async revokeShare(token: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/shares/${token}/revoke`, {
      method: 'POST'
    });
  }

  // --- ADMIN ---
  public async getAdminMetrics(): Promise<AdminMetrics> {
    return this.request<AdminMetrics>('/api/admin/metrics');
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/admin/audit');
  }

  // --- EXPORTS ---
  public async logExport(record: ExportRecord): Promise<void> {
    await this.request('/api/exports', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  }

  // --- AI PIPELINE ---
  public async generateRoom(data: {
    projectId: string;
    userId: string;
    prompt: string;
    dimensions: { width: number; length: number; height: number };
    imageUrl?: string;
    shouldSimulateTimeout?: boolean;
    shouldSimulateRecoverableError?: boolean;
    shouldSimulateCriticalError?: boolean;
  }): Promise<{ scene: Scene; isRecoverableError?: boolean; message?: string; modelUsed: string }> {
    return this.request('/api/ai/generate-room', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export const apiClient = new ApiClient();
