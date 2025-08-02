import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, PieChart, BarChart3, TrendingUp, Table } from 'lucide-react';
import {
  Treemap,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Pie
} from 'recharts';
import { apiService, type DateFilterRequest } from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

interface FlowData {
  source: string;
  target: string;
  value: number;
  formattedValue: string;
  color: string;
}

interface TreemapData {
  name: string;
  size: number;
  fill: string;
  children?: TreemapData[];
}

interface PieData {
  name: string;
  value: number;
  fill: string;
  percentage: number;
}

interface TrendData {
  date: string;
  cost: number;
  requests: number;
}

interface DetailData {
  apiKey: string;
  model: string;
  requests: number;
  cost: number;
  percentage: number;
  tokens: number;
}

interface CostFlowChartProps {
  className?: string;
}

export default function CostFlowChart({ className }: CostFlowChartProps) {
  const { actualTheme } = useTheme();
  const [data, setData] = useState<FlowData[]>([]);
  const [treemapData, setTreemapData] = useState<TreemapData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [detailData, setDetailData] = useState<DetailData[]>([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('treemap');

  // 主题感知的颜色配置
  const colors = useMemo(() => {
    const chartColors = {
      light: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'],
      dark: ['#a855f7', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#a855f7']
    };
    return chartColors[actualTheme];
  }, [actualTheme]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dateFilter: DateFilterRequest = {
          type: 'preset',
          preset: timeRange
        };

        const rawFlowData = await apiService.getApiKeyModelFlowData(dateFilter);

        if (rawFlowData && rawFlowData.length > 0) {
          const flowData: FlowData[] = [];
          const apiKeyGroups = new Map<string, any[]>();
          const modelGroups = new Map<string, number>();

          // 处理原始数据
          rawFlowData.forEach((item, index) => {
            if (item.cost > 0.01) {
              const displayName = item.apiKeyName.length > 15
                ? item.apiKeyName.substring(0, 12) + '...'
                : item.apiKeyName;

              const modelName = item.model
                .replace('claude-3-5-', '')
                .replace('claude-3-', '')
                .replace('claude-', '')
                .replace('anthropic/', '')
                .substring(0, 12);

              flowData.push({
                source: displayName,
                target: modelName,
                value: item.cost,
                formattedValue: `$${item.cost.toFixed(2)}`,
                color: colors[index % colors.length]
              });

              // 分组数据用于其他图表
              if (!apiKeyGroups.has(item.apiKeyId)) {
                apiKeyGroups.set(item.apiKeyId, []);
              }
              apiKeyGroups.get(item.apiKeyId)!.push(item);

              modelGroups.set(modelName, (modelGroups.get(modelName) || 0) + item.cost);
            }
          });

          setData(flowData);

          // 生成TreeMap数据
          const treemapChildren: TreemapData[] = [];
          let colorIndex = 0;

          apiKeyGroups.forEach((items) => {
            const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
            const children: TreemapData[] = items.map(item => ({
              name: item.model.replace('claude-3-5-', '').substring(0, 10),
              size: item.cost,
              fill: colors[colorIndex % colors.length]
            }));

            treemapChildren.push({
              name: items[0].apiKeyName.substring(0, 15),
              size: totalCost,
              fill: colors[colorIndex % colors.length],
              children
            });
            colorIndex++;
          });

          setTreemapData(treemapChildren);

          // 生成饼图数据
          const totalCost = rawFlowData.reduce((sum, item) => sum + item.cost, 0);
          const pieChartData: PieData[] = [];
          let pieColorIndex = 0;

          modelGroups.forEach((cost, model) => {
            pieChartData.push({
              name: model,
              value: cost,
              fill: colors[pieColorIndex % colors.length],
              percentage: (cost / totalCost) * 100
            });
            pieColorIndex++;
          });

          setPieData(pieChartData);

          // 生成详细数据表格
          const details: DetailData[] = rawFlowData.map(item => ({
            apiKey: item.apiKeyName,
            model: item.model,
            requests: item.requests,
            cost: item.cost,
            percentage: (item.cost / totalCost) * 100,
            tokens: item.tokens
          }));

          setDetailData(details);

          // 获取真实趋势数据
          try {
            const trendRequest = {
              granularity: 'day' as const,
              dateFilter: dateFilter
            };
            const trendResponse = await apiService.getTrendData(trendRequest);
            const trends: TrendData[] = trendResponse.map(point => ({
              date: point.date || point.label || '',
              cost: point.cost,
              requests: point.requests
            }));
            setTrendData(trends);
          } catch (trendError) {
            console.error('获取趋势数据失败:', trendError);
            setTrendData([]);
          }

        } else {
          setData([]);
          setTreemapData([]);
          setPieData([]);
          setDetailData([]);
          setTrendData([]);
        }
      } catch (error) {
        console.error('获取流向数据失败:', error);
        setData([]);
        setTreemapData([]);
        setPieData([]);
        setDetailData([]);
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // 格式化函数
  const formatCurrency = (value: number) => `$${(value ?? 0).toFixed(2)}`;
  const formatNumber = (value: number) => (value ?? 0).toLocaleString();

  // 自定义Tooltip组件
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.name.includes('cost') ? formatCurrency(entry.value) : formatNumber(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>成本流向分析</CardTitle>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">1天</SelectItem>
              <SelectItem value="7days">7天</SelectItem>
              <SelectItem value="30days">30天</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          多维度成本分析和流向可视化
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">暂无成本数据</p>
              <p className="text-sm">选择其他时间范围或检查API配置</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="treemap" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>层级占比</span>
              </TabsTrigger>
              <TabsTrigger value="pie" className="flex items-center space-x-2">
                <PieChart className="h-4 w-4" />
                <span>模型分布</span>
              </TabsTrigger>
              <TabsTrigger value="trend" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>趋势分析</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center space-x-2">
                <Table className="h-4 w-4" />
                <span>详细数据</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="treemap" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData as any[]}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={({ depth, x, y, width, height, index, name, size }) => (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={colors[index % colors.length]}
                          fillOpacity={depth === 1 ? 0.8 : 0.6}
                          stroke="#fff"
                          strokeWidth={2}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        {width > 50 && height > 30 && (
                          <text
                            x={x + width / 2}
                            y={y + height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={Math.min(width / 8, height / 3, 14)}
                            fontWeight="600"
                            className="select-none"
                          >
                            {name}
                          </text>
                        )}
                        {width > 80 && height > 50 && (
                          <text
                            x={x + width / 2}
                            y={y + height / 2 + 18}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={Math.min(width / 12, height / 4, 12)}
                            opacity={0.9}
                          >
                            {formatCurrency(size)}
                          </text>
                        )}
                      </g>
                    )}
                  />
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {treemapData.length}
                  </div>
                  <div className="text-muted-foreground">活跃API Keys</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {pieData.length}
                  </div>
                  <div className="text-muted-foreground">使用的模型</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.reduce((sum, d) => sum + d.value, 0))}
                  </div>
                  <div className="text-muted-foreground">总成本</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pie" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        {pieData.map((entry, index) => (
                          <linearGradient key={index} id={`pieGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={entry.fill} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={entry.fill} stopOpacity={1} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percentage }: any) => `${percentage.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">模型成本排行</h4>
                  {pieData.sort((a, b) => b.value - a.value).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(item.value)}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trend" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="cost" fill={colors[0]} name="成本" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-semibold mb-2">成本趋势</div>
                  <div className="text-2xl font-bold text-primary">
                    {trendData.length > 1 && (
                      (trendData[trendData.length - 1]?.cost ?? 0) > (trendData[trendData.length - 2]?.cost ?? 0) ? '↗️' : '↘️'
                    )}
                    {trendData.length > 1 &&
                      formatCurrency((trendData[trendData.length - 1]?.cost ?? 0) - (trendData[trendData.length - 2]?.cost ?? 0))
                    }
                  </div>
                  <div className="text-muted-foreground">较昨日</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-semibold mb-2">平均成本</div>
                  <div className="text-2xl font-bold text-primary">
                    {trendData.length > 0
                      ? formatCurrency(trendData.reduce((sum, d) => sum + d.cost, 0) / trendData.length)
                      : formatCurrency(0)
                    }
                  </div>
                  <div className="text-muted-foreground">每日平均</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="rounded-lg border">
                <div className="p-4 border-b">
                  <h4 className="font-semibold">详细成本明细</h4>
                  <p className="text-sm text-muted-foreground">API Key 和模型的成本分解</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">API Key</th>
                        <th className="text-left p-3">模型</th>
                        <th className="text-right p-3">请求数</th>
                        <th className="text-right p-3">Token数</th>
                        <th className="text-right p-3">成本</th>
                        <th className="text-right p-3">占比</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.sort((a, b) => b.cost - a.cost).map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="max-w-32 truncate" title={item.apiKey}>
                              {item.apiKey}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{item.model.replace('claude-3-5-', '').substring(0, 15)}</Badge>
                          </td>
                          <td className="text-right p-3">{formatNumber(item.requests)}</td>
                          <td className="text-right p-3">{formatNumber(item.tokens)}</td>
                          <td className="text-right p-3 font-medium">{formatCurrency(item.cost)}</td>
                          <td className="text-right p-3">{item.percentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}