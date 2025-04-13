'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, FlaskConical, Users, ChevronRight, LogIn, UserPlus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      setIsLoggedIn(true);
    }
    
    // Set loaded state after a short delay to trigger animations
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-800 text-white relative overflow-hidden">
      {/* Abstract decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-lime-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-lime-200 rounded-full blur-3xl"></div>
      </div>
      
      {/* Simple navbar */}
      <nav className="relative z-10 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-bold text-2xl tracking-tight">
              <span className="text-white">Agora</span>
              <span className="text-lime-300">.</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg transition-all hover:bg-white/10 flex items-center">
                Dashboard <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm px-4 py-2 rounded-lg transition-all hover:bg-white/10 flex items-center">
                  <LogIn className="mr-1 h-4 w-4" /> Log In
                </Link>
                <Link href="/register" className="text-sm px-4 py-2 bg-lime-300/20 border border-lime-300/30 text-white rounded-lg hover:bg-lime-300/30 transition-all flex items-center">
                  <UserPlus className="mr-1 h-4 w-4" /> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 flex flex-col items-center relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Empower <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-green-300">Global Impact</span> with Agora
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            A revolutionary platform connecting global citizens to scientific research and meaningful work opportunities
          </p>
        </div>
        
        <div className={`flex flex-wrap justify-center gap-6 mb-16 transition-all duration-1000 delay-200 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="group bg-gradient-to-r from-white to-white/90 text-emerald-700 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Go to Dashboard
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-lime-200 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          ) : null}
          
          <Link href="/login" className="group bg-gradient-to-r from-white to-white/90 text-emerald-700 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden">
            <span className="relative z-10 flex items-center">
              Log In
              <LogIn className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-lime-200 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Link>
          
          <Link href="/register" className="group bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 ease-in-out transform hover:scale-105 relative overflow-hidden">
            <span className="relative z-10 flex items-center">
              Sign Up
              <UserPlus className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {[
            {
              title: "Citizen Science",
              description: "Contribute to groundbreaking research from anywhere in the world. Every observation counts.",
              icon: <FlaskConical className="h-8 w-8" />
            },
            {
              title: "Global Opportunities",
              description: "Post and apply for jobs that transcend borders, connecting talent with meaningful projects.",
              icon: <Globe className="h-8 w-8" />
            },
            {
              title: "Collaborative Impact",
              description: "Join a community dedicated to solving global challenges through collective action.",
              icon: <Users className="h-8 w-8" />
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className={`group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/20 hover:border-lime-300/30 transition-all duration-500 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-1000 delay-${i * 100 + 300} transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            >
              <div className="p-3 bg-lime-300/10 rounded-xl inline-flex mb-5 text-lime-300 border border-lime-300/20 group-hover:bg-lime-300/20 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-lime-300 group-hover:text-lime-200 transition-colors duration-300">{feature.title}</h3>
              <p className="text-white/90">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}