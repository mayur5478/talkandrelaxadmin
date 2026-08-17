import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetLiveQuery,
  useGetOnlineNowQuery,
  useForceOfflineMutation,
  useWakeListenerMutation,
  useSweepGhostsMutation,
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
import { isHR } from "../../utils/roles";

const ALL_TABS = ["Online Now", "Live", "Call Health", "Call Quality", "Listener Scorecard", "Billing Integrity", "Alerts"];
// HR was granted Online Now only. Every other tab calls an admin-only endpoint,
// so showing them would just hand HR a row of 403s.
const HR_TABS = ["Online Now"];

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
  // Read the role per-render, not at import time — otherwise the tab list is
  // whatever the role was when the bundle first loaded.
  const hr = isHR();
  const TABS = hr ? HR_TABS : ALL_TABS;
  const defaultTab = hr ? "Online Now" : "Live";

  // Tab lives in the URL so the dashboard's "Online Users / Online Listeners"
  // cards can deep-link straight to the Online Now list.
  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const tab = TABS.includes(urlTab) ? urlTab : defaultTab;
  const setTab = (t) => setParams(t === defaultTab ? {} : { tab: t }, { replace: true });
  const [days, setDays] = useState(7);
  const [openSession, setOpenSession] = useState(null);

  return (
    <div className="tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <h1 className="tw-text-xl tw-font-semibold tw-text-fg-primary">Session & Call Monitoring</h1>
        {tab !== "Live" && tab !== "Alerts" && tab !== "Online Now" && (
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

      {tab === "Online Now" && <OnlineNowTab />}
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

// ── Online Now ────────────────────────────────────────────────────────────────
// Names (clickable to the profile) of everyone currently flagged online, split
// into users and listeners. `is_online` on its own over-reports: a phone the OS
// killed still advertises online. Each row is therefore cross-checked against
// the socket registry and labelled live or ghost, so admin can see the real
// reachable pool, not the flattering number.
const ago = (t) => {
  if (!t) return "—";
  const s = Math.floor((Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function PresencePill({ presence }) {
  const live = presence === "live";
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full ${
        live ? "tw-bg-green-500/10 tw-text-green-400" : "tw-bg-amber-500/10 tw-text-amber-400"
      }`}
      title={live ? "Socket confirmed — actually reachable" : "Flagged online but no live socket — will not receive calls"}
    >
      <span className={`tw-w-1.5 tw-h-1.5 tw-rounded-full ${live ? "tw-bg-green-400" : "tw-bg-amber-400"}`} />
      {live ? "live" : "ghost"}
    </span>
  );
}

// What the person is doing this second. "calling"/"being called" come from the
// Redis ring keys, which is the only place an in-flight call exists — Sessions
// only learns about it once it connects.
function ActivityCell({ activity, onOpenPeer }) {
  const a = activity || { kind: "idle" };
  if (a.kind === "idle") return <span className="tw-text-fg-tertiary">—</span>;

  const label = {
    in_session: "in call with",
    calling: "ringing",
    being_called: "rung by",
  }[a.kind] || a.kind;

  const tone = a.kind === "in_session" ? "tw-text-green-400" : "tw-text-accent";

  return (
    <span className="tw-text-xs">
      <span className={tone}>{label}</span>{" "}
      {a.peer_id ? (
        <button
          onClick={() => onOpenPeer(a.peer_id, a.peer_role)}
          className="tw-text-fg-primary hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer"
        >
          {a.peer_name || String(a.peer_id).slice(0, 8)}
        </button>
      ) : "—"}
      {a.type ? <span className="tw-text-fg-tertiary"> ({a.type})</span> : null}
    </span>
  );
}

function OnlinePeopleTable({ title, rows, isLoading, tally, onOpen, onOpenPeer, actions }) {
  const showActions = !!actions;
  const cols = showActions ? 6 : 5;
  return (
    <div>
      <div className="tw-flex tw-items-baseline tw-gap-3 tw-mb-2">
        <div className="tw-text-sm tw-font-semibold tw-text-fg-primary">{title}</div>
        <div className="tw-text-xs tw-text-fg-tertiary">
          {tally?.total ?? 0} online · <span className="tw-text-green-400">{tally?.live ?? 0} live</span>
          {" · "}<span className="tw-text-amber-400">{tally?.ghost ?? 0} ghost</span>
          {" · "}{tally?.in_session ?? 0} in session
          {tally?.calling ? ` · ${tally.calling} ringing` : ""}
        </div>
      </div>
      <Table>
        <THead>
          <TR>
            <Th>Name</Th><Th>Presence</Th><Th>Doing now</Th><Th>Mobile</Th><Th>Last seen</Th>
            {showActions && <Th>Actions</Th>}
          </TR>
        </THead>
        <TBody striped>
          {isLoading ? <Msg cols={cols}>Loading…</Msg> :
            rows.length === 0 ? <Msg cols={cols}>Nobody online</Msg> :
              rows.map((p) => (
                <TR key={p.id}>
                  <Td>
                    <button
                      onClick={() => onOpen(p)}
                      className="tw-text-accent hover:tw-underline tw-font-medium tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer"
                    >
                      {p.fullName || "Unnamed"}
                    </button>
                  </Td>
                  <Td><PresencePill presence={p.presence} /></Td>
                  <Td><ActivityCell activity={p.activity} onOpenPeer={onOpenPeer} /></Td>
                  <Td className="tw-text-fg-tertiary tw-text-xs">{p.mobile_number || "—"}</Td>
                  <Td className="tw-text-fg-tertiary tw-text-xs">{ago(p.socket_last_seen || p.last_seen)}</Td>
                  {showActions && <Td>{actions(p)}</Td>}
                </TR>
              ))}
        </TBody>
      </Table>
    </div>
  );
}

function OnlineNowTab() {
  const navigate = useNavigate();
  // HR gets the per-row actions (they act on one named listener, and
  // force-offline refuses if that listener is actually reachable) but not the
  // bulk sweep, where one confirm can offline and push up to 200 people.
  // Hiding is only cosmetic — the route declarations enforce this.
  const canSweep = !isHR();
  const { data, isLoading, isFetching, refetch } = useGetOnlineNowQuery(
    { role: "all", limit: 300 },
    { pollingInterval: 15000 }
  );
  const [hideGhosts, setHideGhosts] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState(null);
  const [sweepPreview, setSweepPreview] = useState(null);
  const [minAgeMin, setMinAgeMin] = useState(45);

  const [forceOffline] = useForceOfflineMutation();
  const [wakeListener] = useWakeListenerMutation();
  const [sweepGhosts, { isLoading: sweeping }] = useSweepGhostsMutation();

  const filter = (arr = []) => (hideGhosts ? arr.filter((p) => p.presence === "live") : arr);
  const users = filter(data?.users);
  const listeners = filter(data?.listeners);
  const c = data?.counts || {};
  const rings = data?.in_flight_rings || [];

  const openById = (id, role) =>
    navigate(
      role === "listener"
        ? `/dashboard/listener-management/profile-view?id=${id}`
        : `/dashboard/user-management/profile-view?id=${id}`
    );
  const open = (p) => openById(p.id, p.role);

  const run = async (id, fn) => {
    setBusyId(id);
    setNote(null);
    try {
      const res = await fn().unwrap();
      setNote({ ok: res.success !== false, text: res.message });
      refetch();
    } catch (e) {
      setNote({ ok: false, text: e?.data?.message || "Action failed" });
    } finally {
      setBusyId(null);
    }
  };

  // Dry run first, always. The confirm step applies it.
  const previewSweep = async () => {
    setNote(null);
    try {
      const res = await sweepGhosts({ minAgeMin, apply: false }).unwrap();
      setSweepPreview(res);
    } catch (e) {
      setNote({ ok: false, text: e?.data?.message || "Sweep preview failed" });
    }
  };

  const applySweep = async () => {
    try {
      const res = await sweepGhosts({ minAgeMin, apply: true }).unwrap();
      setNote({ ok: true, text: res.message });
      setSweepPreview(null);
      refetch();
    } catch (e) {
      setNote({ ok: false, text: e?.data?.message || "Sweep failed" });
    }
  };

  // Only ghosts get actions — a live listener is reachable and must not be
  // knocked offline.
  const listenerActions = (p) => {
    if (p.presence !== "ghost") return <span className="tw-text-fg-tertiary tw-text-xs">—</span>;
    const busy = busyId === p.id;
    return (
      <span className="tw-flex tw-gap-2">
        <button
          disabled={busy}
          onClick={() => run(p.id, () => wakeListener({ userId: p.id }))}
          title="Push the listener and re-check for a socket after 10s"
          className="tw-text-xs tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-border tw-text-fg-secondary hover:tw-text-fg-primary tw-cursor-pointer disabled:tw-opacity-40"
        >
          {busy ? "…" : "Ping"}
        </button>
        <button
          disabled={busy}
          onClick={() => run(p.id, () => forceOffline({ userId: p.id, notify: true }))}
          title="Stop advertising them and send the go-back-online reminder"
          className="tw-text-xs tw-px-2 tw-py-0.5 tw-rounded tw-border tw-border-amber-500/40 tw-text-amber-400 hover:tw-bg-amber-500/10 tw-cursor-pointer disabled:tw-opacity-40"
        >
          Force offline
        </button>
      </span>
    );
  };

  return (
    <div>
      <div className="tw-flex tw-gap-3 tw-mb-4 tw-flex-wrap tw-items-center">
        <Card label="Users online" value={c.users?.total} sub={`${c.users?.live ?? 0} live · ${c.users?.ghost ?? 0} ghost`} tone="tw-text-accent" />
        <Card label="Listeners online" value={c.listeners?.total} sub={`${c.listeners?.live ?? 0} live · ${c.listeners?.ghost ?? 0} ghost`} tone="tw-text-accent" />
        <Card label="Reachable listeners" value={c.listeners?.live}
          sub="socket-confirmed — the real pool"
          tone={c.listeners?.total && c.listeners.live / c.listeners.total >= 0.6 ? "tw-text-green-400" : "tw-text-red-400"} />
        <Card label="Rings in flight" value={rings.length} sub="calls connecting right now" />
        <Card label="Auto-refresh" value="15s" sub={isFetching ? "updating…" : "live"} />
        <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-fg-secondary tw-cursor-pointer">
          <input type="checkbox" checked={hideGhosts} onChange={(e) => setHideGhosts(e.target.checked)} />
          Hide ghosts
        </label>
      </div>

      {/* Ghost sweep — dry run, then confirm. Admin only. */}
      {canSweep && (
      <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap tw-mb-3 tw-p-3 tw-rounded-xl tw-border tw-border-border tw-bg-bg-secondary">
        <span className="tw-text-sm tw-font-medium tw-text-fg-primary">Ghost sweep</span>
        <label className="tw-text-xs tw-text-fg-tertiary tw-flex tw-items-center tw-gap-2">
          socket dead longer than
          <input
            type="number"
            min={10}
            value={minAgeMin}
            onChange={(e) => setMinAgeMin(Number(e.target.value))}
            className="tw-w-16 tw-bg-bg-primary tw-border tw-border-border tw-rounded tw-px-2 tw-py-0.5 tw-text-fg-primary"
          />
          min
        </label>
        <button
          onClick={previewSweep}
          disabled={sweeping}
          className="tw-text-xs tw-px-3 tw-py-1 tw-rounded tw-border tw-border-border tw-text-fg-secondary hover:tw-text-fg-primary tw-cursor-pointer disabled:tw-opacity-40"
        >
          {sweeping ? "Checking…" : "Preview"}
        </button>
        <span className="tw-text-xs tw-text-fg-tertiary">
          Nothing changes until you confirm. Recent drops are never swept — they are usually mid-reconnect.
        </span>
      </div>
      )}

      {sweepPreview && (
        <div className="tw-mb-3 tw-p-3 tw-rounded-xl tw-border tw-border-amber-500/30 tw-bg-amber-500/10">
          <div className="tw-text-sm tw-text-amber-400 tw-font-medium tw-mb-1">
            {sweepPreview.message}
          </div>
          <div className="tw-text-xs tw-text-fg-secondary tw-mb-2 tw-max-h-32 tw-overflow-auto">
            {(sweepPreview.targets || []).map((t) => (
              <div key={t.userId}>
                {t.name} — dead {t.dead_min}min{t.has_token ? "" : " (no token, cannot remind)"}
              </div>
            ))}
          </div>
          <div className="tw-flex tw-gap-2">
            <button
              onClick={applySweep}
              disabled={sweeping || !sweepPreview.would_affect}
              className="tw-text-xs tw-px-3 tw-py-1 tw-rounded tw-bg-amber-500/20 tw-text-amber-300 tw-border tw-border-amber-500/40 tw-cursor-pointer disabled:tw-opacity-40"
            >
              Set these offline + remind
            </button>
            <button
              onClick={() => setSweepPreview(null)}
              className="tw-text-xs tw-px-3 tw-py-1 tw-rounded tw-border tw-border-border tw-text-fg-tertiary tw-cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {note && (
        <div className={`tw-mb-3 tw-text-sm ${note.ok ? "tw-text-green-400" : "tw-text-red-400"}`}>
          {note.text}
        </div>
      )}

      <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 tw-gap-6">
        <OnlinePeopleTable
          title="Listeners online" rows={listeners} isLoading={isLoading}
          tally={c.listeners} onOpen={open} onOpenPeer={openById}
          actions={listenerActions}
        />
        <OnlinePeopleTable
          title="Users online" rows={users} isLoading={isLoading}
          tally={c.users} onOpen={open} onOpenPeer={openById}
        />
      </div>

      {/* Every ring in flight, including pairs where neither side is listed above */}
      <div className="tw-mt-6">
        <div className="tw-text-sm tw-font-semibold tw-text-fg-primary tw-mb-2">
          Rings in flight ({rings.length})
        </div>
        <Table>
          <THead><TR><Th>User</Th><Th>Listener</Th><Th>Type</Th><Th>Request</Th></TR></THead>
          <TBody striped>
            {rings.length === 0 ? <Msg cols={4}>No calls connecting right now</Msg> :
              rings.map((r) => (
                <TR key={r.requestId || `${r.userId}-${r.listenerId}`}>
                  <Td>
                    <button onClick={() => openById(r.userId, "user")}
                      className="tw-text-accent hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer">
                      {r.user_name || String(r.userId || "").slice(0, 8)}
                    </button>
                  </Td>
                  <Td>
                    <button onClick={() => openById(r.listenerId, "listener")}
                      className="tw-text-accent hover:tw-underline tw-bg-transparent tw-border-0 tw-p-0 tw-cursor-pointer">
                      {r.listener_name || String(r.listenerId || "").slice(0, 8)}
                    </button>
                  </Td>
                  <Td>{r.type || "—"}</Td>
                  <Td className="tw-text-fg-tertiary tw-text-xs">{String(r.requestId || "").slice(0, 12)}</Td>
                </TR>
              ))}
          </TBody>
        </Table>
      </div>
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
