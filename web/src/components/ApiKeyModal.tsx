import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKey } from '@/services/api';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  editingKey?: ApiKey | null;
  onSuccess: (apiKey: ApiKey) => void;
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


export default function ApiKeyModal({ open, onClose, editingKey, onSuccess }: ApiKeyModalProps) {
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInitialFormData = (editingKey?: ApiKey | null): FormData => {
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
  };

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(editingKey));

  // 当 editingKey 改变时重新设置表单数据
  useEffect(() => {
    setFormData(getInitialFormData(editingKey));
    setNewTag('');
    setErrors({});
  }, [editingKey, open]);

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
      onClose();
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose}
      title={editingKey ? '编辑 API Key' : '创建新的 API Key'}
      subtitle={editingKey ? '修改您的 API Key 设置和限制' : '配置您的 API Key 设置和限制'}
      size="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {formData.service !== 'all' && (
                <div className="space-y-2 md:col-span-2">
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
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (editingKey ? '更新中...' : '创建中...') 
                : (editingKey ? '更新 API Key' : '创建 API Key')
              }
            </Button>
          </div>
        </form>
    </Modal>
  );
}