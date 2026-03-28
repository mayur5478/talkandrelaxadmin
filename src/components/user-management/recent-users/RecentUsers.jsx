import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import DatePicker from "../user-list/date-picker/DatePicker";
import sort from "../../assets/sort.png";
import viewIcon from "../../assets/view.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import search from "../../assets/search.png";
import "./recentUsers.scss";
import { useRecentUserListQuery } from "../../../services/user";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import ResetStateModal from "../../common/reset-state/ResetStateModal";

function RecentUsers() {
  const [searchParams, setSearchParams] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState({ id: "", name: "" });

  const handleResetStateClick = (id, name) => {
    setResetTarget({ id, name });
    setShowResetModal(true);
  };

  const { data, error, isLoading } = useRecentUserListQuery({
    page,
    pageSize,
    searchParams: searchParams ? searchParams : "",
    date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
  });
  console.log("data", data);
  const navigate = useNavigate();
  useEffect(() => {
    if (error) {
      console.error("Error fetching data:", error);
    }
  }, [error]);

  const handlePageChange = (direction) => {
    if (direction === "next" && page < data?.data?.pagination?.totalPages) {
      setPage((prev) => prev + 1);
    } else if (direction === "prev" && page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchParams(e.target.value);
    setPage(1);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setPage(1);
  };
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };
  return (
    <div className="recent-users">
      <div className="top-section">
        <div className="left-section">
          <Button onClick={() => setModalShow(true)}>Excel</Button>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={searchParams}
              onChange={handleSearchChange}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>
        <div className="right-section">
          <DatePicker onChange={handleDateChange} />
        </div>
      </div>

      <div className="table">
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
            <p className="heading-text">
              Wallet Balance <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Recharge Amount <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Gift Amount <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Recharge Date <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error fetching data</div>
        ) : (
          <>
            {data?.data?.users?.map((user, index) => (
              <div className="table-body" key={user?.id}>
                <div>
                  <p className="heading-text">
                    {(page - 1) * pageSize + index + 1}
                  </p>
                </div>
                <div>
                  <p className="heading-text">{user.fullName}</p>
                </div>
                <div>
                  <p className="heading-text">{user.wallet_balance}</p>
                </div>
                <div>
                  <p className="heading-text">
                    {user.totalRechargeAmount || 0.0}
                  </p>
                </div>
                <div>
                  <p className="heading-text">{user.totalGiftAmount || 0.0}</p>
                </div>
                <div>
                  <p className="heading-text">
                    {user.firstRechargeDate === null
                      ? "-"
                      : moment(user.firstRechargeDate).format(
                          "DD/MM/YYYY, hh:mm A"
                        )}{" "}
                  </p>
                </div>
                <div>
                  <div className="actions">
                    <img   onClick={() => handleView(user?.id)} src={viewIcon} alt={viewIcon} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Pages:</p>
            <Form.Select value={pageSize} onChange={handlePageSizeChange}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="25">25</option>
              <option value="30">30</option>
            </Form.Select>
          </div>

          <div className="pagination-details">
          <div className="pagination-numbers">
              <p>{(page - 1) * pageSize + 1}</p>-
              <p>
                {Math.min(
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
                alt={backwardIcon}
                onClick={() => setPage(1)}
                style={{ cursor: "pointer" }}
              />
              <img
                src={backIcon}
                alt={backIcon}
                onClick={() => handlePageChange("prev")}
                style={{ cursor: "pointer" }}
              />
              <img
                src={frontIcon}
                alt={frontIcon}
                onClick={() => handlePageChange("next")}
                style={{ cursor: "pointer" }}
              />
              <img
                src={forwardIcon}
                alt={forwardIcon}
                onClick={() =>
                  setPage(data?.data?.pagination?.totalPages || page)
                }
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecentUsers;
