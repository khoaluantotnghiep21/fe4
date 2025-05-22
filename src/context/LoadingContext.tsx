import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { setGlobalLoadingHandlers } from '../lib/axiosClient';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Maximum loading time (ms) before automatically hiding the loader
const MAX_LOADING_TIME = 8000;

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearLoadingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showLoading = useCallback(() => {
    setLoadingCount(prevCount => prevCount + 1);
    setIsLoading(true);

    // Clear any existing timeout
    clearLoadingTimeout();

    // Set safety timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      console.log('Safety timeout triggered - forcing loading to end');
      setLoadingCount(0);
      setIsLoading(false);
    }, MAX_LOADING_TIME);
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingCount(prevCount => {
      const newCount = Math.max(0, prevCount - 1);
      if (newCount <= 0) {
        setIsLoading(false);
        clearLoadingTimeout();
      }
      return newCount;
    });
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => clearLoadingTimeout();
  }, []);

  // Set global axios handlers
  useEffect(() => {
    setGlobalLoadingHandlers(showLoading, hideLoading);
  }, [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[9999]">
          <Spin size="large" />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};