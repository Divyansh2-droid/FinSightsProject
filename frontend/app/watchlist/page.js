"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Navbar from "../../components/Navbar";

const API_BASE = "http://localhost:5000";
const tokenHeader = () => ({ headers: { "x-auth-token": localStorage.getItem("token") } });
const asArray = (payload) =>
  Array.isArray(payload) ? payload :
  Array.isArray(payload?.watchlist) ? payload.watchlist :
  [];

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [removing, setRemoving] = useState({}); // { AAPL: true }

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/watchlist`, tokenHeader());
        // accept either [] or { ok, watchlist: [] }
        setWatchlist(asArray(res.data).map((s) => String(s).toUpperCase()));
      } catch (err) {
        console.error("Error fetching watchlist:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const removeStock = async (symbolRaw) => {
    const symbol = String(symbolRaw).toUpperCase();
    if (removing[symbol]) return; // prevent double click
    setRemoving((m) => ({ ...m, [symbol]: true }));

    // optimistic UI
    setWatchlist((prev) => prev.filter((s) => s !== symbol));

    try {
      const res = await axios.post(
        `${API_BASE}/api/watchlist/remove`,
        { symbol },
        tokenHeader()
      );
      const next = asArray(res.data).map((s) => String(s).toUpperCase());
      if (next.length) setWatchlist(next);
    } catch (err) {
      console.error("Error removing stock:", err?.response?.data || err.message);
      alert("❌ Failed to remove from watchlist");
      // rollback (re-add only if missing)
      setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
    } finally {
      setRemoving((m) => ({ ...m, [symbol]: false }));
    }
  };

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

      <main className="relative z-10 pt-20 sm:pt-24 pb-16 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-400 mb-6 sm:mb-8 drop-shadow">
          ⭐ My Watchlist
        </h1>

        {loading ? (
          <p className="text-gray-300">Loading...</p>
        ) : watchlist.length > 0 ? (
          <ul className="space-y-3 sm:space-y-4 w-full">
            {watchlist.map((symbol) => (
              <li
                key={symbol}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4
                           rounded-lg bg-gray-800/80 backdrop-blur px-4 sm:px-6 py-3
                           shadow transition hover:bg-gray-700/90"
              >
                <Link
                  href={`/stocks/${symbol}`}
                  className="text-base sm:text-lg font-semibold underline-offset-4 hover:underline
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  title={`Open ${symbol} details`}
                >
                  {symbol}
                </Link>

                <div className="sm:ml-auto">
                  <button
                    onClick={() => removeStock(symbol)}
                    disabled={!!removing[symbol]}
                    className="min-h-10 rounded bg-red-600 px-3 sm:px-4 py-2 text-sm font-medium shadow
                               hover:bg-red-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                  >
                    {removing[symbol] ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-300">No stocks in your watchlist yet.</p>
        )}
      </main>
    </div>
  );
}
