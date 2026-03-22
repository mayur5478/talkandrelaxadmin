import React, { useEffect, useState } from "react";
import sort from "../../assets/sort.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import { Form } from "react-bootstrap";
import {
  useBlockListenersListQuery,
  useUnblockListenerMutation,
} from "../../../services/contact";
import replyImage from "../../assets/reply.png";
import Unblock from "../../common/unblock/Unblock";
import { useNavigate } from "react-router-dom";
function ListenerBlock({ search }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  console.log("search", search);

 
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, error, isLoading, refetch } = useBlockListenersListQuery({
    page,
    limit: pageSize,
    search: searchTerm,
  });

  const totalRecords = data?.meta?.total || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Reset to first page on page size change
  };

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const [unblockListener, { isLoading: isUnblockLoading }] =
    useUnblockListenerMutation();
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedUserUnblock, setSelectedUserUnblock] = useState({});
  const [userNameUnblock, setUserNameUnblock] = useState({});
  const handleUnblock = (userId,listenerId,listenerName, userName ) => {
    setSelectedUserUnblock({ userId: userId, listenerId: listenerId });
    setShowUnblockModal(true);
    setUserNameUnblock({ userName, listenerName });
  };

  const confirmUnblock = async () => {
    try {
      await unblockListener(selectedUserUnblock).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowUnblockModal(false);
      setSelectedUserUnblock(null);
      setUserNameUnblock(null);
    }
  };
   const navigate = useNavigate();
    const handleView = (id) => {
      navigate(`/dashboard/user-management/profile-view?id=${id}`);
    };
     const handleView2 = (id) => {
      navigate(`/dashboard/listener-management/profile-view?id=${id}`);
    };
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching blocked listeners</div>;

  return (
    <div>
      <div className="table">
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Reported by <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">Report for</p>
          </div>
          <div>
            <p className="heading-text">Unblock?</p>
          </div>
        </div>
        {data.data.map((listener, index) => (
          <div key={listener.id} className="table-body">
            <div>
              <p className="heading-text">
                {(page - 1) * pageSize + index + 1}
              </p>
            </div>
            <div>
              <p onClick={() => handleView(listener?.userId)} className="heading-text name">{listener?.userInfo?.fullName}</p>
            </div>
            <div>
              <p onClick={() => handleView2(listener?.listenerId)} className="heading-text name">
                {listener?.listenerInfo?.display_name}
              </p>
            </div>
            <div>
              <img
                onClick={() => {
                  setShowUnblockModal(true);
                  handleUnblock(
                    listener?.userId,
                    listener?.listenerId,
                    listener?.listenerInfo?.display_name,
                    listener?.userInfo.fullName
                  );
                }}
                src={replyImage}
                alt={replyImage}
              />
            </div>
          </div>
        ))}
        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Page:</p>
            <Form.Select
              aria-label="Default select example"
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
              <p>{Math.min(page * pageSize, totalRecords)}</p>
              <p>of</p>
              <p>{totalRecords}</p>
            </div>
            <div className="pagination-controls">
              <img
                onClick={handlePreviousPage}
                src={backwardIcon}
                alt="Previous"
                style={{
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              />
              <img
                onClick={handleNextPage}
                src={forwardIcon}
                alt="Next"
                style={{
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <Unblock 
        show={showUnblockModal}
        onHide={() => setShowUnblockModal(false)}
        onConfirm={confirmUnblock}
        userId={selectedUserUnblock}
        userName={userNameUnblock}
        isUnblockLoading={isUnblockLoading}
        type="listener"
      />
    </div>
  );
}

export default ListenerBlock;
