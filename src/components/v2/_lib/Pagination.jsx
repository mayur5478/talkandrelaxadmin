import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, IconButton, Tooltip } from '../ui';
import { cn } from '../../../lib/cn';

/**
 * Pagination — shared pagination strip for list pages.
 *
 *   <Pagination
 *     page={page} pageSize={pageSize} total={pagination.totalRecords}
 *     totalPages={pagination.totalPages}
 *     onPageChange={setPage} onPageSizeChange={setPageSize}
 *   />
 */
export function Pagination({
  page, pageSize, total, totalPages,
  onPageChange, onPageSizeChange,
  pageSizeOptions = [5, 10, 15, 20, 50],
  className,
}) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total || 0);

  return (
    <div className={cn('tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3 tw-px-4 tw-py-3', className)}>
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-[12px] tw-text-fg-secondary">
        <span>Rows per page</span>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="tw-w-[80px] tw-py-1 tw-px-2 tw-text-[12px]"
          aria-label="Rows per page"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-text-[12px] tw-text-fg-secondary tw-tabular-nums">
          <span className="tw-text-fg-primary tw-font-medium">{start}</span>–
          <span className="tw-text-fg-primary tw-font-medium">{end}</span>
          <span className="tw-text-fg-tertiary"> of </span>
          <span className="tw-text-fg-primary tw-font-medium">{total ?? 0}</span>
        </span>

        <div className="tw-flex tw-items-center tw-gap-1">
          <Tooltip label="First"><IconButton aria-label="First page" size="sm" disabled={page <= 1} onClick={() => onPageChange(1)}><ChevronsLeft size={14} /></IconButton></Tooltip>
          <Tooltip label="Previous"><IconButton aria-label="Previous page" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={14} /></IconButton></Tooltip>
          <Tooltip label="Next"><IconButton aria-label="Next page" size="sm" disabled={page >= (totalPages || 1)} onClick={() => onPageChange(page + 1)}><ChevronRight size={14} /></IconButton></Tooltip>
          <Tooltip label="Last"><IconButton aria-label="Last page" size="sm" disabled={page >= (totalPages || 1)} onClick={() => onPageChange(totalPages || 1)}><ChevronsRight size={14} /></IconButton></Tooltip>
        </div>
      </div>
    </div>
  );
}
