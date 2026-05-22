import React, { useState } from 'react';
import { Wrench, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';

/*
 * TraceAccordion — collapsible list of the agent's tool calls. This is the
 * surface that builds trust before write access is ever granted: every call,
 * its input, its output preview, and how long it took.
 */

function summarize(entry) {
  if (entry.error) return 'error';
  try {
    const parsed = JSON.parse(entry.output_preview);
    if (parsed && typeof parsed.row_count === 'number') {
      return `${parsed.row_count} row${parsed.row_count === 1 ? '' : 's'}`;
    }
  } catch {
    /* output_preview is truncated JSON or plain text — fall through */
  }
  const len = entry.output_preview ? entry.output_preview.length : 0;
  return `${len} chars`;
}

function TraceItem({ entry, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('tw-border-b tw-border-hairline tw-border-tertiary', isLast && 'tw-border-b-0')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2.5 tw-text-left hover:tw-bg-bg-secondary tw-transition-colors"
      >
        <ChevronRight
          size={14}
          aria-hidden
          className={cn('tw-text-fg-tertiary tw-transition-transform tw-shrink-0', open && 'tw-rotate-90')}
        />
        <Wrench size={13} aria-hidden className="tw-text-fg-tertiary tw-shrink-0" />
        <span className="tw-text-[12px] tw-font-medium tw-text-fg-primary">{entry.tool_name}</span>
        <span className="tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums">· {entry.duration_ms}ms</span>
        <span
          className={cn(
            'tw-text-[11px] tw-tabular-nums',
            entry.error ? 'tw-text-fg-danger' : 'tw-text-fg-tertiary',
          )}
        >
          · {summarize(entry)}
        </span>
        {entry.error && <AlertTriangle size={12} aria-hidden className="tw-text-fg-danger tw-ml-auto tw-shrink-0" />}
      </button>

      {open && (
        <div className="tw-px-4 tw-pb-3 tw-pl-10 tw-flex tw-flex-col tw-gap-2">
          <div>
            <div className="tw-text-[11px] tw-font-semibold tw-text-fg-tertiary tw-uppercase tw-tracking-wide tw-mb-1">
              Input
            </div>
            <pre className="tw-text-[11px] tw-bg-bg-secondary tw-rounded-md tw-p-2 tw-overflow-x-auto tw-text-fg-secondary tw-m-0">
              {JSON.stringify(entry.input, null, 2)}
            </pre>
          </div>
          <div>
            <div className="tw-text-[11px] tw-font-semibold tw-text-fg-tertiary tw-uppercase tw-tracking-wide tw-mb-1">
              Output preview
            </div>
            <pre className="tw-text-[11px] tw-bg-bg-secondary tw-rounded-md tw-p-2 tw-overflow-x-auto tw-text-fg-secondary tw-m-0 tw-max-h-64">
              {entry.output_preview}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TraceAccordion({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="tw-px-4 tw-py-6 tw-text-center tw-text-[12px] tw-text-fg-tertiary">
        No tool calls.
      </div>
    );
  }
  return (
    <div>
      {items.map((entry, i) => (
        <TraceItem key={entry.audit_id || i} entry={entry} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}
