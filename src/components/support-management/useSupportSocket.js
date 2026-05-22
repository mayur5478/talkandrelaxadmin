import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { getCookie } from "../../cookie_helper/cookie";
import { supportApi } from "../../services/support";

// REACT_APP_SERVER_URL points at the REST base (…/api/v2). Socket.IO attaches
// to the server origin, so strip the API path off.
const SOCKET_ORIGIN = (process.env.REACT_APP_SERVER_URL || "")
  .replace(/\/api\/v2\/?$/i, "")
  .replace(/\/+$/, "");

/**
 * Opens one authenticated Socket.IO connection for the support dashboard.
 * The backend auto-joins admin sockets to the "support_admins" room, so every
 * new ticket / message / status change arrives here. Each event invalidates
 * the relevant RTK Query tags, which triggers an automatic refetch.
 *
 * @param {string|null} activeTicketId  ticket currently open (joins its room)
 * @param {function}    onEvent         optional callback for toasts etc.
 */
export default function useSupportSocket(activeTicketId, onEvent) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Create the connection once.
  useEffect(() => {
    const token = getCookie("token");
    if (!token || !SOCKET_ORIGIN) return undefined;

    const socket = io(SOCKET_ORIGIN, {
      transports: ["websocket", "polling"],
      auth: { authorization: `Bearer ${token}` },
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    const handle = (eventName) => (data) => {
      dispatch(supportApi.util.invalidateTags(["SupportList", "SupportStats"]));
      const tid = data && data.ticketId;
      if (tid) {
        dispatch(
          supportApi.util.invalidateTags([{ type: "SupportTicket", id: tid }])
        );
      }
      if (typeof onEventRef.current === "function") {
        onEventRef.current(eventName, data);
      }
    };

    const onNew = handle("support:ticket:new");
    const onMsg = handle("support:message:new");
    const onUpd = handle("support:ticket:updated");

    socket.on("support:ticket:new", onNew);
    socket.on("support:message:new", onMsg);
    socket.on("support:ticket:updated", onUpd);

    return () => {
      socket.off("support:ticket:new", onNew);
      socket.off("support:message:new", onMsg);
      socket.off("support:ticket:updated", onUpd);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  // Join/leave the room for whichever ticket is open.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeTicketId) return undefined;

    const join = () => socket.emit("support:join", { ticketId: activeTicketId });
    if (socket.connected) join();
    socket.on("connect", join);

    return () => {
      socket.emit("support:leave", { ticketId: activeTicketId });
      socket.off("connect", join);
    };
  }, [activeTicketId]);
}
