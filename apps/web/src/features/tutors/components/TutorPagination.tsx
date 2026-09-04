'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TutorPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const delta = 1;
  const range: (number | string)[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  return range;
}

export function TutorPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className,
}: TutorPaginationProps) {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border-t border-slate-200',
        className,
      )}
    >
      <div className="text-xs font-semibold text-slate-500">
        Showing <span className="font-extrabold text-[#0B2447]">{startItem}</span> &ndash;{' '}
        <span className="font-extrabold text-[#0B2447]">{endItem}</span> of{' '}
        <span className="font-extrabold text-[#0B2447]">{totalItems}</span> faculty members
      </div>

      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-bold text-[#0B2447] focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition-all"
              aria-label="Items per page"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-xs font-bold text-slate-400">
                  ...
                </span>
              );
            }
            const pageNum = page as number;
            const isCurrent = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'h-8 min-w-[32px] px-2.5 rounded-lg text-xs font-extrabold transition-all',
                  isCurrent
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                )}
                aria-label={`Page ${pageNum}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
