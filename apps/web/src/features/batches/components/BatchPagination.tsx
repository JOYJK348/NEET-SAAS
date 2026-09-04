'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BatchPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  className?: string;
}

export function BatchPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
}: BatchPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) =>
      page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1),
  );

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 text-xs font-medium text-slate-600',
        className,
      )}
    >
      <div className="text-xs text-slate-500">
        Showing <span className="font-extrabold text-[#0B2447]">{startItem}</span> to{' '}
        <span className="font-extrabold text-[#0B2447]">{endItem}</span> of{' '}
        <span className="font-extrabold text-[#0B2447]">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl bg-white text-[#0B2447] font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
            aria-label="Items per page"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            className="rounded-xl border-slate-200 h-8 w-8 text-slate-600 hover:text-[#0052CC] hover:bg-blue-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="rounded-xl border-slate-200 h-8 w-8 text-slate-600 hover:text-[#0052CC] hover:bg-blue-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="icon"
              onClick={() => onPageChange(page)}
              className={cn(
                'h-8 w-8 rounded-xl font-bold text-xs',
                page === currentPage
                  ? 'bg-[#0052CC] hover:bg-blue-700 text-white shadow-2xs'
                  : 'border-slate-200 text-slate-700 hover:text-[#0052CC] hover:bg-blue-50',
              )}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="rounded-xl border-slate-200 h-8 w-8 text-slate-600 hover:text-[#0052CC] hover:bg-blue-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
            className="rounded-xl border-slate-200 h-8 w-8 text-slate-600 hover:text-[#0052CC] hover:bg-blue-50"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
