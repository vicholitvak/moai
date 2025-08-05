import { 
  Query, 
  DocumentSnapshot, 
  limit, 
  startAfter, 
  endBefore,
  getDocs,
  orderBy,
  where,
  WhereFilterOp,
  query
} from 'firebase/firestore';

export interface PaginationOptions {
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: unknown;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount?: number;
  currentPage: number;
  nextCursor?: DocumentSnapshot;
  previousCursor?: DocumentSnapshot;
  loading: boolean;
  error?: Error;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  cursors: DocumentSnapshot[];
  totalCount?: number;
}

export class FirebasePagination<T> {
  private baseQuery: Query;
  private pageSize: number;
  private orderByField: string;
  private orderDirection: 'asc' | 'desc';
  private cursors: DocumentSnapshot[] = [];
  private currentPage = 0;
  private totalCount?: number;

  constructor(
    baseQuery: Query,
    options: PaginationOptions = {}
  ) {
    this.baseQuery = baseQuery;
    this.pageSize = options.pageSize || 20;
    this.orderByField = options.orderByField || 'createdAt';
    this.orderDirection = options.orderDirection || 'desc';

    // Apply filters to base query
    if (options.filters) {
      options.filters.forEach(filter => {
        this.baseQuery = where(this.baseQuery, filter.field, filter.operator, filter.value);
      });
    }

    // Add ordering
    this.baseQuery = orderBy(this.baseQuery, this.orderByField, this.orderDirection);
  }

  // Get the first page
  async getFirstPage(): Promise<PaginatedResult<T>> {
    try {
      const query = limit(this.baseQuery, this.pageSize);
      const snapshot = await getDocs(query);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      // Store cursor for next page
      if (snapshot.docs.length > 0) {
        this.cursors = [snapshot.docs[snapshot.docs.length - 1]];
      }

      this.currentPage = 1;

      return {
        data,
        hasNextPage: snapshot.docs.length === this.pageSize,
        hasPreviousPage: false,
        currentPage: this.currentPage,
        nextCursor: snapshot.docs[snapshot.docs.length - 1],
        loading: false
      };
    } catch (error) {
      return {
        data: [],
        hasNextPage: false,
        hasPreviousPage: false,
        currentPage: 0,
        loading: false,
        error: error as Error
      };
    }
  }

  // Get next page
  async getNextPage(): Promise<PaginatedResult<T>> {
    if (this.cursors.length === 0) {
      return this.getFirstPage();
    }

    try {
      const lastCursor = this.cursors[this.cursors.length - 1];
      const query = limit(
        startAfter(this.baseQuery, lastCursor),
        this.pageSize
      );
      
      const snapshot = await getDocs(query);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      // Store cursor for next page
      if (snapshot.docs.length > 0) {
        this.cursors.push(snapshot.docs[snapshot.docs.length - 1]);
      }

      this.currentPage++;

      return {
        data,
        hasNextPage: snapshot.docs.length === this.pageSize,
        hasPreviousPage: this.currentPage > 1,
        currentPage: this.currentPage,
        nextCursor: snapshot.docs[snapshot.docs.length - 1],
        previousCursor: this.cursors[this.cursors.length - 2],
        loading: false
      };
    } catch (error) {
      return {
        data: [],
        hasNextPage: false,
        hasPreviousPage: this.currentPage > 1,
        currentPage: this.currentPage,
        loading: false,
        error: error as Error
      };
    }
  }

  // Get previous page
  async getPreviousPage(): Promise<PaginatedResult<T>> {
    if (this.cursors.length < 2 || this.currentPage <= 1) {
      return this.getFirstPage();
    }

    try {
      // Remove the last cursor and get the previous one
      this.cursors.pop();
      const previousCursor = this.cursors[this.cursors.length - 1];
      
      const query = limit(
        endBefore(this.baseQuery, previousCursor),
        this.pageSize
      );
      
      const snapshot = await getDocs(query);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      this.currentPage--;

      return {
        data,
        hasNextPage: true,
        hasPreviousPage: this.currentPage > 1,
        currentPage: this.currentPage,
        nextCursor: snapshot.docs[snapshot.docs.length - 1],
        previousCursor: this.cursors[this.cursors.length - 2],
        loading: false
      };
    } catch (error) {
      return {
        data: [],
        hasNextPage: false,
        hasPreviousPage: this.currentPage > 1,
        currentPage: this.currentPage,
        loading: false,
        error: error as Error
      };
    }
  }

  // Reset pagination to first page
  reset(): void {
    this.cursors = [];
    this.currentPage = 0;
  }

  // Get current page info
  getCurrentPageInfo(): {
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } {
    return {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      hasNextPage: this.cursors.length > 0,
      hasPreviousPage: this.currentPage > 1
    };
  }
}

// React hook for pagination
import { useState, useCallback, useRef } from 'react';

export function usePagination<T>(
  baseQuery: Query,
  options: PaginationOptions = {}
) {
  const [result, setResult] = useState<PaginatedResult<T>>({
    data: [],
    hasNextPage: false,
    hasPreviousPage: false,
    currentPage: 0,
    loading: true
  });

  const paginationRef = useRef<FirebasePagination<T>>(
    new FirebasePagination<T>(baseQuery, options)
  );

  const loadFirstPage = useCallback(async () => {
    setResult(prev => ({ ...prev, loading: true }));
    const result = await paginationRef.current.getFirstPage();
    setResult(result);
  }, []);

  const loadNextPage = useCallback(async () => {
    setResult(prev => ({ ...prev, loading: true }));
    const result = await paginationRef.current.getNextPage();
    setResult(result);
  }, []);

  const loadPreviousPage = useCallback(async () => {
    setResult(prev => ({ ...prev, loading: true }));
    const result = await paginationRef.current.getPreviousPage();
    setResult(result);
  }, []);

  const reset = useCallback(() => {
    paginationRef.current.reset();
    loadFirstPage();
  }, [loadFirstPage]);

  const refresh = useCallback(() => {
    const currentPage = paginationRef.current.getCurrentPageInfo().currentPage;
    if (currentPage <= 1) {
      loadFirstPage();
    } else {
      // Reload current page by going back and forward
      paginationRef.current.reset();
      loadFirstPage();
    }
  }, [loadFirstPage]);

  return {
    ...result,
    loadFirstPage,
    loadNextPage,
    loadPreviousPage,
    reset,
    refresh,
    pageInfo: paginationRef.current.getCurrentPageInfo()
  };
}

// Infinite scroll pagination hook
export function useInfiniteScroll<T>(
  baseQuery: Query,
  options: PaginationOptions = {}
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const paginationRef = useRef<FirebasePagination<T>>(
    new FirebasePagination<T>(baseQuery, options)
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = allData.length === 0 
        ? await paginationRef.current.getFirstPage()
        : await paginationRef.current.getNextPage();

      if (result.error) {
        setError(result.error);
        return;
      }

      setAllData(prev => [...prev, ...result.data]);
      setHasMore(result.hasNextPage);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [allData.length, loading, hasMore]);

  const reset = useCallback(() => {
    setAllData([]);
    setHasMore(true);
    setError(null);
    paginationRef.current.reset();
  }, []);

  return {
    data: allData,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
}

// Utility for creating optimized queries
export const queryOptimizer = {
  // Add composite index suggestion
  suggestIndex(
    collection: string,
    fields: Array<{ field: string; direction?: 'asc' | 'desc' }>
  ): string {
    const fieldSpecs = fields.map(f => 
      `${f.field} ${f.direction || 'asc'}`
    ).join(', ');
    
    return `Create composite index for collection '${collection}' with fields: ${fieldSpecs}`;
  },

  // Optimize query for pagination
  addPaginationOptimizations(
    baseQuery: Query,
    options: {
      orderBy: string;
      direction?: 'asc' | 'desc';
      pageSize?: number;
    }
  ): Query {
    const constraints = [
      orderBy(options.orderBy, options.direction || 'desc')
    ];
    
    if (options.pageSize) {
      constraints.push(limit(options.pageSize));
    }
    
    return query(baseQuery, ...constraints);
  }
};