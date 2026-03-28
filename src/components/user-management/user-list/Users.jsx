import React, { useRef, useState } from "react";
import "./users.scss";
import { Button, Form } from "react-bootstrap";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import editIcon from "../../assets/edit.png";
import deleteIcon from "../../assets/delete.png";
import viewIcon from "../../assets/view.png";
import actionIcon from "../../assets/action.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";

import replyImage from "../../assets/reply.png";
import adjustIcon from "../../assets/blue-amount.png";
import killIcon from "../../assets/cancel.png";

import ExportExcel from "../../common/export-modal/ExportExcel";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  useUserDeleteMutation,
  useUserListQuery,
} from "../../../services/user";
import { useListenerFormLinkMutation } from "../../../services/listener";
import moment from "moment";
import { useAccountFreezeMutation } from "../../../services/auth.js";
import AccountFreeze from "../../common/account-freeze/AccountFreeze.jsx";
import LinkShare from "../../common/link-share/LinkShare.jsx";
import Delete from "../../common/delete/Delete.jsx";
import { useResetAllStuckStatesMutation } from "../../../services/auth.js";
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
  const [userId, setUserId] = useState(null);
  const [linkUserName, setLinkUserName] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
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
  const [

    sendFormLink,
    { data: mutationData, error: mutationError, isLoading: isMutationLoading },
  ] = useListenerFormLinkMutation();
  const [accountFreeze, { isLoading: isFreezeLoading }] =
    useAccountFreezeMutation();
  const { data, error, isLoading, refetch } = useUserListQuery({
    page,
    pageSize,
    searchParams: searchQuery ? searchQuery : "",
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
    archived: showArchived,
  });
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

  const handleSendLinkToggle = (userId, userName) => {
    setUserId(userId);
    setShowLinkModal(true);
    setLinkUserName(userName);
  };
  const handleSendFormLink = async () => {
    try {
      await sendFormLink(userId).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowLinkModal(false);
      setUserId(null);
      setLinkUserName(null);
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
    const walk = (x - table.startX) * 2; // scroll speed
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
    users = data?.data?.users,
    fileName = "users.xlsx"
  ) => {
    if (!Array.isArray(users) || users.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define headers (adjust columns as needed)
    const headers = [
      { header: "Sr. No", key: "srNo" },
      { header: "Full Name", key: "fullName" },
      { header: "Email", key: "email" },
      { header: "Contact Number", key: "mobile_number" },
      { header: "Registration Date", key: "createdAt" },
      { header: "Wallet Balance", key: "wallet_balance" },
      { header: "Form Status", key: "listener_request_status" },
      { header: "Account Freeze", key: "account_freeze" },
      { header: "Devices", key: "device_type" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 10,
    }));

    // Add data rows
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

    // Conditional formatting for form status
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
          fgColor: { argb: "FFC000" }, // Yellow
        };
      } else if (status === "approved") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "548235" }, // Green
        };
        statusCell.font = { color: { argb: "FFFFFF" } };
      } else if (status === "sent") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1F4E78" }, // Blue
        };
        statusCell.font = { color: { argb: "FFFFFF" } };
      }
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

    // Export
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
    setAdjustTarget({ id, name }); // Reuse state for name display
    setShowForceEndModal(true);
  };

  const handleResetStateClick = (id, name) => {
    setAdjustTarget({ id, name }); // Reuse state for name display
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

  return (
    <div className="users-main">
      <div className="top-section">
        <div className="left-section">
          <Button
            onClick={() => {
              if (data?.data?.users && data?.data?.users.length > 0) {
                exportUsersToExcel();
              } else {
                alert("No data to export!");
              }
            }}
          >
            Excel
          </Button>
          <Button
            className={`archived-user-btn ${showArchived ? "pressed" : ""}`}
            onClick={() => {
              setShowArchived((prev) => !prev);
              setPage(1);
            }}
          >
            Archived User
          </Button>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>
        <div className="right-section">
          <Button 
            className="me-2 text-white border-0" 
            style={{ backgroundColor: '#e11d48' }} // Red for danger/reset
            onClick={handleGlobalReset}
            disabled={isResetAllLoading}
          >
            {isResetAllLoading ? 'Resetting...' : '⚠️ Clear All Stuck States'}
          </Button>
          <MultiDatePicker onChange={setDateRange} />
          {/* <Button className="add-user-btn">+ Add New User</Button> */}
          <Button className="add-user-btn-plus">+</Button>
        </div>

      </div>
      <div
        className="table table-container "
        ref={tableRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Full Name <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">Email ID</p>
          </div>
          <div>
            <p className="heading-text">Contact Number</p>
          </div>
          <div>
            <p className="heading-text">User Type</p>
          </div>
          <div>
            <p className="heading-text">
              Registration Date <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Wallet Balance <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Form Status <img className="sort" src={sort} alt={sort} />
            </p>
          </div>

          <div>
            <p className="heading-text">
              Account Freeze <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">Devices</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data?.data?.users?.map((user, index) => (
          <div className="table-body" key={user.id}>
            <div>
              <p className="heading-text">
                {pageSize === "all"
                  ? index + 1
                  : (page - 1) * pageSize + index + 1}
              </p>
            </div>
            <div>
              <p className="heading-text">{user?.fullName}</p>
            </div>
            <div>
              <p className="heading-text">{user.email}</p>
            </div>
            <div>
              <p className="heading-text">{user.mobile_number || "N/A"}</p>
            </div>
            <div>
              <p className="heading-text">{user.userType || "N/A"}</p>
            </div>
            <div>
              <p className="heading-text">
                {moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")}
              </p>
            </div>
            <div>
              <p className="heading-text">{user.wallet_balance}</p>
            </div>

            <div>
              <p
                className={`heading-text ${user?.listener_request_status === "no request"
                  ? "red-text"
                  : "green-text"
                  }`}
              >
                {user?.listener_request_status === "no request"
                  ? "Pending"
                  : user?.listener_request_status === "processing"
                    ? "Sent"
                    : "Sent"}
              </p>
            </div>
            <div>
              <p className="heading-text">
                <div className="material-switch pull-right">
                  <input
                    id={`switch-${user.id}`}
                    name={`switch-${user.id}`}
                    type="checkbox"
                    checked={user?.account_freeze === true ? true : false}
                    onChange={(event) => {
                      handleToggle(user?.id, user?.fullName, event);
                    }}
                  />
                  <label
                    htmlFor={`switch-${user.id}`}
                    className="label-default"
                  ></label>
                </div>
              </p>
            </div>
            <div>
              <p className="heading-text">{user?.device_type}</p>
            </div>
            <div>
              <div className="actions">
                <img
                  src={actionIcon}
                  alt="Action"
                  onClick={() => handleSendLinkToggle(user.id, user.fullName)}
                />
                <img
                  src={viewIcon}
                  onClick={() => handleView(user?.id)}
                  alt="View"
                />
                <img
                  onClick={() => editUser(user?.id)}
                  src={editIcon}
                  alt="Edit"
                />
                <img
                  onClick={() => handleAdjustClick(user.id, user.fullName)}
                  src={adjustIcon}
                  title="Adjust Wallet"
                  alt="Adj"
                  style={{ width: '22px', height: '22px' }}
                />
                <svg 
                  onClick={() => handleResetStateClick(user.id, user.fullName)}
                  xmlns="http://www.w3.org/2000/svg" 
                  width="22" height="22" 
                  viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" strokeWidth="2" 
                  strokeLinecap="round" strokeLinejoin="round" 
                  title="Reset Stuck States"
                  className="reset-icon mx-1"
                >
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>

                {user.is_session_running && (
                  <img
                    onClick={() => handleForceEndClick(user.id, user.fullName)}
                    src={killIcon}
                    title="Force End Session"
                    alt="Kill"
                    style={{ width: '22px', height: '22px' }}
                  />
                )}
                {user?.is_soft_delete === false ? (
                  <>
                    <img
                      onClick={() => handleDelete(user.id, user.fullName, true, user.mobile_number)}
                      src={deleteIcon}
                      alt="Delete"
                    />
                  </>
                ) : (
                  <>
                    <img
                      onClick={() => handleDelete(user.id, user.fullName, false, user.mobile_number)}
                      src={replyImage}
                      alt="Reply"
                    />
                  </>
                )}

              </div>
            </div>
          </div>
        ))}

        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Page:</p>
            <Form.Select
              value={pageSize}
              onChange={handlePageSizeChange}
              aria-label="Items Per Page"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="all">All</option>
            </Form.Select>
          </div>
          <div className="pagination-details">
            <div className="pagination-numbers">
              <p>{pageSize === "all" ? 1 : (page - 1) * pageSize + 1}</p>-
              <p>
                {pageSize === "all"
                  ? data?.data?.users?.length
                  : Math.min(
                    page * pageSize,
                    data?.data?.pagination?.totalRecords || 0
                  )}
              </p>
              <p>of</p>
              <p>
                {data?.data?.pagination?.totalRecords ||
                  data?.data?.users?.length ||
                  0}
              </p>
            </div>
            <div className="pagination-controls">
              <img
                src={backwardIcon}
                onClick={() => pageSize !== "all" && setPage(1)}
                style={{
                  cursor: pageSize === "all" ? "not-allowed" : "pointer",
                }}
              />
              <img
                src={backIcon}
                onClick={() => handlePageChange("prev")}
                style={{
                  cursor: pageSize === "all" ? "not-allowed" : "pointer",
                }}
              />
              <img
                src={frontIcon}
                onClick={() => handlePageChange("next")}
                style={{
                  cursor: pageSize === "all" ? "not-allowed" : "pointer",
                }}
              />
              <img
                src={forwardIcon}
                onClick={() =>
                  pageSize !== "all" &&
                  setPage(
                    Math.ceil(data?.data?.pagination?.totalRecords / pageSize)
                  )
                }
                style={{
                  cursor: pageSize === "all" ? "not-allowed" : "pointer",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
      <AccountFreeze
        show={showFreezeModal}
        onHide={() => setShowFreezeModal(false)}
        onConfirm={confirmFreeze}
        userId={selectedUser}
        userName={userName}
        isFreezeLoading={isFreezeLoading}
      />
      <LinkShare
        show={showLinkModal}
        onHide={() => setShowLinkModal(false)}
        onConfirm={handleSendFormLink}
        userId={userId}
        userName={linkUserName}
        isMutationLoading={isMutationLoading}
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
