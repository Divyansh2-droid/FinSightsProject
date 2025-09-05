"use client";
import { useMemo, useState } from "react";

function sortRows(rows, sortKey, dir) {
  const mul = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const A = a[sortKey];
    const B = b[sortKey];
    if (typeof A === "number" && typeof B === "number") return (A - B) * mul;
    return String(A ?? "").localeCompare(String(B ?? "")) * mul;
  });
}

export default function MarketsTable({ rows = [] }) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("symbol");
  const [dir, setDir] = useState("asc");

  const filtered = useMemo(() => {
    const f = rows.filter(
      (r) =>
        r.symbol.toLowerCase().includes(q.toLowerCase()) ||
        (r.name || "").toLowerCase().includes(q.toLowerCase())
    );
    return sortRows(f, sortKey, dir);
  }, [rows, q, sortKey, dir]);

  const HeaderCell = ({ label, k, align = "left", className = "" }) => (
    <th
      onClick={() => {
        if (sortKey === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSortKey(k);
          setDir("asc");
        }
      }}
      className={`px-3 py-2 text-sm font-semibold cursor-pointer select-none ${className} ${align === "right" ? "text-right" : "text-left"}`}
      title="Click to sort"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && <span className="text-xs opacity-70">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
      <div className="flex items-center gap-3 p-3 border-b border-white/10">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search symbol or company…"
          className="w-full rounded-lg bg-white/90 text-black px-3 py-2 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-gray-300">
              <HeaderCell label="Company Name" k="name" className="min-w-[220px]" />
              <HeaderCell label="Symbol" k="symbol" className="min-w-[90px]" />
              <HeaderCell label="Current Price" k="price" align="right" />
              <HeaderCell label="Price Movement" k="change" align="right" />
              <HeaderCell label="% Change" k="changePercent" align="right" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const up = Number(r.change) >= 0;
              const pUp = Number(r.changePercent) >= 0;
              return (
                <tr
                  key={r.symbol}
                  className="border-t border-white/5 hover:bg-white/5 transition"
                >
                  <td className="px-3 py-2">{r.name || "—"}</td>
                  <td className="px-3 py-2 font-semibold">{r.symbol}</td>
                  <td className="px-3 py-2 text-right">{Number.isFinite(+r.price) ? (+r.price).toFixed(2) : "—"}</td>
                  <td className={`px-3 py-2 text-right ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {Number.isFinite(+r.change) ? (+r.change).toFixed(2) : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right ${pUp ? "text-emerald-400" : "text-red-400"}`}>
                    {Number.isFinite(+r.changePercent) ? (+r.changePercent).toFixed(2) : "—"}%
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
