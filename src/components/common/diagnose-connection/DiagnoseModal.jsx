import React, { useState } from "react";
import { Modal, Button, Badge, Spinner } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import {
  useLazySearchUsersQuery,
  useLazySearchListenersQuery,
  useLazyDiagnoseConnectionQuery,
} from "../../../services/auth";
import { useResetUserStateMutation } from "../../../services/auth";
import Swal from "sweetalert2";

function DiagnoseModal({ show, onHide }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedListener, setSelectedListener] = useState(null);

  const [triggerSearchUsers] = useLazySearchUsersQuery();
  const [triggerSearchListeners] = useLazySearchListenersQuery();
  const [triggerDiagnose, { data, isFetching, error }] = useLazyDiagnoseConnectionQuery();
  const [resetState, { isLoading: isResetting }] = useResetUserStateMutation();

  const loadUserOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const res = await triggerSearchUsers(inputValue).unwrap();
      return (res.data || []).map((u) => ({
        value: u.id,
        label: `${u.fullName} (${u.mobile_number || u.email || u.id})`,
      }));
    } catch {
      return [];
    }
  };

  const loadListenerOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const res = await triggerSearchListeners(inputValue).unwrap();
      return (res.data || []).map((l) => ({
        value: l.id,
        label: `${l.fullName} (${l.mobile_number || l.email || l.id})`,
      }));
    } catch {
      return [];
    }
  };

  const handleDiagnose = () => {
    if (!selectedUser || !selectedListener) return;
    triggerDiagnose({ userId: selectedUser.value, listenerId: selectedListener.value });
  };

  const handleReset = async (id, name) => {
    try {
      await resetState(id).unwrap();
      Swal.fire("Done", `Reset stuck state for ${name}`, "success");
      // Re-run diagnosis after reset
      triggerDiagnose({ userId: selectedUser.value, listenerId: selectedListener.value });
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Reset failed", "error");
    }
  };

  const issues = data?.issues || [];
  const info = data?.info || {};
  const canConnect = data?.canConnect;

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedListener(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Diagnose Connection Issue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-3 mb-3">
          <div className="col-md-5">
            <label className="form-label fw-semibold">User</label>
            <AsyncSelect
              cacheOptions
              loadOptions={loadUserOptions}
              onChange={setSelectedUser}
              value={selectedUser}
              placeholder="Search user by name..."
              isClearable
            />
          </div>
          <div className="col-md-5">
            <label className="form-label fw-semibold">Listener</label>
            <AsyncSelect
              cacheOptions
              loadOptions={loadListenerOptions}
              onChange={setSelectedListener}
              value={selectedListener}
              placeholder="Search listener by name..."
              isClearable
            />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <Button
              className="w-100"
              onClick={handleDiagnose}
              disabled={isFetching || !selectedUser || !selectedListener}
            >
              {isFetching ? <Spinner size="sm" /> : "Diagnose"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            Failed to run diagnosis: {error?.data?.message || "Server error"}
          </div>
        )}

        {data && (
          <>
            <div className={`alert ${canConnect ? "alert-success" : "alert-danger"} mb-3`}>
              {canConnect
                ? "No issues found — they should be able to connect."
                : `${issues.length} issue(s) blocking connection:`}
            </div>

            {!canConnect && (
              <ul className="mb-3 ps-3">
                {issues.map((issue, i) => (
                  <li key={i} className="text-danger fw-semibold mb-1">
                    {issue}
                  </li>
                ))}
              </ul>
            )}

            <div className="row g-3">
              {info.user && (
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="mb-2 fw-bold">{info.user.name}</h6>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      <Badge bg={info.user.is_online ? "success" : "secondary"}>
                        {info.user.is_online ? "Online" : "Offline"}
                      </Badge>
                      <Badge
                        bg={info.user.is_session_running ? "warning" : "secondary"}
                        text={info.user.is_session_running ? "dark" : undefined}
                      >
                        {info.user.is_session_running ? "Session Stuck" : "No Active Session"}
                      </Badge>
                      {info.user.account_freeze && <Badge bg="danger">FROZEN</Badge>}
                    </div>
                    {info.wallet && (
                      <p className="small text-muted mb-2">
                        Wallet: <strong>₹{info.wallet.balance}</strong>
                      </p>
                    )}
                    {(info.user.is_session_running || info.user.account_freeze) && (
                      <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => handleReset(selectedUser.value, info.user.name)}
                        disabled={isResetting}
                      >
                        Reset State
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {info.listener && (
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="mb-2 fw-bold">{info.listener.name}</h6>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      <Badge bg={info.listener.is_online ? "success" : "secondary"}>
                        {info.listener.is_online ? "Online" : "Offline"}
                      </Badge>
                      <Badge
                        bg={info.listener.is_session_running ? "warning" : "secondary"}
                        text={info.listener.is_session_running ? "dark" : undefined}
                      >
                        {info.listener.is_session_running ? "Session Stuck" : "No Active Session"}
                      </Badge>
                      {info.listener.account_freeze && <Badge bg="danger">FROZEN</Badge>}
                    </div>
                    <p className="small text-muted mb-2">
                      Accepts:{" "}
                      <span className={info.listener.accepts_audio ? "text-success" : "text-danger"}>Audio</span>{" · "}
                      <span className={info.listener.accepts_video ? "text-success" : "text-danger"}>Video</span>{" · "}
                      <span className={info.listener.accepts_chat ? "text-success" : "text-danger"}>Chat</span>
                    </p>
                    {(info.listener.is_session_running || info.listener.account_freeze) && (
                      <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => handleReset(selectedListener.value, info.listener.name)}
                        disabled={isResetting}
                      >
                        Reset State
                      </Button>
                    )}
                  </div>
                </div>
            )}
            </div>

            {info.socketStore && (
              <div className="mt-3 p-2 bg-light rounded small text-muted">
                <strong>Socket Store — </strong>
                User:{" "}
                {typeof info.socketStore.user === "string"
                  ? info.socketStore.user
                  : `offline=${String(info.socketStore.user?.isOffline)}`}
                {" | "}
                Listener:{" "}
                {typeof info.socketStore.listener === "string"
                  ? info.socketStore.listener
                  : `offline=${String(info.socketStore.listener?.isOffline)}`}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DiagnoseModal;
