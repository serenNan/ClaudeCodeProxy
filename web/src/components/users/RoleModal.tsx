import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Shield, Check, X } from 'lucide-react';
import { apiService } from '@/services/api';
import type { UserRole } from '@/services/api';
import { showToast } from '@/utils/toast';

interface RoleModalProps {
  open: boolean;
  editingRole: UserRole | null;
  onSuccess: (role: UserRole) => void;
  onClose: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'all', name: '全部权限', description: '拥有系统所有权限' },
  { key: 'read', name: '查看权限', description: '可以查看系统数据' },
  { key: 'write', name: '写入权限', description: '可以修改系统数据' },
  { key: 'user:manage', name: '用户管理', description: '可以管理用户账户' },
  { key: 'apikey:manage', name: 'API Key管理', description: '可以管理API密钥' },
  { key: 'account:manage', name: '账号管理', description: '可以管理平台账号' },
  { key: 'pricing:manage', name: '价格管理', description: '可以管理价格设置' },
  { key: 'system:config', name: '系统配置', description: '可以修改系统配置' },
  { key: 'logs:view', name: '日志查看', description: '可以查看系统日志' },
];

export default function RoleModal({ open, editingRole, onSuccess, onClose }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name,
        displayName: editingRole.displayName,
        description: editingRole.description || '',
        permissions: editingRole.permissions
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: ['read']
      });
    }
    setErrors({});
  }, [editingRole, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '角色名称不能为空';
    } else if (!/^[a-zA-Z0-9_]{2,20}$/.test(formData.name)) {
      newErrors.name = '角色名称只能包含字母、数字和下划线，长度2-20位';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = '显示名称不能为空';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = '至少需要选择一个权限';
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
      let role: UserRole;
      
      if (editingRole) {
        role = await apiService.updateRole(editingRole.id, {
          displayName: formData.displayName,
          permissions: formData.permissions,
          description: formData.description || undefined
        });
        showToast('角色更新成功', 'success');
      } else {
        role = await apiService.createRole({
          name: formData.name,
          displayName: formData.displayName,
          permissions: formData.permissions,
          description: formData.description || undefined
        });
        showToast('角色创建成功', 'success');
      }
      
      onSuccess(role);
    } catch (error: any) {
      console.error('Failed to save role:', error);
      if (error.message?.includes('name')) {
        setErrors({ name: '角色名称已存在' });
      } else {
        showToast(error.message || '保存角色失败', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePermission = (permission: string) => {
    const newPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    handleInputChange('permissions', newPermissions);
  };

  const hasAllPermissions = formData.permissions.includes('all');

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editingRole ? '编辑角色' : '添加角色'}
      subtitle={editingRole ? `编辑角色 ${editingRole.displayName}` : '创建新用户角色'}
      icon={<Shield className="w-6 h-6 text-primary-foreground" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="name">角色名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="输入角色名称"
              className={errors.name ? 'border-destructive' : ''}
              disabled={loading || (editingRole?.isSystem ?? false)}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
            {editingRole?.isSystem && (
              <p className="text-sm text-muted-foreground">系统角色不能修改名称</p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">显示名称 *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="输入显示名称"
              className={errors.displayName ? 'border-destructive' : ''}
              disabled={loading}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="输入角色描述（可选）"
            disabled={loading}
          />
        </div>

        {/* Permissions */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>权限设置 *</Label>
            {errors.permissions && (
              <p className="text-sm text-destructive">{errors.permissions}</p>
            )}
          </div>
          
          <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
            {AVAILABLE_PERMISSIONS.map((permission) => {
              const isSelected = formData.permissions.includes(permission.key);
              const isDisabled = loading || (hasAllPermissions && permission.key !== 'all');
              
              return (
                <div
                  key={permission.key}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary/5 border-primary' 
                      : 'hover:bg-muted border-border'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isDisabled && togglePermission(permission.key)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                    isSelected 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{permission.name}</span>
                      {permission.key === 'all' && (
                        <Badge variant="destructive" className="text-xs">
                          高级权限
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{permission.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {hasAllPermissions && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-destructive">
                <Shield className="w-4 h-4" />
                <span className="font-medium">全部权限已选择</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                此角色将拥有系统的所有权限，请谨慎分配。
              </p>
            </div>
          )}
        </div>

        {/* Selected Permissions Summary */}
        {formData.permissions.length > 0 && !hasAllPermissions && (
          <div className="space-y-2">
            <Label>已选择权限</Label>
            <div className="flex flex-wrap gap-2">
              {formData.permissions.map((permission) => {
                const permInfo = AVAILABLE_PERMISSIONS.find(p => p.key === permission);
                return (
                  <Badge key={permission} variant="secondary" className="flex items-center space-x-1">
                    <span>{permInfo?.name || permission}</span>
                    <button
                      type="button"
                      onClick={() => togglePermission(permission)}
                      className="ml-1 hover:bg-background rounded-full"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background" />
                <span>保存中...</span>
              </div>
            ) : (
              editingRole ? '更新角色' : '创建角色'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}