import React, { useEffect, useState, useRef } from "react";
import { Button, Tab, Tabs } from "react-bootstrap";
import search from "../../assets/search.png";
import "./payment.scss";
import RechargeTable from "./recharge-table/RechargeTable";
import Gift from "./gift/Gift";
import Services from "./services/Services";
import Payout from "./payout/Payout";
import Rejections from "./rejections/Rejections";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
function PaymentList() {
  const [modalShow, setModalShow] = useState(false);
  const [key, setKey] = useState("Recharge");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchListener, setSearchListener] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const servicesRefetchRef = useRef(null);
  console.log("dateRange", dateRange);
  const [excelData, setExcelData] = useState();
  const [excelSessionData, setExcelSessionData] = useState();
  console.log("excelData", excelData);
  const activeTab = localStorage.getItem("paymentActiveTab");
  console.log("active", activeTab);

  useEffect(() => {
    const savedTab = localStorage.getItem("paymentActiveTab");
    if (savedTab) {
      setKey(savedTab);
    }
  }, []);
  const handleTabChange = (k) => {
    setKey(k);
    localStorage.setItem("paymentActiveTab", k);
  };
  const exportToExcel = async (dataArray, fileName = "recharge_data.xlsx") => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Recharges");

    // Define headers and their keys (order matters)
    const headers = [
      { header: "Transaction ID", key: "transactionId" },
      { header: "User ID", key: "userId" },
      { header: "Name", key: "name" },
      { header: "Country", key: "country" },
      { header: "State", key: "state" },
      { header: "Recharge Amount", key: "rechargeAmount" },
      { header: "GST Amount", key: "gstAmount" },
      { header: "Net Recharge", key: "netRecharge" },
      { header: "Coupon ID", key: "coupenId" },
      { header: "Transaction Type", key: "type" },
      { header: "Transaction Date", key: "transactionDate" },
      { header: "Razorpay Order ID", key: "razorpayOrderId" },
      { header: "Razorpay Payment ID", key: "razorpayPaymentId" },
      { header: "Razorpay Signature", key: "razorpaySignature" },
      { header: "Status", key: "status" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 10, // Initial width; auto adjusted later
    }));

    // Add data rows
    dataArray.forEach((item) => {
      worksheet.addRow({
        transactionId: item?.transaction_id || "",
        userId: item?.user_id || "",

        name: item?.name || "",
        country: item?.country || "",
        state: item?.state || "",
        rechargeAmount: item?.recharge_amount || "",
        gstAmount: item?.gst_amount || "",
        netRecharge: item?.net_recharge || "",
        coupenId: item?.coupen_id || "",
        type: item?.type || "",
        transactionDate: item?.transaction_date
          ? new Date(item.transaction_date).toLocaleString()
          : "",
        razorpayOrderId: item?.razorpay_order_id || "",
        razorpayPaymentId: item?.razorpay_payment_id || "",
        razorpaySignature: item?.razorpay_signature || "",
        status: item?.status || "",
      });
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Apply conditional formatting to status column
    const statusColIndex = headers.findIndex((h) => h.key === "status") + 1;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const statusCell = row.getCell(statusColIndex);
      const status = statusCell.value?.toString().toLowerCase();

      if (status === "pending") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC000" }, // yellow
        };
        statusCell.font = { bold: true, color: { argb: "000000" } };
      } else if (status === "success") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "548235" }, // green
        };
        statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
      } else if (status === "failed") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0000" }, // red
        };
        statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
      }

      statusCell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Auto-size all columns
    worksheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const text = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, text.length);
      });
      col.width = maxLength + 2;
    });

    // Write to file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, fileName);
  };
  const exportSessionsToExcel = async (
    dataArray,
    fileName = "sessions.xlsx"
  ) => {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sessions");

    // Define headers
    const headers = [
      { header: "Sr. No", key: "srNo" },
      { header: "Service Type", key: "service_type" },
      { header: "User Name", key: "username" },
      { header: "Listener Name", key: "listenerName" },
      { header: "Minutes", key: "totalDuration" },
      { header: "Total Amount", key: "total_amount" },
      { header: "Listener Credit", key: "listener_credit" },
      { header: "Admin Commission", key: "admin_credit" },
      { header: "Transaction Status", key: "transaction_status" },
      { header: "Transaction Date", key: "createdAt" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 10,
    }));

    // Add data rows
    dataArray.forEach((session, index) => {
      worksheet.addRow({
        srNo: index + 1,
        service_type: session?.service_type || "",
        username: session?.username || "",
        listenerName: session?.listenerName || "",
        totalDuration: session?.totalDuration || 0,
        total_amount: session?.total_amount || 0,
        listener_credit: session?.listener_credit || 0,
        admin_credit: session?.admin_credit || 0,
        transaction_status: session?.transaction_status || "",
        createdAt: session?.createdAt
          ? moment(session.createdAt).format("DD/MM/YYYY, hh:mm A")
          : "",
      });
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Conditional formatting for status column
    const statusColIndex =
      headers.findIndex((h) => h.key === "transaction_status") + 1;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const statusCell = row.getCell(statusColIndex);
      const status = statusCell.value?.toString().toLowerCase();

      if (status === "pending") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC000" }, // yellow
        };
        statusCell.font = { bold: true, color: { argb: "000000" } };
      } else if (status === "success") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "548235" }, // green
        };
        statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
      } else if (status === "failed") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0000" }, // red
        };
        statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
      }

      statusCell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Auto-size columns
    worksheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const text = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, text.length);
      });
      col.width = maxLength + 2;
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, fileName);
  };

  return (
    <div className="payment-main">
      {/* Top Section */}
      <div className="top-section">
        <div className="left-section">
          {key === "Recharge" ? (
            <>
              <Button
                onClick={() => {
                  if (excelData && excelData.length > 0) {
                    exportToExcel(excelData);
                  } else {
                    alert("No data to export!");
                  }
                }}
              >
                Excel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (excelSessionData && excelSessionData.length > 0) {
                    exportSessionsToExcel(excelSessionData);
                  } else {
                    alert("No data to export!");
                  }
                }}
              >
                Excel
              </Button>
            </>
          )}

          {key === "Services" ? (
            <>
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search User"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // Force refetch to bypass React Query cache
                      if (servicesRefetchRef.current) {
                        servicesRefetchRef.current();
                      }
                    }
                  }}
                />
                <img src={search} alt="Search" className="search-icon" />
              </div>
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Listener"
                  value={searchListener}
                  onChange={(e) => setSearchListener(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // Force refetch to bypass React Query cache
                      if (servicesRefetchRef.current) {
                        servicesRefetchRef.current();
                      }
                    }
                  }}
                />
                <img src={search} alt="Search" className="search-icon" />
              </div>
            </>
          ) : (
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search User"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <img src={search} alt="Search" className="search-icon" />
            </div>
          )}
        </div>

        <div className="right-section">
          <Tabs
            id="controlled-tab-example"
            activeKey={key}
            onSelect={handleTabChange}
            className="tabs"
          >
            <Tab
              className={`${activeTab === "Recharge" ? "tap" : ""}`}
              eventKey="Recharge"
              title="Recharge"
            ></Tab>
            <Tab eventKey="Gift" title="Gift"></Tab>
            <Tab eventKey="Services" title="Sessions"></Tab>
            <Tab eventKey="Payout" title="Payout"></Tab>
            <Tab eventKey="Rejections" title="Rejections"></Tab>
          </Tabs>
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="table">
        {key === "Recharge" && (
          <div className="tab-content">
            <RechargeTable
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
              dateRange={dateRange}
              setExcelData={setExcelData}
            />
          </div>
        )}
        {key === "Gift" && (
          <div className="tab-content">
            <Gift
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          </div>
        )}
        {key === "Services" && (
          <div className="tab-content">
            <Services
              searchUser={searchUser}
              searchListener={searchListener}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
              dateRange={dateRange}
              setExcelSessionData={setExcelSessionData}
              onRefetch={servicesRefetchRef}
            />
          </div>
        )}
        {key === "Payout" && (
          <div className="tab-content">
            <Payout
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          </div>
        )}
        {key === "Rejections" && (
          <div className="tab-content">
            <Rejections
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentList;
