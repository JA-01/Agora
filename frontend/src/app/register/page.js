'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  UserPlusIcon, 
  LockClosedIcon, 
  ArrowPathIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/add_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.message === 'user_exists') {
        setError('Username already exists, please try another one');
      } else {
        localStorage.setItem('username', username);
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DADDD8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="bg-[#4B5842] rounded-2xl border border-[#8FB339] shadow-md p-8 mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 text-center flex items-center justify-center">
            <UserPlusIcon className="w-8 h-8 mr-3 text-[#B7CE63]" />
            Join Agora
          </h1>
          <p className="text-[#C7D59F] text-center max-w-sm mx-auto">
            Join our community of citizen scientists and plant researchers
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#4B5842] mb-2 flex items-center">
                <UserCircleIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#DADDD8]/50 border-2 border-[#8FB339] text-[#4B5842] placeholder-[#4B5842]/50 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#4B5842] mb-2 flex items-center">
                <LockClosedIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#DADDD8]/50 border-2 border-[#8FB339] text-[#4B5842] placeholder-[#4B5842]/50 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#4B5842] mb-2 flex items-center">
                <CheckBadgeIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#DADDD8]/50 border-2 border-[#8FB339] text-[#4B5842] placeholder-[#4B5842]/50 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg transition flex items-center justify-center font-medium border shadow-md ${
                isLoading 
                  ? 'bg-[#4B5842]/50 text-[#C7D59F]/50 border-[#8FB339]/30 cursor-not-allowed' 
                  : 'bg-[#8FB339] text-white hover:bg-[#B7CE63] border-[#B7CE63]'
              }`}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Create account
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-[#4B5842]">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#8FB339] hover:text-[#B7CE63] transition">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}