import React, { useEffect, useState } from "react";
import { useGetWalletLedgerQuery } from "../../../services/recharge";
import { useUserProfileQuery } from "../../../services/user";
import { useListenerProfileQuery } from "../../../services/listener";

/* ─── inject fonts once ─────────────────────────────────────────── */
if (!document.getElementById("ledger-fonts")) {
  const s = document.createElement("link");
  s.id = "ledger-fonts";
  s.rel = "stylesheet";
  s.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(s);
}

/* ─── design tokens ──────────────────────────────────────────────── */
const T = {
  font: "'Plus Jakarta Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
  bg: "#F7F8FC",
  surface: "#FFFFFF",
  border: "#EAEDF3",
  text: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
};

const TX = {
  session_debit:           { label: "Session Debit",   fg: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
  recharge:                { label: "Recharge",         fg: "#059669", bg: "#ECFDF5", dot: "#059669" },
  admin_credit:            { label: "Admin Credit",     fg: "#7C3AED", bg: "#F5F3FF", dot: "#7C3AED" },
  admin_debit:             { label: "Admin Debit",      fg: "#D97706", bg: "#FFFBEB", dot: "#D97706" },
  session_listener_credit: { label: "Listener Credit",  fg: "#0891B2", bg: "#ECFEFF", dot: "#0891B2" },
  session_admin_credit:    { label: "Platform Credit",  fg: "#2563EB", bg: "#EFF6FF", dot: "#2563EB" },
};

const WALLET = {
  user:     { label: "User",     dot: "#6366F1" },
  listener: { label: "Listener", dot: "#0891B2" },
  admin:    { label: "Admin",    dot: "#7C3AED" },
};

/* ─── helpers ────────────────────────────────────────────────────── */
function CopyId({ value }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1400); });
  };
  return (
    <span
      onClick={copy}
      title={ok ? "Copied!" : value}
      style={{
        fontFamily: T.mono, fontSize: "10.5px",
        color: ok ? "#059669" : T.faint,
        cursor: "pointer", userSelect: "none",
        background: ok ? "#ECFDF5" : "transparent",
        padding: ok ? "1px 5px" : "0",
        borderRadius: "4px", transition: "all .15s",
        letterSpacing: "0.02em",
      }}
    >
      {ok ? "✓ copied" : `${value?.slice(0, 10)}…`}
    </span>
  );
}

function OwnerName({ id, walletType }) {
  const { data: ud } = useUserProfileQuery(id, { skip: walletType !== "user" || !id });
  const { data: ld } = useListenerProfileQuery(id, { skip: walletType !== "listener" || !id });

  const name = walletType === "admin" ? "Admin"
    : walletType === "user" ? ud?.user?.fullName
    : ld?.profile?.fullName || ld?.profile?.displayName;

  return (
    <div>
      <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: "13px", color: T.text, lineHeight: 1.3 }}>
        {name || <span style={{ color: T.faint }}>—</span>}
      </div>
      {id && <CopyId value={id} />}
    </div>
  );
}

function buildPages(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total]);
  for (let i = Math.max(2, cur - 2); i <= Math.min(total - 1, cur + 2); i++) s.add(i);
  const arr = [...s].sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => { if (i > 0 && n - arr[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
}

/* ─── main component ─────────────────────────────────────────────── */
export default function WalletLedgerTable({ ownerId, walletType, txType, fromDate, toDate, setExcelData }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => setPage(1), [ownerId, walletType, txType, fromDate, toDate]);

  const params = { page, pageSize };
  if (ownerId)   params.owner_id    = ownerId;
  if (walletType) params.wallet_type = walletType;
  if (txType)    params.tx_type     = txType;
  if (fromDate)  params.fromDate    = fromDate;
  if (toDate)    params.toDate      = toDate;

  const { data, isLoading, isError } = useGetWalletLedgerQuery(params);
  useEffect(() => { if (data?.data) setExcelData(data.data); }, [data, setExcelData]);

  if (isLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "16px" }}>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: "spin 0.8s linear infinite" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#E2E8F0" strokeWidth="3"/>
        <path d="M16 3 A13 13 0 0 1 29 16" fill="none" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <span style={{ fontFamily: T.font, fontSize: "13px", color: T.muted }}>Loading transactions…</span>
    </div>
  );

  if (isError) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: "10px" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⚠️</div>
      <span style={{ fontFamily: T.font, fontSize: "13px", color: "#DC2626" }}>Failed to load ledger. Please try again.</span>
    </div>
  );

  const rows = data?.data || [];
  const pg = data?.pagination || { totalPages: 1, total: 0 };
  const pages = buildPages(page, pg.totalPages);

  return (
    <div style={{ fontFamily: T.font }}>
      {/* ── meta bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "13px", color: T.muted }}>
          <span style={{ fontWeight: 700, color: T.text, fontFamily: T.mono }}>{pg.total.toLocaleString()}</span>
          {" "}transaction{pg.total !== 1 ? "s" : ""}
        </span>
        {pg.totalPages > 1 && (
          <span style={{ fontFamily: T.mono, fontSize: "11px", color: T.faint, letterSpacing: "0.05em" }}>
            {page} / {pg.totalPages}
          </span>
        )}
      </div>

      {/* ── table ── */}
      <div style={{ borderRadius: "14px", border: `1px solid ${T.border}`, overflow: "hidden", background: T.surface, boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)" }}>
        {/* header */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 110px 155px 130px 130px 130px 170px 160px 120px", background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "0 4px" }}>
          {["Owner", "Wallet", "Type", "Amount", "Before", "After", "Reference", "Note", "Date"].map(h => (
            <div key={h} style={{ padding: "10px 12px", fontSize: "10px", fontWeight: 700, color: T.faint, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {/* rows */}
        {rows.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 0", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>📭</div>
            <span style={{ fontSize: "13px", color: T.muted }}>No transactions match your filters</span>
          </div>
        ) : rows.map((item, idx) => {
          const isDebit = item.tx_type?.includes("debit");
          const tx = TX[item.tx_type] || { label: item.tx_type?.replace(/_/g, " "), fg: T.muted, bg: T.bg, dot: T.faint };
          const wl = WALLET[item.wallet_type] || { label: item.wallet_type, dot: T.faint };
          return (
            <LedgerRow key={item.id} item={item} idx={idx} isDebit={isDebit} tx={tx} wl={wl} totalRows={rows.length} />
          );
        })}
      </div>

      {/* ── pagination ── */}
      {pg.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", marginTop: "24px", flexWrap: "wrap" }}>
          <NavBtn onClick={() => setPage(1)} disabled={page === 1}>«</NavBtn>
          <NavBtn onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</NavBtn>
          {pages.map((p, i) => p === "…"
            ? <span key={`e${i}`} style={{ width: "36px", textAlign: "center", color: T.faint, fontSize: "12px" }}>…</span>
            : <NavBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</NavBtn>
          )}
          <NavBtn onClick={() => setPage(p => p + 1)} disabled={page === pg.totalPages}>›</NavBtn>
          <NavBtn onClick={() => setPage(pg.totalPages)} disabled={page === pg.totalPages}>»</NavBtn>
        </div>
      )}
    </div>
  );
}

/* ─── row (separate component to isolate hover state) ───────────── */
function LedgerRow({ item, idx, isDebit, tx, wl, totalRows }) {
  const [hovered, setHovered] = useState(false);
  const isLast = idx === totalRows - 1;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "200px 110px 155px 130px 130px 130px 170px 160px 120px",
        padding: "0 4px",
        background: hovered ? "#F8FAFF" : idx % 2 === 0 ? "#FFFFFF" : "#FAFBFD",
        borderBottom: isLast ? "none" : `1px solid ${hovered ? "#E0E7FF" : "#F1F5F9"}`,
        transition: "background 0.12s",
        cursor: "default",
      }}
    >
      {/* owner */}
      <Cell><OwnerName id={item.owner_id} walletType={item.wallet_type} /></Cell>

      {/* wallet */}
      <Cell>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: wl.dot, flexShrink: 0, boxShadow: `0 0 0 2px ${wl.dot}22` }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>{wl.label}</span>
        </span>
      </Cell>

      {/* type */}
      <Cell>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: tx.bg, color: tx.fg,
          fontSize: "11px", fontWeight: 700,
          padding: "3px 9px 3px 7px", borderRadius: "20px",
          whiteSpace: "nowrap", letterSpacing: "0.01em",
          border: `1px solid ${tx.fg}22`,
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: tx.fg, flexShrink: 0 }} />
          {tx.label}
        </span>
      </Cell>

      {/* amount */}
      <Cell>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "14px", fontWeight: 600,
          color: isDebit ? "#DC2626" : "#059669",
          letterSpacing: "-0.02em",
        }}>
          {isDebit ? "−" : "+"}₹{Number(item.amount).toFixed(2)}
        </span>
      </Cell>

      {/* before */}
      <Cell>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: T.muted }}>
          ₹{Number(item.balance_before).toFixed(2)}
        </span>
      </Cell>

      {/* after */}
      <Cell>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: T.muted }}>
          ₹{Number(item.balance_after).toFixed(2)}
        </span>
      </Cell>

      {/* reference */}
      <Cell>
        {item.reference_id ? (
          <div>
            {item.reference_type && (
              <div style={{ fontSize: "10px", fontWeight: 600, color: T.faint, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "2px" }}>
                {item.reference_type}
              </div>
            )}
            <CopyId value={item.reference_id} />
          </div>
        ) : <span style={{ color: T.border, fontFamily: "'JetBrains Mono', monospace" }}>—</span>}
      </Cell>

      {/* note */}
      <Cell>
        <span title={item.note || ""} style={{ fontSize: "12px", color: item.note ? "#475569" : T.border, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>
          {item.note || "—"}
        </span>
      </Cell>

      {/* date */}
      <Cell>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 600, color: "#334155", lineHeight: 1.3 }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: T.faint, marginTop: "2px" }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </div>
      </Cell>
    </div>
  );
}

function Cell({ children }) {
  return <div style={{ padding: "13px 12px", display: "flex", alignItems: "center" }}>{children}</div>;
}

function NavBtn({ onClick, disabled, active, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: "36px", height: "36px",
        border: active ? "none" : `1px solid ${hov && !disabled ? "#C7D2FE" : T.border}`,
        borderRadius: "10px",
        background: active ? "#6366F1" : hov && !disabled ? "#EEF2FF" : disabled ? T.bg : "#fff",
        color: active ? "#fff" : disabled ? T.faint : hov && !disabled ? "#4F46E5" : "#334155",
        fontFamily: T.font, fontWeight: active ? 700 : 500, fontSize: "13px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .15s",
        boxShadow: active ? "0 2px 8px #6366F140" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
