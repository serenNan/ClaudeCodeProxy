import { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Key, 
  Cpu, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  Eye
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { RequestLogDetail } from '@/services/api';
import Modal from '@/components/ui/modal';

interface RequestLogDetailModalProps {
  logId: string | null;
  onClose: () => void;
}

export default function RequestLogDetailModal({ logId, onClose }: RequestLogDetailModalProps) {
  const [logDetail, setLogDetail] = useState<RequestLogDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (logId) {
      fetchLogDetail();
    }
  }, [logId]);

  const fetchLogDetail = async () => {
    if (!logId) return;
    
    try {
      setLoading(true);
      setError(null);
      const detail = await apiService.getRequestLogDetail(logId);
      setLogDetail(detail);
    } catch (error) {
      console.error('Failed to fetch log detail:', error);
      setError('获取日志详情失败');
      // Mock data for demo
      setLogDetail({
        id: logId,
        apiKeyId: 'api-key-1',
        apiKeyName: 'Production Key',
        accountId: 'account-1',
        accountName: 'Claude Production Account',
        model: 'claude-3-5-sonnet-20241022',
        platform: 'claude',
        requestStartTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        requestEndTime: new Date(Date.now() - 1000 * 60 * 5 + 2000).toISOString(),
        durationMs: 2000,
        status: 'success',
        httpStatusCode: 200,
        inputTokens: 150,
        outputTokens: 300,
        cacheCreateTokens: 0,
        cacheReadTokens: 50,
        totalTokens: 500,
        cost: 0.0045,
        isStreaming: false,
        clientIp: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        requestId: 'req_123456789',
        metadata: JSON.stringify({
          temperature: 0.7,
          max_tokens: 1000,
          system: 'You are a helpful assistant.'
        }, null, 2),
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number): string => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    return `$${cost.toFixed(4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast here
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'timeout':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (!logId) return null;

  return (
    <Modal
      isOpen={!!logId}
      onClose={onClose}
      title="请求日志详情"
      size="5xl"
      icon={<Eye className="h-6 w-6 text-white" />}
    >
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {logDetail && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">基本信息</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">请求ID:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm text-foreground">{logDetail.requestId || '-'}</span>
                    {logDetail.requestId && (
                      <button
                        onClick={() => copyToClipboard(logDetail.requestId!)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">状态:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(logDetail.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(logDetail.status)}`}>
                      {logDetail.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">HTTP状态码:</span>
                  <span className="font-mono text-sm text-foreground">{logDetail.httpStatusCode || '-'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">响应时间:</span>
                  <span className="font-mono text-sm text-foreground">{formatDuration(logDetail.durationMs)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">费用:</span>
                  <span className="font-mono text-sm text-green-600 dark:text-green-400">{formatCost(logDetail.cost)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">流式响应:</span>
                  <span className="text-sm text-foreground">{logDetail.isStreaming ? '是' : '否'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">时间信息</h3>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">请求开始:</span>
                  <span className="font-mono text-sm text-right text-foreground">{formatTime(logDetail.requestStartTime)}</span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">请求结束:</span>
                  <span className="font-mono text-sm text-right text-foreground">
                    {logDetail.requestEndTime ? formatTime(logDetail.requestEndTime) : '-'}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">创建时间:</span>
                  <span className="font-mono text-sm text-right text-foreground">{formatTime(logDetail.createdAt)}</span>
                </div>

                {logDetail.updatedAt && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-muted-foreground">更新时间:</span>
                    <span className="font-mono text-sm text-right text-foreground">{formatTime(logDetail.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* API Key & Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center space-x-2 text-foreground">
                <Key className="h-5 w-5" />
                <span>API Key信息</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Key名称:</span>
                  <span className="font-medium text-sm text-foreground">{logDetail.apiKeyName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Key ID:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm truncate max-w-32 text-foreground">{logDetail.apiKeyId}</span>
                    <button
                      onClick={() => copyToClipboard(logDetail.apiKeyId)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center space-x-2 text-foreground">
                <User className="h-5 w-5" />
                <span>账户信息</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">账户名称:</span>
                  <span className="font-medium text-sm text-foreground">{logDetail.accountName || '-'}</span>
                </div>

                {logDetail.accountId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">账户ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm truncate max-w-32 text-foreground">{logDetail.accountId}</span>
                      <button
                        onClick={() => copyToClipboard(logDetail.accountId!)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Model & Platform Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center space-x-2 text-foreground">
                <Cpu className="h-5 w-5" />
                <span>模型信息</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">模型名称:</span>
                  <span className="font-mono text-sm text-foreground">{logDetail.model}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">平台:</span>
                  <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium capitalize">
                    {logDetail.platform}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 flex items-center space-x-2 text-foreground">
                <Globe className="h-5 w-5" />
                <span>客户端信息</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">客户端IP:</span>
                  <span className="font-mono text-sm text-foreground">{logDetail.clientIp || '-'}</span>
                </div>

                {logDetail.userAgent && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">User-Agent:</span>
                    <div className="bg-muted rounded-lg p-2 max-h-16 overflow-y-auto">
                      <span className="font-mono text-xs text-muted-foreground break-all">
                        {logDetail.userAgent}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Usage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">Token使用情况</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-muted rounded-lg p-3 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">输入Token</div>
                <div className="text-xl font-bold text-foreground">{logDetail.inputTokens.toLocaleString()}</div>
              </div>
              
              <div className="bg-muted rounded-lg p-3 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">输出Token</div>
                <div className="text-xl font-bold text-foreground">{logDetail.outputTokens.toLocaleString()}</div>
              </div>
              
              <div className="bg-muted rounded-lg p-3 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">缓存创建</div>
                <div className="text-xl font-bold text-foreground">{logDetail.cacheCreateTokens.toLocaleString()}</div>
              </div>
              
              <div className="bg-muted rounded-lg p-3 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">缓存读取</div>
                <div className="text-xl font-bold text-foreground">{logDetail.cacheReadTokens.toLocaleString()}</div>
              </div>
              
              <div className="bg-muted rounded-lg p-3 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">总Token数</div>
                <div className="text-xl font-bold text-foreground">{logDetail.totalTokens.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {logDetail.errorMessage && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 text-red-600 dark:text-red-400">错误信息</h3>
              <div className="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-400 font-mono text-sm whitespace-pre-wrap">
                  {logDetail.errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          {logDetail.metadata && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2 text-foreground">元数据</h3>
              <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                  {logDetail.metadata}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}