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
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { apiService } from '@/services/api';
import type { DashboardResponse, CostDataResponse, UptimeResponse, TrendDataPoint } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardPage() {
  const { actualTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [costData, setCostData] = useState<CostDataResponse | null>(null);
  const [uptimeData, setUptimeData] = useState<UptimeResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 主题感知的图表颜色
  const chartColors = {
    light: {
      primary: '#8b5cf6',    // 紫色 - API调用
      secondary: '#3b82f6',  // 蓝色 - 输入Token  
      tertiary: '#10b981',   // 绿色 - 输出Token
      quaternary: '#f59e0b', // 橙色 - 缓存创建Token
      quinary: '#ef4444',    // 红色 - 缓存读取Token
      accent: '#fbbf24',     // 黄色 - 费用
      grid: '#e5e7eb',       // 网格线
      text: '#6b7280'        // 文本
    },
    dark: {
      primary: '#a855f7',    // 亮紫色 - API调用
      secondary: '#60a5fa',  // 亮蓝色 - 输入Token
      tertiary: '#34d399',   // 亮绿色 - 输出Token  
      quaternary: '#fbbf24', // 亮橙色 - 缓存创建Token
      quinary: '#f87171',    // 亮红色 - 缓存读取Token
      accent: '#fde047',     // 亮黄色 - 费用
      grid: '#374151',       // 网格线
      text: '#9ca3af'        // 文本
    }
  };

  const colors = chartColors[actualTheme];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setTrendError(null);
        
        // 分别处理核心数据和趋势数据
        const [dashboard, costs, uptime] = await Promise.all([
          apiService.getDashboardData(),
          apiService.getCostData(),
          apiService.getSystemUptime(),
        ]);

        setDashboardData(dashboard);
        setCostData(costs);
        setUptimeData(uptime);

        // 单独尝试获取趋势数据
        try {
          const trends = await apiService.getTrendData({
            granularity: 'day',
            dateFilter: {
              type: 'preset',
              preset: 'last_7_days'
            }
          });
          setTrendData(trends);
        } catch (trendErr) {
          console.error('Failed to fetch trend data:', trendErr);
          setTrendError('趋势数据暂时无法获取，后端查询需要优化');
          setTrendData([]);
        }
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

  const formatTokens = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
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
      color: 'text-primary',
      bgColor: 'bg-muted',
      trend: dashboardData.activeApiKeys > 0 ? '正常' : '无活跃',
    },
    {
      title: '服务账户',
      value: dashboardData.totalAccounts,
      subtitle: `${dashboardData.activeAccounts} 个可用, ${dashboardData.rateLimitedAccounts} 个限流`,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-muted',
      trend: dashboardData.activeAccounts > 0 ? '正常' : '无可用',
    },
    {
      title: '今日请求',
      value: formatNumber(dashboardData.todayRequests),
      subtitle: `总计 ${formatNumber(dashboardData.totalRequests)} 次`,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-muted',
      trend: '活跃',
    },
    {
      title: '今日费用',
      value: costData?.todayCosts.formatted.totalCost || '$0.00',
      subtitle: `总计 ${costData?.totalCosts.formatted.totalCost || '$0.00'}`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-muted',
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
      color: 'text-primary',
      bgColor: 'bg-muted',
    },
    {
      title: '今日输出 Token',
      value: formatNumber(dashboardData.todayOutputTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalOutputTokens)}`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-muted',
    },
    {
      title: '缓存创建',
      value: formatNumber(dashboardData.todayCacheCreateTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalCacheCreateTokens)}`,
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-muted',
    },
    {
      title: '缓存读取',
      value: formatNumber(dashboardData.todayCacheReadTokens),
      subtitle: `总计 ${formatNumber(dashboardData.totalCacheReadTokens)}`,
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-muted',
    },
  ];

  // 实时性能指标
  const performanceStats = [
    {
      title: 'RPM (每分钟请求)',
      value: formatRPM(dashboardData.realtimeRPM),
      subtitle: `${dashboardData.metricsWindow}分钟窗口`,
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-muted',
      isHistorical: dashboardData.isHistoricalMetrics,
    },
    {
      title: 'TPM (每分钟Token)',
      value: formatTPM(dashboardData.realtimeTPM),
      subtitle: `${dashboardData.metricsWindow}分钟窗口`,
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-muted',
      isHistorical: dashboardData.isHistoricalMetrics,
    },
    {
      title: '系统状态',
      value: dashboardData.systemStatus,
      subtitle: uptimeData?.uptimeText || '运行中',
      icon: dashboardData.systemStatus === '正常' ? CheckCircle : AlertCircle,
      color: dashboardData.systemStatus === '正常' ? 'text-primary' : 'text-destructive',
      bgColor: dashboardData.systemStatus === '正常' ? 'bg-muted' : 'bg-secondary',
    },
    {
      title: '系统运行时间',
      value: uptimeData?.uptimeText?.split(' ')[0] || '0天',
      subtitle: `启动于 ${uptimeData ? new Date(uptimeData.startTime).toLocaleDateString() : ''}`,
      icon: Server,
      color: 'text-primary',
      bgColor: 'bg-muted',
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
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-secondary text-secondary-foreground'
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
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
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
        <Card className="bg-muted border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">📊 高级统计分析</h3>
                <p className="text-muted-foreground mt-1">
                  深入探索数据洞察，包括使用热力图、成本流向分析、用户画像等多维度可视化
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
              {trendError ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">{trendError}</p>
                    <p className="text-xs mt-1">显示其他统计数据</p>
                  </div>
                </div>
              ) : trendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">暂无趋势数据</p>
                  </div>
                </div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis 
                      dataKey="label" 
                      stroke={colors.text}
                      fontSize={12}
                    />
                    <YAxis 
                      stroke={colors.text}
                      fontSize={12}
                      tickFormatter={(value) => formatTokens(value)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--card-foreground))'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'requests' ? value.toLocaleString() : 
                        name.includes('Tokens') ? formatTokens(value) : value.toLocaleString(),
                        name === 'requests' ? 'API 调用' :
                        name === 'inputTokens' ? '输入 Token' :
                        name === 'outputTokens' ? '输出 Token' :
                        name === 'cacheCreateTokens' ? '缓存创建 Token' :
                        name === 'cacheReadTokens' ? '缓存读取 Token' : name
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stackId="1"
                      stroke={colors.primary} 
                      fill={colors.primary} 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="inputTokens" 
                      stackId="2"
                      stroke={colors.secondary} 
                      fill={colors.secondary} 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="outputTokens" 
                      stackId="3"
                      stroke={colors.tertiary} 
                      fill={colors.tertiary} 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cacheCreateTokens" 
                      stackId="4"
                      stroke={colors.quaternary} 
                      fill={colors.quaternary} 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cacheReadTokens" 
                      stackId="5"
                      stroke={colors.quinary} 
                      fill={colors.quinary} 
                      fillOpacity={0.6}
                    />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                {trendError ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">费用趋势暂不可用</p>
                    </div>
                  </div>
                ) : trendData.length === 0 ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Activity className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">暂无费用数据</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                      <XAxis 
                        dataKey="label" 
                        stroke={colors.text}
                        fontSize={10}
                      />
                      <YAxis 
                        stroke={colors.text}
                        fontSize={10}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          color: 'hsl(var(--card-foreground))'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(4)}`, '费用']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cost" 
                        stroke={colors.accent} 
                        strokeWidth={2}
                        dot={{ fill: colors.accent, strokeWidth: 2, r: 3 }}
                      />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>今日费用</span>
                    <span className="font-medium">{costData?.todayCosts.formatted.totalCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>总费用</span>
                    <span className="font-medium">{costData?.totalCosts.formatted.totalCost}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}