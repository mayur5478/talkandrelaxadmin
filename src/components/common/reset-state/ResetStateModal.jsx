import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useResetUserStateMutation } from '../../../services/auth';
import Swal from 'sweetalert2';

function ResetStateModal({ show, handleClose, userId, userName, refetch }) {
  const [resetState, { isLoading }] = useResetUserStateMutation();

  const handleReset = async () => {
    try {
      await resetState(userId).unwrap();
      
      Swal.fire("Success", `Reset stuck status flags for ${userName}. They are now free to start sessions.`, "success");
      refetch();
      handleClose();
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Reset failed", "error");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-primary">Reset User State: {userName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>This action will manually clear all "Stuck" flags for this user, including:</p>
        <ul>
          <li><strong>Is Online</strong> flag</li>
          <li><strong>Is Session Running</strong> flag</li>
          <li><strong>Stuck Socket</strong> entries</li>
        </ul>
        <p className="text-muted small">Use this if the user is stuck in a "Busy" or "Call in progress" state but has no actual active call.</p>
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleReset} disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Now'}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ResetStateModal;
