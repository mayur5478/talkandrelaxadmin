import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { EmptyState, Skeleton } from './state';

/**
 * Table — semantic v2 table primitive.
 *
 * Composition:
 *   <Table>
 *     <THead>
 *       <TR>
 *         <Th sortable sortKey="amount" sort={sort} onSort={setSort}>Amount</Th>
 *         <Th>Status</Th>
 *       </TR>
 *     </THead>
 *     <TBody>
 *       <TR><Td>…</Td><Td>…</Td></TR>
 *     </TBody>
 *   </Table>
 *
 * Standalone helpers:
 *   <TableSkeleton rows={5} cols={6} />
 *   <TableEmpty title="…" description="…" />
 */

export function Table({ className, children, ...rest }) {
  return (
    <div className="tw-overflow-x-auto">
      <table className={cn('tw-w-full tw-text-[12px]', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TR({ className, isLast, children, ...rest }) {
  return (
    <tr
      className={cn(
        'tw-transition-colors tw-duration-fast hover:tw-bg-bg-secondary',
        !isLast && 'tw-border-b tw-border-hairline tw-border-tertiary',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

/**
 * Th — sortable when given `sortable` + `sortKey` + `sort` + `onSort`.
 *
 * The sort state shape is { key: string, dir: 'asc' | 'desc' | null }.
 */
export function Th({ align = 'left', sortable, sortKey, sort, onSort, className, children }) {
  const ariaSort =
    sortable && sort?.key === sortKey
      ? sort.dir === 'asc' ? 'ascending' : sort.dir === 'desc' ? 'descending' : 'none'
      : sortable ? 'none' : undefined;

  const cycle = () => {
    if (!sortable || !onSort) return;
    let dir = 'asc';
    if (sort?.key === sortKey) {
      dir = sort.dir === 'asc' ? 'desc' : sort.dir === 'desc' ? null : 'asc';
    }
    onSort(dir ? { key: sortKey, dir } : { key: null, dir: null });
  };

  const Icon =
    sort?.key === sortKey
      ? sort.dir === 'asc' ? ChevronUp : sort.dir === 'desc' ? ChevronDown : ChevronsUpDown
      : ChevronsUpDown;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        'tw-text-eyebrow tw-text-fg-tertiary tw-font-medium tw-px-4 tw-py-2',
        align === 'right' ? 'tw-text-right' : 'tw-text-left',
        className,
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={cycle}
          className={cn(
            'tw-inline-flex tw-items-center tw-gap-1',
            'tw-text-eyebrow tw-text-fg-tertiary tw-font-medium',
            'tw-rounded-sm hover:tw-text-fg-primary',
            'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
          )}
        >
          <span>{children}</span>
          <Icon size={12} aria-hidden className={sort?.key === sortKey ? 'tw-text-fg-primary' : ''} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function Td({ align = 'left', className, children, ...rest }) {
  return (
    <td
      className={cn(
        'tw-px-4 tw-py-3 tw-text-fg-secondary tw-tabular-nums',
        align === 'right' ? 'tw-text-right' : 'tw-text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <Table>
      <TBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TR key={r} isLast={r === rows - 1}>
            {Array.from({ length: cols }).map((__, c) => (
              <Td key={c}>
                <Skeleton className="tw-h-4 tw-w-24" />
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
