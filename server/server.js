import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { verifyToken } from "./middleware/auth.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Demo users - log in as either to test chat in two windows.
const USERS = [
  { userId: 1, name: "Ada", email: "ada@threadbase.dev", password: "password" },
  { userId: 2, name: "Linus", email: "linus@threadbase.dev", password: "password" },
];

// POST /auth/login -> { accessToken, user }
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const found = USERS.find((u) => u.email === email && u.password === password);
  if (!found) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = jwt.sign(
    { userId: found.userId, name: found.name },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.json({ accessToken, user: { userId: found.userId, name: found.name } });
});

// A normal protected route (unchanged, uses the HTTP verifyToken).
app.get("/api/me", verifyToken, (req, res) => res.json({ user: req.user }));

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !token) {
    return next(new Error("Authentication token required"));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (
      typeof user !== "object" ||
      user === null ||
      (typeof user.userId !== "number" && typeof user.userId !== "string") ||
      typeof user.name !== "string"
    ) {
      return next(new Error("Invalid token"));
    }

    socket.data.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.on("room:join", (roomId) => {
    if (typeof roomId !== "string" || !roomId.trim() || roomId.length > 128) {
      socket.emit("chat:error", { error: "Invalid room ID" });
      return;
    }
    socket.join(roomId.trim());
  });

  socket.on("chat:message", (payload) => {
    const { roomId, text } = payload ?? {};
    if (
      typeof roomId !== "string" ||
      !roomId.trim() ||
      roomId.length > 128 ||
      !socket.rooms.has(roomId.trim())
    ) {
      socket.emit("chat:error", { error: "Join a valid room before sending messages" });
      return;
    }
    if (typeof text !== "string" || !text.trim() || text.length > 2000) {
      socket.emit("chat:error", { error: "Message must be between 1 and 2000 characters" });
      return;
    }

    const user = socket.data.user;
    io.to(roomId.trim()).emit("chat:message", {
      id: randomUUID(),
      roomId: roomId.trim(),
      text: text.trim(),
      user: user.name,
      userId: user.userId,
      timestamp: new Date().toISOString(),
    });
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
  console.log("  POST /auth/login");
  console.log("  Socket.io: authenticated room chat ready");
});
