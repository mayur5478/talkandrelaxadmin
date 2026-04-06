import React, { useRef } from "react";
import "../user-list/users.scss";
import { useSoftDeletedUsersQuery, useUserDeleteMutation } from "../../../services/user";
import moment from "moment";
import Delete from "../../common/delete/Delete.jsx";
import { useNavigate } from "react-router-dom";
import replyImage from "../../assets/reply.png";
import viewIcon from "../../assets/view.png";
import { useState } from "react";

function SoftDeletedUsers() {
  const { data, isLoading, error, refetch } = useSoftDeletedUsersQuery();
  const [deleteUser, { isLoading: isRestoreLoading }] = useUserDeleteMutation();
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const handleRestoreClick = (user) => {
    setRestoreTarget(user);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    try {
      await deleteUser({ 
        id: restoreTarget.id, 
        status: false, 
        mobile_number: restoreTarget.mobile_number 
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Error restoring user:", err);
    } finally {
      setShowRestoreModal(false);
      setRestoreTarget(null);
    }
  };

  const handleView = (id) => {
    navigate(`/dashboard/user-management/profile-view?id=${id}`);
  };

  return (
    <div className="users-main">
      <div className="top-section">
        <div className="left-section">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Soft Deleted Users & Listeners
          </h2>
        </div>
      </div>
      <div 
        className="table table-container" 
        ref={tableRef}
        style={{ overflowX: 'auto' }}
      >
        <div className="table-headings" style={{ minWidth: '1000px' }}>
          <div style={{ width: '5%' }}><p className="heading-text">Sr. No</p></div>
          <div style={{ width: '20%' }}><p className="heading-text">Full Name</p></div>
          <div style={{ width: '20%' }}><p className="heading-text">Email</p></div>
          <div style={{ width: '15%' }}><p className="heading-text">Contact</p></div>
          <div style={{ width: '10%' }}><p className="heading-text">Role</p></div>
          <div style={{ width: '20%' }}><p className="heading-text">Deleted Date</p></div>
          <div style={{ width: '10%' }}><p className="heading-text">Action</p></div>
        </div>

        {isLoading && <div className="p-4 text-center"><p>Loading soft deleted records...</p></div>}
        {error && <div className="p-4 text-center text-danger"><p>Error: {error.message || "Failed to load data"}</p></div>}
        
        {!isLoading && data?.users?.length === 0 && (
          <div className="p-5 text-center">
            <p className="text-muted">No soft deleted users found.</p>
          </div>
        )}

        {data?.users?.map((user, index) => (
          <div className="table-body" key={user.id} style={{ minWidth: '1000px' }}>
            <div style={{ width: '5%' }}><p className="heading-text">{index + 1}</p></div>
            <div style={{ width: '20%' }}><p className="heading-text fw-bold-name">{user.fullName}</p></div>
            <div style={{ width: '20%' }}><p className="heading-text">{user.email || "N/A"}</p></div>
            <div style={{ width: '15%' }}><p className="heading-text">{user.mobile_number}</p></div>
            <div style={{ width: '10%' }}>
              <p className="heading-text" style={{ textTransform: 'capitalize' }}>{user.role}</p>
            </div>
            <div style={{ width: '20%' }}>
              <p className="heading-text">{moment(user.updatedAt).format("DD/MM/YYYY, hh:mm A")}</p>
            </div>
            <div style={{ width: '10%' }}>
              <div className="actions">
                <img 
                  src={viewIcon} 
                  onClick={() => handleView(user.id)} 
                  alt="View" 
                  title="View Profile" 
                />
                <img 
                  src={replyImage} 
                  onClick={() => handleRestoreClick(user)} 
                  alt="Restore" 
                  title="Restore User" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showRestoreModal && (
        <Delete
          show={showRestoreModal}
          onHide={() => setShowRestoreModal(false)}
          onConfirm={confirmRestore}
          userId={restoreTarget?.id}
          userName={restoreTarget?.fullName}
          isDeleteUserLoading={isRestoreLoading}
          type="restore"
        />
      )}
    </div>
  );
}

export default SoftDeletedUsers;
