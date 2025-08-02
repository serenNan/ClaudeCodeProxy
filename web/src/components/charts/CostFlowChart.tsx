import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ArrowRight } from 'lucide-react';
import { apiService, type DateFilterRequest } from '@/services/api';

interface FlowData {
  source: string;
  target: string;
  value: number;
  formattedValue: string;
  color: string;
}

interface CostFlowChartProps {
  className?: string;
}

export default function CostFlowChart({ className }: CostFlowChartProps) {
  const [data, setData] = useState<FlowData[]>([]);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);

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
          const colors = ['oklch(0.75 0.04 0)', 'oklch(0.65 0.06 0)', 'oklch(0.55 0.08 0)', 'oklch(0.45 0.10 0)', 'oklch(0.35 0.12 0)'];

          // 为每个API Key分配颜色
          const apiKeyColors = new Map<string, string>();
          let colorIndex = 0;

          rawFlowData.forEach(item => {
            if (!apiKeyColors.has(item.apiKeyId)) {
              apiKeyColors.set(item.apiKeyId, colors[colorIndex % colors.length]);
              colorIndex++;
            }
            
            // 只显示成本大于$0.01的流向
            if (item.cost > 0.01) {
              // 改进API Key名称显示逻辑
              let displayName = item.apiKeyName;
              
              // 如果名称太长，智能截断
              if (displayName.length > 15) {
                // 优先保留前缀和后缀的重要信息
                if (displayName.includes('-')) {
                  const parts = displayName.split('-');
                  if (parts.length >= 2) {
                    displayName = `${parts[0]}-...${parts[parts.length - 1]}`;
                  } else {
                    displayName = displayName.substring(0, 12) + '...';
                  }
                } else {
                  displayName = displayName.substring(0, 12) + '...';
                }
              }
              
              // 改进模型名称显示
              let modelName = item.model
                .replace('claude-3-5-', '')
                .replace('claude-3-', '')
                .replace('claude-', '')
                .replace('anthropic/', '')
                .replace('gpt-4o-', 'gpt4o-')
                .replace('gpt-4-', 'gpt4-')
                .replace('gpt-3.5-', 'gpt3.5-');
              
              // 限制模型名称长度
              if (modelName.length > 12) {
                modelName = modelName.substring(0, 10) + '..';
              }
              
              flowData.push({
                source: displayName,
                target: modelName,
                value: item.cost,
                formattedValue: `$${item.cost.toFixed(2)}`,
                color: apiKeyColors.get(item.apiKeyId) || colors[0]
              });
            }
          });
          
          setData(flowData);
        } else {
          // 如果没有数据，设置为空数组
          setData([]);
        }
      } catch (error) {
        console.error('获取流向数据失败:', error);
        // 发生错误时也设置为空数组
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // 计算节点位置和大小
  const getNodeData = () => {
    const sources = [...new Set(data.map(d => d.source))];
    const targets = [...new Set(data.map(d => d.target))];
    
    const sourceValues = sources.map(source => ({
      name: source,
      value: data.filter(d => d.source === source).reduce((sum, d) => sum + d.value, 0),
      type: 'source'
    }));
    
    const targetValues = targets.map(target => ({
      name: target,
      value: data.filter(d => d.target === target).reduce((sum, d) => sum + d.value, 0),
      type: 'target'
    }));
    
    return { sources: sourceValues, targets: targetValues };
  };

  const { sources, targets } = getNodeData();
  const maxValue = Math.max(...sources.map(s => s.value), ...targets.map(t => t.value));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>成本流向分析</CardTitle>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-24">
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
          API Keys到模型的费用分布流向图
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
          </div>
        ) : (
          <div className="h-96 relative overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 900 400" className="bg-card">
              {/* 定义渐变 */}
              <defs>
                {data.map((flow, index) => (
                  <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={flow.color} stopOpacity={0.9} />
                    <stop offset="50%" stopColor={flow.color} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={flow.color} stopOpacity={0.3} />
                  </linearGradient>
                ))}
                
                {/* 阴影滤镜 */}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1"/>
                </filter>
                
                {/* 箭头标记 */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="oklch(0.48 0.012 0)" opacity="0.6" />
                  </marker>
                </defs>
              </defs>
              
              {/* 背景网格 */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.22 0.006 0)" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* 左侧节点 (API Keys) */}
              {sources.map((source, index) => {
                const maxHeight = 280;
                const minHeight = 40;
                const height = Math.max(minHeight, (source.value / maxValue) * maxHeight);
                const spacing = Math.min(100, (400 - 80) / Math.max(1, sources.length - 1));
                const y = 60 + index * spacing;
                
                return (
                  <g key={source.name}>
                    {/* 节点背景 */}
                    <rect
                      x={40}
                      y={y}
                      width={140}
                      height={height}
                      fill="url(#gradient-source)"
                      rx={8}
                      filter="url(#shadow)"
                      className="transition-all duration-300 hover:opacity-90"
                    />
                    
                    {/* 渐变定义 */}
                    <defs>
                      <linearGradient id="gradient-source" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.75 0.04 0)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="oklch(0.65 0.06 0)" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    
                    {/* 主标题 */}
                    <text
                      x={110}
                      y={y + height / 2 - 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="600"
                      className="select-none"
                    >
                      {source.name.replace('API-Key-', 'Key-').length > 15 
                        ? source.name.replace('API-Key-', 'Key-').substring(0, 12) + '...'
                        : source.name.replace('API-Key-', 'Key-')
                      }
                    </text>
                    
                    {/* 费用标签 */}
                    <text
                      x={110}
                      y={y + height / 2 + 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="500"
                      opacity="0.9"
                    >
                      ${source.value.toFixed(2)}
                    </text>
                    
                    {/* 连接点 */}
                    <circle
                      cx={180}
                      cy={y + height / 2}
                      r={4}
                      fill="oklch(0.75 0.04 0)"
                      stroke="white"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
              
              {/* 右侧节点 (Models) */}
              {targets.map((target, index) => {
                const maxHeight = 280;
                const minHeight = 40;
                const height = Math.max(minHeight, (target.value / maxValue) * maxHeight);
                const spacing = Math.min(100, (400 - 80) / Math.max(1, targets.length - 1));
                const y = 60 + index * spacing;
                
                return (
                  <g key={target.name}>
                    {/* 节点背景 */}
                    <rect
                      x={720}
                      y={y}
                      width={140}
                      height={height}
                      fill="url(#gradient-target)"
                      rx={8}
                      filter="url(#shadow)"
                      className="transition-all duration-300 hover:opacity-90"
                    />
                    
                    {/* 渐变定义 */}
                    <defs>
                      <linearGradient id="gradient-target" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="oklch(0.65 0.06 0)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="oklch(0.55 0.08 0)" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    
                    {/* 主标题 */}
                    <text
                      x={790}
                      y={y + height / 2 - 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="600"
                      className="select-none"
                    >
                      {target.name.replace('claude-3-', '').replace('claude-', '').length > 12
                        ? target.name.replace('claude-3-', '').replace('claude-', '').substring(0, 10) + '...'
                        : target.name.replace('claude-3-', '').replace('claude-', '')
                      }
                    </text>
                    
                    {/* 费用标签 */}
                    <text
                      x={790}
                      y={y + height / 2 + 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="500"
                      opacity="0.9"
                    >
                      ${target.value.toFixed(2)}
                    </text>
                    
                    {/* 连接点 */}
                    <circle
                      cx={720}
                      cy={y + height / 2}
                      r={4}
                      fill="oklch(0.65 0.06 0)"
                      stroke="white"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
              
              {/* 流向线条 */}
              {data.map((flow, flowIndex) => {
                const sourceIndex = sources.findIndex(s => s.name === flow.source);
                const targetIndex = targets.findIndex(t => t.name === flow.target);
                
                if (sourceIndex === -1 || targetIndex === -1) return null;
                
                const sourceSpacing = Math.min(100, (400 - 80) / Math.max(1, sources.length - 1));
                const targetSpacing = Math.min(100, (400 - 80) / Math.max(1, targets.length - 1));
                
                const sourceHeight = Math.max(40, (sources[sourceIndex].value / maxValue) * 280);
                const targetHeight = Math.max(40, (targets[targetIndex].value / maxValue) * 280);
                
                const sourceY = 60 + sourceIndex * sourceSpacing + sourceHeight / 2;
                const targetY = 60 + targetIndex * targetSpacing + targetHeight / 2;
                
                const strokeWidth = Math.max(2, Math.min(20, (flow.value / maxValue) * 25));
                
                const path = `M 180 ${sourceY} C 350 ${sourceY} 550 ${targetY} 720 ${targetY}`;
                
                return (
                  <g key={flowIndex}>
                    {/* 流向路径 */}
                    <path
                      d={path}
                      stroke={`url(#gradient-${flowIndex})`}
                      strokeWidth={strokeWidth}
                      fill="none"
                      opacity={0.7}
                      className="transition-all duration-300 hover:opacity-90"
                      markerEnd="url(#arrowhead)"
                    />
                    
                    {/* 流向值标签 */}
                    {flow.value > 5 && (
                      <g>
                        {/* 标签背景 */}
                        <rect
                          x={430}
                          y={(sourceY + targetY) / 2 - 12}
                          width={40}
                          height={20}
                          fill="white"
                          rx={10}
                          opacity={0.9}
                          filter="url(#shadow)"
                        />
                        {/* 标签文本 */}
                        <text
                          x={450}
                          y={(sourceY + targetY) / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="oklch(0.48 0.012 0)"
                          fontSize="9"
                          fontWeight="600"
                        >
                          {flow.formattedValue}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              
              {/* 标题区域 */}
              <g>
                {/* 左侧标题背景 */}
                <rect x={70} y={15} width={80} height={25} fill="white" rx={12} opacity={0.9} filter="url(#shadow)" />
                <text x={110} y={30} textAnchor="middle" fill="oklch(0.48 0.012 0)" fontSize="13" fontWeight="700">
                  API Keys
                </text>
                
                {/* 右侧标题背景 */}
                <rect x={750} y={15} width={80} height={25} fill="white" rx={12} opacity={0.9} filter="url(#shadow)" />
                <text x={790} y={30} textAnchor="middle" fill="oklch(0.48 0.012 0)" fontSize="13" fontWeight="700">
                  模型
                </text>
                
                {/* 中央箭头 */}
                <g transform="translate(430, 25)">
                  <circle cx="20" cy="5" r="15" fill="white" opacity={0.9} filter="url(#shadow)" />
                  <path d="M 12 5 L 20 1 L 20 3 L 26 3 L 26 7 L 20 7 L 20 9 Z" fill="oklch(0.48 0.012 0)" />
                </g>
              </g>
            </svg>
            
            {/* 统计信息面板 */}
            <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 rounded-b-lg backdrop-blur-sm">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="group hover:bg-muted p-2 rounded-lg transition-colors">
                  <div className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                    {sources.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">活跃API Keys</div>
                </div>
                <div className="group hover:bg-muted p-2 rounded-lg transition-colors">
                  <div className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                    {targets.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">使用的模型</div>
                </div>
                <div className="group hover:bg-muted p-2 rounded-lg transition-colors">
                  <div className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                    ${data.reduce((sum, d) => sum + d.value, 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">总费用</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}