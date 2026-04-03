import React, { useEffect, useState } from "react";
import sort from "../../../assets/sort.png";
import frontIcon from "../../../assets/front.png";
import backIcon from "../../../assets/back.png";
import forwardIcon from "../../../assets/forward.png";
import backwardIcon from "../../../assets/backward.png";
import deleteIcon from "../../../assets/delete.png";
import killIcon from "../../../assets/cancel.png";
import { Form } from "react-bootstrap";
import "./service.scss";
import { useSessionListQuery } from "../../../../services/listener"; 
import moment from "moment";
import { useNavigate } from "react-router-dom";
import ForceEndModal from "../../../common/force-end/ForceEndModal.jsx";

function Services({ searchUser, searchListener, dateRange, setExcelSessionData, onRefetch }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForceEndModal, setShowForceEndModal] = useState(false);
  const [forceEndTarget, setForceEndTarget] = useState({ id: '', name: '', userId: '' });
  const navigate = useNavigate();
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };
  const handleView2 = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };
  // Fetch session data using the query
  const { data, error, isLoading, refetch } = useSessionListQuery({
    page,
    limit: pageSize,
    searchUser: searchUser?.trim() || "",
    searchListener: searchListener?.trim() || "",
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
  });

  // Expose refetch function to parent
  useEffect(() => {
    if (onRefetch) {
      onRefetch.current = refetch;
    }
  }, [refetch, onRefetch]);
  useEffect(() => {
    if (data?.data) {
      setExcelSessionData(data.data);
    }
  }, [data]);
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching session data: {error.message}</div>;

  const total = data.total || 0;
  // Improve layout by reducing min-width and adjusting column widths for less horizontal scrolling

  // Custom column width configuration—percentages must add up to 100 or less
  // Improved for clarity, readability, and more balanced distribution (while ensuring total < 100%)
  const columnStyles = [
    { width: "4%" },   // Sr. No
    { width: "13%" },  // Date
    { width: "6%" },   // Status
    { width: "6%" },   // Type
    { width: "10%" },  // User
    { width: "10%" },  // Listener
    { width: "4%" },   // Minute
    { width: "9%" },   // Total Amount
    { width: "9%" },   // Net Amount
    { width: "9%" },   // Admin %
    { width: "10%" },  // U. Wallet (REPLACED)
    { width: "10%" },  // Action
  ];


  return (
    <div className="services-main">
      <div className="table-headings">
        <div style={columnStyles[0]}>
          <p className="heading-text">Sr#</p>
        </div>
        <div style={columnStyles[1]}>
          <p className="heading-text ">
            Date
            <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[2]}>
          <p className="heading-text">
            Status <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[3]}>
          <p className="heading-text">
            Type
            <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[4]}>
          <p className="heading-text">
            User <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[5]}>
          <p className="heading-text">
            Listener <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[6]}>
          <p className="heading-text text-end">
            Min<img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[7]}>
          <p className="heading-text text-end">
            Total Amt <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[8]}>
          <p className="heading-text text-end">
            Net Amt <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[10]}>
          <p className="heading-text text-end">
            U. Wallet <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div style={columnStyles[11]}>
          <p className="heading-text text-center">Action</p>
        </div>
      </div>

      {data.data.map((session, index) => (
        <div key={session.id} className="table-body">
          <div style={columnStyles[0]}>
            <p className="heading-text">
              {page && pageSize !== "all"
                ? (page - 1) * pageSize + index + 1
                : index + 1}
            </p>
          </div>
          <div style={columnStyles[1]}>
            <p className="heading-text extra-space">
              {moment(session.createdAt).format("DD/MM/YYYY, hh:mm A")}
            </p>
          </div>
          <div style={columnStyles[2]}>
            <p className={`heading-text ${session.transaction_status === 'active' ? 'text-primary fw-bold' : 'green-text'}`}>
              {session.transaction_status === 'active' ? (
                <span className="d-flex align-items-center gap-1">
                  <span className="blinking-dot"></span> LIVE
                </span>
              ) : session.transaction_status}
            </p>
          </div>
          <div style={columnStyles[3]}>
            <p className="heading-text">{session?.service_type}</p>
          </div>
          <div style={columnStyles[4]}>
            <p
              onClick={() => handleView(session?.userId)}
              className="heading-text name"
            >
              {session.username}
            </p>
          </div>
          <div style={columnStyles[5]}>
            <p
              onClick={() => handleView2(session?.listenerId)}
              className="heading-text name"
            >
              {session.listenerName}
            </p>
          </div>
          <div style={columnStyles[6]}>
            <p className="heading-text text-end">{session.totalDuration}</p>
          </div>
          <div style={columnStyles[7]}>
            <p className="heading-text text-end">{session.total_amount}</p>
          </div>
          <div style={columnStyles[8]}>
            <p className="heading-text text-end">{session.listener_credit}</p>
          </div>
          <div style={columnStyles[9]}>
            <p className="heading-text text-end">{session.admin_credit}</p>
          </div>
          <div style={columnStyles[10]}>
            <p className="heading-text text-end fw-bold text-dark">₹{session.user_wallet_balance || '0.00'}</p>
          </div>
          <div style={columnStyles[11]} className="text-center actions d-flex justify-content-center gap-2">
            <img src={deleteIcon} alt={deleteIcon} />
            {session.transaction_status === 'active' && (
              <img 
                src={killIcon} 
                onClick={() => {
                  setForceEndTarget({ id: session.id, name: session.username, userId: session.userId });
                  setShowForceEndModal(true);
                }}
                title="Force End Session"
                alt="Kill" 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            )}
          </div>
        </div>
      ))}

      <ForceEndModal
        show={showForceEndModal}
        handleClose={() => setShowForceEndModal(false)}
        userId={forceEndTarget.userId}
        userName={forceEndTarget.name}
        refetch={refetch}
      />

      <div className="pagination">
        <div className="pagination-dropdown">
          <p>Items Per Pages:</p>
          <Form.Select
            aria-label="Default select example"
            onChange={(e) => {
              setPageSize(e.target.value);
              setPage(1); // Reset to first page when page size changes
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="all">All</option>
          </Form.Select>
        </div>
        <div className="pagination-details">
          <div className="pagination-numbers">
             <p>{(page - 1) * pageSize + 1}</p>-
            <p>{Math.min(page * pageSize, total)}</p>
            <p>of</p>
            <p>{total}</p>
          </div>

          <div className="pagination-controls">
            <img
              onClick={() => setPage(1)}
              src={backwardIcon}
              alt="First page"
            />
            <img
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              src={backIcon}
              alt="Previous page"
            />
            <img
              onClick={() =>
                setPage((prev) =>
                  Math.min(prev + 1, Math.ceil(total / pageSize))
                )
              }
              src={frontIcon}
              alt="Next page"
            />
            <img
              onClick={() => setPage(Math.ceil(total / pageSize))}
              src={forwardIcon}
              alt="Last page"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Services;
