// Performance monitoring utilities
export interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  fmp: number | null; // First Meaningful Paint
}

export interface PerformanceThresholds {
  fcp: number; // 1.8s
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  ttfb: number; // 600ms
  fmp: number; // 2.0s
}

// Default performance thresholds (Core Web Vitals)
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fcp: 1800,
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  ttfb: 600,
  fmp: 2000
};

// Performance observer setup
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fmp: null
  };
  private thresholds: PerformanceThresholds;
  private onMetricUpdate?: (metrics: PerformanceMetrics) => void;
  private onThresholdExceeded?: (metric: keyof PerformanceMetrics, value: number, threshold: number) => void;

  constructor(
    thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS,
    onMetricUpdate?: (metrics: PerformanceMetrics) => void,
    onThresholdExceeded?: (metric: keyof PerformanceMetrics, value: number, threshold: number) => void
  ) {
    this.thresholds = thresholds;
    this.onMetricUpdate = onMetricUpdate;
    this.onThresholdExceeded = onThresholdExceeded;
  }

  start(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // First Contentful Paint
      this.observeFCP();
      
      // Largest Contentful Paint
      this.observeLCP();
      
      // First Input Delay
      this.observeFID();
      
      // Cumulative Layout Shift
      this.observeCLS();
      
      // Time to First Byte
      this.measureTTFB();
      
      // First Meaningful Paint (estimated)
      this.measureFMP();
      
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
    }
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  private observeFCP(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.checkThreshold('fcp', this.metrics.fcp);
          this.onMetricUpdate?.(this.metrics);
        }
      });
      
      this.observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.error('Failed to observe FCP:', error);
    }
  }

  private observeLCP(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
          this.checkThreshold('lcp', this.metrics.lcp);
          this.onMetricUpdate?.(this.metrics);
        }
      });
      
      this.observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.error('Failed to observe LCP:', error);
    }
  }

  private observeFID(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.checkThreshold('fid', this.metrics.fid);
            this.onMetricUpdate?.(this.metrics);
          }
        });
      });
      
      this.observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.error('Failed to observe FID:', error);
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
            this.checkThreshold('cls', this.metrics.cls);
            this.onMetricUpdate?.(this.metrics);
          }
        });
      });
      
      this.observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.error('Failed to observe CLS:', error);
    }
  }

  private measureTTFB(): void {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.checkThreshold('ttfb', this.metrics.ttfb);
        this.onMetricUpdate?.(this.metrics);
      }
    } catch (error) {
      console.error('Failed to measure TTFB:', error);
    }
  }

  private measureFMP(): void {
    try {
      // Estimate FMP based on DOM content loaded
      const domContentLoaded = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (domContentLoaded) {
        this.metrics.fmp = domContentLoaded.domContentLoadedEventEnd - domContentLoaded.fetchStart;
        this.checkThreshold('fmp', this.metrics.fmp);
        this.onMetricUpdate?.(this.metrics);
      }
    } catch (error) {
      console.error('Failed to measure FMP:', error);
    }
  }

  private checkThreshold(metric: keyof PerformanceMetrics, value: number | null): void {
    if (value !== null && this.onThresholdExceeded) {
      const threshold = this.thresholds[metric];
      if (value > threshold) {
        this.onThresholdExceeded(metric, value, threshold);
      }
    }
  }
}

// Performance measurement utilities
export function measurePerformance<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function measureAsyncPerformance<T>(
  fn: () => Promise<T>, 
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
}

// Memory usage monitoring
export function getMemoryInfo(): {
  used: number;
  total: number;
  limit: number;
  percentage: number;
} | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;
    const percentage = (used / limit) * 100;
    
    return { used, total, limit, percentage };
  }
  
  return null;
}

// Network information
export function getNetworkInfo(): {
  effectiveType: string;
  downlink: number;
  rtt: number;
} | null {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0
    };
  }
  
  return null;
}

// Performance budget checker
export function checkPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: Partial<PerformanceThresholds>
): { passed: boolean; violations: Array<{ metric: string; actual: number; budget: number }> } {
  const violations: Array<{ metric: string; actual: number; budget: number }> = [];
  
  Object.entries(budget).forEach(([metric, budgetValue]) => {
    const actualValue = metrics[metric as keyof PerformanceMetrics];
    
    if (actualValue !== null && actualValue > budgetValue) {
      violations.push({
        metric,
        actual: actualValue,
        budget: budgetValue
      });
    }
  });
  
  return {
    passed: violations.length === 0,
    violations
  };
}

// Performance reporting
export function reportPerformanceMetrics(
  metrics: PerformanceMetrics,
  endpoint: string = '/api/performance'
): void {
  if (typeof window === 'undefined') return;
  
  // Send metrics to analytics endpoint
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: window.location.href,
      timestamp: Date.now(),
      metrics,
      userAgent: navigator.userAgent,
      connection: getNetworkInfo()
    })
  }).catch(error => {
    console.error('Failed to report performance metrics:', error);
  });
}

// Performance optimization helpers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Resource timing
export function getResourceTiming(): Array<{
  name: string;
  duration: number;
  size: number;
  type: string;
}> {
  if (typeof performance === 'undefined') return [];
  
  const resources = performance.getEntriesByType('resource');
  
  return resources.map((resource: any) => ({
    name: resource.name,
    duration: resource.duration,
    size: resource.transferSize || 0,
    type: resource.initiatorType
  }));
}

// Long task detection
export function observeLongTasks(callback: (task: PerformanceEntry) => void): void {
  if (typeof PerformanceObserver === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // 50ms threshold
          callback(entry);
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.error('Failed to observe long tasks:', error);
  }
}

