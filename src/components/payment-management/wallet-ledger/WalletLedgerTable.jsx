import React, { useEffect, useState } from "react";
import { Table, Spinner, Badge, Pagination } from "react-bootstrap";
import { useGetWalletLedgerQuery } from "../../../services/recharge";

const TX_COLOR = {
  session_debit: "danger",
  recharge: "success",
  admin_credit: "success",
  admin_debit: "danger",
  session_listener_credit: "info",
  session_admin_credit: "primary",
};

const WalletLedgerTable = ({ ownerId, walletType, txType, fromDate, toDate, setExcelData }) => {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Reset to page 1 when any filter changes
  useEffect(() => { setPage(1); }, [ownerId, walletType, txType, fromDate, toDate]);

  const params = { page, pageSize };
  if (ownerId) params.owner_id = ownerId;
  if (walletType) params.wallet_type = walletType;
  if (txType) params.tx_type = txType;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;

  const { data, isLoading, isError } = useGetWalletLedgerQuery(params);

  useEffect(() => {
    if (data?.data) setExcelData(data.data);
  }, [data, setExcelData]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading ledger…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-5 text-danger">
        <p>Error loading wallet ledger. Please try again.</p>
      </div>
    );
  }

  const rows = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          {pagination.total.toLocaleString()} record{pagination.total !== 1 ? "s" : ""} found
        </small>
      </div>

      <div className="table-responsive">
        <Table hover className="align-middle" style={{ fontSize: "13px" }}>
          <thead className="bg-light">
            <tr>
              <th className="border-0">Owner ID</th>
              <th className="border-0">Wallet</th>
              <th className="border-0">Type</th>
              <th className="border-0">Amount</th>
              <th className="border-0">Before</th>
              <th className="border-0">After</th>
              <th className="border-0">Reference</th>
              <th className="border-0">Note</th>
              <th className="border-0">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((item) => {
                const isDebit = item.tx_type?.includes("debit");
                return (
                  <tr key={item.id}>
                    <td>
                      <span
                        className="text-monospace text-muted"
                        style={{ fontSize: "11px" }}
                        title={item.owner_id}
                      >
                        {item.owner_id?.slice(0, 8)}…
                      </span>
                    </td>
                    <td>
                      <Badge
                        bg={
                          item.wallet_type === "user"
                            ? "secondary"
                            : item.wallet_type === "listener"
                            ? "info"
                            : "dark"
                        }
                        className="text-capitalize"
                      >
                        {item.wallet_type}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        pill
                        bg={TX_COLOR[item.tx_type] || "secondary"}
                        style={{ fontSize: "11px" }}
                      >
                        {item.tx_type?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td>
                      <span
                        className={`fw-bold ${isDebit ? "text-danger" : "text-success"}`}
                      >
                        {isDebit ? "-" : "+"}₹
                        {Number(item.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="text-muted">₹{Number(item.balance_before).toFixed(2)}</td>
                    <td className="text-muted">₹{Number(item.balance_after).toFixed(2)}</td>
                    <td>
                      {item.reference_id ? (
                        <span
                          className="text-muted"
                          style={{ fontSize: "11px" }}
                          title={item.reference_id}
                        >
                          {item.reference_type}/{item.reference_id.slice(0, 8)}…
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td style={{ maxWidth: "180px" }}>
                      <div className="text-truncate text-muted" title={item.note || ""}>
                        {item.note || "—"}
                      </div>
                    </td>
                    <td>
                      <div className="text-dark small">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </div>
                      <small className="text-muted">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </small>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  No ledger records found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination size="sm">
            <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
            <Pagination.Prev
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            />
            {[...Array(Math.min(pagination.totalPages, 10))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === page}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            {pagination.totalPages > 10 && <Pagination.Ellipsis disabled />}
            <Pagination.Next
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
            />
            <Pagination.Last
              onClick={() => setPage(pagination.totalPages)}
              disabled={page === pagination.totalPages}
            />
          </Pagination>
        </div>
      )}
    </>
  );
};

export default WalletLedgerTable;
