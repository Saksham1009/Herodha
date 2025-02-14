"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function SellStock() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockName = searchParams.get("stock") || "Unknown";
  const stockPrice = searchParams.get("price") || "0";

  const [quantity, setQuantity] = useState(""); // String input
  const [sellPrice, setSellPrice] = useState(""); // String input

  const handleSell = () => {
    const quantityInt = parseInt(quantity) || 0;
    const sellPriceFloat = parseFloat(sellPrice) || 0;

    if (quantityInt > 0 && sellPriceFloat > 0) {
      alert(`Sold ${quantityInt} shares of ${stockName} at $${sellPriceFloat} each.`);
      router.push("/dashboard"); // Redirect back to dashboard
    } else {
      alert("Please enter valid numbers for shares and price.");
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

        {/* Sell Stocks Card */}
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold">Sell Stocks</h2>

          <div className="bg-white p-6 rounded-lg shadow-lg w-full mt-4 text-black">
            <p className="text-lg font-medium">
              Company Name: <span className="text-blue-600 font-bold">{stockName}</span>
            </p>

            {/* Number of Shares Input */}
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium">Number of Shares:</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)} // Accept any input
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-black"
              />
              <p className="text-gray-500 text-sm mt-1">
                ≈ ${isNaN(parseInt(quantity)) ? "0.00" : (parseInt(quantity) * parseFloat(stockPrice)).toFixed(2)}
              </p>
            </div>

            {/* Price Input */}
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium">Price:</label>
              <input
                type="text"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)} // Accept any input
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-black"
              />
            </div>

            {/* Sell Now Button */}
            <button
              onClick={handleSell}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              SELL NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

