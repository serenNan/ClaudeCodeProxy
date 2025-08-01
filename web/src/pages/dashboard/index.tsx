import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Key, 
  Users, 
  Activity, 
  TrendingUp, 
  Clock,
  DollarSign,
  MessageSquare,
  Zap,
  AlertCircle,
  CheckCircle,
  Server
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { DashboardResponse, CostDataResponse, UptimeResponse } from '@/services/api';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [costData, setCostData] = useState<CostDataResponse | null>(null);
  const [uptimeData, setUptimeData] = useState<UptimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [dashboard, costs, uptime] = await Promise.all([
          apiService.getDashboardData(),
          apiService.getCostData(),
          apiService.getSystemUptime(),
        ]);

        setDashboardData(dashboard);
        setCostData(costs);
        setUptimeData(uptime);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('获取仪表板数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatRPM = (rpm: number): string => {
    return rpm.toFixed(1);
  };

  const formatTPM = (tpm: number): string => {
    if (tpm >= 1000) {
      return (tpm / 1000).toFixed(1) + 'K';
    }
    return tpm.toFixed(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  // 主要统计卡片
  const mainStats = [
    {
      title: 'API Keys 总数',
      value: dashboardData.totalApiKeys,
      subtitle: `${dashboardData.activeApiKeys} 个活跃`,
      icon: Key,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: dashboardData.activeApiKeys > 0 ? '正常' : '无活跃',
    },
    {
      title: '服务账户',
      value: dashboardData.totalAccounts,
      subtitle: `${dashboardData.activeAccounts} 个可用, ${dashboardData.rateLimitedAccounts} 个限流`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: dashboardData.activeAccounts > 0 ? '正常' : '无可用',
    },
    {
      title: '今日请求',
      value: formatNumber(dashboardData.todayRequests),
      subtitle: `总计 ${formatNumber(dashboardData.totalRequests)} 次`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '活跃',
    },
    {
      title: '今日费用',
      value: costData?.todayCosts.formatted.totalCost || '$0.00',
      subtitle: `总计 ${costData?.totalCosts.formatted.totalCost || '$0.00'}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '正常',
    },
  ];

  // Token 统计卡片
  const tokenStats = [
    {
      title: '今日输入 Token',
      value: formatNumber(dashboardData.todayInputTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalInputTokens)}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: '今日输出 Token',
      value: formatNumber(dashboardData.todayOutputTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalOutputTokens)}`,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: '缓存创建',
      value: formatNumber(dashboardData.todayCacheCreateTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalCacheCreateTokens)}`,
      icon: Zap,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: '缓存读取',
      value: formatNumber(dashboardData.todayCacheReadTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalCacheReadTokens)}`,
      icon: Zap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  // 实时性能指标
  const performanceStats = [
    {
      title: 'RPM (每分钟请求)',
      value: formatRPM(dashboardData.realtimeRPM),
      subtitle: `${dashboardData.metricsWindow}分钟窗口`,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isHistorical: dashboardData.isHistoricalMetrics,
    },
    {
      title: 'TPM (每分钟Token)',
      value: formatTPM(dashboardData.realtimeTPM),
      subtitle: `${dashboardData.metricsWindow}分钟窗口`,
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isHistorical: dashboardData.isHistoricalMetrics,
    },
    {
      title: '系统状态',
      value: dashboardData.systemStatus,
      subtitle: uptimeData?.uptimeText || '运行中',
      icon: dashboardData.systemStatus === '正常' ? CheckCircle : AlertCircle,
      color: dashboardData.systemStatus === '正常' ? 'text-green-600' : 'text-red-600',
      bgColor: dashboardData.systemStatus === '正常' ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: '系统运行时间',
      value: uptimeData?.uptimeText?.split(' ')[0] || '0天',
      subtitle: `启动于 ${uptimeData ? new Date(uptimeData.startTime).toLocaleDateString() : ''}`,
      icon: Server,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">仪表板</h1>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>最后更新: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 主要统计 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">核心指标</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      stat.trend === '正常' || stat.trend === '活跃' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stat.trend}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Token 统计 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Token 使用情况</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tokenStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 实时性能 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">实时性能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                    <span>{stat.title}</span>
                    {'isHistorical' in stat && stat.isHistorical && (
                      <div className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        历史
                      </div>
                    )}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 高级图表展示 */}
      <div className="space-y-6">
        {/* 快速链接到高级分析 */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">📊 高级统计分析</h3>
                <p className="text-blue-700 mt-1">
                  深入探索数据洞察，包括使用热力图、成本流向分析、用户画像等多维度可视化
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => window.location.href = '/advanced-stats'}
                >
                  查看详细分析
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 基础图表预览 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>使用趋势</span>
              </CardTitle>
              <CardDescription>
                过去7天的API调用和Token使用统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm">📈 趋势图表可在高级分析中查看</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>费用趋势</span>
              </CardTitle>
              <CardDescription>
                费用使用情况和模型分布
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">今日费用</span>
                  <span className="text-sm font-medium">{costData?.todayCosts.formatted.totalCost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">总费用</span>
                  <span className="text-sm font-medium">{costData?.totalCosts.formatted.totalCost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">平均每次请求</span>
                  <span className="text-sm font-medium">
                    {dashboardData.totalRequests > 0 
                      ? `$${(costData?.totalCosts.totalCost || 0 / dashboardData.totalRequests).toFixed(6)}` 
                      : '$0.00'}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                    🔍 查看详细费用流向分析
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}