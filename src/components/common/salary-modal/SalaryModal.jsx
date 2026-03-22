import React from "react";
import { Button, Modal } from "react-bootstrap";
import salary from "../../assets/salary-pay.png";
import "./salaryModal.scss";

function SalaryModal({
  show,
  onHide,
  onConfirm,
  amount,
  netAmount,
  userName,
  isMutationLoading,
}) {
  console.log("username", userName);

  return (
    <div>
      <Modal
        className="salary-modal"
        show={show}
        onHide={onHide}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <p className="export-modal-title">Accept Request</p>
        </Modal.Header>
        <Modal.Body>
          <img src={salary} alt={salary} />
          <p>
            You Are Attempting To Salary to "{userName}"<br /> amount of “
            {netAmount}”.
          </p>
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

export default SalaryModal;
