import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Get portfolio
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ portfolio: user.portfolio, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buy stock
router.post("/buy", auth, async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;
    const user = await User.findById(req.user.id);

    const cost = quantity * price;
    if (user.balance < cost) return res.status(400).json({ msg: "Insufficient balance" });

    // Deduct balance
    user.balance -= cost;

    // Check if stock already in portfolio
    const stock = user.portfolio.find((s) => s.symbol === symbol);
    if (stock) {
      // update avg price & qty
      const totalCost = stock.avgPrice * stock.quantity + cost;
      stock.quantity += quantity;
      stock.avgPrice = totalCost / stock.quantity;
    } else {
      user.portfolio.push({ symbol, quantity, avgPrice: price });
    }

    await user.save();
    res.json({ portfolio: user.portfolio, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sell stock
router.post("/sell", auth, async (req, res) => {
  try {
    const { symbol, quantity, price } = req.body;
    const user = await User.findById(req.user.id);

    const stock = user.portfolio.find((s) => s.symbol === symbol);
    if (!stock || stock.quantity < quantity)
      return res.status(400).json({ msg: "Not enough stock to sell" });

    // update qty
    stock.quantity -= quantity;
    user.balance += quantity * price;

    if (stock.quantity === 0) {
      user.portfolio = user.portfolio.filter((s) => s.symbol !== symbol);
    }

    await user.save();
    res.json({ portfolio: user.portfolio, balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add Balance (manual top-up)
router.post("/add-balance", auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const user = await User.findById(req.user.id); // 👈 FIXED here
    user.balance += amount;
    await user.save();

    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
