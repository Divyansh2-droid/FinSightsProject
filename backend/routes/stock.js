import express from "express";
import yahooFinance from "yahoo-finance2";

const router = express.Router();

// GET /api/stock/:symbol
router.get("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    console.log("📡 Fetching quote for:", symbol);

    // 1) Current quote
    const quote = await yahooFinance.quote(symbol);

    // 2) Last 6 months of daily candles
    const period2 = new Date();
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6);

    const history = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval: "1d",
    });

    res.json({
      quote: {
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        prevClose: quote.regularMarketPreviousClose,
        volume: quote.regularMarketVolume,
        currency: quote.currency,
        exchange: quote.fullExchangeName,
      },
      series: history.map((h) => ({
        date: h.date,
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume,
      })),
    });
  } catch (err) {
    console.error("❌ Stock API error:", err.message);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

export default router;
