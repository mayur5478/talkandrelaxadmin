import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import "./editPlan.scss";

function EditPlan({
  show,
  onHide,
  type, // "Recharge" or "Gift"
  initialData = {},
  onSubmit,
  isSubmitting,
  value,
  id
}) {
  const amountKey = type === "Recharge" ? "recharge_amount" : "gift_amount";
  const [amount, setAmount] = useState("");
  const GST_RATE = 0.18;
console.log("value",value);

  useEffect(() => {
    if (show && initialData && initialData[amountKey] !== undefined) {
      setAmount(String(initialData[amountKey]));
    }
  }, [show, initialData, amountKey]);



  const handleSubmit = () => {
    const numericAmount = Number(amount);
    if (amount === "" || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const payload = {
      id: id,
      updates: { [amountKey]: numericAmount },
    };

    onSubmit(payload);
  };

  return (
    <Modal className="edit-plan" show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <p className="export-modal-title">Edit {type} Plan</p>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row-class mb-3">
            <Form.Group  className="text-start">
              <Form.Label>{type} Amount:</Form.Label>
              <Form.Control
                type="number"
                value={amount || value}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter ${type.toLowerCase()} amount`}
                min="0"
                step="0.01"
              />
            </Form.Group>
         
        
            <Form.Group className="text-start">
              <Form.Label>GST (%)</Form.Label>
              <Form.Control type="text" value="18%" disabled />
            </Form.Group>
           
            </div>
          <div className="excel-modal-btns mt-3">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button
              className="green-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default EditPlan;
