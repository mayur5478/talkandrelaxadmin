import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import "./giftManagement.scss";
import editIcon from "../../assets/pencil.png";
import deleteIcon from "../../assets/delete.png";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import {
  useCreateGiftPlanMutation,
  useDeleteGiftPlanMutation,
  useEditGiftPlanMutation,
  useGiftPlansListQuery,
} from "../../../services/recharge";
import CreatePlan from "../../common/create-plan/CreatePlan";
import DeleteModal from "../../common/delete-modal/DeleteModal";
import EditPlan from "../../common/edit-plans/EditPlan";

function GiftManagement() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, refetch } = useGiftPlansListQuery({
    page,
    limit,
    search: searchText,
  });

  const plans = data?.plans || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };
  const [show, setShow] = useState(false);
  const [type, setType] = useState("Gift");
  const [createMutation, { isLoading: isCreateLoading }] =
    useCreateGiftPlanMutation();
  const handleSubmit = async (formData) => {
    try {
      await createMutation(formData);
      refetch();

      setShow(false);
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
    }
  };
  const [deletePlan, { isLoading: isDeleteLoading }] =
    useDeleteGiftPlanMutation();
  const [deleteDes, setDeleteDes] = useState("");
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = (planId) => {
    setSelectedUserDelete(planId);
    setShowDeleteModal(true);
    setDeleteDes("You Are Attempting To remove Plan in your system");
  };

  const confirmDelete = async () => {
    try {
      await deletePlan(selectedUserDelete).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserDelete(null);
    }
  };

  const [showEdit, setShowEdit] = useState(false);

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
  const [value, setValue] = useState(null);
  const [id, setId] = useState("");
  const handleValue = (data, id) => {
    setValue(data);
    setId(id);
  };

  const [editMutation, { isLoading: isEditLoading }] =
    useEditGiftPlanMutation();
  return (
    <div className="gift-management-main">
      <div className="top-section">
        <div className="left-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search by gift amount"
              value={searchText}
              onChange={handleSearchChange}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>

        <div className="right-section">
          <Button className="edit-btn" onClick={() => setShow(true)}>
            + Gift Amount
          </Button>
        </div>
      </div>

      <div className="table">
        <div className="table-headings">
          <div>
            <p className="heading-text">Sr. No</p>
          </div>
          <div>
            <p className="heading-text">
              Gift Amount <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">GST Amount</p>
          </div>
          <div>
            <p className="heading-text">Net Amount</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : plans.length === 0 ? (
          <p>No gift plans found</p>
        ) : (
          plans.map((plan, index) => (
            <div key={plan._id} className="table-body">
              <div>
                <p className="heading-text">{(page - 1) * limit + index + 1}</p>
              </div>
              <div>
                <p className="heading-text">{plan.payable_amount}</p>
              </div>
              <div>
                <p className="heading-text">{plan.gst_amount}</p>
              </div>
              <div>
                <p className="heading-text">{plan.net_amount}</p>
              </div>
              <div>
                <div className="actions">
                  <img
                    onClick={() => {
                      setShowEdit(true);
                      handleValue(plan.payable_amount, plan.id);
                    }}
                    src={editIcon}
                    alt="Edit"
                  />
                  <img
                    onClick={() => handleDelete(plan.id)}
                    src={deleteIcon}
                    alt="Delete"
                  />
                </div>
              </div>
            </div>
          ))
        )}

        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Page:</p>
            <Form.Select value={limit} onChange={handleLimitChange}>
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
              <p>{(page - 1) * limit + 1}</p> -{" "}
              <p>{Math.min(page * limit, total)}</p>
              <p>of</p>
              <p>{total}</p>
            </div>

            <div className="pagination-controls">
              <img
                src={backwardIcon}
                alt="First"
                onClick={() => setPage(1)}
                style={{ cursor: "pointer" }}
              />
              <img
                src={backIcon}
                alt="Prev"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                style={{ cursor: "pointer" }}
              />
              <img
                src={frontIcon}
                alt="Next"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                style={{ cursor: "pointer" }}
              />
              <img
                src={forwardIcon}
                alt="Last"
                onClick={() => setPage(totalPages)}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>
      <CreatePlan
        show={show}
        onHide={() => setShow(false)}
        type={type} // "Recharge" or "Gift"
        isEdit={false} // or true if editing
        onSubmit={handleSubmit}
        isSubmitting={isCreateLoading}
      />
      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        des={deleteDes}
        onConfirm={confirmDelete}
        isLoading={isDeleteLoading}
      />
      <EditPlan
        show={showEdit}
        onHide={() => setShowEdit(false)}
        type={type} // "Recharge" or "Gift"
        isEdit={false} // or true if editing
        onSubmit={handleSubmitEdit}
        isSubmitting={isEditLoading}
        initialData={{ gift_amount: value }}
        id={id}
      />
    </div>
  );
}

export default GiftManagement;
