import React from "react";
import { Button, Col, Row, Form } from "react-bootstrap"; // Use Form from react-bootstrap

function Policy() {
  return (
    <div>
      <Form>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridTitle">
            <Form.Label>Policy Break Penalty:</Form.Label>
            <Form.Control value="1" type="number" placeholder="Enter Missed Session Penalty" disabled />
          </Form.Group>

          <Form.Group as={Col} controlId="formGridDetails">
            <Form.Label>Penalty per Policy Break Amount (Rs.):</Form.Label>
            <Form.Control value="6000"
              type="number"
              placeholder="Enter Penalty per Leave Amount (Rs.):"
           disabled
            />
          </Form.Group>
        </Row>

        <div className="submit">
          <Button>Save</Button>
        </div>
      </Form>
    </div>
  );
}

export default Policy;
