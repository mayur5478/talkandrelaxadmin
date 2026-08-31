import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "../coupen/coupen.scss";

function SendNotification({ show, onHide, onSubmit, isSubmitting }) {
  const [broadcast, setBroadcast] = useState(false);
  const [listenerId, setListenerId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  useEffect(() => {
    if (show) {
      setBroadcast(false);
      setListenerId("");
      setTitle("");
      setBody("");
      setConfirmBroadcast(false);
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (broadcast) {
      onSubmit({ broadcast: true, title: title.trim(), body: body.trim() });
    } else {
      onSubmit({ listenerId: listenerId.trim(), title: title.trim(), body: body.trim() });
    }
  };

  const canSubmit = broadcast
    ? title.trim() && body.trim() && confirmBroadcast
    : listenerId.trim() && title.trim() && body.trim();

  return (
    <Modal
      className="coupen-modal-main"
      show={show}
      onHide={onHide}
      size="md"
      centered
    >
      <Modal.Header closeButton>
        <p className="export-modal-title">Send a notification</p>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="text-start mb-3">
            <Form.Check
              type="switch"
              id="broadcast-switch"
              label="Broadcast to every listener"
              checked={broadcast}
              onChange={(e) => {
                setBroadcast(e.target.checked);
                setConfirmBroadcast(false);
              }}
            />
          </Form.Group>

          {!broadcast && (
            <Form.Group className="text-start mb-3">
              <Form.Label>Listener ID:</Form.Label>
              <Form.Control
                type="text"
                value={listenerId}
                onChange={(e) => setListenerId(e.target.value)}
                placeholder="Paste the listener's id"
                required
              />
            </Form.Group>
          )}

          <Form.Group className="text-start mb-3">
            <Form.Label>Title:</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maintenance tonight"
              required
            />
          </Form.Group>

          <Form.Group className="text-start mb-3">
            <Form.Label>Message:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. The app will be briefly unavailable at 2am."
              required
            />
          </Form.Group>

          {broadcast && (
            <Form.Group className="text-start mb-3">
              <Form.Check
                type="checkbox"
                id="confirm-broadcast"
                label="I understand this sends to every listener account"
                checked={confirmBroadcast}
                onChange={(e) => setConfirmBroadcast(e.target.checked)}
              />
            </Form.Group>
          )}

          <div className="excel-modal-btns mt-3">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button className="green-btn" type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? "Sending..." : broadcast ? "Broadcast" : "Send"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default SendNotification;
