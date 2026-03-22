import React, { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "./commission.scss";
import { useGetMeQuery } from "../../../services/auth";

function Commission({ show, onHide, onSubmit, isSubmitting ,user}) {

  const [callCommission, setCallCommission] = useState("");


  useEffect(() => {
    if (show && user?.user?.charge_ratio !== undefined) {
      setCallCommission(user.user.charge_ratio.toString());
    }
  }, [show, user]);

  const handleSave = () => {
    if (user?.user?.id && callCommission !== "") {
      onSubmit(user.user.id, parseFloat(callCommission));
    }
  };

  return (
    <Modal
      className="commission"
      show={show}
      onHide={onHide}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <p className="export-modal-title">Admin Commission</p>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row-class mb-3">
            <Form.Group controlId="formCallCommission" className="text-start">
              <Form.Label>Commission on Call Service (%):</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={callCommission }
                onChange={(e) => setCallCommission(e.target.value)}
                placeholder="Enter commission %"
              />
            </Form.Group>
            <Form.Group controlId="formVideoCommission" className="text-start">
              <Form.Label>Commission on Video Call Service (%):</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={`${user?.user?.charge_ratio ?? 0} %`}
              />
            </Form.Group>
          </div>
          <div className="row-class mb-3">
            <Form.Group controlId="formChatCommission" className="text-start">
              <Form.Label>Commission on Chat Service (%):</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={`${user?.user?.charge_ratio ?? 0} %`}
              />
            </Form.Group>
            <Form.Group controlId="formGiftCommission" className="text-start">
              <Form.Label>Commission on Gift (%):</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={`${user?.user?.charge_ratio ?? 0} %`}
              />
            </Form.Group>
          </div>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button
              className="green-btn"
              onClick={handleSave}
              disabled={isSubmitting || !callCommission}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default Commission;
