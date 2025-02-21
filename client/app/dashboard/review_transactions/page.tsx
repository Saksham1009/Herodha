"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";


export default function ReviewTransactions() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<{ stock_id: string; order_status: string; action: string; quantity: string, time_stamp: string }[]>([]);
  const [stockPortfolio, setStockPortfolio] = useState<{ stock_id: string; stock_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No token available. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:8080/stock/getStockTransactions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          // Extract only required fields
          const filteredTransactions = response.data.data.map((tx: any) => ({
            stock_id: tx.stock_id,
            order_status: tx.order_status,
            action: tx.is_buy ? "Buy" : "Sell",
            quantity: tx.quantity,
            time_stamp: tx.time_stamp
            
          }));

          setTransactions(filteredTransactions);
        } else {
          setError(response.data.data || "Failed to fetch transactions.");
        }
      } catch (err: any) {
        setError("Failed to fetch transactions.");
        console.error("Error fetching transactions:", err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) =>
    t.stock_id.toLowerCase().includes(search.toLowerCase())
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
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col scrollable-container fixed-dimension-container">
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
            {loading ? (
              <p className="text-center">Loading transactions...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500">No transactions found.</p>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow text-black flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">Stock ID: {transaction.stock_id}</p>
                    <p className="text-gray-500 text-sm">Action: {transaction.action}</p>
                  </div>
                  <p className="text-gray-500 text-sm">Quantity: {transaction.quantity}</p>
                  <p className={`text-sm font-semibold ${transaction.order_status === "Completed" ? "text-green-500" : transaction.order_status === "Pending" ? "text-orange-500" : "text-red-500"}`}>
                    {transaction.order_status}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(transaction.time_stamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
