import React, { useState } from "react";
import { Card, Table, THead, TBody, TR, Th, Td, TableSkeleton, Pill, ErrorBanner, Select, Field } from "../v2/ui";
import { useListBookingsQuery } from "../../services/counsellor";
import { BOOKING_STATUSES, bookingLabel, bookingTone, formatPaise, formatDateTime, isNotEnabled, errorMessage } from "./counsellorFormat";
import { NotEnabled, PageHeader } from "./CounsellorCommon";

export default function CounsellorBookings() {
  const [status, setStatus] = useState("");
  const [counsellorId, setCounsellorId] = useState("");
  const idFilter = /^\d+$/.test(counsellorId.trim()) ? counsellorId.trim() : "";
  const { data, isLoading, error } = useListBookingsQuery({ status, counsellorId: idFilter });

  if (isNotEnabled(error)) return <NotEnabled />;
  const bookings = (data && data.bookings) || [];

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-text-left">
      <PageHeader title="Bookings" subtitle="Counsellor sessions. Amounts are in rupees." />
      <div className="tw-flex tw-gap-3 tw-flex-wrap tw-items-end">
        <Field label="Status" className="tw-w-56">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{bookingLabel(s)}</option>)}
          </Select>
        </Field>
        <Field label="Counsellor ID" className="tw-w-40">
          <input
            className="tw-w-full tw-bg-bg-primary tw-text-fg-primary tw-border tw-border-hairline tw-border-tertiary tw-rounded-md tw-text-small tw-px-3 tw-py-2"
            inputMode="numeric" value={counsellorId} onChange={(e) => setCounsellorId(e.target.value)} placeholder="Any"
          />
        </Field>
      </div>
      {error ? <ErrorBanner title="Could not load bookings" message={errorMessage(error)} /> : null}
      <Card flush>
        {isLoading ? <TableSkeleton rows={6} cols={9} /> : (
          <Table>
            <THead>
              <TR>
                <Th>Booking</Th><Th>Counsellor</Th><Th>User</Th><Th>Mode</Th><Th>Starts</Th><Th>Status</Th><Th>Price</Th><Th>Counsellor share</Th><Th>Platform</Th><Th>Refund</Th>
              </TR>
            </THead>
            <TBody>
              {bookings.length === 0 ? (
                <TR><Td colSpan={10} className="tw-text-center tw-text-fg-tertiary">No bookings match.</Td></TR>
              ) : bookings.map((b, i) => (
                <TR key={b.id} isLast={i === bookings.length - 1}>
                  <Td className="tw-text-fg-primary tw-font-medium">#{b.id}</Td>
                  <Td>#{b.counsellorId}</Td>
                  <Td>#{b.userId}</Td>
                  <Td>{b.mode || "—"}{b.minutes ? ` · ${b.minutes} min` : ""}</Td>
                  <Td>{formatDateTime(b.startsAt)}</Td>
                  <Td><Pill tone={bookingTone(b.status)} dot>{bookingLabel(b.status)}</Pill></Td>
                  <Td>{formatPaise(b.pricePaise)}{b.paidVia ? <div className="tw-text-[11px] tw-text-fg-tertiary">{b.paidVia}</div> : null}</Td>
                  <Td>{formatPaise(b.counsellorPaise)}{b.releasedAt ? <div className="tw-text-[11px] tw-text-fg-tertiary">released</div> : null}</Td>
                  <Td>{formatPaise(b.platformPaise)}</Td>
                  <Td>{b.refundPaise ? formatPaise(b.refundPaise) : "—"}</Td>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
