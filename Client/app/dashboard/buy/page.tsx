"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

export default function BuyStock() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockName = searchParams.get("stock") || "Unknown";
  const stockPrice = searchParams.get("price") || "0";
  const [quantity, setQuantity] = useState(""); // Allow any input, parse later
  const [stockId, setStockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockId = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No token available. Please log in.");
          return;
        }

        // Fetch stock prices to get stock_id
        const stockPricesResponse = await axios.get("http://localhost:8080/transaction/getStockPrices", {
          headers: {token: `${token}` },
        });

        if (!stockPricesResponse.data.success) {
          throw new Error("Failed to fetch stock prices.");
        }

        // Find the stock_id by matching stock_name
        const matchedStock = stockPricesResponse.data.data.find(
          (stock: any) => stock.stock_name.toLowerCase() === stockName.toLowerCase()
        );

        if (matchedStock) {
          setStockId(matchedStock.stock_id);
        } else {
          throw new Error("Stock ID not found.");
        }
      } catch (err: any) {
        console.error("Error fetching stock ID:", err.response ? err.response.data : err.message);
        setError("Failed to fetch stock ID.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockId();
  }, [stockName]);

  const handleBuy = async () => {
    const quantityInt = parseInt(quantity) || 0;
    const totalCost = quantityInt * parseFloat(stockPrice);

    if (!stockId) {
      alert("Stock ID not found. Please try again.");
      return;
    }

    if (quantityInt > 0) {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("No token available. Please log in.");
          return;
        }

        const requestBody = {
          stock_id: stockId,
          is_buy: true,
          order_type: "MARKET",
          quantity: quantityInt,
        };

        console.log("Placing Order:", requestBody); // Debugging

        const response = await axios.post(
          "http://localhost:8080/engine/placeStockOrder",
          requestBody,
          {
            headers: {token: `${token}` },
          }
        );

        if (response.data.success) {
          alert(`Purchased ${quantityInt} shares of ${stockName} for $${totalCost.toFixed(2)}.`);
          router.push("/dashboard"); // Redirect back to dashboard
        } else {
          throw new Error(response.data.data || "Failed to place order.");
        }
      } catch (err: any) {
        console.error("Error placing order:", err.response ? err.response.data : err.message);
        alert("Failed to place order. Please try again.");
      }
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

            {/* Display Stock ID (for debugging) */}
            {loading ? (
              <p className="text-gray-500">Fetching stock ID...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <p className="text-gray-600 text-sm">Stock ID: {stockId}</p>
            )}

            {/* Number of Shares Input */}
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium">Number of Shares:</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
              disabled={!stockId}
            >
              {loading ? "Fetching stock ID..." : "BUY NOW"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
