import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/users.model.js";
import { getJwtSecret } from "../middlewares/auth.middleware.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function publicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createToken(user) {
  return jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: "7d" });
}

async function registerUser(req, res, next) {
  try {
    const body = req.body ?? {};
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;

    if (!username || username.length < 2 || username.length > 30) {
      return res.status(400).json({ message: "Username must be 2–30 characters." });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be 8–128 characters." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.create({ username, email, password: passwordHash });

    res.cookie("token", createToken(user), cookieOptions);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That username or email is already in use." });
    }
    return next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const body = req.body ?? {};
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = body.password;
    if (!identifier || typeof password !== "string") {
      return res.status(400).json({ message: "Enter your username or email and password." });
    }

    const user = await userModel.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() },
      ],
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect username/email or password." });
    }

    res.cookie("token", createToken(user), cookieOptions);
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Session user no longer exists." });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

function logoutUser(_req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.json({ message: "Signed out." });
}

export { registerUser, loginUser, getCurrentUser, logoutUser };
