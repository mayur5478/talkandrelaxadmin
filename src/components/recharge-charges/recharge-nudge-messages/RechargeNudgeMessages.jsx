import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import Swal from "sweetalert2";
import {
  Card,
  Button,
  IconButton,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
} from "../../v2/ui";
import {
  useRechargeNudgeMessagesListQuery,
  useCreateRechargeNudgeMessageMutation,
  useUpdateRechargeNudgeMessageMutation,
  useDeleteRechargeNudgeMessageMutation,
} from "../../../services/rechargeNudge";

// Single editable row. Keeps its own draft state so typing doesn't refetch/
// re-render the whole list, and only calls the API on explicit Save.
function MessageRow({ message, onSaved }) {
  const [text, setText] = useState(message.text);
  const [sequence, setSequence] = useState(message.sequence);
  const [updateMessage, { isLoading: isSaving }] = useUpdateRechargeNudgeMessageMutation();
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteRechargeNudgeMessageMutation();

  const dirty = text !== message.text || Number(sequence) !== Number(message.sequence);

  const handleSave = async () => {
    try {
      await updateMessage({ id: message.id, text, sequence: Number(sequence) }).unwrap();
      onSaved?.();
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Failed to save message", "error");
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateMessage({ id: message.id, is_active: !message.is_active }).unwrap();
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Failed to update message", "error");
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete this message?",
      text: "It will stop showing in the app immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteMessage(message.id).unwrap();
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Failed to delete message", "error");
    }
  };

  return (
    <TR>
      <Td>
        <input
          type="number"
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
          className="tw-w-14 tw-h-8 tw-px-1 tw-text-[13px] tw-text-center tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
        />
      </Td>
      <Td className="tw-min-w-[320px]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="tw-w-full tw-px-2 tw-py-1.5 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info tw-resize-y"
        />
      </Td>
      <Td>
        <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
          <input
            type="checkbox"
            checked={message.is_active === true}
            onChange={handleToggleActive}
            className="tw-sr-only tw-peer"
          />
          <div className="tw-w-9 tw-h-5 tw-bg-bg-secondary tw-rounded-full tw-peer peer-checked:tw-bg-fg-info tw-transition-colors tw-duration-200 after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-0.5 after:tw-bg-white after:tw-rounded-full after:tw-h-4 after:tw-w-4 after:tw-transition-all peer-checked:after:tw-translate-x-4" />
        </label>
      </Td>
      <Td>
        <div className="tw-flex tw-items-center tw-gap-1">
          {dirty && (
            <Button size="sm" variant="secondary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "..." : "Save"}
            </Button>
          )}
          <IconButton size="sm" aria-label="Delete" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={14} />
          </IconButton>
        </div>
      </Td>
    </TR>
  );
}

function RechargeNudgeMessages() {
  const { data, isLoading, isError, refetch } = useRechargeNudgeMessagesListQuery();
  const [createMessage, { isLoading: isCreating }] = useCreateRechargeNudgeMessageMutation();
  const [newText, setNewText] = useState("");

  const messages = data?.messages || [];

  const handleAdd = async () => {
    if (!newText.trim()) return;
    try {
      await createMessage({ text: newText.trim() }).unwrap();
      setNewText("");
    } catch (err) {
      Swal.fire("Error", err?.data?.message || "Failed to create message", "error");
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Recharge Nudge Messages</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Chat-bubble copy shown to not-yet-recharged first-time users on the home screen.
            Changes apply immediately — no app release needed.
          </p>
        </div>
      </div>

      <Card flush>
        <div className="tw-p-3 tw-flex tw-items-center tw-gap-2 tw-border-b tw-border-hairline tw-border-tertiary">
          <input
            type="text"
            placeholder="New message text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="tw-flex-1 tw-h-9 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
          />
          <Button size="sm" onClick={handleAdd} disabled={isCreating || !newText.trim()}>
            <Plus size={14} /> Add Message
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : (
          <Table>
            <THead>
              <TR>
                <Th>Order</Th>
                <Th>Message</Th>
                <Th>Active</Th>
                <Th>Action</Th>
              </TR>
            </THead>
            <TBody>
              {isError ? (
                <TR>
                  <Td colSpan={4} className="tw-text-center tw-text-fg-tertiary">
                    Error fetching messages
                  </Td>
                </TR>
              ) : messages.length === 0 ? (
                <TR>
                  <Td colSpan={4} className="tw-text-center tw-text-fg-tertiary">
                    No messages yet — add one above.
                  </Td>
                </TR>
              ) : (
                [...messages]
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((message) => (
                    <MessageRow key={message.id} message={message} onSaved={refetch} />
                  ))
              )}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default RechargeNudgeMessages;
