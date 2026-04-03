import React, { useEffect, useState } from "react";
import { Button, Tab, Tabs } from "react-bootstrap";
import "./payment.scss";
import RechargeTable from "./recharge-table/RechargeTable";
import Gift from "./gift/Gift";
import Payout from "./payout/Payout";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function PaymentList() {
  const [key, setKey] = useState("Recharge");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [excelData, setExcelData] = useState([]);

  useEffect(() => {
    const savedTab = localStorage.getItem("paymentActiveTab");
    if (savedTab && ["Recharge", "Gift", "Payout"].includes(savedTab)) {
      setKey(savedTab);
    }
  }, []);

  const handleTabChange = (k) => {
    setKey(k);
    localStorage.setItem("paymentActiveTab", k);
  };

  const exportToExcel = async (dataArray, fileName = "payment_data.xlsx") => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payments");

    const headers = [
      { header: "Transaction ID", key: "transactionId" },
      { header: "Name", key: "name" },
      { header: "User State", key: "state" },
      { header: "Total Amount", key: "rechargeAmount" },
      { header: "Net Amount", key: "netAmount" },
      { header: "GST (18%)", key: "gst" },
      { header: "Status", key: "status" },
      { header: "Date", key: "transactionDate" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 12,
    }));

    dataArray.forEach((item) => {
      const total = parseFloat(item?.recharge_amount || item?.net_gift_amount || item?.amount || 0);
      const net = parseFloat((total / 1.18).toFixed(2));
      const gst = parseFloat((total - net).toFixed(2));

      worksheet.addRow({
        transactionId: item?.transaction_id || item?.id || "",
        name: item?.name || item?.userData?.fullName || "N/A",
        state: item?.state || "N/A",
        rechargeAmount: total,
        netAmount: net,
        gst: gst,
        status: item?.status || "Success",
        transactionDate: item?.transaction_date || item?.createdAt ? new Date(item.transaction_date || item.createdAt).toLocaleString() : "",
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
          <h3 className="fw-bold mb-1">Financial Management</h3>
          <p className="text-muted mb-0">Monitor recharges, gifts, and platform payouts.</p>
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <Tabs
              id="payment-tabs"
              activeKey={key}
              onSelect={handleTabChange}
              className="border-0 mb-3 mb-md-0 d-flex flex-row"
            >
              <Tab eventKey="Recharge" title="User Recharges" />
              <Tab eventKey="Gift" title="Gift Transactions" />
              <Tab eventKey="Payout" title="Salary Payouts" />
            </Tabs>
            
            <div className="search-bar border rounded-3 px-3 py-1 mb-3 mb-md-0 bg-white" style={{ minWidth: '300px' }}>
                <input
                  type="text"
                  className="border-0 bg-transparent w-100 py-1"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ outline: 'none', fontSize: '14px' }}
                />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white" style={{ minHeight: '50vh' }}>
          {key === "Recharge" && (
            <RechargeTable
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
              dateRange={dateRange}
              setExcelData={setExcelData}
            />
          )}
          {key === "Gift" && (
            <Gift
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          )}
          {key === "Payout" && (
            <Payout
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentList;
