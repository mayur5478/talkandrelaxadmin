import React, { useState } from "react";
import { Card, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner, Tabs, TabsList, Tab, Pagination } from "../v2/ui";
import { useListCounsellorsQuery } from "../../services/counsellor";
import { CHECK_TYPES, STATUS_LABEL, statusTone, checkTone, isNotEnabled, errorMessage, formatDateTime } from "./counsellorFormat";
import { NotEnabled, PageHeader } from "./CounsellorCommon";
import CounsellorDetail from "./CounsellorDetail";

const TABS = [
  ["vetting", "Vetting"], ["applied", "Applied"], ["training", "Training"], ["live", "Live"], ["removed", "Removed"], ["all", "All"],
];

export default function CounsellorApplications() {
  const [status, setStatus] = useState("vetting");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [openId, setOpenId] = useState(null);
  const { data, isLoading, error } = useListCounsellorsQuery({ status, page, pageSize });

  if (isNotEnabled(error)) return <NotEnabled />;
  const items = (data && data.items) || [];
  const total = (data && data.total) || 0;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <PageHeader title="Applications & vetting" subtitle="Review applicants, record the five vetting checks, then take them live." />
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }}>
        <TabsList ariaLabel="Status filter">
          {TABS.map(([v, l]) => <Tab key={v} value={v}>{l}</Tab>)}
        </TabsList>
      </Tabs>
      {error ? <ErrorBanner title="Could not load counsellors" message={errorMessage(error)} /> : null}
      <Card flush>
        {isLoading ? <TableSkeleton rows={6} cols={5} /> : (
          <>
            <Table>
              <THead>
                <TR><Th>Name</Th><Th>Qualification</Th><Th>Status</Th><Th>Checks</Th><Th>Applied</Th></TR>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <TR><Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">No counsellors in this view.</Td></TR>
                ) : items.map((c, i) => {
                  const passed = (c.checks || []).filter((x) => x.status === "passed").length;
                  return (
                    <TR key={c.id} isLast={i === items.length - 1} className="tw-cursor-pointer" onClick={() => setOpenId(c.id)}>
                      <Td className="tw-text-fg-primary tw-font-medium">{c.name || `#${c.id}`}<div className="tw-text-[11px] tw-text-fg-tertiary tw-font-normal">{c.mobile || c.email || ""}</div></Td>
                      <Td>{[c.qualification, c.degree].filter(Boolean).join(" · ") || "—"}</Td>
                      <Td><Pill tone={statusTone(c.status)} dot>{STATUS_LABEL[c.status] || c.status}</Pill></Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-1" title={`${passed} of ${CHECK_TYPES.length} passed`}>
                          {CHECK_TYPES.map((t) => {
                            const ck = (c.checks || []).find((x) => x.type === t);
                            return <Pill key={t} tone={checkTone(ck && ck.status)} className="tw-px-1.5">{t === "kyc_bg" ? "KYC" : t.charAt(0).toUpperCase()}</Pill>;
                          })}
                        </div>
                      </Td>
                      <Td>{formatDateTime(c.createdAt)}</Td>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} totalRecords={total} pageSize={pageSize} onPageChange={setPage} onPageSize={(n) => { setPageSize(n === "all" ? 100 : n); setPage(1); }} pageSizeOptions={[10, 20, 50, 100]} />
          </>
        )}
      </Card>
      {openId ? <CounsellorDetail id={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
