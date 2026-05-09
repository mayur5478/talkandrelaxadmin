import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../../lib/cn';

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
        'tw-px-4 tw-py-3',
        'tw-border-t tw-border-hairline tw-border-tertiary',
        'tw-bg-bg-secondary/40',
        className,
      )}
    >
      {/* Rows per page */}
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-text-[12px] tw-text-fg-tertiary tw-whitespace-nowrap tw-font-medium">
          Rows per page
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            const v = e.target.value;
            onPageSize?.(v === 'all' ? 'all' : Number(v));
          }}
          className={cn(
            'tw-h-7 tw-px-2 tw-pr-6 tw-text-[12px] tw-font-medium tw-rounded-lg tw-tabular-nums',
            'tw-bg-bg-primary tw-text-fg-primary',
            'tw-border tw-border-hairline tw-border-tertiary',
            'tw-shadow-xs tw-cursor-pointer',
            'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
            'tw-transition-colors tw-duration-100',
            'hover:tw-border-[var(--color-border-tertiary)]',
          )}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
          ))}
        </select>
      </div>

      {/* Count + nav */}
      <div className="tw-flex tw-items-center tw-gap-4">
        <span className="tw-text-[12px] tw-text-fg-tertiary tw-tabular-nums tw-font-medium">
          <span className="tw-text-fg-primary">{from}–{to}</span>
          {' '}of{' '}
          <span className="tw-text-fg-primary">{totalRecords.toLocaleString('en-IN')}</span>
        </span>

        {/* Nav button group */}
        <div className="tw-flex tw-items-center tw-gap-0.5 tw-bg-bg-secondary tw-border tw-border-hairline tw-border-tertiary tw-rounded-lg tw-p-0.5">
          <NavBtn label="First page"    disabled={isAll || page <= 1}         onClick={() => onPageChange?.(1)}>
            <ChevronsLeft size={13} />
          </NavBtn>
          <NavBtn label="Previous page" disabled={isAll || page <= 1}         onClick={() => onPageChange?.(page - 1)}>
            <ChevronLeft size={13} />
          </NavBtn>
          <span className="tw-px-2 tw-text-[12px] tw-font-semibold tw-text-fg-primary tw-tabular-nums tw-select-none">
            {page}
          </span>
          <NavBtn label="Next page"     disabled={isAll || page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
            <ChevronRight size={13} />
          </NavBtn>
          <NavBtn label="Last page"     disabled={isAll || page >= totalPages} onClick={() => onPageChange?.(totalPages)}>
            <ChevronsRight size={13} />
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
        'tw-w-6 tw-h-6 tw-grid tw-place-items-center tw-rounded-md',
        'tw-text-fg-secondary tw-transition-all tw-duration-100',
        'hover:tw-bg-bg-primary hover:tw-text-fg-primary hover:tw-shadow-xs',
        'active:tw-scale-90',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
        'disabled:tw-opacity-25 disabled:tw-cursor-not-allowed disabled:hover:tw-bg-transparent disabled:hover:tw-shadow-none',
      )}
    >
      {children}
    </button>
  );
}
