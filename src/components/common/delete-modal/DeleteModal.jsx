import React from "react";
import { Button, Modal } from "react-bootstrap";
import alertIcon from "../../assets/alert.png";
import "../account-freeze/accountFreeze.scss";

function DeleteModal({ show, onHide, onConfirm, des, isDeleteUserLoading ,modal_type}) {
  return (
    <div className="account-freeze-modal">
      <Modal
        show={show}
        onHide={onHide}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <p className="export-modal-title">{` Delete ${modal_type === "coupen" ? "Coupen" : "Plan" }`}</p>
        </Modal.Header>
        <Modal.Body>
          <img src={alertIcon} alt={alertIcon} />
          <p>{des}</p>
          <p className="dark-text">Are you sure?</p>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>
              No
            </Button>
            <Button className="green-btn" onClick={onConfirm}>
              {isDeleteUserLoading ? "wait..." : "Yes"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default DeleteModal;
