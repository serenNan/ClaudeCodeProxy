import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react';

interface ModelPricing {
  model: string;
  inputPrice: number;
  outputPrice: number;
  cacheWritePrice: number;
  cacheReadPrice: number;
  currency: string;
  description?: string;
}

interface ModelPricingCardProps {
  model: ModelPricing;
  onUpdate: (model: ModelPricing) => Promise<void>;
  saving: boolean;
  displayUnit?: 'K' | 'M';
  onUnitToggle?: () => void;
  targetCurrency?: string;
  onCurrencyToggle?: () => void;
  exchangeRate?: number;
}

export function ModelPricingCard({ 
  model, 
  onUpdate, 
  saving, 
  displayUnit = 'M',
  onUnitToggle,
  targetCurrency = 'USD',
  onCurrencyToggle,
  exchangeRate = 1
}: ModelPricingCardProps) {
  const [editing, setEditing] = useState(false);
  const [editedModel, setEditedModel] = useState<ModelPricing>({ ...model });

  const handleEdit = () => {
    setEditedModel({ ...model });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditedModel({ ...model });
    setEditing(false);
  };

  const handleSave = async () => {
    await onUpdate(editedModel);
    setEditing(false);
  };

  const updateField = (field: keyof ModelPricing, value: string | number) => {
    setEditedModel(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'CNY': return '¥';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price == null || isNaN(price) || typeof price !== 'number') return '0.00';
    if (price === 0) return '0.00';
    if (price >= 0.01) return price.toFixed(2);
    if (price >= 0.001) return price.toFixed(3);
    if (price >= 0.0001) return price.toFixed(4);
    if (price >= 0.00001) return price.toFixed(5);
    return price.toFixed(6);
  };

  // 获取显示价格（处理单位转换和货币转换）
  const getDisplayPrice = (price: number) => {
    // 首先进行货币转换
    const convertedPrice = price * exchangeRate;
    
    // 然后进行单位转换
    const unitMultiplier = displayUnit === 'K' ? 1000 : 1000000;
    return convertedPrice * unitMultiplier;
  };

  const getPlatformColor = (modelName: string) => {
    if (modelName.startsWith('claude')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (modelName.startsWith('gpt')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (modelName.startsWith('kimi')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{model.model}</CardTitle>
            {model.description && (
              <CardDescription>{model.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getPlatformColor(model.model)}>
              {model.currency}
            </Badge>
            {!editing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                disabled={saving}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>输入价格 (每1K tokens)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {getCurrencySymbol(editedModel.currency)}
                  </span>
                  <Input
                    type="number"
                    step="0.00001"
                    value={editedModel.inputPrice * 1000}
                    onChange={(e) => updateField('inputPrice', (parseFloat(e.target.value) || 0) / 1000)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>输出价格 (每1K tokens)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {getCurrencySymbol(editedModel.currency)}
                  </span>
                  <Input
                    type="number"
                    step="0.00001"
                    value={editedModel.outputPrice * 1000}
                    onChange={(e) => updateField('outputPrice', (parseFloat(e.target.value) || 0) / 1000)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>缓存创建价格 (每1K tokens)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {getCurrencySymbol(editedModel.currency)}
                  </span>
                  <Input
                    type="number"
                    step="0.00001"
                    value={editedModel.cacheWritePrice * 1000}
                    onChange={(e) => updateField('cacheWritePrice', (parseFloat(e.target.value) || 0) / 1000)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>缓存读取价格 (每1K tokens)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {getCurrencySymbol(editedModel.currency)}
                  </span>
                  <Input
                    type="number"
                    step="0.00001"
                    value={editedModel.cacheReadPrice * 1000}
                    onChange={(e) => updateField('cacheReadPrice', (parseFloat(e.target.value) || 0) / 1000)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={editedModel.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="模型描述（可选）"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 切换按钮区域 */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-4">
                {/* 单位切换按钮 */}
                {onUnitToggle && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">单位:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onUnitToggle}
                      className="h-7 px-3"
                    >
                      {displayUnit === 'K' ? (
                        <><ToggleLeft className="h-3 w-3 mr-1" />1K</>
                      ) : (
                        <><ToggleRight className="h-3 w-3 mr-1" />1M</>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* 货币切换按钮 */}
                {onCurrencyToggle && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">货币:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCurrencyToggle}
                      className="h-7 px-3"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {targetCurrency}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* 汇率显示 */}
              {targetCurrency !== model.currency && exchangeRate !== 1 && (
                <div className="text-xs text-muted-foreground">
                  汇率: {model.currency} → {targetCurrency} = {exchangeRate.toFixed(4)}
                </div>
              )}
            </div>
            
            {/* 价格显示区域 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">输入价格</Label>
                <div className="text-sm font-medium">
                  {getCurrencySymbol(targetCurrency)}{formatPrice(getDisplayPrice(model.inputPrice))}/${displayUnit}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">输出价格</Label>
                <div className="text-sm font-medium">
                  {getCurrencySymbol(targetCurrency)}{formatPrice(getDisplayPrice(model.outputPrice))}/${displayUnit}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">缓存创建</Label>
                <div className="text-sm font-medium">
                  {model.cacheWritePrice > 0 
                    ? `${getCurrencySymbol(targetCurrency)}${formatPrice(getDisplayPrice(model.cacheWritePrice))}/${displayUnit}`
                    : '不支持'
                  }
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">缓存读取</Label>
                <div className="text-sm font-medium">
                  {model.cacheReadPrice > 0 
                    ? `${getCurrencySymbol(targetCurrency)}${formatPrice(getDisplayPrice(model.cacheReadPrice))}/${displayUnit}`
                    : '不支持'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}