import React, { useEffect, useState } from "react";
import "./salaryPayout.scss";
import { Search } from "lucide-react";
import {
  Card,
  Button,
  IconButton,
  Pill,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pagination,
} from "../../v2/ui";
import ExportExcel from "../../common/export-modal/ExportExcel";
import {
  usePayoutsListQuery,
  usePaySalaryMutation,
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
    setNetAmount(details?.net_amount);
    setName(details?.name);
    setAmount(details?.amount);
  };
  const [paySalaryUser, { isLoading: salaryLoading }] = usePaySalaryMutation();

  const handlePayUser = async () => {
    paySalaryUser({ id: bankDetails?.id, amount: bankDetails?.amount, transaction_id: bankDetails?.transaction_id })
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

    const headerRow = worksheet.addRow(headers);
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
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    payouts.forEach((entry) => {
      const row = worksheet.addRow(headers.map((key) => entry[key]));

      const statusIndex = headers.indexOf("Status");
      const statusValue = entry.Status?.toLowerCase();
      const statusCell = row.getCell(statusIndex + 1);

      if (statusValue === "pending") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } };
        statusCell.font = { bold: true, color: { argb: "000000" } };
      } else if (statusValue === "success") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "548235" } };
        statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
      } else if (statusValue === "failed") {
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000" } };
        statusCell.font = { bold: true, color: { argb: "FFFFFF" } };
      }

      statusCell.alignment = { vertical: "middle", horizontal: "center" };
    });

    worksheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);
      });
      col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, fileName);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Salary Payout</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage and process listener salary payouts</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToExcel(data || [], "payouts_data.xlsx")}
          >
            Export Excel
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
            placeholder="Search User"
            value={searchText}
            onChange={handleSearch}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      {/* Table card */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={8} cols={14} />
        ) : (
          <>
            <div className="tw-overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <Th>Sr. No</Th>
                    <Th>Full Name</Th>
                    <Th>Email ID</Th>
                    <Th>Bank Account Number</Th>
                    <Th>Bank Name</Th>
                    <Th>IFSC</Th>
                    <Th>UPI ID</Th>
                    <Th>Status</Th>
                    <Th>Salary Month</Th>
                    <Th>Payout Amount</Th>
                    <Th>Net Payout Amount</Th>
                    <Th>Leave Penalty</Th>
                    <Th>Session Missed Penalty</Th>
                    <Th>Action</Th>
                  </TR>
                </THead>
                <TBody>
                  {!isLoading && data?.data?.payouts?.length > 0 ? (
                    data?.data?.payouts.map((item, index) => (
                      <TR key={item._id} isLast={index === data?.data?.payouts?.length - 1}>
                        <Td>
                          {page && limit !== "all"
                            ? (page - 1) * limit + index + 1
                            : index + 1}
                        </Td>
                        <Td>
                          <span
                            onClick={() => handleView2(item?.listener_id)}
                            className="tw-text-fg-primary tw-font-medium tw-cursor-pointer hover:tw-underline"
                          >
                            {item.display_name}
                          </span>
                        </Td>
                        <Td>{item.email}</Td>
                        <Td className="tw-font-mono tw-text-[12px]">{item?.listener?.account_number || "-"}</Td>
                        <Td>{item?.listener?.bank_name || "-"}</Td>
                        <Td className="tw-font-mono tw-text-[12px]">{item?.listener?.ifsc_code || "-"}</Td>
                        <Td>{item?.listener?.upi_id || "-"}</Td>
                        <Td>
                          {item.status === "pending" || item.status === "failed" ? (
                            <Pill tone="danger">{item.status}</Pill>
                          ) : (
                            <Pill tone="success">{item.status}</Pill>
                          )}
                        </Td>
                        <Td>{item.month || "-"}</Td>
                        <Td>{parseFloat(item.payout_amount || 0).toFixed(2)}</Td>
                        <Td>
                          {item.status === "pending" || item.status === "failed" ? (
                            <span className="tw-text-danger">{parseFloat(item.net_payout_amount || 0).toFixed(2)}</span>
                          ) : (
                            <span className="tw-text-success">{parseFloat(item.net_payout_amount || 0).toFixed(2)}</span>
                          )}
                        </Td>
                        <Td>{parseFloat(item.leave_penalty || 0).toFixed(2)}</Td>
                        <Td>{parseFloat(item.missed_session_penalty || 0).toFixed(2)}</Td>
                        <Td>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              salaryPopup({
                                name: item?.listener?.display_name,
                                amount: item?.payout_amount,
                                net_amount: item?.net_payout_amount,
                                id: item?.listener_id,
                                transaction_id: item?.transaction_id,
                              })
                            }
                          >
                            Pay
                          </Button>
                        </Td>
                      </TR>
                    ))
                  ) : (
                    <TR>
                      <Td colSpan={14} className="tw-text-center tw-text-fg-tertiary">No records found.</Td>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
            <Pagination
              page={page}
              totalPages={data?.data?.totalPages}
              totalRecords={data?.data?.total}
              pageSize={limit}
              onPageChange={setPage}
              onPageSize={(v) => { setLimit(v); setPage(1); }}
            />
          </>
        )}
      </Card>

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
