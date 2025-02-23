"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

export default function CancelTransactions() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<{ stock_tx_id: string; stock_id: string; stock_price: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No token available. Please log in.");
          setLoading(false);
          return;
        }

        // Fetch stock transactions directly
        const transactionsResponse = await axios.get("http://localhost:8080/transaction/getStockTransactions", {
          headers: {token: `${token}` },
        });

        console.log(transactionsResponse);

        if (!transactionsResponse.data.success) {
          throw new Error("Failed to fetch transactions.");
        }

        // Filter transactions and keep only required fields
        const mappedTransactions = transactionsResponse.data.data
          .filter((tx: any) => tx.order_type === "LIMIT" && tx.is_buy === false) // Only "LIMIT" sell transactions
          .map((tx: any) => ({
            stock_tx_id: tx.stock_tx_id,
            stock_id: tx.stock_id,
            stock_price: tx.stock_price,
          }));
          
        setTransactions(mappedTransactions);
    
      } catch (err: any) {
        console.error(" Error fetching transactions:", err.response ? err.response.data : err.message);
        setError("Failed to fetch transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Cancel transaction by making a POST request
  const handleCancel = async (stock_tx_id: string) => {
    setDeleting(stock_tx_id);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token available. Please log in.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8080/engine/cancelStockTransaction",
        { stock_tx_id },
        {
          headers: {token: `${token}` },
        }
      );

      if (response.data.success) {
        alert(`Transaction ${stock_tx_id} has been canceled.`);
        setTransactions(transactions.filter((t) => t.stock_tx_id !== stock_tx_id));
      } else {
        setError(response.data.data || "Failed to cancel transaction.");
      }
    } catch (err: any) {
      console.error("Error canceling transaction:", err.response ? err.response.data : err.message);
      setError("Failed to cancel transaction.");
    } finally {
      setDeleting(null);
    }
  };

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

        {/* Cancel Transactions Card */}
        <div className="bg-blue-600 text-white rounded-lg p-8 flex flex-col scrollable-container fixed-dimension-container">
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
            {loading ? (
              <p className="text-center">Loading transactions...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-white text-center mt-4">No transactions available to cancel.</p>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg shadow text-black flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">Stock ID: {transaction.stock_id}</p>
                    <p className="text-gray-500 text-sm">Stock TX ID: {transaction.stock_tx_id}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">${transaction.stock_price.toFixed(2)}</p>
                  <button
                    onClick={() => handleCancel(transaction.stock_tx_id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                    disabled={deleting === transaction.stock_tx_id}
                  >
                    {deleting === transaction.stock_tx_id ? "Canceling..." : "Cancel"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
