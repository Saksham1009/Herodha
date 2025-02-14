"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AddToWallet() {
  const router = useRouter();
  const [amount, setAmount] = useState(""); // Accept any input
  const currentBalance = 12500; // Example balance

  const handleTopUp = () => {
    const amountFloat = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0; // Extract numbers

    if (amountFloat > 0) {
      alert(`Added $${amountFloat.toFixed(2)} to your wallet.`);
      router.push("/dashboard"); // Redirect back to dashboard
    } else {
      alert("Please enter a valid amount.");
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
            <p className="text-lg font-medium">Free Funds:</p>
            <p className="text-4xl font-bold text-blue-600">${currentBalance.toLocaleString()}</p>

            {/* Amount Input */}
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium">Amount:</label>
              <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="text-gray-500">$</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)} // Allow any input
                  className="w-full px-2 py-1 outline-none text-black"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Top Up Wallet Button */}
            <button
              onClick={handleTopUp}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              TOP UP WALLET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
