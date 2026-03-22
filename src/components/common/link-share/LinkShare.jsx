import React from "react";
import "./linkShare.scss";
import { Button, Modal } from "react-bootstrap";
import link from "../../assets/link.png";
function LinkShare({ show, onHide, onConfirm, userId, userName ,isMutationLoading}) {
  console.log("userId", userName);
  console.log("userId", userName);
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
          <p className="export-modal-title">Share Form Link</p>
        </Modal.Header>
        <Modal.Body>
          <img src={link} alt={link} />
          <p>
            Are you attempting to send the link to "{userName}" through your
            system?
          </p>

          <p className="dark-text">Are you sure?</p>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>
              No
            </Button>
            <Button className="green-btn" onClick={onConfirm}>
             {
              isMutationLoading ? "wait..." : "yes"
             } 
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default LinkShare;
