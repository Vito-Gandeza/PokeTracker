'use client';

import { useState, useEffect, useCallback } from 'react';
import { PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';
import { createClient, executeWithRetry } from './supabase-client';

// Cache for storing query results
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  expiresAt: number;
}>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Generate a cache key from query parameters
function generateCacheKey(table: string, query: any): string {
  return `${table}:${JSON.stringify(query)}`;
}

// Check if a cached result is still valid
function isCacheValid(cacheKey: string): boolean {
  const cached = queryCache.get(cacheKey);
  if (!cached) return false;
  return Date.now() < cached.expiresAt;
}

// Get data from cache
function getFromCache(cacheKey: string): any {
  const cached = queryCache.get(cacheKey);
  return cached?.data || null;
}

// Store data in cache
function storeInCache(cacheKey: string, data: any): void {
  const now = Date.now();
  queryCache.set(cacheKey, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL
  });
}

// Clear expired cache entries
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now > value.expiresAt) {
      queryCache.delete(key);
    }
  }
}

// Run cache cleanup periodically
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 60 * 1000); // Clean up every minute
}

interface QueryOptions {
  cacheTime?: number; // Override default cache TTL
  skipCache?: boolean; // Skip cache for this query
  retries?: number; // Number of retries for this query
  onSuccess?: (data: any) => void;
  onError?: (error: PostgrestError | Error) => void;
}

/**
 * Execute a Supabase query with caching and retry logic
 */
export async function executeQuery<T = any>(
  table: string,
  queryFn: (query: any) => Promise<PostgrestSingleResponse<T> | PostgrestResponse<T>>,
  options: QueryOptions = {}
): Promise<{ data: T | null; error: PostgrestError | Error | null }> {
  const { 
    cacheTime = CACHE_TTL, 
    skipCache = false, 
    retries = 3,
    onSuccess,
    onError
  } = options;
  
  try {
    const supabase = createClient();
    const query = supabase.from(table);
    
    // Generate cache key
    const cacheKey = generateCacheKey(table, queryFn.toString());
    
    // Check cache first if not skipping
    if (!skipCache && isCacheValid(cacheKey)) {
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        onSuccess?.(cachedData);
        return { data: cachedData, error: null };
      }
    }
    
    // Execute query with retry logic
    const response = await executeWithRetry(() => queryFn(query), retries);
    
    if (response.error) {
      onError?.(response.error);
      return { data: null, error: response.error };
    }
    
    // Store in cache with custom TTL if provided
    if (!skipCache) {
      storeInCache(cacheKey, response.data);
    }
    
    onSuccess?.(response.data);
    return { data: response.data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('An unknown error occurred');
    onError?.(error);
    return { data: null, error };
  }
}

/**
 * React hook for making Supabase queries with caching and retry logic
 */
export function useSupabaseQuery<T = any>(
  table: string,
  queryBuilder: (query: any) => any,
  dependencies: any[] = [],
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefetching(true);
    }
    
    const { data: responseData, error: responseError } = await executeQuery<T>(
      table,
      queryBuilder,
      {
        ...options,
        onSuccess: (data) => {
          setData(data);
          options.onSuccess?.(data);
        },
        onError: (err) => {
          setError(err);
          options.onError?.(err);
        }
      }
    );
    
    if (showLoading) {
      setIsLoading(false);
    } else {
      setIsRefetching(false);
    }
    
    return { data: responseData, error: responseError };
  }, [table, queryBuilder, options]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [...dependencies]);

  // Function to manually refetch data
  const refetch = useCallback(async () => {
    return fetchData(false);
  }, [fetchData]);

  return { data, error, isLoading, isRefetching, refetch };
}

/**
 * React hook for making paginated Supabase queries
 */
export function usePaginatedQuery<T = any>(
  table: string,
  queryBuilder: (query: any, page: number, pageSize: number) => any,
  pageSize: number = 20,
  dependencies: any[] = [],
  options: QueryOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPage = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const supabase = createClient();
      const query = supabase.from(table);
      
      // Execute query with retry logic
      const response = await executeWithRetry(
        () => queryBuilder(query, pageNum, pageSize + 1), // Fetch one extra item to check if there are more
        options.retries || 3
      );
      
      if (response.error) {
        setError(response.error);
        options.onError?.(response.error);
        return;
      }
      
      // Check if there are more items
      const hasMoreItems = response.data.length > pageSize;
      setHasMore(hasMoreItems);
      
      // Remove the extra item we used to check for more
      const pageData = hasMoreItems ? response.data.slice(0, pageSize) : response.data;
      
      // Update data state
      if (append) {
        setData(prevData => [...prevData, ...pageData]);
      } else {
        setData(pageData);
      }
      
      options.onSuccess?.(pageData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      options.onError?.(error);
    } finally {
      if (pageNum === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [table, queryBuilder, pageSize, options]);

  // Fetch first page when dependencies change
  useEffect(() => {
    setPage(1);
    fetchPage(1, false);
  }, [...dependencies]);

  // Function to load more data
  const loadMore = useCallback(async () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchPage(nextPage, true);
    }
  }, [isLoadingMore, hasMore, page, fetchPage]);

  // Function to refresh data
  const refresh = useCallback(async () => {
    setPage(1);
    await fetchPage(1, false);
  }, [fetchPage]);

  return { 
    data, 
    error, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMore, 
    refresh, 
    page 
  };
}
