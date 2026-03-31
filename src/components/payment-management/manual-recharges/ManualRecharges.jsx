import React, { useState } from "react";
import { Button } from "react-bootstrap";
import "./manual-recharges.scss";
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
    <div className="payment-main px-4 py-4">
      <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <h3 className="fw-bold mb-1">Manual Recharges & Adjustments</h3>
          <p className="text-muted mb-0">View all manual credits and debits processed by the platform.</p>
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
        <div className="px-4 pt-3 border-bottom bg-light">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
             <div className="search-bar border rounded-3 px-3 py-1 bg-white" style={{ minWidth: '300px' }}>
                <input
                  type="text"
                  className="border-0 bg-transparent w-100 py-1"
                  placeholder="Search by name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ outline: 'none', fontSize: '14px' }}
                />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white" style={{ minHeight: '50vh' }}>
            <ManualRechargeTable
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
              setExcelData={setExcelData}
            />
        </div>
      </div>
    </div>
  );
}

export default ManualRecharges;
