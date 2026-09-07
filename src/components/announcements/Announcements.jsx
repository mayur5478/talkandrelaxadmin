import React, { useState } from "react";
import { Megaphone } from "lucide-react";
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
} from "../v2/ui";
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from "../../services/announcements";

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

  const rows = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const handleSend = async () => {
    setFormError("");
    if (!title.trim() || !body.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim(), link: link.trim() }).unwrap();
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
                </TR>
              </THead>
              <TBody>
                {isError ? (
                  <TR><Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">Error fetching announcements</Td></TR>
                ) : rows.length === 0 ? (
                  <TR><Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">No announcements yet</Td></TR>
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
    </div>
  );
}

export default Announcements;
