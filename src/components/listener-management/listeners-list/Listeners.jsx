import React, { useRef, useState } from "react";
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
import { Search, Eye, Trash2, Undo2, RotateCcw } from "lucide-react";
import {
  useListenerDeleteMutation,
  useListenerListQuery,
  useListenerSoftDeleteMutation,
} from "../../../services/listener";
import DatePicker from "../../user-management/user-list/date-picker/DatePicker";
import "./listeners.scss";
import RemoveListener from "../../common/remove-listener/RemoveListener";
import { useNavigate } from "react-router-dom";
import ExportExcel from "../../common/export-modal/ExportExcel";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import {
  useAccountFreezeMutation,
  useWalletFreezeMutation,
} from "../../../services/auth";
import AccountFreeze from "../../common/account-freeze/AccountFreeze";
import WalletFreeze from "../../common/account-freeze/WalletFreeze";
import Delete from "../../common/delete/Delete";
import MultiDatePicker from "../../user-management/user-list/date-picker/MultiDatePicker";
import CreateSession from "../create-session/CreateSession";
import ResetStateModal from "../../common/reset-state/ResetStateModal";
import { useResetAllStuckStatesMutation } from "../../../services/auth";
import Swal from "sweetalert2";
import { isHR } from "../../../utils/roles";

function Listeners() {
  const [modalShow, setModalShow] = useState(false);
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [softDeleteModalShow, setSoftDeleteModalShow] = useState(false);
  const [softDeleteStatus, setSoftDeleteStatus] = useState(false);
  const [userNameSoftDelete, setUserNameSoftDelete] = useState(null);
  const [selectedUserSoftDelete, setSelectedUserSoftDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [show, setShow] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userName, setUserName] = useState(null);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [selectedUserWallet, setSelectedUserWallet] = useState(null);
  const [userNameWallet, setUserNameWallet] = useState(null);
  const [showFreezeWalletModal, setShowFreezeWalletModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const [userNameDelete, setUserNameDelete] = useState(null);
  const [selectedMobileNumber, setSelectedMobileNumber] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState({ id: "", name: "" });
  const [resetAllStuckStates, { isLoading: isResetAllLoading }] = useResetAllStuckStatesMutation();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useListenerListQuery({
    page,
    pageSize,
    searchParams: searchParams ? searchParams : "",
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
    archived: showArchived,
  });
  const [deleteListener, { isLoading: isDeleteUserLoading }] =
    useListenerDeleteMutation();
  const [softdeleteListener, { isLoading: isSoftDeleteLoading }] =
    useListenerSoftDeleteMutation();
  const [accountFreeze, { isLoading: isFreezeLoading }] =
    useAccountFreezeMutation();
  const [wallletFreeze, { isLoading: isWalletFreezeLoading }] =
    useWalletFreezeMutation();

  const [freezeStatus, setFreezeStatus] = useState({});
  const [freezeStatusWallet, setFreezeStatusWallet] = useState({});
  const handleView = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };

  const handleSearch = (e) => {
    setSearchParams(e.target.value);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(e.target.value);
  };

  const handleNextPage = () => {
    if (page < data?.data?.pagination?.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePageChange = (direction) => {
    if (direction === "next" && page < data?.data?.pagination?.totalPages)
      setPage((prev) => prev + 1);
    if (direction === "prev" && page > 1) setPage((prev) => prev - 1);
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
  const handleWalletToggle = (userId, userName) => {
    setSelectedUserWallet(userId);
    setShowFreezeWalletModal(true);
    setUserNameWallet(userName);
  };
  const confirmWallet = async () => {
    try {
      await wallletFreeze(selectedUserWallet).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowFreezeWalletModal(false);
      setSelectedUserWallet(null);
      setUserNameWallet(null);
    }
  };
  const handleDelete = (userId, userName) => {
    setSelectedUserDelete(userId);
    setShowDeleteModal(true);
    setUserNameDelete(userName);
  };

  const confirmDelete = async () => {
    try {
      await deleteListener(selectedUserDelete).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserDelete(null);
      setUserNameDelete(null);
    }
  };
  const handleSoftDelete = (userId, userName, status, mobileNumber) => {
    setSelectedUserSoftDelete(userId);
    setSoftDeleteModalShow(true);
    setSoftDeleteStatus(status);
    setUserNameSoftDelete(userName);
    setSelectedMobileNumber(mobileNumber);
  };
  const confirmSoftDelete = async () => {
    try {
      await softdeleteListener({
        id: selectedUserSoftDelete,
        status: softDeleteStatus,
        mobile_number: selectedMobileNumber,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setSelectedUserSoftDelete(null);
      setSoftDeleteModalShow(false);
      setSoftDeleteStatus(null);
      setUserNameSoftDelete(null);
      setSelectedMobileNumber(null);
    }
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
        refetch();
      } catch (err) {
        Swal.fire('Error', err?.data?.message || 'Global reset failed', 'error');
      }
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
  const exportUsersToExcel = async (
    users = [],
    fileName = "listeners.xlsx"
  ) => {
    if (!Array.isArray(users) || users.length === 0) {
      alert("No data to export!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Listeners");

    const headers = [
      { header: "Sr. No", key: "srNo" },
      { header: "Full Name", key: "fullName" },
      { header: "Email ID", key: "email" },
      { header: "Contact Number", key: "mobile_number" },
      { header: "Registration Date", key: "createdAt" },
      // Wallet/freeze columns are hidden from HR in the table — keep them out
      // of the export too, or they're one click away regardless.
      ...(isHR() ? [] : [
        { header: "Wallet Balance", key: "balance" },
        { header: "Account Freeze", key: "account_freeze" },
        { header: "Wallet Freeze", key: "wallet_freeze" },
      ]),
      { header: "Devices", key: "device_type" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 10,
    }));

    users.forEach((user, index) => {
      worksheet.addRow({
        srNo: index + 1,
        fullName: user?.display_name || "",
        email: user?.email || "",
        mobile_number: user?.mobile_number || "N/A",
        createdAt: user?.createdAt
          ? moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")
          : "",
        balance: user?.balance ?? 0,
        account_freeze: user?.account_freeze ? "Yes" : "No",
        wallet_freeze: user?.wallet_freeze ? "Yes" : "No",
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

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Listener Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage all registered listeners</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportUsersToExcel(data?.data?.users, "listener.xlsx")}
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
            {showArchived ? "Active Listeners" : "Archived Listeners"}
          </Button>
          {/* Global reset and session creation are admin-only on the backend
              (secure(["admin"])) — hidden rather than rendered to 403. */}
          {!isHR() && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={handleGlobalReset}
                disabled={isResetAllLoading}
              >
                {isResetAllLoading ? 'Resetting...' : '⚠ Clear All Stuck States'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShow(true)}>
                + Create Session
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search Listener"
            value={searchParams}
            onChange={handleSearch}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
        <MultiDatePicker onChange={setDateRange} />
      </div>

      {/* Table card */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={8} cols={10} />
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
                    <Th>Registration Date</Th>
                    {!isHR() && <Th>Wallet Balance</Th>}
                    {!isHR() && <Th>Account Freeze</Th>}
                    {!isHR() && <Th>Wallet Freeze</Th>}
                    <Th>Devices</Th>
                    <Th>Action</Th>
                  </TR>
                </THead>
                <TBody>
                  {isError ? (
                    <TR>
                      <Td colSpan={10} className="tw-text-center tw-text-fg-tertiary">Error fetching data</Td>
                    </TR>
                  ) : (
                    data?.data?.users.map((user, index) => (
                      <TR key={user.id} isLast={index === (data?.data?.users?.length - 1)}>
                        <Td>
                          {pageSize === "all"
                            ? index + 1
                            : (page - 1) * pageSize + index + 1}
                        </Td>
                        <Td className="tw-text-fg-primary tw-font-medium">{user?.display_name}</Td>
                        <Td>{user.email}</Td>
                        <Td>{user.mobile_number || "N/A"}</Td>
                        <Td>{moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")}</Td>
                        {!isHR() && <Td>{user?.balance}</Td>}
                        {!isHR() && (
                        <Td>
                          <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user?.account_freeze === true}
                              onChange={() => handleToggle(user.id, user.fullName)}
                              className="tw-sr-only tw-peer"
                            />
                            <div className="tw-w-9 tw-h-5 tw-bg-bg-secondary tw-rounded-full tw-peer peer-checked:tw-bg-fg-info tw-transition-colors tw-duration-200 after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-0.5 after:tw-bg-white after:tw-rounded-full after:tw-h-4 after:tw-w-4 after:tw-transition-all peer-checked:after:tw-translate-x-4" />
                          </label>
                        </Td>
                        )}
                        {!isHR() && (
                        <Td>
                          <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                            <input
                              type="checkbox"
                              checked={user?.wallet_freeze === true}
                              onChange={() => handleWalletToggle(user.id, user.fullName)}
                              className="tw-sr-only tw-peer"
                            />
                            <div className="tw-w-9 tw-h-5 tw-bg-bg-secondary tw-rounded-full tw-peer peer-checked:tw-bg-fg-info tw-transition-colors tw-duration-200 after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-0.5 after:tw-bg-white after:tw-rounded-full after:tw-h-4 after:tw-w-4 after:tw-transition-all peer-checked:after:tw-translate-x-4" />
                          </label>
                        </Td>
                        )}
                        <Td>{user?.device_type}</Td>
                        <Td>
                          <div className="tw-flex tw-items-center tw-gap-1">
                            <IconButton size="sm" aria-label="View" onClick={() => handleView(user?.id)}>
                              <Eye size={14} />
                            </IconButton>
                            {/* Archive/restore and stuck-state reset are
                                admin-only on the backend — HR gets view only. */}
                            {!isHR() && (user?.is_soft_delete === false ? (
                              <IconButton size="sm" aria-label="Archive" onClick={() => handleSoftDelete(user.id, user.fullName, true, user.mobile_number)}>
                                <Trash2 size={14} />
                              </IconButton>
                            ) : (
                              <IconButton size="sm" aria-label="Restore" onClick={() => handleSoftDelete(user.id, user.fullName, false, user.mobile_number)}>
                                <Undo2 size={14} />
                              </IconButton>
                            ))}
                            {!isHR() && (
                              <IconButton size="sm" aria-label="Reset Stuck States" onClick={() => handleResetStateClick(user.id, user.display_name)}>
                                <RotateCcw size={14} />
                              </IconButton>
                            )}
                          </div>
                        </Td>
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

      {/* Modals */}
      <ExportExcel
        show={softDeleteModalShow}
        onHide={() => setSoftDeleteModalShow(false)}
        onConfirm={confirmSoftDelete}
        userName={userNameSoftDelete}
        isFreezeLoading={isSoftDeleteLoading}
      />
      <RemoveListener
        show={deleteModalShow}
        onHide={() => setDeleteModalShow(false)}
      />
      <AccountFreeze
        show={showFreezeModal}
        onHide={() => setShowFreezeModal(false)}
        onConfirm={confirmFreeze}
        userId={selectedUser}
        userName={userName}
        isFreezeLoading={isFreezeLoading}
      />
      <WalletFreeze
        show={showFreezeWalletModal}
        onHide={() => setShowFreezeWalletModal(false)}
        onConfirm={confirmWallet}
        userId={selectedUserWallet}
        userName={userNameWallet}
        isWalletFreezeLoading={isWalletFreezeLoading}
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
      <CreateSession show={show} handleClose={() => setShow(false)} />
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

export default Listeners;
