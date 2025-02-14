"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function CancelTransactions() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [transactions, setTransactions] = useState([
    { name: "Spotify", shares: 3, price: 100 },
  ]);

  const handleCancel = (name: string) => {
    setTransactions(transactions.filter((t) => t.name !== name));
    alert(`Transaction for ${name} has been canceled.`);
  };

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

        {/* Cancel Transactions Card */}
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Cancel Transactions</h2>

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
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow text-black flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">Name: {transaction.name}</p>
                    <p className="text-gray-500 text-sm">No. of Shares: {transaction.shares}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">${transaction.price}</p>
                  <button
                    onClick={() => handleCancel(transaction.name)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Cancel
                  </button>
                </div>
              ))
            ) : (
              <p className="text-white text-center mt-4">No transactions available to cancel.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
