/*
 * Profile approvals — v2 migration.
 *
 * Listeners who have submitted Form 2 (docs + profile) and are awaiting
 * admin approval. Reuses the legacy approval mutation + rejection modal.
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
} from '../ui';
import { PageHeader } from '../_lib/PageHeader';
import { Pagination } from '../_lib/Pagination';
import { SearchBar } from '../_lib/SearchBar';

import RejectionModal from '../../listener-management/reject-request-modal/RejectionModal';
import ExportExcel from '../../common/export-modal/ExportExcel';

export default function ProfileApprovalsV2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch]     = useState('');
  const [date, setDate]         = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectedUser, setRejectedUser] = useState(null);

  const [approve, { isLoading: isApproving }] = useListenerProfileApprovalMutation();

  const { data, isLoading, isError, error, refetch } = useProfileApprovalsQuery({
    page, pageSize,
    searchParams: search || '',
    date: date ? new Date(date).toISOString().split('T')[0] : '',
  });

  const rows = data?.data?.users ?? [];
  const pagination = data?.data?.pagination ?? { totalRecords: 0, totalPages: 1 };

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
          <TableSkeleton rows={pageSize} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No pending approvals"
            description={search || date ? 'Try clearing your filters.' : 'When listeners submit Form 2, they\'ll show up here.'}
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <Th>Sr.</Th>
                  <Th>Listener</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
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
                    <Td><Pill tone="warning">In review</Pill></Td>
                    <Td align="right">
                      <div className="tw-inline-flex tw-items-center tw-gap-1">
                        <Tooltip label="View documents">
                          <IconButton
                            size="sm"
                            aria-label="View documents"
                            onClick={() => navigate(`/dashboard/listener-management/listeners-profile-approvals-docs?id=${r.id}`)}
                          >
                            <Eye size={14} />
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
      <ExportExcel show={exportOpen} onHide={() => setExportOpen(false)} />
    </div>
  );
}
