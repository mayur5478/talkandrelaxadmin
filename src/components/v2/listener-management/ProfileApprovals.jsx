/*
 * Profile approvals — v2 migration.
 *
 * Listeners who have submitted Form 2 (docs + profile) and are awaiting
 * admin approval. Reuses the legacy approval mutation + rejection modal.
 *
 * Two tabs: Pending (status "documents in review", ordered by latest Form 2
 * submission) and Rejected (Form-2-stage rejections, ordered by rejection
 * date, with a "New Form 2 link" action so candidates can resubmit).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Check, X, Download } from 'lucide-react';
import {
  useProfileApprovalsQuery,
  useListenerProfileApprovalMutation,
} from '../../../services/listener';
import {
  Card, Button, IconButton, Pill, Avatar,
  Table, THead, TBody, TR, Th, Td, TableSkeleton,
  EmptyState, ErrorBanner, Tooltip, useToast,
  Tabs, TabsList, Tab,
} from '../ui';
import { PageHeader } from '../_lib/PageHeader';
import { Pagination } from '../_lib/Pagination';
import { SearchBar } from '../_lib/SearchBar';

import RejectionModal from '../../listener-management/reject-request-modal/RejectionModal';
import ExportExcel from '../../common/export-modal/ExportExcel';
import OnboardingLinkModal from './OnboardingLinkModal';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

export default function ProfileApprovalsV2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView]         = useState('pending');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch]     = useState('');
  const [date, setDate]         = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectedUser, setRejectedUser] = useState(null);
  const [linkUser, setLinkUser] = useState(null);

  const [approve, { isLoading: isApproving }] = useListenerProfileApprovalMutation();

  const { data, isLoading, isError, error, refetch } = useProfileApprovalsQuery({
    page, pageSize, view,
    searchParams: search || '',
    date: date ? new Date(date).toISOString().split('T')[0] : '',
  });

  const rows = data?.data?.users ?? [];
  const pagination = data?.data?.pagination ?? { totalRecords: 0, totalPages: 1 };
  const isRejectedView = view === 'rejected';

  const switchView = (v) => { setView(v); setPage(1); };

  const handleApprove = async (userId, fullName) => {
    try {
      await approve(userId).unwrap();
      toast({ title: 'Listener approved', description: fullName, tone: 'success' });
      refetch();
    } catch (err) {
      toast({
        title: 'Approval failed',
        description: err?.data?.message || 'Please try again.',
        tone: 'danger',
      });
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <PageHeader
        title="Profile approvals"
        description="Listeners who submitted profile + documents and are pending sign-off."
        primaryAction={
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download size={14} aria-hidden /> Export
          </Button>
        }
      />

      <Tabs value={view} onChange={switchView}>
        <TabsList ariaLabel="Approval queues">
          <Tab value="pending">Pending</Tab>
          <Tab value="rejected">Rejected</Tab>
        </TabsList>
      </Tabs>

      <Card className="tw-p-3">
        <div className="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search listeners" />
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

      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={pageSize} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={isRejectedView ? 'No rejected profiles' : 'No pending approvals'}
            description={
              search || date
                ? 'Try clearing your filters.'
                : isRejectedView
                  ? 'Profiles rejected from this queue will show up here.'
                  : 'When listeners submit Form 2, they\'ll show up here.'
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Sr.</Th>
                  <Th>Listener</Th>
                  <Th>Contact</Th>
                  {isRejectedView ? (
                    <>
                      <Th>Rejected on</Th>
                      <Th>Reason</Th>
                    </>
                  ) : (
                    <>
                      <Th>Submitted</Th>
                      <Th>Status</Th>
                    </>
                  )}
                  <Th align="right">Actions</Th>
                </TR>
              </THead>
              <TBody>
                {rows.map((r, i) => (
                  <TR key={r.id} isLast={i === rows.length - 1}>
                    <Td>{(page - 1) * pageSize + i + 1}</Td>
                    <Td>
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <Avatar name={r.fullName} src={r.user_image} size="sm" />
                        <div className="tw-min-w-0">
                          <div className="tw-text-[12px] tw-text-fg-primary tw-font-medium tw-truncate">{r.fullName || '—'}</div>
                          <div className="tw-text-[11px] tw-text-fg-tertiary tw-truncate">{r.email || ''}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{r.mobile_number || '—'}</Td>
                    {isRejectedView ? (
                      <>
                        <Td>{fmtDate(r.rejected_at) || '—'}</Td>
                        <Td>
                          <span className="tw-text-[11px] tw-text-fg-secondary tw-line-clamp-2 tw-max-w-[260px]">
                            {r.rejection_reason || '—'}
                          </span>
                        </Td>
                        <Td align="right">
                          <div className="tw-inline-flex tw-items-center tw-gap-1">
                            <Tooltip label="View profile">
                              <IconButton
                                size="sm"
                                aria-label="View profile"
                                onClick={() => navigate(`/dashboard/listener-management/profile-view?id=${r.id}`)}
                              >
                                <Eye size={14} />
                              </IconButton>
                            </Tooltip>
                            {/* Re-issuing Form 2 lets a rejected candidate resubmit;
                                the row moves back to Pending once they do. */}
                            <Button size="sm" onClick={() => setLinkUser(r)}>
                              New Form 2 link
                            </Button>
                          </div>
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td>
                          {fmtDate(r.profile_submitted_at) || <span className="tw-text-fg-tertiary">—</span>}
                        </Td>
                        <Td><Pill tone="warning">In review</Pill></Td>
                        <Td align="right">
                          <div className="tw-inline-flex tw-items-center tw-gap-1">
                            <Tooltip label="View profile">
                              <IconButton
                                size="sm"
                                aria-label="View profile"
                                onClick={() => navigate(`/dashboard/listener-management/profile-view?id=${r.id}`)}
                              >
                                <Eye size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip label="View application docs">
                              <IconButton
                                size="sm"
                                aria-label="View application docs"
                                onClick={() => navigate(`/dashboard/listener-management/listeners-profile-approvals-docs?id=${r.id}`)}
                              >
                                <Download size={14} />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="sm"
                              disabled={isApproving}
                              onClick={() => handleApprove(r.id, r.fullName)}
                            >
                              <Check size={14} aria-hidden /> Approve
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
                      </>
                    )}
                  </TR>
                ))}
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

      <RejectionModal
        show={rejectOpen}
        rejectedUser={rejectedUser}
        refetch={refetch}
        onHide={() => setRejectOpen(false)}
      />
      <OnboardingLinkModal
        open={!!linkUser}
        onClose={() => setLinkUser(null)}
        user={linkUser}
        formStep={2}
        onIssued={refetch}
      />
      <ExportExcel show={exportOpen} onHide={() => setExportOpen(false)} />
    </div>
  );
}
