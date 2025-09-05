// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 👇 Profile fields
    name: { type: String },
    username: { type: String, unique: true, sparse: true }, // sparse = allows null
    bio: { type: String },
    avatarUrl: { type: String },

    // Stock related
    watchlist: [String],
    portfolio: [
      {
        symbol: { type: String },
        quantity: { type: Number },
        avgPrice: { type: Number },
      },
    ],
    balance: { type: Number, default: 100000 }, // starting ₹1L virtual balance
  },
  { timestamps: true } // 👈 adds createdAt, updatedAt
);

export default mongoose.model("User", userSchema);
