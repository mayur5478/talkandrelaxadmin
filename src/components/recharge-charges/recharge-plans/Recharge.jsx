import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import "./recharge.scss";
import editIcon from "../../assets/pencil.png";
import deleteIcon from "../../assets/delete.png";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import {
  useCreateRechargePlanMutation,
  useDeleteRechargePlanMutation,
  useEditAdminCommissionMutation,
  useEditRechargePlanMutation,
  useRechargePlansHighlightMutation,
  useRechargePlansListQuery,
} from "../../../services/recharge";
import Highlight from "../../common/highlight/Highlight";
import DeleteModal from "../../common/delete-modal/DeleteModal";
import CreatePlan from "../../common/create-plan/CreatePlan";
import EditPlan from "../../common/edit-plans/EditPlan";
import Commission from "../../common/admin-commision/Commission";
import { useGetMeQuery } from "../../../services/auth";

function Recharge() {
  // ** State Hooks **
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [des, setDes] = useState("");
  const [deleteDes, setDeleteDes] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: userRefetch,
  } = useGetMeQuery(null, {
    skip: !localStorage.getItem("token"),
  });
console.log("user",user);

  // ** Data Fetching **
  const {
    data,
    error: fetchError,
    isLoading,
    refetch,
  } = useRechargePlansListQuery({ page, limit: pageSize, search: searchTerm });
  const [highlightMutation, { isLoading: isHighlightLoading }] =
    useRechargePlansHighlightMutation();
  const [deletePlan, { isLoading: isDeleteLoading }] =
    useDeleteRechargePlanMutation();
  // ** Event Handlers **
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  const [createMutation, { isLoading: isCreateLoading }] =
    useCreateRechargePlanMutation();
  const handleToggle = (plan_id, status) => {
    setSelectedUser(plan_id);
    setShowHighlightModal(true);
    if (status === false) {
      setDes("You Are Attempting To Highlight Plan in your system.");
    } else {
      setDes("You Are Attempting To remove Highlight Plan in your system.");
    }
  };
  const [editMutation, { isLoading: isEditLoading }] =
    useEditRechargePlanMutation();
  const confirmHighlight = async () => {
    try {
      await highlightMutation(selectedUser).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowHighlightModal(null);
    }
  };
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
  const [show, setShow] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [type, setType] = useState("Recharge");
  const [value, setValue] = useState(null);
  const [id, setId] = useState("");
  const handleValue = (data, id) => {
    setValue(data);
    setId(id);
  };
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

  const handlePageSizeChange = (e) => {
    setPageSize(e.target.value);
  };

  const handleNextPage = () => {
    if (page < data?.data?.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  const [showCommission, setShowCommission] = useState(false);
  const [editCommission, { isLoading: isEditCommissionLoading }] =
    useEditAdminCommissionMutation();
  const handleSubmitCommission = async (id, charge) => {
    try {
      await editCommission({ id, charge });
      userRefetch();
      setShowCommission(false);
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
    }
  };

  // ** Render States **
  if (isLoading) return <div>Loading...</div>;
  if (fetchError) return <div>Error fetching plans</div>;

  return (
    <div className="recharge-main">
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
        <div className="right-section">
          <Button className="edit-btn">
            <img src={editIcon} alt="Edit GST" /> GST (%)
          </Button>
          <Button className="edit-btn" onClick={() => setShowCommission(true)}>
            <img src={editIcon} alt="Edit Admin Commission" /> Admin Commission
          </Button>
          <Button className="edit-btn" onClick={() => setShow(true)}>
            + Recharge Plan
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
              Recharge Amount <img className="sort" src={sort} alt="Sort" />
            </p>
          </div>
          <div>
            <p className="heading-text">GST Amount</p>
          </div>
          <div>
            <p className="heading-text">Net Amount</p>
          </div>
          <div>
            <p className="heading-text">Highlight Plans</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>
        {data.data.plans.map((plan, index) => (
          <div key={plan.id} className="table-body">
            <div>
              <p className="heading-text">{index + 1}</p>
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
              <p className="heading-text">
                <div className="material-switch pull-right">
                  <input
                    id={`highlight-switch-${plan.id}`}
                    type="checkbox"
                    checked={plan.isHighlight}
                    onChange={() => handleToggle(plan.id, plan.isHighlight)}
                  />
                  <label
                    htmlFor={`highlight-switch-${plan.id}`}
                    className="label-default"
                  ></label>
                </div>
              </p>
            </div>
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
        ))}
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
              <p>{(page - 1) * pageSize + 1}</p>-<p>{page * pageSize}</p>
              <p>of</p>
              <p>{data?.data?.total}</p>
            </div>
            <div className="pagination-controls">
              <img
                onClick={handlePreviousPage}
                src={backwardIcon}
                alt={backwardIcon}
              />
          
              <img onClick={handlePreviousPage} src={backIcon} alt={backIcon} />
              <img onClick={handleNextPage} src={frontIcon} alt={frontIcon} />
              <img
                onClick={handleNextPage}
                src={forwardIcon}
                alt={forwardIcon}
              />
            </div>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
      <Highlight
        show={showHighlightModal}
        onHide={() => setShowHighlightModal(false)}
        des={des}
        onConfirm={confirmHighlight}
        isLoading={isHighlightLoading}
      />
      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        des={deleteDes}
        onConfirm={confirmDelete}
        isLoading={isDeleteLoading}
      />
      <CreatePlan
        show={show}
        onHide={() => setShow(false)}
        type={type} // "Recharge" or "Gift"
        isEdit={false} // or true if editing
        onSubmit={handleSubmit}
        isSubmitting={isCreateLoading}
      />
      <EditPlan
        show={showEdit}
        onHide={() => setShowEdit(false)}
        type={type} // "Recharge" or "Gift"
        isEdit={false} // or true if editing
        onSubmit={handleSubmitEdit}
        isSubmitting={isEditLoading}
        initialData={{ recharge_amount: value }}
        id={id}
      />
      <Commission
        show={showCommission}
        onHide={() => setShowCommission(false)}
        isSubmitting={isEditCommissionLoading}
        onSubmit={handleSubmitCommission}
        user={user}
      />
    </div>
  );
}

export default Recharge;
