// backend/routes/user.js
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */
const AVATAR_DIR = path.resolve("uploads/avatars");

// ensure upload dir exists
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// Multer storage (local disk)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext) ? ext : ".png";
    cb(null, `${req.user.id}-${Date.now()}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

// helper to make absolute URL from a possibly relative path
const toAbsolute = (req, url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

/* ----------------------------- Routes ------------------------------ */

// GET current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    const out = user.toObject();
    out.avatarUrl = toAbsolute(req, out.avatarUrl); // ensure absolute for client
    res.json(out);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// PATCH update profile (name, username, bio)
router.patch("/me", auth, async (req, res) => {
  try {
    const { name, username, bio } = req.body;

    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof bio === "string") updates.bio = bio.trim();

    if (typeof username === "string") {
      const clean = username.trim();
      const isValid = /^[a-zA-Z0-9_-]{3,20}$/.test(clean);
      if (!isValid) {
        return res
          .status(400)
          .json({ error: "Username must be 3-20 chars (letters, numbers, _ or -)." });
      }
      // ensure unique (ignore current user)
      const existing = await User.findOne({ username: clean.toLowerCase() });
      if (existing && String(existing._id) !== String(req.user.id)) {
        return res.status(409).json({ error: "Username already taken." });
      }
      updates.username = clean.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, select: "-password" }
    );

    const out = user.toObject();
    out.avatarUrl = toAbsolute(req, out.avatarUrl);
    res.json(out);
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST upload avatar (multipart/form-data, field name: "avatar")
router.post("/avatar", auth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // store relative path in DB, return absolute to client
    const relative = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findById(req.user.id);
    if (user?.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
      const oldPath = path.resolve("." + user.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
    }

    user.avatarUrl = relative;
    await user.save();

    res.json({ avatarUrl: toAbsolute(req, relative), relative });
  } catch (err) {
    console.error("Avatar upload error:", err.message);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

export default router;
