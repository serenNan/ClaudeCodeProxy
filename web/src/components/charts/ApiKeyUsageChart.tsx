import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Key, TrendingUp, Users, DollarSign } from 'lucide-react';
import { apiService, type ApiKeysTrendRequest, type ApiKeysTrendResponse } from '@/services/api';

interface ApiKeyUsageChartProps {
  className?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7300', '#00FF00', '#FF00FF'
];

export default function ApiKeyUsageChart({ className }: ApiKeyUsageChartProps) {
  const [data, setData] = useState<ApiKeysTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'requests' | 'tokens'>('requests');
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');
  const [dateRange, setDateRange] = useState('7days');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'stacked'>('stacked');

  const fetchApiKeysTrend = async () => {
    try {
      setLoading(true);

      const request: ApiKeysTrendRequest = {
        metric,
        granularity,
        dateFilter: {
          type: 'preset',
          preset: dateRange
        }
      };

      const trendData = await apiService.getApiKeysTrend(request);
      setData(trendData);
    } catch (error) {
      console.error('获取API Keys趋势数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeysTrend();
  }, [metric, granularity, dateRange]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const getChartData = () => {
    if (!data?.data) return [];

    return data.data.map(item => {
      const result: any = {
        name: item.label || item.date || item.hour,
        total: 0
      };

      // 为每个API Key添加数据
      Object.entries(item.apiKeys).forEach(([_, keyData]: any) => {
        const value = metric === 'requests' ? keyData.requests : keyData.tokens;
        result[keyData.name] = value;
        result.total += value;
      });

      return result;
    });
  };

  const getTopApiKeys = () => {
    if (!data?.topApiKeys) return [];
    return data.topApiKeys.slice(0, 10); // 只显示前10个
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-medium mb-2">{label}</p>
          {payload
            .filter((entry: any) => entry.dataKey !== 'total' && entry.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 8) // 只显示前8个
            .map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.dataKey}: {formatValue(entry.value)}
              </p>
            ))}
          {payload.length > 9 && (
            <p className="text-xs text-gray-500 mt-1">...</p>
          )}
        </div>
      );
    }
    return null;
  };

  const chartData = getChartData();
  const topApiKeys = getTopApiKeys();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <CardTitle>API Key 使用分析</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={chartType} onValueChange={(value: 'bar' | 'line' | 'stacked') => setChartType(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stacked">堆叠图</SelectItem>
                <SelectItem value="bar">柱状图</SelectItem>
                <SelectItem value="line">折线图</SelectItem>
              </SelectContent>
            </Select>

            <Select value={metric} onValueChange={(value: 'requests' | 'tokens') => setMetric(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requests">请求数</SelectItem>
                <SelectItem value="tokens">Token数</SelectItem>
              </SelectContent>
            </Select>

            <Select value={granularity} onValueChange={(value: 'day' | 'hour') => setGranularity(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">按天</SelectItem>
                <SelectItem value="hour">按小时</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">1天</SelectItem>
                <SelectItem value="7days">7天</SelectItem>
                <SelectItem value="30days">30天</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchApiKeysTrend}>
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          前10名API Key的{metric === 'requests' ? '请求数量' : 'Token使用量'}趋势分析
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>暂无数据</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {topApiKeys.slice(0, 5).map((apiKeyId, index) => {
                    // 找到对应的API Key名称
                    const sampleData = chartData.find(d => Object.keys(d).some(k => k !== 'name' && k !== 'total'));
                    const keyName = sampleData ? Object.keys(sampleData).find(k => k !== 'name' && k !== 'total') : `API Key ${index + 1}`;

                    return (
                      <Line
                        key={apiKeyId.id}
                        type="monotone"
                        dataKey={keyName || `key_${index}`}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        name={keyName || `API Key ${index + 1}`}
                      />
                    );
                  })}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {chartType === 'stacked' ? (
                    // 堆叠柱状图
                    topApiKeys.slice(0, 10).map((apiKeyId, index) => {
                      const sampleData = chartData.find(d => Object.keys(d).some(k => k !== 'name' && k !== 'total'));
                      const keyNames = sampleData ? Object.keys(sampleData).filter(k => k !== 'name' && k !== 'total') : [];
                      const keyName = keyNames[index] || `API Key ${index + 1}`;

                      return (
                        <Bar
                          key={apiKeyId.id}
                          dataKey={keyName}
                          stackId="1"
                          fill={COLORS[index % COLORS.length]}
                          name={keyName}
                        />
                      );
                    })
                  ) : (
                    // 普通柱状图显示总计
                    <Bar dataKey="total" fill="#8884d8" name="总计" />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* 统计摘要 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">总API Keys</span>
                </div>
                <div className="text-lg font-semibold">{data?.totalApiKeys || 0}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">活跃API Keys</span>
                </div>
                <div className="text-lg font-semibold">{topApiKeys.length}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">总{metric === 'requests' ? '请求' : 'Token'}</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatValue(chartData.reduce((sum, d) => sum + (d.total || 0), 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">平均每天</span>
                </div>
                <div className="text-lg font-semibold">
                  {formatValue(chartData.length > 0 ? chartData.reduce((sum, d) => sum + (d.total || 0), 0) / chartData.length : 0)}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}