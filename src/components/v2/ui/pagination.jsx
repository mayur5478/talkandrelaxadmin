import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../../lib/cn';

/**
 * Pagination — shared control strip used by every table page.
 *
 * Props:
 *   page          {number}           current 1-based page
 *   totalPages    {number}           total page count
 *   totalRecords  {number}           total record count
 *   pageSize      {number|'all'}     current page size
 *   onPageChange  {(n: number) => void}
 *   onPageSize    {(v: number|'all') => void}
 *   pageSizeOptions {(number|'all')[]}  defaults shown below
 */

const DEFAULT_SIZES = [5, 10, 20, 30, 50, 100, 'all'];

export function Pagination({
  page = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  onPageChange,
  onPageSize,
  pageSizeOptions = DEFAULT_SIZES,
  className,
}) {
  const isAll = pageSize === 'all';
  const from = isAll ? 1 : (page - 1) * pageSize + 1;
  const to   = isAll ? totalRecords : Math.min(page * pageSize, totalRecords);

  return (
    <div
      className={cn(
        'tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3',
        'tw-px-4 tw-py-3 tw-border-t tw-border-hairline tw-border-tertiary',
        className,
      )}
    >
      {/* Page-size selector */}
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-[12px] tw-text-fg-tertiary tw-whitespace-nowrap">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            const v = e.target.value;
            onPageSize?.(v === 'all' ? 'all' : Number(v));
          }}
          className={cn(
            'tw-h-7 tw-px-2 tw-text-[12px] tw-rounded-md tw-tabular-nums',
            'tw-bg-bg-secondary tw-text-fg-primary',
            'tw-border tw-border-hairline tw-border-tertiary',
            'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
          )}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
          ))}
        </select>
      </div>

      {/* Count + nav */}
      <div className="tw-flex tw-items-center tw-gap-4">
        <span className="tw-text-[12px] tw-text-fg-tertiary tw-tabular-nums">
          {from}–{to} of {totalRecords}
        </span>
        <div className="tw-flex tw-items-center tw-gap-1">
          <NavBtn
            label="First page"
            disabled={isAll || page <= 1}
            onClick={() => onPageChange?.(1)}
          >
            <ChevronsLeft size={14} />
          </NavBtn>
          <NavBtn
            label="Previous page"
            disabled={isAll || page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            <ChevronLeft size={14} />
          </NavBtn>
          <NavBtn
            label="Next page"
            disabled={isAll || page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
          >
            <ChevronRight size={14} />
          </NavBtn>
          <NavBtn
            label="Last page"
            disabled={isAll || page >= totalPages}
            onClick={() => onPageChange?.(totalPages)}
          >
            <ChevronsRight size={14} />
          </NavBtn>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-md',
        'tw-text-fg-secondary tw-transition-colors tw-duration-fast',
        'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
        'disabled:tw-opacity-30 disabled:tw-cursor-not-allowed disabled:hover:tw-bg-transparent',
      )}
    >
      {children}
    </button>
  );
}
