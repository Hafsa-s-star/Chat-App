import "dotenv/config";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import { getJwtSecret } from "./src/middlewares/auth.middleware.js";

const port = Number(process.env.PORT) || 3000;
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigin, credentials: true },
});

io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const token = cookieHeader.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("token="))
      ?.slice("token=".length);
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const user = jwt.verify(decodeURIComponent(token), getJwtSecret());
    socket.data.userId = user.id;
    return next();
  } catch {
    return next(new Error("Invalid session"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);
});

app.set("io", io);

try {
  getJwtSecret();
  await connectDB();
  httpServer.listen(port, () => {
    console.log(`Chat API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Could not start chat server:", error.message);
  process.exitCode = 1;
}
