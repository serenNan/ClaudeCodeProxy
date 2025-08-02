import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Zap, Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { apiService, type DashboardResponse } from '@/services/api';

interface RealTimePerformanceChartProps {
  className?: string;
}

interface PerformanceDataPoint {
  time: string;
  rpm: number;
  tpm: number;
  timestamp: number;
}

const MAX_DATA_POINTS = 30; // 保留最近30个数据点

export default function RealTimePerformanceChart({ className }: RealTimePerformanceChartProps) {
  const [data, setData] = useState<PerformanceDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5秒
  const [currentRPM, setCurrentRPM] = useState(0);
  const [currentTPM, setCurrentTPM] = useState(0);
  const [avgRPM, setAvgRPM] = useState(0);
  const [avgTPM, setAvgTPM] = useState(0);
  const [maxRPM, setMaxRPM] = useState(0);
  const [maxTPM, setMaxTPM] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPerformanceData = async () => {
    try {
      const dashboardData: DashboardResponse = await apiService.getDashboardData();
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      const newDataPoint: PerformanceDataPoint = {
        time: timeStr,
        rpm: dashboardData.realtimeRPM,
        tpm: dashboardData.realtimeTPM,
        timestamp: now.getTime()
      };

      setData(prevData => {
        const newData = [...prevData, newDataPoint];
        // 只保留最近的数据点
        if (newData.length > MAX_DATA_POINTS) {
          return newData.slice(-MAX_DATA_POINTS);
        }
        return newData;
      });

      // 更新当前值
      setCurrentRPM(dashboardData.realtimeRPM);
      setCurrentTPM(dashboardData.realtimeTPM);

      // 计算统计值
      setData(currentData => {
        if (currentData.length > 0) {
          const rpms = currentData.map(d => d.rpm);
          const tpms = currentData.map(d => d.tpm);

          setAvgRPM(rpms.reduce((sum, val) => sum + val, 0) / rpms.length);
          setAvgTPM(tpms.reduce((sum, val) => sum + val, 0) / tpms.length);
          setMaxRPM(Math.max(...rpms));
          setMaxTPM(Math.max(...tpms));
        }
        return currentData;
      });
    } catch (error) {
      console.error('获取性能数据失败:', error);
    }
  };

  useEffect(() => {
    if (isRunning) {
      fetchPerformanceData(); // 立即获取一次数据
      intervalRef.current = setInterval(fetchPerformanceData, refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, refreshInterval]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const clearData = () => {
    setData([]);
    setCurrentRPM(0);
    setCurrentTPM(0);
    setAvgRPM(0);
    setAvgTPM(0);
    setMaxRPM(0);
    setMaxTPM(0);
  };

  const formatValue = (value: number, decimals = 1) => {
    return value.toFixed(decimals);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 计算Y轴范围
  const maxY = Math.max(
    Math.max(...data.map(d => d.rpm), 0),
    Math.max(...data.map(d => d.tpm), 0)
  );
  const yAxisMax = maxY > 0 ? Math.ceil(maxY * 1.2) : 10;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle>实时性能监控</CardTitle>
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={refreshInterval.toString()}
              onValueChange={(value) => setRefreshInterval(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1秒</SelectItem>
                <SelectItem value="3000">3秒</SelectItem>
                <SelectItem value="5000">5秒</SelectItem>
                <SelectItem value="10000">10秒</SelectItem>
                <SelectItem value="30000">30秒</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={toggleRunning}>
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="sm" onClick={clearData}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          RPM (每分钟请求数) 和 TPM (每分钟Token数) 实时监控
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 实时指标卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">当前 RPM</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{formatValue(currentRPM)}</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">当前 TPM</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{formatValue(currentTPM, 0)}</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-600 font-medium">平均 RPM</span>
            </div>
            <div className="text-lg font-semibold text-purple-700">{formatValue(avgRPM)}</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">平均 TPM</span>
            </div>
            <div className="text-lg font-semibold text-orange-700">{formatValue(avgTPM, 0)}</div>
          </div>
        </div>

        {/* 实时图表 */}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              fontSize={12}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis
              fontSize={12}
              domain={[0, yAxisMax]}
              tickFormatter={(value) => formatValue(value, 0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* RPM 折线 */}
            <Line
              type="monotone"
              dataKey="rpm"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              name="RPM"
              connectNulls={false}
            />

            {/* TPM 折线 */}
            <Line
              type="monotone"
              dataKey="tpm"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              name="TPM"
              connectNulls={false}
            />

            {/* 平均线参考 */}
            {avgRPM > 0 && (
              <ReferenceLine
                y={avgRPM}
                stroke="#3B82F6"
                strokeDasharray="5 5"
                label={{ value: `平均RPM: ${formatValue(avgRPM)}`, position: 'top' }}
              />
            )}

            {avgTPM > 0 && (
              <ReferenceLine
                y={avgTPM}
                stroke="#10B981"
                strokeDasharray="5 5"
                label={{ value: `平均TPM: ${formatValue(avgTPM, 0)}`, position: 'bottom' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* 状态信息 */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>刷新间隔: {refreshInterval / 1000}秒</span>
            </span>
            <span>数据点: {data.length}/{MAX_DATA_POINTS}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>峰值RPM: {formatValue(maxRPM)}</span>
            <span>峰值TPM: {formatValue(maxTPM, 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}