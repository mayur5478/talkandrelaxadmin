import React from "react";
import { Button, Modal } from "react-bootstrap";
import right from "../../assets/modal-right.png";
import "./highlight.scss";

function Highlight({ show, onHide, onConfirm, des, isMutationLoading }) {
  return (
    <div>
      <Modal  className="highlight-plan-modal"
        show={show}
        onHide={onHide}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <p className="export-modal-title">Highlight Plan</p>
        </Modal.Header>
        <Modal.Body>
          <img src={right} alt={right} />
          <p>{des}</p>
          <p className="dark-text">Are you sure?</p>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>
              No
            </Button>
            <Button className="green-btn" onClick={onConfirm}>
              {isMutationLoading ? "wait..." : "Yes"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Highlight;
