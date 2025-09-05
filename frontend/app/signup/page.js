"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        email,
        password,
      });
      setMsg("✅ Signup successful! Please login.");
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || "Signup failed"));
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4">
      <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-gray-800 px-4 sm:px-6 py-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl sm:text-3xl font-extrabold text-purple-400 drop-shadow">
          📝 Create Account
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-lg border border-gray-600 bg-gray-100 px-4 py-3 text-black placeholder-gray-500 shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-lg border border-gray-600 bg-gray-100 px-4 py-3 text-black placeholder-gray-500 shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSignup}
            className="w-full min-h-12 rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            Signup
          </button>
        </div>

        {msg && (
          <p
            className={`mt-4 text-center text-sm font-medium ${
              msg.startsWith("✅") ? "text-green-400" : "text-red-400"
            }`}
          >
            {msg}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-400 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
