import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileImage, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExportButtonProps {
  data: any;
  filename?: string;
  className?: string;
}

export default function ExportButton({ data, filename = 'export', className }: ExportButtonProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'png'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const exportToCsv = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToJson = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'csv':
          if (Array.isArray(data)) {
            exportToCsv(data, filename);
          } else {
            alert('CSV格式仅支持数组数据');
          }
          break;
        case 'json':
          exportToJson(data, filename);
          break;
        case 'png':
          // await exportToPng('chart-container', filename);
          break;
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = () => {
    switch (format) {
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      case 'png':
        return <FileImage className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Select value={format} onValueChange={(value: 'csv' | 'json' | 'png') => setFormat(value)}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        ) : (
          <>
            {getFormatIcon()}
            <span className="ml-1">导出</span>
          </>
        )}
      </Button>
    </div>
  );
}