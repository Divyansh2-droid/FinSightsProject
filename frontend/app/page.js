"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import NewsCard from "../components/NewsCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Market news state
  const [marketNews, setMarketNews] = useState([]);
  const [marketNewsLoading, setMarketNewsLoading] = useState(false);

  const API_BASE = "http://localhost:5000";

  // ---------- helpers ----------
  function deriveFromHistory(hist) {
    if (!Array.isArray(hist) || hist.length < 2) return null;
    const last = Number(hist[hist.length - 1]?.close);
    const prev = Number(hist[hist.length - 2]?.close);
    if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) return null;
    const change = last - prev;
    const changePercent = (change / prev) * 100;
    return { price: last, change, changePercent };
  }
  const fmtNum = (v, d = 2) =>
    Number.isFinite(Number(v)) ? Number(v).toFixed(d) : "—";
  const trendClass = (v) =>
    Number.isFinite(Number(v))
      ? Number(v) >= 0
        ? "text-emerald-400"
        : "text-red-400"
      : "text-gray-300";

  // helper to load general market news
  async function loadMarketNews() {
    try {
      setMarketNewsLoading(true);
      const res = await axios.get(`${API_BASE}/api/news`, {
        params: { q: "stock market" },
      });
      setMarketNews(res.data?.items ?? []);
    } catch (e) {
      console.error("market news error:", e);
      setMarketNews([]);
    } finally {
      setMarketNewsLoading(false);
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    loadMarketNews();
  }, []);

  const fetchStock = async () => {
    if (!symbol) return alert("⚠️ Please enter a stock symbol!");
    try {
      setLoading(true);

      // Current Price (Yahoo or your API)
      const res = await axios.get(`${API_BASE}/api/stock/${symbol}`);
      const apiStock = res.data || {};

      // Historical
      const histRes = await axios.get(`${API_BASE}/api/history/${symbol}`);
      const hist = histRes.data || [];
      setHistory(hist);

      // Derive metrics if API didn't provide them (or they are NaN/null)
      const derived = deriveFromHistory(hist);
      const price = Number.isFinite(Number(apiStock.price))
        ? Number(apiStock.price)
        : derived?.price ?? null;
      const change = Number.isFinite(Number(apiStock.change))
        ? Number(apiStock.change)
        : derived?.change ?? null;
      const changePercent = Number.isFinite(Number(apiStock.changePercent))
        ? Number(apiStock.changePercent)
        : derived?.changePercent ?? null;

      setStock({
        ...apiStock,
        price,
        change,
        changePercent,
      });

      // Symbol-specific News
      const newsRes = await axios.get(`${API_BASE}/api/news/${symbol}`);
      setNews(newsRes.data || []);

      // Smooth scroll to the stock card
      setTimeout(() => {
        document.querySelector("#stock-card")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("❌ Failed to fetch stock data. Check symbol or backend API.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleAddToWatchlist = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/watchlist/add`,
        { symbol },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      alert(`${symbol.toUpperCase()} added to Watchlist ✅`);
    } catch (err) {
      console.error("Watchlist error:", err);
      alert("❌ Failed to add stock to watchlist");
    }
  };

  return (
    <div
      className="relative min-h-dvh text-white"
      style={{
        backgroundImage:
          "url('https://4kwallpapers.com/images/walls/thumbs_3t/13833.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* subtle overlay for readability on mobile */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65 sm:from-black/35" />

      <Navbar user={user} handleLogout={handleLogout} />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        {/* Search Bar */}
        <section className="w-full">
          <div className="flex flex-col sm:flex-row gap-3 rounded-xl bg-white p-3 shadow backdrop-blur max-w-xl mx-auto">
            <input
              type="text"
              placeholder=" Enter Stock Symbol (e.g. AAPL, TSLA, RELIANCE)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchStock()}
              className="w-full rounded-lg bg-white px-4 py-2 text-black placeholder-gray-500
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
            />
            <button
              onClick={fetchStock}
              disabled={loading}
              className="min-h-10 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow
                         hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
        </section>

        {/* --- Stock Result FIRST --- */}
        {stock ? (
          <section
            id="stock-card"
            className="mt-8 sm:mt-10 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6 backdrop-blur mx-auto w-full max-w-3xl"
          >
            <header className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-yellow-400">
                {stock.symbol}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm sm:text-base">
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-gray-400">Price</div>
                  <div className="font-semibold">
                    {fmtNum(stock?.price)} {stock?.currency || ""}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-gray-400">Change</div>
                  <div className={`${trendClass(stock?.change)} font-semibold`}>
                    {fmtNum(stock?.change)}
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-gray-400">% Change</div>
                  <div className={`${trendClass(stock?.changePercent)} font-semibold`}>
                    {fmtNum(stock?.changePercent)}%
                  </div>
                </div>
              </div>
            </header>

            {/* Chart */}
            <div className="mt-5 rounded-lg border border-white/10 bg-black/30 p-3 h-56 sm:h-64 md:h-72">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" tick={{ fill: "#aaa", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#aaa", fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-gray-400">
                  No history data available 📉
                </div>
              )}
            </div>

            {/* Watchlist Button */}
            {user && (
              <div className="mt-4">
                <button
                  onClick={handleAddToWatchlist}
                  className="min-h-10 w-full rounded-lg bg-yellow-500 px-5 py-2 font-semibold text-black shadow
                             hover:bg-yellow-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
                >
                  ➕ Add to Watchlist
                </button>
              </div>
            )}

            {/* Symbol News Section */}
            {news.length > 0 && (
              <div className="mt-7">
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-blue-300">
                  📰 Latest News
                </h3>
                <ul className="space-y-3">
                  {news.map((article, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg bg-gray-700/80 p-3 shadow transition hover:bg-gray-700"
                    >
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-yellow-400 underline-offset-4 hover:underline
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded"
                      >
                        {article.title}
                      </a>
                      <p className="mt-1 text-xs sm:text-sm text-gray-300">
                        {article.source?.name || "Unknown Source"} —{" "}
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString()
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <p className="mx-auto mt-8 sm:mt-10 text-center text-gray-300">
            Enter a stock symbol to see details 📊
          </p>
        )}

        {/* --- Market News AFTER --- */}
        <section className="mt-8 sm:mt-10 rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6 backdrop-blur mx-auto w-full">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Market News &amp; Insights
              </h2>
              <p className="text-sm text-gray-400">
                Latest headlines about the broader market.
              </p>
            </div>
            <button
              onClick={loadMarketNews}
              className="hidden sm:inline-flex min-h-9 rounded-lg bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-60"
              disabled={marketNewsLoading}
            >
              {marketNewsLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {marketNewsLoading && (
            <p className="text-gray-400 text-sm">Loading market headlines…</p>
          )}

          {!marketNewsLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {marketNews.map((a, i) => (
                <NewsCard key={a.url || i} item={a} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
