import { useState, useEffect } from 'react';
import { AlertCircle, Download, X } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface VersionCheckResult {
  currentVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  errorMessage?: string;
  releaseInfo?: {
    tagName?: string;
    name?: string;
    body?: string;
    htmlUrl?: string;
    publishedAt?: string;
    prerelease?: boolean;
    draft?: boolean;
  };
}

interface UpdateNotificationProps {
  className?: string;
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const [versionInfo, setVersionInfo] = useState<VersionCheckResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // 检查更新
  const checkForUpdates = async () => {
    if (isCheckingUpdate) return;

    setIsCheckingUpdate(true);
    setIsLoading(true);

    try {
      const response = await fetch('/api/version/check-updates');
      if (response.ok) {
        const result: VersionCheckResult = await response.json();
        setVersionInfo(result);
        
        // 只有在有更新时才显示通知
        if (result.hasUpdate && !result.errorMessage) {
          setIsVisible(true);
        }
      } else {
        console.warn('检查更新失败:', response.statusText);
      }
    } catch (error) {
      console.error('检查更新时发生错误:', error);
    } finally {
      setIsLoading(false);
      setIsCheckingUpdate(false);
    }
  };

  // 组件挂载时自动检查更新
  useEffect(() => {
    // 延迟5秒后检查更新，避免影响应用启动
    const timer = setTimeout(checkForUpdates, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 每30分钟检查一次更新
  useEffect(() => {
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 关闭通知
  const handleClose = () => {
    setIsVisible(false);
  };

  // 跳转到下载页面
  const handleDownload = () => {
    if (versionInfo?.releaseInfo?.htmlUrl) {
      window.open(versionInfo.releaseInfo.htmlUrl, '_blank');
    }
  };

  // 手动检查更新
  const handleManualCheck = () => {
    checkForUpdates();
  };

  // 如果没有更新或不可见，则不渲染
  if (!isVisible || !versionInfo?.hasUpdate) {
    return null;
  }

  return (
    <Card className={`fixed top-4 right-4 z-50 max-w-md bg-blue-50 border-blue-200 shadow-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-blue-900">
                发现新版本
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  当前版本: <span className="font-mono">{versionInfo.currentVersion}</span>
                </p>
                <p>
                  最新版本: <span className="font-mono text-blue-800 font-semibold">{versionInfo.latestVersion}</span>
                </p>
                {versionInfo.releaseInfo?.publishedAt && (
                  <p className="text-xs text-blue-600 mt-1">
                    发布时间: {new Date(versionInfo.releaseInfo.publishedAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualCheck}
            disabled={isLoading}
            className="text-blue-600 hover:bg-blue-100"
          >
            {isLoading ? '检查中...' : '重新检查'}
          </Button>
          
          <Button
            onClick={handleDownload}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            立即更新
          </Button>
        </div>

        {versionInfo.releaseInfo?.body && (
          <details className="mt-3">
            <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
              查看更新说明
            </summary>
            <div className="mt-2 text-xs text-blue-700 bg-blue-25 p-2 rounded border border-blue-100 max-h-24 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">
                {versionInfo.releaseInfo.body.slice(0, 500)}
                {versionInfo.releaseInfo.body.length > 500 && '...'}
              </pre>
            </div>
          </details>
        )}
      </div>
    </Card>
  );
}

// 简化的手动检查更新按钮组件
export function UpdateCheckButton({ className }: { className?: string }) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleCheck = async () => {
    if (isChecking) return;

    setIsChecking(true);
    setResult('');

    try {
      const response = await fetch('/api/version/check-updates');
      if (response.ok) {
        const data: VersionCheckResult = await response.json();
        if (data.hasUpdate) {
          setResult(`发现新版本: ${data.latestVersion}`);
          if (data.releaseInfo?.htmlUrl) {
            window.open(data.releaseInfo.htmlUrl, '_blank');
          }
        } else {
          setResult('当前已是最新版本');
        }
      } else {
        setResult('检查更新失败');
      }
    } catch (error) {
      setResult('检查更新时发生错误');
      console.error(error);
    } finally {
      setIsChecking(false);
      // 3秒后清除结果信息
      setTimeout(() => setResult(''), 3000);
    }
  };

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCheck}
        disabled={isChecking}
        className="text-xs"
      >
        {isChecking ? '检查中...' : '检查更新'}
      </Button>
      {result && (
        <p className="text-xs text-gray-600 mt-1">{result}</p>
      )}
    </div>
  );
}