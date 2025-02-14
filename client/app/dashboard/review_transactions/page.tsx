"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ReviewTransactions() {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const transactions = [
    { name: "Apple", action: "Buy", shares: 1, status: "Completed", date: "January 2, 2024" },
    { name: "Meta", action: "Buy", shares: 2, status: "Completed", date: "January 5, 2024" },
    { name: "Spotify", action: "Sell", shares: 3, status: "Pending", date: "January 6, 2024" },
    { name: "Amazon", action: "Sell", shares: 2, status: "Completed", date: "January 7, 2024" },
    { name: "Google", action: "Sell", shares: 1, status: "Cancelled", date: "January 8, 2024" },
  ];

  const filteredTransactions = transactions.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-8">
      <div className="w-full max-w-5xl bg-white p-8 rounded-lg shadow-lg">
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

        {/* Review Transactions Card */}
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Review Transactions</h2>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-black border focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          {/* Transactions List */}
          <div className="mt-6 space-y-4">
            {filteredTransactions.map((transaction, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow text-black flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">Name: {transaction.name}</p>
                  <p className="text-gray-500 text-sm">Action: {transaction.action}</p>
                </div>
                <p className="text-sm">No. of Shares: {transaction.shares}</p>
                <p className={`text-sm font-semibold ${transaction.status === "Completed" ? "text-green-500" : transaction.status === "Pending" ? "text-orange-500" : "text-red-500"}`}>
                  {transaction.status}
                </p>
                <p className="text-sm text-gray-500">{transaction.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
