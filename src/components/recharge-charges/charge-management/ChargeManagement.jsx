import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import "./chargeManagement.scss";
import editIcon from "../../assets/pencil.png";
import deleteIcon from "../../assets/delete.png";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import { useChargesListQuery, useEditChargesMutation } from "../../../services/recharge";
import EditCharge from "../../common/edit-charge/EditCharge";

function ChargeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetching the listener charges list
  const { data, error, isLoading ,refetch} = useChargesListQuery({
    page,
    limit: pageSize,
    search: searchTerm,
  });

  const totalRecords = data?.pagination?.total || 0;
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

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page on search
  };
  const [editMutation, { isLoading: isEditLoading }] =
    useEditChargesMutation();

  const [showEdit, setShowEdit] = useState(false);
    const [value, setValue] = useState({});
    const [id, setId] = useState("");
    const handleValue = (id,chat_charge,call_charge,video_charge,listener_name) => {
      setValue({chat_charge:chat_charge,call_charge:call_charge,video_charge:video_charge,listener_name:listener_name});
      setId(id);
    };

    const handleSubmitEdit = async (formData) => {
      try {
        await editMutation(formData);
        refetch();
  
        setShowEdit(false);
      } catch (error) {
        console.error("Submit Error:", error);
      } finally {
      }
    };


  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching charges</div>;

  return (
    <div className="gift-management-main">
      <div className="top-section">
        <div className="left-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={searchTerm}
              onChange={handleSearch}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>

        {/* <div className="right-section">
          <Button className="edit-btn">+ Add Charges</Button>
        </div> */}
      </div>
      <div className="table">
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Listener Name <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">Services</p>
          </div>
          <div>
            <p className="heading-text">Chat</p>
          </div>
          <div>
            <p className="heading-text">Call</p>
          </div>
          <div>
            <p className="heading-text">Video Call</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
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
              <p className="heading-text">{listener.display_name}</p>
            </div>
            <div>
              <p className="heading-text">
                {listener.service.join(", ")}
              </p>
            </div>
            <div>
              <p className="heading-text">Rs. {listener.chat_charge} per Min</p>
            </div>
            <div>
              <p className="heading-text">
                Rs. {listener.voice_charge} per Min
              </p>
            </div>
            <div>
              <p className="heading-text">
                Rs. {listener.video_charge} per Min
              </p>
            </div>
            <div>
              <div className="actions">
                <img   onClick={() => {
                  setShowEdit(true);
                  handleValue(listener.id, listener.chat_charge,listener.voice_charge,listener.video_charge,listener.display_name);
                }} src={editIcon} alt="Edit" />
                {/* <img src={deleteIcon} alt="Delete" /> */}
              </div>
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
      <EditCharge
        show={showEdit}
        onHide={() => setShowEdit(false)}
        onSubmit={handleSubmitEdit}
        isSubmitting={isEditLoading}
        initialData={value}
        id={id}
      />
    </div>
  );
}

export default ChargeManagement;
