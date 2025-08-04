import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { ModelPricingCard } from '@/components/pricing/ModelPricingCard';
import { ExchangeRateCard } from '@/components/pricing/ExchangeRateCard';
import { CostCalculator } from '@/components/pricing/CostCalculator';
import { apiService, type ModelPricing, type ExchangeRate } from '@/services/api';

export default function PricingPage() {
  const [modelPricing, setModelPricing] = useState<ModelPricing[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<'K' | 'M'>('M');
  const [targetCurrency, setTargetCurrency] = useState<string>('USD');
  const { showToast } = useToast();

  // 加载价格数据
  const loadPricingData = async () => {
    setLoading(true);
    try {
      const [models, rates] = await Promise.all([
        apiService.getModelPricing(),
        apiService.getExchangeRates()
      ]);

      setModelPricing(models || []);
      setExchangeRates(rates || []);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      showToast('无法加载价格配置数据', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 更新模型价格
  const updateModelPricing = async (model: ModelPricing) => {
    setSaving(true);
    try {
      await apiService.updateModelPricing(model);
      showToast(`模型 ${model.model} 的价格配置已更新`, 'success');
      loadPricingData(); // 重新加载数据
    } catch (error) {
      console.error('Failed to update model pricing:', error);
      showToast('无法更新模型价格配置', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 更新汇率
  const updateExchangeRate = async (fromCurrency: string, toCurrency: string, rate: number) => {
    setSaving(true);
    try {
      await apiService.updateExchangeRate(fromCurrency, toCurrency, rate);
      showToast(`${fromCurrency} -> ${toCurrency} 汇率已更新为 ${rate}`, 'success');
      loadPricingData(); // 重新加载数据
    } catch (error) {
      console.error('Failed to update exchange rate:', error);
      showToast('无法更新汇率配置', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 按平台分组模型
  const modelsByPlatform = modelPricing.reduce((acc, model) => {
    let platform = 'Other';
    if (model.model.startsWith('claude')) platform = 'Claude';
    else if (model.model.startsWith('gpt')) platform = 'OpenAI';
    else if (model.model.startsWith('kimi')) platform = 'Kimi';
    
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(model);
    return acc;
  }, {} as Record<string, ModelPricing[]>);

  // 获取汇率
  const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;
    const rate = exchangeRates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
    return rate ? rate.rate : 1;
  };

  // 单位切换处理
  const handleUnitToggle = () => {
    setDisplayUnit(prev => prev === 'K' ? 'M' : 'K');
  };

  // 货币切换处理
  const handleCurrencyToggle = () => {
    setTargetCurrency(prev => prev === 'USD' ? 'CNY' : 'USD');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">价格管理</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadPricingData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">模型价格</TabsTrigger>
          <TabsTrigger value="exchange">汇率管理</TabsTrigger>
          <TabsTrigger value="calculator">费用计算器</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>模型价格配置</span>
              </CardTitle>
              <CardDescription>
                管理不同AI模型的价格配置，支持多货币定价
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {Object.entries(modelsByPlatform).map(([platform, models]) => (
                  <div key={platform} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{platform}</h3>
                      <Badge variant="secondary">{models.length} 个模型</Badge>
                    </div>
                    <div className="grid gap-4">
                      {models.map((model) => (
                        <ModelPricingCard
                          key={model.model}
                          model={model}
                          onUpdate={updateModelPricing}
                          saving={saving}
                          displayUnit={displayUnit}
                          onUnitToggle={handleUnitToggle}
                          targetCurrency={targetCurrency}
                          onCurrencyToggle={handleCurrencyToggle}
                          exchangeRate={getExchangeRate(model.currency, targetCurrency)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exchange" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>汇率管理</span>
              </CardTitle>
              <CardDescription>
                管理货币汇率，支持自动价格转换
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {exchangeRates.map((rate) => (
                  <ExchangeRateCard
                    key={`${rate.fromCurrency}-${rate.toCurrency}`}
                    rate={rate}
                    onUpdate={updateExchangeRate}
                    saving={saving}
                  />
                ))}
              </div>
              <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">汇率说明</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• 汇率用于将不同货币的价格转换为统一显示货币</li>
                      <li>• 建议定期更新汇率以确保价格计算准确</li>
                      <li>• 系统默认以USD作为显示货币</li>
                      <li>• Kimi模型的CNY价格会自动转换为USD显示</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>费用计算器</span>
              </CardTitle>
              <CardDescription>
                预览不同模型和token用量的费用计算
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostCalculator modelPricing={modelPricing} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}