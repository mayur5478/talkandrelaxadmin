import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import "./createPlan.scss";

function CreatePlan({
  show,
  onHide,
  type, // "Recharge" or "Gift"
  onSubmit,
  isSubmitting,
}) {
  const amountKey = type === "Recharge" ? "recharge_amount" : "gift_amount";
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setAmount(""); // Reset on open
  }, [show]); // Reset amount when modal is shown

  const handleSubmit = () => {
    const numericAmount = Number(amount);
    if (amount === "" || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const payload = { [amountKey]: numericAmount }; // Payload with numeric value
    onSubmit(payload);
  };

  return (
    <Modal className="create-plan" show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <p className="export-modal-title">
          Create {type} Plan
        </p>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row-class mb-3">
            <Form.Group controlId="formGridAmount" className="text-start">
              <Form.Label>{type} Amount:</Form.Label>
              <Form.Control
                type="number"
                name={amountKey}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter ${type.toLowerCase()} amount`}
                min="0" // Ensure only positive numbers are allowed
                step="0.01" // Allow decimal numbers
              />
            </Form.Group>
            <Form.Group controlId="formGridAmount" className="text-start">
              <Form.Label>Gst(%):</Form.Label>
              <Form.Control disabled
                type="text"
               value="18%"
              />
            </Form.Group>
          </div>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button className="green-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default CreatePlan;