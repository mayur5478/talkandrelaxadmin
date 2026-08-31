import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Card, Button } from "../v2/ui";

import { useSendNotificationMutation } from "../../services/notifications";
import SendNotification from "../common/send-notification/SendNotification";

function SendNotificationPage() {
  const [sendNotification, { isLoading }] = useSendNotificationMutation();
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const handleSend = async (payload) => {
    setFeedback(null);
    try {
      const result = await sendNotification(payload).unwrap();
      setFeedback({ type: "success", message: result?.message || "Notification sent" });
      setShowModal(false);
    } catch (error) {
      setFeedback({ type: "error", message: error?.data?.message || "Failed to send notification" });
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Notifications</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Push a message into a listener's notification feed, or broadcast to everyone
          </p>
        </div>
        <Button onClick={() => { setFeedback(null); setShowModal(true); }}>
          <Bell size={14} className="tw-mr-1" />
          Send a notification
        </Button>
      </div>

      <Card flush className="tw-p-4">
        {feedback ? (
          <p className={feedback.type === "success" ? "tw-text-fg-success" : "tw-text-fg-danger"}>
            {feedback.message}
          </p>
        ) : (
          <p className="tw-text-fg-tertiary">
            Use "Send a notification" to message a single listener or broadcast to all.
          </p>
        )}
      </Card>

      <SendNotification
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSend}
        isSubmitting={isLoading}
      />
    </div>
  );
}

export default SendNotificationPage;
