import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Server, Info } from 'lucide-react';
import type { ProxyConfig } from '@/services/api';

interface ProxyConfigProps {
  value: ProxyConfig;
  onChange: (value: ProxyConfig) => void;
}

export default function ProxyConfigComponent({ value, onChange }: ProxyConfigProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    setShowAuth(!!(value.username || value.password));
  }, [value.username, value.password]);

  const handleChange = (field: keyof ProxyConfig, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleAuthToggle = (enabled: boolean) => {
    setShowAuth(enabled);
    if (!enabled) {
      onChange({
        ...value,
        username: '',
        password: ''
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          代理设置 (可选)
        </h4>
        <div className="flex items-center space-x-2">
          <Switch
            checked={value.enabled}
            onCheckedChange={(enabled) => handleChange('enabled', enabled)}
          />
          <Label>启用代理</Label>
        </div>
      </div>

      {value.enabled && (
        <Card className="border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Server className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  配置代理以访问受限的网络资源。支持 SOCKS5 和 HTTP 代理。
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  请确保代理服务器稳定可用，否则会影响账户的正常使用。
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>代理类型</Label>
              <Select
                value={value.type}
                onValueChange={(type: 'socks5' | 'http' | 'https') => handleChange('type', type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主机地址</Label>
                <Input
                  placeholder="例如: 192.168.1.100"
                  value={value.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>端口</Label>
                <Input
                  type="number"
                  placeholder="例如: 1080"
                  value={value.port}
                  onChange={(e) => handleChange('port', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showAuth}
                  onCheckedChange={handleAuthToggle}
                />
                <Label>需要身份验证</Label>
              </div>

              {showAuth && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>用户名</Label>
                    <Input
                      placeholder="代理用户名"
                      value={value.username || ''}
                      onChange={(e) => handleChange('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>密码</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="代理密码"
                        value={value.password || ''}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted p-3 rounded-xl border border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>提示：</strong>代理设置将用于所有与此账户相关的API请求。请确保代理服务器支持HTTPS流量转发。
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}