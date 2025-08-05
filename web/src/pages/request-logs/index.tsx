import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiService } from '@/services/api';
import RequestLogDetailModal from '@/components/RequestLogDetailModal';
import type { 
  RequestLogSummary, 
  RequestLogsRequest, 
  RequestStatusStat,
  DateFilterRequest 
} from '@/services/api';

export default function RequestLogsPage() {
  const [requestLogs, setRequestLogs] = useState<RequestLogSummary[]>([]);
  const [requestStats, setRequestStats] = useState<RequestStatusStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [apiKeyFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterRequest>({
    type: 'preset',
    preset: 'today'
  });
  const [sortBy, setSortBy] = useState('RequestStartTime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [pageSize, setPageSize] = useState(20);
  
  const fetchRequestLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const request: RequestLogsRequest = {
        page: currentPage,
        pageSize,
        dateFilter,
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        model: modelFilter || undefined,
        platform: platformFilter || undefined,
        apiKeyId: apiKeyFilter || undefined,
        sortBy,
        sortDirection
      };
      
      const [logsResponse, statsResponse] = await Promise.all([
        apiService.getRequestLogs(request),
        apiService.getRequestStatusStats(dateFilter)
      ]);
      
      setRequestLogs(logsResponse.data);
      setTotalPages(logsResponse.totalPages);
      setTotalCount(logsResponse.total);
      setRequestStats(statsResponse);
    } catch (error) {
      console.error('Failed to fetch request logs:', error);
      setError('获取请求日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestLogs();
  }, [currentPage, pageSize, searchTerm, statusFilter, modelFilter, platformFilter, apiKeyFilter, dateFilter, sortBy, sortDirection]);

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost: number): string => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return cost.toFixed(6);
    return `$${cost.toFixed(4)}`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-primary/10 text-primary';
      case 'error':
        return 'bg-destructive/10 text-destructive';
      case 'timeout':
        return 'bg-muted/50 text-muted-foreground';
      default:
        return 'bg-muted dark:bg-card text-foreground dark:text-card-foreground';
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    fetchRequestLogs();
  };

  if (loading && requestLogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold dark:text-foreground">请求日志管理</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary transition-colors">
            <Download className="h-4 w-4" />
            <span>导出</span>
          </button>
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {requestStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.status.toUpperCase()} 请求
              </CardTitle>
              <div className={`p-2 rounded-lg ${
                stat.status === 'success' ? 'bg-primary/10' :
                stat.status === 'error' ? 'bg-destructive/10' : 'bg-muted/50'
              }`}>
                {getStatusIcon(stat.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-foreground">{stat.count.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                平均响应时间: {formatDuration(stat.averageDurationMs)}
              </p>
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <span>Token: {stat.totalTokens.toLocaleString()}</span>
                <span>费用: {formatCost(stat.totalCost)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>过滤器</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-card-foreground">搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索API Key、请求ID等..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg w-full focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-card-foreground">状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">全部状态</option>
                <option value="success">成功</option>
                <option value="error">错误</option>
                <option value="timeout">超时</option>
              </select>
            </div>

            {/* Model Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-card-foreground">模型</label>
              <input
                type="text"
                placeholder="模型名称"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Platform Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-card-foreground">平台</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">全部平台</option>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-card-foreground">时间范围</label>
              <select
                value={dateFilter.preset || ''}
                onChange={(e) => setDateFilter({ type: 'preset', preset: e.target.value })}
                className="w-full px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="last7days">最近7天</option>
                <option value="last30days">最近30天</option>
              </select>
            </div>

            {/* Page Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-card-foreground">每页显示</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value={10}>10条</option>
                <option value={20}>20条</option>
                <option value={50}>50条</option>
                <option value={100}>100条</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>请求日志 ({totalCount.toLocaleString()} 条记录)</CardTitle>
            <div className="text-sm text-muted-foreground">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{error}</span>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b border-border dark:border-border">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('RequestStartTime')}
                      className="flex items-center space-x-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    >
                      <span>请求时间</span>
                      {sortBy === 'RequestStartTime' && (
                        <ChevronDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground dark:text-muted-foreground">API Key</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground dark:text-muted-foreground">模型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground dark:text-muted-foreground">状态</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('DurationMs')}
                      className="flex items-center space-x-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    >
                      <span>响应时间</span>
                      {sortBy === 'DurationMs' && (
                        <ChevronDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('TotalTokens')}
                      className="flex items-center space-x-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    >
                      <span>Token</span>
                      {sortBy === 'TotalTokens' && (
                        <ChevronDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('Cost')}
                      className="flex items-center space-x-1 text-sm font-medium text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                    >
                      <span>费用</span>
                      {sortBy === 'Cost' && (
                        <ChevronDown className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground dark:text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {requestLogs.map((log) => (
                  <tr key={log.id} className="border-b border-muted dark:border-border hover:bg-muted dark:hover:bg-muted">
                    <td className="px-4 py-3 text-sm dark:text-foreground">
                      <div>{formatTime(log.requestStartTime)}</div>
                      {log.requestId && (
                        <div className="text-xs text-muted-foreground truncate max-w-32">
                          ID: {log.requestId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-foreground">
                      <div className="font-medium dark:text-foreground">{log.apiKeyName}</div>
                      {log.accountName && (
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground">{log.accountName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-foreground">
                      <div className="font-mono dark:text-foreground">{log.model}</div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground capitalize">{log.platform}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      {log.httpStatusCode && (
                        <div className="text-xs text-muted-foreground mt-1">
                          HTTP {log.httpStatusCode}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-foreground">
                      {formatDuration(log.durationMs)}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-foreground">
                      <div>{log.totalTokens.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        输入: {log.inputTokens} / 输出: {log.outputTokens}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono dark:text-foreground">
                      {formatCost(log.cost)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLogId(log.id)}
                        className="flex items-center space-x-1 px-2 py-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">详情</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <span>显示第 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} 条，共 {totalCount} 条记录</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted dark:hover:bg-primary/90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, currentPage - 2);
                const pageNum = startPage + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border rounded-lg ${
                      pageNum === currentPage
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border dark:border-border dark:bg-card dark:text-foreground hover:bg-muted dark:hover:bg-primary/90'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 border border-border dark:border-border dark:bg-card dark:text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted dark:hover:bg-primary/90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <RequestLogDetailModal
        logId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
      />
    </div>
  );
}