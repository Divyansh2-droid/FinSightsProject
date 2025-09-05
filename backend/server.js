// backend/server.js

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import mongoose from "mongoose";


import cors from "cors";

import authRoutes from "./routes/Auth.js";
import watchlistRoutes from "./routes/watchlist.js";
import stockRoutes from "./routes/stock.js";   // 👈 Yahoo stock route
import historyRoutes from "./routes/history.js";
import newsRoutes from "./routes/news.js";
import userRoutes from "./routes/user.js";
import portfolioRoutes from "./routes/portfolio.js";
import path from "path";
import newsRouter from "./routes/news.js";
import watchlistRouter from "./routes/watchlist.js";


const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/stock", stockRoutes);        // 👈 Yahoo Finance stock quotes
app.use("/api/history", historyRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/user", userRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/news", newsRouter);

app.use("/api/watchlist", watchlistRouter);


// ✅ Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

