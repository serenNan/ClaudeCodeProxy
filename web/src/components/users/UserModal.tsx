import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/ui/modal';
import { Users } from 'lucide-react';
import { apiService } from '@/services/api';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest } from '@/services/api';
import { showToast } from '@/utils/toast';

interface UserModalProps {
  open: boolean;
  editingUser: User | null;
  roles: UserRole[];
  onSuccess: (user: User) => void;
  onClose: () => void;
}

export default function UserModal({ open, editingUser, roles, onSuccess, onClose }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    roleId: '',
    isActive: true,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        email: editingUser.email,
        password: '', // Don't populate password for editing
        displayName: editingUser.displayName || '',
        roleId: editingUser.role.id,
        isActive: editingUser.isActive,
        description: editingUser.description || ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        displayName: '',
        roleId: roles.find(r => r.name === 'user')?.id || '',
        isActive: true,
        description: ''
      });
    }
    setErrors({});
  }, [editingUser, roles, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线，长度3-20位';
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!editingUser && !formData.password.trim()) {
      newErrors.password = '密码不能为空';
    } else if (!editingUser && formData.password.length < 6) {
      newErrors.password = '密码长度至少6位';
    }

    if (!formData.roleId) {
      newErrors.roleId = '请选择用户角色';
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
      let user: User;
      
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email,
          displayName: formData.displayName || undefined,
          roleId: formData.roleId,
          isActive: formData.isActive,
          description: formData.description || undefined
        };
        
        // Add password if provided
        if (formData.password.trim()) {
          (updateData as any).password = formData.password;
        }
        
        user = await apiService.updateUser(editingUser.id, updateData);
        showToast('用户更新成功', 'success');
      } else {
        const createData: CreateUserRequest = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || undefined,
          roleId: formData.roleId,
          description: formData.description || undefined
        };
        
        user = await apiService.createUser(createData);
        showToast('用户创建成功', 'success');
      }
      
      onSuccess(user);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      if (error.message?.includes('username')) {
        setErrors({ username: '用户名已存在' });
      } else if (error.message?.includes('email')) {
        setErrors({ email: '邮箱已被使用' });
      } else {
        showToast(error.message || '保存用户失败', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={editingUser ? '编辑用户' : '添加用户'}
      subtitle={editingUser ? `编辑用户 ${editingUser.displayName || editingUser.username}` : '创建新用户账户'}
      icon={<Users className="w-6 h-6 text-primary-foreground" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名 *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="输入用户名"
              className={errors.username ? 'border-destructive' : ''}
              disabled={loading}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址 *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="输入邮箱地址"
              className={errors.email ? 'border-destructive' : ''}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">显示名称</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="输入显示名称（可选）"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            密码 {!editingUser && '*'}
            {editingUser && <span className="text-sm text-muted-foreground ml-2">（留空则不修改）</span>}
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder={editingUser ? "输入新密码（可选）" : "输入密码"}
            className={errors.password ? 'border-destructive' : ''}
            disabled={loading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">用户角色 *</Label>
          <Select 
            value={formData.roleId} 
            onValueChange={(value) => handleInputChange('roleId', value)}
            disabled={loading}
          >
            <SelectTrigger className={errors.roleId ? 'border-destructive' : ''}>
              <SelectValue placeholder="选择用户角色" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="flex items-center space-x-2">
                    <span>{role.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.roleId && (
            <p className="text-sm text-destructive">{errors.roleId}</p>
          )}
          {formData.roleId && (
            <div className="text-sm text-muted-foreground">
              {roles.find(r => r.id === formData.roleId)?.description}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="输入用户描述（可选）"
            disabled={loading}
          />
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="isActive">启用状态</Label>
            <p className="text-sm text-muted-foreground">
              禁用后用户将无法登录系统
            </p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            disabled={loading}
          />
        </div>

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
              editingUser ? '更新用户' : '创建用户'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}