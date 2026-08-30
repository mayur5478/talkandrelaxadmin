import React, { useState } from "react";
import { Ban, Trash2 } from "lucide-react";
import {
  Card,
  IconButton,
  Table,
  THead,
  TBody,
  TR,
  Th,
  Td,
  TableSkeleton,
  Pagination,
  Button,
} from "../v2/ui";

import {
  useGetBlockedMobilesQuery,
  useBlockMobileMutation,
  useUnblockMobileMutation,
} from "../../services/blockedMobiles";
import BlockMobile from "../common/block-mobile/BlockMobile";
import Delete from "../common/delete/Delete";

function BlockedMobiles() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError } = useGetBlockedMobilesQuery({
    page,
    limit: pageSize,
  });

  const [blockMobile, { isLoading: isBlocking }] = useBlockMobileMutation();
  const [unblockMobile, { isLoading: isUnblocking }] = useUnblockMobileMutation();

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [blockError, setBlockError] = useState("");

  const blocked = data?.blocked || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  const handleBlock = async (payload) => {
    setBlockError("");
    try {
      await blockMobile(payload).unwrap();
      setShowBlockModal(false);
    } catch (error) {
      setBlockError(error?.data?.message || "Failed to block number");
    }
  };

  const handleUnblock = async () => {
    if (!selectedEntry) return;
    try {
      await unblockMobile(selectedEntry.id).unwrap();
      setShowUnblockModal(false);
    } catch (error) {
      console.error("Unblock failed:", error);
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Blocked numbers</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Permanently block a mobile number from registering or logging in
          </p>
        </div>
        <Button onClick={() => setShowBlockModal(true)}>
          <Ban size={14} className="tw-mr-1" />
          Block a number
        </Button>
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
                  <Th>Mobile number</Th>
                  <Th>Reason</Th>
                  <Th>Blocked at</Th>
                  <Th>Action</Th>
                </TR>
              </THead>
              <TBody>
                {isError ? (
                  <TR>
                    <Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">
                      Error fetching blocked numbers
                    </Td>
                  </TR>
                ) : blocked.length === 0 ? (
                  <TR>
                    <Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">
                      No numbers blocked
                    </Td>
                  </TR>
                ) : (
                  blocked.map((entry, index) => (
                    <TR key={entry.id} isLast={index === blocked.length - 1}>
                      <Td>{(page - 1) * pageSize + index + 1}</Td>
                      <Td className="tw-text-fg-primary tw-font-medium">{entry.mobile}</Td>
                      <Td>{entry.reason || "—"}</Td>
                      <Td>{new Date(entry.createdAt).toLocaleString()}</Td>
                      <Td>
                        <div className="tw-flex tw-items-center tw-gap-1">
                          <IconButton
                            size="sm"
                            aria-label="Unblock"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowUnblockModal(true);
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

      <BlockMobile
        show={showBlockModal}
        onHide={() => { setShowBlockModal(false); setBlockError(""); }}
        onSubmit={handleBlock}
        isSubmitting={isBlocking}
      />
      {blockError && (
        <div className="tw-text-fg-danger tw-text-small">{blockError}</div>
      )}
      <Delete
        show={showUnblockModal}
        onHide={() => setShowUnblockModal(false)}
        onConfirm={handleUnblock}
        userId={selectedEntry?.id}
        userName={selectedEntry?.mobile}
        isDeleteUserLoading={isUnblocking}
        type="Blocked Number"
      />
    </div>
  );
}

export default BlockedMobiles;
