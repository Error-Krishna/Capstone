import { verifyToken } from "@clerk/express";
import { ENV } from "../lib/env.js";
import User from "../models/User.js";
import Session from "../models/Session.js";

export function setupCollaboration(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const verifiedToken = await verifyToken(token, {
        secretKey: ENV.CLERK_SECRET_KEY,
      });

      const clerkId = verifiedToken?.sub;

      if (!clerkId) {
        return next(new Error("Invalid authentication token"));
      }

      const user = await User.findOne({ clerkId });

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Collaboration socket connected: ${socket.user.clerkId}`);

    socket.on("join-session", async (sessionId, callback) => {
      try {
        const session = await Session.findById(sessionId);

        if (!session) {
          return callback?.({
            success: false,
            message: "Session not found",
          });
        }

        const userId = socket.user._id.toString();

        const isHost = session.host.toString() === userId;
        const isParticipant =
          session.participant?.toString() === userId;

        if (!isHost && !isParticipant) {
          return callback?.({
            success: false,
            message: "You are not a member of this session",
          });
        }

        if (session.status !== "active") {
          return callback?.({
            success: false,
            message: "Session is no longer active",
          });
        }

        const room = `session:${sessionId}`;

        socket.join(room);
        socket.sessionId = sessionId;

        callback?.({
          success: true,
        });

        console.log(
          `User ${socket.user.clerkId} joined collaboration room ${room}`
        );
      } catch (error) {
        console.error("Error joining collaboration session:", error);

        callback?.({
          success: false,
          message: "Unable to join collaboration session",
        });
      }
    });

    socket.on("code-change", ({ sessionId, code }) => {
      console.log(
        `Code change received from ${socket.user.clerkId} for session ${sessionId}`
      );

      if (!socket.sessionId || socket.sessionId !== sessionId) {
        console.log("Rejected code change: socket is not in this session");
        return;
      }

      const room = `session:${sessionId}`;

      console.log(`Broadcasting code update to room ${room}`);

      socket.to(room).emit("code-update", {
        code,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Collaboration socket disconnected: ${socket.user.clerkId} (${reason})`
      );
    });
  });
}
