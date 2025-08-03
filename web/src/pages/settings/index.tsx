import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UpdateCheckButton } from '@/components/ui/update-notification';
import { Settings2, Save, Database, Shield, Bell, Palette, Download } from 'lucide-react';

export default function SettingsPage() {
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

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would typically save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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