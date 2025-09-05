"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Navbar from "../../../components/Navbar";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function StockDetailPage() {
  const { symbol } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [quote, setQuote] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (!symbol) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`, {
          headers: { "x-auth-token": localStorage.getItem("token") || "" },
        });

        const q = res.data?.quote || null;
        const hist = res.data?.series || [];

        setQuote(q);
        const points = hist.map((d) => ({
          date: new Date(d.date).toLocaleDateString(undefined, {
            month: "short",
            day: "2-digit",
          }),
          close: d.close,
        }));
        setSeries(points);
      } catch (e) {
        setErr(e?.response?.data?.error || "Failed to load stock data");
      } finally {
        setLoading(false);
      }
    })();
  }, [symbol]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-black text-white">
      <Navbar user={user} handleLogout={handleLogout} />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12">
        {/* Breadcrumb */}
        <nav className="mb-5 sm:mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs sm:text-sm text-gray-400">
          <Link href="/watchlist" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded px-1 -mx-1">
            ← Back to Watchlist
          </Link>
          <span className="hidden sm:inline">/</span>
          <span className="uppercase text-gray-300">{String(symbol)}</span>
        </nav>

        {loading && <p className="text-gray-400">Loading…</p>}
        {err && <p className="text-red-400">{err}</p>}

        {quote && (
          <section className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {/* Left: header + chart */}
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur">
              <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {quote.name || quote.symbol}{" "}
                    <span className="text-gray-400">({quote.symbol})</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {quote.exchange || ""}{quote.currency ? ` • ${quote.currency}` : ""}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {quote.price != null ? Number(quote.price).toLocaleString() : "-"}
                    {quote.currency ? ` ${quote.currency}` : ""}
                  </div>
                  <div
                    className={`text-xs sm:text-sm ${
                      Number(quote.change) >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {quote.change != null ? Number(quote.change).toFixed(2) : "-"} (
                    {quote.changePercent != null ? Number(quote.changePercent).toFixed(2) : "-"}%)
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="mt-2 h-56 sm:h-64 md:h-72 rounded-lg border border-white/10 bg-black/30 p-3">
                {series.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopOpacity={0.45} />
                          <stop offset="100%" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeOpacity={0.08} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={["dataMin", "dataMax"]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="close" strokeWidth={2} fill="url(#p)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid h-full place-items-center text-gray-400">No chart data</div>
                )}
              </div>
            </div>

            {/* Right: stats */}
            <aside className="space-y-3 sm:space-y-4">
              <Card title="Day">
                <Stat label="Open" value={quote.open} />
                <Stat label="High" value={quote.high} />
                <Stat label="Low" value={quote.low} />
                <Stat label="Prev Close" value={quote.prevClose} />
                <Stat
                  label="Volume"
                  value={quote.volume != null ? Number(quote.volume).toLocaleString() : "-"}
                />
              </Card>

              <Card title="Meta">
                <Stat label="Exchange" value={quote.exchange} />
                <Stat label="Currency" value={quote.currency} />
                <Stat label="Symbol" value={quote.symbol} />
              </Card>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">{title}</h2>
      <div className="grid grid-cols-2 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <>
      <span className="text-gray-400">{label}</span>
      <span className="text-white/90">{value ?? "-"}</span>
    </>
  );
}
