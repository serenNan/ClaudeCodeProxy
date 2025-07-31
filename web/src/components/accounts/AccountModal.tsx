import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, X, ChevronRight } from 'lucide-react';
import { apiService, type Account, type OAuthTokenInfo } from '@/services/api';
import { showToast } from '@/utils/toast';
import { useConfirm } from '@/hooks/useConfirm';
import ProxyConfigComponent from './ProxyConfig';
import OAuthFlow from './OAuthFlow';
import ConfirmModal from '../common/ConfirmModal';

interface AccountModalProps {
  show: boolean;
  account?: Account | null;
  onClose: () => void;
  onSuccess: (account?: Account) => void;
}

interface ModelMapping {
  from: string;
  to: string;
}

export default function AccountModal({ show, account, onClose, onSuccess }: AccountModalProps) {
  const isEdit = !!account;
  const { showConfirmModal, confirmOptions, showConfirm, handleConfirm, handleCancel } = useConfirm();
  
  // OAuth步骤
  const [oauthStep, setOauthStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 表单数据
  interface ProxyConfig {
    enabled: boolean;
    type: 'socks5' | 'http' | 'https';
    host: string;
    port: string;
    username?: string;
    password?: string;
  }

  const [form, setForm] = useState({
    platform: 'claude' as 'claude' | 'claude-console' | 'gemini',
    addType: 'oauth' as 'oauth' | 'manual',
    name: '',
    description: '',
    accountType: 'shared' as 'shared' | 'dedicated',
    projectId: '',
    accessToken: '',
    refreshToken: '',
    apiUrl: '',
    apiKey: '',
    priority: 50,
    userAgent: '',
    rateLimitDuration: 60,
    proxy: {
      enabled: false,
      type: 'socks5' as 'socks5' | 'http' | 'https',
      host: '',
      port: '',
      username: '',
      password: ''
    }
  });

  // 模型映射表
  const [modelMappings, setModelMappings] = useState<ModelMapping[]>([]);

  // 表单验证错误
  const [errors, setErrors] = useState({
    name: '',
    accessToken: '',
    apiUrl: '',
    apiKey: ''
  });

  // 初始化表单数据
  useEffect(() => {
    if (account) {
      setForm({
        platform: account.platform,
        addType: 'oauth',
        name: account.name,
        description: account.description || '',
        accountType: account.accountType || 'shared',
        projectId: account.projectId || '',
        accessToken: '',
        refreshToken: '',
        apiUrl: account.apiUrl || '',
        apiKey: '',
        priority: account.priority || 50,
        userAgent: account.userAgent || '',
        rateLimitDuration: account.rateLimitDuration || 60,
        proxy: account.proxy ? {
          enabled: true,
          type: account.proxy.type as 'socks5' | 'http' | 'https',
          host: account.proxy.host,
          port: account.proxy.port?.toString() || '',
          username: account.proxy.username || '',
          password: account.proxy.password || ''
        } : {
          enabled: false,
          type: 'socks5',
          host: '',
          port: '',
          username: '',
          password: ''
        }
      });

      // 初始化模型映射表
      if (account.supportedModels) {
        const mappings = Object.entries(account.supportedModels).map(([from, to]) => ({
          from,
          to
        }));
        setModelMappings(mappings);
      }
    } else {
      // 重置表单
      setForm({
        platform: 'claude',
        addType: 'oauth',
        name: '',
        description: '',
        accountType: 'shared',
        projectId: '',
        accessToken: '',
        refreshToken: '',
        apiUrl: '',
        apiKey: '',
        priority: 50,
        userAgent: '',
        rateLimitDuration: 60,
        proxy: {
          enabled: false,
          type: 'socks5',
          host: '',
          port: '',
          username: '',
          password: ''
        }
      });
      setModelMappings([]);
      setOauthStep(1);
      setErrors({ name: '', accessToken: '', apiUrl: '', apiKey: '' });
    }
  }, [account, show]);

  // 平台变化处理
  useEffect(() => {
    if (form.platform === 'claude-console') {
      setForm(prev => ({ ...prev, addType: 'manual' }));
    }
  }, [form.platform]);

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // 清除对应的错误
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const canProceed = form.name?.trim() && form.platform;

  const nextStep = async () => {
    if (!canProceed) {
      if (!form.name?.trim()) {
        setErrors(prev => ({ ...prev, name: '请填写账户名称' }));
      }
      return;
    }

    // Gemini项目编号检查
    if (form.platform === 'gemini' && oauthStep === 1 && form.addType === 'oauth') {
      if (!form.projectId?.trim()) {
        const confirmed = await showConfirm(
          '项目编号未填写',
          '您尚未填写项目编号。\n\n如果您的Google账号绑定了Google Cloud或被识别为Workspace账号，需要提供项目编号。\n如果您使用的是普通个人账号，可以继续不填写。',
          '继续',
          '返回填写'
        );
        if (!confirmed) return;
      }
    }

    setOauthStep(2);
  };

  const handleOAuthSuccess = async (tokenInfo: OAuthTokenInfo) => {
    setLoading(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        accountType: form.accountType,
        proxy: form.proxy.enabled ? {
          type: form.proxy.type,
          host: form.proxy.host,
          port: parseInt(form.proxy.port),
          username: form.proxy.username || null,
          password: form.proxy.password || null
        } : null
      };

      if (form.platform === 'claude') {
        Object.assign(data, {
          claudeAiOauth: tokenInfo.claudeAiOauth || tokenInfo,
          priority: form.priority || 50
        });
      } else if (form.platform === 'gemini') {
        Object.assign(data, {
          geminiOauth: tokenInfo.tokens || tokenInfo
        });
        if (form.projectId) {
          Object.assign(data, { projectId: form.projectId });
        }
      }

      let result;
      if (form.platform === 'claude') {
        result = await apiService.createClaudeAccount(data);
      } else {
        result = await apiService.createGeminiAccount(data);
      }

      onSuccess(result);
    } catch (error: any) {
      showToast(error.message || '账户创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    // 验证表单
    let hasError = false;
    const newErrors = { name: '', accessToken: '', apiUrl: '', apiKey: '' };

    if (!form.name?.trim()) {
      newErrors.name = '请填写账户名称';
      hasError = true;
    }

    if (form.platform === 'claude-console') {
      if (!form.apiUrl?.trim()) {
        newErrors.apiUrl = '请填写 API URL';
        hasError = true;
      }
      if (!form.apiKey?.trim()) {
        newErrors.apiKey = '请填写 API Key';
        hasError = true;
      }
    } else if (form.addType === 'manual' && !form.accessToken?.trim()) {
      newErrors.accessToken = '请填写 Access Token';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        accountType: form.accountType,
        proxy: form.proxy.enabled ? {
          type: form.proxy.type,
          host: form.proxy.host,
          port: parseInt(form.proxy.port),
          username: form.proxy.username || null,
          password: form.proxy.password || null
        } : null
      };

      if (form.platform === 'claude') {
        const expiresInMs = form.refreshToken ? (10 * 60 * 1000) : (365 * 24 * 60 * 60 * 1000);
        Object.assign(data, {
          claudeAiOauth: {
            accessToken: form.accessToken,
            refreshToken: form.refreshToken || '',
            expiresAt: Date.now() + expiresInMs,
            scopes: ['user:inference']
          },
          priority: form.priority || 50
        });
      } else if (form.platform === 'gemini') {
        const expiresInMs = form.refreshToken ? (10 * 60 * 1000) : (365 * 24 * 60 * 60 * 1000);
        Object.assign(data, {
          geminiOauth: {
            access_token: form.accessToken,
            refresh_token: form.refreshToken || '',
            scope: 'https://www.googleapis.com/auth/cloud-platform',
            token_type: 'Bearer',
            expiry_date: Date.now() + expiresInMs
          }
        });
        if (form.projectId) {
          Object.assign(data, { projectId: form.projectId });
        }
      } else if (form.platform === 'claude-console') {
        Object.assign(data, {
          apiUrl: form.apiUrl,
          apiKey: form.apiKey,
          priority: form.priority || 50,
          supportedModels: convertMappingsToObject() || {},
          userAgent: form.userAgent || null,
          rateLimitDuration: form.rateLimitDuration || 60
        });
      }

      let result;
      if (form.platform === 'claude') {
        result = await apiService.createClaudeAccount(data);
      } else if (form.platform === 'claude-console') {
        result = await apiService.createClaudeConsoleAccount(data);
      } else {
        result = await apiService.createGeminiAccount(data);
      }

      onSuccess(result);
    } catch (error: any) {
      showToast(error.message || '账户创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async () => {
    if (!form.name?.trim()) {
      setErrors(prev => ({ ...prev, name: '请填写账户名称' }));
      return;
    }

    // Gemini项目编号检查
    if (form.platform === 'gemini' && !form.projectId?.trim()) {
      const confirmed = await showConfirm(
        '项目编号未填写',
        '您尚未填写项目编号。\n\n如果您的Google账号绑定了Google Cloud或被识别为Workspace账号，需要提供项目编号。\n如果您使用的是普通个人账号，可以继续保存。',
        '继续保存',
        '返回填写'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        accountType: form.accountType,
        proxy: form.proxy.enabled ? {
          type: form.proxy.type,
          host: form.proxy.host,
          port: parseInt(form.proxy.port),
          username: form.proxy.username || null,
          password: form.proxy.password || null
        } : null
      };

      // 只有非空时才更新token
      if (form.accessToken || form.refreshToken) {
        if (account!.platform === 'claude') {
          const expiresInMs = form.refreshToken ? (10 * 60 * 1000) : (365 * 24 * 60 * 60 * 1000);
          Object.assign(data, {
            claudeAiOauth: {
              accessToken: form.accessToken || '',
              refreshToken: form.refreshToken || '',
              expiresAt: Date.now() + expiresInMs,
              scopes: ['user:inference']
            }
          });
        } else if (account!.platform === 'gemini') {
          const expiresInMs = form.refreshToken ? (10 * 60 * 1000) : (365 * 24 * 60 * 60 * 1000);
          Object.assign(data, {
            geminiOauth: {
              access_token: form.accessToken || '',
              refresh_token: form.refreshToken || '',
              scope: 'https://www.googleapis.com/auth/cloud-platform',
              token_type: 'Bearer',
              expiry_date: Date.now() + expiresInMs
            }
          });
        }
      }

      if (account!.platform === 'gemini' && form.projectId) {
        Object.assign(data, { projectId: form.projectId });
      }

      if (account!.platform === 'claude') {
        Object.assign(data, { priority: form.priority || 50 });
      }

      if (account!.platform === 'claude-console') {
        Object.assign(data, {
          apiUrl: form.apiUrl,
          priority: form.priority || 50,
          supportedModels: convertMappingsToObject() || {},
          userAgent: form.userAgent || null,
          rateLimitDuration: form.rateLimitDuration || 60
        });
        if (form.apiKey) {
          Object.assign(data, { apiKey: form.apiKey });
        }
      }

      if (account!.platform === 'claude') {
        await apiService.updateClaudeAccount(account!.id, data);
      } else if (account!.platform === 'claude-console') {
        await apiService.updateClaudeConsoleAccount(account!.id, data);
      } else {
        await apiService.updateGeminiAccount(account!.id, data);
      }

      onSuccess();
    } catch (error: any) {
      showToast(error.message || '账户更新失败', 'error');
    } finally {
      setLoading(false);
    }
  };


  const convertMappingsToObject = () => {
    const mapping: Record<string, string> = {};
    modelMappings.forEach(item => {
      if (item.from && item.to) {
        mapping[item.from] = item.to;
      }
    });
    return Object.keys(mapping).length > 0 ? mapping : null;
  };

  const renderStepIndicator = () => {
    if (isEdit || form.addType !== 'oauth') return null;
    
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              oauthStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">基本信息</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              oauthStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">授权认证</span>
          </div>
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    const isOAuthNextStep = form.addType === 'oauth' && form.platform !== 'claude-console' && !isEdit && oauthStep === 1;
    
    return (
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          取消
        </Button>
        
        {isOAuthNextStep ? (
          <Button 
            disabled={!canProceed} 
            className="flex-1" 
            onClick={nextStep}
          >
            下一步
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            disabled={loading}
            className="flex-1"
            onClick={isEdit ? updateAccount : createAccount}
          >
            {loading ? '处理中...' : (isEdit ? '更新' : '创建')}
          </Button>
        )}
      </div>
    );
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <Card 
        key={`account-modal-${isEdit ? account?.id : 'new'}-${oauthStep}`}
        className="relative w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {isEdit ? '编辑账户' : '添加账户'}
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 步骤指示器 */}
          {renderStepIndicator()}

          {/* 步骤1: 基本信息 */}
          {(oauthStep === 1 && !isEdit) && (
            <div className="space-y-6">
              {/* 平台选择 */}
              {!isEdit && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">平台</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="platform"
                        value="claude"
                        checked={form.platform === 'claude'}
                        onChange={(e) => updateForm('platform', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Claude</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="platform"
                        value="claude-console"
                        checked={form.platform === 'claude-console'}
                        onChange={(e) => updateForm('platform', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Claude Console</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="platform"
                        value="gemini"
                        checked={form.platform === 'gemini'}
                        onChange={(e) => updateForm('platform', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Gemini</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 添加方式 */}
              {!isEdit && form.platform !== 'claude-console' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">添加方式</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="addType"
                        value="oauth"
                        checked={form.addType === 'oauth'}
                        onChange={(e) => updateForm('addType', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">OAuth 授权 (推荐)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="addType"
                        value="manual"
                        checked={form.addType === 'manual'}
                        onChange={(e) => updateForm('addType', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">手动输入 Access Token</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 基本信息字段 */}
              <div className="space-y-2">
                <Label>账户名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="为账户设置一个易识别的名称"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>描述 (可选)</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  placeholder="账户用途说明..."
                />
              </div>

              <div className="space-y-2">
                <Label>账户类型</Label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="accountType"
                      value="shared"
                      checked={form.accountType === 'shared'}
                      onChange={(e) => updateForm('accountType', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">共享账户</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="accountType"
                      value="dedicated"
                      checked={form.accountType === 'dedicated'}
                      onChange={(e) => updateForm('accountType', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">专属账户</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  共享账户：供所有API Key使用；专属账户：仅供特定API Key使用
                </p>
              </div>

              {/* Gemini 项目编号 */}
              {form.platform === 'gemini' && (
                <div className="space-y-2">
                  <Label>项目编号 (可选)</Label>
                  <Input
                    value={form.projectId}
                    onChange={(e) => updateForm('projectId', e.target.value)}
                    placeholder="例如：123456789012（纯数字）"
                  />
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      <strong>Google Cloud/Workspace 账号需要提供项目编号</strong><br/>
                      某些 Google 账号（特别是绑定了 Google Cloud 的账号）会被识别为 Workspace 账号，需要提供额外的项目编号。
                    </p>
                  </div>
                </div>
              )}

              {/* Claude Console 特定字段 */}
              {form.platform === 'claude-console' && !isEdit && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>API URL *</Label>
                    <Input
                      value={form.apiUrl}
                      onChange={(e) => updateForm('apiUrl', e.target.value)}
                      placeholder="例如：https://api.example.com"
                      className={errors.apiUrl ? 'border-red-500' : ''}
                    />
                    {errors.apiUrl && <p className="text-red-500 text-sm">{errors.apiUrl}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>API Key *</Label>
                    <Input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => updateForm('apiKey', e.target.value)}
                      placeholder="请输入API Key"
                      className={errors.apiKey ? 'border-red-500' : ''}
                    />
                    {errors.apiKey && <p className="text-red-500 text-sm">{errors.apiKey}</p>}
                  </div>
                </div>
              )}

              {/* 优先级设置 */}
              {(form.platform === 'claude' || form.platform === 'claude-console') && (
                <div className="space-y-2">
                  <Label>调度优先级 (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={form.priority}
                    onChange={(e) => updateForm('priority', parseInt(e.target.value) || 50)}
                    placeholder="数字越小优先级越高，默认50"
                  />
                  <p className="text-xs text-gray-500">
                    数字越小优先级越高，建议范围：1-100
                  </p>
                </div>
              )}

              {/* 手动输入 Token 字段 */}
              {form.addType === 'manual' && form.platform !== 'claude-console' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Access Token *</Label>
                      <textarea
                        value={form.accessToken}
                        onChange={(e) => updateForm('accessToken', e.target.value)}
                        rows={4}
                        className={`w-full p-2 border rounded-md resize-none font-mono text-xs ${
                          errors.accessToken ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="请输入 Access Token..."
                      />
                      {errors.accessToken && <p className="text-red-500 text-sm">{errors.accessToken}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Refresh Token (可选)</Label>
                      <textarea
                        value={form.refreshToken}
                        onChange={(e) => updateForm('refreshToken', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md resize-none font-mono text-xs"
                        placeholder="请输入 Refresh Token..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 代理设置 */}
              <ProxyConfigComponent
                value={form.proxy}
                onChange={(proxy: ProxyConfig) => updateForm('proxy', proxy)}
              />
            </div>
          )}

          {/* 步骤2: OAuth授权 */}
          {oauthStep === 2 && form.addType === 'oauth' && (
            <OAuthFlow
              platform={form.platform as 'claude' | 'gemini'}
              proxy={form.proxy}
              onSuccess={handleOAuthSuccess}
              onBack={() => setOauthStep(1)}
            />
          )}

          {/* 编辑模式 */}
          {isEdit && (
            <div className="space-y-6">
              {/* 基本信息编辑字段 */}
              <div className="space-y-2">
                <Label>账户名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="为账户设置一个易识别的名称"
                />
              </div>

              <div className="space-y-2">
                <Label>描述 (可选)</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  placeholder="账户用途说明..."
                />
              </div>

              <div className="space-y-2">
                <Label>账户类型</Label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="accountType"
                      value="shared"
                      checked={form.accountType === 'shared'}
                      onChange={(e) => updateForm('accountType', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">共享账户</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      name="accountType"
                      value="dedicated"
                      checked={form.accountType === 'dedicated'}
                      onChange={(e) => updateForm('accountType', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">专属账户</span>
                  </label>
                </div>
              </div>

              {/* 编辑模式的其他字段 */}
              {form.platform === 'gemini' && (
                <div className="space-y-2">
                  <Label>项目编号 (可选)</Label>
                  <Input
                    value={form.projectId}
                    onChange={(e) => updateForm('projectId', e.target.value)}
                    placeholder="例如：123456789012（纯数字）"
                  />
                </div>
              )}

              {(form.platform === 'claude' || form.platform === 'claude-console') && (
                <div className="space-y-2">
                  <Label>调度优先级 (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={form.priority}
                    onChange={(e) => updateForm('priority', parseInt(e.target.value) || 50)}
                  />
                </div>
              )}

              {/* Token 更新 */}
              {form.platform !== 'claude-console' && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4 space-y-4">
                    <h5 className="font-semibold text-amber-900">更新 Token</h5>
                    <p className="text-sm text-amber-800">
                      可以更新 Access Token 和 Refresh Token。留空表示不更新该字段。
                    </p>
                    
                    <div className="space-y-2">
                      <Label>新的 Access Token</Label>
                      <textarea
                        value={form.accessToken}
                        onChange={(e) => updateForm('accessToken', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md resize-none font-mono text-xs"
                        placeholder="留空表示不更新..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>新的 Refresh Token</Label>
                      <textarea
                        value={form.refreshToken}
                        onChange={(e) => updateForm('refreshToken', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-md resize-none font-mono text-xs"
                        placeholder="留空表示不更新..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 代理设置 */}
              <ProxyConfigComponent
                value={form.proxy}
                onChange={(proxy: ProxyConfig) => updateForm('proxy', proxy)}
              />
            </div>
          )}

          {/* 按钮区域 */}
          {renderActionButtons()}
        </CardContent>
      </Card>

      {/* 确认弹窗 */}
      <ConfirmModal
        show={showConfirmModal}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}