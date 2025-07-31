import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKey } from '@/services/api';
import CreateApiKeyForm from '@/components/CreateApiKeyForm';
import { Label } from '@/components/ui/label';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

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
    setApiKeys(prev => [...prev, apiKey]);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个 API Key 吗？')) {
      try {
        setLoading(true);
        await apiService.deleteApiKey(id);
        // 立即从本地状态中移除已删除的项目
        setApiKeys(prevKeys => prevKeys.filter(key => key.id !== id));
        // 然后重新获取最新数据以确保同步
        await fetchApiKeys();
      } catch (error) {
        console.error('Failed to delete API key:', error);
        // 如果删除失败，重新获取数据以恢复正确状态
        await fetchApiKeys();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setShowForm(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Key className="h-6 w-6" />
          <h1 className="text-2xl font-bold">API Key 管理</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加 API Key
        </Button>
      </div>

      {showForm && (
        <CreateApiKeyForm
          onSuccess={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingKey(null);
          }}
        />
      )}

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  <Badge variant={apiKey.isEnabled ? 'default' : 'secondary'}>
                    {apiKey.isEnabled ? '活跃' : '已禁用'}
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
                    onClick={() => handleDelete(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-sm text-muted-foreground">API Key</Label>
                  <p className="font-mono text-sm">
                    {visibleKeys.has(apiKey.id) ? apiKey.keyValue : maskKey(apiKey.keyValue)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  {apiKey.createdAt && (
                    <span>创建时间: {new Date(apiKey.createdAt).toLocaleString()}</span>
                  )}
                  {apiKey.updatedAt && (
                    <span>更新时间: {new Date(apiKey.updatedAt).toLocaleString()}</span>
                  )}
                  {apiKey.isEnabled ? (
                    <span className="text-green-500">已启用</span>
                  ) : (
                    <span className="text-red-500">已禁用</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无 API Key</h3>
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
    </div>
  );
}