import React from "react";
import { Button, Col, Row, Form } from "react-bootstrap"; // Use Form from react-bootstrap

function MissedSession() {
  return (
    <div>
      <Form>
        <Row className="mb-3">
          <Form.Group as={Col} controlId="formGridTitle">
            <Form.Label>Missed Session Penalty:</Form.Label>
            <Form.Control type="number" value="3" placeholder="Enter Missed Session Penalty" disabled/>
          </Form.Group>

          <Form.Group as={Col} controlId="formGridDetails">
            <Form.Label>Penalty per Leave Amount (Rs.):</Form.Label>
            <Form.Control
            value="150"
              type="number"
              placeholder="Enter Penalty per Leave Amount (Rs.):"
           disabled />
          </Form.Group>
        </Row>

        <div className="submit">
          <Button>Save</Button>
        </div>
      </Form>
    </div>
  );
}

export default MissedSession;
