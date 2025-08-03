import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 触发进入动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 自动移除
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          bgColor: 'bg-primary',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'error':
        return {
          bgColor: 'bg-destructive',
          icon: <XCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          bgColor: 'bg-muted',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      default:
        return {
          bgColor: 'bg-primary',
          icon: <Info className="w-5 h-5" />
        };
    }
  };

  const config = getToastConfig();

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`flex items-center p-4 ${config.bgColor} text-white rounded-lg shadow-lg max-w-sm`}>
        <span className="mr-3 flex-shrink-0">
          {config.icon}
        </span>
        <span className="flex-1 text-sm">
          {toast.message}
        </span>
        <button
          onClick={handleRemove}
          className="ml-3 text-white hover:text-white/80 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}