'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Research Together, <span className="text-green-200">Discover</span> Together
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            The open platform connecting researchers with citizen scientists to collect data, study plants, and advance scientific knowledge together.
          </p>
        </div>
        
        <div className="flex gap-6 mt-8">
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-50 transition"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link href="/login" className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-50 transition">
                Log In
              </Link>
              <Link href="/register" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition">
                Sign Up
              </Link>
            </>
          )}
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[
            {
              title: "Contribute Data",
              description: "Help researchers by collecting and submitting data from your local environment.",
              icon: "🌱"
            },
            {
              title: "Plant Identification",
              description: "Request or provide plant identification and contribute to botanical databases.",
              icon: "🔍"
            },
            {
              title: "Download Results",
              description: "Researchers can access anonymized data in CSV format for easy analysis.",
              icon: "📊"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-lg p-6 rounded-xl hover:bg-white/20 transition">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}