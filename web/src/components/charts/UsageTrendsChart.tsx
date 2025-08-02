import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { apiService, type TrendDataRequest, type TrendDataPoint } from '@/services/api';

interface UsageTrendsChartProps {
  className?: string;
}

export default function UsageTrendsChart({ className }: UsageTrendsChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');
  const [dateRange, setDateRange] = useState('7days');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      
      const request: TrendDataRequest = {
        granularity,
        dateFilter: {
          type: 'preset',
          preset: dateRange
        }
      };

      const trendData = await apiService.getTrendData(request);
      setData(trendData);
    } catch (error) {
      console.error('获取趋势数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
  }, [granularity, dateRange]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-gray-700 dark:text-gray-300">
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>使用趋势分析</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={chartType} onValueChange={(value: 'line' | 'area') => setChartType(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">面积图</SelectItem>
                <SelectItem value="line">折线图</SelectItem>
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
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">1天</SelectItem>
                <SelectItem value="7days">7天</SelectItem>
                <SelectItem value="30days">30天</SelectItem>
                <SelectItem value="90days">90天</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={fetchTrendData}>
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Token使用量和API调用次数的时间趋势分析
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis 
                dataKey={granularity === 'day' ? 'label' : 'label'} 
                fontSize={12}
                tick={{ fill: 'currentColor', opacity: 0.7 }}
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.2 }}
              />
              <YAxis 
                fontSize={12}
                tickFormatter={formatValue}
                tick={{ fill: 'currentColor', opacity: 0.7 }}
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {chartType === 'area' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="请求数"
                  />
                  <Area
                    type="monotone"
                    dataKey="inputTokens"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="输入Token"
                  />
                  <Area
                    type="monotone"
                    dataKey="outputTokens"
                    stackId="3"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.3}
                    name="输出Token"
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="请求数"
                  />
                  <Line
                    type="monotone"
                    dataKey="inputTokens"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="输入Token"
                  />
                  <Line
                    type="monotone"
                    dataKey="outputTokens"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="输出Token"
                  />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}