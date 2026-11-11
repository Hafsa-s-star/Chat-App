import express from "express";
import { getMessages, getUsers, sendMessage } from "../controllers/chat.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/users", getUsers);
router.get("/messages/:userId", getMessages);
router.post("/messages/:userId", sendMessage);

export default router;
