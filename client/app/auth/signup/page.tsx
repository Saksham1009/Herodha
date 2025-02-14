import Image from "next/image";
import Link from "next/link";

export default function SignUp() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.png" // Update with actual logo path in public folder
            alt="Herodha Logo"
            width={300}
            height={300}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">START TRADING!</h1>
        </div>
        <form>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter Name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Choose Password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link href="/auth/signin" className="text-blue-500 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
