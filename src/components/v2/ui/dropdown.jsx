import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { cn } from '../../../lib/cn';

/**
 * Dropdown — keyboard-accessible menu with click-outside dismissal.
 *
 *   <Dropdown
 *     trigger={<Button variant="outline" size="sm">Sort by</Button>}
 *     items={[
 *       { label: 'Date', onSelect: () => …, icon: <Clock size={14} /> },
 *       { divider: true },
 *       { label: 'Amount', onSelect: () => … },
 *     ]}
 *   />
 *
 * Behaviour:
 *   - Trigger toggles open on click + Enter/Space.
 *   - ↓ moves focus into the menu, ↑/↓ cycle items, Enter activates,
 *     Escape closes and returns focus to the trigger.
 *   - Click outside closes.
 *   - role="menu" + role="menuitem" for screen readers.
 */
export function Dropdown({ trigger, items, align = 'right', menuClassName }) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const id = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setFocusIdx(-1);
    triggerRef.current?.focus();
  }, []);

  // Click outside
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
      setFocusIdx(-1);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Keyboard nav
  const onMenuKey = (e) => {
    const enabled = items.map((it, i) => (it.divider ? null : i)).filter((v) => v !== null);
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cur = enabled.indexOf(focusIdx);
      const next = cur < 0 ? enabled[0] : enabled[(cur + 1) % enabled.length];
      setFocusIdx(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cur = enabled.indexOf(focusIdx);
      const next = cur < 0 ? enabled[enabled.length - 1] : enabled[(cur - 1 + enabled.length) % enabled.length];
      setFocusIdx(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (focusIdx >= 0 && items[focusIdx] && !items[focusIdx].divider) {
        e.preventDefault();
        items[focusIdx].onSelect?.();
        close();
      }
    }
  };

  // Focus the right item when focusIdx changes
  useEffect(() => {
    if (!open || focusIdx < 0) return;
    const el = menuRef.current?.querySelector(`[data-idx="${focusIdx}"]`);
    el?.focus();
  }, [open, focusIdx]);

  return (
    <div className="tw-relative tw-inline-block">
      {React.cloneElement(trigger, {
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': id,
        onClick: (e) => {
          trigger.props.onClick?.(e);
          setOpen((v) => !v);
        },
        onKeyDown: (e) => {
          trigger.props.onKeyDown?.(e);
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setFocusIdx(0); }
        },
      })}
      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          tabIndex={-1}
          onKeyDown={onMenuKey}
          className={cn(
            'tw-absolute tw-z-50 tw-mt-1 tw-min-w-[180px]',
            'tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-shadow-md tw-p-1',
            'tw-animate-fade-in',
            align === 'right' ? 'tw-right-0' : 'tw-left-0',
            menuClassName,
          )}
        >
          {items.map((it, i) =>
            it.divider ? (
              <div key={`d-${i}`} role="separator" className="tw-h-px tw-my-1 tw-bg-bg-secondary" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                data-idx={i}
                disabled={it.disabled}
                onClick={() => { it.onSelect?.(); close(); }}
                className={cn(
                  'tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-2 tw-py-1.5 tw-rounded-sm',
                  'tw-text-small tw-text-fg-secondary tw-text-left',
                  'hover:tw-bg-bg-secondary hover:tw-text-fg-primary',
                  'focus:tw-outline-none focus:tw-bg-bg-secondary focus:tw-text-fg-primary',
                  'disabled:tw-opacity-50 disabled:tw-cursor-not-allowed',
                  it.tone === 'danger' && 'tw-text-fg-danger hover:tw-text-fg-danger',
                )}
              >
                {it.icon && <span className="tw-shrink-0">{it.icon}</span>}
                <span className="tw-flex-1 tw-truncate">{it.label}</span>
                {it.kbd && (
                  <kbd className="tw-text-[10px] tw-px-1 tw-py-[1px] tw-rounded-sm tw-bg-bg-secondary tw-text-fg-tertiary">{it.kbd}</kbd>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
