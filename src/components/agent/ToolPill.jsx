import React, { useState } from 'react';
import { Wrench, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';

/*
 * ToolPill — inline, expandable representation of one tool call inside a chat
 * answer. Collapsed: name, duration, a short result summary. Expanded: the
 * input and output preview.
 */

function summarize(tool) {
  if (tool.status === 'running') return 'running';
  if (tool.error) return 'error';
  try {
    const parsed = JSON.parse(tool.output_preview);
    if (parsed && typeof parsed.row_count === 'number') {
      return `${parsed.row_count} row${parsed.row_count === 1 ? '' : 's'}`;
    }
  } catch {
    /* truncated JSON or plain text */
  }
  return 'done';
}

export default function ToolPill({ tool }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tw-rounded-lg tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-secondary tw-overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tw-w-full tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1 tw-text-left hover:tw-bg-bg-tertiary tw-transition-colors"
      >
        <ChevronRight
          size={12}
          aria-hidden
          className={cn('tw-text-fg-tertiary tw-transition-transform tw-shrink-0', open && 'tw-rotate-90')}
        />
        <Wrench size={11} aria-hidden className="tw-text-fg-tertiary tw-shrink-0" />
        <span className="tw-text-[11px] tw-font-medium tw-text-fg-primary">{tool.name}</span>
        {typeof tool.duration_ms === 'number' && (
          <span className="tw-text-[10px] tw-text-fg-tertiary tw-tabular-nums">· {tool.duration_ms}ms</span>
        )}
        <span
          className={cn(
            'tw-text-[10px] tw-tabular-nums',
            tool.error ? 'tw-text-fg-danger' : 'tw-text-fg-tertiary',
          )}
        >
          · {summarize(tool)}
        </span>
        {tool.error && <AlertTriangle size={11} aria-hidden className="tw-text-fg-danger tw-ml-auto tw-shrink-0" />}
      </button>

      {open && (
        <div className="tw-px-2 tw-pb-2 tw-pl-7 tw-flex tw-flex-col tw-gap-1.5">
          <pre className="tw-text-[10px] tw-bg-bg-primary tw-rounded tw-p-1.5 tw-overflow-x-auto tw-text-fg-secondary tw-m-0">
            {JSON.stringify(tool.input, null, 2)}
          </pre>
          {tool.output_preview && (
            <pre className="tw-text-[10px] tw-bg-bg-primary tw-rounded tw-p-1.5 tw-overflow-x-auto tw-text-fg-secondary tw-m-0 tw-max-h-48">
              {tool.output_preview}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
