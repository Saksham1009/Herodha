import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800">Welcome to Herodha</h1>
      <p className="text-gray-600 mt-2">Your trusted trading platform</p>
      <Link href="/auth/signin">
        <button className="mt-6 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Go to Sign In
        </button>
      </Link>
    </div>
  );
}