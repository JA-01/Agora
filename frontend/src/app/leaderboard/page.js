'use client';
import BackToDashboard from '../components/BackToDashboard';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrophyIcon, 
  UserIcon, 
  ArrowPathIcon,
  ChartBarIcon,
  StarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yourRank, setYourRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
      
      // Find the current user's rank if they're logged in
      const username = localStorage.getItem('username');
      if (username) {
        const userRank = data.findIndex(entry => entry._id === username);
        if (userRank !== -1) {
          setYourRank(userRank + 1);
        }
      }
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalEmoji = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#DADDD8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#4B5842] rounded-2xl border border-[#8FB339] shadow-md p-8 mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-4 text-center flex items-center justify-center">
            <TrophyIcon className="w-10 h-10 mr-3 text-[#B7CE63]" />
            Plant Bounty Leaderboard
          </h1>
          <p className="text-[#C7D59F] text-center max-w-2xl mx-auto">
            Our top contributors and researchers helping with plant identification and conservation.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-10 text-center">
            <div className="text-[#4B5842] flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 mr-2 animate-spin text-[#8FB339]" />
              <span className="text-xl font-semibold">Loading leaderboard...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-300 shadow-md p-10 text-center">
            <div className="text-red-600">{error}</div>
          </div>
        ) : (
          <>
            {/* User's Rank (if found) */}
            {yourRank && (
              <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-6 mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#4B5842] flex items-center">
                    <StarIcon className="w-6 h-6 mr-2 text-[#8FB339]" />
                    Your Ranking
                  </h2>
                  <span className="bg-[#C7D59F] text-[#4B5842] px-4 py-2 rounded-full font-bold border border-[#8FB339]">
                    #{yourRank}
                  </span>
                </div>
                <p className="mt-2 text-[#4B5842]">
                  {yourRank <= 3 
                    ? "Congratulations! You're one of our top contributors!" 
                    : "Keep submitting quality research to climb the ranks!"}
                </p>
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md overflow-hidden">
              <div className="p-6 border-b border-[#C7D59F]">
                <h2 className="text-2xl font-bold text-[#4B5842] flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-2 text-[#8FB339]" />
                  Top Contributors
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#4B5842]/10">
                    <tr>
                      <th className="py-4 px-6 text-left text-[#4B5842] font-semibold">Rank</th>
                      <th className="py-4 px-6 text-left text-[#4B5842] font-semibold">Username</th>
                      <th className="py-4 px-6 text-right text-[#4B5842] font-semibold">Approved Submissions</th>
                      <th className="py-4 px-6 text-right text-[#4B5842] font-semibold">Est. Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr 
                        key={entry._id} 
                        className={`border-b border-[#C7D59F]/30 last:border-b-0 hover:bg-[#C7D59F]/10 transition ${
                          yourRank === index + 1 ? 'bg-[#C7D59F]/20' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-[#4B5842] font-medium">
                          <div className="flex items-center">
                            <span className="w-6 text-center">{index + 1}</span>
                            {getMedalEmoji(index) && (
                              <span className="ml-2 text-xl">{getMedalEmoji(index)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#4B5842]">
                          <div className="flex items-center">
                            <UserIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                            {entry._id}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-[#4B5842] font-semibold">
                          <div className="flex items-center justify-end">
                            <ChartBarIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                            {entry.total_approved_submissions}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-[#4B5842] font-semibold">
                          <div className="flex items-center justify-end">
                            <CurrencyDollarIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                            ${(entry.total_approved_submissions * 5).toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Link 
                href="/bounties"
                className="bg-white p-6 rounded-2xl border border-[#8FB339] shadow-md hover:border-[#B7CE63] hover:shadow-lg transition-all duration-300 flex flex-col items-start"
              >
                <div className="p-3 bg-[#C7D59F] rounded-full mb-4 border border-[#B7CE63]">
                  <ChartBarIcon className="w-8 h-8 text-[#4B5842]" />
                </div>
                <h3 className="text-xl font-bold text-[#4B5842] mb-2">Find Bounties</h3>
                <p className="text-[#4B5842]">
                  Start contributing by finding open bounties to research.
                </p>
              </Link>

              <Link 
                href="/cashout"
                className="bg-white p-6 rounded-2xl border border-[#8FB339] shadow-md hover:border-[#B7CE63] hover:shadow-lg transition-all duration-300 flex flex-col items-start"
              >
                <div className="p-3 bg-[#C7D59F] rounded-full mb-4 border border-[#B7CE63]">
                  <CurrencyDollarIcon className="w-8 h-8 text-[#4B5842]" />
                </div>
                <h3 className="text-xl font-bold text-[#4B5842] mb-2">Cash Out Earnings</h3>
                <p className="text-[#4B5842]">
                  Turn your approved submissions into real rewards.
                </p>
              </Link>
            </div>
          </>
        )}
        <BackToDashboard />
      </div>
    </div>
  );
}