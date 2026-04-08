import React, { useState, useEffect } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import "./editUser.scss";
import {
  useUserProfileQuery,
  useUpdateUserMutation,
} from "../../../services/user"; // import mutation

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function EditUser({ show, onHide, id }) {
  const { data, isLoading, refetch } = useUserProfileQuery(id);
  useEffect(() => {
    if (show) {
      refetch();
    }
  }, [show, refetch]);
  const user = data?.user;

  const [updateUser, { isLoading: isSubmitting }] = useUpdateUserMutation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile_number: "",
    nationality: "",
    state: "",
  });

  const [isIndian, setIsIndian] = useState(null);
  const toTitleCase = (str) =>
    (str || "").replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

  // Prefill on data load
  useEffect(() => {
    if (show && user) {
      const nameParts = (user.fullName || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      setForm({
        firstName,
        lastName,
        email: user.email || "",
        mobile_number: user.mobile_number || "",
        nationality: user.nationality || "",
        state: toTitleCase(user.state || ""),
      });
      setIsIndian(user.nationality?.toLowerCase() === "indian");
    }
  }, [user, show]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const body = {
        id: user.id,
        ...form,
        nationality: isIndian ? "indian" : "non-indian",
      };
      await updateUser(body).unwrap();
      setForm({});
      onHide();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <Modal className="edit-user" show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <p className="export-modal-title">Edit User Details</p>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="row-class mb-3">
            <Form.Group controlId="formFirstName" className="text-start">
              <Form.Label>First Name:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter first name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formLastName" className="text-start">
              <Form.Label>Last Name:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </Form.Group>
          </div>

          <div className="row-class mb-3">
            <Form.Group controlId="formContact" className="text-start">
              <Form.Label>Contact Number:</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter number"
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="formEmail" className="text-start">
              <Form.Label>Email ID:</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Form.Group>
          </div>

          <Row className="mb-3">
            <Form.Group as={Col} className="text-start">
              <Form.Check
                inline
                label="He is an Indian person."
                name="nationality"
                type="radio"
                checked={isIndian === true}
                onChange={() => setIsIndian(true)}
                className="custom-radio"
              />
            </Form.Group>
            <Form.Group as={Col} className="text-start px-0">
              <Form.Check
                inline
                label="He is a Non-Indian person."
                name="nationality"
                type="radio"
                checked={isIndian === false}
                onChange={() => setIsIndian(false)}
                className="custom-radio"
              />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} sm={12} md={6} lg={6} className="text-start">
              <Form.Select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="mb-3"
                aria-label="State selection"
                disabled={!isIndian}
              >
                <option>Select State</option>
                {indianStates.map((state, idx) => (
                  <option key={idx} value={state}>
                    {state}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Row>

          <div className="excel-modal-btns">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button
              className="green-btn"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default EditUser;
