import React, { useState } from "react";
import "./manual-recharges.scss";
import { Card, Button } from "../../v2/ui";
import { Search } from "lucide-react";
import ManualRechargeTable from "./ManualRechargeTable";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function ManualRecharges() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [excelData, setExcelData] = useState([]);

  const exportToExcel = async (dataArray, fileName = "manual_recharges.xlsx") => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Manual Recharges");

    const headers = [
      { header: "Transaction ID", key: "id" },
      { header: "User Name", key: "userName" },
      { header: "Role", key: "role" },
      { header: "Amount", key: "amount" },
      { header: "Type", key: "type" },
      { header: "Reason", key: "reason" },
      { header: "Date", key: "createdAt" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: 20,
    }));

    dataArray.forEach((item) => {
      worksheet.addRow({
        id: item?.id || "",
        userName: item?.user?.fullName || "N/A",
        role: item?.user?.role || "N/A",
        amount: item?.amount || 0,
        type: item?.type || "",
        reason: item?.reason || "",
        createdAt: item?.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Manual Recharges & Adjustments</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">View all manual credits and debits processed by the platform.</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToExcel(excelData)}
          >
            Export to Excel
          </Button>
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search by name or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      <Card flush>
        <ManualRechargeTable
          searchTerm={searchTerm}
          fromDate={dateRange[0]}
          toDate={dateRange[1]}
          setExcelData={setExcelData}
        />
      </Card>
    </div>
  );
}

export default ManualRecharges;
