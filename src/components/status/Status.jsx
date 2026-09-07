import React, { useState } from "react";
import "./status.scss";
import { Search, Eye, Check, Trash2, Upload, X } from "lucide-react";
import {
  Card,
  IconButton,
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
  useGetStoriesQuery,
  useApproveStoryMutation,
  useDeleteStoryMutation,
  useAdminAddStoryMutation,
} from "../../services/stories";
import { useListenerListQuery } from "../../services/listener";
import AcceptRequest from "../common/accept-modal/AcceptRequest";
import Delete from "../common/delete/Delete";

// Modal: admin uploads a story on behalf of a listener (goes live pre-approved).
function AdminStoryUpload({ show, onHide }) {
  const [listenerSearch, setListenerSearch] = useState("");
  const [selectedListener, setSelectedListener] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [adminAddStory, { isLoading: isUploading }] = useAdminAddStoryMutation();

  const { data: listenerData, isFetching: isSearching } = useListenerListQuery(
    { page: 1, pageSize: 8, searchParams: listenerSearch },
    { skip: !show || listenerSearch.trim().length < 2 }
  );
  const matches = listenerData?.data?.users || [];

  const reset = () => {
    setListenerSearch("");
    setSelectedListener(null);
    setFile(null);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!selectedListener) return setError("Pick a listener first.");
    if (!file) return setError("Pick an image or video.");
    const formData = new FormData();
    formData.append("listenerId", selectedListener.id);
    formData.append("story", file);
    try {
      await adminAddStory(formData).unwrap();
      reset();
      onHide();
    } catch (e) {
      setError(e?.data?.message || "Upload failed. Try again.");
    }
  };

  if (!show) return null;
  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/50">
      <div className="tw-bg-bg-primary tw-rounded-xl tw-shadow-xl tw-w-full tw-max-w-md tw-p-5 tw-flex tw-flex-col tw-gap-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <h2 className="tw-text-h2 tw-text-fg-primary tw-m-0">Upload story for listener</h2>
          <button
            onClick={() => { reset(); onHide(); }}
            className="tw-p-1 tw-rounded hover:tw-bg-bg-secondary tw-text-fg-tertiary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {selectedListener ? (
          <div className="tw-flex tw-items-center tw-justify-between tw-bg-bg-secondary tw-rounded-md tw-px-3 tw-py-2">
            <span className="tw-text-[13px] tw-text-fg-primary tw-font-medium">
              {selectedListener.display_name || selectedListener.nick_name || selectedListener.id}
            </span>
            <button
              onClick={() => setSelectedListener(null)}
              className="tw-text-[12px] tw-text-fg-info hover:tw-underline"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Search listener by name (min 2 chars)"
              value={listenerSearch}
              onChange={(e) => setListenerSearch(e.target.value)}
              className="tw-w-full tw-h-9 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
            />
            {listenerSearch.trim().length >= 2 && (
              <div className="tw-max-h-44 tw-overflow-y-auto tw-border tw-border-hairline tw-border-tertiary tw-rounded-md">
                {isSearching ? (
                  <div className="tw-p-3 tw-text-[13px] tw-text-fg-tertiary">Searching…</div>
                ) : matches.length === 0 ? (
                  <div className="tw-p-3 tw-text-[13px] tw-text-fg-tertiary">No listeners found</div>
                ) : (
                  matches.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSelectedListener(l)}
                      className="tw-w-full tw-text-left tw-px-3 tw-py-2 tw-text-[13px] tw-text-fg-primary hover:tw-bg-bg-secondary"
                    >
                      {l.display_name || l.nick_name || l.id}
                      <span className="tw-text-fg-tertiary"> · {l.mobile_number || ""}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="tw-text-[13px] tw-text-fg-secondary"
        />

        {error && <p className="tw-text-[13px] tw-text-fg-danger tw-m-0">{error}</p>}

        <div className="tw-flex tw-justify-end tw-gap-2">
          <button
            onClick={() => { reset(); onHide(); }}
            className="tw-h-9 tw-px-4 tw-text-[13px] tw-rounded-md tw-border tw-border-hairline tw-border-tertiary tw-text-fg-secondary hover:tw-bg-bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="tw-h-9 tw-px-4 tw-text-[13px] tw-rounded-md tw-bg-fg-info tw-text-white disabled:tw-opacity-60"
          >
            {isUploading ? "Uploading…" : "Upload (auto-approved)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Status() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDeleteStory, setSelectedDeleteStory] = useState(null);

  const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation();
  const { data, isLoading, isError } = useGetStoriesQuery({
    page,
    pageSize,
    search,
  });

  const [approveStory, { isLoading: isApproving }] = useApproveStoryMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const stories = data?.stories || [];
  const pagination = data?.pagination || { total: 0, page: 1, pageSize: 10 };

  const handleApprove = async () => {
    if (!selectedStory) return;
    try {
      await approveStory(selectedStory.listenerId).unwrap();
      setShowModal(false);
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeleteStory) return;
    try {
      await deleteStory(selectedDeleteStory.id).unwrap();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Status (Stories)</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Review and moderate listener stories</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-h-9 tw-px-4 tw-text-[13px] tw-rounded-md tw-bg-fg-info tw-text-white hover:tw-opacity-90"
        >
          <Upload size={14} /> Upload story
        </button>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search User"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      {/* Table card */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Sr. No</Th>
                  <Th>Listener Name</Th>
                  <Th>Upload Time</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </TR>
              </THead>
              <TBody>
                {isError ? (
                  <TR>
                    <Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">Error fetching stories</Td>
                  </TR>
                ) : stories.length === 0 ? (
                  <TR>
                    <Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">No stories found</Td>
                  </TR>
                ) : (
                  stories.map((story, index) => (
                    <TR key={story.id} isLast={index === stories.length - 1}>
                      <Td>{(page - 1) * pageSize + index + 1}</Td>
                      <Td className="tw-text-fg-primary tw-font-medium">
                        {story?.listenerStoryData?.display_name || story?.listenerStoryData?.nick_name || "Unknown"}
                      </Td>
                      <Td>{new Date(story.createdAt).toLocaleString()}</Td>
                      <Td>
                        {story?.is_approved ? (
                          <Pill tone="success">Approved</Pill>
                        ) : (
                          <Pill tone="warning">Pending</Pill>
                        )}
                      </Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-1">
                          <a
                            href={story?.story}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tw-inline-flex tw-items-center tw-justify-center tw-w-7 tw-h-7 tw-rounded-md hover:tw-bg-bg-secondary tw-text-fg-secondary tw-transition-colors"
                            aria-label="View Story"
                          >
                            <Eye size={14} />
                          </a>
                          <IconButton
                            size="sm"
                            aria-label="Approve Story"
                            onClick={() => {
                              setSelectedStory({
                                listenerId: story.listenerId,
                                name: story?.listenerStoryData?.display_name || story?.listenerStoryData?.nick_name || "Unknown",
                              });
                              setShowModal(true);
                            }}
                          >
                            <Check size={14} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            aria-label="Delete Story"
                            onClick={() => {
                              setSelectedDeleteStory({
                                id: story.id,
                                name: story?.listenerStoryData?.display_name || story?.listenerStoryData?.nick_name || "Unknown",
                              });
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
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

      <AcceptRequest
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleApprove}
        userId={selectedStory?.listenerId}
        userName={selectedStory?.name}
        isMutationLoading={isApproving}
      />
      <AdminStoryUpload show={showUploadModal} onHide={() => setShowUploadModal(false)} />
      <Delete
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        userId={selectedDeleteStory?.listenerId}
        userName={selectedDeleteStory?.name}
        isDeleteUserLoading={isDeleting}
        type="Story"
      />
    </div>
  );
}

export default Status;
