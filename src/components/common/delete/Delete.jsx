import React from "react";
import { Button, Modal } from "react-bootstrap";
import alertIcon from "../../assets/alert.png";
import "../account-freeze/accountFreeze.scss";

function Delete({ show, onHide, onConfirm, userId ,userName,isDeleteUserLoading,type}) {
  console.log("username",userName);
  
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
          <p className="export-modal-title">{type === "restore" ? "Restore Account" : `Delete ${type}`}</p>
        </Modal.Header>
        <Modal.Body>
          <img src={alertIcon} alt="alert" />
          <p>You Are Attempting To {type === "restore" ? "Restore" : "Delete"} {type !== "restore" ? type : ""} "{userName}" in your system?</p>
          <p className="dark-text">Are you sure?</p>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>No</Button>
            <Button className="green-btn" onClick={onConfirm} disabled={isDeleteUserLoading}>
              {isDeleteUserLoading ? "Please wait..." : "Yes"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Delete;