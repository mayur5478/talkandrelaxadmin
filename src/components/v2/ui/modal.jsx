import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../../lib/cn';

/**
 * Modal — accessible dialog with focus trap, ESC dismissal, and
 * spring-physics scale-in via the `tw-animate-fade-in` keyframes.
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Edit user">
 *     <ModalBody>…fields…</ModalBody>
 *     <ModalFooter>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button onClick={save}>Save</Button>
 *     </ModalFooter>
 *   </Modal>
 *
 * Implementation notes:
 *   - Renders into document.body via a portal so transformed ancestors
 *     don't break the fixed positioning.
 *   - Locks page scroll while open.
 *   - Returns focus to whatever element was focused before opening.
 *   - Tab/Shift+Tab cycles within the panel; ESC closes.
 *   - role="dialog" + aria-modal + aria-labelledby for screen readers.
 */
export function Modal({ open, onClose, title, description, children, size = 'md' }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const titleId = useId('modal-title');
  const descId = useId('modal-desc');

  // Save + restore focus
  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement;
      // Focus the panel itself (panel has tabindex=-1)
      requestAnimationFrame(() => panelRef.current?.focus());
    } else if (restoreRef.current) {
      try { restoreRef.current.focus(); } catch { /* element gone */ }
      restoreRef.current = null;
    }
  }, [open]);

  // Lock page scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC + focus trap
  const onKey = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onKey]);

  if (!open) return null;

  const widths = {
    sm: 'tw-max-w-sm', md: 'tw-max-w-md', lg: 'tw-max-w-lg', xl: 'tw-max-w-2xl',
  };

  return createPortal(
    <div className="tw-fixed tw-inset-0 tw-z-[60] tw-flex tw-items-start tw-justify-center tw-pt-[12vh] tw-px-4 tw-animate-fade-in">
      <div onClick={onClose} aria-hidden className="tw-absolute tw-inset-0 tw-bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'tw-relative tw-w-full tw-bg-bg-primary tw-rounded-lg',
          'tw-border tw-border-hairline tw-border-tertiary tw-shadow-lg',
          'focus:tw-outline-none',
          widths[size] || widths.md,
        )}
      >
        {(title || description) && (
          <div className="tw-flex tw-items-start tw-gap-3 tw-p-4 tw-border-b tw-border-hairline tw-border-tertiary">
            <div className="tw-flex-1 tw-min-w-0">
              {title && <h2 id={titleId} className="tw-text-h2 tw-text-fg-primary tw-m-0">{title}</h2>}
              {description && <p id={descId} className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-sm tw-text-fg-secondary hover:tw-bg-bg-secondary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ModalBody({ className, children }) {
  return <div className={cn('tw-p-4', className)}>{children}</div>;
}

export function ModalFooter({ className, children }) {
  return (
    <div className={cn('tw-flex tw-items-center tw-justify-end tw-gap-2 tw-p-4 tw-border-t tw-border-hairline tw-border-tertiary', className)}>
      {children}
    </div>
  );
}

// Minimal useId polyfill for React < 18 that already has it; otherwise pass-through.
function useId(prefix = 'id') {
  const ref = useRef(null);
  if (!ref.current) {
    ref.current = `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return ref.current;
}
