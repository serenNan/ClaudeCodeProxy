interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
}

// Dashboard 相关类型定义
export interface DashboardResponse {
  totalApiKeys: number;
  activeApiKeys: number;
  totalAccounts: number;
  activeAccounts: number;
  rateLimitedAccounts: number;
  todayRequests: number;
  totalRequests: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  todayCacheCreateTokens: number;
  todayCacheReadTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreateTokens: number;
  totalCacheReadTokens: number;
  realtimeRPM: number;
  realtimeTPM: number;
  metricsWindow: number;
  isHistoricalMetrics: boolean;
  systemStatus: string;
  uptimeSeconds: number;
}

export interface CostDataResponse {
  todayCosts: {
    totalCost: number;
    formatted: {
      totalCost: string;
    };
  };
  totalCosts: {
    totalCost: number;
    formatted: {
      totalCost: string;
    };
  };
}

export interface UptimeResponse {
  uptimeSeconds: number;
  uptimeText: string;
  startTime: string;
}

export interface ModelStatistics {
  model: string;
  requests: number;
  allTokens: number;
  cost: number;
  formatted?: {
    total: string;
  };
}

export interface TrendDataPoint {
  date?: string;
  hour?: string;
  label?: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  requests: number;
  cost: number;
}

export interface DateFilterRequest {
  type: 'preset' | 'custom';
  preset?: string;
  customRange?: string[];
  startTime?: string;
  endTime?: string;
}

export interface TrendDataRequest {
  granularity: 'day' | 'hour';
  dateFilter?: DateFilterRequest;
}

export interface ApiKeysTrendRequest {
  metric: 'requests' | 'tokens';
  granularity: 'day' | 'hour';
  dateFilter?: DateFilterRequest;
}

export interface TopApiKeyInfo {
  id: string;
  name: string;
  usage: number;
  cost: number;
}

export interface ApiKeysTrendResponse {
  data: any[];
  topApiKeys: TopApiKeyInfo[];
  totalApiKeys: number;
}

interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  description?: string;
  tags?: string[];
  tokenLimit?: number;
  rateLimitWindow?: number;
  rateLimitRequests?: number;
  concurrencyLimit: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  totalCostLimit: number;
  dailyCostUsed: number;
  monthlyCostUsed: number;
  expiresAt?: string;
  permissions: string;
  claudeAccountId?: string;
  claudeConsoleAccountId?: string;
  geminiAccountId?: string;
  enableModelRestriction: boolean;
  restrictedModels?: string[];
  enableClientRestriction: boolean;
  allowedClients?: string[];
  isEnabled: boolean;
  lastUsedAt?: string;
  totalUsageCount: number;
  totalCost: number;
  model?: string;
  service: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostUsageInfo {
  dailyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  dailyCostUsed: number;
  dailyCostLimit: number;
  monthlyCostUsed: number;
  monthlyCostLimit: number;
  totalCostUsed: number;
  totalCostLimit: number;
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
  platform: 'claude' | 'claude-console' | 'gemini' | 'openai' | 'thor';
  sessionKey?: string;
  isEnabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  accountType?: 'shared' | 'dedicated';
  projectId?: string;
  priority?: number;
  apiUrl?: string;
  apiKey?: string;
  baseUrl?: string;
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
  // Thor platform support
  apiKey?: string;
  baseUrl?: string;
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

    // 对于204 No Content响应，不尝试解析JSON
    if (response.status === 204) {
      return undefined as T;
    }

    // 检查响应是否有内容
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return undefined as T;
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (response.accessToken) {
        this.token = response.accessToken;
        localStorage.setItem('token', response.accessToken);
      }

      return response;
    } catch (error) {
      throw error;
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
          description: 'Production API Key',
          tags: ['production'],
          tokenLimit: 1000000,
          rateLimitWindow: 60,
          rateLimitRequests: 1000,
          concurrencyLimit: 10,
          dailyCostLimit: 100,
          monthlyCostLimit: 3000,
          totalCostLimit: 10000,
          dailyCostUsed: 25.50,
          monthlyCostUsed: 450.75,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          permissions: 'all',
          claudeAccountId: undefined,
          claudeConsoleAccountId: undefined,
          geminiAccountId: undefined,
          enableModelRestriction: false,
          restrictedModels: [],
          enableClientRestriction: false,
          allowedClients: [],
          isEnabled: true,
          lastUsedAt: new Date().toISOString(),
          totalUsageCount: 0,
          totalCost: 0,
          model: 'claude-3-5-sonnet-20241022',
          service: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Development Key',
          keyValue: 'sk-ant-api03-0987654321fedcba',
          description: 'Development API Key',
          tags: ['development'],
          tokenLimit: 500000,
          rateLimitWindow: 60,
          rateLimitRequests: 500,
          concurrencyLimit: 5,
          dailyCostLimit: 50,
          monthlyCostLimit: 1500,
          totalCostLimit: 5000,
          dailyCostUsed: 12.25,
          monthlyCostUsed: 225.50,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          permissions: 'claude',
          claudeAccountId: undefined,
          claudeConsoleAccountId: undefined,
          geminiAccountId: undefined,
          enableModelRestriction: false,
          restrictedModels: [],
          enableClientRestriction: false,
          allowedClients: [],
          isEnabled: false,
          lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          totalUsageCount: 25,
          totalCost: 1.25,
          model: 'claude-3-haiku-20240307',
          service: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  }

  async createApiKey(data: any): Promise<ApiKey> {
    return this.request<ApiKey>('/apikeys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApiKey(id: string, data: any): Promise<ApiKey> {
    return this.request<ApiKey>(`/apikeys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async enableApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}/enable`, {
      method: 'PATCH',
    });
  }

  async disableApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}/disable`, {
      method: 'PATCH',
    });
  }

  async toggleApiKeyEnabled(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}`, {
      method: 'DELETE',
    });
  }

  async getApiKeyUsage(id: string): Promise<CostUsageInfo> {
    return this.request<CostUsageInfo>(`/apikeys/${id}/usage`);
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
          lastUsedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Gemini Test Account',
          platform: 'gemini',
          sessionKey: 'AIzaSyA1234567890abcdef1234567890abcdef',
          isEnabled: true,
          lastUsedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
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
    return this.request<Account>('/accounts/openai', {
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

  async enableAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}/enable`, {
      method: 'PATCH',
    });
  }

  async disableAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}/disable`, {
      method: 'PATCH',
    });
  }

  async toggleAccountEnabled(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getDashboardData(): Promise<DashboardResponse> {
    return this.request<DashboardResponse>('/dashboard');
  }

  async getCostData(): Promise<CostDataResponse> {
    return this.request<CostDataResponse>('/dashboard/costs');
  }

  async getSystemUptime(): Promise<UptimeResponse> {
    return this.request<UptimeResponse>('/dashboard/uptime');
  }

  async getModelStatistics(dateFilter?: DateFilterRequest): Promise<ModelStatistics[]> {
    return this.request<ModelStatistics[]>('/dashboard/model-statistics', {
      method: 'POST',
      body: JSON.stringify(dateFilter || {}),
    });
  }

  async getTrendData(request: TrendDataRequest): Promise<TrendDataPoint[]> {
    return this.request<TrendDataPoint[]>('/dashboard/trend-data', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getApiKeysTrend(request: ApiKeysTrendRequest): Promise<ApiKeysTrendResponse> {
    return this.request<ApiKeysTrendResponse>('/dashboard/apikeys-trend', {
      method: 'POST',
      body: JSON.stringify(request),
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

  // Request Logs APIs
  async getRequestLogs(request: RequestLogsRequest): Promise<RequestLogsResponse> {
    return this.request<RequestLogsResponse>('/dashboard/request-logs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRequestLogDetail(id: string): Promise<RequestLogDetail> {
    return this.request<RequestLogDetail>(`/dashboard/request-logs/${id}`);
  }

  async getRequestStatusStats(dateFilter?: DateFilterRequest): Promise<RequestStatusStat[]> {
    return this.request<RequestStatusStat[]>('/dashboard/request-status-stats', {
      method: 'POST',
      body: JSON.stringify(dateFilter || {}),
    });
  }

  async getRealtimeRequests(minutes: number = 10): Promise<RealtimeRequestsResponse> {
    return this.request<RealtimeRequestsResponse>(`/dashboard/realtime-requests?minutes=${minutes}`);
  }

  async getApiKeyModelFlowData(dateFilter?: DateFilterRequest): Promise<ApiKeyModelFlowData[]> {
    return this.request<ApiKeyModelFlowData[]>('/dashboard/apikey-model-flow', {
      method: 'POST',
      body: JSON.stringify(dateFilter || {}),
    });
  }

  // Pricing APIs
  async getModelPricing(): Promise<ModelPricing[]> {
    const response = await this.request<{ data: ModelPricing[] }>('/pricing/models');
    return response.data;
  }

  async updateModelPricing(pricing: ModelPricing): Promise<void> {
    await this.request<void>('/pricing/models', {
      method: 'PUT',
      body: JSON.stringify(pricing),
    });
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    const response = await this.request<{ data: ExchangeRate[] }>('/pricing/exchange-rates');
    return response.data;
  }

  async updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): Promise<void> {
    await this.request<void>('/pricing/exchange-rates', {
      method: 'PUT',
      body: JSON.stringify({
        fromCurrency,
        toCurrency,
        rate
      }),
    });
  }

  async calculateCost(request: CalculateCostRequest): Promise<PricingResult> {
    const response = await this.request<{ data: PricingResult }>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }
}

// Dashboard Response Types
export interface DashboardResponse {
  totalApiKeys: number;
  activeApiKeys: number;
  totalAccounts: number;
  activeAccounts: number;
  rateLimitedAccounts: number;
  todayRequests: number;
  totalRequests: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  todayCacheCreateTokens: number;
  todayCacheReadTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreateTokens: number;
  totalCacheReadTokens: number;
  realtimeRPM: number;
  realtimeTPM: number;
  metricsWindow: number;
  isHistoricalMetrics: boolean;
  systemStatus: string;
  uptimeSeconds: number;
}

export interface CostDataResponse {
  todayCosts: CostInfo;
  totalCosts: CostInfo;
}

export interface CostInfo {
  totalCost: number;
  formatted: FormattedCost;
}

export interface FormattedCost {
  totalCost: string;
}

export interface UptimeResponse {
  uptimeSeconds: number;
  uptimeText: string;
  startTime: string;
}

export interface ModelStatistics {
  model: string;
  requests: number;
  allTokens: number;
  cost: number;
  formatted?: FormattedModelCost;
}

export interface FormattedModelCost {
  total: string;
}

export interface TrendDataRequest {
  granularity: 'day' | 'hour';
  dateFilter?: DateFilterRequest;
}

export interface TrendDataPoint {
  date?: string;
  hour?: string;
  label?: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  requests: number;
  cost: number;
}

export interface DateFilterRequest {
  type: 'preset' | 'custom';
  preset?: string;
  customRange?: string[];
  startTime?: string;
  endTime?: string;
}

export interface ApiKeysTrendRequest {
  metric: 'requests' | 'tokens';
  granularity: 'day' | 'hour';
  dateFilter?: DateFilterRequest;
}


export interface ApiKeyMetric {
  name: string;
  requests: number;
  tokens: number;
  cost: number;
  formattedCost: string;
}

// Request Log Types
export interface RequestLogSummary {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  accountId?: string;
  accountName?: string;
  model: string;
  platform: string;
  requestStartTime: string;
  requestEndTime?: string;
  durationMs?: number;
  status: string;
  errorMessage?: string;
  httpStatusCode?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  isStreaming: boolean;
  clientIp?: string;
  requestId?: string;
}

export interface RequestLogsRequest {
  page: number;
  pageSize: number;
  dateFilter?: DateFilterRequest;
  apiKeyId?: string;
  status?: string;
  model?: string;
  platform?: string;
  searchTerm?: string;
  sortBy: string;
  sortDirection: string;
}

export interface RequestLogsResponse {
  data: RequestLogSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RequestLogDetail {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  accountId?: string;
  accountName?: string;
  model: string;
  platform: string;
  requestStartTime: string;
  requestEndTime?: string;
  durationMs?: number;
  status: string;
  errorMessage?: string;
  httpStatusCode?: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  cost: number;
  isStreaming: boolean;
  clientIp?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RequestStatusStat {
  status: string;
  count: number;
  totalTokens: number;
  totalCost: number;
  averageDurationMs: number;
}

export interface RealtimeRequestSummary {
  id: string;
  apiKeyName: string;
  model: string;
  platform: string;
  requestStartTime: string;
  status: string;
  durationMs?: number;
  totalTokens: number;
  cost: number;
  errorMessage?: string;
}

export interface RealtimeStats {
  totalRequests: number;
  successRequests: number;
  successRate: number;
  totalTokens: number;
  averageResponseTimeMs: number;
  requestsPerMinute: number;
}

export interface RealtimeRequestsResponse {
  recentRequests: RealtimeRequestSummary[];
  windowMinutes: number;
  stats: RealtimeStats;
}

export interface ApiKeyModelFlowData {
  apiKeyId: string;
  apiKeyName: string;
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

// Pricing Types
export interface ModelPricing {
  model: string;
  inputPrice: number;
  outputPrice: number;
  cacheWritePrice: number;
  cacheReadPrice: number;
  currency: string;
  description?: string;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface CalculateCostRequest {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  targetCurrency?: string;
}

export interface PricingResult {
  model: string;
  currency: string;
  inputCost: number;
  outputCost: number;
  cacheCreateCost: number;
  cacheReadCost: number;
  totalCost: number;
  weightedTokens: number;
  unitPrice: number;
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