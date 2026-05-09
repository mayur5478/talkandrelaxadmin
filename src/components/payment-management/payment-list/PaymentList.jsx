import React, { useEffect, useState } from "react";
import "./payment.scss";
import { Card, CardHeader, CardTitle, Button, Tabs, TabsList, Tab, TabPanel } from "../../v2/ui";
import { Search } from "lucide-react";
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
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Financial Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Monitor recharges, gifts, and platform payouts.</p>
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

      {/* Toolbar: search */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      <Card flush>
        <Tabs value={key} onChange={handleTabChange}>
          <TabsList ariaLabel="Payment sections">
            <Tab value="Recharge">User Recharges</Tab>
            <Tab value="Gift">Gift Transactions</Tab>
            <Tab value="Payout">Salary Payouts</Tab>
          </TabsList>
          <TabPanel value="Recharge">
            <RechargeTable
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
              dateRange={dateRange}
              setExcelData={setExcelData}
            />
          </TabPanel>
          <TabPanel value="Gift">
            <Gift
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          </TabPanel>
          <TabPanel value="Payout">
            <Payout
              searchTerm={searchTerm}
              fromDate={dateRange[0]}
              toDate={dateRange[1]}
            />
          </TabPanel>
        </Tabs>
      </Card>
    </div>
  );
}

export default PaymentList;
