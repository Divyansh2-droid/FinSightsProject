"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);

  // Buy/Sell form
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [action, setAction] = useState("buy");

  // Add balance
  const [addAmount, setAddAmount] = useState("");

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/portfolio", {
        headers: { "x-auth-token": localStorage.getItem("token") },
      });
      setPortfolio(res.data.portfolio || []);
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchPortfolio();
  }, []);

  const handleTransaction = async () => {
    try {
      const endpoint = `http://localhost:5000/api/portfolio/${action}`;
      const res = await axios.post(
        endpoint,
        {
          symbol: symbol.toUpperCase(),
          quantity: Number(quantity),
          price: Number(price),
        },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setPortfolio(res.data.portfolio);
      setBalance(res.data.balance);
      setSymbol("");
      setQuantity("");
      setPrice("");
    } catch (err) {
      console.error("Transaction error:", err.response?.data || err.message);
      alert("❌ " + (err.response?.data?.msg || "Transaction failed"));
    }
  };

  const handleAddBalance = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/portfolio/add-balance",
        { amount: Number(addAmount) },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setBalance(res.data.balance);
      setAddAmount("");
      alert("✅ Balance added successfully!");
    } catch (err) {
      console.error("Add balance error:", err.response?.data || err.message);
      alert("❌ Failed to add balance: " + (err.response?.data?.msg || err.message));
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
        backgroundImage:
          "url('https://4kwallpapers.com/images/walls/thumbs_3t/13833.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* overlay for readability */}
      <div className="absolute inset-0 bg-black/50 sm:bg-black/40" />

      <Navbar user={user} handleLogout={handleLogout} />

      {/* match profile page spacing */}
      <main id="main" className="relative z-10 pt-16 md:pt-20 pb-16">
        {/* centered container like profile */}
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* page title like profile */}
          <div className="mb-6 sm:mb-8 flex items-center gap-3">
            <span className="text-4xl sm:text-5xl">💼</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-indigo-400">
              My Portfolio
            </h1>
          </div>

          {/* MAIN GLASS CARD (same vibe as profile) */}
          <section className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md shadow-xl">
            {/* top row: balance + add */}
            <div className="p-5 sm:p-6 md:p-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <p className="text-lg sm:text-xl font-semibold">
                  Balance:{" "}
                  <span className="font-extrabold text-green-400">
                    ₹{Number(balance).toFixed(2)}
                  </span>
                </p>
              </div>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <input
                  type="number"
                  placeholder="Enter amount to add"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full sm:w-72 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/60 focus:ring-2 focus:ring-yellow-400/60"
                />
                <button
                  onClick={handleAddBalance}
                  className="whitespace-nowrap rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black shadow hover:bg-yellow-600 focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  ➕ Add
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-white/10" />

            {/* content grid: left = trade; right = holdings + pie */}
            <div className="p-5 sm:p-6 md:p-7">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trade card */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6 shadow">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <h2 className="text-xl font-semibold">Trade Stocks</h2>
                  </div>

                  <div className="space-y-3">
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Stock Symbol (e.g. AAPL)"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/60 focus:ring-2 focus:ring-blue-500/50"
                    />

                    <input
                      type="number"
                      placeholder="Quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/60 focus:ring-2 focus:ring-blue-500/50"
                    />

                    <input
                      type="number"
                      placeholder="Price per stock"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/60 focus:ring-2 focus:ring-blue-500/50"
                    />

                    <button
                      onClick={handleTransaction}
                      className={`mt-1 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white shadow focus-visible:ring-2 ${
                        action === "buy"
                          ? "bg-green-600 hover:bg-green-700 focus-visible:ring-green-400/70"
                          : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400/70"
                      }`}
                    >
                      {action === "buy" ? "Buy" : "Sell"}
                    </button>
                  </div>
                </div>

                {/* Right column: Holdings + Pie chart stacked */}
                <div className="flex flex-col gap-6">
                  {/* Holdings */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6 shadow">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-2xl">📑</span>
                      <h2 className="text-xl font-semibold">My Holdings</h2>
                    </div>

                    {portfolio.length === 0 ? (
                      <p className="text-sm text-white/70">No holdings yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Symbol</th>
                              <th className="px-4 py-2 text-right font-medium">Quantity</th>
                              <th className="px-4 py-2 text-right font-medium">Avg Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolio.map((stock, i) => (
                              <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                                <td className="px-4 py-2">{stock.symbol}</td>
                                <td className="px-4 py-2 text-right">{stock.quantity}</td>
                                <td className="px-4 py-2 text-right">₹{stock.avgPrice}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Pie chart */}
                  {portfolio.length > 0 && (
                    <div className="h-72 rounded-2xl border border-white/10 bg-black/40 p-4 shadow">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={portfolio}
                            dataKey="quantity"
                            nameKey="symbol"
                            outerRadius="80%"
                          >
                            {portfolio.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={
                                  ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa", "#34d399"][
                                    idx % 6
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
