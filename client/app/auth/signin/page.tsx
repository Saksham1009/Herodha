"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from "axios";


export default function SignIn() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try{
          const response = await axios.post('http://localhost:8080/auth/login', {
            user_name: userName,
            password: password
          });
  
          if (response.data.success){
            console.log("Login successful", response.data);
            localStorage.setItem('token', response.data.data.token); // Optionally save the token
            console.log("Token Stored:", response.data.data.token);
            router.push('/dashboard');
          } else {
            console.error("Login unsuccessful", response.data.error);
          }
        } catch (error:unknown){
          if(axios.isAxiosError(error)){
            if (error.response){
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
                        alt="Logo"
                        width={300}
                        height={300}
                        className="mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-800">SIGN IN</h1>
                    <p className="text-gray-600 mb-6">Welcome Back, Time to Trade!</p>
                </div>
                <form onSubmit={handleSignIn}>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Enter Username"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="password"
                            placeholder="Enter Password"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Sign In
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                NOT A MEMBER? <a href="/auth/signup" className="text-blue-500 hover:underline">SIGN UP</a>
                </p>
            </div>
        </div>
    );
}

/*
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SignIn() {
  const router = useRouter();
  const [userName, setuserName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Perform authentication logic here (API call, validation, etc.)
    
    // If authentication succeeds, navigate to dashboard
    router.push("/dashboard");
  };

  const handleSignIn = async () => {
    const res = await axios.post("http://localhost:8080/auth/login", {
      email,
      password,
    });
    console.log(res);
  };

  useEffect(() => {
    const res = axios.post("http://localhost:8080/auth/register", {
      "user_name": "Shweta",
      "name": "Shweta",
      "password": 1
    });
    console.log(res);
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-800">SIGN IN</h1>
          <p className="text-gray-600 mb-6">Welcome Back, Time to Trade!</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter Username"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
              value={userName}
              onChange={(e) => setuserName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            //onClick={handleSignIn}
            className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          NOT A MEMBER? <a href="/auth/signup" className="text-blue-500 hover:underline">SIGN UP</a>
        </p>
      </div>
    </div>
  );
}
*/

/*
    useEffect(() => {
      if (submit) {
          const login = async () => {
              try {
                  const response = await fetch('http://localhost:8080/auth/login', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                          user_name: userName,
                          password: password
                      })
                  });
                  const data = await response.json(); // Get JSON data from the response
                  if (response.ok && data.success) {
                      console.log('Login successful', data);
                      localStorage.setItem('token', data.token); // Optionally save the token
                      router.push('/dashboard');
                  } else {
                      throw new Error(data.message || 'Failed to login');
                  }
              } catch (error: unknown) {
                  if(error.response){
                    console.error(error.response.data);
                  }
                  console.error(error.response.data);
                  setLoginError(true);
              }
          };
          login();
          setSubmit(false); // Reset submit state after processing
      }
  }, [submit, userName, password, router]);
*/