import React, { useState } from "react";
import "./recharge.scss";
import { Search, PencilLine, Trash2 } from "lucide-react";
import {
  Card,
  Button,
  IconButton,
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
  useCreateRechargePlanMutation,
  useDeleteRechargePlanMutation,
  useEditAdminCommissionMutation,
  useEditGiftCommissionMutation,
  useEditRechargePlanMutation,
  useRechargePlansHighlightMutation,
  useRechargePlansListQuery,
} from "../../../services/recharge";
import Highlight from "../../common/highlight/Highlight";
import DeleteModal from "../../common/delete-modal/DeleteModal";
import CreatePlan from "../../common/create-plan/CreatePlan";
import EditPlan from "../../common/edit-plans/EditPlan";
import Commission from "../../common/admin-commision/Commission";
import { useGetMeQuery } from "../../../services/auth";

function Recharge() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [des, setDes] = useState("");
  const [deleteDes, setDeleteDes] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const {
    data: user,
    isLoading: isUserLoading,
    refetch: userRefetch,
  } = useGetMeQuery(null, {
    skip: !localStorage.getItem("token"),
  });

  const {
    data,
    error: fetchError,
    isLoading,
    refetch,
  } = useRechargePlansListQuery({ page, limit: pageSize, search: searchTerm });
  const [highlightMutation, { isLoading: isHighlightLoading }] =
    useRechargePlansHighlightMutation();
  const [deletePlan, { isLoading: isDeleteLoading }] =
    useDeleteRechargePlanMutation();
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };
  const [createMutation, { isLoading: isCreateLoading }] =
    useCreateRechargePlanMutation();
  const handleToggle = (plan_id, status) => {
    setSelectedUser(plan_id);
    setShowHighlightModal(true);
    if (status === false) {
      setDes("You Are Attempting To Highlight Plan in your system.");
    } else {
      setDes("You Are Attempting To remove Highlight Plan in your system.");
    }
  };
  const [editMutation, { isLoading: isEditLoading }] =
    useEditRechargePlanMutation();
  const confirmHighlight = async () => {
    try {
      await highlightMutation(selectedUser).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowHighlightModal(null);
    }
  };
  const handleDelete = (planId) => {
    setSelectedUserDelete(planId);
    setShowDeleteModal(true);
    setDeleteDes("You Are Attempting To remove Plan in your system");
  };

  const confirmDelete = async () => {
    try {
      await deletePlan(selectedUserDelete).unwrap();
      refetch();
    } catch (err) {
      console.error("Error toggling account freeze:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserDelete(null);
    }
  };
  const [show, setShow] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [type, setType] = useState("Recharge");
  const [value, setValue] = useState(null);
  const [id, setId] = useState("");
  const handleValue = (data, id) => {
    setValue(data);
    setId(id);
  };
  const handleSubmit = async (formData) => {
    try {
      await createMutation(formData);
      refetch();
      setShow(false);
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };

  const handleSubmitEdit = async (formData) => {
    try {
      await editMutation(formData);
      refetch();
      setShowEdit(false);
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(e.target.value);
  };

  const handleNextPage = () => {
    if (page < data?.data?.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  const [showCommission, setShowCommission] = useState(false);
  const [editCommission, { isLoading: isEditCommissionLoading }] =
    useEditAdminCommissionMutation();
  const handleSubmitCommission = async (id, charge) => {
    try {
      await editCommission({ id, charge });
      userRefetch();
      setShowCommission(false);
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };
  const [editGiftCommission, { isLoading: isEditGiftCommissionLoading }] =
    useEditGiftCommissionMutation();
  const handleSubmitGiftCommission = async (id, charge) => {
    try {
      await editGiftCommission({ id, charge }).unwrap();
      userRefetch();
      setShowCommission(false);
    } catch (error) {
      console.error("Gift commission submit error:", error);
    }
  };

  if (isLoading) return <TableSkeleton rows={8} cols={6} />;
  if (fetchError) return <div className="tw-p-4 tw-text-fg-tertiary">Error fetching plans</div>;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Recharge Plans</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage available recharge plans</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button variant="ghost" size="sm">
            GST (%)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowCommission(true)}>
            Admin Commission
          </Button>
          <Button size="sm" onClick={() => setShow(true)}>
            + Recharge Plan
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
            onChange={handleSearch}
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
              <Th>Recharge Amount</Th>
              <Th>GST Amount</Th>
              <Th>Net Amount</Th>
              <Th>Highlight Plans</Th>
              <Th>Action</Th>
            </TR>
          </THead>
          <TBody>
            {data.data.plans.map((plan, index) => (
              <TR key={plan.id} isLast={index === data.data.plans.length - 1}>
                <Td>{index + 1}</Td>
                <Td className="tw-font-medium">{plan.payable_amount}</Td>
                <Td>{plan.gst_amount}</Td>
                <Td>{plan.net_amount}</Td>
                <Td>
                  <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.isHighlight}
                      onChange={() => handleToggle(plan.id, plan.isHighlight)}
                      className="tw-sr-only tw-peer"
                    />
                    <div className="tw-w-9 tw-h-5 tw-bg-bg-secondary tw-rounded-full tw-peer peer-checked:tw-bg-fg-info tw-transition-colors tw-duration-200 after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-0.5 after:tw-bg-white after:tw-rounded-full after:tw-h-4 after:tw-w-4 after:tw-transition-all peer-checked:after:tw-translate-x-4" />
                  </label>
                </Td>
                <Td>
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <IconButton
                      size="sm"
                      aria-label="Edit"
                      onClick={() => {
                        setShowEdit(true);
                        handleValue(plan.payable_amount, plan.id);
                      }}
                    >
                      <PencilLine size={14} />
                    </IconButton>
                    <IconButton size="sm" aria-label="Delete" onClick={() => handleDelete(plan.id)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </Td>
              </TR>
            ))}
          </TBody>
        </Table>
        <Pagination
          page={page}
          totalPages={data?.data?.totalPages}
          totalRecords={data?.data?.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSize={(v) => { setPageSize(v); setPage(1); }}
        />
        {error && <div className="tw-p-3 tw-text-danger tw-text-[13px]">{error}</div>}
      </Card>

      <Highlight
        show={showHighlightModal}
        onHide={() => setShowHighlightModal(false)}
        des={des}
        onConfirm={confirmHighlight}
        isLoading={isHighlightLoading}
      />
      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        des={deleteDes}
        onConfirm={confirmDelete}
        isLoading={isDeleteLoading}
      />
      <CreatePlan
        show={show}
        onHide={() => setShow(false)}
        type={type}
        isEdit={false}
        onSubmit={handleSubmit}
        isSubmitting={isCreateLoading}
      />
      <EditPlan
        show={showEdit}
        onHide={() => setShowEdit(false)}
        type={type}
        isEdit={false}
        onSubmit={handleSubmitEdit}
        isSubmitting={isEditLoading}
        initialData={{ recharge_amount: value }}
        id={id}
      />
      <Commission
        show={showCommission}
        onHide={() => setShowCommission(false)}
        isSubmitting={isEditCommissionLoading}
        isSubmittingGift={isEditGiftCommissionLoading}
        onSubmit={handleSubmitCommission}
        onSubmitGift={handleSubmitGiftCommission}
        user={user}
      />
    </div>
  );
}

export default Recharge;
