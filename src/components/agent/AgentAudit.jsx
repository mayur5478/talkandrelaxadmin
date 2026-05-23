import React, { useState, useMemo } from 'react';
import { RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../v2/_lib/PageHeader';
import {
  Card, CardTitle, Button, Select, Checkbox, ErrorBanner, EmptyState,
  Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill,
} from '../v2/ui';
import { useAuditLogQuery } from '../../services/agent';
import { cn } from '../../lib/cn';

/*
 * AgentAudit — /dashboard/agent/audit. Sortable, filterable table of every
 * tool call the agent made in the last 7 days. Sorting and filtering are
 * client-side; a row expands to show the call's input and output preview.
 */

const TOOL_NAMES = ['run_sql', 'get_app_metrics', 'generate_excel', 'draft_message', 'draft_content'];

export default function AgentAudit() {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useAuditLogQuery({ days: 7 });

  const [sort, setSort] = useState({ key: 'created_at', dir: 'desc' });
  const [toolFilter, setToolFilter] = useState('all');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const rows = (data && data.rows) || [];

  const view = useMemo(() => {
    let r = rows;
    if (toolFilter !== 'all') r = r.filter((x) => x.tool_name === toolFilter);
    if (errorsOnly) r = r.filter((x) => x.error);
    if (sort.key) {
      r = [...r].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (av < bv) return sort.dir === 'asc' ? -1 : 1;
        if (av > bv) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return r;
  }, [rows, toolFilter, errorsOnly, sort]);

  const httpError = error ? error.data?.error || error.error || 'Request failed' : null;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <PageHeader
        title="Agent audit log"
        description="Every tool call the agent made in the last 7 days."
        secondary={
          <Button variant="outline" onClick={() => navigate('/dashboard/agent')}>
            Briefing
          </Button>
        }
        primaryAction={
          <Button onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={14} aria-hidden />
            Refresh
          </Button>
        }
      />

      {httpError && <ErrorBanner title="Could not load the audit log" message={httpError} />}

      <Card flush>
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-border-b tw-border-hairline tw-border-tertiary tw-flex-wrap">
          <CardTitle>
            {view.length} tool call{view.length === 1 ? '' : 's'}
          </CardTitle>
          <div className="tw-flex tw-items-center tw-gap-3">
            <Select
              value={toolFilter}
              onChange={(e) => setToolFilter(e.target.value)}
              className="tw-h-7 tw-py-0 tw-text-[12px]"
            >
              <option value="all">All tools</option>
              {TOOL_NAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Checkbox
              label="Errors only"
              checked={errorsOnly}
              onChange={(e) => setErrorsOnly(e.target.checked)}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : view.length === 0 ? (
          <EmptyState
            title="No tool calls"
            description="Nothing in the selected window. The agent logs a row for every tool call it makes."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <Th sortable sortKey="created_at" sort={sort} onSort={setSort}>Time</Th>
                <Th sortable sortKey="tool_name" sort={sort} onSort={setSort}>Tool</Th>
                <Th sortable sortKey="duration_ms" sort={sort} onSort={setSort} align="right">Duration</Th>
                <Th>Admin</Th>
                <Th>Status</Th>
              </TR>
            </THead>
            <TBody>
              {view.map((row, i) => {
                const isOpen = expanded === row.id;
                const isLastRow = i === view.length - 1;
                return (
                  <React.Fragment key={row.id}>
                    <TR isLast={isLastRow && !isOpen}>
                      <Td>
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => (e === row.id ? null : row.id))}
                          className="tw-flex tw-items-center tw-gap-1 tw-text-fg-primary"
                        >
                          <ChevronRight
                            size={13}
                            aria-hidden
                            className={cn(
                              'tw-text-fg-tertiary tw-transition-transform',
                              isOpen && 'tw-rotate-90',
                            )}
                          />
                          <span className="tw-tabular-nums">{row.created_at}</span>
                        </button>
                      </Td>
                      <Td>{row.tool_name}</Td>
                      <Td align="right">{row.duration_ms == null ? '—' : `${row.duration_ms}ms`}</Td>
                      <Td>
                        {row.admin_user_id || <span className="tw-text-fg-tertiary">cron</span>}
                      </Td>
                      <Td>
                        {row.error ? (
                          <Pill tone="danger">Error</Pill>
                        ) : (
                          <Pill tone="success">OK</Pill>
                        )}
                      </Td>
                    </TR>
                    {isOpen && (
                      <TR isLast={isLastRow}>
                        <Td colSpan={5}>
                          <div className="tw-flex tw-flex-col tw-gap-2 tw-py-1">
                            {row.error && (
                              <div className="tw-flex tw-items-start tw-gap-1.5 tw-text-[12px] tw-text-fg-danger">
                                <AlertTriangle size={13} aria-hidden className="tw-shrink-0 tw-mt-0.5" />
                                {row.error}
                              </div>
                            )}
                            <div>
                              <div className="tw-text-[11px] tw-font-semibold tw-text-fg-tertiary tw-uppercase tw-tracking-wide tw-mb-1">
                                Input
                              </div>
                              <pre className="tw-text-[11px] tw-bg-bg-secondary tw-rounded-md tw-p-2 tw-overflow-x-auto tw-m-0 tw-text-fg-secondary">
                                {JSON.stringify(row.tool_input, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <div className="tw-text-[11px] tw-font-semibold tw-text-fg-tertiary tw-uppercase tw-tracking-wide tw-mb-1">
                                Output preview
                              </div>
                              <pre className="tw-text-[11px] tw-bg-bg-secondary tw-rounded-md tw-p-2 tw-overflow-x-auto tw-m-0 tw-text-fg-secondary tw-max-h-64">
                                {row.tool_output_preview || '—'}
                              </pre>
                            </div>
                          </div>
                        </Td>
                      </TR>
                    )}
                  </React.Fragment>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
