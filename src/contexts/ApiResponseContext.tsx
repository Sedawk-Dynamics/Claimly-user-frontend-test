import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { registerApiCallCallback } from '../services/api';

export interface ApiCall {
  id: string;
  method: string;
  url: string;
  fullUrl: string;
  headers: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  error?: any;
  timestamp: Date;
  duration?: number;
}

interface ApiResponseContextType {
  apiCalls: ApiCall[];
  addApiCall: (call: Omit<ApiCall, 'id' | 'timestamp'>) => void;
  clearApiCalls: () => void;
  isEnabled: boolean;
  toggleEnabled: () => void;
}

const ApiResponseContext = createContext<ApiResponseContextType | undefined>(undefined);

export function ApiResponseProvider({ children }: { children: ReactNode }) {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);

  const addApiCall = (call: Omit<ApiCall, 'id' | 'timestamp'>) => {
    if (!isEnabled) return;
    
    const newCall: ApiCall = {
      ...call,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
    };
    
    setApiCalls((prev) => {
      // Keep only last 50 calls to prevent memory issues
      const updated = [newCall, ...prev].slice(0, 50);
      return updated;
    });
  };

  const clearApiCalls = () => {
    setApiCalls([]);
  };

  const toggleEnabled = () => {
    setIsEnabled((prev) => !prev);
  };

  // Register callback with API service
  useEffect(() => {
    if (isEnabled) {
      registerApiCallCallback(addApiCall);
    } else {
      registerApiCallCallback(null);
    }

    return () => {
      registerApiCallCallback(null);
    };
  }, [isEnabled]);

  return (
    <ApiResponseContext.Provider
      value={{
        apiCalls,
        addApiCall,
        clearApiCalls,
        isEnabled,
        toggleEnabled,
      }}
    >
      {children}
    </ApiResponseContext.Provider>
  );
}

export function useApiResponse() {
  const context = useContext(ApiResponseContext);
  if (context === undefined) {
    throw new Error('useApiResponse must be used within an ApiResponseProvider');
  }
  return context;
}

