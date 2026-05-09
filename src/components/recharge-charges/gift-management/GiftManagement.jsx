import React, { useState } from "react";
import "./giftManagement.scss";
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
  useCreateGiftPlanMutation,
  useDeleteGiftPlanMutation,
  useEditGiftPlanMutation,
  useGiftPlansListQuery,
} from "../../../services/recharge";
import CreatePlan from "../../common/create-plan/CreatePlan";
import DeleteModal from "../../common/delete-modal/DeleteModal";
import EditPlan from "../../common/edit-plans/EditPlan";

function GiftManagement() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, refetch } = useGiftPlansListQuery({
    page,
    limit,
    search: searchText,
  });

  const plans = data?.plans || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setPage(1);
  };

  const [show, setShow] = useState(false);
  const [type, setType] = useState("Gift");
  const [createMutation, { isLoading: isCreateLoading }] =
    useCreateGiftPlanMutation();
  const handleSubmit = async (formData) => {
    try {
      await createMutation(formData);
      refetch();
      setShow(false);
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };
  const [deletePlan, { isLoading: isDeleteLoading }] =
    useDeleteGiftPlanMutation();
  const [deleteDes, setDeleteDes] = useState("");
  const [selectedUserDelete, setSelectedUserDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const [showEdit, setShowEdit] = useState(false);

  const handleSubmitEdit = async (formData) => {
    try {
      await editMutation(formData);
      refetch();
      setShowEdit(false);
    } catch (error) {
      console.error("Submit Error:", error);
    }
  };
  const [value, setValue] = useState(null);
  const [id, setId] = useState("");
  const handleValue = (data, id) => {
    setValue(data);
    setId(id);
  };

  const [editMutation, { isLoading: isEditLoading }] =
    useEditGiftPlanMutation();

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Gift Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage available gift amount plans</p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button size="sm" onClick={() => setShow(true)}>
            + Gift Amount
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
        <div className="tw-relative tw-flex-1 tw-min-w-[200px] tw-max-w-xs">
          <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search by gift amount"
            value={searchText}
            onChange={handleSearchChange}
            className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
          />
        </div>
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
                  <Th>Gift Amount</Th>
                  <Th>GST Amount</Th>
                  <Th>Net Amount</Th>
                  <Th>Action</Th>
                </TR>
              </THead>
              <TBody>
                {plans.length === 0 ? (
                  <TR>
                    <Td colSpan={5} className="tw-text-center tw-text-fg-tertiary">No gift plans found</Td>
                  </TR>
                ) : (
                  plans.map((plan, index) => (
                    <TR key={plan._id} isLast={index === plans.length - 1}>
                      <Td>{(page - 1) * limit + index + 1}</Td>
                      <Td className="tw-font-medium">{plan.payable_amount}</Td>
                      <Td>{plan.gst_amount}</Td>
                      <Td>{plan.net_amount}</Td>
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
                  ))
                )}
              </TBody>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalRecords={total}
              pageSize={limit}
              onPageChange={setPage}
              onPageSize={(v) => { setLimit(v); setPage(1); }}
            />
          </>
        )}
      </Card>

      <CreatePlan
        show={show}
        onHide={() => setShow(false)}
        type={type}
        isEdit={false}
        onSubmit={handleSubmit}
        isSubmitting={isCreateLoading}
      />
      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        des={deleteDes}
        onConfirm={confirmDelete}
        isLoading={isDeleteLoading}
      />
      <EditPlan
        show={showEdit}
        onHide={() => setShowEdit(false)}
        type={type}
        isEdit={false}
        onSubmit={handleSubmitEdit}
        isSubmitting={isEditLoading}
        initialData={{ gift_amount: value }}
        id={id}
      />
    </div>
  );
}

export default GiftManagement;
