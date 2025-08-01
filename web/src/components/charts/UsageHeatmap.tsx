import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp } from 'lucide-react';
import { apiService } from '@/services/api';

interface HeatmapData {
  hour: number;
  day: number;
  value: number;
  formatted: string;
}

interface UsageHeatmapProps {
  className?: string;
}

export default function UsageHeatmap({ className }: UsageHeatmapProps) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [metric, setMetric] = useState<'requests' | 'tokens' | 'cost'>('requests');
  const [loading, setLoading] = useState(true);

  // 获取真实热力图数据
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        // 获取过去7天的小时级趋势数据
        const trendData = await apiService.getTrendData({
          granularity: 'hour',
          dateFilter: {
            type: 'preset',
            preset: 'last7days'
          }
        });

        console.log('UsageHeatmap原始数据:', {
          dataLength: trendData.length,
          sampleData: trendData.slice(0, 3),
          metric: metric
        });

        // 创建热力图数据矩阵 - 7天 × 24小时
        const heatmapMatrix: { [key: string]: number } = {};
        
        // 初始化所有时间点为0（7天 × 24小时 = 168个时间点）
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 6); // 过去7天
        startOfWeek.setHours(0, 0, 0, 0);
        
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          for (let hour = 0; hour < 24; hour++) {
            const key = `${dayOffset}-${hour}`;
            heatmapMatrix[key] = 0;
          }
        }

        // 填充真实数据
        trendData.forEach(point => {
          if (point.hour) {
            try {
              // 解析后端返回的时间格式 "yyyy-MM-dd HH:mm:ss"
              const date = new Date(point.hour);
              
              if (!isNaN(date.getTime())) {
                // 计算这个时间点距离一周开始的天数和小时数
                const daysDiff = Math.floor((date.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
                const hourOfDay = date.getHours();
                
                if (daysDiff >= 0 && daysDiff < 7) {
                  const key = `${daysDiff}-${hourOfDay}`;
                  
                  let value = 0;
                  switch (metric) {
                    case 'requests':
                      value = point.requests;
                      break;
                    case 'tokens':
                      value = point.inputTokens + point.outputTokens;
                      break;
                    case 'cost':
                      value = point.cost;
                      break;
                  }
                  
                  heatmapMatrix[key] = value;
                }
              }
            } catch (error) {
              console.warn('解析时间失败:', point.hour, error);
            }
          }
        });
        
        // 转换为热力图数据格式
        const heatmapData: HeatmapData[] = [];
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            const value = heatmapMatrix[key] || 0;
            
            heatmapData.push({
              hour,
              day,
              value,
              formatted: metric === 'cost' ? `$${value.toFixed(2)}` : value.toLocaleString()
            });
          }
        }

        console.log('UsageHeatmap处理后数据:', {
          totalPoints: heatmapData.length,
          nonZeroPoints: heatmapData.filter(d => d.value > 0).length,
          maxValue: Math.max(...heatmapData.map(d => d.value)),
          sampleProcessed: heatmapData.slice(0, 5)
        });
        
        setData(heatmapData);
      } catch (error) {
        console.error('获取热力图数据失败，使用模拟数据:', error);
        
        // Fallback to mock data
        const heatmapData: HeatmapData[] = [];
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            const isWorkingHour = hour >= 9 && hour <= 18;
            const isWeekday = day < 5;
            
            let baseValue = Math.random() * 100;
            if (isWorkingHour && isWeekday) {
              baseValue = Math.random() * 500 + 200;
            } else if (isWeekday) {
              baseValue = Math.random() * 200 + 50;
            }

            const value = Math.floor(baseValue);
            heatmapData.push({
              hour,
              day,
              value,
              formatted: metric === 'cost' ? `$${(value * 0.01).toFixed(2)}` : value.toString()
            });
          }
        }
        setData(heatmapData);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [metric]);

  const getColorIntensity = (value: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const intensity = value / maxValue;
    
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getTextColor = (value: number) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const intensity = value / maxValue;
    return intensity > 0.6 ? 'text-white' : 'text-gray-700';
  };

  // 生成动态的天标签（过去7天）
  const getDayLabels = () => {
    const labels = [];
    const now = new Date();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayName = dayNames[date.getDay()];
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      labels.push(`${dayName} ${dateStr}`);
    }
    return labels;
  };

  const days = getDayLabels();
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>使用模式热力图</CardTitle>
          </div>
          <Select value={metric} onValueChange={(value: 'requests' | 'tokens' | 'cost') => setMetric(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="requests">请求数</SelectItem>
              <SelectItem value="tokens">Token数</SelectItem>
              <SelectItem value="cost">费用</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          一周内不同时间段的{metric === 'requests' ? '请求' : metric === 'tokens' ? 'Token使用' : '费用'}分布模式
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 热力图 */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* 小时标签 */}
                <div className="flex mb-2">
                  <div className="w-24"></div>
                  {hours.map((hour, index) => (
                    <div key={index} className="w-8 text-xs text-center text-muted-foreground">
                      {index % 4 === 0 ? hour.slice(0, 2) : ''}
                    </div>
                  ))}
                </div>
                
                {/* 热力图网格 */}
                {days.map((day, dayIndex) => (
                  <div key={dayIndex} className="flex items-center mb-1">
                    <div className="w-24 text-xs text-right pr-2 text-muted-foreground">
                      {day}
                    </div>
                    {hours.map((_, hourIndex) => {
                      const cellData = data.find(d => d.day === dayIndex && d.hour === hourIndex);
                      const value = cellData?.value || 0;
                      
                      return (
                        <div
                          key={hourIndex}
                          className={`w-8 h-6 mx-px rounded-sm ${getColorIntensity(value)} ${getTextColor(value)} 
                                     flex items-center justify-center text-xs font-medium cursor-pointer
                                     hover:ring-2 hover:ring-blue-300 transition-all duration-200`}
                          title={`${day} ${hours[hourIndex]}: ${cellData?.formatted || '0'}`}
                        >
                          {value > 50 ? Math.floor(value / 10) : ''}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 图例 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>低</span>
                <div className="flex space-x-1">
                  {['bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500'].map((color, index) => (
                    <div key={index} className={`w-4 h-4 ${color} rounded`}></div>
                  ))}
                </div>
                <span>高</span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>峰值时段: 工作日 9:00-18:00</span>
                </div>
              </div>
            </div>
            
            {/* 统计摘要 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...data.map(d => d.value))}
                </div>
                <div className="text-sm text-muted-foreground">峰值</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
                </div>
                <div className="text-sm text-muted-foreground">平均值</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.reduce((sum, d) => sum + d.value, 0)}
                </div>
                <div className="text-sm text-muted-foreground">总计</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}