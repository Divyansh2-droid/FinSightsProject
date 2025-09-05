"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import MarketsTable from "../../components/MarketsTable";

const API_BASE = "http://localhost:5000";

// presets you can tweak freely
const PRESETS = {
  us: {
    label: "US",
    symbols: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "NFLX", "INTC"],
  },
  in: {
    label: "India",
    symbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "SBIN", "BHARTIARTL", "ITC", "LT"],
  },
};

function deriveFromHistory(hist = []) {
  if (!Array.isArray(hist) || hist.length < 2) return null;
  const last = Number(hist[hist.length - 1]?.close);
  const prev = Number(hist[hist.length - 2]?.close);
  if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) return null;
  const change = last - prev;
  const changePercent = (change / prev) * 100;
  return { price: last, change, changePercent };
}

// Try a symbol candidate (e.g., "RELIANCE.NS"); return {q,h} or throw
async function fetchQuoteAndHistory(candidate) {
  const [qRes, hRes] = await Promise.all([
    axios.get(`${API_BASE}/api/stock/${candidate}`),
    axios.get(`${API_BASE}/api/history/${candidate}`),
  ]);
  return { q: qRes.data || {}, h: hRes.data || [] };
}

export default function MarketsPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("us");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const symbols = useMemo(() => PRESETS[tab].symbols, [tab]);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  async function fetchRow(symbol) {
    // When in India tab, prefer Yahoo NSE suffix ".NS"
    const candidates = tab === "in" ? [`${symbol}.NS`, symbol] : [symbol];

    let data = null;
    for (const c of candidates) {
      try {
        data = await fetchQuoteAndHistory(c);
        break; // success
      } catch (e) {
        // try next candidate
      }
    }

    if (!data) {
      console.error("quote error", symbol);
      return { symbol, name: symbol, price: null, change: null, changePercent: null };
    }

    const { q, h } = data;
    const d = deriveFromHistory(h) || {};
    const price = Number.isFinite(+q.price) ? +q.price : d.price ?? null;
    const change = Number.isFinite(+q.change) ? +q.change : d.change ?? null;
    const changePercent = Number.isFinite(+q.changePercent) ? +q.changePercent : d.changePercent ?? null;

    return {
      symbol,
      name: q.name || q.longName || q.shortName || symbol,
      price,
      change,
      changePercent,
    };
  }

  async function load() {
    setLoading(true);
    try {
      const data = await Promise.all(symbols.map(fetchRow));
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div
      className="relative min-h-dvh text-white"
      style={{
        backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/13833.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65 sm:from-black/35" />
      <Navbar user={user} handleLogout={handleLogout} />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">Markets</h1>
          <div className="flex gap-2">
            {Object.keys(PRESETS).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${tab === k ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
              >
                {PRESETS[k].label}
              </button>
            ))}
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        <MarketsTable rows={rows} />
      </main>
    </div>
  );
}
