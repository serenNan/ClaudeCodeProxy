import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/ToastContext'
import { apiService, type RegisterRequest } from '@/services/api'
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { showToast } = useToast()
  const navigate = useNavigate()

  // 自动填充邀请码
  useEffect(() => {
    const inviteCode = searchParams.get('inviteCode')
    if (inviteCode) {
      setFormData(prev => ({
        ...prev,
        invitationCode: inviteCode
      }))
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符'
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!formData.password.trim()) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密码确认不匹配'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const registerData: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        invitationCode: formData.invitationCode || undefined
      }

      const response = await apiService.register(registerData)
      
      // 注册成功，设置token和用户认证状态
      // 手动设置token（模拟登录方法的逻辑）
      ;(apiService as any).token = response.accessToken
      localStorage.setItem('token', response.accessToken)
      
      // 构造用户数据并保存到localStorage
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        isActive: response.user.isActive,
        emailConfirmed: response.user.emailConfirmed,
        roleId: response.user.roleId,
        roleName: response.user.roleName,
        createdAt: response.user.createdAt,
        modifiedAt: response.user.modifiedAt,
        permissions: ['read', 'write'] // 默认权限
      }
      localStorage.setItem('user', JSON.stringify(userData))
      
      showToast('注册成功！欢迎使用', 'success')
      // 刷新页面或直接跳转到仪表板，让AuthContext自动检测认证状态
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Registration failed:', error)
      
      // 处理特定的错误情况
      if (error.message?.includes('用户名')) {
        setErrors({ username: '用户名已被使用' })
      } else if (error.message?.includes('邮箱')) {
        setErrors({ email: '邮箱已被注册' })
      } else if (error.message?.includes('邀请码')) {
        setErrors({ invitationCode: '邀请码无效或已过期' })
      } else {
        showToast(error.message || '注册失败，请稍后重试', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-6 w-6" />
            <CardTitle className="text-2xl">创建账户</CardTitle>
          </div>
          <CardDescription>
            填写以下信息创建您的账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={loading}
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={loading}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitationCode">邀请码（可选）</Label>
              <Input
                id="invitationCode"
                type="text"
                placeholder="如有邀请码请输入"
                value={formData.invitationCode}
                onChange={(e) => handleInputChange('invitationCode', e.target.value)}
                disabled={loading}
                className={errors.invitationCode ? 'border-destructive' : ''}
              />
              {errors.invitationCode && (
                <p className="text-sm text-destructive">{errors.invitationCode}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '注册中...' : '创建账户'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">已有账户？</span>
            <Link
              to="/login"
              className="font-medium text-primary hover:underline ml-1"
            >
              立即登录
            </Link>
          </div>

          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回登录页面
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 