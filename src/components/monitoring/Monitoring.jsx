import React, { useState } from "react";
import {
  useGetLiveQuery,
  useGetListenersQuery,
  useGetBillingIntegrityQuery,
  useGetCallHealthQuery,
  useGetCallQualityQuery,
  useGetCallQualityListQuery,
  useGetAlertsQuery,
  useScanAlertsMutation,
  useResolveAlertMutation,
  useGetSessionDetailQuery,
} from "../../services/monitoring";
import { Table, THead, TBody, TR, Th, Td } from "../v2/ui/table";

const TABS = ["Live", "Call Health", "Call Quality", "Listener Scorecard", "Billing Integrity", "Alerts"];

const Card = ({ label, value, sub, tone }) => (
  <div className="tw-rounded-xl tw-border tw-border-border tw-bg-bg-secondary tw-p-4 tw-min-w-[150px]">
    <div className="tw-text-xs tw-text-fg-tertiary tw-uppercase">{label}</div>
    <div className={`tw-text-2xl tw-font-semibold ${tone || "tw-text-fg-primary"}`}>{value ?? "—"}</div>
    {sub && <div className="tw-text-xs tw-text-fg-tertiary tw-mt-1">{sub}</div>}
  </div>
);

const fmtSec = (s) => (s == null ? "—" : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`);
const Msg = ({ cols, children }) => (
  <TR><Td colSpan={cols} className="tw-text-center tw-text-fg-tertiary">{children}</Td></TR>
);
const sevTone = (s) => (s === "high" ? "tw-text-red-400" : s === "low" ? "tw-text-fg-tertiary" : "tw-text-amber-400");

export default function Monitoring() {
  const [tab, setTab] = useState("Live");
  const [days, setDays] = useState(7);
  const [openSession, setOpenSession] = useState(null);

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h1 className="tw-text-xl tw-font-semibold tw-text-fg-primary">Session & Call Monitoring</h1>
        {tab !== "Live" && tab !== "Alerts" && (
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="tw-bg-bg-secondary tw-border tw-border-border tw-rounded tw-px-2 tw-py-1 tw-text-sm">
            {[1, 7, 14, 30, 90].map((d) => <option key={d} value={d}>Last {d}d</option>)}
          </select>
        )}
      </div>

      <div className="tw-flex tw-gap-2 tw-mb-4 tw-border-b tw-border-border">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`tw-px-3 tw-py-2 tw-text-sm ${tab === t ? "tw-border-b-2 tw-border-accent tw-text-fg-primary tw-font-medium" : "tw-text-fg-tertiary"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Live" && <LiveTab onOpen={setOpenSession} />}
      {tab === "Call Health" && <CallHealthTab days={days} />}
      {tab === "Call Quality" && <QualityTab days={days} />}
      {tab === "Listener Scorecard" && <ScorecardTab days={days} />}
      {tab === "Billing Integrity" && <BillingTab days={days} onOpen={setOpenSession} />}
      {tab === "Alerts" && <AlertsTab onOpen={setOpenSession} />}

      {openSession && <SessionModal id={openSession} onClose={() => setOpenSession(null)} />}
    </div>
  );
}

function LiveTab({ onOpen }) {
  const { data, isLoading, isFetching } = useGetLiveQuery(undefined, { pollingInterval: 10000 });
  const rows = data?.sessions || [];
  return (
    <div>
      <div className="tw-flex tw-gap-3 tw-mb-4">
        <Card label="Active now" value={data?.active_count} tone="tw-text-accent" />
        <Card label="Auto-refresh" value="10s" sub={isFetching ? "updating…" : "live"} />
      </div>
      <Table>
        <THead><TR><Th>User</Th><Th>Listener</Th><Th>Type</Th><Th>Elapsed</Th><Th>Deducted</Th></TR></THead>
        <TBody striped>
          {isLoading ? <Msg cols={5}>Loading…</Msg> :
            rows.length === 0 ? <Msg cols={5}>No active sessions</Msg> :
              rows.map((s) => (
                <TR key={s.id} onClick={() => onOpen(s.id)} className="tw-cursor-pointer">
                  <Td>{s.user_name || s.user_id}</Td>
                  <Td>{s.listener_name || s.listener_id}</Td>
                  <Td>{s.type}</Td>
                  <Td>{fmtSec(s.elapsed_sec)}</Td>
                  <Td>₹{s.amount_deducted}</Td>
                </TR>
              ))}
        </TBody>
      </Table>
    </div>
  );
}

function CallHealthTab({ days }) {
  const { data, isLoading } = useGetCallHealthQuery(days, { pollingInterval: 30000 });
  if (isLoading) return <div className="tw-text-fg-tertiary tw-p-4">Loading call health…</div>;
  const f = data?.funnel || {};
  const o = data?.outcome || {};
  const fcm = data?.fcmCoverage || {};
  const techPct = f.failed ? Math.round((f.techFail / f.failed) * 100) : 0;

  return (
    <div>
      {/* Funnel */}
      <div className="tw-flex tw-gap-3 tw-mb-4 tw-flex-wrap">
        <Card label="Attempts" value={f.attempts} sub={`last ${data?.window_days}d`} />
        <Card label="Connected" value={f.connected} tone="tw-text-green-400" />
        <Card label="Connect rate" value={f.connectRate != null ? `${f.connectRate}%` : "—"}
          tone={f.connectRate >= 60 ? "tw-text-green-400" : "tw-text-amber-400"} />
        <Card label="Failed attempts" value={f.failed} tone="tw-text-red-400" />
        <Card label="Tech failures" value={f.techFail} sub={`${techPct}% of failures`} tone="tw-text-red-400" />
        <Card label="Human declines" value={f.humanFail} sub="user/listener chose to reject" />
      </div>

      {/* Session outcomes + coverage */}
      <div className="tw-flex tw-gap-3 tw-mb-4 tw-flex-wrap">
        <Card label="Sessions" value={o.total} />
        <Card label="Avg duration" value={o.avg_min != null ? `${o.avg_min} min` : "—"} />
        <Card label="Under 1 min" value={o.under_1min} tone="tw-text-amber-400" />
        <Card label="Ended as tech-fail" value={o.tech_ended} tone="tw-text-red-400" />
        <Card label="Listener FCM coverage" value={fcm.pct != null ? `${fcm.pct}%` : "—"}
          sub={`${fcm.withToken}/${fcm.total} can be rung`}
          tone={fcm.pct >= 80 ? "tw-text-green-400" : "tw-text-red-400"} />
      </div>

      {/* Failure breakdown */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        <div>
          <div className="tw-text-sm tw-font-semibold tw-text-fg-primary tw-mb-2">Why calls fail</div>
          <Table>
            <THead><TR><Th>Reason</Th><Th>By</Th><Th>Kind</Th><Th>Count</Th></TR></THead>
            <TBody>
              {(data?.failureBreakdown || []).length === 0 && <Msg cols={4}>No failures in window</Msg>}
              {(data?.failureBreakdown || []).map((r, i) => (
                <TR key={i}>
                  <Td>{r.reason}</Td><Td>{r.by}</Td>
                  <Td><span className={r.kind === "tech" ? "tw-text-red-400" : "tw-text-fg-tertiary"}>{r.kind}</span></Td>
                  <Td>{r.count}</Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        {/* Worst listeners */}
        <div>
          <div className="tw-text-sm tw-font-semibold tw-text-fg-primary tw-mb-2">Worst-affected listeners (timeouts)</div>
          <Table>
            <THead><TR><Th>Listener</Th><Th>Timeouts</Th><Th>Connected</Th><Th>Miss %</Th></TR></THead>
            <TBody>
              {(data?.worstListeners || []).length === 0 && <Msg cols={4}>None</Msg>}
              {(data?.worstListeners || []).map((w) => (
                <TR key={w.listenerId}>
                  <Td>{w.name}</Td><Td>{w.timeouts}</Td><Td>{w.connected}</Td>
                  <Td className={w.missPct >= 50 ? "tw-text-red-400" : ""}>{w.missPct != null ? `${w.missPct}%` : "—"}</Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>

      {/* App versions */}
      <div className="tw-mt-4">
        <div className="tw-text-sm tw-font-semibold tw-text-fg-primary tw-mb-2">App versions in the field (reporting calls)</div>
        <Table>
          <THead><TR><Th>Version</Th><Th>Platform</Th><Th>Calls</Th></TR></THead>
          <TBody>
            {(data?.versions || []).length === 0 && <Msg cols={3}>No telemetry</Msg>}
            {(data?.versions || []).map((v, i) => (
              <TR key={i}>
                <Td className={String(v.app_version).includes("old") ? "tw-text-amber-400" : ""}>{v.app_version}</Td>
                <Td>{v.platform}</Td><Td>{v.count}</Td>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Recent failed attempts */}
      <div className="tw-mt-4">
        <div className="tw-text-sm tw-font-semibold tw-text-fg-primary tw-mb-2">Recent failed attempts</div>
        <Table>
          <THead><TR><Th>When</Th><Th>Type</Th><Th>Reason</Th><Th>By</Th><Th>User</Th><Th>Listener</Th></TR></THead>
          <TBody>
            {(data?.recentFails || []).length === 0 && <Msg cols={6}>None</Msg>}
            {(data?.recentFails || []).map((r, i) => (
              <TR key={i}>
                <Td>{new Date(r.rejectedAt).toLocaleString()}</Td>
                <Td>{r.type}</Td><Td>{r.reason}</Td><Td>{r.rejectedBy}</Td>
                <Td className="tw-text-fg-tertiary">{String(r.userId).slice(0, 8)}</Td>
                <Td className="tw-text-fg-tertiary">{String(r.listenerId).slice(0, 8)}</Td>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function QualityTab({ days }) {
  const { data, isLoading } = useGetCallQualityQuery(days);
  const { data: list } = useGetCallQualityListQuery({ days, filter: "poor", page: 1 });
  const s = data?.summary || {};
  const lrows = list?.data || [];
  return (
    <div>
      <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mb-4">
        <Card label="Total calls" value={s.total_calls} />
        <Card label="Fail %" value={s.fail_pct != null ? `${s.fail_pct}%` : "—"} tone="tw-text-red-400" />
        <Card label="Poor quality %" value={s.poor_quality_pct != null ? `${s.poor_quality_pct}%` : "—"} tone="tw-text-amber-400" />
        <Card label="Reconnect %" value={s.reconnect_pct != null ? `${s.reconnect_pct}%` : "—"} />
        <Card label="<1min drop %" value={s.short_lt1min_pct != null ? `${s.short_lt1min_pct}%` : "—"} />
        <Card label="Avg connect" value={s.avg_connect_ms != null ? `${s.avg_connect_ms}ms` : "—"} />
      </div>
      {!isLoading && !s.total_calls &&
        <div className="tw-text-fg-tertiary tw-text-sm tw-mb-4">No telemetry yet — app build with call_metrics reporting not live.</div>}
      <h3 className="tw-text-sm tw-font-medium tw-mb-2">Worst quality calls</h3>
      <Table>
        <THead><TR><Th>User</Th><Th>Listener</Th><Th>Quality</Th><Th>Reconnects</Th><Th>Reason</Th></TR></THead>
        <TBody striped>
          {lrows.length === 0 ? <Msg cols={5}>None</Msg> :
            lrows.map((r) => (
              <TR key={r.id}>
                <Td>{r.user_name || r.user_id}</Td>
                <Td>{r.listener_name || r.listener_id}</Td>
                <Td className="tw-text-amber-400">{r.quality_min}</Td>
                <Td>{r.reconnect_count}</Td>
                <Td className="tw-text-xs">{r.end_reason_detail || r.end_reason}</Td>
              </TR>
            ))}
        </TBody>
      </Table>
    </div>
  );
}

function ScorecardTab({ days }) {
  const { data, isLoading } = useGetListenersQuery(days);
  const rows = data?.listeners || [];
  return (
    <Table>
      <THead><TR><Th>Listener</Th><Th>Calls</Th><Th>Accept %</Th><Th>Drop &lt;1min %</Th><Th>Avg dur</Th><Th>Minutes</Th><Th>Earnings</Th></TR></THead>
      <TBody striped>
        {isLoading ? <Msg cols={7}>Loading…</Msg> :
          rows.length === 0 ? <Msg cols={7}>No data</Msg> :
            rows.map((l) => (
              <TR key={l.listener_id} highlight={l.short_drop_pct > 30}>
                <Td>{l.listener_name || l.listener_id}</Td>
                <Td>{l.total_calls}</Td>
                <Td>{l.accept_pct != null ? `${l.accept_pct}%` : "—"}</Td>
                <Td className={l.short_drop_pct > 30 ? "tw-text-red-400" : ""}>{l.short_drop_pct}%</Td>
                <Td>{fmtSec(l.avg_duration_sec)}</Td>
                <Td>{l.total_minutes}</Td>
                <Td>₹{l.earnings}</Td>
              </TR>
            ))}
      </TBody>
    </Table>
  );
}

function BillingTab({ days, onOpen }) {
  const { data, isLoading } = useGetBillingIntegrityQuery(days);
  const s = data?.summary || {};
  const flagged = data?.flagged || [];
  return (
    <div>
      <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mb-4">
        <Card label="Billed, 0 duration" value={s.billed_zero_duration} tone="tw-text-red-400" />
        <Card label="Billed <30s" value={s.billed_near_zero} tone="tw-text-amber-400" />
        <Card label="Real call, unbilled" value={s.unbilled_real_call} tone="tw-text-amber-400" />
        <Card label="Stuck active >2h" value={s.stuck_active} tone="tw-text-red-400" />
      </div>
      <Table>
        <THead><TR><Th>Flag</Th><Th>User</Th><Th>Listener</Th><Th>Duration</Th><Th>Deducted</Th><Th>Reason</Th></TR></THead>
        <TBody striped>
          {isLoading ? <Msg cols={6}>Loading…</Msg> :
            flagged.length === 0 ? <Msg cols={6}>No anomalies</Msg> :
              flagged.map((r) => (
                <TR key={r.id} onClick={() => onOpen(r.id)} className="tw-cursor-pointer">
                  <Td className="tw-text-red-400 tw-text-xs">{r.flag}</Td>
                  <Td>{r.user_name || r.user_id}</Td>
                  <Td>{r.listener_name || r.listener_id}</Td>
                  <Td>{fmtSec(r.total_duration)}</Td>
                  <Td>₹{r.amount_deducted}</Td>
                  <Td className="tw-text-xs">{r.reason_detail || "—"}</Td>
                </TR>
              ))}
        </TBody>
      </Table>
    </div>
  );
}

function AlertsTab({ onOpen }) {
  const { data, isLoading } = useGetAlertsQuery({ resolved: "false" });
  const [scan, { isLoading: scanning }] = useScanAlertsMutation();
  const [resolve] = useResolveAlertMutation();
  const rows = data?.data || [];
  return (
    <div>
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <Card label="Open alerts" value={data?.total} tone="tw-text-red-400" />
        <button onClick={() => scan(2)} disabled={scanning}
          className="tw-px-3 tw-py-2 tw-rounded tw-bg-accent tw-text-white tw-text-sm disabled:tw-opacity-50">
          {scanning ? "Scanning…" : "Run scan (2d)"}
        </button>
      </div>
      <Table>
        <THead><TR><Th>Severity</Th><Th>Type</Th><Th>Message</Th><Th>When</Th><Th>Action</Th></TR></THead>
        <TBody striped>
          {isLoading ? <Msg cols={5}>Loading…</Msg> :
            rows.length === 0 ? <Msg cols={5}>No open alerts — run a scan</Msg> :
              rows.map((a) => (
                <TR key={a.id}>
                  <Td className={sevTone(a.severity)}>{a.severity}</Td>
                  <Td className="tw-text-xs">{a.type}</Td>
                  <Td>
                    {a.message}
                    {a.session_id && <button onClick={() => onOpen(a.session_id)} className="tw-ml-2 tw-text-accent tw-text-xs tw-underline">view</button>}
                  </Td>
                  <Td className="tw-text-xs">{new Date(a.createdAt).toLocaleString()}</Td>
                  <Td><button onClick={() => resolve(a.id)} className="tw-text-xs tw-text-fg-tertiary tw-underline">resolve</button></Td>
                </TR>
              ))}
        </TBody>
      </Table>
    </div>
  );
}

function SessionModal({ id, onClose }) {
  const { data, isLoading } = useGetSessionDetailQuery(id);
  const s = data?.session;
  const m = data?.metrics;
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50" onClick={onClose}>
      <div className="tw-bg-bg-primary tw-border tw-border-border tw-rounded-xl tw-p-5 tw-w-[640px] tw-max-h-[80vh] tw-overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="tw-flex tw-justify-between tw-mb-3">
          <h2 className="tw-font-semibold">Session timeline</h2>
          <button onClick={onClose} className="tw-text-fg-tertiary">✕</button>
        </div>
        {isLoading ? <div className="tw-text-fg-tertiary">Loading…</div> : !s ? <div>Not found</div> : (
          <div>
            <div className="tw-text-sm tw-mb-3 tw-text-fg-secondary">
              {s.user_name} ↔ {s.listener_name} · {s.type} · {fmtSec(s.total_duration)} · ₹{s.amount_deducted} · {s.reason_detail || s.reason}
              {m && <> · quality {m.quality_min} · {m.reconnect_count} reconnects</>}
            </div>
            <ol className="tw-border-l tw-border-border tw-pl-4">
              {(data.timeline || []).map((e, i) => (
                <li key={i} className="tw-mb-2 tw-text-sm">
                  <span className="tw-text-fg-tertiary tw-text-xs">{new Date(e.t).toLocaleTimeString()}</span>{" "}
                  <span className="tw-font-medium">{e.kind}</span> — {e.detail}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
