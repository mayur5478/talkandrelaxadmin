import React, { useEffect, useState } from "react";
import { Table, Spinner, Badge } from "react-bootstrap";
import { useGetWalletLedgerQuery } from "../../../services/recharge";
import { useUserProfileQuery } from "../../../services/user";
import { useListenerProfileQuery } from "../../../services/listener";

const TX_COLOR = {
  session_debit: "#dc3545",
  recharge: "#198754",
  admin_credit: "#198754",
  admin_debit: "#dc3545",
  session_listener_credit: "#0dcaf0",
  session_admin_credit: "#0d6efd",
};

const TX_BG = {
  session_debit: "#fff5f5",
  recharge: "#f0fff4",
  admin_credit: "#f0fff4",
  admin_debit: "#fff5f5",
  session_listener_credit: "#f0fbff",
  session_admin_credit: "#f0f5ff",
};

const WALLET_BADGE = {
  user: { bg: "#6c757d", label: "User" },
  listener: { bg: "#0dcaf0", label: "Listener" },
  admin: { bg: "#212529", label: "Admin" },
};

function CopyCell({ value, display }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <span
      onClick={copy}
      title={copied ? "Copied!" : value}
      style={{
        fontFamily: "monospace",
        fontSize: "11px",
        color: copied ? "#198754" : "#6c757d",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ copied" : display}
    </span>
  );
}

function OwnerName({ id, walletType }) {
  const isUser = walletType === "user";
  const isListener = walletType === "listener";

  const { data: userData } = useUserProfileQuery(id, { skip: !isUser || !id });
  const { data: listenerData } = useListenerProfileQuery(id, { skip: !isListener || !id });

  if (walletType === "admin") return <span style={{ fontWeight: 500, color: "#212529" }}>Admin</span>;

  const name = isUser
    ? userData?.user?.fullName
    : listenerData?.profile?.fullName || listenerData?.profile?.displayName;

  if (!name) {
    return (
      <CopyCell value={id || ""} display={`${id?.slice(0, 8)}…`} />
    );
  }

  return (
    <div>
      <div style={{ fontWeight: 500, color: "#212529", fontSize: "13px" }}>{name}</div>
      <CopyCell value={id || ""} display={`${id?.slice(0, 8)}…`} />
    </div>
  );
}

function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total]);
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

const WalletLedgerTable = ({ ownerId, walletType, txType, fromDate, toDate, setExcelData }) => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => { setPage(1); }, [ownerId, walletType, txType, fromDate, toDate]);

  const params = { page, pageSize };
  if (ownerId) params.owner_id = ownerId;
  if (walletType) params.wallet_type = walletType;
  if (txType) params.tx_type = txType;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const { data, isLoading, isError } = useGetWalletLedgerQuery(params);

  useEffect(() => {
    if (data?.data) setExcelData(data.data);
  }, [data, setExcelData]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted small">Loading ledger…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-5">
        <div style={{ fontSize: "32px" }}>⚠️</div>
        <p className="text-danger mt-2">Failed to load wallet ledger. Please try again.</p>
      </div>
    );
  }

  const rows = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };
  const pages = buildPages(page, pagination.totalPages);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 px-1">
        <span style={{ fontSize: "13px", color: "#6c757d" }}>
          <strong style={{ color: "#212529" }}>{pagination.total.toLocaleString()}</strong>{" "}
          record{pagination.total !== 1 ? "s" : ""}
        </span>
        {pagination.totalPages > 1 && (
          <span style={{ fontSize: "12px", color: "#6c757d" }}>
            Page {page} of {pagination.totalPages}
          </span>
        )}
      </div>

      <div className="table-responsive" style={{ borderRadius: "10px", border: "1px solid #e9ecef", overflow: "hidden" }}>
        <Table className="mb-0 align-middle" style={{ fontSize: "13px", tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
              {["Owner ID", "Wallet", "Type", "Amount", "Before", "After", "Reference", "Note", "Date"].map((h) => (
                <th
                  key={h}
                  className="border-0 text-uppercase"
                  style={{ fontSize: "11px", fontWeight: 600, color: "#6c757d", letterSpacing: "0.5px", padding: "10px 14px", whiteSpace: "nowrap" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item, idx) => {
                const isDebit = item.tx_type?.includes("debit");
                const rowBg = idx % 2 === 0 ? "#ffffff" : "#fafafa";
                const accentColor = TX_COLOR[item.tx_type] || "#6c757d";
                const wallet = WALLET_BADGE[item.wallet_type] || { bg: "#6c757d", label: item.wallet_type };

                return (
                  <tr
                    key={item.id}
                    style={{
                      background: rowBg,
                      borderLeft: `3px solid ${accentColor}`,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = TX_BG[item.tx_type] || "#f8f9fa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <OwnerName id={item.owner_id} walletType={item.wallet_type} />
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          background: wallet.bg,
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "20px",
                          textTransform: "capitalize",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {wallet.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          background: accentColor + "22",
                          color: accentColor,
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.tx_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: isDebit ? "#dc3545" : "#198754" }}>
                        {isDebit ? "−" : "+"}₹{Number(item.amount).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6c757d", whiteSpace: "nowrap" }}>
                      ₹{Number(item.balance_before).toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6c757d", whiteSpace: "nowrap" }}>
                      ₹{Number(item.balance_after).toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {item.reference_id ? (
                        <CopyCell
                          value={item.reference_id}
                          display={`${item.reference_type ? item.reference_type + "/" : ""}${item.reference_id.slice(0, 8)}…`}
                        />
                      ) : (
                        <span style={{ color: "#ced4da" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: "160px" }}>
                      <div
                        className="text-truncate"
                        title={item.note || ""}
                        style={{ fontSize: "12px", color: item.note ? "#495057" : "#ced4da" }}
                      >
                        {item.note || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "#212529" }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6c757d" }}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-5">
                  <div style={{ fontSize: "28px", marginBottom: "8px" }}>📭</div>
                  <div style={{ color: "#6c757d", fontSize: "14px" }}>No ledger records found for the selected filters.</div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 gap-1" style={{ flexWrap: "wrap" }}>
          <PaginationBtn onClick={() => setPage(1)} disabled={page === 1} label="«" />
          <PaginationBtn onClick={() => setPage((p) => p - 1)} disabled={page === 1} label="‹" />
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} style={{ padding: "5px 4px", color: "#6c757d", lineHeight: "28px" }}>…</span>
            ) : (
              <PaginationBtn key={p} onClick={() => setPage(p)} active={p === page} label={p} />
            )
          )}
          <PaginationBtn onClick={() => setPage((p) => p + 1)} disabled={page === pagination.totalPages} label="›" />
          <PaginationBtn onClick={() => setPage(pagination.totalPages)} disabled={page === pagination.totalPages} label="»" />
        </div>
      )}
    </>
  );
};

function PaginationBtn({ onClick, disabled, active, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: "34px",
        height: "34px",
        padding: "0 8px",
        border: active ? "none" : "1px solid #dee2e6",
        borderRadius: "8px",
        background: active ? "#0d6efd" : disabled ? "#f8f9fa" : "#fff",
        color: active ? "#fff" : disabled ? "#adb5bd" : "#495057",
        fontWeight: active ? 600 : 400,
        fontSize: "13px",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.15s",
        boxShadow: active ? "0 2px 6px #0d6efd44" : "none",
      }}
      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = "#e9ecef"; }}
      onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.background = "#fff"; }}
    >
      {label}
    </button>
  );
}

export default WalletLedgerTable;
