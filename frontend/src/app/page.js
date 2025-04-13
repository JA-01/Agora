'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 text-white">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Empower <span className="text-lime-300">Global Impact</span> with Agora
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            A revolutionary platform connecting global citizens to scientific research and meaningful work opportunities
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white text-emerald-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
            </button>
          ) : null}
          
          <Link href="/login" className="bg-white text-emerald-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl">
            Log In
          </Link>
          <Link href="/register" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 ease-in-out transform hover:scale-105">
            Sign Up
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[
            {
              title: "Citizen Science",
              description: "Contribute to groundbreaking research from anywhere in the world. Every observation counts.",
              icon: "🔬"
            },
            {
              title: "Global Opportunities",
              description: "Post and apply for jobs that transcend borders, connecting talent with meaningful projects.",
              icon: "🌍"
            },
            {
              title: "Collaborative Impact",
              description: "Join a community dedicated to solving global challenges through collective action.",
              icon: "🤝"
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="text-5xl mb-5 opacity-80">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-lime-300">{feature.title}</h3>
              <p className="text-white/90">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}