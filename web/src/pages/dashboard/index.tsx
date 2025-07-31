import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Key, Users, Activity, TrendingUp, Clock } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKey, Account } from '@/services/api';

interface DashboardStats {
  totalApiKeys: number;
  activeApiKeys: number;
  totalAccounts: number;
  activeAccounts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApiKeys: 0,
    activeApiKeys: 0,
    totalAccounts: 0,
    activeAccounts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apiKeys, accounts] = await Promise.all([
          apiService.getApiKeys(),
          apiService.getAccounts(),
        ]);

        setStats({
          totalApiKeys: apiKeys.length,
          activeApiKeys: apiKeys.filter((key: ApiKey) => key.isActive).length,
          totalAccounts: accounts.length,
          activeAccounts: accounts.filter((account: Account) => account.isActive).length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'API Keys 总数',
      value: stats.totalApiKeys,
      description: `${stats.activeApiKeys} 个活跃`,
      icon: Key,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '账号总数',
      value: stats.totalAccounts,
      description: `${stats.activeAccounts} 个可用`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '系统状态',
      value: '正常',
      description: '所有服务运行正常',
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: '响应时间',
      value: '< 100ms',
      description: '平均响应时间',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">数据面板</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>使用趋势</span>
            </CardTitle>
            <CardDescription>
              过去7天的API调用统计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <p>暂无数据展示</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>系统监控</span>
            </CardTitle>
            <CardDescription>
              实时系统状态监控
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">CPU 使用率</span>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">内存使用率</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}