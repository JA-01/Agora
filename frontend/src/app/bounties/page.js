'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BountiesList() {
  const [bounties, setBounties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    plant_species: '',
    min_reward: ''
  });

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    try {
      setIsLoading(true);
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (filters.plant_species) queryParams.append('plant_species', filters.plant_species);
      if (filters.min_reward) queryParams.append('min_reward', filters.min_reward);

      const response = await fetch(`/api/search_bounties?${queryParams}`);
      const data = await response.json();
      setBounties(data);
    } catch (err) {
      setError('Failed to fetch bounties');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBounties();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8 text-center">
          Plant Research Bounties
        </h1>

        {/* Filters */}
        <form onSubmit={handleSearch} className="mb-8 bg-white/10 backdrop-blur-lg p-6 rounded-xl">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <input
              type="text"
              name="plant_species"
              value={filters.plant_species}
              onChange={handleFilterChange}
              placeholder="Plant Species"
              className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
            <input
              type="number"
              name="min_reward"
              value={filters.min_reward}
              onChange={handleFilterChange}
              placeholder="Minimum Reward"
              className="px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
            <button
              type="submit"
              className="bg-white text-emerald-700 px-6 py-2 rounded-lg hover:bg-emerald-50 transition"
            >
              Search Bounties
            </button>
          </div>
        </form>

        {/* Bounties List */}
        {isLoading ? (
          <div className="text-center text-white">Loading bounties...</div>
        ) : error ? (
          <div className="text-center text-red-300">{error}</div>
        ) : bounties.length === 0 ? (
          <div className="text-center text-white">No bounties found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map((bounty) => (
              <Link 
                href={`/bounties/${bounty.id}`} 
                key={bounty.id}
                className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl"
              >
                <h3 className="text-xl font-bold text-lime-300 mb-2">{bounty.title}</h3>
                <p className="text-white/90 mb-4">{bounty.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">
                    Species: {bounty.plant_species}
                  </span>
                  <span className="bg-lime-300 text-emerald-800 px-3 py-1 rounded-full text-sm">
                    ${bounty.reward}
                  </span>
                </div>
                <div className="mt-4 text-sm text-white/70">
                  {bounty.current_submissions}/{bounty.num_submissions_needed} submissions
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Bounty Button */}
        <div className="text-center mt-8">
          <Link 
            href="/bounties/create"
            className="bg-white text-emerald-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Create New Bounty
          </Link>
        </div>
      </div>
    </div>
  );
}