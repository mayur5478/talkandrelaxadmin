import React, { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useRejectRequestMutation } from '../../../services/listener'; // Import your mutation hook
import "./rejectionModal.scss";

function RejectionModal(props) {
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalText, setAdditionalText] = useState("");

  // Hook to call the reject request API
  const [rejectRequest,{isLoading}] = useRejectRequestMutation();

  // Handle Reject button click
  const handleReject = async () => {
    if (!selectedReason) {
      alert("Please select a reason.");
      return;
    }

    try {
      // Trigger the API call with the userId, selected reason, and additional text
      await rejectRequest({
        userId: props.rejectedUser, // Assuming you're passing the userId as a prop
        reason: selectedReason,
        text: additionalText,
      });
      props.refetch();
      // Optionally close the modal or show success message
      props.onHide();
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  return (
    <div>
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Why You Reject Application
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {["radio"].map((type) => (
              <div key={`default-${type}`} className="mb-3">
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="The vacancy is frozen at the moment. Please try again after a few days"
                  name="group1"
                  id={`default-${type}-1`}
                  onChange={() => setSelectedReason("The vacancy is frozen at the moment. Please try again after a few days")}
                />
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="The hiring process has been delayed due to unforeseen circumstances."
                  name="group1"
                  id={`default-${type}-2`}
                  onChange={() => setSelectedReason("The hiring process has been delayed due to unforeseen circumstances.")}
                />
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="Your profile does not match our designation."
                  name="group1"
                  id={`default-${type}-3`}
                  onChange={() => setSelectedReason("Your profile does not match our designation.")}
                />
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="The role has been put on hold temporarily due to internal restructuring."
                  name="group1"
                  id={`default-${type}-4`}
                  onChange={() => setSelectedReason("The role has been put on hold temporarily due to internal restructuring.")}
                />
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="The recruitment timeline has shifted, and we will provide updates as they become available."
                  name="group1"
                  id={`default-${type}-5`}
                  onChange={() => setSelectedReason("The recruitment timeline has shifted, and we will provide updates as they become available.")}
                />
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="We are keeping your application on hold and will get back to you soon."
                  name="group1"
                  id={`default-${type}-6`}
                  onChange={() => setSelectedReason("We are keeping your application on hold and will get back to you soon.")}
                />
                <Form.Check
                  className="mb-3"
                  type={type}
                  label="Additional Reason"
                  name="group1"
                  id={`default-${type}-7`}
                  onChange={() => setSelectedReason("Additional Reason")}
                />
              </div>
            ))}
            <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
              <Form.Control
                as="textarea"
                placeholder="Text here..."
                rows={5}
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Cancel</Button>
          <Button onClick={handleReject}>{isLoading ? "wait..." : "Reject"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RejectionModal;
