import React, { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import {
  useListenerDeleteMutation,
  useListenerListQuery,
  useListenerSoftDeleteMutation,
} from "../../../services/listener"; // Import the API hook
import DatePicker from "../../user-management/user-list/date-picker/DatePicker";
import sort from "../../assets/sort.png";
import viewIcon from "../../assets/view.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import eraser from "../../assets/eraser.png";
import deleteIcon from "../../assets/delete.png";
import replyImage from "../../assets/reply.png";
import actionIcon from "../../assets/action.png";
import search from "../../assets/search.png";
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

    // Define headers
    const headers = [
      { header: "Sr. No", key: "srNo" },
      { header: "Full Name", key: "fullName" },
      { header: "Email ID", key: "email" },
      { header: "Contact Number", key: "mobile_number" },
      { header: "Registration Date", key: "createdAt" },
      { header: "Wallet Balance", key: "balance" },
      { header: "Account Freeze", key: "account_freeze" },
      { header: "Wallet Freeze", key: "wallet_freeze" },
      { header: "Devices", key: "device_type" },
    ];

    worksheet.columns = headers.map((h) => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 10,
    }));

    // Add rows
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

    // Style header
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

    // Auto-size columns
    worksheet.columns.forEach((col) => {
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const text = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, text.length);
      });
      col.width = maxLength + 2;
    });

    // Export to Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, fileName);
  };

  return (
    <div className="listeners-main">
      <div className="top-section">
        <div className="left-section">
          <Button
            onClick={() =>
              exportUsersToExcel(data?.data?.users, "listener.xlsx")
            }
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
            Archived Listener
          </Button>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search Listener"
              value={searchParams}
              onChange={handleSearch}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>
        <div className="right-section">
          <MultiDatePicker onChange={setDateRange} />
          <Button className="edit-btn"  onClick={() => setShow(true)}>➕ Create Session</Button>
    
        </div>
      </div>

      <div
        className="table table-container"
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
              Full Name <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">Email ID</p>
          </div>
          <div>
            <p className="heading-text">Contact Number</p>
          </div>
          <div>
            <p className="heading-text">
              Registration Date <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Wallet Balance <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Account Freeze <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Wallet Freeze <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">Devices</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : isError ? (
          <p>Error fetching data</p>
        ) : (
          data?.data?.users.map((user, index) => (
            <div className="table-body" key={user.id}>
              <div>
                <p className="heading-text">
                 {pageSize === "all"
                  ? index + 1
                  : (page - 1) * pageSize + index + 1}
                </p>
              </div>
              <div>
                <p className="heading-text">{user?.display_name}</p>
              </div>
              <div>
                <p className="heading-text">{user.email}</p>
              </div>
              <div>
                <p className="heading-text">{user.mobile_number || "N/A"}</p>
              </div>
              <div>
                <p className="heading-text">
                  {moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")}
                </p>
              </div>
              <div>
                <p className="heading-text">{user?.balance}</p>
              </div>
              <div>
                <p className="heading-text">
                  <div className="material-switch pull-right">
                    <input
                      id={`switch-${user.id}`}
                      name={`switch-${user.id}`}
                      type="checkbox"
                      checked={user?.account_freeze === true ? true : false}
                      onChange={() => handleToggle(user.id, user.fullName)}
                    />
                    <label
                      htmlFor={`switch-${user.id}`}
                      className="label-default"
                    ></label>
                  </div>
                </p>
              </div>
              <div>
                <p className="heading-text">
                  <div className="material-switch pull-right">
                    <input
                      id={`wallet-switch-${user.id}`}
                      name={`wallet-switch-${user.id}`}
                      type="checkbox"
                      checked={user?.wallet_freeze === true ? true : false}
                      onChange={() =>
                        handleWalletToggle(user.id, user.fullName)
                      }
                    />
                    <label
                      htmlFor={`wallet-switch-${user.id}`}
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
                  <img src={actionIcon} alt={actionIcon} />
                  <img
                    src={viewIcon}
                    alt={viewIcon}
                    onClick={() => handleView(user?.id)}
                  />
                  {user?.is_soft_delete === false ? (
                    <>
                      <img
                        onClick={() =>
                          handleSoftDelete(user.id, user.fullName, true, user.mobile_number)
                        }
                        src={eraser}
                        alt={eraser}
                      />
                    </>
                  ) : (
                    <>
                      <img
                        onClick={() =>
                          handleSoftDelete(user.id, user.fullName, false, user.mobile_number)
                        }
                        src={replyImage}
                        alt={replyImage}
                      />
                    </>
                  )}

                  {/* <img
                    onClick={() => handleDelete(user.id, user.fullName)}
                    src={deleteIcon}
                    alt={deleteIcon}
                  /> */}
                </div>
              </div>
            </div>
          ))
        )}

        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Pages:</p>
            <Form.Select
              aria-label="Items per page"
              value={pageSize}
              onChange={handlePageSizeChange}
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
              <p>{data?.data?.pagination?.totalRecords || 0}</p>
            </div>
            <div className="pagination-controls">
              <img
                src={backwardIcon}
                alt="Backward"
                onClick={() => setPage(1)}
                style={{ cursor: "pointer" }}
              />
              <img
                src={backIcon}
                alt="Back"
                onClick={() => handlePageChange("prev")}
                style={{ cursor: "pointer" }}
              />
              <img
                src={frontIcon}
                alt="Front"
                onClick={() => handlePageChange("next")}
                style={{ cursor: "pointer" }}
              />
              <img
                src={forwardIcon}
                alt="Forward"
                onClick={() =>
                  setPage(
                    Math.ceil(data?.data?.pagination?.totalRecords / pageSize)
                  )
                }
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

export default Listeners;
