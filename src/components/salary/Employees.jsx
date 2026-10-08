import React, { useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import {
  Card, CardHeader, CardTitle, Button, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner,
  Modal, ModalBody, ModalFooter, Field, Input, EmptyState,
} from "../v2/ui";
import { useListEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation } from "../../services/salary";
import { formatRs, errorMessage } from "./salaryFormat";

export function NotEnabled() {
  return (
    <EmptyState
      icon={<Users size={20} />}
      title="Staff salary is not switched on for this server yet"
      description="Set SALARY_ADMIN_ENABLED=true on the backend once apply_employee_salary_tables.js has been applied."
    />
  );
}

const EMPTY_FORM = { name: "", employeeCode: "", designation: "", department: "", mobile: "", email: "", monthlySalaryRs: "", accountHolderName: "", accountNumber: "", ifsc: "", pan: "" };

export default function Employees() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useListEmployeesQuery({ q });
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [modal, setModal] = useState(null); // null | { mode: "add" } | { mode: "edit", employee }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState("");

  if (error && errorMessage(error) === "NOT_ENABLED") return <NotEnabled />;
  const employees = (data && data.employees) || [];

  const openAdd = () => { setForm(EMPTY_FORM); setSaveError(""); setModal({ mode: "add" }); };
  const openEdit = (e) => {
    setForm({ name: e.name, employeeCode: e.employeeCode || "", designation: e.designation || "", department: e.department || "",
      mobile: e.mobile || "", email: e.email || "", monthlySalaryRs: e.monthlySalaryRs || "", accountHolderName: e.accountHolderName || "",
      accountNumber: e.accountNumber || "", ifsc: e.ifsc || "", pan: e.pan || "" });
    setSaveError("");
    setModal({ mode: "edit", employee: e });
  };

  const save = async () => {
    setSaveError("");
    try {
      if (modal.mode === "add") await createEmployee(form).unwrap();
      else await updateEmployee({ id: modal.employee.id, ...form }).unwrap();
      setModal(null);
    } catch (e) { setSaveError(errorMessage(e, "Could not save employee")); }
  };

  const toggleStatus = async (e) => {
    try { await updateEmployee({ id: e.id, status: e.status === "active" ? "inactive" : "active" }).unwrap(); } catch (err) { /* surfaced on next list load */ }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Employees</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">Fixed-salary company staff. Separate from listener payouts.</p>
        </div>
        <Button onClick={openAdd}><Plus size={14} className="tw-mr-1" />Add employee</Button>
      </div>

      {error && errorMessage(error) !== "NOT_ENABLED" && <ErrorBanner title="Could not load employees" message={errorMessage(error)} />}

      <div className="tw-relative tw-max-w-xs">
        <Search size={14} className="tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-fg-tertiary" />
        <input
          type="text" placeholder="Search employees…" value={q} onChange={(e) => setQ(e.target.value)}
          className="tw-w-full tw-h-8 tw-pl-9 tw-pr-3 tw-text-[13px] tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-outline-none focus:tw-ring-2 focus:tw-ring-fg-info placeholder:tw-text-fg-tertiary"
        />
      </div>

      <Card flush>
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <Table>
            <THead>
              <TR><Th>Name</Th><Th>Code</Th><Th>Designation</Th><Th>Monthly salary</Th><Th>Status</Th><Th /></TR>
            </THead>
            <TBody>
              {employees.length === 0 ? (
                <TR><Td colSpan={6} className="tw-text-center tw-text-fg-tertiary">No employees yet. Press "Add employee".</Td></TR>
              ) : (
                employees.map((e, i) => (
                  <TR key={e.id} isLast={i === employees.length - 1}>
                    <Td className="tw-text-fg-primary tw-font-medium">{e.name}</Td>
                    <Td>{e.employeeCode || "—"}</Td>
                    <Td>{e.designation || "—"}</Td>
                    <Td className="tw-font-semibold">{formatRs(e.monthlySalaryRs)}</Td>
                    <Td><Pill tone={e.status === "active" ? "success" : "neutral"}>{e.status}</Pill></Td>
                    <Td>
                      <div className="tw-flex tw-gap-2">
                        <Button size="xs" variant="outline" onClick={() => openEdit(e)}>Edit</Button>
                        <Button size="xs" variant="outline" onClick={() => toggleStatus(e)}>{e.status === "active" ? "Deactivate" : "Activate"}</Button>
                      </div>
                    </Td>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal && modal.mode === "add" ? "Add employee" : "Edit employee"}>
        <ModalBody>
          {saveError && <ErrorBanner title="Could not save" message={saveError} />}
          <div className="tw-grid tw-grid-cols-2 tw-gap-3">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Employee code"><Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} /></Field>
            <Field label="Designation"><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
            <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
            <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Monthly salary (₹)"><Input value={form.monthlySalaryRs} onChange={(e) => setForm({ ...form, monthlySalaryRs: e.target.value })} placeholder="e.g. 25000" /></Field>
            <Field label="PAN"><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} /></Field>
            <Field label="Account holder name"><Input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} /></Field>
            <Field label="Account number"><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></Field>
            <Field label="IFSC"><Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} /></Field>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
          <Button disabled={creating} onClick={save}>{creating ? "Saving…" : "Save"}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
