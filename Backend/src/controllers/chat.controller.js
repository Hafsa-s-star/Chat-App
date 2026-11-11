import mongoose from "mongoose";
import messageModel from "../models/message.model.js";
import userModel from "../models/users.model.js";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function publicMessage(message) {
  return {
    _id: message._id,
    sender: message.sender,
    recipient: message.recipient,
    text: message.text,
    createdAt: message.createdAt,
  };
}

async function getUsers(req, res, next) {
  try {
    const filter = {};
    const search = req.query.search?.trim();
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.username = { $regex: escapedSearch, $options: "i" };
    }

    const users = await userModel.find(filter)
      .select("_id username email createdAt")
      .sort({ username: 1 })
      .lean();

    const otherUserIds = users
      .filter((user) => String(user._id) !== String(req.user.id))
      .map((user) => user._id);
    const latestMessages = await messageModel.find({
      $or: [
        { sender: req.user.id, recipient: { $in: otherUserIds } },
        { recipient: req.user.id, sender: { $in: otherUserIds } },
      ],
    }).sort({ createdAt: -1 }).lean();

    const latestByUser = new Map();
    for (const message of latestMessages) {
      const otherUserId = String(message.sender) === String(req.user.id)
        ? String(message.recipient)
        : String(message.sender);
      if (!latestByUser.has(otherUserId)) {
        latestByUser.set(otherUserId, publicMessage(message));
      }
    }

    return res.json({
      users: users.map((user) => ({
        ...user,
        isSelf: String(user._id) === String(req.user.id),
        lastMessage: latestByUser.get(String(user._id)) ?? null,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function getMessages(req, res, next) {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const otherUser = await userModel.exists({ _id: userId });
    if (!otherUser || String(userId) === String(req.user.id)) {
      return res.status(404).json({ message: "User not found." });
    }

    const messages = await messageModel.find({
      $or: [
        { sender: req.user.id, recipient: userId },
        { sender: userId, recipient: req.user.id },
      ],
    }).sort({ createdAt: -1 }).limit(100).lean();

    return res.json({ messages: messages.reverse().map(publicMessage) });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { userId } = req.params;
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!isValidId(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    if (!text || text.length > 4000) {
      return res.status(400).json({ message: "Message must be 1–4000 characters." });
    }
    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot message yourself." });
    }
    const recipientExists = await userModel.exists({ _id: userId });
    if (!recipientExists) {
      return res.status(404).json({ message: "User not found." });
    }

    const message = await messageModel.create({
      sender: req.user.id,
      recipient: userId,
      text,
    });
    const result = publicMessage(message.toObject());
    const io = req.app.get("io");
    io.to(`user:${req.user.id}`).to(`user:${userId}`).emit("message:new", result);
    return res.status(201).json({ message: result });
  } catch (error) {
    return next(error);
  }
}

export { getUsers, getMessages, sendMessage };
