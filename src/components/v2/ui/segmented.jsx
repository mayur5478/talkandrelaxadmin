import React from 'react';
import { cn } from '../../../lib/cn';

/**
 * Segmented control — exclusive selection (radio-tab pattern).
 * Implemented as role="tablist" so screen readers announce the current
 * selection. Native left/right arrow keys move focus through tabs.
 *
 *   <Segmented
 *     value={range}
 *     onChange={setRange}
 *     options={[{ value: '7d', label: '7d' }, ...]}
 *   />
 */
export function Segmented({ value, onChange, options, ariaLabel = 'Time range' }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="tw-inline-flex tw-bg-bg-secondary tw-rounded-sm tw-p-[2px] tw-gap-[2px]">
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              'tw-text-[11px] tw-font-medium tw-px-2 tw-py-1 tw-rounded-sm tw-tabular-nums',
              'tw-transition-colors tw-duration-fast tw-ease-out-soft',
              'focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info',
              active
                ? 'tw-bg-bg-primary tw-text-fg-primary tw-shadow-xs'
                : 'tw-text-fg-secondary hover:tw-text-fg-primary',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
