// 兼容性导出，用于向后兼容
// 实际实现现在使用React Context

interface ToastOptions {
  duration?: number;
}

// 创建一个全局的toast事件系统
const toastEvents: Array<(message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void> = [];

export const registerToastHandler = (handler: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void) => {
  toastEvents.push(handler);
  return () => {
    const index = toastEvents.indexOf(handler);
    if (index > -1) {
      toastEvents.splice(index, 1);
    }
  };
};

export const showToast = (
  message: string, 
  type: 'success' | 'error' | 'info' | 'warning' = 'info', 
  options?: ToastOptions
) => {
  const duration = options?.duration || 3000;
  
  // 如果有注册的处理器，使用它们
  if (toastEvents.length > 0) {
    toastEvents.forEach(handler => handler(message, type, duration));
    return;
  }
  
  // 降级方案：简单的alert（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`Toast [${type}]: ${message}`);
  }
};