import React, { useState } from "react";
import { Check, X, Download, Share2, Plus } from "lucide-react";
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
  useGetCommunityPostsQuery,
  useApproveCommunityPostMutation,
  useRejectCommunityPostMutation,
  useIgApproveCommunityPostMutation,
  useIgDownloadCommunityPostMutation,
  useCreateCommunityPostMutation,
} from "../../services/community";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "reported", label: "Reported" },
];

const isNotEnabled = (err) => err?.status === 404;

function Preview({ post }) {
  if (post.media_type === "image") return <img src={post.media_url} alt="" className="tw-h-20 tw-w-20 tw-rounded tw-object-cover" />;
  if (post.media_type === "video") return <video src={post.media_url} className="tw-h-20 tw-w-28 tw-rounded" controls preload="metadata" />;
  return null;
}

function NewPostModal({ onClose }) {
  const [type, setType] = useState("feed");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [createPost, { isLoading }] = useCreateCommunityPostMutation();

  const submit = async () => {
    setError("");
    const fd = new FormData();
    fd.append("type", type);
    fd.append("body_text", text);
    if (file) fd.append("media", file);
    try {
      await createPost(fd).unwrap();
      onClose();
    } catch (e) {
      setError(e?.data?.message || "Could not post");
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/50">
      <div className="tw-w-full tw-max-w-md tw-rounded-lg tw-bg-white tw-p-5">
        <h3 className="tw-mb-3 tw-text-lg tw-font-semibold">New anonymous post</h3>
        <select value={type} onChange={(e) => setType(e.target.value)} className="tw-mb-3 tw-w-full tw-rounded tw-border tw-p-2">
          <option value="feed">Feed post</option>
          <option value="story">Story (24h)</option>
        </select>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={4} placeholder="Text (optional if media attached)" className="tw-mb-3 tw-w-full tw-rounded tw-border tw-p-2" />
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] || null)} className="tw-mb-3" />
        {error && <p className="tw-mb-2 tw-text-sm tw-text-red-600">{error}</p>}
        <div className="tw-flex tw-justify-end tw-gap-2">
          <button onClick={onClose} className="tw-rounded tw-border tw-px-3 tw-py-1.5">Cancel</button>
          <button onClick={submit} disabled={isLoading} className="tw-rounded tw-bg-indigo-600 tw-px-3 tw-py-1.5 tw-text-white">{isLoading ? "Posting…" : "Post"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showNew, setShowNew] = useState(false);
  const { currentData, isFetching, error } = useGetCommunityPostsQuery({ status: tab, page, pageSize });
  const [approve] = useApproveCommunityPostMutation();
  const [reject] = useRejectCommunityPostMutation();
  const [igApprove] = useIgApproveCommunityPostMutation();
  const [igDownload] = useIgDownloadCommunityPostMutation();

  const posts = currentData?.data?.posts || [];
  const pagination = currentData?.data?.pagination;
  const showSkeleton = isFetching && !currentData;
  const onApprove = (p) => approve(p.id).unwrap().catch((e) => alert(e?.data?.message || "Action failed"));
  const onIgApprove = (p) => igApprove({ id: p.id, approved: !p.ig_approved }).unwrap().catch((e) => alert(e?.data?.message || "Action failed"));

  const onReject = async (p) => {
    const reason = window.prompt("Reject reason (shown to the poster):");
    if (!reason) return;
    await reject({ id: p.id, reason }).unwrap().catch((e) => alert(e?.data?.message || "Failed"));
  };

  const onDownload = async (p) => {
    try {
      const r = await igDownload(p.id).unwrap();
      const d = r.data;
      if (d.caption) await navigator.clipboard?.writeText(d.caption).catch(() => {});
      if (d.media_url) window.open(d.media_url, "_blank", "noopener");
      alert(d.caption ? "Caption copied to clipboard. Media opened in a new tab." : "Media opened in a new tab.");
    } catch (e) {
      alert(e?.data?.message || "Not approved for Instagram");
    }
  };

  if (isNotEnabled(error)) {
    return <Card><p className="tw-p-6">Community is not enabled on the server (COMMUNITY_ENABLED).</p></Card>;
  }

  return (
    <div className="tw-p-4">
      <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-gap-2">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
              className={`tw-rounded tw-px-3 tw-py-1.5 ${tab === t.key ? "tw-bg-indigo-600 tw-text-white" : "tw-border"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)} className="tw-flex tw-items-center tw-gap-1 tw-rounded tw-bg-indigo-600 tw-px-3 tw-py-1.5 tw-text-white">
          <Plus size={16} /> New post
        </button>
      </div>

      {error && !isNotEnabled(error) && (
        <div className="tw-mb-3 tw-rounded tw-border tw-border-red-300 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
          {error?.data?.message || "Could not load posts"}
        </div>
      )}

      <Card flush>
        {showSkeleton ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <Table>
            <THead>
              <TR><Th>#</Th><Th>Content</Th><Th>Type</Th><Th>Author (internal)</Th><Th>Status</Th><Th>Action</Th></TR>
            </THead>
            <TBody>
              {posts.map((p, i) => (
                <TR key={p.id}>
                  <Td>{(page - 1) * pageSize + i + 1}</Td>
                  <Td>
                    <div className="tw-flex tw-items-center tw-gap-3">
                      <Preview post={p} />
                      <span className="tw-max-w-xs tw-break-words">{p.body_text}</span>
                    </div>
                  </Td>
                  <Td>{p.type}</Td>
                  <Td>{p.author_role} · {String(p.author_id).slice(0, 8)}</Td>
                  <Td>
                    <Pill tone={p.status === "approved" ? "success" : p.status === "rejected" ? "danger" : "warning"}>{p.status}</Pill>
                    {p.report_count > 0 && <Pill tone="danger">{p.report_count} reports</Pill>}
                    {p.ig_approved && <Pill tone="success">IG</Pill>}
                  </Td>
                  <Td>
                    <div className="tw-flex tw-gap-2">
                      {p.status !== "approved" && <button title="Approve" onClick={() => onApprove(p)}><Check size={18} /></button>}
                      {p.status !== "rejected" && <button title="Reject" onClick={() => onReject(p)}><X size={18} /></button>}
                      {p.status === "approved" && (
                        <button title={p.ig_approved ? "Remove from Instagram" : "Approve for Instagram"} onClick={() => onIgApprove(p)}>
                          <Share2 size={18} />
                        </button>
                      )}
                      {p.ig_approved && <button title="Download for Instagram" onClick={() => onDownload(p)}><Download size={18} /></button>}
                    </div>
                  </Td>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        {!showSkeleton && pagination && (
          <Pagination page={page} totalPages={pagination.totalPages} totalRecords={pagination.total}
            pageSize={pageSize} pageSizeOptions={[5, 10, 20, 50]} onPageChange={setPage} onPageSize={(s) => { setPageSize(s); setPage(1); }} />
        )}
      </Card>
      {showNew && <NewPostModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
