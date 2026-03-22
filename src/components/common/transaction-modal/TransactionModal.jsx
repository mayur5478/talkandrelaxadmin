import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

function TransactionModal({ show, onClose, onSave, id }) {
  const [type, setType] = useState("debit");
  const [amount, setAmount] = useState(null);

  const handleSave = () => {
    if (!amount || amount <= 0) return;
    onSave({ type, amount: Number(amount) });
    setAmount(null);
    setType("debit");
    onClose();
  };

  return (
    <Modal
      className="transaction-modal"
      show={show}
      onHide={onClose}
      size="md"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>New Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3 text-start">
            <Form.Label>Type</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option selected value="debit">Debit</option>
              <option value="credit">Credit</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="text-start">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!amount || amount <= 0}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TransactionModal;
