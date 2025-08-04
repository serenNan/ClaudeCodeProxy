import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, ArrowRight } from 'lucide-react';

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

interface ExchangeRateCardProps {
  rate: ExchangeRate;
  onUpdate: (fromCurrency: string, toCurrency: string, rate: number) => Promise<void>;
  saving: boolean;
}

export function ExchangeRateCard({ rate, onUpdate, saving }: ExchangeRateCardProps) {
  const [editing, setEditing] = useState(false);
  const [editedRate, setEditedRate] = useState(rate.rate);

  const handleEdit = () => {
    setEditedRate(rate.rate);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditedRate(rate.rate);
    setEditing(false);
  };

  const handleSave = async () => {
    await onUpdate(rate.fromCurrency, rate.toCurrency, editedRate);
    setEditing(false);
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'CNY': return '¥';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{rate.fromCurrency}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{rate.toCurrency}</Badge>
            </div>
            
            {editing ? (
              <div className="flex items-center space-x-2">
                <Label className="text-sm">汇率:</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editedRate}
                  onChange={(e) => setEditedRate(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-lg font-semibold">
                  1 {getCurrencySymbol(rate.fromCurrency)} = {rate.rate.toFixed(4)} {getCurrencySymbol(rate.toCurrency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  更新时间: {formatDate(rate.updatedAt)}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
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

        {editing && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              示例: 1 {rate.fromCurrency} = {editedRate.toFixed(4)} {rate.toCurrency}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {rate.fromCurrency === 'CNY' && rate.toCurrency === 'USD' && (
                `¥100 = $${(100 * editedRate).toFixed(2)}`
              )}
              {rate.fromCurrency === 'USD' && rate.toCurrency === 'CNY' && (
                `$100 = ¥${(100 * editedRate).toFixed(2)}`
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}