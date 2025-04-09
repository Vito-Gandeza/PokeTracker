'use client';

import { useState, useEffect, useCallback } from 'react';
import { PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { useAuth } from './auth-context';
import supabase from './supabase';

interface ApiOptions<T> {
  initialData?: T;
  dependencyArray?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: PostgrestError | Error) => void;
}

type ApiState<T> = {
  data: T | null;
  error: PostgrestError | Error | null;
  isLoading: boolean;
  mutate: () => Promise<void>;
};

/**
 * Custom hook for making authenticated API calls to Supabase
 */
export function useApi<T = any>(
  fetchFn: () => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  options: ApiOptions<T> = {}
): ApiState<T> {
  const { initialData, dependencyArray = [], onSuccess, onError } = options;
  const { isAuthenticated, session } = useAuth();
  const [data, setData] = useState<T | null>(initialData || null);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchFn();
      
      if (response.error) {
        setError(response.error);
        onError?.(response.error);
      } else {
        setData(response.data as T);
        onSuccess?.(response.data as T);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, isAuthenticated, onError, onSuccess]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencyArray]);

  const mutate = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, error, isLoading, mutate };
}

/**
 * Helper to create a Supabase query with the current session
 */
export function createQuery<T = any>(table: string, queryFn?: (query: any) => any) {
  return async (): Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>> => {
    let query = supabase.from(table).select('*');
    
    if (queryFn) {
      return await queryFn(supabase.from(table));
    }
    
    return await query;
  };
}

export default useApi; 