"use client";
import React, { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import axios from 'axios';

export default function SignUp() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submit action
    try {
      const response = await axios.post('http://localhost:8080/authentication/register', {
        name: name,
        user_name: username,
        password: password
      });
      if (response.data.success) {
        console.log('Registration successful', response.data);
        // Redirect or show success message
      } else {
        console.error('Registration failed', response.data.error);
        // Handle errors, show error message to user
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Check if the error is an Axios error
        if (error.response) {
          // The server responded with a status code out of the range of 2xx
          console.error(error.response.data);
        } 
      }
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Herodha Logo"
            width={300}
            height={300}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">START TRADING!</h1>
        </div>
        <form onSubmit={handleSignUp}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter Name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter Username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Choose Password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
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
