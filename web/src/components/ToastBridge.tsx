import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { registerToastHandler } from '@/utils/toast';

export function ToastBridge() {
  const { showToast: contextShowToast } = useToast();

  useEffect(() => {
    // 注册全局toast处理器
    const unregister = registerToastHandler((message, type, duration) => {
      contextShowToast(message, type, duration);
    });

    return unregister;
  }, [contextShowToast]);

  return null;
}