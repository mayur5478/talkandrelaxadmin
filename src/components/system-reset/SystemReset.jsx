import React, { useState } from "react";
import {
  useResetUserMutation,
  useCleanupSweepMutation,
} from "../../services/systemReset";

const Card = ({ children }) => (
  <div className="tw-rounded-xl tw-border tw-border-border tw-bg-bg-secondary tw-p-5">{children}</div>
);

const Row = ({ k, v }) => (
  <div className="tw-flex tw-justify-between tw-py-1 tw-text-sm">
    <span className="tw-text-fg-tertiary">{k}</span>
    <span className="tw-text-fg-primary tw-font-medium">{String(v)}</span>
  </div>
);

export default function SystemReset() {
  const [query, setQuery] = useState("");
  const [force, setForce] = useState(false);
  const [confirmSweep, setConfirmSweep] = useState(false);

  const [resetUser, resetState] = useResetUserMutation();
  const [cleanupSweep, sweepState] = useCleanupSweepMutation();

  const onReset = async () => {
    if (!query.trim()) return;
    try { await resetUser({ query: query.trim(), force }).unwrap(); } catch (_) {}
  };

  const onSweep = async (dry) => {
    if (!dry && !confirmSweep) { setConfirmSweep(true); return; }
    setConfirmSweep(false);
    try { await cleanupSweep({ dry }).unwrap(); } catch (_) {}
  };

  const resetResult = resetState.data;
  const resetErr = resetState.error?.data?.message || resetState.error?.error;
  const sweepResult = sweepState.data;
  const sweepErr = sweepState.error?.data?.message || sweepState.error?.error;

  return (
    <div className="tw-p-4 tw-max-w-3xl">
      <h1 className="tw-text-xl tw-font-semibold tw-text-fg-primary tw-mb-1">System Reset</h1>
      <p className="tw-text-sm tw-text-fg-tertiary tw-mb-6">
        Clears stuck call state only — never touches wallets, chat history, or session records.
        Anyone in a live call is protected unless you force it.
      </p>

      {/* ── Reset one user/listener ───────────────────────────────── */}
      <Card>
        <h2 className="tw-text-base tw-font-semibold tw-text-fg-primary tw-mb-1">Restore a stuck user or listener</h2>
        <p className="tw-text-xs tw-text-fg-tertiary tw-mb-4">
          Fixes "shows busy", "can't be called", or a stuck reservation. Enter a name or user id.
        </p>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <input
            className="tw-flex-1 tw-min-w-[220px] tw-rounded-lg tw-border tw-border-border tw-bg-bg-primary tw-px-3 tw-py-2 tw-text-sm tw-text-fg-primary"
            placeholder="name or user id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onReset()}
          />
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-fg-secondary">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            force (drops a live call)
          </label>
          <button
            onClick={onReset}
            disabled={resetState.isLoading || !query.trim()}
            className="tw-rounded-lg tw-bg-accent tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white disabled:tw-opacity-50"
          >
            {resetState.isLoading ? "Resetting…" : "Reset"}
          </button>
        </div>

        {resetErr && <div className="tw-mt-3 tw-text-sm tw-text-red-400">{resetErr}</div>}
        {resetState.error?.data?.matches && (
          <div className="tw-mt-3 tw-text-xs tw-text-fg-tertiary">
            Too many matches — pick an id:
            {resetState.error.data.matches.map((m) => (
              <div key={m.id} className="tw-mt-1">
                <button className="tw-underline" onClick={() => setQuery(m.id)}>{m.id}</button> · {m.role} · {m.fullName}
              </div>
            ))}
          </div>
        )}
        {resetResult?.results?.map((r) => (
          <div key={r.id} className="tw-mt-3 tw-rounded-lg tw-border tw-border-border tw-bg-bg-primary tw-p-3">
            <div className="tw-text-sm tw-font-medium tw-text-fg-primary">{r.name} · {r.role}</div>
            <div className="tw-text-xs tw-text-fg-tertiary">{r.id}</div>
            {r.skipped ? (
              <div className="tw-mt-1 tw-text-sm tw-text-amber-400">Skipped — {r.reason}. Tick "force" to override.</div>
            ) : (
              <div className="tw-mt-1 tw-text-sm tw-text-green-400">
                Cleared: flags {r.userFlagsCleared}, reservations {r.reservationsCleared}, redis keys {r.redisKeysCleared}
                {r.forcedActive ? " (forced — a live call was dropped)" : ""}
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* ── Global cleanup sweep ──────────────────────────────────── */}
      <div className="tw-mt-6">
        <Card>
          <h2 className="tw-text-base tw-font-semibold tw-text-fg-primary tw-mb-1">Run cleanup sweep now</h2>
          <p className="tw-text-xs tw-text-fg-tertiary tw-mb-4">
            The same safe sweep the nightly 3am job runs — clears stuck flags, stale reservations,
            dead-socket listeners, and orphaned call keys. Live calls are protected. Dry-run first.
          </p>
          <div className="tw-flex tw-items-center tw-gap-3">
            <button
              onClick={() => onSweep(true)}
              disabled={sweepState.isLoading}
              className="tw-rounded-lg tw-border tw-border-border tw-px-4 tw-py-2 tw-text-sm tw-text-fg-primary disabled:tw-opacity-50"
            >
              {sweepState.isLoading ? "Running…" : "Dry run"}
            </button>
            <button
              onClick={() => onSweep(false)}
              disabled={sweepState.isLoading}
              className={`tw-rounded-lg tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white disabled:tw-opacity-50 ${
                confirmSweep ? "tw-bg-red-600" : "tw-bg-accent"
              }`}
            >
              {confirmSweep ? "Click again to confirm" : "Run cleanup"}
            </button>
            {confirmSweep && (
              <button className="tw-text-sm tw-text-fg-tertiary tw-underline" onClick={() => setConfirmSweep(false)}>
                cancel
              </button>
            )}
          </div>

          {sweepErr && <div className="tw-mt-3 tw-text-sm tw-text-red-400">{sweepErr}</div>}
          {sweepResult && (
            <div className="tw-mt-4 tw-rounded-lg tw-border tw-border-border tw-bg-bg-primary tw-p-3">
              <div className="tw-text-sm tw-font-medium tw-text-fg-primary tw-mb-2">
                {sweepResult.dry ? "Dry run — nothing changed" : "Cleanup complete"}
              </div>
              <Row k="Protected (in live call)" v={sweepResult.protectedActive} />
              <Row k="Stuck 'busy' flags" v={sweepResult.stuckSessionRunning} />
              <Row k="Stale reservations" v={sweepResult.staleReservations} />
              <Row k="Dead-socket listeners" v={sweepResult.staleOnlineListeners} />
              <Row
                k="Orphaned redis call keys"
                v={sweepResult.redisCallKeys
                  ? `${sweepResult.redisCallKeys.deleted} (of ${sweepResult.redisCallKeys.scanned}, ${sweepResult.redisCallKeys.skippedActive} protected)`
                  : "—"}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
