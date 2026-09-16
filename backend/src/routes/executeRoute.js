import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { executeCode } from "../controllers/executeController.js";

const router = express.Router();

router.post("/", protectRoute, executeCode);

export default router;
