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
  const [forceEnd, { isLoading }] = useForceEndSessionMutation();

  const handleForceEnd = async () => {
    try {
      await forceEnd({ userId, reason }).unwrap();
      Swal.fire('Success', `Force-terminated session for ${userName}`, 'success');
      refetch();
      handleClose();
    } catch (err) {
      Swal.fire('Error', err?.data?.message || 'Force end failed', 'error');
    }
  };

  return (
    <Modal open={show} onClose={handleClose} title={`Force End Session: ${userName}`} size="md">
      <ModalBody>
        {/* Warning banner */}
        <div className="tw-flex tw-items-start tw-gap-3 tw-bg-bg-danger tw-border tw-border-hairline tw-border-danger tw-rounded-md tw-p-3 tw-mb-4">
          <AlertTriangle size={15} className="tw-text-fg-danger tw-shrink-0 tw-mt-[1px]" aria-hidden />
          <p className="tw-text-[12px] tw-text-fg-secondary tw-m-0 tw-leading-relaxed">
            This will immediately clear the <strong className="tw-text-fg-primary">"Busy"</strong> status for this user and attempt to end their current session.
          </p>
        </div>

        {/* Reason input */}
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
        <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleForceEnd} disabled={isLoading}>
          {isLoading ? <><Spinner size={12} className="tw-text-white" /> Processing…</> : 'Force Kill Session'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default ForceEndModal;
