import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAdjustWalletMutation } from '../../../services/auth';
import { toast } from 'react-toastify';

function AdjustWalletModal({ show, handleClose, userId, userName, refetch }) {
  const [adjustment, setAdjustment] = useState({
    amount: '',
    type: 'credit',
    reason: ''
  });
  const [adjustWallet, { isLoading }] = useAdjustWalletMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adjustment.amount || !adjustment.reason) {
      toast.error("Please provide amount and reason");
      return;
    }

    try {
      await adjustWallet({
        userId,
        amount: adjustment.amount,
        type: adjustment.type,
        reason: adjustment.reason
      }).unwrap();
      
      toast.success(`Successfully ${adjustment.type}ed wallet`);
      refetch();
      handleClose();
      setAdjustment({ amount: '', type: 'credit', reason: '' });
    } catch (err) {
      toast.error(err?.data?.message || "Adjustment failed");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Adjust Wallet: {userName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Adjustment Type</Form.Label>
            <Form.Select 
              value={adjustment.type} 
              onChange={(e) => setAdjustment({...adjustment, type: e.target.value})}
            >
              <option value="credit">Add Balance (Credit)</option>
              <option value="debit">Deduct Balance (Debit)</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount (₹)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              value={adjustment.amount}
              onChange={(e) => setAdjustment({...adjustment, amount: e.target.value})}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Mandatory audit reason..."
              value={adjustment.reason}
              onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Apply Adjustment'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default AdjustWalletModal;
