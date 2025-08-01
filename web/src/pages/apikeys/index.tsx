import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Plus, Edit2, Trash2, Eye, EyeOff, Clock, DollarSign, Activity, Shield, Server, Tag, Search, Filter } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKey } from '@/services/api';
import ApiKeyModal from '@/components/ApiKeyModal';
import { Label } from '@/components/ui/label';
import { showToast } from '@/utils/toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useConfirm } from '@/hooks/useConfirm';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'claude' | 'gemini' | 'openai'>('all');
  const { showConfirmModal, confirmOptions, showConfirm, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const keys = await apiService.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (apiKey: ApiKey) => {
    if (editingKey) {
      setApiKeys(prev => prev.map(key => key.id === editingKey.id ? apiKey : key));
    } else {
      setApiKeys(prev => [...prev, apiKey]);
    }
    setShowForm(false);
    setEditingKey(null);
  };

  const handleDelete = async (id: string) => {
    const apiKey = apiKeys.find(key => key.id === id);
    const keyName = apiKey?.name || 'API Key';
    
    const confirmed = await showConfirm(
      '删除 API Key',
      `确定要删除 "${keyName}" 吗？\n\n此操作不可撤销，请谨慎操作。`,
      '删除',
      '取消'
    );
    
    if (confirmed) {
      setDeletingId(id);
      try {
        await apiService.deleteApiKey(id);
        // 删除成功后，立即从本地状态中移除已删除的项目
        setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id));
        showToast('API Key 删除成功', 'success');
      } catch (error: any) {
        console.error('Failed to delete API key:', error);
        showToast(error.message || '删除 API Key 失败', 'error');
        // 如果删除失败，重新获取数据以恢复正确状态
        await fetchApiKeys();
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setShowForm(true);
  };

  const toggleApiKeyStatus = async (apiKey: ApiKey) => {
    try {
      await apiService.toggleApiKeyEnabled(apiKey.id);
      await fetchApiKeys();
      showToast(`API Key已${!apiKey.isEnabled ? '启用' : '禁用'}`, 'success');
    } catch (error: any) {
      showToast(error.message || '更新API Key状态失败', 'error');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string) => {
    if (key?.length <= 8) return key;
    return key?.substring(0, 4) + '••••••••' + key?.substring(key.length - 4);
  };

  // 过滤和搜索 API Keys
  const filteredApiKeys = apiKeys.filter(apiKey => {
    // 搜索过滤
    const matchesSearch = !searchTerm || 
      apiKey.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apiKey.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apiKey.keyValue.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 状态过滤
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && apiKey.isEnabled) ||
      (statusFilter === 'disabled' && !apiKey.isEnabled);
    
    // 服务类型过滤
    const matchesService = serviceFilter === 'all' || 
      apiKey.service.toLowerCase() === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  // 获取 API Key 状态
  const getApiKeyStatus = (apiKey: ApiKey) => {
    if (!apiKey.isEnabled) return { status: 'disabled', text: '已禁用', color: 'bg-gray-500' };
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { status: 'expired', text: '已过期', color: 'bg-red-500' };
    }
    if (apiKey.lastUsedAt) {
      const lastUsed = new Date(apiKey.lastUsedAt);
      const daysSinceLastUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastUse < 7) {
        return { status: 'active', text: '活跃', color: 'bg-green-500' };
      } else if (daysSinceLastUse < 30) {
        return { status: 'idle', text: '闲置', color: 'bg-yellow-500' };
      }
    }
    return { status: 'unused', text: '未使用', color: 'bg-blue-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Key className="h-6 w-6" />
          <h1 className="text-2xl font-bold dark:text-gray-100">API Key 管理</h1>
          <Badge variant="secondary">
            {filteredApiKeys.length} / {apiKeys.length}
          </Badge>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加 API Key
        </Button>
      </div>

      {/* 搜索和过滤栏 */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="搜索 API Key 名称、描述或密钥..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: 'all' | 'enabled' | 'disabled') => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="enabled">已启用</SelectItem>
              <SelectItem value="disabled">已禁用</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={(value: 'all' | 'claude' | 'gemini' | 'openai') => setServiceFilter(value)}>
            <SelectTrigger className="w-32">
              <Server className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部服务</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ApiKeyModal
        open={showForm}
        editingKey={editingKey}
        onSuccess={handleSubmit}
        onClose={() => {
          setShowForm(false);
          setEditingKey(null);
        }}
      />

      <div className="grid gap-4">
        {filteredApiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getApiKeyStatus(apiKey).color}`}></div>
                    <CardTitle className="text-lg dark:text-gray-100">{apiKey.name}</CardTitle>
                  </div>
                  <Badge 
                    variant={apiKey.isEnabled ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleApiKeyStatus(apiKey)}
                  >
                    {getApiKeyStatus(apiKey).text}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                  >
                    {visibleKeys.has(apiKey.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(apiKey)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === apiKey.id}
                    onClick={() => handleDelete(apiKey.id)}
                  >
                    {deletingId === apiKey.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* API Key */}
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    API Key
                  </Label>
                  <p className="font-mono text-sm bg-gray-50 dark:bg-gray-800 dark:text-gray-200 p-2 rounded border dark:border-gray-600">
                    {visibleKeys.has(apiKey.id) ? apiKey.keyValue : maskKey(apiKey.keyValue)}
                  </p>
                </div>

                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      服务类型
                    </Label>
                    <Badge variant="outline" className="mt-1">
                      {apiKey.service?.toUpperCase() || 'CLAUDE'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      权限范围
                    </Label>
                    <Badge variant="outline" className="mt-1">
                      {apiKey.permissions === 'all' ? '全部服务' : apiKey.permissions?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* 描述 */}
                {apiKey.description && (
                  <div>
                    <Label className="text-sm text-muted-foreground">描述</Label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{apiKey.description}</p>
                  </div>
                )}

                {/* 标签 */}
                {apiKey.tags && apiKey.tags.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      标签
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {apiKey.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 使用统计 */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Activity className="h-3 w-3" />
                      使用次数
                    </Label>
                    <p className="text-lg font-semibold dark:text-gray-100">{apiKey.totalUsageCount || 0}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      总费用
                    </Label>
                    <p className="text-lg font-semibold dark:text-gray-100">${(apiKey.totalCost || 0).toFixed(4)}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      最后使用
                    </Label>
                    <p className="text-sm dark:text-gray-300">
                      {apiKey.lastUsedAt 
                        ? new Date(apiKey.lastUsedAt).toLocaleString()
                        : '未使用'
                      }
                    </p>
                  </div>
                </div>

                {/* 限制设置 */}
                <div className="grid grid-cols-2 gap-4">
                  {(apiKey.tokenLimit || apiKey.rateLimitRequests || apiKey.concurrencyLimit || apiKey.dailyCostLimit) && (
                    <div>
                      <Label className="text-sm text-muted-foreground">限制设置</Label>
                      <div className="space-y-1 mt-1">
                        {apiKey.tokenLimit && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Token限制: {apiKey.tokenLimit.toLocaleString()}
                          </div>
                        )}
                        {apiKey.rateLimitRequests && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            请求限制: {apiKey.rateLimitRequests}/{apiKey.rateLimitWindow || 60}分钟
                          </div>
                        )}
                        {apiKey.concurrencyLimit > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            并发限制: {apiKey.concurrencyLimit}
                          </div>
                        )}
                        {apiKey.dailyCostLimit > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            日费用限制: ${apiKey.dailyCostLimit}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 过期时间 */}
                  <div>
                    <Label className="text-sm text-muted-foreground">过期时间</Label>
                    <p className="text-sm mt-1">
                      {apiKey.expiresAt 
                        ? new Date(apiKey.expiresAt).toLocaleString()
                        : '永不过期'
                      }
                    </p>
                    {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                      <Badge variant="destructive" className="mt-1 text-xs">已过期</Badge>
                    )}
                  </div>
                </div>

                {/* 模型和客户端限制 */}
                {(apiKey.enableModelRestriction || apiKey.enableClientRestriction) && (
                  <div className="space-y-2">
                    {apiKey.enableModelRestriction && apiKey.restrictedModels && (
                      <div>
                        <Label className="text-sm text-muted-foreground">限制模型</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {apiKey.restrictedModels.map((model, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {apiKey.enableClientRestriction && apiKey.allowedClients && (
                      <div>
                        <Label className="text-sm text-muted-foreground">允许客户端</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {apiKey.allowedClients.map((client, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {client}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 时间信息 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                  {apiKey.createdAt && (
                    <span>创建: {new Date(apiKey.createdAt).toLocaleString()}</span>
                  )}
                  {apiKey.updatedAt && (
                    <span>更新: {new Date(apiKey.updatedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApiKeys.length === 0 && apiKeys.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 dark:text-gray-100">未找到匹配的 API Key</h3>
            <p className="text-muted-foreground text-center mb-4">
              请尝试调整搜索条件或过滤器。
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setServiceFilter('all');
            }}>
              清除过滤器
            </Button>
          </CardContent>
        </Card>
      )}

      {apiKeys.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 dark:text-gray-100">暂无 API Key</h3>
            <p className="text-muted-foreground text-center mb-4">
              还没有创建任何 API Key。点击上方按钮添加您的第一个 API Key。
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加 API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 删除确认模态框 */}
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