import React, { useState, useEffect } from "react";
import "./chargeManagement.scss";
import { Search, PencilLine } from "lucide-react";
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
import { useChargesListQuery, useEditChargesMutation } from "../../../services/recharge";
import { useBulkUpdateChargesMutation } from "../../../services/listener";
import EditCharge from "../../common/edit-charge/EditCharge";

function ChargeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, error, isLoading, refetch } = useChargesListQuery({
    page,
    limit: pageSize,
    search: searchTerm,
  });

  const totalRecords = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const [editMutation, { isLoading: isEditLoading }] = useEditChargesMutation();
  const [bulkUpdateCharges, { isLoading: isBulkUpdating }] = useBulkUpdateChargesMutation();

  const [bulkVoice, setBulkVoice] = useState("");
  const [bulkChat, setBulkChat] = useState("");
  const [bulkVideo, setBulkVideo] = useState("");
  const [bulkMsg, setBulkMsg] = useState(null);

  const handleBulkReset = async () => {
    const fields = {};
    if (bulkVoice !== "") fields.voice_charge = bulkVoice;
    if (bulkChat !== "") fields.chat_charge = bulkChat;
    if (bulkVideo !== "") fields.video_charge = bulkVideo;

    if (Object.keys(fields).length === 0) {
      setBulkMsg({ type: "error", text: "Enter at least one rate to update." });
      return;
    }

    const labels = [];
    if (fields.voice_charge !== undefined) labels.push(`Voice: Rs.${fields.voice_charge}`);
    if (fields.chat_charge !== undefined) labels.push(`Chat: Rs.${fields.chat_charge}`);
    if (fields.video_charge !== undefined) labels.push(`Video: Rs.${fields.video_charge}`);

    if (!window.confirm(`Apply to ALL listeners?\n${labels.join(", ")} per min`)) return;

    try {
      const res = await bulkUpdateCharges(fields).unwrap();
      setBulkMsg({ type: "success", text: res.message || "Bulk update successful." });
      setBulkVoice("");
      setBulkChat("");
      setBulkVideo("");
      refetch();
    } catch (err) {
      setBulkMsg({ type: "error", text: err?.data?.message || "Bulk update failed." });
    }
  };

  const [showEdit, setShowEdit] = useState(false);
  const [value, setValue] = useState({});
  const [id, setId] = useState("");
  const handleValue = (id, chat_charge, call_charge, video_charge, listener_name) => {
    setValue({ chat_charge, call_charge, video_charge, listener_name });
    setId(id);
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

  if (isLoading) return <TableSkeleton rows={8} cols={7} />;
  if (error) return <div className="tw-p-4 tw-text-fg-tertiary">Error fetching charges</div>;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      {/* Page header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Charge Management</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Manage per-minute session charges for listeners</p>
        </div>
      </div>

      {/* Bulk Rate Reset panel */}
      <Card>
        <div className="tw-mb-3">
          <h3 className="tw-text-fg-primary tw-font-semibold tw-text-[15px] tw-m-0 tw-mb-3">Bulk Rate Reset</h3>
          <div className="tw-flex tw-flex-wrap tw-gap-3 tw-items-end">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <label className="tw-text-[12px] tw-text-fg-tertiary">Voice Call (Rs./min)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 8"
                value={bulkVoice}
                onChange={(e) => { setBulkVoice(e.target.value); setBulkMsg(null); }}
                className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info tw-w-28"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <label className="tw-text-[12px] tw-text-fg-tertiary">Chat (Rs./min)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 8"
                value={bulkChat}
                onChange={(e) => { setBulkChat(e.target.value); setBulkMsg(null); }}
                className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info tw-w-28"
              />
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <label className="tw-text-[12px] tw-text-fg-tertiary">Video Call (Rs./min)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 16"
                value={bulkVideo}
                onChange={(e) => { setBulkVideo(e.target.value); setBulkMsg(null); }}
                className="tw-h-8 tw-px-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info tw-w-28"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkReset}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? "Updating..." : "Apply to All Listeners"}
            </Button>
          </div>
          {bulkMsg && (
            <p className={`tw-text-[13px] tw-mt-2 ${bulkMsg.type === "success" ? "tw-text-success" : "tw-text-danger"}`}>
              {bulkMsg.text}
            </p>
          )}
        </div>
      </Card>

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
              <Th>Listener Name</Th>
              <Th>Services</Th>
              <Th>Chat</Th>
              <Th>Call</Th>
              <Th>Video Call</Th>
              <Th>Action</Th>
            </TR>
          </THead>
          <TBody>
            {data.data.map((listener, index) => (
              <TR key={listener.id} isLast={index === data.data.length - 1}>
                <Td>{(page - 1) * pageSize + index + 1}</Td>
                <Td className="tw-text-fg-primary tw-font-medium">{listener.display_name}</Td>
                <Td>{listener.service.join(", ")}</Td>
                <Td>Rs. {listener.chat_charge} per Min</Td>
                <Td>Rs. {listener.voice_charge} per Min</Td>
                <Td>Rs. {listener.video_charge} per Min</Td>
                <Td>
                  <div className="tw-flex tw-items-center tw-gap-1">
                    <IconButton
                      size="sm"
                      aria-label="Edit"
                      onClick={() => {
                        setShowEdit(true);
                        handleValue(listener.id, listener.chat_charge, listener.voice_charge, listener.video_charge, listener.display_name);
                      }}
                    >
                      <PencilLine size={14} />
                    </IconButton>
                  </div>
                </Td>
              </TR>
            ))}
          </TBody>
        </Table>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSize={(v) => { setPageSize(v); setPage(1); }}
        />
      </Card>

      <EditCharge
        show={showEdit}
        onHide={() => setShowEdit(false)}
        onSubmit={handleSubmitEdit}
        isSubmitting={isEditLoading}
        initialData={value}
        id={id}
      />
    </div>
  );
}

export default ChargeManagement;
