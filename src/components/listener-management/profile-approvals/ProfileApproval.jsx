import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import DatePicker from "../../user-management/user-list/date-picker/DatePicker";
import sort from "../../assets/sort.png";
import right from "../../assets/right.png";
import viewIcon from "../../assets/view.png";
import cancel from "../../assets/cancel.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import search from "../../assets/search.png";
import "./profileApproval.scss";
import ExportExcel from "../../common/export-modal/ExportExcel";
import { useListenerProfileApprovalMutation, useProfileApprovalsQuery } from "../../../services/listener"; // Import your API hook
import moment from "moment";
import AcceptRequest from "../../common/accept-modal/AcceptRequest";
import { useNavigate } from "react-router-dom";

function ProfileApproval() {
  const [modalShow, setModalShow] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams, setSearchParams] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
    const [userName, setUserName] = useState(null);
      const [showLinkModal, setShowLinkModal] = useState(false);
 const [
    sendProfileApproval,
    { data: mutationData, error: mutationError, isLoading: isMutationLoading },
  ] = useListenerProfileApprovalMutation();
  const { data, isLoading, isError,refetch } = useProfileApprovalsQuery({
    page,
    pageSize,
    searchParams: searchParams ? searchParams : "",
    date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
  });

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

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleView = (id) => {
    navigate(`/dashboard/listener-management/profile-view?id=${id}`)
    console.log("View item clicked");
  };
  const handleApprovedListener = (userId,userName) => {
    setSelectedUser(userId);
    setShowLinkModal(true);
    setUserName(userName);
    
  }
  const confirmAcception = async() => {
   
    try {
      await sendProfileApproval(selectedUser).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setSelectedUser(null);
    setShowLinkModal(false);
    setUserName(null);
    }
  };
  return (
    <div className="application-requests-main">
      <div className="top-section">
        <div className="left-section">
          <Button onClick={() => setModalShow(true)}>Excel</Button>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={searchParams}
              onChange={handleSearch}
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
            <p className="heading-text">Email ID</p>
          </div>
          <div>
            <p className="heading-text">Contact Number</p>
          </div>
         
          <div>
            <p className="heading-text">
              Listener Status <img className="sort" src={sort} alt={sort} />
            </p>
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
          data?.data?.users.map((request, index) => (
            <div className="table-body" key={index}>
              <div>
                <p className="heading-text">
                  {(page - 1) * pageSize + index + 1}
                </p>
              </div>
              <div>
                <p className="heading-text">{request?.fullName}</p>
              </div>
              <div>
                <p className="heading-text">{request?.email}</p>
              </div>
              <div>
            <p className="heading-text">{request?.mobile_number}</p>
          </div>

         
          <div>
            <p className={`heading-text ${request?.listener_request_status === "documents in review" ? "red-text"  : "green-text"} `}>{request?.listener_request_status === "documents in review" ? "Pending" : "Success"}</p>
          </div>
         
         
          <div>
            <div className="actions">
               <img src={viewIcon} alt={viewIcon} onClick={() => handleView(request?.id)} />{" "}
              <img onClick={() => handleApprovedListener(request?.id,request?.fullName)} src={right} alt={right} />{" "}
              <img src={cancel} alt={cancel} />{" "}
             
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
              <option value="15">15</option>
              <option value="20">20</option>
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
                alt="First Page"
                onClick={() => setPage(1)}
              />
              <img src={backIcon} alt="Previous Page" onClick={handlePreviousPage} />
              <img src={frontIcon} alt="Next Page" onClick={handleNextPage} />
              <img
                src={forwardIcon}
                alt="Last Page"
                onClick={() => setPage(data?.data?.pagination?.totalPages || page)}
              />
            </div>
          </div>
        </div>
      </div>
      <ExportExcel show={modalShow} onHide={() => setModalShow(false)} />
        <AcceptRequest  show={showLinkModal}
        onHide={() => setShowLinkModal(false)}
        onConfirm={confirmAcception}
        userId={selectedUser}
        userName={userName}
        isMutationLoading={isMutationLoading}/>
    </div>
  );
}

export default ProfileApproval;
