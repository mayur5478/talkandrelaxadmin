import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../v2/_lib/PageHeader';
import { Card, CardHeader, CardTitle, Button, ErrorBanner, Skeleton, Pill } from '../v2/ui';
import { useBriefMutation } from '../../services/agent';
import MarkdownLite from './MarkdownLite';
import TraceAccordion from './TraceAccordion';
import AgentChat from './AgentChat';

/*
 * Agent — /dashboard/agent. Read-only chief-of-staff agent.
 * Step 5: the daily briefing card + the tool trace. Chat comes in step 6.
 */
export default function Agent() {
  const [runBrief, { data: briefing, isLoading, error }] = useBriefMutation();

  // Load the cached briefing on mount (force:false hits the 1-hour cache).
  useEffect(() => {
    runBrief({ force: false });
  }, [runBrief]);

  const regenerate = () => runBrief({ force: true });

  const httpError = error ? error.data?.error || error.error || 'Request failed' : null;
  const loopError = briefing && briefing.error ? briefing.error : null;
  const traceCount = briefing && briefing.tool_trace ? briefing.tool_trace.length : 0;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <PageHeader
        title="Agent"
        description="Read-only chief-of-staff agent. Daily briefing and the trace of every tool call behind it."
        primaryAction={
          <Button onClick={regenerate} loading={isLoading}>
            <RefreshCw size={14} aria-hidden />
            Regenerate
          </Button>
        }
      />

      {httpError && <ErrorBanner title="Could not reach the agent" message={httpError} />}

      {/* Briefing card */}
      <Card>
        <CardHeader
          action={
            briefing && briefing.date ? (
              <span className="tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums">
                {briefing.date}
                {briefing.cached ? ' · cached' : ''}
              </span>
            ) : null
          }
        >
          <CardTitle>Today's briefing</CardTitle>
        </CardHeader>

        {isLoading && (
          <div className="tw-flex tw-flex-col tw-gap-2 tw-py-1">
            <div className="tw-text-[12px] tw-text-fg-tertiary tw-mb-1">
              Running the agent — this can take up to a minute.
            </div>
            <Skeleton className="tw-h-4 tw-w-2/3" />
            <Skeleton className="tw-h-4 tw-w-full" />
            <Skeleton className="tw-h-4 tw-w-5/6" />
            <Skeleton className="tw-h-4 tw-w-3/4" />
          </div>
        )}

        {!isLoading && loopError && (
          <ErrorBanner title="The agent run failed" message={loopError} />
        )}

        {!isLoading && !loopError && briefing && briefing.content && (
          <MarkdownLite text={briefing.content} />
        )}

        {!isLoading && !loopError && briefing && !briefing.content && (
          <div className="tw-text-[13px] tw-text-fg-tertiary tw-py-1">
            The agent returned no briefing text.
          </div>
        )}

        {!isLoading && briefing && briefing.stopped_at_cap && (
          <div className="tw-mt-3">
            <Pill tone="warning">Stopped at iteration cap — output may be incomplete</Pill>
          </div>
        )}
      </Card>

      {/* Tool trace */}
      <Card flush>
        <div className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary">
          <CardTitle>Tool trace</CardTitle>
          {briefing && briefing.tool_trace && (
            <span className="tw-text-[11px] tw-text-fg-tertiary tw-tabular-nums">
              {traceCount} call{traceCount === 1 ? '' : 's'}
              {typeof briefing.iterations === 'number' ? ` · ${briefing.iterations} iterations` : ''}
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="tw-px-4 tw-py-6 tw-text-center tw-text-[12px] tw-text-fg-tertiary">
            Waiting for the agent.
          </div>
        ) : (
          <TraceAccordion items={briefing && briefing.tool_trace} />
        )}
      </Card>

      {/* Chat */}
      <AgentChat />
    </div>
  );
}
