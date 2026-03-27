import React, { useState } from "react";
import sort from "../../../assets/sort.png";
import frontIcon from "../../../assets/front.png";
import backIcon from "../../../assets/back.png";
import forwardIcon from "../../../assets/forward.png";
import backwardIcon from "../../../assets/backward.png";
import { Form } from "react-bootstrap";
import "./rejections.scss";
import { useGetSessionRejectionsQuery } from "../../../../services/auth";
import moment from "moment";
import { useNavigate } from "react-router-dom";

function Rejections({ fromDate, toDate }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const { data, error, isLoading } = useGetSessionRejectionsQuery({
    page,
    limit: pageSize,
    fromDate: fromDate?.toISOString(),
    toDate: toDate?.toISOString(),
  });

  const handleViewUser = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  const handleViewListener = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching rejections: {error.message}</div>;

  const total = data?.pagination?.total || 0;
  const rejections = data?.data || [];

  const columnStyles = [
    { width: "5%" },   // Sr. No
    { width: "18%" },  // Date
    { width: "8%" },   // Type
    { width: "15%" },  // User
    { width: "15%" },  // Listener
    { width: "12%" },  // Rejected By
    { width: "12%" },  // Reason
    { width: "15%" },  // Request ID
  ];

  return (
    <div className="rejections-main">
      <div className="table-headings">
        <div style={columnStyles[0]}><p className="heading-text">Sr#</p></div>
        <div style={columnStyles[1]}><p className="heading-text">Date <img className="sort" src={sort} alt="sort" /></p></div>
        <div style={columnStyles[2]}><p className="heading-text">Type</p></div>
        <div style={columnStyles[3]}><p className="heading-text">User</p></div>
        <div style={columnStyles[4]}><p className="heading-text">Listener</p></div>
        <div style={columnStyles[5]}><p className="heading-text">By</p></div>
        <div style={columnStyles[6]}><p className="heading-text">Reason</p></div>
        <div style={columnStyles[7]}><p className="heading-text">Request ID</p></div>
      </div>

      {rejections.map((r, index) => (
        <div key={r.id} className="table-body">
          <div style={columnStyles[0]}>
            <p className="heading-text">{(page - 1) * pageSize + index + 1}</p>
          </div>
          <div style={columnStyles[1]}>
            <p className="heading-text">{moment(r.rejectedAt).format("DD/MM/YYYY, hh:mm A")}</p>
          </div>
          <div style={columnStyles[2]}>
            <p className="heading-text">{r.type}</p>
          </div>
          <div style={columnStyles[3]}>
            <p className="heading-text name" onClick={() => handleViewUser(r.userId)}>
              {r.userData?.fullName || "Unknown"}
            </p>
          </div>
          <div style={columnStyles[4]}>
            <p className="heading-text name" onClick={() => handleViewListener(r.listenerId)}>
              {r.listenerData?.fullName || "Listener"}
            </p>
          </div>
          <div style={columnStyles[5]}>
            <p className="heading-text">{r.rejectedBy}</p>
          </div>
          <div style={columnStyles[6]}>
            <p className="heading-text">{r.reason}</p>
          </div>
          <div style={columnStyles[7]}>
            <p className="heading-text small">{r.requestId || "N/A"}</p>
          </div>
        </div>
      ))}

      <div className="pagination">
        <div className="pagination-dropdown">
          <p>Items Per Pages:</p>
          <Form.Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
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
            <img onClick={() => setPage(1)} src={backwardIcon} alt="First" />
            <img onClick={() => setPage((prev) => Math.max(prev - 1, 1))} src={backIcon} alt="Prev" />
            <img onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(total / pageSize)))} src={frontIcon} alt="Next" />
            <img onClick={() => setPage(Math.ceil(total / pageSize))} src={forwardIcon} alt="Last" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rejections;
