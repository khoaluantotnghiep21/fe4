import { useState, useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';

interface UseApiOptions {
  showGlobalLoading?: boolean;
}

export function useApi<T>(options: UseApiOptions = {}) {
  const { showGlobalLoading = false } = options;
  const [localLoading, setLocalLoading] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  const execute = useCallback(async <R = T>(
    promise: Promise<R>,
  ): Promise<R> => {
    try {
      if (showGlobalLoading) {
        showLoading();
      } else {
        setLocalLoading(true);
      }

      const result = await promise;
      return result;
    } finally {
      if (showGlobalLoading) {
        hideLoading();
      } else {
        setLocalLoading(false);
      }
    }
  }, [showGlobalLoading, showLoading, hideLoading]);

  return {
    execute,
    isLoading: showGlobalLoading ? false : localLoading
  };
} 