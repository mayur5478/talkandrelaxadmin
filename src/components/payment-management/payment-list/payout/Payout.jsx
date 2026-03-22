import React, { useEffect, useState } from "react";
import sort from "../../../assets/sort.png";
import frontIcon from "../../../assets/front.png";
import backIcon from "../../../assets/back.png";
import forwardIcon from "../../../assets/forward.png";
import backwardIcon from "../../../assets/backward.png";
import viewIcon from "../../../assets/view.png";
import editIcon from "../../../assets/edit.png";
import { Form } from "react-bootstrap";
import "./payout.scss";
import { useNavigate } from "react-router-dom";
import { usePayoutsListQuery } from "../../../../services/listener";

function Payout({ searchTerm, dateRange, setExcelData }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError } = usePayoutsListQuery({ page, limit,search:searchTerm });

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleNextPage = () => {
    if (data?.data?.page < data?.data?.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const salarySlip = (id) => {
    navigate(`/dashboard/payment-management/salary-slip?id=${id}`);
  };

  const editSalary = (id) => {
    navigate(`/dashboard/payment-management/edit-salary?id=${id}`);
  };
 
  const handleView2 = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };
  return (
    <div className="payout-main">
      <div className="table-headings">
        <div>
          <p className="heading-text">Sr. No</p>
        </div>
        <div>
          <p className="heading-text">
            Transition ID <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Listener Name <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Payout Amount <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">Description</p>
        </div>
        <div>
          <p className="heading-text">
            Transaction Date <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">Action</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : isError ? (
        <div className="error">Failed to load data</div>
      ) : (
        data?.data?.payouts?.map((item, index) => (
          <div className="table-body" key={item.id}>
            <div>
              <p className="heading-text">{(page - 1) * limit + index + 1}</p>
            </div>
            <div>
              <p className="heading-text">{item.transaction_id || "-"}</p>
            </div>
            <div>
              <p onClick={() => handleView2(item?.listener_id)} className="heading-text name">{item.display_name || "-"}</p>
            </div>
            <div>
              <p className="heading-text">{item.payout_amount || "-"}</p>
            </div>
            <div>
              <p className="heading-text">
                {`A salary of Rs. ${parseFloat(
                  item?.net_payout_amount || 0
                ).toFixed(2)} has been paid by the admin,`}
                <br />
                {`deducting Rs. ${(
                  parseFloat(item?.leave_penalty || 0) +
                  parseFloat(item?.missed_session_penalty || 0) +
                  parseFloat(item?.violation_penalty || 0)
                ).toFixed(2)} penalty amount.`}
              </p>
            </div>
            <div>
              <p className="heading-text">
                {item?.transaction_date ? new Date(item.transaction_date).toLocaleString() : "-"}
              </p>
            </div>
            <div className="actions">
              <img onClick={() => salarySlip(item?.id)} src={viewIcon} alt={viewIcon} />
              <img onClick={() => editSalary(item?.id)} src={editIcon} alt={editIcon} />
            </div>
          </div>
        ))
      )}

      <div className="pagination">
        <div className="pagination-dropdown">
          <p>Items Per Pages:</p>
          <Form.Select
            aria-label="Default select example"
            value={limit}
            onChange={handleLimitChange}
          >
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
            <p>{(page - 1) * limit + 1}</p>-
            <p>{Math.min(page * limit, data?.data?.total)}</p>
            <p>of</p>
            <p>{data?.data?.total}</p>
          </div>
          <div className="pagination-controls">
            <img
              src={backwardIcon}
              alt="first"
              onClick={() => setPage(1)}
              style={{ cursor: "pointer" }}
            />
            <img
              src={backIcon}
              alt="previous"
              onClick={handlePrevPage}
              style={{ cursor: "pointer" }}
            />
            <img
              src={frontIcon}
              alt="next"
              onClick={handleNextPage}
              style={{ cursor: "pointer" }}
            />
            <img
              src={forwardIcon}
              alt="last"
              onClick={() => setPage(data?.data?.totalPages)}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payout;
