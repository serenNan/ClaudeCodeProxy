import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle } from 'lucide-react';

interface DataStatusIndicatorProps {
  isRealData: boolean;
  className?: string;
}

export default function DataStatusIndicator({ isRealData, className }: DataStatusIndicatorProps) {
  return (
    <Badge 
      variant={isRealData ? "default" : "secondary"} 
      className={`flex items-center space-x-1 ${className}`}
    >
      {isRealData ? (
        <>
          <Database className="h-3 w-3" />
          <span>实时数据</span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-3 w-3" />
          <span>演示数据</span>
        </>
      )}
    </Badge>
  );
}