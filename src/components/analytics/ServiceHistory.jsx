import React, { useState, useRef } from "react";
import Services from "../payment-management/payment-list/services/Services";
import MultiDatePicker from "../user-management/user-list/date-picker/MultiDatePicker";
import { Button } from "react-bootstrap";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";

function ServiceHistory() {
  const [searchUser, setSearchUser] = useState("");
  const [searchListener, setSearchListener] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [excelSessionData, setExcelSessionData] = useState([]);
  const servicesRefetchRef = useRef(null);

  const exportToExcel = async () => {
    if (!excelSessionData || excelSessionData.length === 0) {
      alert("No data available to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Service History");

    worksheet.columns = [
      { header: "Sr. No", key: "srNo", width: 10 },
      { header: "Date", key: "date", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "User", key: "user", width: 25 },
      { header: "Listener", key: "listener", width: 25 },
      { header: "State", key: "state", width: 20 },
      { header: "Duration (Min)", key: "duration", width: 15 },
      { header: "Net Amount", key: "net_amount", width: 15 },
      { header: "GST (18%)", key: "gst", width: 15 },
      { header: "Total Amount", key: "total", width: 15 },
      { header: "Listener Credit", key: "listener_credit", width: 15 },
      { header: "Admin Credit", key: "admin_credit", width: 15 },
    ];

    excelSessionData.forEach((s, index) => {
      const totalAmount = parseFloat(s.total_amount) || 0;
      const netAmount = totalAmount / 1.18;
      const gstAmount = totalAmount - netAmount;

      worksheet.addRow({
        srNo: index + 1,
        date: moment(s.createdAt).format("DD/MM/YYYY, hh:mm A"),
        status: s.transaction_status,
        type: s.service_type,
        user: s.username,
        listener: s.listenerName,
        state: s.user_state || "N/A",
        duration: s.totalDuration,
        net_amount: netAmount.toFixed(2),
        gst: gstAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        listener_credit: s.listener_credit,
        admin_credit: s.admin_credit,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `service_history_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="service-history-page px-4 py-4">
      <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <h3 className="fw-bold mb-1">Service History</h3>
          <p className="text-muted mb-0">Detailed logs of all call and chat sessions.</p>
        </div>
        <div className="d-flex gap-3 mt-3 mt-md-0">
          <Button variant="outline-primary" className="rounded-3 px-4" onClick={exportToExcel}>
            Export Excel
          </Button>
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      <div className="modern-card mb-4 p-4">
        <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="search-bar border rounded-3 px-3 py-2 bg-white d-flex align-items-center">
                  <input
                    type="text"
                    className="border-0 bg-transparent w-100"
                    placeholder="Filter by User name..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    style={{ outline: 'none', fontSize: '14px' }}
                  />
                  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%2F%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%2F%3E%3C/svg%3E" alt="search" />
              </div>
            </div>
            <div className="col-md-5">
              <div className="search-bar border rounded-3 px-3 py-2 bg-white d-flex align-items-center">
                   <input
                    type="text"
                    className="border-0 bg-transparent w-100"
                    placeholder="Filter by Listener name..."
                    value={searchListener}
                    onChange={(e) => setSearchListener(e.target.value)}
                    style={{ outline: 'none', fontSize: '14px' }}
                  />
                   <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%2F%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%2F%3E%3C/svg%3E" alt="search" />
              </div>
            </div>
            <div className="col-md-2">
                <Button className="w-100 rounded-3 py-2" onClick={() => servicesRefetchRef.current?.()}>
                  Refresh
                </Button>
            </div>
        </div>
      </div>

      <div className="modern-card p-0 overflow-auto shadow-sm">
        <div className="p-4" style={{ minHeight: '60vh' }}>
          <Services
            searchUser={searchUser}
            searchListener={searchListener}
            dateRange={dateRange}
            setExcelSessionData={setExcelSessionData}
            onRefetch={servicesRefetchRef}
          />
        </div>
      </div>
    </div>
  );
}

export default ServiceHistory;
