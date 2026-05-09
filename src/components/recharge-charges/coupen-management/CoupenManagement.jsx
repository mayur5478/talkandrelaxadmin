// src/components/CoupenManagement.js
import React, { useState } from "react";
import "./coupenManagement.scss";
import { Search, PencilLine, Trash2 } from "lucide-react";
import {
  Card,
  Button,
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
} from "../../v2/ui";
import {
  useCoupensListQuery,
  useCreateCoupenMutation,
  useDeleteCoupenMutation,
  useEditCoupenMutation,
  useGetCoupenUsersQuery,
} from "../../../services/recharge";
import Coupen from "../../common/coupen/Coupen";
import DeleteModal from "../../common/delete-modal/DeleteModal";

function CoupenManagement() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [initialData, setInitialData] = useState({});
  const [id, setId] = useState("");
  const [show, setShow] = useState(false);
  const [usersModal, setUsersModal] = useState({ open: false, coupenId: null, coupenTitle: "" });
  const [usersPage, setUsersPage] = useState(1);
  const { data, error, isLoading, refetch } = useCoupensListQuery({
    page,
    limit,
    search: searchTerm,
  });

  const handleSetValue = (data, id) => {
    setInitialData(data);
    setId(id);
  };

  const { data: usersData, isLoading: isUsersLoading } = useGetCoupenUsersQuery(
    { id: usersModal.coupenId, page: usersPage, limit: 10 },
    { skip: !usersModal.coupenId }
  );

  const [createMutation, { isLoading: isCreateLoading }] =
    useCreateCoupenMutation();
  const [updateMutation, { isLoading: isUpdateLoading }] =
    useEditCoupenMutation();
  const handleSubmit = async (formData) => {
    try {
      if (id && initialData) {
        await updateMutation(formData).unwrap();
      } else {
        await createMutation(formData).unwrap();
      }
      refetch();
      setShow(false);
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };
  const [deleteCoupen, { isLoading: isDeleteLoading }] =
    useDeleteCoupenMutation();
  const [deleteDes, setDeleteDes] = useState("");
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = (coupenId) => {
    setSelectedUserDelete(coupenId);
    setShowDeleteModal(true);
    setDeleteDes("You Are Attempting To remove Coupen in your system");
  };
  const confirmDelete = async () => {
    try {
      await deleteCoupen(selectedUserDelete).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserDelete(null);
    }
  };

  if (isLoading) return <TableSkeleton rows={8} cols={9} />;
  if (error) return <div className="tw-p-4 tw-text-fg-tertiary">Error fetching data</div>;

  const getCouponStatusTone = (coupen) => {
    const today = new Date().toISOString().split('T')[0];
    const expireDay = coupen.expire_date ? coupen.expire_date.split('T')[0] : '';
    const limitReached = coupen.user_limit != null && coupen.user_limit > 0 && coupen.user_count >= coupen.user_limit;
    if (!coupen.isActive) return { tone: "neutral", label: "Inactive" };
    if (expireDay && expireDay < today) return { tone: "danger", label: "Expired" };
    if (limitReached) return { tone: "warning", label: "Limit Reached" };
    return { tone: "success", label: "Active" };
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Coupon Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage discount coupons</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button size="sm" onClick={() => setShow(true)}>
            + Create Coupon
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
      </div>

      {/* Table card */}
      <Card flush>
        <Table>
          <THead>
            <TR>
              <Th>Sr. No</Th>
              <Th>Coupon Name</Th>
              <Th>Minimum Amount</Th>
              <Th>% off</Th>
              <Th>On Amount</Th>
              <Th>Expire Date</Th>
              <Th>Usage</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </TR>
          </THead>
          <TBody>
            {data.data.map((coupen, index) => {
              const { tone, label } = getCouponStatusTone(coupen);
              return (
                <TR key={coupen.id} isLast={index === data.data.length - 1}>
                  <Td>{index + 1}</Td>
                  <Td className="tw-text-fg-primary tw-font-medium">{coupen.title}</Td>
                  <Td>{coupen.minimum_amount}</Td>
                  <Td>{coupen.percentage}%</Td>
                  <Td>{coupen.instruction}</Td>
                  <Td>{new Date(coupen.expire_date).toLocaleDateString()}</Td>
                  <Td>{coupen.user_count} / {coupen.user_limit}</Td>
                  <Td><Pill tone={tone}>{label}</Pill></Td>
                  <Td>
                    <div className="tw-flex tw-items-center tw-gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setUsersModal({ open: true, coupenId: coupen.id, coupenTitle: coupen.title }); setUsersPage(1); }}
                      >
                        Users ({coupen.user_count})
                      </Button>
                      <IconButton
                        size="sm"
                        aria-label="Edit"
                        onClick={() => {
                          setShow(true);
                          handleSetValue(
                            {
                              title: coupen.title,
                              minimum_amount: coupen.minimum_amount,
                              expire_date: coupen.expire_date,
                              user_limit: coupen.user_limit,
                              percentage: coupen.percentage,
                            },
                            coupen.id
                          );
                        }}
                      >
                        <PencilLine size={14} />
                      </IconButton>
                      <IconButton size="sm" aria-label="Delete" onClick={() => handleDelete(coupen.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </Td>
                </TR>
              );
            })}
          </TBody>
        </Table>
        <Pagination
          page={page}
          totalPages={data.meta.totalPages}
          totalRecords={data.meta.total}
          pageSize={limit}
          onPageChange={setPage}
          onPageSize={(v) => { setLimit(v); setPage(1); }}
        />
      </Card>

      <Coupen
        show={show}
        onHide={() => setShow(false)}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={id !== "" ? isUpdateLoading : isCreateLoading}
        id={id}
      />
      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        des={deleteDes}
        onConfirm={confirmDelete}
        isLoading={isDeleteLoading}
        modal_type="coupen"
      />

      {/* Coupon Users Modal */}
      {usersModal.open && (
        <div className="coupen-users-overlay" onClick={() => setUsersModal({ open: false, coupenId: null, coupenTitle: "" })}>
          <div className="coupen-users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupen-users-modal-header">
              <p className="export-modal-title">Users who used: {usersModal.coupenTitle}</p>
              <button className="coupen-users-close" onClick={() => setUsersModal({ open: false, coupenId: null, coupenTitle: "" })}>x</button>
            </div>
            <div className="coupen-users-modal-body">
              {isUsersLoading ? (
                <p>Loading...</p>
              ) : !usersData?.data?.length ? (
                <p className="coupen-no-users">No users have used this coupon yet.</p>
              ) : (
                <>
                  <table className="coupen-users-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Amount Paid</th>
                        <th>Discount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.data.map((row, idx) => (
                        <tr key={row.id}>
                          <td>{(usersPage - 1) * 10 + idx + 1}</td>
                          <td>{row.userData?.fullName || "-"}</td>
                          <td>{row.userData?.mobile_number || "-"}</td>
                          <td>Rs.{row.amount}</td>
                          <td>{row.discount_percentage}% (Rs.{row.discount_amount})</td>
                          <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersData.meta?.totalPages > 1 && (
                    <div className="coupen-users-pagination">
                      <button disabled={usersPage === 1} onClick={() => setUsersPage((p) => p - 1)}>Prev</button>
                      <span>{usersPage} / {usersData.meta.totalPages}</span>
                      <button disabled={usersPage === usersData.meta.totalPages} onClick={() => setUsersPage((p) => p + 1)}>Next</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoupenManagement;
