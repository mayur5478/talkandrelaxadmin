import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { EmptyState, Skeleton } from './state';

/**
 * Table — premium v2 data table.
 *
 * Features:
 *  - Sticky thead with glass-blur effect
 *  - Smooth row-hover highlight
 *  - Sortable column headers with animated icons
 *  - Alternating row tints (optional via `striped` prop on TBody)
 *
 * Usage:
 *   <Table>
 *     <THead>
 *       <TR>
 *         <Th>Name</Th>
 *         <Th sortable sortKey="amount" sort={sort} onSort={setSort}>Amount</Th>
 *       </TR>
 *     </THead>
 *     <TBody>
 *       <TR isLast><Td>…</Td></TR>
 *     </TBody>
 *   </Table>
 */

export function Table({ className, children, ...rest }) {
  return (
    <div className="tw-w-full tw-overflow-x-auto">
      <table
        className={cn('tw-w-full tw-border-collapse tw-text-[12.5px]', className)}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className }) {
  return (
    <thead
      className={cn(
        'tw-sticky tw-top-0 tw-z-10',
        'tw-bg-bg-secondary/80',
        'tw-backdrop-blur-sm',
        'tw-border-b tw-border-hairline tw-border-tertiary',
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, striped, className }) {
  /* Pass striped down via context-free index hack */
  return (
    <tbody className={cn(striped && 'tw-divide-y tw-divide-[var(--color-border-tertiary)]', className)}>
      {children}
    </tbody>
  );
}

export function TR({ className, isLast, highlight, children, ...rest }) {
  return (
    <tr
      className={cn(
        'tw-group tw-transition-colors tw-duration-100',
        'hover:tw-bg-fg-info/[.04]',
        !isLast && 'tw-border-b tw-border-hairline tw-border-tertiary',
        highlight && 'tw-bg-fg-info/[.03]',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Th({
  align = 'left',
  sortable,
  sortKey,
  sort,
  onSort,
  className,
  children,
}) {
  const isActive = sortable && sort?.key === sortKey;
  const dir = isActive ? sort.dir : null;

  const ariaSort = isActive
    ? dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
    : sortable ? 'none' : undefined;

  const cycle = () => {
    if (!sortable || !onSort) return;
    const next = !isActive ? 'asc' : dir === 'asc' ? 'desc' : dir === 'desc' ? null : 'asc';
    onSort(next ? { key: sortKey, dir: next } : { key: null, dir: null });
  };

  const Icon = isActive
    ? dir === 'asc' ? ChevronUp : dir === 'desc' ? ChevronDown : ChevronsUpDown
    : ChevronsUpDown;

  const inner = sortable ? (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'tw-inline-flex tw-items-center tw-gap-1',
        'tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.06em]',
        'tw-text-fg-tertiary',
        'tw-rounded-sm hover:tw-text-fg-primary',
        'tw-transition-colors tw-duration-100',
        'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
        isActive && 'tw-text-fg-primary',
      )}
    >
      <span>{children}</span>
      <Icon
        size={11}
        aria-hidden
        className={cn(
          'tw-transition-transform tw-duration-150',
          isActive ? 'tw-text-fg-info' : 'tw-opacity-40',
        )}
      />
    </button>
  ) : (
    <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.06em] tw-text-fg-tertiary">
      {children}
    </span>
  );

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        'tw-px-4 tw-py-2.5',
        align === 'right' ? 'tw-text-right' : 'tw-text-left',
        className,
      )}
    >
      {inner}
    </th>
  );
}

export function Td({ align = 'left', className, children, ...rest }) {
  return (
    <td
      className={cn(
        'tw-px-4 tw-py-3',
        'tw-text-[13px] tw-text-fg-secondary tw-leading-snug',
        'tw-transition-colors tw-duration-100',
        align === 'right' ? 'tw-text-right tw-tabular-nums' : 'tw-text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <Table>
      <TBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TR key={r} isLast={r === rows - 1}>
            {Array.from({ length: cols }).map((__, c) => (
              <Td key={c}>
                <div
                  className="tw-h-4 tw-rounded-md shimmer"
                  style={{ width: `${55 + ((r * 3 + c * 7) % 35)}%` }}
                />
              </Td>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export function TableEmpty(props) {
  return <EmptyState {...props} />;
}
