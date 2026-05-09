/*
 * Application requests — v2 migration.
 *
 * Preserves the legacy Send Form 1 / Send Form 2 logic shipped earlier
 * in this thread (commits 2120e4b and e264fab). The mutation hooks,
 * request flow, and modal components are all reused as-is — only the
 * surrounding shell + table is rebuilt against the v2 design system.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Filter, X, Eye } from 'lucide-react';
import {
  useApplicationsQuery,
  useSendOnboardingForm1Mutation,
  useSendOnboardingForm2Mutation,
} from '../../../services/listener';
import {
  Card, Button, IconButton, Pill, Avatar,
  Table, THead, TBody, TR, Th, Td, TableSkeleton,
  EmptyState, ErrorBanner, Tooltip, useToast,
} from '../ui';
import { PageHeader } from '../_lib/PageHeader';
import { Pagination } from '../_lib/Pagination';
import { SearchBar } from '../_lib/SearchBar';

// Modals from legacy — reused verbatim, still functional.
import RejectionModal from '../../listener-management/reject-request-modal/RejectionModal';
import LinkShare from '../../common/link-share/LinkShare';
import ExportExcel from '../../common/export-modal/ExportExcel';

const STATUS_LABEL = {
  'confirmation request': { tone: 'warning', label: 'Pending review' },
  'application rejected': { tone: 'danger',  label: 'Rejected' },
  'processing':           { tone: 'info',    label: 'Filling form' },
  'documents in review':  { tone: 'warning', label: 'In review' },
  'profile in process':   { tone: 'info',    label: 'Profile in process' },
};

export default function ApplicationRequestsV2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exportOpen, setExportOpen]     = useState(false);
  const [rejectOpen, setRejectOpen]     = useState(false);
  const [rejectedUser, setRejectedUser] = useState(null);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch]     = useState('');
  const [date, setDate]         = useState(null);

  const [linkOpen, setLinkOpen]               = useState(false);
  const [pendingUserId, setPendingUserId]     = useState(null);
  const [pendingUserName, setPendingUserName] = useState(null);
  const [pendingFormStep, setPendingFormStep] = useState(null);

  const [sendForm1, { isLoading: isSending1 }] = useSendOnboardingForm1Mutation();
  const [sendForm2, { isLoading: isSending2 }] = useSendOnboardingForm2Mutation();

  const { data, isLoading, isError, error, refetch } = useApplicationsQuery({
    page, pageSize,
    searchParams: search || '',
    date: date ? new Date(date).toISOString().split('T')[0] : '',
  });

  const rows = data?.data?.users ?? [];
  const pagination = data?.data?.pagination ?? { totalRecords: 0, totalPages: 1 };

  const openSend = (userId, userName, step) => {
    setPendingUserId(userId);
    setPendingUserName(userName);
    setPendingFormStep(step);
    setLinkOpen(true);
  };

  const confirmSend = async () => {
    try {
      if (pendingFormStep === 1) await sendForm1(pendingUserId).unwrap();
      else                       await sendForm2(pendingUserId).unwrap();
      toast({ title: `Form ${pendingFormStep} sent`, tone: 'success' });
      refetch();
    } catch (err) {
      console.error('[v2] Failed to send onboarding form:', err);
      toast({
        title: 'Send failed',
        description: err?.data?.message || 'Please try again.',
        tone: 'danger',
      });
    } finally {
      setPendingUserId(null);
      setPendingUserName(null);
      setPendingFormStep(null);
      setLinkOpen(false);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <PageHeader
        title="Application requests"
        description="Listeners who applied and are awaiting review or onboarding."
        primaryAction={
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download size={14} aria-hidden /> Export
          </Button>
        }
      />

      {/* Filter strip */}
      <Card className="tw-p-3">
        <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search applicants" />
          <input
            type="date"
            value={date || ''}
            onChange={(e) => setDate(e.target.value || null)}
            aria-label="Filter by date"
            className="tw-h-8 tw-px-2 tw-bg-bg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-text-[12px] tw-text-fg-primary focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-fg-info"
          />
          {(search || date) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setDate(null); }}>
              <X size={12} aria-hidden /> Clear
            </Button>
          )}
        </div>
      </Card>

      {isError && (
        <ErrorBanner
          message={error?.data?.message || error?.message}
          action={<Button variant="outline" size="sm" onClick={refetch}>Retry</Button>}
        />
      )}

      {/* Table card */}
      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={pageSize} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No applications"
            description={search || date ? 'Try clearing your filters.' : 'New applicants will show up here.'}
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Sr.</Th>
                  <Th>Applicant</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </TR>
              </THead>
              <TBody>
                {rows.map((r, i) => {
                  const status = STATUS_LABEL[r.listener_request_status] || {
                    tone: 'neutral', label: r.listener_request_status || 'Pending',
                  };
                  return (
                    <TR key={r.id} isLast={i === rows.length - 1}>
                      <Td>{(page - 1) * pageSize + i + 1}</Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <Avatar name={r.fullName} size="sm" />
                          <div className="tw-min-w-0">
                            <div className="tw-text-[12px] tw-text-fg-primary tw-font-medium tw-truncate">{r.fullName || '—'}</div>
                            <div className="tw-text-[11px] tw-text-fg-tertiary tw-truncate">{r.email || ''}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>{r.mobile_number || '—'}</Td>
                      <Td><Pill tone={status.tone}>{status.label}</Pill></Td>
                      <Td align="right">
                        <div className="tw-inline-flex tw-items-center tw-gap-1">
                          <Tooltip label="View full application">
                            <IconButton
                              size="sm"
                              aria-label="View full application"
                              onClick={() => navigate(`/dashboard/listener-management/application-review?id=${r.id}`)}
                            >
                              <Eye size={14} />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSending1}
                            onClick={() => openSend(r.id, r.fullName, 1)}
                          >
                            {r.listener_request_status === 'processing' ? 'Resend Form 1' : 'Send Form 1'}
                          </Button>
                          <Button
                            size="sm"
                            disabled={isSending2}
                            onClick={() => openSend(r.id, r.fullName, 2)}
                          >
                            {r.listener_request_status === 'profile in process' ? 'Resend Form 2' : 'Send Form 2'}
                          </Button>
                          <Tooltip label="Reject">
                            <IconButton
                              size="sm"
                              variant="outline"
                              aria-label="Reject"
                              onClick={() => { setRejectedUser(r.id); setRejectOpen(true); }}
                            >
                              <X size={14} className="tw-text-fg-danger" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </Td>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <div className="tw-border-t tw-border-hairline tw-border-tertiary">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={pagination.totalRecords}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          </>
        )}
      </Card>

      {/* Modals — reused from legacy file unchanged */}
      <RejectionModal
        show={rejectOpen}
        rejectedUser={rejectedUser}
        refetch={refetch}
        onHide={() => setRejectOpen(false)}
      />
      <LinkShare
        show={linkOpen}
        onHide={() => setLinkOpen(false)}
        onConfirm={confirmSend}
        userId={pendingUserId}
        userName={pendingUserName}
        formStep={pendingFormStep}
        isMutationLoading={isSending1 || isSending2}
      />
      <ExportExcel show={exportOpen} onHide={() => setExportOpen(false)} />
    </div>
  );
}
