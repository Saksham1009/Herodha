"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

export default function AddToWallet() {
  const router = useRouter();
  const [amount, setAmount] = useState(""); // User input for top-up amount
  const [balance, setBalance] = useState<number | null>(null); // Wallet balance
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Fetch current wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No token available. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:8080/transaction/getWalletBalance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setBalance(response.data.data.balance);
        } else {
          setError(response.data.data || "Failed to fetch balance.");
        }
      } catch (err: any) {
        setError("Failed to fetch wallet balance.");
        console.error( "Error fetching wallet balance:", err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  // Handle wallet top-up
  const handleTopUp = async () => {
    const amountFloat = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0; // Extract numbers

    if (amountFloat <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setTopUpLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token available. Please log in.");
        setTopUpLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:8080/transaction/addMoneyToWallet",
        { amount: amountFloat },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        alert(`Added $${amountFloat.toFixed(2)} to your wallet.`);
        setBalance((prevBalance) => (prevBalance !== null ? prevBalance + amountFloat : amountFloat)); // Update balance
        setAmount(""); // Reset input field
      } else {
        setError(response.data.data || "Failed to add money to wallet.");
      }
    } catch (err: any) {
      console.error(" Error in wallet top-up request:", err.response ? err.response.data : err.message);
      setError("Failed to add money to wallet.");
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-8">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard">
            <span className="text-3xl text-gray-700 cursor-pointer">←</span>
          </Link>
          <Image
            src="/logo.png"
            alt="Herodha Logo"
            width={300}
            height={300}
            className="mb-4"
          />
          <div></div>
        </div>

        {/* Add To Wallet Card */}
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold">Add To Wallet</h2>

          <div className="bg-white p-6 rounded-lg shadow-lg w-full mt-4 text-black">
            <p className="text-lg font-medium">Current Balance:</p>
            <p className="text-4xl font-bold text-blue-600">
              {loading ? "Loading..." : `$${balance !== null ? balance.toLocaleString() : "N/A"}`}
            </p>

            {/* Amount Input */}
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium">Amount:</label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="text-gray-500">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-2 py-1 outline-none text-black"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            {/* Top Up Wallet Button */}
            <button
              onClick={handleTopUp}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              disabled={topUpLoading}
            >
              {topUpLoading ? "Processing..." : "TOP UP WALLET"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
