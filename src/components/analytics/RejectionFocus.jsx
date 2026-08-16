/*
 * RejectionFocus — the HR reading of call rejections.
 *
 * The raw rejections table answers "what happened". This answers "who do we
 * need to talk to, and about what". Two exports so the same data serves both
 * surfaces without a second fetch path:
 *
 *   <RejectionFocusStrip />  compact banner for the Call Rejections page
 *   <RejectionFocus />       full per-listener scorecard for Penalty Management
 *
 * One deliberate guard: rejections caused by timeouts / unreachable devices are
 * counted separately from deliberate declines. A listener whose failures are
 * mostly technical is a reachability problem, not a discipline problem, and the
 * UI says so — otherwise HR penalises people for the platform's plumbing.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Eye, Info, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { useGetRejectionFocusQuery } from "../../services/monitoring";
import { Table, THead, TBody, TR, Th, Td, TableSkeleton } from "../v2/ui";

const LEVEL_STYLE = {
  critical: { icon: AlertTriangle, cls: "tw-text-red-400", bg: "tw-bg-red-500/10", border: "tw-border-red-500/30" },
  warning: { icon: AlertCircle, cls: "tw-text-amber-400", bg: "tw-bg-amber-500/10", border: "tw-border-amber-500/30" },
  watch: { icon: Eye, cls: "tw-text-amber-400", bg: "tw-bg-amber-500/10", border: "tw-border-amber-500/30" },
  info: { icon: Info, cls: "tw-text-fg-info", bg: "tw-bg-fg-info/10", border: "tw-border-fg-info/30" },
  ok: { icon: CheckCircle2, cls: "tw-text-green-400", bg: "tw-bg-green-500/10", border: "tw-border-green-500/30" },
};

function SeverityBadge({ severity }) {
  if (severity === "ok") return <span className="tw-text-fg-tertiary tw-text-xs">—</span>;
  const s = LEVEL_STYLE[severity] || LEVEL_STYLE.info;
  const Icon = s.icon;
  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full ${s.bg} ${s.cls}`}>
      <Icon size={11} aria-hidden />
      {severity}
    </span>
  );
}

function Trend({ pct }) {
  if (pct == null) return <span className="tw-text-fg-tertiary">—</span>;
  if (pct === 0) return <span className="tw-text-fg-tertiary">flat</span>;
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`tw-inline-flex tw-items-center tw-gap-1 ${up ? "tw-text-red-400" : "tw-text-green-400"}`}>
      <Icon size={12} aria-hidden />
      {up ? "+" : ""}{pct}%
    </span>
  );
}

function FocusCards({ focus = [] }) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      {focus.map((f, i) => {
        const s = LEVEL_STYLE[f.level] || LEVEL_STYLE.info;
        const Icon = s.icon;
        return (
          <div key={i} className={`tw-flex tw-gap-2.5 tw-items-start tw-rounded-lg tw-border ${s.border} ${s.bg} tw-px-3 tw-py-2.5`}>
            <Icon size={15} aria-hidden className={`${s.cls} tw-mt-0.5 tw-shrink-0`} />
            <div className="tw-min-w-0">
              <div className={`tw-text-[13px] tw-font-semibold ${s.cls}`}>{f.headline}</div>
              {f.detail && <div className="tw-text-[12px] tw-text-fg-secondary tw-mt-0.5">{f.detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Compact strip: sits above the raw rejections table ───────────────────── */
export function RejectionFocusStrip({ days = 7 }) {
  const { data, isLoading, error } = useGetRejectionFocusQuery(days);
  const [open, setOpen] = useState(true);

  if (isLoading) return <div className="tw-h-16 tw-rounded-lg tw-bg-bg-secondary tw-animate-pulse" />;
  if (error || !data) return null;

  const s = data.summary || {};
  return (
    <div className="tw-rounded-xl tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-secondary tw-p-3">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-flex-wrap">
        <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap tw-text-[13px]">
          <span className="tw-font-semibold tw-text-fg-primary">Where to focus</span>
          <span className="tw-text-fg-tertiary">last {data.window_days}d</span>
          <span className="tw-text-fg-secondary">{s.total_rejected} rejections</span>
          <span className="tw-text-red-400">{s.tech_fails} technical ({s.tech_share_pct}%)</span>
          <span className="tw-text-fg-secondary">{s.human_fails} deliberate declines</span>
          {s.listeners_flagged > 0 && (
            <span className="tw-text-amber-400">{s.listeners_flagged} listener(s) flagged</span>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="tw-text-[12px] tw-text-fg-tertiary hover:tw-text-fg-primary tw-bg-transparent tw-border-0 tw-cursor-pointer"
        >
          {open ? "hide" : "show"}
        </button>
      </div>
      {open && <div className="tw-mt-3"><FocusCards focus={data.focus} /></div>}
    </div>
  );
}

/* ── Full HR scorecard: the Penalty Management tab ────────────────────────── */
export default function RejectionFocus() {
  const [days, setDays] = useState(7);
  const [onlyFlagged, setOnlyFlagged] = useState(true);
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error } = useGetRejectionFocusQuery(days);

  const openListener = (id) =>
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);

  if (isLoading) return <TableSkeleton rows={8} cols={8} />;
  if (error) return <div className="tw-p-4 tw-text-fg-tertiary">Could not load rejection data.</div>;

  const s = data?.summary || {};
  const all = data?.listeners || [];
  const rows = onlyFlagged ? all.filter((l) => l.severity !== "ok") : all;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Controls */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none"
        >
          {[1, 7, 14, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
        </select>
        <label className="tw-flex tw-items-center tw-gap-2 tw-text-[13px] tw-text-fg-secondary tw-cursor-pointer">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
          Only listeners needing attention
        </label>
        {isFetching && <span className="tw-text-[12px] tw-text-fg-tertiary">updating…</span>}
      </div>

      {/* Summary numbers */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-3">
        {[
          { label: "Rejections", value: s.total_rejected, tone: "tw-text-fg-primary" },
          { label: "Technical failures", value: `${s.tech_fails ?? 0} (${s.tech_share_pct ?? 0}%)`, tone: "tw-text-red-400", sub: "device/network — not HR" },
          { label: "Deliberate declines", value: s.human_fails, tone: "tw-text-amber-400", sub: "a person chose to reject" },
          { label: "Critical listeners", value: s.critical, tone: "tw-text-red-400" },
          { label: "Warning listeners", value: s.warning, tone: "tw-text-amber-400" },
        ].map((c) => (
          <div key={c.label} className="tw-rounded-xl tw-border tw-border-hairline tw-border-tertiary tw-bg-bg-secondary tw-p-3">
            <div className="tw-text-[11px] tw-uppercase tw-text-fg-tertiary">{c.label}</div>
            <div className={`tw-text-xl tw-font-semibold ${c.tone}`}>{c.value ?? "—"}</div>
            {c.sub && <div className="tw-text-[11px] tw-text-fg-tertiary tw-mt-0.5">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* What to act on */}
      <FocusCards focus={data?.focus || []} />

      {/* Per-listener scorecard */}
      <div className="tw-overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <Th>Listener</Th>
              <Th>Status</Th>
              <Th>Rejected</Th>
              <Th>Accepted</Th>
              <Th>Accept %</Th>
              <Th>Trend</Th>
              <Th>Technical share</Th>
              <Th>Top reason</Th>
              <Th>Why flagged</Th>
            </TR>
          </THead>
          <TBody striped>
            {rows.length === 0 ? (
              <TR>
                <Td colSpan={9} className="tw-text-center tw-text-fg-tertiary">
                  {onlyFlagged ? "No listener crossed the alert thresholds in this window." : "No rejections in this window."}
                </Td>
              </TR>
            ) : (
              rows.map((l, i) => (
                <TR key={l.listenerId} isLast={i === rows.length - 1}>
                  <Td>
                    <button
                      onClick={() => openListener(l.listenerId)}
                      className="tw-text-fg-primary tw-font-medium hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer"
                    >
                      {l.listener_name}
                    </button>
                    {l.is_online && <span className="tw-ml-2 tw-text-[11px] tw-text-green-400">online</span>}
                  </Td>
                  <Td><SeverityBadge severity={l.severity} /></Td>
                  <Td>{l.rejected}</Td>
                  <Td>{l.accepted}</Td>
                  <Td className={l.accept_pct != null && l.accept_pct < 50 ? "tw-text-red-400" : ""}>
                    {l.accept_pct != null ? `${l.accept_pct}%` : "—"}
                  </Td>
                  <Td><Trend pct={l.trend_pct} /></Td>
                  <Td className={l.tech_share_pct >= 60 ? "tw-text-fg-info" : "tw-text-fg-tertiary"}>
                    {l.tech_share_pct}%
                  </Td>
                  <Td className="tw-text-[12px]">{l.top_reason || "—"}</Td>
                  <Td className="tw-text-[12px] tw-text-fg-tertiary tw-max-w-[280px]">
                    {l.severity_reasons?.length ? l.severity_reasons.join(" · ") : "—"}
                  </Td>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      {/* Users on the receiving end — a user rejected constantly is its own signal */}
      {(data?.top_rejected_users || []).length > 0 && (
        <div>
          <div className="tw-text-[13px] tw-font-semibold tw-text-fg-primary tw-mb-2">
            Users whose calls fail most
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {data.top_rejected_users.map((u) => (
              <button
                key={u.userId}
                onClick={() => navigate(`/dashboard/user-management/profile-view?id=${u.userId}`)}
                className="tw-text-[12px] tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-bg-secondary tw-text-fg-secondary tw-border tw-border-tertiary hover:tw-text-fg-primary tw-cursor-pointer"
              >
                {u.user_name} · {u.rejected}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
