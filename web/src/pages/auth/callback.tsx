import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // const { login } = useAuth(); // 暂时不使用
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`${provider}授权失败: ${error}`);
        }

        if (!code) {
          throw new Error('授权码缺失');
        }

        // 验证state
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
          throw new Error('状态验证失败，可能存在安全风险');
        }

        const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
        
        // 调用后端回调API
        const response = await fetch(`/api/oauth/${provider}/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri,
            state,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `${provider}登录失败`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // 保存token
          localStorage.setItem('token', data.data.accessToken);
          
          // 设置用户信息
          if (data.data.user) {
            // 直接设置用户状态，因为后端已经返回了完整的用户信息
            const userData = {
              ...data.data.user,
              permissions: data.data.user.permissions || []
            };
            
            // 手动触发状态更新（这里可能需要调用AuthContext的内部方法）
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          // 清理session storage
          sessionStorage.removeItem('oauth_state');
          const redirectPath = sessionStorage.getItem('oauth_redirect') || '/';
          sessionStorage.removeItem('oauth_redirect');
          
          // 重新加载页面以更新auth状态
          window.location.href = redirectPath;
        } else {
          throw new Error(data.message || `${provider}登录失败`);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : `${provider}登录失败`);
        setLoading(false);
      }
    };

    if (provider) {
      handleCallback();
    } else {
      setError('未知的登录方式');
      setLoading(false);
    }
  }, [provider, searchParams]);

  const handleRetry = () => {
    // 返回登录页面
    navigate('/login', { replace: true });
  };

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case 'github':
        return 'GitHub';
      case 'gitee':
        return 'Gitee';
      case 'google':
        return 'Google';
      default:
        return '第三方';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : error ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {loading ? `${getProviderName(provider)}登录中...` : error ? '登录失败' : '登录成功'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          {loading && (
            <p className="text-muted-foreground">
              正在验证{getProviderName(provider)}授权信息，请稍候...
            </p>
          )}
          
          {error && (
            <div className="space-y-4">
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
              <button
                onClick={handleRetry}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                返回登录页面
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}