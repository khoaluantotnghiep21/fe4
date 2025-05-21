import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Spin } from 'antd';
import { setGlobalLoadingHandlers } from '../lib/axiosClient';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const showLoading = useCallback(() => {
    setLoadingCount(prevCount => {
      const newCount = prevCount + 1;
      console.log('Loading started. Count:', newCount);
      return newCount;
    });
    setIsLoading(true);
    console.log('Loading state set to true');
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingCount(prevCount => {
      const newCount = prevCount - 1;
      console.log('Loading ended. Count:', newCount);
      if (newCount <= 0) {
        setIsLoading(false);
        console.log('Loading state set to false');
        return 0;
      }
      return newCount;
    });
  }, []);

  useEffect(() => {
    console.log('Current loading state:', isLoading);
    console.log('Current loading count:', loadingCount);
  }, [isLoading, loadingCount]);

  useEffect(() => {
    setGlobalLoadingHandlers(showLoading, hideLoading);
  }, [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
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