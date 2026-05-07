import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../../lib/cn';

/**
 * SearchBar — shared text-search input for list pages.
 * Uncontrolled-style debounced is up to caller; we expose value+onChange.
 */
export function SearchBar({ value, onChange, placeholder = 'Search', className }) {
  return (
    <div className={cn(
      'tw-relative tw-flex tw-items-center tw-h-8 tw-px-2 tw-w-full md:tw-w-[280px]',
      'tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md',
      'focus-within:tw-ring-2 focus-within:tw-ring-fg-info focus-within:tw-border-strong',
      className,
    )}>
      <Search size={14} aria-hidden className="tw-text-fg-tertiary tw-shrink-0 tw-mr-1" />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="tw-flex-1 tw-min-w-0 tw-bg-transparent tw-outline-none tw-text-[12px] tw-text-fg-primary placeholder:tw-text-fg-tertiary"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="tw-w-5 tw-h-5 tw-grid tw-place-items-center tw-rounded-sm tw-text-fg-tertiary hover:tw-text-fg-primary hover:tw-bg-bg-secondary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
        >
          <X size={10} aria-hidden />
        </button>
      )}
    </div>
  );
}
