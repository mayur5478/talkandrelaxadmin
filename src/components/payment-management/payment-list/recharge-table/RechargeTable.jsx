import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useRechargeListQuery } from "../../../../services/listener"; // Adjust the import path as necessary
import sort from "../../../assets/sort.png";
import frontIcon from "../../../assets/front.png";
import backIcon from "../../../assets/back.png";
import forwardIcon from "../../../assets/forward.png";
import backwardIcon from "../../../assets/backward.png";
import "./recharge.scss";
import moment from "moment";
import { useNavigate } from "react-router-dom";

function RechargeTable({ searchTerm, dateRange, setExcelData }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, error, isLoading } = useRechargeListQuery({
    page,
    limit: pageSize,
    search: debouncedSearch,
    fromDate: dateRange[0]?.toISOString(),
    toDate: dateRange[1]?.toISOString(),
  });
  useEffect(() => {
    if (data?.data?.recharges) {
      setExcelData(data.data.recharges);
    }
  }, [data]);
  console.log("ddata", data);

  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const handlePageSizeChange = (event) => {
    const value = event.target.value;
    setPageSize(value === "all" ? "all" : Number(value));
    setPage(1);
  };

  const navigate = useNavigate();
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching recharge data: {error.message}</div>;
  console.log("page", page);
  console.log(pageSize);

  return (
    <div className="recharge-main-2">
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
            Payment ID <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Name <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Recharge Amount <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            Net Recharge <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">
            GST (₹) <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text">Country</p>
        </div>
        <div>
          <p className="heading-text">State</p>
        </div>
        <div>
          <p className="heading-text">
            Transaction Status <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
        <div>
          <p className="heading-text extra-space">
            Transaction Date <img className="sort" src={sort} alt={sort} />
          </p>
        </div>
      </div>

      {data?.data?.recharges.map((recharge, index) => (
        <div key={recharge.id} className="table-body">
          <div>
            <p className="heading-text">
              {page && pageSize !== "all"
                ? (page - 1) * pageSize + index + 1
                : index + 1}
            </p>
          </div>
          <div>
            <p className="transaction-id">{recharge.transaction_id}</p>
          </div>
          <div>
            <p className="transaction-id">{recharge.razorpay_payment_id || 'N/A'}</p>
          </div>
          <div>
            <p
              onClick={() => handleView(recharge?.user_id)}
              className="heading-text name"
            >
              {recharge.name}
            </p>
          </div>
          <div>
            <p className="heading-text fw-bold">₹{recharge.recharge_amount}</p>
          </div>
          <div>
            <p className="heading-text">₹{recharge.net_recharge}</p>
          </div>
          <div>
            <p className="heading-text text-muted">₹{recharge.gst_amount}</p>
          </div>
          <div>
            <p className="heading-text">{recharge.country}</p>
          </div>
          <div>
            <p className="heading-text">{recharge.state}</p>
          </div>
          <div>
            <p
              className={`heading-text ${
                recharge.status === "pending" || recharge.status === "failed"
                  ? "red-text"
                  : "green-text"
              }`}
            >
              {recharge.status?.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="heading-text text-muted small">
              {moment(recharge.transaction_date).format("DD/MM/YYYY")} <br/>
              <span className="fw-bold text-dark">{moment(recharge.transaction_date).format("hh:mm A")}</span>
            </p>
          </div>
        </div>
      ))}


      <div className="pagination">
        <div className="pagination-dropdown">
          <p>Items Per Page:</p>
          <Form.Select
            aria-label="Default select example"
            onChange={handlePageSizeChange}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
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
              src={backwardIcon}
              alt="First"
              onClick={() => handlePageChange(1)}
            />
            <img
              src={backIcon}
              alt="Previous"
              onClick={() => handlePageChange(page - 1)}
            />
            <img
              src={frontIcon}
              alt="Next"
              onClick={() => handlePageChange(page + 1)}
            />
            <img
              src={forwardIcon}
              alt="Last"
              onClick={() => handlePageChange(totalPages)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RechargeTable;
