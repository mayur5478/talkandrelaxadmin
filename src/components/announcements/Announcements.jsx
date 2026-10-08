import React, { useState } from "react";
import { Megaphone, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  Pill,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pagination,
  Modal,
  ModalBody,
  ModalFooter,
  Button,
} from "../v2/ui";
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from "../../services/announcements";

// Pulls the actual URL out of a link field, discarding any label text typed
// in front of it (e.g. "meeting link: https://meet.google.com/xyz") — a raw
// string without a scheme resolves as a relative path against the admin
// domain instead of the intended destination.
const extractUrl = (raw) => {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { url: "", error: null };
  const match = trimmed.match(/https?:\/\/\S+/);
  if (!match) return { url: "", error: "Link must be a full URL starting with http:// or https://" };
  return { url: match[0], error: null };
};

// Admin → listener announcements. Listeners see these behind the T&R
// centre-nav button in the app (meeting links, policy/rate changes).
function Announcements() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError } = useGetAnnouncementsQuery({ page, pageSize });
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const [editRow, setEditRow] = useState(null); // row being edited, or null
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null); // row pending delete confirm
  const [isDeleting, setIsDeleting] = useState(false);

  const rows = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const handleSend = async () => {
    setFormError("");
    if (!title.trim() || !body.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    const { url: cleanLink, error: linkError } = extractUrl(link);
    if (linkError) {
      setFormError(linkError);
      return;
    }
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim(), link: cleanLink }).unwrap();
      setTitle("");
      setBody("");
      setLink("");
    } catch (e) {
      setFormError(e?.data?.message || "Failed to send. Try again.");
    }
  };

  const toggleActive = async (row) => {
    try {
      await updateAnnouncement({ id: row.id, is_active: !row.is_active }).unwrap();
    } catch (e) {
      console.error("toggle failed", e);
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditTitle(row.title || "");
    setEditBody(row.body || "");
    setEditLink(row.link || "");
    setEditError("");
  };

  const closeEdit = () => {
    if (isSavingEdit) return;
    setEditRow(null);
  };

  const saveEdit = async () => {
    setEditError("");
    if (!editTitle.trim() || !editBody.trim()) {
      setEditError("Title and message are required.");
      return;
    }
    const { url: cleanLink, error: linkError } = extractUrl(editLink);
    if (linkError) {
      setEditError(linkError);
      return;
    }
    setIsSavingEdit(true);
    try {
      await updateAnnouncement({
        id: editRow.id,
        title: editTitle.trim(),
        body: editBody.trim(),
        link: cleanLink,
      }).unwrap();
      setEditRow(null);
    } catch (e) {
      setEditError(e?.data?.message || "Failed to save. Try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAnnouncement(deleteRow.id).unwrap();
      setDeleteRow(null);
    } catch (e) {
      console.error("delete failed", e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div>
        <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Listener Announcements</h1>
        <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
          Meeting links, policy and rate updates — listeners see these behind the T&amp;R button in the app.
        </p>
      </div>

      {/* Compose */}
      <Card>
        <div className="tw-flex tw-flex-col tw-gap-3 tw-p-1">
          <input
            type="text"
            placeholder="Title (e.g. Team meeting Friday 6 PM)"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            className="tw-w-full tw-h-9 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
          <textarea
            placeholder="Message for all listeners…"
            value={body}
            rows={3}
            onChange={(e) => setBody(e.target.value)}
            className="tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
          <input
            type="url"
            placeholder="Optional link (meeting URL, policy doc…)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="tw-w-full tw-h-9 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
          {formError && <p className="tw-text-[13px] tw-text-fg-danger tw-m-0">{formError}</p>}
          <div className="tw-flex tw-justify-end">
            <button
              onClick={handleSend}
              disabled={isCreating}
              className="tw-inline-flex tw-items-center tw-gap-2 tw-h-9 tw-px-4 tw-text-[13px] tw-rounded-md tw-bg-fg-info tw-text-white disabled:tw-opacity-60"
            >
              <Megaphone size={14} /> {isCreating ? "Publishing…" : "Publish to listeners"}
            </button>
          </div>
        </div>
      </Card>

      {/* History */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Title</Th>
                  <Th>Message</Th>
                  <Th>Link</Th>
                  <Th>Sent</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </TR>
              </THead>
              <TBody>
                {isError ? (
                  <TR><Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">Error fetching announcements</Td></TR>
                ) : rows.length === 0 ? (
                  <TR><Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">No announcements yet</Td></TR>
                ) : (
                  rows.map((row, index) => (
                    <TR key={row.id} isLast={index === rows.length - 1}>
                      <Td className="tw-text-fg-primary tw-font-medium">{row.title}</Td>
                      <Td className="tw-max-w-[320px] tw-truncate" title={row.body}>{row.body}</Td>
                      <Td>
                        {row.link ? (
                          <a href={row.link} target="_blank" rel="noopener noreferrer" className="tw-text-fg-info hover:tw-underline">
                            link
                          </a>
                        ) : (
                          <span className="tw-text-fg-tertiary">—</span>
                        )}
                      </Td>
                      <Td>{new Date(row.createdAt).toLocaleString()}</Td>
                      <Td>
                        <button onClick={() => toggleActive(row)} title="Click to toggle visibility in the app">
                          {row.is_active ? <Pill tone="success">Live</Pill> : <Pill tone="warning">Hidden</Pill>}
                        </button>
                      </Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <button
                            onClick={() => openEdit(row)}
                            title="Edit"
                            className="tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-sm tw-text-fg-secondary hover:tw-bg-bg-secondary"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteRow(row)}
                            title="Delete"
                            className="tw-w-7 tw-h-7 tw-grid tw-place-items-center tw-rounded-sm tw-text-fg-danger hover:tw-bg-bg-secondary"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              totalRecords={pagination.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSize={(v) => { setPageSize(v); setPage(1); }}
            />
          </>
        )}
      </Card>

      <Modal open={!!editRow} onClose={closeEdit} title="Edit announcement" size="lg">
        <ModalBody>
          <div className="tw-flex tw-flex-col tw-gap-3">
            <input
              type="text"
              placeholder="Title"
              value={editTitle}
              maxLength={200}
              onChange={(e) => setEditTitle(e.target.value)}
              className="tw-w-full tw-h-9 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
            />
            <textarea
              placeholder="Message"
              value={editBody}
              rows={3}
              onChange={(e) => setEditBody(e.target.value)}
              className="tw-w-full tw-px-3 tw-py-2 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
            />
            <input
              type="url"
              placeholder="Optional link (meeting URL, policy doc…)"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              className="tw-w-full tw-h-9 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info"
            />
            {editError && <p className="tw-text-[13px] tw-text-fg-danger tw-m-0">{editError}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={closeEdit} disabled={isSavingEdit}>Cancel</Button>
          <Button onClick={saveEdit} disabled={isSavingEdit}>{isSavingEdit ? "Saving…" : "Save"}</Button>
        </ModalFooter>
      </Modal>

      <Modal open={!!deleteRow} onClose={() => !isDeleting && setDeleteRow(null)} title="Delete announcement" description="This can't be undone. Listeners will no longer see it.">
        <ModalFooter>
          <Button variant="ghost" onClick={() => setDeleteRow(null)} disabled={isDeleting}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>{isDeleting ? "Deleting…" : "Delete"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default Announcements;
