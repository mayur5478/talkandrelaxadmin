import React, { useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import "./resetPlan.scss";

function ResetPassword({
  show,
  close,
  onHide,
  onSubmit,
  isSubmitting,
  FormError,
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (FormError) {
      setError("Password not change");
    }
    setError("");
    onSubmit(newPassword, oldPassword);
    close(false);
  };

  return (
    <Modal
      className="reset-password"
      show={show}
      onHide={onHide}
      size="sm"
      centered
    >
      <Modal.Header closeButton>
        <p className="export-modal-title">Reset Password</p>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="mb-3">
            <Form.Group as={Col} className="mb-3 text-start">
              <Form.Label>Old Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </Form.Group>

            <Form.Group as={Col} className="mb-3 text-start">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>

            <Form.Group as={Col} className="mb-3 text-start">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Form.Group>
          </Row>
          {error && (
            <p style={{ color: "red", fontSize: "14px", marginTop: "-10px" }}>
              {error}
            </p>
          )}

          <div className="reset-modal-btns mt-3 d-flex justify-content-end gap-2">
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

export default ResetPassword;
