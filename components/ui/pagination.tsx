'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPrevNext?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPrevNext = true,
  showFirstLast = false,
  maxVisiblePages = 5,
  disabled = false,
  size = 'md'
}: PaginationProps) {
  // Calculate which pages to show
  const getVisiblePages = () => {
    const delta = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const showStartEllipsis = visiblePages[0] > 2;
  const showEndEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-1">
      {/* First page */}
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          className={sizeClasses[size]}
          onClick={() => onPageChange(1)}
          disabled={disabled}
          aria-label="Primera página"
        >
          1
        </Button>
      )}

      {/* Previous page */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          className={sizeClasses[size]}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Start ellipsis */}
      {showStartEllipsis && (
        <Button
          variant="ghost"
          size="sm"
          className={sizeClasses[size]}
          disabled
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}

      {/* Visible page numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          className={sizeClasses[size]}
          onClick={() => onPageChange(page)}
          disabled={disabled}
          aria-label={`Página ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {/* End ellipsis */}
      {showEndEllipsis && (
        <Button
          variant="ghost"
          size="sm"
          className={sizeClasses[size]}
          disabled
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}

      {/* Next page */}
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          className={sizeClasses[size]}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Last page */}
      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          className={sizeClasses[size]}
          onClick={() => onPageChange(totalPages)}
          disabled={disabled}
          aria-label="Última página"
        >
          {totalPages}
        </Button>
      )}
    </div>
  );
}

// Simple pagination info component
interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className = ''
}: PaginationInfoProps) {
  if (totalItems && itemsPerPage) {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Mostrando {start} a {end} de {totalItems} resultados
      </div>
    );
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      Página {currentPage} de {totalPages}
    </div>
  );
}

// Infinite scroll pagination component
interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
  loadingComponent?: React.ReactNode;
}

export function InfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
  children,
  className = '',
  loadingComponent
}: InfiniteScrollProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasMore || loading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    // Also check if we need to load more on initial render
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div ref={containerRef} className={`overflow-auto ${className}`}>
      {children}
      
      {loading && (
        <div className="flex justify-center py-4">
          {loadingComponent || (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              <span className="text-sm">Cargando más...</span>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No hay más resultados
        </div>
      )}
    </div>
  );
}

// Load more button component
interface LoadMoreButtonProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LoadMoreButton({
  hasMore,
  loading,
  onLoadMore,
  className = '',
  children = 'Cargar más'
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No hay más resultados
      </div>
    );
  }

  return (
    <div className={`text-center py-4 ${className}`}>
      <Button
        onClick={onLoadMore}
        disabled={loading}
        variant="outline"
        className="min-w-32"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Cargando...</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}