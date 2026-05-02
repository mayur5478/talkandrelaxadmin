import React, { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import WalletLedgerTable from "./WalletLedgerTable";

const T = {
  font: "'Plus Jakarta Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
  bg: "#F7F8FC",
  surface: "#FFFFFF",
  border: "#EAEDF3",
  text: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  accent: "#6366F1",
  accentLight: "#EEF2FF",
};

const TX_TYPES = [
  { value: "", label: "All types" },
  { value: "session_debit", label: "Session Debit" },
  { value: "recharge", label: "Recharge" },
  { value: "admin_credit", label: "Admin Credit" },
  { value: "admin_debit", label: "Admin Debit" },
  { value: "session_listener_credit", label: "Listener Credit" },
  { value: "session_admin_credit", label: "Platform Credit" },
];

const WALLET_TYPES = [
  { value: "", label: "All wallets" },
  { value: "user", label: "User" },
  { value: "listener", label: "Listener" },
  { value: "admin", label: "Admin" },
];

export default function WalletLedger() {
  const [ownerId, setOwnerId]           = useState("");
  const [walletType, setWalletType]     = useState("");
  const [txType, setTxType]             = useState("");
  const [dateRange, setDateRange]       = useState([]);
  const [excelData, setExcelData]       = useState([]);
  const [appliedOwnerId, setAppliedOwnerId] = useState("");

  const anyFilter = appliedOwnerId || walletType || txType || dateRange.length > 0;

  const clearAll = () => {
    setOwnerId(""); setAppliedOwnerId("");
    setWalletType(""); setTxType(""); setDateRange([]);
  };

  const exportToExcel = async () => {
    if (!excelData.length) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Wallet Ledger");
    ws.columns = [
      { header: "ID", key: "id", width: 38 },
      { header: "Owner ID", key: "owner_id", width: 38 },
      { header: "Wallet", key: "wallet_type", width: 12 },
      { header: "Type", key: "tx_type", width: 26 },
      { header: "Amount (₹)", key: "amount", width: 14 },
      { header: "Balance Before (₹)", key: "balance_before", width: 20 },
      { header: "Balance After (₹)", key: "balance_after", width: 20 },
      { header: "Reference ID", key: "reference_id", width: 38 },
      { header: "Reference Type", key: "reference_type", width: 16 },
      { header: "Note", key: "note", width: 30 },
      { header: "Date", key: "createdAt", width: 22 },
    ];
    excelData.forEach(item => ws.addRow({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
    }));
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "wallet_ledger.xlsx");
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", padding: "28px 24px" }}>

      {/* ── page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px #6366F140", fontSize: "16px",
              }}>📒</div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
                Wallet Ledger
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: T.muted, paddingLeft: "46px" }}>
              Immutable audit trail of every wallet credit and debit
            </p>
          </div>

          <button
            onClick={exportToExcel}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "#fff", border: `1px solid ${T.border}`,
              borderRadius: "10px", padding: "9px 16px",
              fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: "#334155",
              cursor: "pointer", boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = "#334155"; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* ── filter card ── */}
      <div style={{
        background: T.surface, borderRadius: "14px",
        border: `1px solid ${T.border}`,
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        marginBottom: "16px",
        padding: "14px 18px",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>

          {/* search */}
          <SearchInput
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setAppliedOwnerId(ownerId.trim())}
            onClear={() => { setOwnerId(""); setAppliedOwnerId(""); }}
            onSearch={() => setAppliedOwnerId(ownerId.trim())}
          />

          <SelectFilter value={walletType} onChange={e => setWalletType(e.target.value)} options={WALLET_TYPES} />
          <SelectFilter value={txType} onChange={e => setTxType(e.target.value)} options={TX_TYPES} width="190px" />

          <div style={{ display: "flex", alignItems: "center" }}>
            <MultiDatePicker onChange={setDateRange} />
          </div>

          {anyFilter && (
            <button
              onClick={clearAll}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: "8px", padding: "6px 12px",
                fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: "#DC2626",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── table card ── */}
      <div style={{ background: T.surface, borderRadius: "14px", border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(15,23,42,0.04)", padding: "20px 20px 24px" }}>
        <WalletLedgerTable
          ownerId={appliedOwnerId}
          walletType={walletType}
          txType={txType}
          fromDate={dateRange[0]}
          toDate={dateRange[1]}
          setExcelData={setExcelData}
        />
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, onKeyDown, onClear, onSearch }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      background: "#fff", border: `1.5px solid ${focused ? T.accent : T.border}`,
      borderRadius: "10px", padding: "6px 10px",
      minWidth: "260px", transition: "border-color .15s",
      boxShadow: focused ? `0 0 0 3px ${T.accentLight}` : "none",
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: focused ? T.accent : T.faint, flexShrink: 0 }}>
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <input
        value={value} onChange={onChange} onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder="Search by owner ID…"
        style={{
          border: "none", outline: "none", fontSize: "13px",
          fontFamily: T.font, color: T.text, background: "transparent", width: "100%",
          "::placeholder": { color: T.faint },
        }}
      />
      {value && (
        <button onClick={onClear} style={{ background: "none", border: "none", padding: "0 2px", cursor: "pointer", color: T.faint, fontSize: "16px", lineHeight: 1, display: "flex" }}>×</button>
      )}
      <button
        onClick={onSearch}
        style={{
          background: T.accent, border: "none", borderRadius: "6px",
          padding: "3px 10px", color: "#fff",
          fontFamily: T.font, fontSize: "12px", fontWeight: 600,
          cursor: "pointer", whiteSpace: "nowrap",
        }}
      >Go</button>
    </div>
  );
}

function SelectFilter({ value, onChange, options, width = "150px" }) {
  return (
    <select
      value={value} onChange={onChange}
      style={{
        appearance: "none", background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394A3B8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center`,
        border: `1.5px solid ${T.border}`, borderRadius: "10px",
        padding: "7px 30px 7px 12px",
        fontFamily: T.font, fontSize: "13px", fontWeight: 500, color: value ? T.text : T.muted,
        cursor: "pointer", width, outline: "none",
        transition: "border-color .15s",
      }}
      onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentLight}`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
