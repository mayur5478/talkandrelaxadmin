import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import WalletLedgerTable from "./WalletLedgerTable";

const TX_TYPES = [
  { value: "", label: "All Types" },
  { value: "session_debit", label: "Session Debit" },
  { value: "recharge", label: "Recharge" },
  { value: "admin_credit", label: "Admin Credit" },
  { value: "admin_debit", label: "Admin Debit" },
  { value: "session_listener_credit", label: "Listener Credit" },
  { value: "session_admin_credit", label: "Admin Session Credit" },
];

const WALLET_TYPES = [
  { value: "", label: "All Wallets" },
  { value: "user", label: "User" },
  { value: "listener", label: "Listener" },
  { value: "admin", label: "Admin" },
];

function WalletLedger() {
  const [ownerId, setOwnerId] = useState("");
  const [walletType, setWalletType] = useState("");
  const [txType, setTxType] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [appliedOwnerId, setAppliedOwnerId] = useState("");

  const handleSearch = () => setAppliedOwnerId(ownerId.trim());

  const exportToExcel = async (dataArray, fileName = "wallet_ledger.xlsx") => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Wallet Ledger");

    worksheet.columns = [
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

    dataArray.forEach((item) => {
      worksheet.addRow({
        id: item.id || "",
        owner_id: item.owner_id || "",
        wallet_type: item.wallet_type || "",
        tx_type: item.tx_type || "",
        amount: item.amount || 0,
        balance_before: item.balance_before || 0,
        balance_after: item.balance_after || 0,
        reference_id: item.reference_id || "",
        reference_type: item.reference_type || "",
        note: item.note || "",
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  };

  return (
    <div className="payment-main px-4 py-4">
      <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <h3 className="fw-bold mb-1" style={{ fontSize: "22px" }}>
            📒 Wallet Ledger
          </h3>
          <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
            Immutable audit trail of every wallet credit and debit.
          </p>
        </div>
        <div className="d-flex gap-3 mt-3 mt-md-0">
          <Button
            variant="outline-primary"
            className="rounded-3 px-4"
            onClick={() => exportToExcel(excelData)}
          >
            Export to Excel
          </Button>
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      <div className="modern-card p-0 overflow-auto shadow-sm">
        <div className="px-4 py-3 border-bottom" style={{ background: "#f8f9fa" }}>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {/* Owner ID search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "4px 10px",
                minWidth: "260px",
                gap: "6px",
              }}
            >
              <span style={{ color: "#adb5bd", fontSize: "14px" }}>🔍</span>
              <input
                type="text"
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }}
                placeholder="Search by owner ID…"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {ownerId && (
                <button
                  onClick={() => { setOwnerId(""); setAppliedOwnerId(""); }}
                  style={{ background: "none", border: "none", color: "#adb5bd", cursor: "pointer", padding: "0 2px", fontSize: "14px", lineHeight: 1 }}
                >
                  ×
                </button>
              )}
              <Button size="sm" variant="primary" style={{ borderRadius: "6px", padding: "2px 12px", fontSize: "12px" }} onClick={handleSearch}>
                Go
              </Button>
            </div>

            {/* Wallet type */}
            <Form.Select
              size="sm"
              style={{ maxWidth: "150px", borderRadius: "8px", fontSize: "13px", border: "1px solid #dee2e6" }}
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
            >
              {WALLET_TYPES.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </Form.Select>

            {/* TX type */}
            <Form.Select
              size="sm"
              style={{ maxWidth: "210px", borderRadius: "8px", fontSize: "13px", border: "1px solid #dee2e6" }}
              value={txType}
              onChange={(e) => setTxType(e.target.value)}
            >
              {TX_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Form.Select>

            {/* Active filter chips */}
            {(appliedOwnerId || walletType || txType) && (
              <button
                onClick={() => { setOwnerId(""); setAppliedOwnerId(""); setWalletType(""); setTxType(""); }}
                style={{
                  background: "#fff3cd", border: "1px solid #ffc107", color: "#856404",
                  borderRadius: "20px", fontSize: "12px", padding: "3px 12px", cursor: "pointer",
                }}
              >
                Clear filters ×
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-white" style={{ minHeight: "50vh" }}>
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
    </div>
  );
}

export default WalletLedger;
