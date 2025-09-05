import express from "express";
import yahooFinance from "yahoo-finance2";

const router = express.Router();

router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    console.log("Fetching history for:", symbol);

    const result = await yahooFinance.historical(symbol, {
      period1: "2024-01-01",
      period2: new Date(),
      interval: "1d",
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ msg: "No history data found" });
    }

    // Only send clean data
    const history = result.map((item) => ({
      date: item.date.toISOString().split("T")[0], // yyyy-mm-dd
      close: item.close,
    }));

    res.json(history);
  } catch (err) {
    console.error("History API error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
