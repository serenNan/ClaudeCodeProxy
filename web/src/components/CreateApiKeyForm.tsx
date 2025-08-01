import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { apiService } from '@/services/api';

interface CreateApiKeyFormProps {
  editingKey?: any;
  onSuccess: (apiKey: any) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  tags: string[];
  tokenLimit: string;
  rateLimitWindow: string;
  rateLimitRequests: string;
  concurrencyLimit: string;
  dailyCostLimit: string;
  expiresAt: string;
  permissions: string;
  claudeAccountId: string;
  claudeConsoleAccountId: string;
  geminiAccountId: string;
  enableModelRestriction: boolean;
  restrictedModels: string[];
  enableClientRestriction: boolean;
  allowedClients: string[];
  isEnabled: boolean;
  model: string;
  service: string;
}

const AVAILABLE_SERVICES = [
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'all', label: '全部服务' }
];

const AVAILABLE_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
  'gemini-pro',
  'gemini-pro-vision',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo'
];

const AVAILABLE_CLIENTS = [
  { id: 'web', name: 'Web 客户端', description: '网页界面' },
  { id: 'api', name: 'API 客户端', description: 'REST API 访问' },
  { id: 'cli', name: 'CLI 客户端', description: '命令行工具' },
  { id: 'mobile', name: '移动客户端', description: '移动应用' }
];

export default function CreateApiKeyForm({ editingKey, onSuccess, onCancel }: CreateApiKeyFormProps) {
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newModel, setNewModel] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>(() => {
    if (editingKey) {
      return {
        name: editingKey.name || '',
        description: editingKey.description || '',
        tags: editingKey.tags || [],
        tokenLimit: editingKey.tokenLimit?.toString() || '',
        rateLimitWindow: editingKey.rateLimitWindow?.toString() || '',
        rateLimitRequests: editingKey.rateLimitRequests?.toString() || '',
        concurrencyLimit: editingKey.concurrencyLimit?.toString() || '0',
        dailyCostLimit: editingKey.dailyCostLimit?.toString() || '0',
        expiresAt: editingKey.expiresAt ? new Date(editingKey.expiresAt).toISOString().slice(0, 16) : '',
        permissions: editingKey.permissions || 'all',
        claudeAccountId: editingKey.claudeAccountId || '',
        claudeConsoleAccountId: editingKey.claudeConsoleAccountId || '',
        geminiAccountId: editingKey.geminiAccountId || '',
        enableModelRestriction: editingKey.enableModelRestriction || false,
        restrictedModels: editingKey.restrictedModels || [],
        enableClientRestriction: editingKey.enableClientRestriction || false,
        allowedClients: editingKey.allowedClients || [],
        isEnabled: editingKey.isEnabled !== undefined ? editingKey.isEnabled : true,
        model: editingKey.model || '',
        service: editingKey.service || 'claude'
      };
    }
    return {
      name: '',
      description: '',
      tags: [],
      tokenLimit: '',
      rateLimitWindow: '',
      rateLimitRequests: '',
      concurrencyLimit: '0',
      dailyCostLimit: '0',
      expiresAt: '',
      permissions: 'all',
      claudeAccountId: '',
      claudeConsoleAccountId: '',
      geminiAccountId: '',
      enableModelRestriction: false,
      restrictedModels: [],
      enableClientRestriction: false,
      allowedClients: [],
      isEnabled: true,
      model: '',
      service: 'claude'
    };
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    updateFormData('tags', formData.tags.filter((_, i) => i !== index));
  };

  const addModel = () => {
    if (newModel.trim() && !formData.restrictedModels.includes(newModel.trim())) {
      updateFormData('restrictedModels', [...formData.restrictedModels, newModel.trim()]);
      setNewModel('');
    }
  };

  const removeModel = (index: number) => {
    updateFormData('restrictedModels', formData.restrictedModels.filter((_, i) => i !== index));
  };

  const toggleClient = (clientId: string) => {
    const currentClients = formData.allowedClients;
    if (currentClients.includes(clientId)) {
      updateFormData('allowedClients', currentClients.filter(id => id !== clientId));
    } else {
      updateFormData('allowedClients', [...currentClients, clientId]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名称不能为空';
    }

    if (formData.tokenLimit && isNaN(Number(formData.tokenLimit))) {
      newErrors.tokenLimit = 'Token限制必须是数字';
    }

    if (formData.rateLimitWindow && isNaN(Number(formData.rateLimitWindow))) {
      newErrors.rateLimitWindow = '时间窗口必须是数字';
    }

    if (formData.rateLimitRequests && isNaN(Number(formData.rateLimitRequests))) {
      newErrors.rateLimitRequests = '请求次数限制必须是数字';
    }

    if (isNaN(Number(formData.concurrencyLimit))) {
      newErrors.concurrencyLimit = '并发限制必须是数字';
    }

    if (isNaN(Number(formData.dailyCostLimit))) {
      newErrors.dailyCostLimit = '费用限制必须是数字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name: formData.name,
        description: formData.description || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        tokenLimit: formData.tokenLimit ? Number(formData.tokenLimit) : null,
        rateLimitWindow: formData.rateLimitWindow ? Number(formData.rateLimitWindow) : null,
        rateLimitRequests: formData.rateLimitRequests ? Number(formData.rateLimitRequests) : null,
        concurrencyLimit: Number(formData.concurrencyLimit),
        dailyCostLimit: Number(formData.dailyCostLimit),
        expiresAt: formData.expiresAt || null,
        permissions: formData.permissions,
        claudeAccountId: formData.claudeAccountId || null,
        claudeConsoleAccountId: formData.claudeConsoleAccountId || null,
        geminiAccountId: formData.geminiAccountId || null,
        enableModelRestriction: formData.enableModelRestriction,
        restrictedModels: formData.restrictedModels.length > 0 ? formData.restrictedModels : null,
        enableClientRestriction: formData.enableClientRestriction,
        allowedClients: formData.allowedClients.length > 0 ? formData.allowedClients : null,
        isEnabled: formData.isEnabled,
        model: formData.model || null,
        service: formData.service
      };

      const result = editingKey 
        ? await apiService.updateApiKey(editingKey.id, requestData)
        : await apiService.createApiKey(requestData);
      onSuccess(result);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingKey ? '编辑 API Key' : '创建新的 API Key'}</CardTitle>
        <CardDescription>
          {editingKey ? '修改您的 API Key 设置和限制' : '配置您的 API Key 设置和限制'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本信息</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="为您的 API Key 取一个名称"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              <p className="text-xs text-gray-500">
                API Key 值将在创建时自动生成
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">备注描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="为这个 API Key 添加一些描述信息"
              />
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label>标签</Label>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 服务配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">服务配置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">服务类型</Label>
                <Select value={formData.service} onValueChange={(value) => updateFormData('service', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SERVICES.map(service => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissions">服务权限</Label>
                <Select value={formData.permissions} onValueChange={(value) => updateFormData('permissions', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部服务</SelectItem>
                    <SelectItem value="claude">仅 Claude</SelectItem>
                    <SelectItem value="gemini">仅 Gemini</SelectItem>
                    <SelectItem value="openai">仅 OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.service !== 'all' && (
              <div className="space-y-2">
                <Label htmlFor="model">指定模型 (可选)</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => updateFormData('model', e.target.value)}
                  placeholder="如果指定，将强制使用此模型"
                />
              </div>
            )}
          </div>

          {/* 限制设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">限制设置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenLimit">Token 限制</Label>
                <Input
                  id="tokenLimit"
                  type="number"
                  value={formData.tokenLimit}
                  onChange={(e) => updateFormData('tokenLimit', e.target.value)}
                  placeholder="最大 Token 数"
                  className={errors.tokenLimit ? 'border-red-500' : ''}
                />
                {errors.tokenLimit && <p className="text-red-500 text-xs">{errors.tokenLimit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimitWindow">时间窗口 (分钟)</Label>
                <Input
                  id="rateLimitWindow"
                  type="number"
                  value={formData.rateLimitWindow}
                  onChange={(e) => updateFormData('rateLimitWindow', e.target.value)}
                  placeholder="速率限制时间窗口"
                  className={errors.rateLimitWindow ? 'border-red-500' : ''}
                />
                {errors.rateLimitWindow && <p className="text-red-500 text-xs">{errors.rateLimitWindow}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateLimitRequests">请求次数限制</Label>
                <Input
                  id="rateLimitRequests"
                  type="number"
                  value={formData.rateLimitRequests}
                  onChange={(e) => updateFormData('rateLimitRequests', e.target.value)}
                  placeholder="窗口内最大请求数"
                  className={errors.rateLimitRequests ? 'border-red-500' : ''}
                />
                {errors.rateLimitRequests && <p className="text-red-500 text-xs">{errors.rateLimitRequests}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="concurrencyLimit">并发限制</Label>
                <Input
                  id="concurrencyLimit"
                  type="number"
                  value={formData.concurrencyLimit}
                  onChange={(e) => updateFormData('concurrencyLimit', e.target.value)}
                  placeholder="同时处理的最大请求数 (0=无限制)"
                  className={errors.concurrencyLimit ? 'border-red-500' : ''}
                />
                {errors.concurrencyLimit && <p className="text-red-500 text-xs">{errors.concurrencyLimit}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyCostLimit">每日费用限制 (USD)</Label>
                <Input
                  id="dailyCostLimit"
                  type="number"
                  step="0.01"
                  value={formData.dailyCostLimit}
                  onChange={(e) => updateFormData('dailyCostLimit', e.target.value)}
                  placeholder="每日最大费用 (0=无限制)"
                  className={errors.dailyCostLimit ? 'border-red-500' : ''}
                />
                {errors.dailyCostLimit && <p className="text-red-500 text-xs">{errors.dailyCostLimit}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">过期时间</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => updateFormData('expiresAt', e.target.value)}
              />
              <p className="text-xs text-gray-500">留空表示永不过期</p>
            </div>
          </div>

          {/* 账户绑定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">账户绑定</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claudeAccountId">Claude OAuth 账户ID</Label>
                <Input
                  id="claudeAccountId"
                  value={formData.claudeAccountId}
                  onChange={(e) => updateFormData('claudeAccountId', e.target.value)}
                  placeholder="Claude OAuth 账户ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claudeConsoleAccountId">Claude Console 账户ID</Label>
                <Input
                  id="claudeConsoleAccountId"
                  value={formData.claudeConsoleAccountId}
                  onChange={(e) => updateFormData('claudeConsoleAccountId', e.target.value)}
                  placeholder="Claude Console 账户ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geminiAccountId">Gemini 账户ID</Label>
                <Input
                  id="geminiAccountId"
                  value={formData.geminiAccountId}
                  onChange={(e) => updateFormData('geminiAccountId', e.target.value)}
                  placeholder="Gemini 账户ID"
                />
              </div>
            </div>
          </div>

          {/* 模型限制 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableModelRestriction"
                checked={formData.enableModelRestriction}
                onCheckedChange={(checked) => updateFormData('enableModelRestriction', checked)}
              />
              <Label htmlFor="enableModelRestriction" className="text-base font-semibold">
                启用模型限制
              </Label>
            </div>

            {formData.enableModelRestriction && (
              <div className="space-y-2 pl-6">
                <Label>限制的模型列表</Label>
                {formData.restrictedModels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.restrictedModels.map((model, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {model}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeModel(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Select value={newModel} onValueChange={setNewModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.filter(model => !formData.restrictedModels.includes(model)).map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addModel} disabled={!newModel}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="或输入自定义模型名称"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addModel())}
                />
              </div>
            )}
          </div>

          {/* 客户端限制 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableClientRestriction"
                checked={formData.enableClientRestriction}
                onCheckedChange={(checked) => updateFormData('enableClientRestriction', checked)}
              />
              <Label htmlFor="enableClientRestriction" className="text-base font-semibold">
                启用客户端限制
              </Label>
            </div>

            {formData.enableClientRestriction && (
              <div className="space-y-2 pl-6">
                <Label>允许的客户端</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AVAILABLE_CLIENTS.map(client => (
                    <div key={client.id} className="flex items-center space-x-2">
                      <Switch
                        id={`client_${client.id}`}
                        checked={formData.allowedClients.includes(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`client_${client.id}`} className="font-medium">
                          {client.name}
                        </Label>
                        <p className="text-xs text-gray-500">{client.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 状态设置 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(checked) => updateFormData('isEnabled', checked)}
            />
            <Label htmlFor="isEnabled" className="text-base font-semibold">
              启用此 API Key
            </Label>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading 
                ? (editingKey ? '更新中...' : '创建中...') 
                : (editingKey ? '更新 API Key' : '创建 API Key')
              }
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}