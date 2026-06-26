import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, ModalBody, ModalFooter, Button, Spinner } from '../../v2/ui';
import { useForceEndSessionMutation } from '../../../services/auth';
import Swal from 'sweetalert2';

const inputCls =
  "tw-w-full tw-bg-bg-secondary tw-text-fg-primary tw-text-[13px] " +
  "tw-border tw-border-hairline tw-border-tertiary tw-rounded-md " +
  "tw-px-3 tw-py-2 tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info " +
  "tw-transition-shadow tw-duration-fast placeholder:tw-text-fg-tertiary";

function ForceEndModal({ show, handleClose, userId, userName, refetch }) {
  const [reason, setReason] = useState('Admin manual clearing (stuck status)');
  const [liveCallWarning, setLiveCallWarning] = useState(null); // {sessionId, age, billingStale}
  const [forceEnd, { isLoading }] = useForceEndSessionMutation();

  const doForceEnd = async (forceOverride = false) => {
    try {
      await forceEnd({ userId, reason, force: forceOverride }).unwrap();
      Swal.fire('Done', `Session ended for ${userName}`, 'success');
      setLiveCallWarning(null);
      refetch();
      handleClose();
    } catch (err) {
      if (err?.data?.blocked) {
        // Server says session is live — show override confirmation instead of generic error
        setLiveCallWarning({
          sessionId: err.data.sessionId,
          age: err.data.sessionAgeSeconds,
          billingStale: err.data.billingStaleSeconds,
        });
      } else {
        Swal.fire('Error', err?.data?.message || 'Force end failed', 'error');
      }
    }
  };

  const handleClose_ = () => {
    setLiveCallWarning(null);
    handleClose();
  };

  if (liveCallWarning) {
    return (
      <Modal open={show} onClose={handleClose_} title="⚠️ Live Call — Override?" size="md">
        <ModalBody>
          <div className="tw-flex tw-items-start tw-gap-3 tw-bg-bg-danger tw-border tw-border-hairline tw-border-danger tw-rounded-md tw-p-3 tw-mb-4">
            <AlertTriangle size={15} className="tw-text-fg-danger tw-shrink-0 tw-mt-[1px]" aria-hidden />
            <div className="tw-text-[12px] tw-text-fg-secondary tw-leading-relaxed">
              <p className="tw-m-0 tw-mb-1">
                <strong className="tw-text-fg-primary">This session appears to be a live, active call.</strong>
              </p>
              <p className="tw-m-0">
                Session age: <strong>{liveCallWarning.age}s</strong> &nbsp;|&nbsp;
                Billing stale: <strong>{liveCallWarning.billingStale}s</strong>
              </p>
              <p className="tw-m-0 tw-mt-1">
                Ending it will cut the call and charge the user for any deducted amount. Are you sure?
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={handleClose_} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => doForceEnd(true)} disabled={isLoading}>
            {isLoading ? <><Spinner size={12} className="tw-text-white" /> Ending…</> : 'Yes, Kill Live Call'}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal open={show} onClose={handleClose_} title={`Force End Session: ${userName}`} size="md">
      <ModalBody>
        <div className="tw-flex tw-items-start tw-gap-3 tw-bg-bg-danger tw-border tw-border-hairline tw-border-danger tw-rounded-md tw-p-3 tw-mb-4">
          <AlertTriangle size={15} className="tw-text-fg-danger tw-shrink-0 tw-mt-[1px]" aria-hidden />
          <p className="tw-text-[12px] tw-text-fg-secondary tw-m-0 tw-leading-relaxed">
            This will clear the <strong className="tw-text-fg-primary">"Busy"</strong> status and end the current session.
            If the call is live, a second confirmation will appear.
          </p>
        </div>

        <label className="tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-fg-tertiary tw-mb-1">
          Audit Reason
        </label>
        <input
          type="text"
          className={inputCls}
          placeholder="Reason for force termination…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={handleClose_} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => doForceEnd(false)} disabled={isLoading}>
          {isLoading ? <><Spinner size={12} className="tw-text-white" /> Processing…</> : 'Force Kill Session'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default ForceEndModal;
