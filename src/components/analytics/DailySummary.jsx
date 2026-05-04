import React, { useState } from "react";
import { useDailySummaryQuery } from "../../services/listener";
import "./daily-summary.scss";

const fmt  = (n) => n !== null && n !== undefined
  ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : "—";
const fmtN = (n) => Number(n).toLocaleString("en-IN");

const GAP_THRESHOLD = 10; // ₹10 difference considered a gap worth flagging

function gapClass(val) {
  if (val === null || val === undefined) return "";
  const v = parseFloat(val);
  if (Math.abs(v) < GAP_THRESHOLD) return "ds-gap-ok";
  if (v < 0) return "ds-gap-neg";
  return "ds-gap-pos";
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="ds-stat-card" style={{ borderTopColor: color }}>
      <p className="ds-stat-label">{label}</p>
      <p className="ds-stat-value">{value}</p>
      {sub && <p className="ds-stat-sub">{sub}</p>}
    </div>
  );
}

function GapBadge({ val }) {
  if (val === null || val === undefined) return <span className="ds-na">—</span>;
  const v = parseFloat(val);
  const cls = gapClass(val);
  const sign = v > 0 ? "+" : "";
  return <span className={`ds-gap-badge ${cls}`}>{sign}{fmt(val)}</span>;
}

function DailySummary() {
  const today    = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(today.getDate() - 29);
  const fmt8 = (d) => d.toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(fmt8(thirtyAgo));
  const [toDate,   setToDate]   = useState(fmt8(today));
  const [applied,  setApplied]  = useState({ fromDate: fmt8(thirtyAgo), toDate: fmt8(today) });
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data, isLoading, isFetching, error } = useDailySummaryQuery(applied);
  const days    = data?.days    || [];
  const current = data?.current || {};

  // Period totals
  const totals = days.reduce(
    (acc, d) => {
      acc.recharge_count              += d.recharge_count || 0;
      acc.recharge_amount             += parseFloat(d.recharge_amount) || 0;
      acc.session_count               += d.session_count || 0;
      acc.total_amount_deducted       += parseFloat(d.total_amount_deducted) || 0;
      acc.total_listener_credit       += parseFloat(d.total_listener_credit) || 0;
      acc.total_gift_user_debit       += parseFloat(d.total_gift_user_debit) || 0;
      acc.total_gift_listener_credit  += parseFloat(d.total_gift_listener_credit) || 0;
      acc.total_adj_credits           += parseFloat(d.total_adj_credits) || 0;
      acc.total_adj_debits            += parseFloat(d.total_adj_debits) || 0;
      acc.total_salary_payout         += parseFloat(d.total_salary_payout) || 0;
      const ug = parseFloat(d.user_gap);
      const lg = parseFloat(d.listener_gap);
      if (!isNaN(ug)) acc.total_user_gap      += ug;
      if (!isNaN(lg)) acc.total_listener_gap  += lg;
      return acc;
    },
    {
      recharge_count: 0, recharge_amount: 0, session_count: 0,
      total_amount_deducted: 0, total_listener_credit: 0,
      total_gift_user_debit: 0, total_gift_listener_credit: 0,
      total_adj_credits: 0, total_adj_debits: 0, total_salary_payout: 0,
      total_user_gap: 0, total_listener_gap: 0,
    }
  );

  const gapDays = days.filter(
    (d) => d.user_gap !== null && Math.abs(parseFloat(d.user_gap)) >= GAP_THRESHOLD
  ).length;

  const handleApply = () => { if (fromDate && toDate) setApplied({ fromDate, toDate }); };
  const handleQuick = (n) => {
    const t = new Date(); const f = new Date(t); f.setDate(t.getDate() - (n - 1));
    const fd = fmt8(f); const td = fmt8(t);
    setFromDate(fd); setToDate(td); setApplied({ fromDate: fd, toDate: td });
  };

  return (
    <div className="ds-container">
      <div className="ds-header">
        <h2 className="ds-title">Daily Wallet Summary</h2>
        <p className="ds-subtitle">
          Snapshot-based daily balances, recharges, sessions &amp; payment gap analysis
        </p>
      </div>

      {/* Live totals banner */}
      {current.user_wallet_total && (
        <div className="ds-live-banner">
          <div className="ds-live-item">
            <span className="ds-live-label">Live User Wallet Total</span>
            <span className="ds-live-value">{fmt(current.user_wallet_total)}</span>
            <span className="ds-live-sub">{fmtN(current.user_wallet_count)} wallets</span>
          </div>
          <div className="ds-live-divider" />
          <div className="ds-live-item">
            <span className="ds-live-label">Live Listener Wallet Total</span>
            <span className="ds-live-value">{fmt(current.listener_wallet_total)}</span>
            <span className="ds-live-sub">{fmtN(current.listener_wallet_count)} wallets</span>
          </div>
          {gapDays > 0 && (
            <>
              <div className="ds-live-divider" />
              <div className="ds-live-item ds-live-alert">
                <span className="ds-live-label">⚠ Gap Days in Period</span>
                <span className="ds-live-value ds-alert-val">{gapDays}</span>
                <span className="ds-live-sub">days with unexplained wallet movement</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Date controls */}
      <div className="ds-controls">
        <div className="ds-date-row">
          <div className="ds-date-field">
            <label>From</label>
            <input type="date" value={fromDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="ds-date-field">
            <label>To</label>
            <input type="date" value={toDate} min={fromDate} max={fmt8(today)} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <button className="ds-apply-btn" onClick={handleApply} disabled={isLoading || isFetching}>
            {isFetching ? "Loading…" : "Apply"}
          </button>
        </div>
        <div className="ds-quick-btns">
          {[7, 14, 30, 60].map((n) => (
            <button key={n} onClick={() => handleQuick(n)}>Last {n} days</button>
          ))}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className={showBreakdown ? "ds-breakdown-btn ds-breakdown-active" : "ds-breakdown-btn"}
          >
            {showBreakdown ? "Hide Breakdown ▲" : "Show Breakdown ▼"}
          </button>
        </div>
      </div>

      {error && <div className="ds-error">Failed to load data. Please try again.</div>}

      {!isLoading && !error && (
        <>
          {/* Summary cards */}
          <div className="ds-cards">
            <StatCard label="Total Recharges"         value={fmt(totals.recharge_amount)}       sub={`${fmtN(totals.recharge_count)} transactions`}        color="#6366f1" />
            <StatCard label="Total Sessions"          value={fmtN(totals.session_count)}        sub={`${fmt(totals.total_amount_deducted)} deducted`}       color="#06b6d4" />
            <StatCard label="Listener Earnings"       value={fmt(totals.total_listener_credit)} sub="Session credits"                                      color="#10b981" />
            <StatCard label="Gifts (User Paid)"       value={fmt(totals.total_gift_user_debit)} sub={`${fmt(totals.total_gift_listener_credit)} to listener`} color="#f59e0b" />
            <StatCard label="Admin Adjustments"       value={fmt(totals.total_adj_credits)}     sub={`−${fmt(totals.total_adj_debits)} debits`}             color="#8b5cf6" />
            <StatCard label="Salary Payouts"          value={fmt(totals.total_salary_payout)}   sub="Listener withdrawals"                                 color="#64748b" />
            <StatCard label="Cumulative User Gap"     value={fmt(totals.total_user_gap)}        sub={`${gapDays} flagged day(s)`}                          color={Math.abs(totals.total_user_gap) >= GAP_THRESHOLD ? "#f43f5e" : "#94a3b8"} />
            <StatCard label="Cumulative Listener Gap" value={fmt(totals.total_listener_gap)}    sub="Expected vs actual"                                   color={Math.abs(totals.total_listener_gap) >= GAP_THRESHOLD ? "#f59e0b" : "#94a3b8"} />
          </div>

          {/* Gap legend */}
          <div className="ds-gap-legend">
            <strong>Gap formula — User:</strong> Recharges (incl. coupons) − Session deductions − Gift payments + Admin credits − Admin debits.<br/>
            <strong>Gap formula — Listener:</strong> Session credits + Gift earnings − Salary payouts.<br/>
            <span className="ds-gap-badge ds-gap-ok"> ₹0 </span> No gap &nbsp;
            <span className="ds-gap-badge ds-gap-neg"> −₹X </span> More deducted than expected &nbsp;
            <span className="ds-gap-badge ds-gap-pos"> +₹X </span> Less deducted than expected
          </div>

          {/* Main table */}
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Recharges</th>
                  <th>Recharge ₹</th>
                  <th>Sessions</th>
                  <th>Deducted</th>
                  <th>Listener Credit</th>
                  <th>Dur (min)</th>
                  {showBreakdown && <>
                    <th className="ds-th-breakdown">Gift (User)</th>
                    <th className="ds-th-breakdown">Gift (Listener)</th>
                    <th className="ds-th-breakdown">Adj +</th>
                    <th className="ds-th-breakdown">Adj −</th>
                    <th className="ds-th-breakdown">Salary Payout</th>
                  </>}
                  <th className="ds-th-snap">User Wallet Start</th>
                  <th className="ds-th-snap">User Wallet End</th>
                  <th className="ds-th-gap">User Gap</th>
                  <th className="ds-th-snap">Listener Start</th>
                  <th className="ds-th-snap">Listener End</th>
                  <th className="ds-th-gap">Listener Gap</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {days.length === 0 ? (
                  <tr><td colSpan={showBreakdown ? 19 : 14} className="ds-empty">No data for selected range.</td></tr>
                ) : (
                  [...days].reverse().map((d) => {
                    const hasUserGap     = d.user_gap !== null && Math.abs(parseFloat(d.user_gap)) >= GAP_THRESHOLD;
                    const hasListenerGap = d.listener_gap !== null && Math.abs(parseFloat(d.listener_gap)) >= GAP_THRESHOLD;
                    return (
                      <tr key={d.date} className={hasUserGap || hasListenerGap ? "ds-row-gap" : ""}>
                        <td className="ds-date-cell">{d.date}</td>
                        <td className={`ds-num ${d.recharge_count > 0 ? "ds-purple" : ""}`}>{fmtN(d.recharge_count)}</td>
                        <td className={`ds-num ${parseFloat(d.recharge_amount) > 0 ? "ds-green" : ""}`}>{fmt(d.recharge_amount)}</td>
                        <td className={`ds-num ${d.session_count > 0 ? "ds-purple" : ""}`}>{fmtN(d.session_count)}</td>
                        <td className="ds-num ds-red">{fmt(d.total_amount_deducted)}</td>
                        <td className="ds-num ds-green">{fmt(d.total_listener_credit)}</td>
                        <td className="ds-num ds-muted">{d.total_duration_mins}</td>
                        {showBreakdown && <>
                          <td className="ds-num ds-breakdown">{fmt(d.total_gift_user_debit)}</td>
                          <td className="ds-num ds-breakdown ds-green">{fmt(d.total_gift_listener_credit)}</td>
                          <td className="ds-num ds-breakdown ds-green">{fmt(d.total_adj_credits)}</td>
                          <td className="ds-num ds-breakdown ds-red">{fmt(d.total_adj_debits)}</td>
                          <td className="ds-num ds-breakdown ds-muted">{fmt(d.total_salary_payout)}</td>
                        </>}
                        <td className="ds-num ds-snap">{fmt(d.user_wallet_start)}</td>
                        <td className={`ds-num ds-snap ${d.user_wallet_end !== null && d.user_wallet_start !== null && parseFloat(d.user_wallet_end) >= parseFloat(d.user_wallet_start) ? "ds-green" : "ds-red"}`}>
                          {fmt(d.user_wallet_end)}
                        </td>
                        <td className="ds-num"><GapBadge val={d.user_gap} /></td>
                        <td className="ds-num ds-snap">{fmt(d.listener_wallet_start)}</td>
                        <td className={`ds-num ds-snap ${d.listener_wallet_end !== null && d.listener_wallet_start !== null && parseFloat(d.listener_wallet_end) >= parseFloat(d.listener_wallet_start) ? "ds-green" : "ds-red"}`}>
                          {fmt(d.listener_wallet_end)}
                        </td>
                        <td className="ds-num"><GapBadge val={d.listener_gap} /></td>
                        <td className="ds-num ds-muted ds-source">{d.snapshot_source || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(isLoading || isFetching) && (
        <div className="ds-loading">Loading daily summary…</div>
      )}
    </div>
  );
}

export default DailySummary;
