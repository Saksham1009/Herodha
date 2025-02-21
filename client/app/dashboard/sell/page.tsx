"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

export default function SellStock() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockName = searchParams.get("stock") || "Unknown"; // Get stock name from URL
  const [selectedStock, setSelectedStock] = useState<{ stock_id: string; stock_name: string; quantity_owned: number } | null>(null);
  const [quantity, setQuantity] = useState(""); // User input
  const [sellPrice, setSellPrice] = useState(""); // User input
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellLoading, setSellLoading] = useState(false);

  // Fetch stock portfolio and find the selected stock
  useEffect(() => {
    const fetchStockPortfolio = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No token available. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:8080/stock/getStockPortfolio", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const stockPortfolio = response.data.data;
          const matchingStock = stockPortfolio.find((stock: any) => stock.stock_name === stockName);

          if (matchingStock) {
            setSelectedStock(matchingStock);
          } else {
            setError(`Stock "${stockName}" not found in your portfolio.`);
          }
        } else {
          setError(response.data.data || "Failed to fetch stock portfolio.");
        }
      } catch (err: any) {
        console.error("Error fetching stock portfolio:", err.response ? err.response.data : err.message);
        setError("Failed to fetch stock portfolio.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockPortfolio();
  }, [stockName]);

  // Handle selling stock
  const handleSell = async () => {
    if (!selectedStock) {
      alert("Stock not found.");
      return;
    }

    const quantityInt = parseInt(quantity) || 0;
    const sellPriceFloat = parseFloat(sellPrice) || 0;

    if (quantityInt <= 0 || sellPriceFloat <= 0) {
      alert("Please enter valid numbers for shares and price.");
      return;
    }

    setSellLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token available. Please log in.");
        setSellLoading(false);
        return;
      }

      const requestBody = {
        stock_id: selectedStock.stock_id,
        is_buy: false,
        order_type: "LIMIT",
        quantity: quantityInt,
        price: sellPriceFloat,
      };

      const response = await axios.post("http://localhost:8080/trade/placeStockOrder", requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        alert(`Sold ${quantityInt} shares of ${selectedStock.stock_name} at $${sellPriceFloat} each.`);
        router.push("/dashboard"); // Redirect back to dashboard
      } else {
        setError(response.data.data || "Failed to sell stock.");
      }
    } catch (err: any) {
      console.error(" Error placing stock order:", err.response ? err.response.data : err.message);
      setError("Failed to sell stock.");
    } finally {
      setSellLoading(false);
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
            {loading ? (
              <p>Loading stock portfolio...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : selectedStock ? (
              <>
                <p className="text-lg font-medium">
                  Company Name:{" "}
                  <span className="text-blue-600 font-bold">{selectedStock.stock_name}</span>
                </p>
                <p className="text-gray-500 text-sm">Owned Shares: {selectedStock.quantity_owned}</p>

                {/* Number of Shares Input */}
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-medium">Number of Shares:</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)} // Accept any input
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-black"
                  />
                </div>

                {/* Price Input */}
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-medium">Price per Share:</label>
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
                  disabled={sellLoading}
                >
                  {sellLoading ? "Processing..." : "SELL NOW"}
                </button>
              </>
            ) : (
              <p className="text-red-500">Stock not found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
