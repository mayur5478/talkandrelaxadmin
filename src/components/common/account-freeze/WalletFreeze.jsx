import React from "react";
import { Button, Modal } from "react-bootstrap";
import alertIcon from "../../assets/alert.png";
import "./accountFreeze.scss";

function WalletFreeze({ show, onHide, onConfirm, userId ,userName,isWalletFreezeLoading}) {
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
          <p className="export-modal-title">Wallete Freeze</p>
        </Modal.Header>
        <Modal.Body>
          <img src={alertIcon} alt={alertIcon} />
          <p>You Are Attempting To Freeze User "{userName}" Wallet to your system?</p>
          <p className="dark-text">Are you sure?</p>
          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>No</Button>
            <Button className="green-btn" onClick={onConfirm}>{isWalletFreezeLoading ? "wait..." : "Yes"}</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default WalletFreeze;