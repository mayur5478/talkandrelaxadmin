import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useCreateSessionMutation } from "../../../services/listener";
import {
  useLazySearchListenersQuery,
  useLazySearchUsersQuery,
} from "../../../services/auth";
import AsyncSelect from "react-select/async";
import "./createSession.scss";

function CreateSession({ show, handleClose }) {
  const [formData, setFormData] = useState({
    user_id: "",
    listener_id: "",
    type: "",
    start_time: "",
    end_time: "",
    total_duration: "",
    amount_deducted: "",
    listener_credit: "",
    admin_credit: "",
  });

  const [errors, setErrors] = useState({});
  const [createSession, { isLoading, isSuccess, isError, error }] =
    useCreateSessionMutation();

  const [triggerSearchUsers] = useLazySearchUsersQuery();
  const [triggerSearchListeners] = useLazySearchListenersQuery();

  // set selected value (id)
  const handleSelectChange = (name, selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // load users async
  const loadUserOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const res = await triggerSearchUsers(inputValue).unwrap();
      return res.data.map((u) => ({
        value: u.id,
        label: u.fullName,
      }));
    } catch (err) {
      console.error("Error fetching users:", err);
      return [];
    }
  };

  // load listeners async
  const loadListenerOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const res = await triggerSearchListeners(inputValue).unwrap();
      return res.data.map((l) => ({
        value: l.id,
        label: l.fullName,
      }));
    } catch (err) {
      console.error("Error fetching listeners:", err);
      return [];
    }
  };

  // validate fields
  const validate = () => {
    const newErrors = {};

    if (!formData.user_id) newErrors.user_id = "User is required.";
    if (!formData.listener_id) newErrors.listener_id = "Listener is required.";
    if (!formData.type) newErrors.type = "Session type is required.";
    if (!formData.start_time) newErrors.start_time = "Start time is required.";
    if (!formData.end_time) newErrors.end_time = "End time is required.";

    if (formData.start_time && formData.end_time) {
      if (new Date(formData.end_time) <= new Date(formData.start_time)) {
        newErrors.end_time = "End time must be after start time.";
      }
    }

    if (!formData.total_duration) {
      newErrors.total_duration = "Total duration is required.";
    } else if (formData.total_duration <= 0) {
      newErrors.total_duration = "Duration must be greater than 0.";
    }

    if (!formData.amount_deducted) {
      newErrors.amount_deducted = "Amount deducted is required.";
    } else if (formData.amount_deducted < 0) {
      newErrors.amount_deducted = "Amount cannot be negative.";
    }

    if (!formData.listener_credit) {
      newErrors.listener_credit = "Listener credit is required.";
    } else if (formData.listener_credit < 0) {
      newErrors.listener_credit = "Listener credit cannot be negative.";
    }

    if (!formData.admin_credit) {
      newErrors.admin_credit = "Admin credit is required.";
    } else if (formData.admin_credit < 0) {
      newErrors.admin_credit = "Admin credit cannot be negative.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createSession(formData).unwrap();
      alert("✅ Session created successfully!");
      setFormData({
        user_id: "",
        listener_id: "",
        type: "",
        start_time: "",
        end_time: "",
        total_duration: "",
        amount_deducted: "",
        listener_credit: "",
        admin_credit: "",
      });
      setErrors({});
      handleClose();
    } catch (err) {
      console.error("Error:", err);
      alert("❌ Failed to create session");
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="md"
      className="create-session"
    >
      <Modal.Header closeButton>
        <Modal.Title>Create Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 text-start">
                <Form.Label>User</Form.Label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={loadUserOptions}
                  onChange={(option) => handleSelectChange("user_id", option)}
                  placeholder="Search User..."
                />
                {errors.user_id && (
                  <div className="text-danger small">{errors.user_id}</div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3 text-start">
                <Form.Label>Listener</Form.Label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={loadListenerOptions}
                  onChange={(option) =>
                    handleSelectChange("listener_id", option)
                  }
                  placeholder="Search Listener..."
                />
                {errors.listener_id && (
                  <div className="text-danger small">{errors.listener_id}</div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 text-start">
                <Form.Label>Session Type</Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  isInvalid={!!errors.type}
                >
                  <option value="">-- Select Type --</option>
                  <option value="chat">Chat</option>
                  <option value="call">Audio Call</option>
                  <option value="video">Video Call</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.type}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3 text-start">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  isInvalid={!!errors.start_time}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.start_time}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3 text-start">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  isInvalid={!!errors.end_time}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.end_time}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="number"
                  step="0.1"
                  name="total_duration"
                  placeholder="Total Duration (minutes)"
                  value={formData.total_duration}
                  onChange={handleChange}
                  isInvalid={!!errors.total_duration}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.total_duration}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amount_deducted"
                  placeholder="Amount Deducted"
                  value={formData.amount_deducted}
                  onChange={handleChange}
                  isInvalid={!!errors.amount_deducted}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.amount_deducted}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="number"
                  step="0.01"
                  name="listener_credit"
                  placeholder="Listener Credit"
                  value={formData.listener_credit}
                  onChange={handleChange}
                  isInvalid={!!errors.listener_credit}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.listener_credit}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="number"
                  step="0.01"
                  name="admin_credit"
                  placeholder="Admin Credit"
                  value={formData.admin_credit}
                  onChange={handleChange}
                  isInvalid={!!errors.admin_credit}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.admin_credit}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <div className="buttons">
            <Button
              className="profile-btn"
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </Form>
      </Modal.Body>

      {isSuccess && (
        <p className="text-success text-center mt-2">
          Session created successfully!
        </p>
      )}
      {isError && (
        <p className="text-danger text-center mt-2">
          Error: {error?.data?.message || "Failed"}
        </p>
      )}
    </Modal>
  );
}

export default CreateSession;
