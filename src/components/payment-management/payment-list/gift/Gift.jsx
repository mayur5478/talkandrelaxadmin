import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useGiftListQuery } from "../../../../services/listener";
import "./gift.scss";
import sort from "../../../assets/sort.png";
import frontIcon from "../../../assets/front.png";
import backIcon from "../../../assets/back.png";
import forwardIcon from "../../../assets/forward.png";
import backwardIcon from "../../../assets/backward.png";
import moment from "moment";
import { useNavigate } from "react-router-dom";

function Gift({ searchTerm }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const {
    data: apiData,
    error,
    isLoading,
  } = useGiftListQuery({ page, limit:pageSize, search: debouncedSearch });

  const data = apiData?.data || {};
  const gifts = data.gifts || [];
  const total = data.total || 0;
  const totalPages = data.totalPages || 1;

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setPage(1); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };
  const navigate = useNavigate();
  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };
   const handleView2 = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`);
  };
  return (
    <div className="gift-main">
      <div className="table-headings">
        {[
          "Sr. No",
          "Transaction ID",
          "Payment ID",
          "User ",
          "Listener",
          "Gift Status",
          "Gift Amount",
          "GST (₹)",
          "Net Amount",
          "Country",
          "State",
          "Admin Commission",
          "Transaction Status",
          "Transaction Date",
        ].map((heading, i) => (
          <div key={i}>
            <p className="heading-text">
              {heading} <img className="sort" src={sort} alt="sort" />
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : gifts.length === 0 ? (
        <p>No data found</p>
      ) : (
        gifts.map((gift, index) => (
          <div key={gift.id} className="table-body">
            <div>
              <p className="heading-text">
                {(page - 1) * pageSize + index + 1}
              </p>
            </div>
            <div>
              <p className="heading-text">{gift.razorpay_order_id}</p>
            </div>
            <div>
              <p className="heading-text">{gift.razorpay_payment_id}</p>
            </div>
            <div>
              <p onClick={() =>handleView(gift?.user_id) } className="heading-text name">{gift.userName}</p>
            </div>
            <div>
              <p onClick={() => handleView2(gift?.listener_id)}className="heading-text name">{gift.listenerName}</p>
            </div>
            <div>
              <p
                className={`heading-text ${
                  gift.status === "success" ? "green-text" : "yellow-text"
                }`}
              >
                {gift.status === "success" ? "Received" : "Pending"}
              </p>
            </div>
            <div>
              <p className="heading-text">{gift.amount}</p>
            </div>
            <div>
              <p className="heading-text">{gift.gst_amount}</p>
            </div>
            <div>
              <p className="heading-text">{gift.net_gift_amount}</p>
            </div>
            <div>
              <p className="heading-text">{gift.country}</p>
            </div>
            <div>
              <p className="heading-text">{gift.state}</p>
            </div>
            <div>
              <p className="heading-text">{gift.admin_commission}</p>
            </div>
            <div>
              <p
                className={`heading-text ${
                  gift.status === "success" ? "green-text" : "yellow-text"
                }`}
              >
                {gift.status}
              </p>
            </div>
            <div>
              <p className="heading-text extra-space">
                 {moment(gift.transaction_date).format("DD/MM/YYYY, hh:mm A")}
             
              </p>
            </div>
          </div>
        ))
      )}

      <div className="pagination">
        <div className="pagination-dropdown">
          <p>Items Per Page:</p>
          <Form.Select value={pageSize} onChange={handlePageSizeChange}>
            {[5, 10, 15, 20, 25, 30].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
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
            <img alt="pagination" src={backwardIcon} onClick={() => handlePageChange(1)} />
            <img alt="pagination" src={backIcon} onClick={() => handlePageChange(page - 1)} />
            <img alt="pagination" src={frontIcon} onClick={() => handlePageChange(page + 1)} />
            <img alt="pagination"
              src={forwardIcon}
              onClick={() => handlePageChange(totalPages)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gift;
