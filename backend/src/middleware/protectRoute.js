import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { chatClient, streamClient } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) {
        return res.status(401).json({ message: "Unauthorized - invalid token" });
      }

      let user = await User.findOne({ clerkId });

      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);

        const primaryEmail =
          clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          "";

        const name =
          `\({clerkUser.firstName || ""}\){clerkUser.lastName || ""}`.trim() ||
          clerkUser.username ||
          "User";
        console.log("USERNAME", name);
        const profileImage = clerkUser.imageUrl || "";

        user = await User.create({
          clerkId,
          email: primaryEmail,
          name,
          profileImage,
        });

        await Promise.all([
          streamClient.upsertUsers([
            {
              id: clerkId,
              name,
              image: profileImage,
            },
          ]),
          chatClient.upsertUsers([
            {
              id: clerkId,
              name,
              image: profileImage,
            },
          ]),
        ]).catch((err) => {
          console.error("Stream upsert warning in protectRoute:", err.message);
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];