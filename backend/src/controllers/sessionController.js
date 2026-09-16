import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  let session = null;
  let call = null;
  let channel = null;

  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    const validProblems = {
      "Two Sum": "easy",
      "Reverse String": "easy",
      "Valid Palindrome": "easy",
      "Maximum Subarray": "medium",
      "Container With Most Water": "medium",
    };

    const normalizedDifficulty = difficulty.toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(validProblems, problem)) {
      return res.status(400).json({ message: "Invalid problem" });
    }

    if (validProblems[problem] !== normalizedDifficulty) {
      return res.status(400).json({ message: "Invalid difficulty for selected problem" });
    }

    // Generate a unique call ID for Stream Video.
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create the database session first.
    session = await Session.create({
      problem,
      difficulty: normalizedDifficulty,
      host: userId,
      callId,
    });

    // Create the Stream Video call.
    call = streamClient.video.call("default", callId);

    await call.getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: {
          problem,
          difficulty,
          sessionId: session._id.toString(),
        },
      },
    });

    // Create the Stream Chat channel.
    channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);

    // Roll back the database session if Stream setup failed.
    if (session) {
      try {
        await Session.findByIdAndDelete(session._id);
        console.log("Rolled back MongoDB session:", session._id.toString());
      } catch (rollbackError) {
        console.error(
          "Failed to roll back MongoDB session:",
          rollbackError.message
        );
      }
    }

    // Clean up Stream Video if it was created before the failure.
    if (call) {
      try {
        await call.delete({ hard: true });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Stream Video call:",
          cleanupError.message
        );
      }
    }

    // Clean up Stream Chat if it was created before the failure.
    if (channel) {
      try {
        await channel.delete();
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Stream Chat channel:",
          cleanupError.message
        );
      }
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findOneAndUpdate(
      {
        _id: id,
        status: "active",
        participant: null,
        host: { $ne: userId },
      },
      {
        $set: { participant: userId },
      },
      {
        new: true,
      }
    );

    if (!session) {
      const existingSession = await Session.findById(id);

      if (!existingSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (existingSession.status !== "active") {
        return res.status(400).json({ message: "Cannot join a completed session" });
      }

      if (existingSession.host.toString() === userId.toString()) {
        return res.status(400).json({
          message: "Host cannot join their own session as participant",
        });
      }

      if (existingSession.participant) {
        return res.status(409).json({ message: "Session is full" });
      }

      return res.status(409).json({ message: "Unable to join session" });
    }

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only the host can end the session.
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Only the host can end the session",
      });
    }

    // Check if session is already completed.
    if (session.status === "completed") {
      return res.status(400).json({
        message: "Session is already completed",
      });
    }

    // Mark the database session as completed first.
    session.status = "completed";
    await session.save();

    // Stream cleanup should not prevent the database state from being completed.
    try {
      const call = streamClient.video.call("default", session.callId);
      await call.delete({ hard: true });
    } catch (error) {
      console.error(
        "Failed to delete Stream Video call:",
        error.message
      );
    }

    try {
      const channel = chatClient.channel("messaging", session.callId);
      await channel.delete();
    } catch (error) {
      console.error(
        "Failed to delete Stream Chat channel:",
        error.message
      );
    }

    res.status(200).json({
      session,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
