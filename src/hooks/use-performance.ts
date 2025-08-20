'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PerformanceMonitor, 
  PerformanceMetrics, 
  PerformanceThresholds,
  DEFAULT_THRESHOLDS,
  measurePerformance,
  measureAsyncPerformance,
  getMemoryInfo,
  getNetworkInfo,
  checkPerformanceBudget
} from '@/lib/utils/performance';

export interface UsePerformanceOptions {
  thresholds?: PerformanceThresholds;
  autoStart?: boolean;
  reportToAnalytics?: boolean;
  analyticsEndpoint?: string;
  onThresholdExceeded?: (metric: keyof PerformanceMetrics, value: number, threshold: number) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export interface UsePerformanceReturn {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetMetrics: () => void;
  measure: <T>(fn: () => T, label: string) => T;
  measureAsync: <T>(fn: () => Promise<T>, label: string) => Promise<T>;
  memoryInfo: ReturnType<typeof getMemoryInfo>;
  networkInfo: ReturnType<typeof getNetworkInfo>;
  performanceBudget: ReturnType<typeof checkPerformanceBudget>;
  reportMetrics: () => void;
}

export function usePerformance(options: UsePerformanceOptions = {}): UsePerformanceReturn {
  const {
    thresholds = DEFAULT_THRESHOLDS,
    autoStart = true,
    reportToAnalytics = false,
    analyticsEndpoint = '/api/performance',
    onThresholdExceeded,
    onMetricsUpdate
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fmp: null
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState<ReturnType<typeof getMemoryInfo>>(null);
  const [networkInfo, setNetworkInfo] = useState<ReturnType<typeof getNetworkInfo>>(null);

  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const budgetRef = useRef<PerformanceThresholds>(thresholds);

  // Performance budget hesaplama
  const performanceBudget = checkPerformanceBudget(metrics, budgetRef.current);

  // Metrics güncelleme callback'i
  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);
  }, [onMetricsUpdate]);

  // Threshold aşımı callback'i
  const handleThresholdExceeded = useCallback((
    metric: keyof PerformanceMetrics, 
    value: number, 
    threshold: number
  ) => {
    onThresholdExceeded?.(metric, value, threshold);
    
    // Console'da uyarı göster
    console.warn(`Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`);
  }, [onThresholdExceeded]);

  // Monitoring başlatma
  const startMonitoring = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      monitorRef.current = new PerformanceMonitor(
        budgetRef.current,
        handleMetricsUpdate,
        handleThresholdExceeded
      );
      
      monitorRef.current.start();
      setIsMonitoring(true);
      
      console.log('Performance monitoring started');
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
    }
  }, [handleMetricsUpdate, handleThresholdExceeded]);

  // Monitoring durdurma
  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stop();
      monitorRef.current = null;
      setIsMonitoring(false);
      console.log('Performance monitoring stopped');
    }
  }, []);

  // Metrics sıfırlama
  const resetMetrics = useCallback(() => {
    setMetrics({
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fmp: null
    });
  }, []);

  // Performance ölçümü
  const measure = useCallback(<T>(fn: () => T, label: string): T => {
    return measurePerformance(fn, label);
  }, []);

  // Async performance ölçümü
  const measureAsync = useCallback(<T>(fn: () => Promise<T>, label: string): Promise<T> => {
    return measureAsyncPerformance(fn, label);
  }, []);

  // Metrics raporlama
  const reportMetrics = useCallback(() => {
    if (!reportToAnalytics || typeof window === 'undefined') return;

    fetch(analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: window.location.href,
        timestamp: Date.now(),
        metrics,
        memoryInfo,
        networkInfo,
        performanceBudget,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.error('Failed to report performance metrics:', error);
    });
  }, [reportToAnalytics, analyticsEndpoint, metrics, memoryInfo, networkInfo, performanceBudget]);

  // Memory ve network bilgilerini güncelle
  const updateSystemInfo = useCallback(() => {
    setMemoryInfo(getMemoryInfo());
    setNetworkInfo(getNetworkInfo());
  }, []);

  // Effect: Auto-start monitoring
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [autoStart, startMonitoring, stopMonitoring]);

  // Effect: System info updates
  useEffect(() => {
    updateSystemInfo();
    
    // Her 5 saniyede bir güncelle
    const interval = setInterval(updateSystemInfo, 5000);
    
    return () => clearInterval(interval);
  }, [updateSystemInfo]);

  // Effect: Thresholds güncelleme
  useEffect(() => {
    budgetRef.current = thresholds;
  }, [thresholds]);

  // Effect: Metrics değişikliklerinde raporlama
  useEffect(() => {
    if (reportToAnalytics && Object.values(metrics).some(m => m !== null)) {
      // Debounced reporting
      const timeoutId = setTimeout(reportMetrics, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [metrics, reportToAnalytics, reportMetrics]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    measure,
    measureAsync,
    memoryInfo,
    networkInfo,
    performanceBudget,
    reportMetrics
  };
}

// Component performance hook'u
export function useComponentPerformance(componentName: string) {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      
      setRenderTime(duration);
      setRenderCount(prev => prev + 1);
      
      // Slow render warning
      if (duration > 16) { // 60fps threshold
        console.warn(`${componentName} took ${duration.toFixed(2)}ms to render (slow)`);
      }
    };
  });

  return {
    renderCount,
    renderTime,
    isSlowRender: renderTime > 16
  };
}

// Page load performance hook'u
export function usePageLoadPerformance() {
  const [loadTime, setLoadTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
        setLoadTime(loadTime);
        setIsLoaded(true);
        
        console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return {
    loadTime,
    isLoaded,
    isSlowLoad: loadTime > 3000 // 3s threshold
  };
}

// Resource loading performance hook'u
export function useResourcePerformance() {
  const [resources, setResources] = useState<Array<{
    name: string;
    duration: number;
    size: number;
    type: string;
  }>>([]);

  useEffect(() => {
    const updateResources = () => {
      if (typeof performance !== 'undefined') {
        const resourceEntries = performance.getEntriesByType('resource');
        const resourceData = resourceEntries.map((entry: any) => ({
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize || 0,
          type: entry.initiatorType
        }));
        
        setResources(resourceData);
      }
    };

    // Initial update
    updateResources();

    // Resource timing updates
    const observer = new PerformanceObserver((list) => {
      updateResources();
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource timing not supported');
    }

    return () => observer.disconnect();
  }, []);

  const slowResources = resources.filter(r => r.duration > 1000); // 1s threshold
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
  const averageLoadTime = resources.length > 0 
    ? resources.reduce((sum, r) => sum + r.duration, 0) / resources.length 
    : 0;

  return {
    resources,
    slowResources,
    totalSize,
    averageLoadTime,
    resourceCount: resources.length
  };
}

