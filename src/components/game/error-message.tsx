'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Info,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  showIcon?: boolean;
  showClose?: boolean;
  showRetry?: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  showIcon = true,
  showClose = true,
  showRetry = false,
  onClose,
  onRetry,
  className = ''
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  const typeConfig = {
    error: {
      icon: <XCircle className="w-5 h-5" />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-100'
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-100'
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-100'
    },
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500 dark:text-green-400',
      titleColor: 'text-green-900 dark:text-green-100'
    }
  };

  const config = typeConfig[type];

  return (
    <div className={cn(
      'rounded-xl border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
            {config.icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('font-medium mb-1', config.titleColor)}>
              {title}
            </h3>
          )}
          
          <p className={cn('text-sm', config.textColor)}>
            {message}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showRetry && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className={cn('text-xs', config.textColor)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Tekrar Dene
            </Button>
          )}
          
          {showClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className={cn('text-xs', config.textColor)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast-style error message
interface ErrorToastProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function ErrorToast({
  message,
  type = 'error',
  duration = 5000,
  onClose,
  className = ''
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after duration
  useState(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  });

  if (!isVisible) return null;

  const typeConfig = {
    error: {
      bgColor: 'bg-red-500',
      icon: <XCircle className="w-4 h-4" />
    },
    warning: {
      bgColor: 'bg-yellow-500',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    info: {
      bgColor: 'bg-blue-500',
      icon: <Info className="w-4 h-4" />
    },
    success: {
      bgColor: 'bg-green-500',
      icon: <CheckCircle className="w-4 h-4" />
    }
  };

  const config = typeConfig[type];

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-sm',
      className
    )}>
      <div className={cn(
        'rounded-lg shadow-lg text-white p-4 flex items-center gap-3',
        config.bgColor
      )}>
        {config.icon}
        <p className="flex-1 text-sm">{message}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="text-white hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Full screen error overlay
interface ErrorOverlayProps {
  isVisible: boolean;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ErrorOverlay({
  isVisible,
  title,
  message,
  type = 'error',
  showRetry = true,
  onRetry,
  onClose,
  className = ''
}: ErrorOverlayProps) {
  if (!isVisible) return null;

  const typeConfig = {
    error: {
      icon: <XCircle className="w-16 h-16" />,
      bgColor: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
      icon: <AlertTriangle className="w-16 h-16" />,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      icon: <Info className="w-16 h-16" />,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    }
  };

  const config = typeConfig[type];

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6',
      className
    )}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full text-center">
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
          config.bgColor + '/20'
        )}>
          <div className={config.textColor}>
            {config.icon}
          </div>
        </div>
        
        {title && (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h2>
        )}
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
          )}
          
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Kapat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline error message for forms
interface FormErrorMessageProps {
  message?: string;
  className?: string;
}

export function FormErrorMessage({ message, className = '' }: FormErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-1', className)}>
      <XCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// Error boundary fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, className = '' }: ErrorFallbackProps) {
  return (
    <div className={cn('p-6 text-center', className)}>
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Bir Hata Oluştu
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hata Detayları
          </summary>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
      
      <Button
        onClick={resetErrorBoundary}
        className="bg-purple-600 hover:bg-purple-700"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Tekrar Dene
      </Button>
    </div>
  );
}

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function NetworkError({ onRetry, onGoHome, className = '' }: NetworkErrorProps) {
  return (
    <div className={cn('text-center p-6', className)}>
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Bağlantı Hatası
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        İnternet bağlantınızı kontrol edin ve tekrar deneyin.
      </p>
      
      <div className="space-y-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tekrar Dene
          </Button>
        )}
        
        {onGoHome && (
          <Button
            onClick={onGoHome}
            variant="outline"
            className="w-full"
          >
            Ana Sayfaya Dön
          </Button>
        )}
      </div>
    </div>
  );
}

// Export all error components
export const ErrorComponents = {
  Message: ErrorMessage,
  Toast: ErrorToast,
  Overlay: ErrorOverlay,
  Form: FormErrorMessage,
  Fallback: ErrorFallback,
  Network: NetworkError
};
