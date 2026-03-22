import React, { useEffect, useState } from "react";
import "./salaryPayout.scss";
import { Button, Form } from "react-bootstrap";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import salaryIcon from "../../assets/salary.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import ExportExcel from "../../common/export-modal/ExportExcel";
import {
  usePayoutsListQuery,
  usePaySalaryMutation,
  usePaySalaryUserMutation,
} from "../../../services/listener";
import { useNavigate } from "react-router-dom";
import SalaryModal from "../../common/salary-modal/SalaryModal";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";

import { saveAs } from "file-saver";
function SalaryPyout() {
  const [modalShow, setModalShow] = useState(false);
  const [bankDetails, setBankDetails] = useState({});
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
   const [netAmount, setNetAmount] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [salaryModalShow, setSalaryModalShow] = useState(false);
  const { data, isLoading } = usePayoutsListQuery({
    page,
    limit,
    search: searchText,
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
  });

  const handleLimitChange = (e) => {
    const value = e.target.value;
    setLimit(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
    setPage(1);
  };
  const navigate = useNavigate();
  const handleView2 = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };


  const salaryPopup = (details) => {
    setSalaryModalShow(true);
    setBankDetails(details);
    console.log("bank",details);
      setNetAmount(details?.net_amount);
    setName(details?.name);
    setAmount(details?.amount);
  };
  const [paySalaryUser, { isLoading: salaryLoading }] = usePaySalaryMutation();
console.log("bank----",bankDetails);

  const handlePayUser = async () => {
    paySalaryUser({ id: bankDetails?.id, amount: bankDetails?.amount,transaction_id:bankDetails?.transaction_id })
      .unwrap()
      .then((res) => {
        setSalaryModalShow(false);
      })
      .catch((err) => {
        setSalaryModalShow(false);
        console.error(err);
      });
  };

  const exportToExcel = async (data, fileName = "recharge_data.xlsx") => {
  const payouts = (data?.data?.payouts || []).map((item) => ({
    transactionId: item?.transaction_id?.toString() || "",
    ListenerName: item?.listener?.display_name || "Unknown",
    Month: item?.month || "",
    callTime: Number(item?.call_time) || 0,
    CallAmount: Number(item?.call_amount) || 0,
    chatTime: Number(item?.chat_time) || 0,
    ChatAmount: Number(item?.chat_amount) || 0,
    VideoCallTime: Number(item?.v_call_time) || 0,
    VideoCallAmount: Number(item?.v_call_amount) || 0,
    GiftAmount: Number(item?.gift_amount) || 0,
    TotalPayout: Number(item?.payout_amount) || 0,
    tax: `${item?.tax || 0} %`,
    taxAmount: Number(item?.tax_amount) || 0,
    violationPenalty: Number(item?.violation_penalty) || 0,
    MissedSessionPenalty: Number(item?.missed_session_penalty) || 0,
    LeavePenalty: Number(item?.leave_penalty) || 0,
    NetPayout: Number(item?.net_payout_amount) || 0,
    bankName: item?.listener?.bank_name || "",
    IFSC: item?.listener?.ifsc_code || "",
    bankAccountNumber: item?.listener?.account_number || "",
    upi: item?.listener?.upi_id || "",
    Status: item?.status || "",
  })).sort((a, b) => a.transactionId.localeCompare(b.transactionId));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payouts");

  const headers = Object.keys(payouts[0] || []);

  // Add and style header row
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F81BD" }, // Blue
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Add data rows
  payouts.forEach((entry) => {
    const row = worksheet.addRow(headers.map((key) => entry[key]));

    const statusIndex = headers.indexOf("Status");
    const statusValue = entry.Status?.toLowerCase();
    const statusCell = row.getCell(statusIndex + 1);

    if (statusValue === "pending") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC000" },
      };
      statusCell.font = { bold: true, color: { argb: "000000" } };
    } else if (statusValue === "success") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "548235" },
      };
      statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
    } else if (statusValue === "failed") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0000" },
      };
      statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
    }

    statusCell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Auto-fit column widths
  worksheet.columns.forEach((col) => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, val.length);
    });
    col.width = maxLength + 2;
  });

  // Write and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, fileName);
};


  return (
    <div className="salary-payout-main">
      <div className="top-section">
        <div className="left-section">
          <Button
            onClick={() => exportToExcel(data || [], "payouts_data.xlsx")}
          >
            Excel
          </Button>

          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={searchText}
              onChange={handleSearch}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>
        <div className="right-section">
          <MultiDatePicker onChange={setDateRange} />
        </div>
      </div>

      <div className="table">
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Full Name <img className="sort" src={sort} alt="sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">Email ID</p>
          </div>
          <div>
            <p className="heading-text">Bank Account Number</p>
          </div>
          <div>
            <p className="heading-text">Bank Name</p>
          </div>
          <div>
            <p className="heading-text">Ifsc</p>
          </div>
          <div>
            <p className="heading-text">UPI ID</p>
          </div>
          <div>
            <p className="heading-text">Status</p>
          </div>
          <div>
            <p className="heading-text">Salary Month</p>
          </div>
          <div>
            <p className="heading-text">
              Payout Amount <img className="sort" src={sort} alt="sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Net Payout Amount <img className="sort" src={sort} alt="sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Leave Penalty <img className="sort" src={sort} alt="sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">Session Missed Penalty</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {!isLoading && data?.data?.payouts.length > 0 ? (
          data?.data?.payouts.map((item, index) => (
            <div key={item._id} className="table-body">
              <div>
                <p className="heading-text">
                  {page && limit !== "all"
                    ? (page - 1) * limit + index + 1
                    : index + 1}
                </p>
              </div>
              <div>
                <p
                  onClick={() => handleView2(item?.listener_id)}
                  className="heading-text name"
                >
                  {item.display_name}
                </p>
              </div>
              <div>
                <p className="heading-text">{item.email}</p>
              </div>
              <div>
                <p className="heading-text">
                  {item?.listener?.account_number || "-"}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {item?.listener?.bank_name || "-"}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {item?.listener?.ifsc_code || "-"}
                </p>
              </div>
              <div>
                <p className="heading-text">{item?.listener?.upi_id || "-"}</p>
              </div>

              <div>
                <p
                  className={`heading-text  ${
                    item.status === "pending" || item.status === "failed"
                      ? "red-text"
                      : "green-text"
                  }`}
                >
                  {item.status}
                </p>
              </div>
              <div>
                <p className="heading-text">{item.month || "-"}</p>
              </div>
              <div>
                <p className="heading-text">
                  {parseFloat(item.payout_amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p
                  className={`heading-text   ${
                    item.status === "pending" || item.status === "failed"
                      ? "red-text"
                      : "green-text"
                  } `}
                >
                  {parseFloat(item.net_payout_amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {parseFloat(item.leave_penalty || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {parseFloat(item.missed_session_penalty || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <div className="actions">
                  <img
                    onClick={() =>
                      salaryPopup({
                        name: item?.listener?.display_name,
                        amount: item?.payout_amount,
                        net_amount: item?.net_payout_amount,
                        id: item?.listener_id,
                        transaction_id:item?.transaction_id
                      })
                    }
                    src={salaryIcon}
                    alt="salary-icon"
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="table-body ">
            <p className="heading-text ">No records found.</p>
          </div>
        )}

        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Page:</p>
            <Form.Select value={limit} onChange={handleLimitChange}>
              {[2, 5, 10, 15, 20, 25, 30, "all"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="pagination-details">
            <div className="pagination-numbers">
              <p>{(page - 1) * limit + 1}</p>-
              <p>{Math.min(page * limit, data?.data?.total)}</p>
              <p>of</p>
              <p>{data?.data?.total || 0}</p>
            </div>
            <div className="pagination-controls">
              <img
                src={backwardIcon}
                alt="first-page"
                onClick={() => setPage(1)}
              />
              <img
                src={backIcon}
                alt="prev-page"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              />
              <img
                src={frontIcon}
                alt="next-page"
                onClick={() => setPage((prev) => prev + 1)}
              />
              <img
                src={forwardIcon}
                alt="last-page"
                onClick={() => setPage(Math.ceil((data?.total || 0) / limit))}
              />
            </div>
          </div>
        </div>
      </div>

      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
      <SalaryModal
        show={salaryModalShow}
        onHide={() => setSalaryModalShow(false)}
        onConfirm={handlePayUser}
        amount={amount}
        netAmount={netAmount}
        userName={name}
        isMutationLoading={salaryLoading}
      />
    </div>
  );
}

export default SalaryPyout;
