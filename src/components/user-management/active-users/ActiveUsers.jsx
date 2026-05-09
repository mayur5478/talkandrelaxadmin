import React, { useState } from "react";
import {
  Card,
  Button,
  IconButton,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pagination,
} from "../../v2/ui";
import { Search, Eye, RotateCcw } from "lucide-react";
import DatePicker from "../user-list/date-picker/DatePicker";
import "./activeUsers.scss";
import { useActiveUserListQuery } from "../../../services/user";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import MultiDatePicker from "../user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useResetAllStuckStatesMutation } from "../../../services/auth";
import ResetStateModal from "../../common/reset-state/ResetStateModal";
import Swal from "sweetalert2";

function ActiveUsers() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  const [showArchived, setShowArchived] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState({ id: "", name: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortOrder("DESC");
    }
    setPage(1);
  };

  const { data, error, isLoading, refetch } = useActiveUserListQuery({
    page,
    pageSize,
    searchParams: searchQuery ? searchQuery : "",
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
    sortBy,
    sortOrder,
  });

  const [resetAllStuckStates, { isLoading: isResetAllLoading }] = useResetAllStuckStatesMutation();
  const navigate = useNavigate();

  const handlePageChange = (direction) => {
    if (pageSize === "all") return;
    if (direction === "next" && page < data?.data?.pagination?.totalPages)
      setPage((prev) => prev + 1);
    if (direction === "prev" && page > 1) setPage((prev) => prev - 1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  const exportUsersToExcel = async () => {
    const users = data?.data?.users || [];
    if (!Array.isArray(users) || users.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    const headers = [
      { header: "Sr. No", key: "srNo" },
      { header: "Full Name", key: "fullName" },
      { header: "Email", key: "email" },
      { header: "Contact Number", key: "mobile_number" },
      { header: "Registration Date", key: "createdAt" },
      { header: "Wallet Balance", key: "wallet_balance" },
      { header: "Recharge Amount", key: "totalRechargeAmount" },
      { header: "Gift Amount", key: "totalGiftAmount" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 10,
    }));

    users.forEach((user, index) => {
      worksheet.addRow({
        srNo: index + 1,
        fullName: user?.fullName || "",
        email: user?.email || "",
        mobile_number: user?.mobile_number || "N/A",
        createdAt: user?.createdAt
          ? moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")
          : "",
        wallet_balance: user?.wallet_balance ?? 0,
        totalRechargeAmount: user?.totalRechargeAmount ?? 0,
        totalGiftAmount: user?.totalGiftAmount ?? 0,
      });
    });

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

    worksheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const text = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, text.length);
      });
      col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "users.xlsx");
  };

  const handleResetStateClick = (id, name) => {
    setResetTarget({ id, name });
    setShowResetModal(true);
  };

  const handleGlobalReset = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will force-end ALL active sessions and clear busy flags for ALL users/listeners on the platform!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset everything!'
    });

    if (result.isConfirmed) {
      try {
        await resetAllStuckStates().unwrap();
        Swal.fire('Reset!', 'All stuck states have been cleared.', 'success');
      } catch (err) {
        Swal.fire('Error', err?.data?.message || 'Global reset failed', 'error');
      }
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Active Users</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Users with recent activity</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (data?.data?.users && data?.data?.users.length > 0) {
                exportUsersToExcel();
              } else {
                alert("No data to export!");
              }
            }}
          >
            Export Excel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleGlobalReset}
            disabled={isResetAllLoading}
          >
            {isResetAllLoading ? 'Resetting...' : '⚠ Clear All Stuck States'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search User"
            value={searchQuery}
            onChange={handleSearchChange}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
        <MultiDatePicker onChange={setDateRange} />
      </div>

      {/* Table card */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Sr. No</Th>
                  <Th sortable sortKey="fullName" sort={{ key: sortBy, order: sortOrder }} onSort={() => handleSort("fullName")}>Full Name</Th>
                  <Th sortable sortKey="wallet_balance" sort={{ key: sortBy, order: sortOrder }} onSort={() => handleSort("wallet_balance")}>Wallet Balance</Th>
                  <Th>Recharge Amount</Th>
                  <Th>Gift Amount</Th>
                  <Th sortable sortKey="createdAt" sort={{ key: sortBy, order: sortOrder }} onSort={() => handleSort("createdAt")}>Registration Date</Th>
                  <Th>Action</Th>
                </TR>
              </THead>
              <TBody>
                {error ? (
                  <TR>
                    <Td colSpan={7} className="tw-text-center tw-text-fg-tertiary">Error loading users</Td>
                  </TR>
                ) : (
                  data?.data?.users?.map((user, index) => (
                    <TR key={user.id} isLast={index === (data?.data?.users?.length - 1)}>
                      <Td>
                        {pageSize === "all"
                          ? index + 1
                          : (page - 1) * pageSize + index + 1}
                      </Td>
                      <Td className="tw-text-fg-primary tw-font-medium">{user.fullName}</Td>
                      <Td>{user.wallet_balance}</Td>
                      <Td>{user.totalRechargeAmount}</Td>
                      <Td>{user.totalGiftAmount}</Td>
                      <Td>{moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")}</Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-1">
                          <IconButton size="sm" aria-label="View" onClick={() => handleView(user?.id)}>
                            <Eye size={14} />
                          </IconButton>
                          <IconButton size="sm" aria-label="Reset Stuck States" onClick={() => handleResetStateClick(user.id, user.fullName)}>
                            <RotateCcw size={14} />
                          </IconButton>
                        </div>
                      </Td>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
            <Pagination
              page={page}
              totalPages={data?.data?.pagination?.totalPages}
              totalRecords={data?.data?.pagination?.totalRecords}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSize={(v) => { setPageSize(v); setPage(1); }}
            />
          </>
        )}
      </Card>

      <ResetStateModal
        show={showResetModal}
        handleClose={() => setShowResetModal(false)}
        userId={resetTarget.id}
        userName={resetTarget.name}
        refetch={refetch}
      />
    </div>
  );
}

export default ActiveUsers;
