import React, { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useEditSalaryMutation,
  useGetSinglePayoutQuery,
} from "../../../../services/listener";
import "./editSalary.scss";

function EditSalary() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetSinglePayoutQuery(id);
  const [editSalary, { isLoading: isUpdating }] = useEditSalaryMutation();

  const [charges, setCharges] = useState({
    voice_charge: 6,
    chat_charge: 6,
    video_charge: 15,
  });
  useEffect(() => {
    if (data?.listener) {
      setCharges({
        voice_charge: data.listener.voice_charge ?? 6,
        chat_charge: data.listener.chat_charge ?? 6,
        video_charge: data.listener.video_charge ?? 15,
      });
    }
  }, [data]);
  const [formData, setFormData] = useState({
    call_time: "",
    call_amount: "",
    v_call_time: "",
    v_call_amount: "",
    chat_time: "",
    chat_amount: "",
    gift_amount: "",
    tax: "",
    tax_amount: "",
    violation_penalty: "",
    missed_session_penalty: "",
    leave_penalty: "",
    payout_amount: "",
    net_payout_amount: "",
  });

  // Helper to safely parse numbers and handle "Infinity" or other invalid values
  const safeParseNum = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "string" && value.toLowerCase() === "infinity")
      return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    if (data?.data) {
      // Replace "Infinity" strings with 0 for time fields to avoid calculation issues
      const normalizedData = {
        ...data.data,
        v_call_time:
          data.data.v_call_time &&
          data.data.v_call_time.toString().toLowerCase() === "infinity"
            ? "0"
            : data.data.v_call_time,
        chat_time:
          data.data.chat_time &&
          data.data.chat_time.toString().toLowerCase() === "infinity"
            ? "0"
            : data.data.chat_time,
        call_time:
          data.data.call_time &&
          data.data.call_time.toString().toLowerCase() === "infinity"
            ? "0"
            : data.data.call_time,
      };

      setFormData((prev) => ({
        ...prev,
        ...normalizedData,
      }));

      const listener = data.data.listener;
      if (listener) {
        setCharges({
          voice_charge: safeParseNum(listener.voice_charge),
          chat_charge: safeParseNum(listener.chat_charge),
          video_charge: safeParseNum(listener.video_charge),
        });
      }
    }
  }, [data]);

  const recalculateFields = (updatedData) => {
    const {
      call_time,
      v_call_time,
      chat_time,
      call_amount,
      v_call_amount,
      chat_amount,
      gift_amount,
      tax,
      missed_session_penalty,
      leave_penalty,
      violation_penalty,
      net_payout_amount,
    } = updatedData;

    let newData = { ...updatedData };

    // Recalculate Amounts from Times or vice versa

    // Call time & amount
    if (updatedData.call_time !== formData.call_time) {
      newData.call_amount = (
        safeParseNum(call_time) * charges.voice_charge
      ).toFixed(2);
    } else if (updatedData.call_amount !== formData.call_amount) {
      newData.call_time = (
        safeParseNum(call_amount) / charges.voice_charge
      ).toFixed(2);
    }

    // Video call time & amount
    if (updatedData.v_call_time !== formData.v_call_time) {
      newData.v_call_amount = (
        safeParseNum(v_call_time) * charges.video_charge
      ).toFixed(2);
    } else if (updatedData.v_call_amount !== formData.v_call_amount) {
      newData.v_call_time = (
        safeParseNum(v_call_amount) / charges.video_charge
      ).toFixed(2);
    }

    // Chat time & amount
    if (updatedData.chat_time !== formData.chat_time) {
      newData.chat_amount = (
        safeParseNum(chat_time) * charges.chat_charge
      ).toFixed(2);
    } else if (updatedData.chat_amount !== formData.chat_amount) {
      newData.chat_time = (
        safeParseNum(chat_amount) / charges.chat_charge
      ).toFixed(2);
    }

    // Calculate payout before tax and penalty
    const payout =
      safeParseNum(newData.call_amount) +
      safeParseNum(newData.v_call_amount) +
      safeParseNum(newData.chat_amount) +
      safeParseNum(gift_amount);
    console.log("net_pay", safeParseNum(net_payout_amount));
    const totalPenalty =
      safeParseNum(missed_session_penalty) +
      safeParseNum(leave_penalty) +
      safeParseNum(violation_penalty);
    const tax_amount =
      ((safeParseNum(payout) - safeParseNum(totalPenalty)) *
        safeParseNum(tax)) /
      100;

 const net = payout - tax_amount - totalPenalty;
 console.log("net",net);
 console.log("previous",data?.data?.previous_salary);
 
const finalAmount = net + (parseFloat(data?.data?.previous_salary) || 0);
console.log("finalAmount",finalAmount);

newData.tax_amount = Math.abs(tax_amount).toFixed(2);
newData.payout_amount = payout.toFixed(2);
newData.net_payout_amount = finalAmount.toFixed(2);


    return newData;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent negative values if needed
    if (parseFloat(value) < 0) return;

    const updated = { ...formData, [name]: value };
    setFormData(recalculateFields(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await editSalary({ id, updates: formData }).unwrap();
      refetch();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };
  console.log("formdata", formData);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <span className="visually-hidden">Loading salary data...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-danger">Failed to load salary data.</p>;
  }

  return (
    <div className="edit-salary-main">
      <div className="salary-detail-sec">
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Call Time (min)</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="call_time"
                value={formData.call_time}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Call Amount</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="call_amount"
                value={formData.call_amount}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Video Call Time (min)</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="v_call_time"
                value={formData.v_call_time}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Video Call Amount</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="v_call_amount"
                value={formData.v_call_amount}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Chat Time (min)</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="chat_time"
                value={formData.chat_time}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Chat Amount</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="chat_amount"
                value={formData.chat_amount}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Gift Amount</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="gift_amount"
                value={formData.gift_amount}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Tax (%)</Form.Label>
              <Form.Control
                disabled
                type="number"
                step="any"
                min="0"
                name="tax"
                value={formData.tax}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Tax Amount</Form.Label>
              <Form.Control
                type="number"
                step="any"
                name="tax_amount"
                value={formData.tax_amount}
                disabled
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Missed Session Penalty</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="missed_session_penalty"
                value={formData.missed_session_penalty}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Leave Penalty</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="leave_penalty"
                value={formData.leave_penalty}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Violation Penalty</Form.Label>
              <Form.Control
                type="number"
                step="any"
                min="0"
                name="violation_penalty"
                value={formData.violation_penalty}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Total Payout</Form.Label>
              <Form.Control
                type="number"
                step="any"
                name="payout_amount"
                value={formData.payout_amount}
                disabled
              />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Net Payout</Form.Label>
              <Form.Control
                type="number"
                step="any"
                name="net_payout_amount"
                value={formData.net_payout_amount}
                disabled
              />
            </Form.Group>
          </Row>

          <div className="buttons mt-3">
            <Button type="submit" className="profile-btn" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="profile-btn ms-2"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default EditSalary;
