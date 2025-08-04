import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { type ModelPricing, type PricingResult } from '@/services/api';

interface CostCalculatorProps {
  modelPricing: ModelPricing[];
}

export function CostCalculator({ modelPricing }: CostCalculatorProps) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [inputTokens, setInputTokens] = useState<number>(1000);
  const [outputTokens, setOutputTokens] = useState<number>(500);
  const [cacheCreateTokens, setCacheCreateTokens] = useState<number>(0);
  const [cacheReadTokens, setCacheReadTokens] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const { showToast } = useToast();

  const handleCalculate = async () => {
    if (!selectedModel) {
      showToast('请先选择要计算费用的模型', 'error');
      return;
    }

    const selectedModelData = modelPricing.find(m => m.model === selectedModel);
    if (!selectedModelData) {
      showToast('找不到模型定价数据', 'error');
      return;
    }

    setCalculating(true);
    try {
      // 前端计算各项费用
      const inputCost = inputTokens * selectedModelData.inputPrice;
      const outputCost = outputTokens * selectedModelData.outputPrice;
      const cacheCreateCost = cacheCreateTokens * selectedModelData.cacheWritePrice;
      const cacheReadCost = cacheReadTokens * selectedModelData.cacheReadPrice;
      const totalCost = inputCost + outputCost + cacheCreateCost + cacheReadCost;
      const totalTokens = inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens;
      const unitPrice = totalTokens > 0 ? totalCost / totalTokens : 0;

      // 创建详细的结果对象
      const calculatedResult = {
        model: selectedModel,
        currency: selectedModelData.currency,
        inputCost,
        outputCost,
        cacheCreateCost,
        cacheReadCost,
        totalCost,
        weightedTokens: totalTokens,
        unitPrice
      };

      setResult(calculatedResult);
    } catch (error) {
      console.error('Failed to calculate cost:', error);
      showToast('无法计算费用，请重试', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'CNY': return '¥';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  const selectedModelData = modelPricing.find(m => m.model === selectedModel);

  // 实时计算功能
  const calculateRealTime = () => {
    if (!selectedModelData) return null;
    
    const inputCost = inputTokens * selectedModelData.inputPrice;
    const outputCost = outputTokens * selectedModelData.outputPrice;
    const cacheCreateCost = cacheCreateTokens * selectedModelData.cacheWritePrice;
    const cacheReadCost = cacheReadTokens * selectedModelData.cacheReadPrice;
    const totalCost = inputCost + outputCost + cacheCreateCost + cacheReadCost;
    const totalTokens = inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens;
    const unitPrice = totalTokens > 0 ? totalCost / totalTokens : 0;

    return {
      model: selectedModel,
      currency: selectedModelData.currency,
      inputCost,
      outputCost,
      cacheCreateCost,
      cacheReadCost,
      totalCost,
      weightedTokens: totalTokens,
      unitPrice
    };
  };

  const realtimeResult = calculateRealTime();

  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">输入参数</CardTitle>
            <CardDescription>
              设置token使用量和模型进行费用预览
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model-select">选择模型</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelPricing.map((model) => (
                      <SelectItem key={model.model} value={model.model}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.model}</span>
                          <Badge variant="secondary" className="ml-2">
                            {model.currency}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModelData && (
                  <div className="text-xs text-muted-foreground">
                    {selectedModelData.description}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-tokens">输入 Tokens</Label>
                <Input
                  id="input-tokens"
                  type="number"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output-tokens">输出 Tokens</Label>
                <Input
                  id="output-tokens"
                  type="number"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-create-tokens">缓存创建 Tokens</Label>
                <Input
                  id="cache-create-tokens"
                  type="number"
                  value={cacheCreateTokens}
                  onChange={(e) => setCacheCreateTokens(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={!selectedModelData?.cacheWritePrice}
                />
                {selectedModelData && !selectedModelData.cacheWritePrice && (
                  <div className="text-xs text-muted-foreground">
                    该模型不支持缓存功能
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-read-tokens">缓存读取 Tokens</Label>
                <Input
                  id="cache-read-tokens"
                  type="number"
                  value={cacheReadTokens}
                  onChange={(e) => setCacheReadTokens(parseInt(e.target.value) || 0)}
                  min="0"
                  disabled={!selectedModelData?.cacheReadPrice}
                />
              </div>

              {realtimeResult && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">预计费用:</span>
                    <span className="text-lg font-bold text-primary">
                      {getCurrencySymbol(realtimeResult.currency)}{realtimeResult.totalCost.toFixed(6)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    总计 {realtimeResult.weightedTokens.toLocaleString()} tokens | 
                    平均 {getCurrencySymbol(realtimeResult.currency)}{(realtimeResult.unitPrice * 1000).toFixed(6)}/1K tokens
                  </div>
                </div>
              )}

              <div className="flex items-end">
                <Button onClick={handleCalculate} disabled={calculating} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  {calculating ? '计算中...' : '详细计算'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 结果区域 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>费用详情</span>
            </CardTitle>
            <CardDescription>
              模型: {result.model} | 货币: {result.currency}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">输入费用</Label>
                  <div className="text-lg font-semibold">
                    {getCurrencySymbol(result.currency)}{result.inputCost.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {inputTokens.toLocaleString()} tokens
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">输出费用</Label>
                  <div className="text-lg font-semibold">
                    {getCurrencySymbol(result.currency)}{result.outputCost.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {outputTokens.toLocaleString()} tokens
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">缓存创建费用</Label>
                  <div className="text-lg font-semibold">
                    {getCurrencySymbol(result.currency)}{result.cacheCreateCost.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cacheCreateTokens.toLocaleString()} tokens
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">缓存读取费用</Label>
                  <div className="text-lg font-semibold">
                    {getCurrencySymbol(result.currency)}{result.cacheReadCost.toFixed(6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cacheReadTokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">总费用</Label>
                  <div className="text-2xl font-bold text-primary">
                    {getCurrencySymbol(result.currency)}{result.totalCost.toFixed(6)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  总计 {(inputTokens + outputTokens + cacheCreateTokens + cacheReadTokens).toLocaleString()} tokens
                </div>
              </div>

              {/* 成本分解 */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">费用构成</Label>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>输入费用占比:</span>
                    <span>{result.totalCost > 0 ? ((result.inputCost / result.totalCost) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>输出费用占比:</span>
                    <span>{result.totalCost > 0 ? ((result.outputCost / result.totalCost) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                  {result.cacheCreateCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>缓存创建占比:</span>
                      <span>{result.totalCost > 0 ? ((result.cacheCreateCost / result.totalCost) * 100).toFixed(1) : '0.0'}%</span>
                    </div>
                  )}
                  {result.cacheReadCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>缓存读取占比:</span>
                      <span>{result.totalCost > 0 ? ((result.cacheReadCost / result.totalCost) * 100).toFixed(1) : '0.0'}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}