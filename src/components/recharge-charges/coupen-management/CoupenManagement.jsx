// src/components/CoupenManagement.js
import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";

import "./coupenManagement.scss";
import editIcon from "../../assets/pencil.png";
import deleteIcon from "../../assets/delete.png";
import search from "../../assets/search.png";
import sort from "../../assets/sort.png";
import frontIcon from "../../assets/front.png";
import backIcon from "../../assets/back.png";
import forwardIcon from "../../assets/forward.png";
import backwardIcon from "../../assets/backward.png";
import {
  useCoupensListQuery,
  useCreateCoupenMutation,
  useDeleteCoupenMutation,
  useEditCoupenMutation,
  useGetCoupenUsersQuery,
} from "../../../services/recharge";
import Coupen from "../../common/coupen/Coupen";
import DeleteModal from "../../common/delete-modal/DeleteModal";

function CoupenManagement() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialData, setInitialData] = useState({});
  const [id, setId] = useState("");
  const [show, setShow] = useState(false);
  const [usersModal, setUsersModal] = useState({ open: false, coupenId: null, coupenTitle: "" });
  const [usersPage, setUsersPage] = useState(1);
  // Use the coupensList query
  const { data, error, isLoading, refetch } = useCoupensListQuery({
    page,
    limit,
    search: searchTerm,
  });

  const handleSetValue = (data, id) => {
    setInitialData(data);
    setId(id);
  };

  const { data: usersData, isLoading: isUsersLoading } = useGetCoupenUsersQuery(
    { id: usersModal.coupenId, page: usersPage, limit: 10 },
    { skip: !usersModal.coupenId }
  );

  const [createMutation, { isLoading: isCreateLoading }] =
    useCreateCoupenMutation();
  const [updateMutation, { isLoading: isUpdateLoading }] =
    useEditCoupenMutation();
    const handleSubmit = async (formData) => {
      try {
        if (id && initialData) {
          await updateMutation(formData).unwrap();
        } else {
          await createMutation(formData).unwrap();
        }
    
        refetch();     // Refresh list after success
        setShow(false);
      } catch (error) {
        console.error("Submit Error:", error);
      }
    };
      const [deleteCoupen, { isLoading: isDeleteLoading }] =
        useDeleteCoupenMutation();
      const [deleteDes, setDeleteDes] = useState("");
      const [selectedUserDelete, setSelectedUserDelete] = useState(null);
      const [showDeleteModal, setShowDeleteModal] = useState(false);
      const handleDelete = (coupenId) => {
        setSelectedUserDelete(coupenId);
        setShowDeleteModal(true);
        setDeleteDes("You Are Attempting To remove Coupen in your system");
      };
      const confirmDelete = async () => {
        try {
          await deleteCoupen(selectedUserDelete).unwrap();
          refetch();
        } catch (err) {
          console.error("Error toggling account freeze:", err);
        } finally {
          setShowDeleteModal(false);
          setSelectedUserDelete(null);
        }
      };
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data</div>;

  return (
    <div className="coupen-management-main">
      <div className="top-section">
        <div className="left-section">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search User"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img src={search} alt="Search" className="search-icon" />
          </div>
        </div>

        <div className="right-section">
          <Button className="edit-btn" onClick={() => setShow(true)}>
            + Create Coupen
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
              Coupen Name <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              Minimum Amount <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">
              % off <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">On Amount</p>
          </div>
          <div>
            <p className="heading-text">
              Expire Date <img className="sort" src={sort} alt={sort} />
            </p>
          </div>
          <div>
            <p className="heading-text">Usage</p>
          </div>
          <div>
            <p className="heading-text">Status</p>
          </div>
          <div>
            <p className="heading-text">Action</p>
          </div>
        </div>
        <div>
          {data.data.map((coupen, index) => (
            <div key={coupen.id} className="table-body">
              <div>
                <p className="heading-text">{index + 1}</p>
              </div>
              <div>
                {" "}
                <p className="heading-text">{coupen.title}</p>
              </div>
              <div>
                {" "}
                <p className="heading-text">{coupen.minimum_amount}</p>
              </div>
              <div>
                {" "}
                <p className="heading-text">{coupen.percentage}%</p>
              </div>
              <div>
                {" "}
                <p className="heading-text">{coupen.instruction}</p>
              </div>
              <div>
                <p className="heading-text">
                  {new Date(coupen.expire_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="heading-text">
                  {coupen.user_count} / {coupen.user_limit}
                </p>
              </div>
              <div>
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const expireDay = coupen.expire_date ? coupen.expire_date.split('T')[0] : '';
                  const limitReached = coupen.user_limit != null && coupen.user_limit > 0 && coupen.user_count >= coupen.user_limit;
                  if (!coupen.isActive) {
                    return <span className="coupen-status inactive">Inactive</span>;
                  } else if (expireDay && expireDay < today) {
                    return <span className="coupen-status expired">Expired</span>;
                  } else if (limitReached) {
                    return <span className="coupen-status limit-reached">Limit Reached</span>;
                  } else {
                    return <span className="coupen-status active">Active</span>;
                  }
                })()}
              </div>
              <div>
                <div className="actions">
                  <button
                    className="coupen-users-btn"
                    onClick={() => { setUsersModal({ open: true, coupenId: coupen.id, coupenTitle: coupen.title }); setUsersPage(1); }}
                  >
                    Users ({coupen.user_count})
                  </button>
                  <img
                    onClick={() => {
                      setShow(true);
                      handleSetValue(
                        {
                          title: coupen.title,
                          minimum_amount: coupen.minimum_amount,
                          expire_date: coupen.expire_date,
                          user_limit: coupen.user_limit,
                          percentage: coupen.percentage,
                        },
                        coupen.id
                      );
                    }}
                    src={editIcon}
                    alt="Edit"
                  />
                  <img onClick={() => handleDelete(coupen.id)} src={deleteIcon} alt="Delete" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          <div className="pagination-dropdown">
            <p>Items Per Page:</p>
            <Form.Select
              aria-label="Default select example"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
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
              <p>{Math.min(page * limit, data.meta.total)}</p>
              <p>of</p>
              <p>{data.meta.total}</p>
            </div>
            <div className="pagination-controls">
              <img
                src={backwardIcon}
                alt="First Page"
                onClick={() => setPage(1)}
                style={{ cursor: "pointer" }}
              />
              <img
                src={backIcon}
                alt="Previous Page"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                style={{ cursor: "pointer" }}
              />
              <img
                src={frontIcon}
                alt="Next Page"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, data.meta.totalPages))
                }
                style={{ cursor: "pointer" }}
              />
              <img
                src={forwardIcon}
                alt="Last Page"
                onClick={() => setPage(data.meta.totalPages)}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>
      <Coupen
        show={show}
        onHide={() => setShow(false)}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={id !== "" ? isUpdateLoading : isCreateLoading}
        id={id}
      />
       <DeleteModal
              show={showDeleteModal}
              onHide={() => setShowDeleteModal(false)}
              des={deleteDes}
              onConfirm={confirmDelete}
              isLoading={isDeleteLoading}
              modal_type="coupen"
            />

      {/* Coupon Users Modal */}
      {usersModal.open && (
        <div className="coupen-users-overlay" onClick={() => setUsersModal({ open: false, coupenId: null, coupenTitle: "" })}>
          <div className="coupen-users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupen-users-modal-header">
              <p className="export-modal-title">Users who used: {usersModal.coupenTitle}</p>
              <button className="coupen-users-close" onClick={() => setUsersModal({ open: false, coupenId: null, coupenTitle: "" })}>✕</button>
            </div>
            <div className="coupen-users-modal-body">
              {isUsersLoading ? (
                <p>Loading...</p>
              ) : !usersData?.data?.length ? (
                <p className="coupen-no-users">No users have used this coupon yet.</p>
              ) : (
                <>
                  <table className="coupen-users-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Amount Paid</th>
                        <th>Discount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.data.map((row, idx) => (
                        <tr key={row.id}>
                          <td>{(usersPage - 1) * 10 + idx + 1}</td>
                          <td>{row.userData?.fullName || "—"}</td>
                          <td>{row.userData?.mobile_number || "—"}</td>
                          <td>₹{row.amount}</td>
                          <td>{row.discount_percentage}% (₹{row.discount_amount})</td>
                          <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersData.meta?.totalPages > 1 && (
                    <div className="coupen-users-pagination">
                      <button disabled={usersPage === 1} onClick={() => setUsersPage((p) => p - 1)}>Prev</button>
                      <span>{usersPage} / {usersData.meta.totalPages}</span>
                      <button disabled={usersPage === usersData.meta.totalPages} onClick={() => setUsersPage((p) => p + 1)}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoupenManagement;
