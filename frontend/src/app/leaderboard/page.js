'use client';

import { useState, useEffect } from 'react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white text-center mb-12">
          Plant Bounty <span className="text-lime-300">Leaderboard</span>
        </h1>

        {isLoading ? (
          <div className="text-center text-white text-2xl">
            Loading leaderboard...
          </div>
        ) : error ? (
          <div className="text-center text-red-300 text-2xl">
            {error}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="py-4 px-6 text-left text-white/70">Rank</th>
                  <th className="py-4 px-6 text-left text-white/70">Username</th>
                  <th className="py-4 px-6 text-right text-white/70">Approved Submissions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr 
                    key={entry._id} 
                    className="border-b border-white/10 last:border-b-0 hover:bg-white/20 transition"
                  >
                    <td className="py-4 px-6 text-white">
                      {index + 1}
                      {index === 0 && ' 🥇'}
                      {index === 1 && ' 🥈'}
                      {index === 2 && ' 🥉'}
                    </td>
                    <td className="py-4 px-6 text-white">{entry._id}</td>
                    <td className="py-4 px-6 text-right text-lime-300 font-bold">
                      {entry.total_approved_submissions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 text-center text-white/70">
          <p>
            Earn points by completing bounties and contributing to plant research!
          </p>
        </div>
      </div>
    </div>
  );
}