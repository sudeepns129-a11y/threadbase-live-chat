import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { io } from "socket.io-client";

export function useSocket(roomId) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const normalizedRoomId = typeof roomId === "string" ? roomId.trim() : "";

  useEffect(() => {
    setMessages([]);
    if (!token || !normalizedRoomId) {
      setSocket(null);
      return undefined;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:3001";
    const connection = io(socketUrl, { auth: { token } });
    const onMessage = (message) => {
      setMessages((previousMessages) => [...previousMessages, message]);
    };

    setSocket(connection);
    connection.on("chat:message", onMessage);
    connection.emit("room:join", normalizedRoomId);

    return () => {
      connection.off("chat:message", onMessage);
      connection.disconnect();
    };
  }, [token, normalizedRoomId]);

  const sendMessage = useCallback(
    (text) => {
      if (typeof text !== "string" || !text.trim()) return;
      socket?.emit("chat:message", { roomId: normalizedRoomId, text: text.trim() });
    },
    [socket, normalizedRoomId]
  );

  return { messages, sendMessage };
}
