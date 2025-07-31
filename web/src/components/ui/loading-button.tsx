import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface LoadingButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  loadingText?: string;
  icon?: ReactNode;
}

export function LoadingButton({
  loading = false,
  disabled = false,
  onClick,
  children,
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  loadingText,
  icon
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;
  const displayText = loading && loadingText ? loadingText : children;

  return (
    <Button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={className}
      variant={variant}
      size={size}
    >
      <span className="flex items-center">
        {/* Loading spinner - always rendered but conditionally visible */}
        <RefreshCw 
          className={`w-4 h-4 mr-2 transition-opacity duration-200 ${
            loading ? 'animate-spin opacity-100' : 'opacity-0 hidden'
          }`} 
        />
        
        {/* Regular icon - always rendered but conditionally visible */}
        {icon && (
          <span className={`mr-2 transition-opacity duration-200 ${
            loading ? 'opacity-0 hidden' : 'opacity-100'
          }`}>
            {icon}
          </span>
        )}
        
        <span>{displayText}</span>
      </span>
    </Button>
  );
}