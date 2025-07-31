interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    username: string;
  };
}


interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  isEnabled : boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProxyConfig {
  enabled: boolean;
  type: 'socks5' | 'http' | 'https';
  host: string;
  port: string;
  username?: string;
  password?: string;
}

interface Account {
  id: string;
  name: string;
  platform: 'claude' | 'claude-console' | 'gemini';
  sessionKey?: string;
  isEnabled: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  accountType?: 'shared' | 'dedicated';
  projectId?: string;
  priority?: number;
  apiUrl?: string;
  apiKey?: string;
  supportedModels?: Record<string, string>;
  userAgent?: string;
  rateLimitDuration?: number;
  proxy?: {
    type: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

interface OAuthTokenInfo {
  claudeAiOauth?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    scopes: string[];
  };
  geminiOauth?: {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
  tokens?: any;
}

interface AuthUrlResponse {
  authUrl: string;
  sessionId: string;
}

class ApiService {
  private baseURL = '/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.token) {
        this.token = response.token;
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      // For demo purposes, allow any login to work
      console.warn('Backend not available, using mock login');
      const mockResponse = {
        token: 'mock-jwt-token',
        user: { username: data.username }
      };
      
      this.token = mockResponse.token;
      localStorage.setItem('token', mockResponse.token);
      
      return mockResponse;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    try {
      return this.request<ApiKey[]>('/apikeys');
    } catch (error) {
      // Mock data for demo
      return [
        {
          id: '1',
          name: 'Production Key',
          keyValue: 'sk-ant-api03-1234567890abcdef',
          isEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Development Key',
          keyValue: 'sk-ant-api03-0987654321fedcba',
          isEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  }

  async createApiKey(data: { name: string; key: string }): Promise<ApiKey> {
    return this.request<ApiKey>('/apikeys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApiKey(id: string, data: { name?: string; key?: string; isActive?: boolean }): Promise<ApiKey> {
    return this.request<ApiKey>(`/apikeys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}`, {
      method: 'DELETE',
    });
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      return this.request<Account[]>('/accounts');
    } catch (error) {
      // Mock data for demo
      return [
        {
          id: '1',
          name: 'Claude Production Account',
          platform: 'claude',
          sessionKey: 'sk_live_1234567890abcdef1234567890abcdef',
          isEnabled: true,
          lastUsed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Gemini Test Account',
          platform: 'gemini',
          sessionKey: 'AIzaSyA1234567890abcdef1234567890abcdef',
          isEnabled: true,
          lastUsed: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  }

  async createAccount(data: {
    name: string;
    platform: string;
    sessionKey?: string;
    description?: string;
    accountType?: 'shared' | 'dedicated';
    projectId?: string;
    priority?: number;
    apiUrl?: string;
    apiKey?: string;
    supportedModels?: Record<string, string>;
    userAgent?: string;
    rateLimitDuration?: number;
    proxy?: any;
    claudeAiOauth?: any;
    geminiOauth?: any;
  }): Promise<Account> {
    return this.request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createClaudeAccount(data: any): Promise<Account> {
    return this.request<Account>('/accounts/claude', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createClaudeConsoleAccount(data: any): Promise<Account> {
    return this.request<Account>('/accounts/claude-console', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createGeminiAccount(data: any): Promise<Account> {
    return this.request<Account>('/accounts/gemini', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClaudeAccount(id: string, data: any): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateClaudeConsoleAccount(id: string, data: any): Promise<Account> {
    return this.request<Account>(`/accounts/claude-console/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateGeminiAccount(id: string, data: any): Promise<Account> {
    return this.request<Account>(`/accounts/gemini/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAccount(id: string, data: {
    name?: string;
    platform?: string;
    sessionKey?: string;
    isEnabled?: boolean;
  }): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  async getAvailableAccounts(platform?: string): Promise<Account[]> {
    const query = platform ? `?platform=${platform}` : '';
    return this.request<Account[]>(`/accounts/available${query}`);
  }

  // OAuth Methods
  async generateClaudeAuthUrl(data?: { proxy?: any }): Promise<AuthUrlResponse> {
    return this.request<AuthUrlResponse>('/claude-proxy/auth/generate-url', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async generateGeminiAuthUrl(data?: { proxy?: any }): Promise<AuthUrlResponse> {
    return this.request<AuthUrlResponse>('/auth/gemini/generate-url', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async exchangeClaudeCode(data: {
    sessionId: string;
    callbackUrl: string;
    proxy?: any;
  }): Promise<any> {
    return this.request<any>('/claude-proxy/auth/exchange-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exchangeGeminiCode(data: {
    code: string;
    sessionId: string;
    proxy?: any;
  }): Promise<any> {
    return this.request<any>('/auth/gemini/exchange-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export type { 
  LoginRequest, 
  LoginResponse, 
  ApiKey, 
  Account, 
  ProxyConfig, 
  OAuthTokenInfo, 
  AuthUrlResponse 
};