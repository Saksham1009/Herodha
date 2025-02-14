"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function BuyStock() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockName = searchParams.get("stock") || "Unknown";
  const stockPrice = searchParams.get("price") || "0";

  const [quantity, setQuantity] = useState(""); // Allow any input, parse later

  const handleBuy = () => {
    const quantityInt = parseInt(quantity) || 0;
    const totalCost = quantityInt * parseFloat(stockPrice);

    if (quantityInt > 0) {
      alert(`Purchased ${quantityInt} shares of ${stockName} for $${totalCost.toFixed(2)}.`);
      router.push("/dashboard"); // Redirect back to dashboard
    } else {
      alert("Please enter a valid number of shares.");
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

        {/* Buy Stocks Card */}
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold">Buy Stocks</h2>

          <div className="bg-white p-6 rounded-lg shadow-lg w-full mt-4 text-black">
            <p className="text-lg font-medium">
              Company Name: <span className="text-blue-600 font-bold">{stockName}</span>
            </p>
            <p className="text-lg font-medium">
              Stock Price: <span className="text-blue-600 font-bold">${stockPrice}</span>
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

            {/* Buy Now Button */}
            <button
              onClick={handleBuy}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
