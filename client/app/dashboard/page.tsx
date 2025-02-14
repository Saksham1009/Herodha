"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Dashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const balance = 25586;
  const portfolio = [
    { name: "Apple", quantity: 1, value: 310 },
    { name: "Meta", quantity: 1, value: 410 },
    { name: "Spotify", quantity: 1, value: 300 },
  ];
  const availableStocks = [
    { name: "Apple", price: 310 },
    { name: "Meta", price: 410 },
    { name: "Microsoft", price: 240 },
    { name: "Apple", price: 100 },
  ];

  const filteredStocks = availableStocks.filter((stock) =>
    stock.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-8">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-center items-center mb-6">
          <Image src="/logo.png" alt="Herodha Logo" width={300} height={300} />
        </div>

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Total Balance (4 columns) */}
          <div className="bg-blue-600 text-white rounded-lg p-6 flex flex-col justify-center items-center col-span-4">
            <h2 className="text-xl font-semibold">Total Balance</h2>
            <p className="text-4xl font-bold">${balance.toLocaleString()}</p>
            <button
              onClick={() => router.push("/dashboard/wallet")}
              className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
            >
              Add to Wallet
            </button>
          </div>

          {/* Available Stocks (8 columns) */}
          <div className="bg-gray-300 rounded-lg p-6 col-span-8">
            <h2 className="text-lg font-semibold text-black">Available Stocks</h2>
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg mt-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
            />
            <div className="space-y-4">
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                    <p className="font-semibold text-black">{stock.name}</p>
                    <p className="font-bold text-black">${stock.price}</p>
                    <button
                      onClick={() => router.push(`/dashboard/buy?stock=${stock.name}&price=${stock.price}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Buy
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No matching stocks found.</p>
              )}
            </div>
          </div>

          {/* My Portfolio (4 columns, aligned below Total Balance) */}
          <div className="bg-gray-200 rounded-lg p-6 col-span-4">
            <h2 className="text-lg font-semibold text-black">My Portfolio</h2>
            <p className="text-sm text-gray-500 mb-4">
              Holding Value: ${portfolio.reduce((acc, stock) => acc + stock.value, 0)}
            </p>
            <div className="space-y-4">
              {portfolio.map((stock, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-black">{stock.name}</p>
                    <p className="text-sm text-gray-500">Quantity: {stock.quantity}</p>
                  </div>
                  <p className="font-bold text-black">${stock.value}</p>
                  <button
                    onClick={() => router.push(`/dashboard/sell?stock=${stock.name}&price=${stock.value}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Sell
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Review & Cancel Transactions Buttons (8 columns, aligned below Available Stocks) */}
          <div className="col-span-8 flex justify-between">
            <button
              onClick={() => router.push("/dashboard/review_transactions")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 w-1/2 mr-2 h-20"
            >
              Review Transactions
            </button>
            <button
              onClick={() => router.push("/dashboard/cancel_transactions")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 w-1/2 ml-2 h-20"
            >
              Cancel Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
