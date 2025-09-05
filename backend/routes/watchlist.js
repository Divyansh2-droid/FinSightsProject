import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

const norm = (s) => (typeof s === "string" ? s.trim().toUpperCase() : "");

// GET /api/watchlist
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    // normalize when sending, just in case DB has mixed case
    const list = (user.watchlist || []).map(norm);
    if (JSON.stringify(list) !== JSON.stringify(user.watchlist)) {
      user.watchlist = list;
      await user.save();
    }

    res.json({ ok: true, watchlist: list });
  } catch (err) {
    console.error("Watchlist GET error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/watchlist/add  { symbol }
router.post("/add", auth, async (req, res) => {
  try {
    const symbol = norm(req.body?.symbol);
    if (!symbol) return res.status(400).json({ ok: false, error: "symbol required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const current = (user.watchlist || []).map(norm);
    if (!current.includes(symbol)) current.push(symbol);

    user.watchlist = current;
    await user.save();

    res.json({ ok: true, watchlist: current });
  } catch (err) {
    console.error("Watchlist ADD error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/watchlist/remove  { symbol }   (kept for compatibility)
router.post("/remove", auth, async (req, res) => {
  try {
    const symbol = norm(req.body?.symbol);
    if (!symbol) return res.status(400).json({ ok: false, error: "symbol required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const before = (user.watchlist || []).map(norm);
    const after = before.filter((s) => s !== symbol);

    user.watchlist = after;
    await user.save();

    res.json({ ok: true, watchlist: after });
  } catch (err) {
    console.error("Watchlist REMOVE error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// OPTIONAL: RESTful delete  /api/watchlist/:symbol
router.delete("/:symbol", auth, async (req, res) => {
  try {
    const symbol = norm(req.params.symbol);
    if (!symbol) return res.status(400).json({ ok: false, error: "symbol required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const before = (user.watchlist || []).map(norm);
    const after = before.filter((s) => s !== symbol);

    user.watchlist = after;
    await user.save();

    res.json({ ok: true, watchlist: after });
  } catch (err) {
    console.error("Watchlist DELETE error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
