import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useForceEndSessionMutation } from '../../../services/auth';
import { toast } from 'react-toastify';

function ForceEndModal({ show, handleClose, userId, userName, refetch }) {
  const [reason, setReason] = useState('Admin manual clearing (stuck status)');
  const [forceEnd, { isLoading }] = useForceEndSessionMutation();

  const handleForceEnd = async () => {
    try {
      await forceEnd({
         userId,
         reason 
      }).unwrap();
      
      toast.success(`Force-terminated session for ${userName}`);
      refetch();
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Force end failed");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">Force End Session: {userName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Warning: This will immediately clear the "Busy" status for this user in the database and attempt to end their current session.</p>
        <Form.Group className="mb-3">
          <Form.Label>Audit Reason</Form.Label>
          <Form.Control
            placeholder="Reason for force termination..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Form.Group>
        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={handleForceEnd} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Force Kill Session'}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ForceEndModal;
