import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import DatePicker from "../user-list/date-picker/DatePicker";
import sort from "../../assets/sort.png";
import viewIcon from "../../assets/view.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import search from "../../assets/search.png";
import "./activeUsers.scss";
import { useActiveUserListQuery } from "../../../services/user";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import MultiDatePicker from "../user-list/date-picker/MultiDatePicker";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useResetUserStateMutation, useResetAllStuckStatesMutation } from "../../../services/auth";
import ResetStateModal from "../../common/reset-state/ResetStateModal";
import Swal from "sweetalert2";

function ActiveUsers() {
  const [page, setPage] = useState(1); // Current page
  const [pageSize, setPageSize] = useState(10); // Items per page
  const [searchQuery, setSearchQuery] = useState(""); // Search query
  const [selectedDate, setSelectedDate] = useState(null); // Selected date range
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

  const sortIcon = (column) => {
    if (sortBy !== column) return <img className="sort" src={sort} alt="Sort" />;
    return <span style={{ fontSize: "12px", marginLeft: "4px" }}>{sortOrder === "ASC" ? "▲" : "▼"}</span>;
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


  // Handle page change
  const handlePageChange = (direction) => {
    if (pageSize === "all") return;
    if (direction === "next" && page < data?.data?.pagination?.totalPages)
      setPage((prev) => prev + 1);
    if (direction === "prev" && page > 1) setPage((prev) => prev - 1);
  };

  // Handle page size change
 const handlePageSizeChange = (e) => {
    const value = e.target.value;
    setPageSize(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value); // Update the search query
    setPage(1); // Reset to the first page
  };

  // Handle date picker change
  const handleDateChange = (date) => {
    setSelectedDate(date); // Update the selected date
    setPage(1); // Reset to the first page
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

    // Style headers
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
        // ActiveUsers list should refresh automatically if data changes, but we refetch as a safety
      } catch (err) {
        Swal.fire('Error', err?.data?.message || 'Global reset failed', 'error');
      }
    }
  };


  return (
    <div className="active-users">
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
        </div>

      </div>

      <div className="table">
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Full Name <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div
            onClick={() => handleSort("wallet_balance")}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <p className="heading-text">
              Wallet Balance {sortIcon("wallet_balance")}
            </p>
          </div>
          <div>
            <p className="heading-text">
              Recharge Amount
            </p>
          </div>
          <div>
            <p className="heading-text">
              Gift Amount
            </p>
          </div>
          <div
            onClick={() => handleSort("createdAt")}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            <p className="heading-text">
              Registration Date {sortIcon("createdAt")}
            </p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : (
          data?.data?.users?.map((user, index) => (
            <div className="table-body" key={user.id}>
              <div>
                <p className="heading-text">
                 {pageSize === "all"
                  ? index + 1
                  : (page - 1) * pageSize + index + 1}
                </p>
              </div>
              <div>
                <p className="heading-text">{user.fullName}</p>
              </div>
              <div>
                <p className="heading-text">{user.wallet_balance}</p>
              </div>
              <div>
                <p className="heading-text">{user.totalRechargeAmount}</p>
              </div>
              <div>
                <p className="heading-text">{user.totalGiftAmount}</p>
              </div>
              <div>
                <p className="heading-text">
                  {moment(user.createdAt).format("DD/MM/YYYY, hh:mm A")}
                </p>
              </div>
              <div>
                <div className="actions">
                  <img
                    src={viewIcon}
                    onClick={() => handleView(user?.id)}
                    alt="View"
                  />
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230ea5e9' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 2v6h-6'%2F%3E%3Cpath d='M3 12a9 9 0 0 1 15-6.7L21 8'%2F%3E%3Cpath d='M3 22v-6h6'%2F%3E%3Cpath d='M21 12a9 9 0 0 1-15 6.7L3 16'%2F%3E%3C%2Fsvg%3E"
                    onClick={() => handleResetStateClick(user.id, user.fullName)}
                    title="Reset Stuck States"
                    alt="Reset"
                    className="reset-icon mx-1"
                    style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                  />

                </div>
              </div>
            </div>
          ))
        )}
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
