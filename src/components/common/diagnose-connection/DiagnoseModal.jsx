import React, { useState } from "react";
import { Modal, Button, Form, Badge, Spinner } from "react-bootstrap";
import { useLazyDiagnoseConnectionQuery } from "../../../services/auth";
import { useResetUserStateMutation } from "../../../services/auth";
import Swal from "sweetalert2";

function DiagnoseModal({ show, onHide }) {
  const [userId, setUserId] = useState("");
  const [listenerId, setListenerId] = useState("");
  const [trigger, { data, isFetching, error }] = useLazyDiagnoseConnectionQuery();
  const [resetState, { isLoading: isResetting }] = useResetUserStateMutation();

  const handleDiagnose = () => {
    if (!userId.trim() || !listenerId.trim()) return;
    trigger({ userId: userId.trim(), listenerId: listenerId.trim() });
  };

  const handleReset = async (id, name) => {
    try {
      await resetState(id).unwrap();
      Swal.fire("Done", `Reset stuck state for ${name}`, "success");
      handleDiagnose(); // re-run diagnosis
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Reset failed", "error");
    }
  };

  const issues = data?.issues || [];
  const info = data?.info || {};
  const canConnect = data?.canConnect;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Diagnose Connection Issue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex gap-2 mb-3">
          <Form.Control
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Form.Control
            placeholder="Listener ID"
            value={listenerId}
            onChange={(e) => setListenerId(e.target.value)}
          />
          <Button onClick={handleDiagnose} disabled={isFetching}>
            {isFetching ? <Spinner size="sm" /> : "Diagnose"}
          </Button>
        </div>

        {error && <div className="alert alert-danger">Failed to run diagnosis: {error?.data?.message || "Server error"}</div>}

        {data && (
          <>
            <div className={`alert ${canConnect ? "alert-success" : "alert-danger"} mb-3`}>
              {canConnect ? "No issues found — they should be able to connect." : `${issues.length} issue(s) blocking connection:`}
            </div>

            {!canConnect && (
              <ul className="mb-3">
                {issues.map((issue, i) => (
                  <li key={i} className="text-danger fw-semibold">{issue}</li>
                ))}
              </ul>
            )}

            <div className="row g-3">
              {info.user && (
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="mb-2">User: {info.user.name}</h6>
                    <div><Badge bg={info.user.is_online ? "success" : "secondary"}>Online: {String(info.user.is_online)}</Badge>{" "}
                    <Badge bg={info.user.is_session_running ? "warning" : "secondary"} text="dark">Session Running: {String(info.user.is_session_running)}</Badge>{" "}
                    {info.user.account_freeze && <Badge bg="danger">FROZEN</Badge>}</div>
                    {(info.user.is_session_running || info.user.account_freeze) && (
                      <Button size="sm" variant="outline-warning" className="mt-2" onClick={() => handleReset(userId, info.user.name)} disabled={isResetting}>
                        Reset State
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {info.listener && (
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="mb-2">Listener: {info.listener.name}</h6>
                    <div>
                      <Badge bg={info.listener.is_online ? "success" : "secondary"}>Online: {String(info.listener.is_online)}</Badge>{" "}
                      <Badge bg={info.listener.is_session_running ? "warning" : "secondary"} text="dark">Session Running: {String(info.listener.is_session_running)}</Badge>{" "}
                      {info.listener.account_freeze && <Badge bg="danger">FROZEN</Badge>}
                    </div>
                    <div className="mt-2 small text-muted">
                      Audio: {info.listener.accepts_audio ? "✓" : "✗"} |{" "}
                      Video: {info.listener.accepts_video ? "✓" : "✗"} |{" "}
                      Chat: {info.listener.accepts_chat ? "✓" : "✗"}
                    </div>
                    {(info.listener.is_session_running || info.listener.account_freeze) && (
                      <Button size="sm" variant="outline-warning" className="mt-2" onClick={() => handleReset(listenerId, info.listener.name)} disabled={isResetting}>
                        Reset State
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {info.wallet && (
              <div className="mt-3 small text-muted">
                User wallet balance: <strong>₹{info.wallet.balance}</strong>
              </div>
            )}

            {info.socketStore && (
              <div className="mt-2 small text-muted">
                Socket store — User: {typeof info.socketStore.user === "string" ? info.socketStore.user : `socketId=${info.socketStore.user?.socketId || "none"}, offline=${String(info.socketStore.user?.isOffline)}`}{" "}|{" "}
                Listener: {typeof info.socketStore.listener === "string" ? info.socketStore.listener : `socketId=${info.socketStore.listener?.socketId || "none"}, offline=${String(info.socketStore.listener?.isOffline)}`}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DiagnoseModal;
