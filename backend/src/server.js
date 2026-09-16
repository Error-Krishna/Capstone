import express from "express";
import path from "path";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { deleteStreamUser, upsertStreamUser } from "./lib/stream.js";
import User from "./models/User.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware());

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.post("/api/webhooks/clerk", async (req, res) => {
  try {
    const evt = req.body;
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const userData = {
        clerkId: id,
        email: email_addresses?.[0]?.email_address || "",
        name: `\({first_name || ""}\){last_name || ""}`.trim() || "User",
        profileImage: image_url || "",
      };

      await User.findOneAndUpdate(
        { clerkId: id },
        { $set: userData },
        { new: true, upsert: true, runValidators: true }
      );

      await upsertStreamUser({
        id: id.toString(),
        name: userData.name,
        image: userData.profileImage,
      }).catch((err) => console.error("Stream upsert failed in webhook:", err.message));
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;
      await User.deleteOne({ clerkId: id });
      await deleteStreamUser(id.toString()).catch((err) =>
        console.error("Stream delete failed in webhook:", err.message)
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();