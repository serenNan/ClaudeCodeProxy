import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface OAuthProviders {
  github: boolean;
  gitee: boolean;
  google: boolean;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthProviders, setOAuthProviders] = useState<OAuthProviders>({ 
    github: false, 
    gitee: false, 
    google: false 
  });
  const [providersLoading, setProvidersLoading] = useState(true);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const fetchOAuthProviders = async () => {
      try {
        const response = await fetch('/api/oauth/providers/status');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOAuthProviders(data.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch OAuth providers:', err);
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchOAuthProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'github' | 'gitee' | 'google') => {
    try {
      setLoading(true);
      setError('');

      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const state = Math.random().toString(36).substring(7);
      
      // 保存state到sessionStorage
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_redirect', from);

      // 获取授权URL
      const response = await fetch(`/api/oauth/${provider}/auth?redirectUri=${encodeURIComponent(redirectUri)}&state=${state}`);
      
      if (!response.ok) {
        throw new Error(`${provider}登录服务暂时不可用`);
      }

      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        // 跳转到授权页面
        window.location.href = data.data.authUrl;
      } else {
        throw new Error(data.message || `${provider}登录失败`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider}登录失败`);
      setLoading(false);
    }
  };

  const hasAnyOAuthProvider = !providersLoading && (oauthProviders.github || oauthProviders.gitee || oauthProviders.google);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm mx-4 border-0 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Claude Code Proxy
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              管理控制台登录
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="h-10"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>登录中...</span>
                </div>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">还没有账户？</span>
            <Link
              to="/register"
              className="font-medium text-primary hover:underline ml-1"
            >
              立即注册
            </Link>
          </div>

          {hasAnyOAuthProvider && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或使用第三方登录
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {oauthProviders.github && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub 登录
                  </Button>
                )}

                {oauthProviders.gitee && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => handleOAuthLogin('gitee')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v.296c0 .982.796 1.778 1.778 1.778h5.63c.327 0 .593.265.593.592v1.482a.594.594 0 0 1-.593.593H9.777a3.24 3.24 0 0 1-3.24-3.24V9.778a3.24 3.24 0 0 1 3.24-3.24h8.297z"/>
                    </svg>
                    Gitee 登录
                  </Button>
                )}

                {oauthProviders.google && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google 登录
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}