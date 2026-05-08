import React, { useState, useRef } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import { motion } from "framer-motion";
import Services from "../payment-management/payment-list/services/Services";
import MultiDatePicker from "../user-management/user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import {
  Card, CardHeader, CardTitle,
  Button,
  Spinner,
} from "../v2/ui";

const fadeUp = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.3 } } };

const inputCls =
  "tw-w-full tw-bg-bg-secondary tw-text-fg-primary tw-text-[13px] " +
  "tw-border tw-border-hairline tw-border-tertiary tw-rounded-md " +
  "tw-pl-9 tw-pr-3 tw-py-2 tw-outline-none " +
  "focus:tw-ring-2 focus:tw-ring-fg-info tw-transition-shadow tw-duration-fast " +
  "placeholder:tw-text-fg-tertiary";

function ServiceHistory() {
  const [searchUser,     setSearchUser]     = useState("");
  const [searchListener, setSearchListener] = useState("");
  const [dateRange,      setDateRange]      = useState([]);
  const [excelSessionData, setExcelSessionData] = useState([]);
  const [exporting, setExporting] = useState(false);
  const servicesRefetchRef = useRef(null);

  const exportToExcel = async () => {
    if (!excelSessionData || excelSessionData.length === 0) {
      alert("No data available to export");
      return;
    }
    setExporting(true);
    try {
      const workbook  = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Service History");

      worksheet.columns = [
        { header: "Sr. No",             key: "srNo",           width: 10 },
        { header: "Date",               key: "date",           width: 20 },
        { header: "Status",             key: "status",         width: 15 },
        { header: "Type",               key: "type",           width: 15 },
        { header: "User",               key: "user",           width: 25 },
        { header: "Listener",           key: "listener",       width: 25 },
        { header: "State",              key: "state",          width: 20 },
        { header: "Duration (Min)",     key: "duration",       width: 15 },
        { header: "Net Amount",         key: "net_amount",     width: 15 },
        { header: "GST (18%)",          key: "gst",            width: 15 },
        { header: "Total Amount",       key: "total",          width: 15 },
        { header: "Listener Credit",    key: "listener_credit",width: 15 },
        { header: "Admin Credit",       key: "admin_credit",   width: 15 },
        { header: "User Wallet Balance",key: "wallet_balance", width: 18 },
        { header: "End Reason",          key: "end_reason",    width: 30 },
      ];

      excelSessionData.forEach((s, index) => {
        const totalAmount = parseFloat(s.total_amount) || 0;
        const netAmount   = totalAmount / 1.18;
        const gstAmount   = totalAmount - netAmount;
        worksheet.addRow({
          srNo:           index + 1,
          date:           moment(s.createdAt).format("DD/MM/YYYY, hh:mm A"),
          status:         s.transaction_status,
          type:           s.service_type,
          user:           s.username,
          listener:       s.listenerName,
          state:          s.user_state || "N/A",
          duration:       s.totalDuration,
          net_amount:     netAmount.toFixed(2),
          gst:            gstAmount.toFixed(2),
          total:          totalAmount.toFixed(2),
          listener_credit:s.listener_credit,
          admin_credit:   s.admin_credit,
          wallet_balance: s.user_wallet_balance || "0.00",
          end_reason:     s.end_reason || s.endReason || "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `service_history_${Date.now()}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="tw-p-6 tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="tw-flex tw-items-end tw-justify-between tw-flex-wrap tw-gap-4">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Service History</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Detailed logs of all call and chat sessions.
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <MultiDatePicker onChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            disabled={exporting}
            className="tw-flex tw-items-center tw-gap-2"
          >
            {exporting ? <Spinner size={13} /> : <Download size={13} aria-hidden />}
            Export Excel
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="tw-p-4">
          <div className="tw-flex tw-flex-wrap tw-gap-3 tw-items-center"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
            {/* User search */}
            <div className="tw-relative">
              <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary tw-pointer-events-none" aria-hidden />
              <input
                type="text"
                className={inputCls}
                placeholder="Filter by User name…"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            {/* Listener search */}
            <div className="tw-relative">
              <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary tw-pointer-events-none" aria-hidden />
              <input
                type="text"
                className={inputCls}
                placeholder="Filter by Listener name…"
                value={searchListener}
                onChange={(e) => setSearchListener(e.target.value)}
              />
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => servicesRefetchRef.current?.()}
              className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap"
            >
              <RefreshCw size={13} aria-hidden />
              Refresh
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card flush>
          <Services
            searchUser={searchUser}
            searchListener={searchListener}
            dateRange={dateRange}
            setExcelSessionData={setExcelSessionData}
            onRefetch={servicesRefetchRef}
          />
        </Card>
      </motion.div>
    </div>
  );
}

export default ServiceHistory;
