import { useState, useEffect } from 'react';
import { 
  X, 
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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'timeout':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!logId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Eye className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">请求日志详情</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            </div>
          )}

          {logDetail && (
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">基本信息</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">请求ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{logDetail.requestId || '-'}</span>
                        {logDetail.requestId && (
                          <button
                            onClick={() => copyToClipboard(logDetail.requestId!)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">状态:</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(logDetail.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(logDetail.status)}`}>
                          {logDetail.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">HTTP状态码:</span>
                      <span className="font-mono text-sm">{logDetail.httpStatusCode || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">响应时间:</span>
                      <span className="font-mono text-sm">{formatDuration(logDetail.durationMs)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">费用:</span>
                      <span className="font-mono text-sm text-green-600">{formatCost(logDetail.cost)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">流式响应:</span>
                      <span className="text-sm">{logDetail.isStreaming ? '是' : '否'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">时间信息</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">请求开始:</span>
                      <span className="font-mono text-sm text-right">{formatTime(logDetail.requestStartTime)}</span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">请求结束:</span>
                      <span className="font-mono text-sm text-right">
                        {logDetail.requestEndTime ? formatTime(logDetail.requestEndTime) : '-'}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-600">创建时间:</span>
                      <span className="font-mono text-sm text-right">{formatTime(logDetail.createdAt)}</span>
                    </div>

                    {logDetail.updatedAt && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-600">更新时间:</span>
                        <span className="font-mono text-sm text-right">{formatTime(logDetail.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* API Key & Account Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>API Key信息</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Key名称:</span>
                      <span className="font-medium text-sm">{logDetail.apiKeyName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Key ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm truncate max-w-32">{logDetail.apiKeyId}</span>
                        <button
                          onClick={() => copyToClipboard(logDetail.apiKeyId)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>账户信息</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">账户名称:</span>
                      <span className="font-medium text-sm">{logDetail.accountName || '-'}</span>
                    </div>

                    {logDetail.accountId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">账户ID:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm truncate max-w-32">{logDetail.accountId}</span>
                          <button
                            onClick={() => copyToClipboard(logDetail.accountId!)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Copy className="h-3 w-3" />
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
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>模型信息</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">模型名称:</span>
                      <span className="font-mono text-sm">{logDetail.model}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">平台:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                        {logDetail.platform}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>客户端信息</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">客户端IP:</span>
                      <span className="font-mono text-sm">{logDetail.clientIp || '-'}</span>
                    </div>

                    {logDetail.userAgent && (
                      <div className="space-y-1">
                        <span className="text-sm text-gray-600">User-Agent:</span>
                        <div className="bg-gray-50 rounded-lg p-2 max-h-16 overflow-y-auto">
                          <span className="font-mono text-xs text-gray-700 break-all">
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
                <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">Token使用情况</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">输入Token</div>
                    <div className="text-xl font-bold text-blue-600">{logDetail.inputTokens.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">输出Token</div>
                    <div className="text-xl font-bold text-green-600">{logDetail.outputTokens.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">缓存创建</div>
                    <div className="text-xl font-bold text-purple-600">{logDetail.cacheCreateTokens.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">缓存读取</div>
                    <div className="text-xl font-bold text-orange-600">{logDetail.cacheReadTokens.toLocaleString()}</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">总Token数</div>
                    <div className="text-xl font-bold text-gray-600">{logDetail.totalTokens.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {logDetail.errorMessage && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2 text-red-600">错误信息</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-mono text-sm whitespace-pre-wrap">
                      {logDetail.errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {logDetail.metadata && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b border-gray-200 pb-2">元数据</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
                      {logDetail.metadata}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}