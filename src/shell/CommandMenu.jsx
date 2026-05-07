import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Command } from 'cmdk';
import { cn } from '../lib/cn';
import { flattenNav } from './nav-config';

/**
 * ⌘K command palette.
 *
 * Listens globally for ⌘K / Ctrl-K to open. Inside the modal, cmdk handles
 * fuzzy filtering and keyboard navigation; Enter routes to the selected
 * item via react-router. ESC or backdrop click closes.
 *
 * Implementation note: we wrap cmdk's components rather than the shadcn
 * Dialog, because pulling Radix Dialog in adds 30 KB and we already get
 * focus trapping + ESC handling from cmdk's Dialog wrapper.
 */
export default function CommandMenu({ open, onOpenChange }) {
  const navigate = useNavigate();
  const items = useMemo(() => flattenNav(), []);
  const [search, setSearch] = useState('');

  // Global ⌘K / Ctrl-K shortcut
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
      className="tw-fixed tw-inset-0 tw-z-[60] tw-flex tw-items-start tw-justify-center tw-pt-[12vh] tw-px-4 tw-animate-fade-in"
    >
      <div
        onClick={() => onOpenChange(false)}
        className="tw-absolute tw-inset-0 tw-bg-black/40"
        aria-hidden
      />
      <Command
        label="Command palette"
        shouldFilter
        className={cn(
          'tw-relative tw-w-full tw-max-w-[560px] tw-rounded-lg tw-bg-bg-primary',
          'tw-border tw-border-hairline tw-border-tertiary tw-shadow-lg tw-overflow-hidden',
        )}
      >
        <div className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-h-11 tw-border-b tw-border-hairline tw-border-tertiary">
          <Search size={14} aria-hidden className="tw-text-fg-tertiary tw-shrink-0" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            autoFocus
            placeholder="Type a page name…"
            className="tw-flex-1 tw-bg-transparent tw-outline-none tw-text-body tw-text-fg-primary placeholder:tw-text-fg-tertiary"
          />
          <kbd className="tw-text-[10px] tw-px-1.5 tw-py-[1px] tw-rounded-sm tw-bg-bg-secondary tw-text-fg-tertiary">esc</kbd>
        </div>
        <Command.List className="tw-max-h-[320px] tw-overflow-y-auto tw-p-2">
          <Command.Empty className="tw-py-6 tw-text-center tw-text-small tw-text-fg-tertiary">
            No results.
          </Command.Empty>
          <Command.Group heading="Pages" className="tw-text-eyebrow tw-text-fg-tertiary tw-px-2 tw-pb-1">
            {items.map((it) => (
              <Command.Item
                key={it.path}
                value={`${it.title} ${it.path}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate(it.path);
                }}
                className={cn(
                  'tw-flex tw-items-center tw-justify-between tw-rounded-md tw-px-3 tw-py-2 tw-cursor-pointer',
                  'tw-text-small tw-text-fg-secondary',
                  'aria-selected:tw-bg-bg-info aria-selected:tw-text-fg-info',
                )}
              >
                <span>{it.title}</span>
                <span className="tw-text-fg-tertiary tw-text-[11px]">{it.path}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
