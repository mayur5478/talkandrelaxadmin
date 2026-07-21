import React, { useRef, useState } from "react";
import "./users.scss";
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
import { Search, Eye, PencilLine, Trash2, Undo2, Wallet, RotateCcw, PhoneOff, Send } from "lucide-react";

import ExportExcel from "../../common/export-modal/ExportExcel";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  useUserDeleteMutation,
  useUserListQuery,
} from "../../../services/user";
import moment from "moment";
import { useAccountFreezeMutation } from "../../../services/auth.js";
import AccountFreeze from "../../common/account-freeze/AccountFreeze.jsx";
import Delete from "../../common/delete/Delete.jsx";
import { useResetAllStuckStatesMutation } from "../../../services/auth.js";
import { isHR } from "../../../utils/roles";
import { useSendOnboardingForm1Mutation } from "../../../services/listener";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import EditUser from "../../common/edit-user/EditUser";
import MultiDatePicker from "./date-picker/MultiDatePicker";
import AdjustWalletModal from "../../common/adjust-wallet/AdjustWalletModal.jsx";
import ForceEndModal from "../../common/force-end/ForceEndModal.jsx";
import ResetStateModal from "../../common/reset-state/ResetStateModal.jsx";

function Users() {
  const [modalShow, setModalShow] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [id, setId] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userName, setUserName] = useState(null);
  const [editUserModal, setEditUserModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const [userNameDelete, setUserNameDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleteMobile, setDeleteMobile] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showForceEndModal, setShowForceEndModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState({ id: '', name: '' });
  const [mobileNumber, setMobileNumber] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [resetAllStuckStates, { isLoading: isResetAllLoading }] = useResetAllStuckStatesMutation();
  const [sendOnboardingForm1, { isLoading: isSendingForm1 }] = useSendOnboardingForm1Mutation();
  const [accountFreeze, { isLoading: isFreezeLoading }] =
    useAccountFreezeMutation();
  const { data, error, isLoading, refetch } = useUserListQuery({
    page,
    pageSize,
    searchParams: searchQuery ? searchQuery : "",
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
    archived: showArchived,
    // Scope HR's list server-side to candidates whose form has been sent
    // ("processing" is what the panel renders as "Sent"). Filtering only on the
    // client trimmed the current page, so HR saw empty tables.
    ...(isHR() ? { listenerRequestStatus: "processing" } : {}),
  });
  // HR brief: "User list — only sent forms can be seen to list". HR sees only
  // candidates who are actually in the onboarding pipeline, not the whole user
  // base.
  //
  // NOTE: this filters the CURRENT PAGE client-side, so an HR user's pages will
  // look short and the pagination total still counts every user. Doing this
  // properly needs a server-side filter on the user-list endpoint — folded into
  // the phase-2 backend scoping work.
  const visibleUsers = React.useMemo(() => {
    const rows = data?.data?.users ?? [];
    if (!isHR()) return rows;
    // Backstop only — the real filter is the server-side listenerRequestStatus
    // param above. Kept so a stale/unfiltered backend can't leak the full user
    // base into HR's table.
    return rows.filter((u) => u?.listener_request_status === "processing");
  }, [data]);

  const navigate = useNavigate();
  const [deleteUser, { isLoading: isDeleteUserLoading }] =
    useUserDeleteMutation();
  const handlePageChange = (direction) => {
    if (pageSize === "all") return;
    if (direction === "next" && page < data?.data?.pagination?.totalPages)
      setPage((prev) => prev + 1);
    if (direction === "prev" && page > 1) setPage((prev) => prev - 1);
  };

  const handlePageSizeChange = (e) => {
    const value = e.target.value;
    setPageSize(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handleToggle = (userId, userName) => {
    setSelectedUser(userId);
    setShowFreezeModal(true);
    setUserName(userName);
  };
  const confirmFreeze = async () => {
    try {
      await accountFreeze(selectedUser).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowFreezeModal(false);
      setSelectedUser(null);
      setUserName(null);
    }
  };

  const tableRef = useRef(null);

  const handleMouseDown = (e) => {
    const table = tableRef.current;
    table.isDown = true;
    table.startX = e.pageX - table.offsetLeft;
    table.scrollLeft = table.scrollLeft;
  };

  const handleMouseMove = (e) => {
    const table = tableRef.current;
    if (!table.isDown) return;
    e.preventDefault();
    const x = e.pageX - table.offsetLeft;
    const walk = (x - table.startX) * 2;
    table.scrollLeft = table.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    const table = tableRef.current;
    table.isDown = false;
  };
  const handleDelete = (userId, userName, status, mobileNumber) => {
    setSelectedUserDelete(userId);
    setDeleteStatus(status);
    setMobileNumber(mobileNumber);
    setShowDeleteModal(true);
    setUserNameDelete(userName);
  };
  const confirmDelete = async () => {
    try {
      await deleteUser({ id: selectedUserDelete, status: deleteStatus, mobile_number: mobileNumber }).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserDelete(null);
      setUserNameDelete(null);
      setDeleteStatus(null);
      setMobileNumber(null);
    }
  };
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  const editUser = (id) => {
    setEditUserModal(true);
    setId(id);
  };
  const exportUsersToExcel = async (
    // Default to the role-filtered rows, not the raw response — otherwise an
    // HR user exports the entire user base straight past the table filter.
    users = visibleUsers,
    fileName = "users.xlsx"
  ) => {
    if (!Array.isArray(users) || users.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    const headers = [
      { header: "Sr. No", key: "srNo" },
      { header: "Full Name", key: "fullName" },
      { header: "Email", key: "email" },
      { header: "Contact Number", key: "mobile_number" },
      { header: "Registration Date", key: "createdAt" },
      // Wallet balance is hidden from HR in the table; keep it out of their
      // export too, otherwise the column is one click away regardless.
      ...(isHR() ? [] : [{ header: "Wallet Balance", key: "wallet_balance" }]),
      { header: "Form Status", key: "listener_request_status" },
      { header: "Account Freeze", key: "account_freeze" },
      { header: "Devices", key: "device_type" },
      { header: "Location (IP)", key: "location" },
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
        location: [user?.geo_city, user?.geo_state].filter(Boolean).join(", ") || user?.state || "",
        listener_request_status:
          user?.listener_request_status === "no request"
            ? "Pending"
            : user?.listener_request_status === "processing"
              ? "Sent"
              : "Approved",
        account_freeze: user?.account_freeze ? "Yes" : "No",
        device_type: user?.device_type || "N/A",
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

    const statusColIndex =
      headers.findIndex((h) => h.key === "listener_request_status") + 1;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const statusCell = row.getCell(statusColIndex);
      const status = statusCell.value?.toString().toLowerCase();

      if (status === "pending") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC000" },
        };
      } else if (status === "approved") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "548235" },
        };
        statusCell.font = { color: { argb: "FFFFFF" } };
      } else if (status === "sent") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1F4E78" },
        };
        statusCell.font = { color: { argb: "FFFFFF" } };
      }
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

    saveAs(blob, fileName);
  };

  const handleAdjustClick = (id, name) => {
    setAdjustTarget({ id, name });
    setShowAdjustModal(true);
  };

  const handleForceEndClick = (id, name) => {
    setAdjustTarget({ id, name });
    setShowForceEndModal(true);
  };

  const handleResetStateClick = (id, name) => {
    setAdjustTarget({ id, name });
    setShowResetModal(true);
  };

  // Sends the personalised, token-based onboarding Form 1 email — the same
  // mutation the Application Requests page uses. This replaces the legacy
  // "Send Link" button removed in 318da5a, which mailed a generic template
  // pointing at the misspelled /listerner-questions URL.
  const handleSendForm1 = async (id, name, alreadySent) => {
    const result = await Swal.fire({
      title: alreadySent ? "Resend onboarding form?" : "Send onboarding form?",
      text: alreadySent
        ? `${name} has already been sent Form 1. Send it again?`
        : `Email the listener onboarding form to ${name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: alreadySent ? "Yes, resend" : "Yes, send",
    });

    if (!result.isConfirmed) return;

    try {
      await sendOnboardingForm1(id).unwrap();
      Swal.fire("Sent!", `Onboarding form emailed to ${name}.`, "success");
      refetch();
    } catch (err) {
      Swal.fire(
        "Error",
        err?.data?.message || "Could not send the onboarding form",
        "error",
      );
    }
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
        refetch();
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
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">User Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage all registered users</p>
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
            variant={showArchived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setShowArchived((prev) => !prev);
              setPage(1);
            }}
          >
            {showArchived ? "Active Users" : "Archived Users"}
          </Button>
          {/* Platform-wide destructive action — admin only. */}
          {!isHR() && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleGlobalReset}
              disabled={isResetAllLoading}
            >
              {isResetAllLoading ? 'Resetting...' : '⚠ Clear All Stuck States'}
            </Button>
          )}
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
          <TableSkeleton rows={8} cols={11} />
        ) : (
          <>
            <div
              ref={tableRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseUp}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="tw-overflow-x-auto"
            >
              <Table>
                <THead>
                  <TR>
                    <Th>Sr. No</Th>
                    <Th>Full Name</Th>
                    <Th>Email ID</Th>
                    <Th>Contact Number</Th>
                    <Th>User Type</Th>
                    <Th>Registration Date</Th>
                    {!isHR() && <Th>Wallet Balance</Th>}
                    <Th>Form Status</Th>
                    <Th>Account Freeze</Th>
                    <Th>Devices</Th>
                    <Th>Location</Th>
                    {!isHR() && <Th>Action</Th>}
                  </TR>
                </THead>
                <TBody>
                  {error ? (
                    <TR>
                      <Td colSpan={12} className="tw-text-center tw-text-fg-tertiary">Error loading users</Td>
                    </TR>
                  ) : (
                    visibleUsers.map((user, index) => (
                      <TR key={user.id} isLast={index === (visibleUsers.length - 1)}>
                        <Td>
                          {pageSize === "all"
                            ? index + 1
                            : (page - 1) * pageSize + index + 1}
                        </Td>
                        <Td className="tw-text-fg-primary tw-font-medium">{user?.fullName}</Td>
                        <Td>{user.email}</Td>
                        <Td>{user.mobile_number || "N/A"}</Td>
                        <Td>{user.userType || "N/A"}</Td>
                        <Td>{moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")}</Td>
                        {!isHR() && <Td>{user.wallet_balance}</Td>}
                        <Td>
                          {user?.listener_request_status === "no request" ? (
                            <Pill tone="warning">Pending</Pill>
                          ) : user?.listener_request_status === "processing" ? (
                            <Pill tone="info">Sent</Pill>
                          ) : (
                            <Pill tone="success">Approved</Pill>
                          )}
                        </Td>
                        <Td>
                          {/* HR cannot freeze accounts — the endpoint is
                              admin-only, so show state without the control. */}
                          {isHR() ? (
                            <Pill tone={user?.account_freeze ? "danger" : "neutral"}>
                              {user?.account_freeze ? "Frozen" : "Active"}
                            </Pill>
                          ) : (
                          <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user?.account_freeze === true}
                              onChange={() => handleToggle(user?.id, user?.fullName)}
                              className="tw-sr-only tw-peer"
                            />
                            <div className="tw-w-9 tw-h-5 tw-bg-bg-secondary tw-rounded-full tw-peer peer-checked:tw-bg-fg-info tw-transition-colors tw-duration-200 after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-0.5 after:tw-bg-white after:tw-rounded-full after:tw-h-4 after:tw-w-4 after:tw-transition-all peer-checked:after:tw-translate-x-4" />
                          </label>
                          )}
                        </Td>
                        <Td>{user?.device_type}</Td>
                        <Td>
                          {[user?.geo_city, user?.geo_state].filter(Boolean).join(", ") || user?.state || "—"}
                        </Td>
                        {/* HR's user list is read-only. Every control below is
                            either admin-only on the backend or outside HR's
                            remit, so the whole cell is dropped rather than
                            rendering buttons that 403. */}
                        {!isHR() && (
                        <Td>
                          <div className="tw-flex tw-items-center tw-gap-1">
                            <IconButton size="sm" aria-label="View" onClick={() => handleView(user?.id)}>
                              <Eye size={14} />
                            </IconButton>
                            {!isHR() && (
                              <IconButton size="sm" aria-label="Edit" onClick={() => editUser(user?.id)}>
                                <PencilLine size={14} />
                              </IconButton>
                            )}
                            {/* Wallet + stuck-state tools are admin-only on the
                                backend (secure(["admin"])) — hide rather than
                                render buttons that 403. */}
                            {!isHR() && (
                              <>
                                <IconButton size="sm" aria-label="Adjust Wallet" onClick={() => handleAdjustClick(user.id, user.fullName)}>
                                  <Wallet size={14} />
                                </IconButton>
                                <IconButton size="sm" aria-label="Reset Stuck States" onClick={() => handleResetStateClick(user.id, user.fullName)}>
                                  <RotateCcw size={14} />
                                </IconButton>
                              </>
                            )}
                            {/* Onboarding form: only for candidates who have not
                                progressed past the invite stage. Deliberately an
                                allow list — the other statuses ("documents in
                                review", "application rejected", "approved",
                                "profile in process") must NOT get a fresh Form 1.
                                "processing" = already sent, so it becomes a resend. */}
                            {["no request", "pending", "processing"].includes(
                              user?.listener_request_status,
                            ) && (
                              <IconButton
                                size="sm"
                                aria-label={
                                  user?.listener_request_status === "processing"
                                    ? "Resend Onboarding Form"
                                    : "Send Onboarding Form"
                                }
                                disabled={isSendingForm1}
                                onClick={() =>
                                  handleSendForm1(
                                    user.id,
                                    user.fullName,
                                    user?.listener_request_status === "processing",
                                  )
                                }
                              >
                                <Send size={14} />
                              </IconButton>
                            )}
                            {user.is_session_running && !isHR() && (
                              <IconButton size="sm" aria-label="Force End Session" onClick={() => handleForceEndClick(user.id, user.fullName)}>
                                <PhoneOff size={14} />
                              </IconButton>
                            )}
                            {isHR() ? null : user?.is_soft_delete === false ? (
                              <IconButton size="sm" aria-label="Delete" onClick={() => handleDelete(user.id, user.fullName, true, user.mobile_number)}>
                                <Trash2 size={14} />
                              </IconButton>
                            ) : (
                              <IconButton size="sm" aria-label="Restore" onClick={() => handleDelete(user.id, user.fullName, false, user.mobile_number)}>
                                <Undo2 size={14} />
                              </IconButton>
                            )}
                          </div>
                        </Td>
                        )}
                      </TR>
                    ))
                  )}
                </TBody>
              </Table>
            </div>
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

      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
      <AccountFreeze
        show={showFreezeModal}
        onHide={() => setShowFreezeModal(false)}
        onConfirm={confirmFreeze}
        userId={selectedUser}
        userName={userName}
        isFreezeLoading={isFreezeLoading}
      />
      <Delete
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        userId={selectedUserDelete}
        userName={userNameDelete}
        isDeleteUserLoading={isDeleteUserLoading}
        type="listener"
      />
      <AdjustWalletModal
        show={showAdjustModal}
        handleClose={() => setShowAdjustModal(false)}
        userId={adjustTarget.id}
        userName={adjustTarget.name}
        refetch={refetch}
      />
      <ForceEndModal
        show={showForceEndModal}
        handleClose={() => setShowForceEndModal(false)}
        userId={adjustTarget.id}
        userName={adjustTarget.name}
        refetch={refetch}
      />
      <ResetStateModal
        show={showResetModal}
        handleClose={() => setShowResetModal(false)}
        userId={adjustTarget.id}
        userName={adjustTarget.name}
        refetch={refetch}
      />
      <EditUser
        show={editUserModal}
        onHide={() => setEditUserModal(false)}
        id={id}
      />
    </div>
  );
}

export default Users;
