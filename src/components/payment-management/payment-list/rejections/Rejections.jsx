import React, { useState, useEffect } from "react";
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const navigate = useNavigate();

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, search, typeFilter]);

  const { data, error, isLoading } = useGetSessionRejectionsQuery({
    page,
    limit: pageSize,
    fromDate: fromDate?.toISOString(),
    toDate: toDate?.toISOString(),
    search: search || undefined,
    type: typeFilter,
  });

  const handleViewUser = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  const handleViewListener = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
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
      <div className="rejections-filters mb-3 d-flex gap-3 flex-wrap align-items-center">
        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Search user or listener..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <button type="submit" className="btn btn-sm btn-primary">Search</button>
          {search && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(""); setSearchInput(""); }}>
              Clear
            </button>
          )}
        </form>
        <Form.Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: 150 }}
        >
          <option value="all">All Types</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="chat">Chat</option>
        </Form.Select>
      </div>

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
