'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  text?: string;
  showText?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text = 'Yükleniyor...',
  showText = true,
  className = ''
}: LoadingSpinnerProps) {
  const [dots, setDots] = useState('');

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-purple-600 dark:text-purple-400',
    secondary: 'text-blue-600 dark:text-blue-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        {/* Main spinner */}
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-current border-t-transparent',
            sizeClasses[size],
            colorClasses[color]
          )}
        />
        
        {/* Pulse effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping',
            sizeClasses[size]
          )}
        />
      </div>
      
      {showText && (
        <p className={cn(
          'mt-3 text-sm font-medium',
          colorClasses[color]
        )}>
          {text}{dots}
        </p>
      )}
    </div>
  );
}

// Full screen loading overlay
interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  showSpinner?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  text = 'Yükleniyor...',
  showSpinner = true,
  className = ''
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center',
      className
    )}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
        {showSpinner && (
          <LoadingSpinner size="xl" color="primary" text={text} />
        )}
      </div>
    </div>
  );
}

// Inline loading spinner
interface InlineSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export function InlineSpinner({
  size = 'sm',
  color = 'primary',
  className = ''
}: InlineSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const colorClasses = {
    primary: 'text-purple-600 dark:text-purple-400',
    secondary: 'text-blue-600 dark:text-blue-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

// Button loading state
interface ButtonSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ButtonSpinner({ size = 'sm', className = '' }: ButtonSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-white border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Skeleton loading components
interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
          className
        )}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full',
            className
          )}
          style={{ height: '1rem' }}
        />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <Skeleton lines={3} className="h-3" />
    </div>
  );
}

// Game grid skeleton
export function GameGridSkeleton({ 
  rows = 6, 
  cols = 5, 
  className = '' 
}: { 
  rows?: number; 
  cols?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('grid gap-2', className)} style={{ 
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gridTemplateColumns: `repeat(${cols}, 1fr)`
    }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div
          key={i}
          className="w-12 h-12 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"
        />
      ))}
    </div>
  );
}

// Progress bar with loading animation
interface LoadingProgressProps {
  progress: number;
  total: number;
  text?: string;
  showPercentage?: boolean;
  className?: string;
}

export function LoadingProgress({
  progress,
  total,
  text = 'Yükleniyor',
  showPercentage = true,
  className = ''
}: LoadingProgressProps) {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className={cn('w-full', className)}>
      {text && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {text}
          </span>
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{progress}</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

// Infinite loading spinner
export function InfiniteSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 rounded-full animate-spin">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
        
        {/* Inner dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// Loading states for different components
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Overlay: LoadingOverlay,
  Inline: InlineSpinner,
  Button: ButtonSpinner,
  Skeleton: Skeleton,
  Card: CardSkeleton,
  GameGrid: GameGridSkeleton,
  Progress: LoadingProgress,
  Infinite: InfiniteSpinner
};
