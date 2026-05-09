import React, { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import WalletLedgerTable from "./WalletLedgerTable";
import { Card, Button } from "../../v2/ui";
import { Search } from "lucide-react";

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
  const [focused, setFocused]           = useState(false);

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
      { header: "Amount (Rs.)", key: "amount", width: 14 },
      { header: "Balance Before (Rs.)", key: "balance_before", width: 20 },
      { header: "Balance After (Rs.)", key: "balance_after", width: 20 },
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
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Wallet Ledger</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Immutable audit trail of every wallet credit and debit</p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportToExcel}>
          Export Excel
        </Button>
      </div>

      {/* Filter card */}
      <Card>
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-items-center">
          {/* Search by owner ID */}
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-1 tw-min-w-[260px]">
            <div className="tw-relative tw-flex-1">
              <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
              <input
                value={ownerId}
                onChange={e => setOwnerId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setAppliedOwnerId(ownerId.trim())}
                placeholder="Search by owner ID..."
                className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
              />
            </div>
            {ownerId && (
              <button
                onClick={() => { setOwnerId(""); setAppliedOwnerId(""); }}
                className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-text-fg-tertiary hover:tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md"
              >
                x
              </button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setAppliedOwnerId(ownerId.trim())}>
              Go
            </Button>
          </div>

          {/* Wallet type filter */}
          <select
            value={walletType}
            onChange={e => setWalletType(e.target.value)}
            className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none tw-min-w-[130px]"
          >
            {WALLET_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* TX type filter */}
          <select
            value={txType}
            onChange={e => setTxType(e.target.value)}
            className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none tw-min-w-[170px]"
          >
            {TX_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <MultiDatePicker onChange={setDateRange} />

          {anyFilter && (
            <Button variant="danger" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Table card */}
      <Card flush>
        <WalletLedgerTable
          ownerId={appliedOwnerId}
          walletType={walletType}
          txType={txType}
          fromDate={dateRange[0]}
          toDate={dateRange[1]}
          setExcelData={setExcelData}
        />
      </Card>
    </div>
  );
}
