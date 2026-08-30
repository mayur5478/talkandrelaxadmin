import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "../coupen/coupen.scss";

function BlockMobile({ show, onHide, onSubmit, isSubmitting }) {
  const [mobile, setMobile] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (show) {
      setMobile("");
      setReason("");
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ mobile: mobile.trim(), reason: reason.trim() || undefined });
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
        <p className="export-modal-title">Block a mobile number</p>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="text-start mb-3">
            <Form.Label>Mobile number:</Form.Label>
            <Form.Control
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 9891095576"
              required
            />
          </Form.Group>

          <Form.Group className="text-start mb-3">
            <Form.Label>Reason (optional):</Form.Label>
            <Form.Control
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. signup bonus farming"
            />
          </Form.Group>

          <p className="dark-text" style={{ fontSize: 13 }}>
            This rejects future registration/login for this number AND
            immediately freezes and disconnects any existing account already
            using it.
          </p>

          <div className="excel-modal-btns mt-3">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button className="green-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Blocking..." : "Block number"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default BlockMobile;
