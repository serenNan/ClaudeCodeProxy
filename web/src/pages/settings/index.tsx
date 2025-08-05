import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UpdateCheckButton } from '@/components/ui/update-notification';
import { Settings2, Save, Database, Shield, Bell, Palette, Download, Users } from 'lucide-react';
import { apiService, type InvitationSettings, type UpdateInvitationSettingsRequest } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const isAdmin = hasRole('admin');

  const [settings, setSettings] = useState({
    systemName: 'Claude Code Proxy',
    maxConcurrentRequests: 10,
    requestTimeout: 30,
    enableLogging: true,
    enableMetrics: true,
    enableNotifications: false,
    autoBackup: true,
    darkMode: false,
    apiRateLimit: 100,
    sessionTimeout: 24,
  });

  const [invitationSettings, setInvitationSettings] = useState<InvitationSettings>({
    inviterReward: 10,
    invitedReward: 5,
    maxInvitations: 50,
    invitationEnabled: true,
  });

  const [saving, setSaving] = useState(false);
  const [savingInvitation, setSavingInvitation] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const [invitationErrors, setInvitationErrors] = useState<Record<string, string>>({});

  // Load invitation settings on component mount
  useEffect(() => {
    if (isAdmin) {
      loadInvitationSettings();
    }
  }, [isAdmin]);

  const loadInvitationSettings = async () => {
    if (!isAdmin) return;
    
    setLoadingInvitation(true);
    try {
      const data = await apiService.getInvitationSettings();
      setInvitationSettings(data);
    } catch (error) {
      console.error('Failed to load invitation settings:', error);
      showToast('加载邀请设置失败', 'error');
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would typically save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
      showToast('设置保存成功', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('设置保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const validateInvitationSettings = (settings: InvitationSettings): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (settings.inviterReward < 0) {
      errors.inviterReward = '邀请者奖励不能为负数';
    }
    
    if (settings.invitedReward < 0) {
      errors.invitedReward = '被邀请者奖励不能为负数';
    }
    
    if (settings.maxInvitations < 1) {
      errors.maxInvitations = '最大邀请数量必须大于0';
    }
    
    if (settings.maxInvitations > 1000) {
      errors.maxInvitations = '最大邀请数量不能超过1000';
    }
    
    return errors;
  };

  const handleInvitationSave = async () => {
    const errors = validateInvitationSettings(invitationSettings);
    setInvitationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      showToast('请修正表单错误', 'error');
      return;
    }

    setSavingInvitation(true);
    try {
      const updateRequest: UpdateInvitationSettingsRequest = {
        inviterReward: invitationSettings.inviterReward,
        invitedReward: invitationSettings.invitedReward,
        maxInvitations: invitationSettings.maxInvitations,
        invitationEnabled: invitationSettings.invitationEnabled,
      };
      
      await apiService.updateInvitationSettings(updateRequest);
      showToast('邀请设置保存成功', 'success');
    } catch (error) {
      console.error('Failed to save invitation settings:', error);
      showToast('邀请设置保存失败', 'error');
    } finally {
      setSavingInvitation(false);
    }
  };

  const handleInvitationReset = () => {
    setInvitationSettings({
      inviterReward: 10,
      invitedReward: 5,
      maxInvitations: 50,
      invitationEnabled: true,
    });
    setInvitationErrors({});
    showToast('邀请设置已重置', 'info');
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateInvitationSetting = (key: keyof InvitationSettings, value: any) => {
    setInvitationSettings(prev => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (invitationErrors[key as string]) {
      setInvitationErrors(prev => ({ ...prev, [key as string]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">系统设置</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 基础设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings2 className="h-5 w-5" />
              <span>基础设置</span>
            </CardTitle>
            <CardDescription>
              系统的基本配置选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">系统名称</Label>
                <Input
                  id="systemName"
                  value={settings.systemName}
                  onChange={(e) => updateSetting('systemName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxConcurrentRequests">最大并发请求数</Label>
                <Input
                  id="maxConcurrentRequests"
                  type="number"
                  value={settings.maxConcurrentRequests}
                  onChange={(e) => updateSetting('maxConcurrentRequests', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestTimeout">请求超时时间 (秒)</Label>
                <Input
                  id="requestTimeout"
                  type="number"
                  value={settings.requestTimeout}
                  onChange={(e) => updateSetting('requestTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">会话超时时间 (小时)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 性能设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>性能设置</span>
            </CardTitle>
            <CardDescription>
              系统性能相关的配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="apiRateLimit">API 速率限制 (每分钟)</Label>
                <Input
                  id="apiRateLimit"
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => updateSetting('apiRateLimit', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用日志记录</Label>
                  <p className="text-sm text-muted-foreground">
                    记录系统操作日志
                  </p>
                </div>
                <Switch
                  checked={settings.enableLogging}
                  onCheckedChange={(checked) => updateSetting('enableLogging', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用性能监控</Label>
                  <p className="text-sm text-muted-foreground">
                    收集系统性能指标
                  </p>
                </div>
                <Switch
                  checked={settings.enableMetrics}
                  onCheckedChange={(checked) => updateSetting('enableMetrics', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自动备份</Label>
                  <p className="text-sm text-muted-foreground">
                    每日自动备份数据
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => updateSetting('autoBackup', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>安全设置</span>
            </CardTitle>
            <CardDescription>
              系统安全相关的配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">安全提示</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 定期更换API密钥</li>
                  <li>• 启用请求日志以便审计</li>
                  <li>• 设置合理的速率限制</li>
                  <li>• 定期备份重要数据</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>通知设置</span>
            </CardTitle>
            <CardDescription>
              系统通知和提醒配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用系统通知</Label>
                <p className="text-sm text-muted-foreground">
                  接收系统状态和错误通知
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 界面设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>界面设置</span>
            </CardTitle>
            <CardDescription>
              用户界面相关的配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>深色模式</Label>
                <p className="text-sm text-muted-foreground">
                  切换到深色主题
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => updateSetting('darkMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 邀请系统设置 - 仅管理员可见 */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>邀请系统设置</span>
              </CardTitle>
              <CardDescription>
                配置用户邀请系统的相关参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingInvitation ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>启用邀请系统</Label>
                      <p className="text-sm text-muted-foreground">
                        允许用户邀请其他人注册
                      </p>
                    </div>
                    <Switch
                      checked={invitationSettings.invitationEnabled}
                      onCheckedChange={(checked) => updateInvitationSetting('invitationEnabled', checked)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviterReward">
                        邀请者奖励 (元)
                        {invitationErrors.inviterReward && (
                          <span className="text-red-500 text-xs ml-2">{invitationErrors.inviterReward}</span>
                        )}
                      </Label>
                      <Input
                        id="inviterReward"
                        type="number"
                        min="0"
                        step="0.01"
                        value={invitationSettings.inviterReward}
                        onChange={(e) => updateInvitationSetting('inviterReward', parseFloat(e.target.value) || 0)}
                        className={invitationErrors.inviterReward ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        成功邀请他人注册后，邀请者获得的奖励金额
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="invitedReward">
                        被邀请者奖励 (元)
                        {invitationErrors.invitedReward && (
                          <span className="text-red-500 text-xs ml-2">{invitationErrors.invitedReward}</span>
                        )}
                      </Label>
                      <Input
                        id="invitedReward"
                        type="number"
                        min="0"
                        step="0.01"
                        value={invitationSettings.invitedReward}
                        onChange={(e) => updateInvitationSetting('invitedReward', parseFloat(e.target.value) || 0)}
                        className={invitationErrors.invitedReward ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        通过邀请链接注册的新用户获得的奖励金额
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="maxInvitations">
                        单用户最大邀请数量
                        {invitationErrors.maxInvitations && (
                          <span className="text-red-500 text-xs ml-2">{invitationErrors.maxInvitations}</span>
                        )}
                      </Label>
                      <Input
                        id="maxInvitations"
                        type="number"
                        min="1"
                        max="1000"
                        value={invitationSettings.maxInvitations}
                        onChange={(e) => updateInvitationSetting('maxInvitations', parseInt(e.target.value) || 1)}
                        className={invitationErrors.maxInvitations ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        每个用户最多可以邀请的人数限制 (1-1000)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleInvitationReset}
                      disabled={savingInvitation}
                    >
                      重置为默认值
                    </Button>
                    <Button
                      onClick={handleInvitationSave}
                      disabled={savingInvitation}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingInvitation ? '保存中...' : '保存邀请设置'}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">邀请系统说明</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 用户通过专属邀请链接邀请其他人注册</li>
                      <li>• 被邀请者成功注册后，双方都会获得相应的奖励</li>
                      <li>• 奖励金额会自动添加到用户的钱包余额中</li>
                      <li>• 可以设置每个用户的最大邀请数量限制</li>
                      <li>• 关闭邀请系统后，所有邀请链接将失效</li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 版本管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>版本管理</span>
            </CardTitle>
            <CardDescription>
              检查和管理系统版本更新
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>检查更新</Label>
                <p className="text-sm text-muted-foreground">
                  手动检查是否有新版本可用
                </p>
              </div>
              <UpdateCheckButton />
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">版本说明</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 系统会自动检查更新并在有新版本时通知</li>
                <li>• 更新通知会显示在页面右上角</li>
                <li>• 点击更新按钮将跳转到GitHub下载页面</li>
                <li>• 建议定期检查更新以获取最新功能和安全修复</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}