import React, { useState, useId } from 'react';
import { cn } from '../../../lib/cn';

/**
 * Tooltip — text label that appears on focus or hover.
 *
 *   <Tooltip label="Export to CSV"><IconButton aria-label="Export"><Download size={14}/></IconButton></Tooltip>
 *
 * The wrapped child gets `aria-describedby` automatically when shown.
 * Position: top|right|bottom|left (default top).
 */
export function Tooltip({ label, side = 'top', delay = 200, children }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = React.useRef(null);

  const show = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { clearTimeout(timer.current); setOpen(false); };

  const child = React.Children.only(children);
  const cloned = React.cloneElement(child, {
    onMouseEnter: (e) => { child.props.onMouseEnter?.(e); show(); },
    onMouseLeave: (e) => { child.props.onMouseLeave?.(e); hide(); },
    onFocus: (e) => { child.props.onFocus?.(e); show(); },
    onBlur:  (e) => { child.props.onBlur?.(e); hide(); },
    'aria-describedby': open ? id : child.props['aria-describedby'],
  });

  const sides = {
    top:    'tw-bottom-full tw-left-1/2 -tw-translate-x-1/2 tw-mb-1',
    bottom: 'tw-top-full tw-left-1/2 -tw-translate-x-1/2 tw-mt-1',
    left:   'tw-right-full tw-top-1/2 -tw-translate-y-1/2 tw-mr-1',
    right:  'tw-left-full tw-top-1/2 -tw-translate-y-1/2 tw-ml-1',
  };

  return (
    <span className="tw-relative tw-inline-flex">
      {cloned}
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{ background: 'var(--color-tooltip-bg)', color: 'var(--color-tooltip-fg)' }}
          className={cn(
            'tw-absolute tw-z-50 tw-whitespace-nowrap tw-px-2 tw-py-1 tw-rounded-sm',
            'tw-text-[11px] tw-font-medium tw-shadow-md tw-pointer-events-none',
            'tw-animate-fade-in',
            sides[side] || sides.top,
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * TooltipPill — Recharts custom Tooltip renderer. Pass to <Tooltip>'s
 * `content` prop:
 *
 *   <Tooltip content={<TooltipPill />} />
 *
 * Single-value pill matching the screenshot's look.
 */
export function TooltipPill({ active, payload, formatter }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div
      role="tooltip"
      className="tw-px-2 tw-py-1 tw-rounded-sm tw-text-[11px] tw-font-medium tw-tabular-nums tw-shadow-md"
      style={{ background: 'var(--color-tooltip-bg)', color: 'var(--color-tooltip-fg)' }}
    >
      {formatter ? formatter(v) : v}
    </div>
  );
}
