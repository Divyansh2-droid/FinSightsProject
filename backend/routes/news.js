// backend/routes/news.js
import { Router } from "express";
import axios from "axios";
import requireAuth from "../middleware/auth.js"; // default export

const router = Router();

const BASE = "https://newsapi.org/v2";
const getApiKey = () => process.env.NEWS_API_KEY;

// ---- tiny in-memory cache ----
const cache = new Map();
function setCache(key, data, ttlMs = 5 * 60 * 1000) {
  cache.set(key, { data, exp: Date.now() + ttlMs });
}
function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

// ---- helpers ----
const clip = (s, n = 220) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
const naiveSentiment = (t = "") => {
  const up = /beat|surge|rally|record|upgrade|outperform|profit|growth|soar/i.test(t);
  const down = /miss|fall|plunge|downgrade|loss|warning|fraud|probe|slump/i.test(t);
  if (up && !down) return "bullish";
  if (down && !up) return "bearish";
  return "neutral";
};
const normalize = (a) => ({
  id: `${a.source?.id || a.source?.name}-${a.publishedAt}-${a.title}`.replace(/\s+/g, ""),
  title: a.title,
  url: a.url,
  imageUrl: a.urlToImage || "",
  source: a.source?.name || "News",
  publishedAt: a.publishedAt,
  summary: clip(a.description || a.content || ""),
  sentiment: naiveSentiment(`${a.title} ${a.description || ""}`),
});

function ensureApiKey(res) {
  const k = getApiKey();
  if (!k) {
    res.status(500).json({ ok: false, error: "NEWS_API_KEY missing in backend/.env" });
    return null;
  }
  return k;
}

function handleAxiosError(err, res, fallback = "failed_to_fetch_news") {
  const status = err.response?.status || 500;
  const msg = err.response?.data?.message || err.message || fallback;
  res.status(status).json({ ok: false, error: msg });
}

// -------- fetchers --------
async function fetchEverything({ q, page = 1, pageSize = 10, apiKey }) {
  const key = `everything:${q}:${page}:${pageSize}`;
  const cached = getCache(key);
  if (cached) return cached;

  const { data } = await axios.get(`${BASE}/everything`, {
    params: {
      q,
      sortBy: "publishedAt",
      language: "en",
      page,
      pageSize,
      apiKey,
    },
  });
  const items = (data?.articles || []).map(normalize);
  setCache(key, items);
  return items;
}

async function fetchBusiness({ page = 1, pageSize = 10, country, apiKey }) {
  const key = `business:${country || "global"}:${page}:${pageSize}`;
  const cached = getCache(key);
  if (cached) return cached;

  const params = {
    category: "business",
    language: "en",
    page,
    pageSize,
    apiKey,
  };
  if (country) params.country = country;

  const { data } = await axios.get(`${BASE}/top-headlines`, { params });
  const items = (data?.articles || []).map(normalize);
  setCache(key, items);
  return items;
}

// ---------------- ROUTES ----------------

// GET /api/news?q=...&page=&pageSize=&country=
router.get("/", async (req, res) => {
  const apiKey = ensureApiKey(res);
  if (!apiKey) return;

  try {
    const { q, page = "1", pageSize = "10", country } = req.query;
    const pg = Number(page) || 1;
    const ps = Math.min(Number(pageSize) || 10, 50);

    const items = q
      ? await fetchEverything({ q, page: pg, pageSize: ps, apiKey })
      : await fetchBusiness({ page: pg, pageSize: ps, country, apiKey });

    res.json({ ok: true, items });
  } catch (err) {
    console.error("[news]/ ::", err?.response?.data || err.message);
    handleAxiosError(err, res);
  }
});

// GET /api/news/by-symbol/:symbol
router.get("/by-symbol/:symbol", async (req, res) => {
  const apiKey = ensureApiKey(res);
  if (!apiKey) return;

  try {
    const { symbol } = req.params;
    const { page = "1", pageSize = "10" } = req.query;
    const q = `"${symbol}" OR ${symbol}`;
    const items = await fetchEverything({
      q,
      page: Number(page) || 1,
      pageSize: Math.min(Number(pageSize) || 10, 50),
      apiKey,
    });
    res.json({ ok: true, items });
  } catch (err) {
    console.error("[news]/by-symbol ::", err?.response?.data || err.message);
    handleAxiosError(err, res);
  }
});

// GET /api/news/watchlist  (auth)
router.get("/watchlist", requireAuth, async (req, res) => {
  const apiKey = ensureApiKey(res);
  if (!apiKey) return;

  try {
    const syms = (req.user?.watchlist || []).slice(0, 10);
    if (!syms.length) return res.json({ ok: true, items: [] });

    const q = syms.map((s) => `"${s}"`).join(" OR ");
    const items = await fetchEverything({ q, page: 1, pageSize: 20, apiKey });
    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    res.json({ ok: true, items });
  } catch (err) {
    console.error("[news]/watchlist ::", err?.response?.data || err.message);
    handleAxiosError(err, res);
  }
});

// Legacy: GET /api/news/:symbol  -> top 5
router.get("/:symbol", async (req, res) => {
  const apiKey = ensureApiKey(res);
  if (!apiKey) return;

  try {
    const { symbol } = req.params;
    const key = `legacy:${symbol}`;
    const cached = getCache(key);
    if (cached) return res.json(cached.slice(0, 5));

    const { data } = await axios.get(`${BASE}/everything`, {
      params: {
        q: symbol,
        sortBy: "publishedAt",
        language: "en",
        page: 1,
        pageSize: 5,
        apiKey,
      },
    });

    const items = (data?.articles || []).map(normalize);
    setCache(key, items, 2 * 60 * 1000);
    res.json(items.slice(0, 5));
  } catch (err) {
    console.error("[news]/:symbol ::", err?.response?.data || err.message);
    handleAxiosError(err, res);
  }
});

export default router;
