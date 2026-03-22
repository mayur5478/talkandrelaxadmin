import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "./coupen.scss";

function Coupen({
  show,
  onHide,
  initialData = {},
  onSubmit,
  isSubmitting,
  id, // if present = edit mode
}) {
  const [title, setTitle] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [userLimit, setUserLimit] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [percentage, setPercentage] = useState("");


  useEffect(() => {
    if (show) {
      if (id && initialData) {
        setTitle(initialData.title || "");
        setExpireDate(initialData.expire_date || "");
        setUserLimit(initialData.user_limit || "");
        setMinimumAmount(initialData.minimum_amount || "");
        setPercentage(initialData.percentage || "");
      } else {
        setTitle("");
        setExpireDate("");
        setUserLimit("");
        setMinimumAmount("");
        setPercentage("");
      }
    }
  }, [show, id, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      title,
      expire_date: expireDate,
      user_limit: userLimit,
      minimum_amount: minimumAmount,
      percentage,
    };

    if (id) payload.id = id;

    onSubmit(payload);
  };

  return (
    <Modal
      className="coupen-modal-main"
      show={show}
      onHide={onHide}
      size="md"
      centered
    >
      <Modal.Header closeButton>
        <p className="export-modal-title">
          {id ? "Edit Gift Plan" : "Create Gift Plan"}
        </p>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="row-class mb-3">
            <Form.Group className="text-start">
              <Form.Label>Title:</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="text-start">
              <Form.Label>Expiry Date:</Form.Label>
              <Form.Control
                type="date"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                required
              />
            </Form.Group>
          </div>

          <div className="row-class mb-3">
            <Form.Group className="text-start">
              <Form.Label>User Limit:</Form.Label>
              <Form.Control
                type="number"
                value={userLimit}
                onChange={(e) => setUserLimit(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="text-start">
              <Form.Label>Minimum Amount:</Form.Label>
              <Form.Control
                type="number"
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(e.target.value)}
                required
              />
            </Form.Group>
          </div>

          <Form.Group className="text-start mb-3">
            <Form.Label>Discount Percentage:</Form.Label>
            <Form.Control
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              required
            />
          </Form.Group>

          <div className="excel-modal-btns mt-3">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button className="green-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default Coupen;
