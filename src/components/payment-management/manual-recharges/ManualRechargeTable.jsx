import React, { useState, useEffect } from "react";
import { Table, Spinner, Badge, Pagination } from "react-bootstrap";
import { useGetManualAdjustmentsQuery } from "../../../services/recharge";

const ManualRechargeTable = ({ searchTerm, fromDate, toDate, setExcelData }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError } = useGetManualAdjustmentsQuery({
    page,
    pageSize,
  });

  useEffect(() => {
    if (data?.data) {
      setExcelData(data.data);
    }
  }, [data, setExcelData]);

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading adjusting records...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-5 text-danger">
        <p>Error loading manual recharge records. Please try again later.</p>
      </div>
    );
  }

  const adjustments = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1 };

  // Filter local results based on searchTerm if search is active
  const filteredData = adjustments.filter((item) => {
    const fullName = item?.userData?.fullName?.toLowerCase() || "";
    const reason = item?.reason?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(search) || reason.includes(search);
    
    // Date filtering
    let matchesDate = true;
    if (fromDate && toDate) {
      const itemDate = new Date(item.createdAt);
      matchesDate = itemDate >= new Date(fromDate) && itemDate <= new Date(toDate);
    }
    
    return matchesSearch && matchesDate;
  });

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="bg-light">
            <tr>
              <th className="border-0">User / Listener</th>
              <th className="border-0">Role</th>
              <th className="border-0">Amount</th>
              <th className="border-0">Type</th>
              <th className="border-0">Reason</th>
              <th className="border-0">Processing Admin</th>
              <th className="border-0">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="fw-semibold text-dark">{item?.userData?.fullName || "N/A"}</div>
                    <small className="text-muted">{item?.userData?.mobile_number || "No Phone"}</small>
                  </td>
                  <td>
                    <Badge bg={item?.userData?.role === 'listener' ? 'info' : 'secondary'} className="text-capitalize">
                      {item?.userData?.role || 'N/A'}
                    </Badge>
                  </td>
                  <td>
                    <span className={item.type === "credit" ? "text-success fw-bold" : "text-danger fw-bold"}>
                      {item.type === "credit" ? "+" : "-"} ₹{item.amount || 0}
                    </span>
                  </td>
                  <td>
                    <Badge pill bg={item.type === "credit" ? "success" : "danger"} className="px-3">
                      {item.type?.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ maxWidth: '250px' }}>
                    <div className="text-truncate" title={item.reason}>
                      {item.reason || "Manual adjustment"}
                    </div>
                  </td>
                  <td>
                    <small className="text-muted">{item.admin_id || "System"}</small>
                  </td>
                  <td>
                    <div className="text-dark small">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                    <small className="text-muted">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </small>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  No records found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination size="sm">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={page === 1} />
            <Pagination.Prev onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
            {[...Array(pagination.totalPages)].map((_, i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === page}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next onClick={() => handlePageChange(page + 1)} disabled={page === pagination.totalPages} />
            <Pagination.Last onClick={() => handlePageChange(pagination.totalPages)} disabled={page === pagination.totalPages} />
          </Pagination>
        </div>
      )}
    </>
  );
};

export default ManualRechargeTable;
