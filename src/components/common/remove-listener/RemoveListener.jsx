import React from 'react'
import "../export-modal/ExportExcel"
import eraser from "../../assets/eraser-modal.png";
import { Button, Modal } from 'react-bootstrap'
function RemoveListener(props) {
  return (
    <div className="excel-modal">
         <Modal
        {...props}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <p className="export-modal-title">Export Users List</p>
        </Modal.Header>
        <Modal.Body>
          <img src={eraser} alt={eraser} />
          <p>Are you sure export your all users data in Excel Format?</p>
          <p className="dark-text">Are you sure?</p>
          <div className="excel-modal-btns"> 
            <Button className="red-btn">No</Button>
            <Button className="green-btn">Yes</Button>                     
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default RemoveListener