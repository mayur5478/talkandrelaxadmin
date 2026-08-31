# Admin Send Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admins a page to send a message into one listener's Notification Center feed, or broadcast to every listener, hitting the backend's `POST /admin/notifications/send`.

**Architecture:** Mirrors the Blocked-Mobiles feature shipped earlier this session verbatim — RTK Query mutation slice, a form modal, a page that triggers it, wired into `Main.jsx`'s routes and the sidebar nav config.

**Tech Stack:** React, Redux Toolkit Query, react-bootstrap (`Modal`/`Form`), the existing `v2/ui` component kit (`Card`, `Button`, etc.).

**Backend dependency:** This plan assumes `POST /admin/notifications/send` already exists (see the backend repo's `2026-08-31-notification-center.md` plan, Task 5). If it isn't deployed yet, the form will show a network/404 error on submit — nothing in this plan is blocked on the backend being live first to build against.

---

## Before you start

```bash
cd E:\Komal\Talk-and-Relex-Admin-panel-main\Talk-and-Relex-Admin-panel-main
git worktree add .worktrees/send-notification -b feat/send-notification main
cd .worktrees/send-notification
```

Read `src/services/blockedMobiles.js`, `src/components/common/block-mobile/BlockMobile.jsx`, and `src/components/blocked-mobiles/BlockedMobiles.jsx` in full before starting — every file in this plan mirrors one of those three.

This plan's listener picker is a **plain text input for the listener's ID** (not a searchable autocomplete) — matching Blocked-Mobiles' own simplicity (a raw mobile-number text field, no picker component). A nicer picker can be a follow-up; building one now would be scope creep beyond what was asked.

---

## Task 1: RTK Query slice

**Files:**
- Create: `src/services/notifications.js`

- [ ] **Step 1: Write the slice**

```jsx
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "../cookie_helper/cookie";

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SERVER_URL,
    prepareHeaders: (headers) => {
      const token = getCookie("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // POST send a notification — either { listenerId, title, body } for one
    // listener, or { broadcast: true, title, body } for every listener.
    sendNotification: builder.mutation({
      query: (payload) => ({
        url: `/admin/notifications/send`,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const { useSendNotificationMutation } = notificationsApi;
```

- [ ] **Step 2: Register in the store**

In `src/store/store.js`, find:

```jsx
import { blockedMobilesApi } from "../services/blockedMobiles";
```

Add immediately after it:

```jsx
import { notificationsApi } from "../services/notifications";
```

Find:

```jsx
    [blockedMobilesApi.reducerPath]: blockedMobilesApi.reducer,
```

Add immediately after it:

```jsx
    [notificationsApi.reducerPath]: notificationsApi.reducer,
```

Find:

```jsx
      blockedMobilesApi.middleware,
```

Add immediately after it:

```jsx
      notificationsApi.middleware,
```

- [ ] **Step 3: Verify**

Run: `npx eslint src/services/notifications.js src/store/store.js`
Expected: no new errors (pre-existing warnings in `store.js`, if any, are fine — don't fix unrelated ones).

- [ ] **Step 4: Commit**

```bash
git add src/services/notifications.js src/store/store.js
git commit -m "feat(send-notification): add RTK Query slice, register in store"
```

---

## Task 2: Send Notification form modal

**Files:**
- Create: `src/components/common/send-notification/SendNotification.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import "../coupen/coupen.scss";

function SendNotification({ show, onHide, onSubmit, isSubmitting }) {
  const [broadcast, setBroadcast] = useState(false);
  const [listenerId, setListenerId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  useEffect(() => {
    if (show) {
      setBroadcast(false);
      setListenerId("");
      setTitle("");
      setBody("");
      setConfirmBroadcast(false);
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (broadcast) {
      onSubmit({ broadcast: true, title: title.trim(), body: body.trim() });
    } else {
      onSubmit({ listenerId: listenerId.trim(), title: title.trim(), body: body.trim() });
    }
  };

  const canSubmit = broadcast
    ? title.trim() && body.trim() && confirmBroadcast
    : listenerId.trim() && title.trim() && body.trim();

  return (
    <Modal
      className="coupen-modal-main"
      show={show}
      onHide={onHide}
      size="md"
      centered
    >
      <Modal.Header closeButton>
        <p className="export-modal-title">Send a notification</p>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="text-start mb-3">
            <Form.Check
              type="switch"
              id="broadcast-switch"
              label="Broadcast to every listener"
              checked={broadcast}
              onChange={(e) => {
                setBroadcast(e.target.checked);
                setConfirmBroadcast(false);
              }}
            />
          </Form.Group>

          {!broadcast && (
            <Form.Group className="text-start mb-3">
              <Form.Label>Listener ID:</Form.Label>
              <Form.Control
                type="text"
                value={listenerId}
                onChange={(e) => setListenerId(e.target.value)}
                placeholder="Paste the listener's id"
                required
              />
            </Form.Group>
          )}

          <Form.Group className="text-start mb-3">
            <Form.Label>Title:</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maintenance tonight"
              required
            />
          </Form.Group>

          <Form.Group className="text-start mb-3">
            <Form.Label>Message:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. The app will be briefly unavailable at 2am."
              required
            />
          </Form.Group>

          {broadcast && (
            <Form.Group className="text-start mb-3">
              <Form.Check
                type="checkbox"
                id="confirm-broadcast"
                label="I understand this sends to every listener account"
                checked={confirmBroadcast}
                onChange={(e) => setConfirmBroadcast(e.target.checked)}
              />
            </Form.Group>
          )}

          <div className="excel-modal-btns mt-3">
            <Button className="red-btn" onClick={onHide}>
              Cancel
            </Button>
            <Button className="green-btn" type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? "Sending..." : broadcast ? "Broadcast" : "Send"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default SendNotification;
```

- [ ] **Step 2: Verify**

Run: `npx eslint src/components/common/send-notification/SendNotification.jsx`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/common/send-notification/SendNotification.jsx
git commit -m "feat(send-notification): add form modal"
```

---

## Task 3: Page + routing + nav entry

**Files:**
- Create: `src/components/send-notification/SendNotificationPage.jsx`
- Modify: `src/components/main/Main.jsx`
- Modify: `src/shell/nav-config.jsx`

- [ ] **Step 1: Write the page**

This page is deliberately simple — no list/table, since there's no "sent history" endpoint in this round's backend scope (only a send action). It's a header + a button that opens the modal, plus a success/error banner after each send.

```jsx
import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Card, Button } from "../v2/ui";

import { useSendNotificationMutation } from "../../services/notifications";
import SendNotification from "../common/send-notification/SendNotification";

function SendNotificationPage() {
  const [sendNotification, { isLoading }] = useSendNotificationMutation();
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const handleSend = async (payload) => {
    setFeedback(null);
    try {
      const result = await sendNotification(payload).unwrap();
      setFeedback({ type: "success", message: result?.message || "Notification sent" });
      setShowModal(false);
    } catch (error) {
      setFeedback({ type: "error", message: error?.data?.message || "Failed to send notification" });
    }
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-3">
        <div>
          <h1 className="tw-text-h1 tw-text-fg-primary tw-m-0">Notifications</h1>
          <p className="tw-text-small tw-text-fg-tertiary tw-mt-1 tw-mb-0">
            Push a message into a listener's notification feed, or broadcast to everyone
          </p>
        </div>
        <Button onClick={() => { setFeedback(null); setShowModal(true); }}>
          <Bell size={14} className="tw-mr-1" />
          Send a notification
        </Button>
      </div>

      <Card flush className="tw-p-4">
        {feedback ? (
          <p className={feedback.type === "success" ? "tw-text-fg-success" : "tw-text-fg-danger"}>
            {feedback.message}
          </p>
        ) : (
          <p className="tw-text-fg-tertiary">
            Use "Send a notification" to message a single listener or broadcast to all.
          </p>
        )}
      </Card>

      <SendNotification
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSend}
        isSubmitting={isLoading}
      />
    </div>
  );
}

export default SendNotificationPage;
```

- [ ] **Step 2: Register the route**

In `src/components/main/Main.jsx`, find:

```jsx
const BlockedMobiles      = lazy(() => import("../blocked-mobiles/BlockedMobiles"));
```

Add immediately after it:

```jsx
const SendNotificationPage = lazy(() => import("../send-notification/SendNotificationPage"));
```

Find:

```jsx
          <Route path="/blocked-mobiles" element={<BlockedMobiles />} />
```

Add immediately after it:

```jsx
          <Route path="/send-notification" element={<SendNotificationPage />} />
```

- [ ] **Step 3: Add the nav entry**

In `src/shell/nav-config.jsx`, find the `Ban` import (from `lucide-react`) and add `Bell` alongside it in the same import statement. Find:

```jsx
      { title: 'Blocked numbers',    path: '/dashboard/blocked-mobiles',              icon: Ban },
```

Add immediately after it:

```jsx
      { title: 'Notifications',      path: '/dashboard/send-notification',            icon: Bell },
```

- [ ] **Step 4: Verify**

Run: `npx eslint src/components/send-notification/SendNotificationPage.jsx src/components/main/Main.jsx src/shell/nav-config.jsx`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/send-notification/SendNotificationPage.jsx src/components/main/Main.jsx src/shell/nav-config.jsx
git commit -m "feat(send-notification): add page, route, and nav entry"
```

---

## Task 4: Build verification

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `npx react-scripts build`
Expected: exit code 0, only pre-existing eslint warnings (no new ones from the files this plan touched).

- [ ] **Step 2: Manual verification**

With the backend's `POST /admin/notifications/send` live: open the admin panel, go to the new "Notifications" nav entry, send a message to a real listener's id and confirm success feedback; then send a broadcast (after checking the confirm checkbox) and confirm the response's recipient count matches the number of `role:'listener'` accounts.
