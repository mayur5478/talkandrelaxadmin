import React, { useState, useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "./commission.scss";
import { useGetMeQuery } from "../../../services/auth";

function Commission({
  show,
  onHide,
  onSubmit,
  onSubmitGift,
  isSubmitting,
  isSubmittingGift,
  user,
}) {

  const [callCommission, setCallCommission] = useState("");
  const [giftCommission, setGiftCommission] = useState("");


  useEffect(() => {
    if (show && user?.user) {
      if (user.user.charge_ratio !== undefined && user.user.charge_ratio !== null) {
        setCallCommission(user.user.charge_ratio.toString());
      }
      // Gift falls back to charge_ratio when its own field hasn't been set yet.
      const giftSource = user.user.gift_charge_ratio ?? user.user.charge_ratio;
      if (giftSource !== undefined && giftSource !== null) {
        setGiftCommission(giftSource.toString());
      }
    }
  }, [show, user]);

  const handleSave = async () => {
    const id = user?.user?.id;
    if (!id) return;
    const tasks = [];
    const callNum = parseFloat(callCommission);
    if (
      callCommission !== "" &&
      !Number.isNaN(callNum) &&
      callNum !== Number(user.user.charge_ratio)
    ) {
      tasks.push(onSubmit(id, callNum));
    }
    const giftNum = parseFloat(giftCommission);
    if (
      giftCommission !== "" &&
      !Number.isNaN(giftNum) &&
      giftNum !== Number(user.user.gift_charge_ratio)
    ) {
      // onSubmitGift is optional for backwards compat with older callers.
      if (typeof onSubmitGift === "function") {
        tasks.push(onSubmitGift(id, giftNum));
      }
    }
    await Promise.all(tasks);
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
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={giftCommission}
                onChange={(e) => setGiftCommission(e.target.value)}
                placeholder="Enter gift commission %"
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
              disabled={
                isSubmitting ||
                isSubmittingGift ||
                (!callCommission && !giftCommission)
              }
            >
              {(isSubmitting || isSubmittingGift) ? "Saving..." : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default Commission;
