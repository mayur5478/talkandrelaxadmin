import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "./editCharge.scss";

function EditCharge({
  show,
  onHide,
  initialData = {},
  onSubmit,
  isSubmitting,
  id,
}) {
  const [chatCharge, setChatCharge] = useState("");
  const [callCharge, setCallCharge] = useState("");
  const [videoCharge, setVideoCharge] = useState("");

  useEffect(() => {
    if (initialData) {
      setChatCharge(initialData.chat_charge);
      setCallCharge(initialData.call_charge);
      setVideoCharge(initialData.video_charge);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = {
      chat_charge: chatCharge,
      voice_charge: callCharge,
      video_charge: videoCharge,
    };
    onSubmit({ id, updates });
  };

  return (
    <Modal className="edit-charge" show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <p className="export-modal-title">Edit Charges</p>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="row-class mb-3">
            <Form.Group className="text-start">
              <Form.Label>Listener Name:</Form.Label>
              <Form.Control type="text" value={initialData.listener_name || ""} disabled />
            </Form.Group>

            <Form.Group className="text-start">
              <Form.Label>Call Charge</Form.Label>
              <Form.Control
                type="text"
                value={callCharge}
                onChange={(e) => setCallCharge(e.target.value)}
              />
            </Form.Group>
          </div>
          <div className="row-class mb-3">
            <Form.Group className="text-start">
              <Form.Label>Chat Charge:</Form.Label>
              <Form.Control
                type="text"
                value={chatCharge}
                onChange={(e) => setChatCharge(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="text-start">
              <Form.Label>Video Call Charge:</Form.Label>
              <Form.Control
                type="text"
                value={videoCharge}
                onChange={(e) => setVideoCharge(e.target.value)}
              />
            </Form.Group>
          </div>
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

export default EditCharge;