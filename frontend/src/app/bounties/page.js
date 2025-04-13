'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  BeakerIcon,
  CurrencyDollarIcon,
  PaperClipIcon,
  PlusCircleIcon,
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="bg-[#C7D59F] text-[#4B5842] border border-[#8FB339] px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <CheckBadgeIcon className="w-3 h-3 mr-1" /> Open
               </span>;
      case 'completed':
        return <span className="bg-[#B7CE63] text-[#4B5842] border border-[#8FB339] px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <CheckBadgeIcon className="w-3 h-3 mr-1" /> Completed
               </span>;
      case 'closed':
        return <span className="bg-red-100 text-red-800 border border-red-300 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" /> Closed
               </span>;
      default:
        return <span className="bg-[#C7D59F] text-[#4B5842] border border-[#8FB339] px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" /> {status || 'Open'}
               </span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#DADDD8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#4B5842] rounded-2xl border border-[#8FB339] shadow-md p-8 mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-4 text-center flex items-center justify-center">
            <BeakerIcon className="w-10 h-10 mr-3 text-[#B7CE63]" />
            Plant Research Bounties
          </h1>
          <p className="text-[#C7D59F] text-center max-w-2xl mx-auto">
            Browse and contribute to plant research and removal missions from our community of citizen scientists and organizations.
          </p>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="mb-8 bg-[#4B5842] border border-[#8FB339] p-6 rounded-xl shadow-md">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="relative flex-1 min-w-[200px]">
              <BeakerIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B7CE63]" />
              <input
                type="text"
                name="plant_species"
                value={filters.plant_species}
                onChange={handleFilterChange}
                placeholder="Plant Species"
                className="pl-10 w-full px-4 py-3 rounded-lg bg-[#3A4434] border-2 border-[#8FB339] text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B7CE63]" />
              <input
                type="number"
                name="min_reward"
                value={filters.min_reward}
                onChange={handleFilterChange}
                placeholder="Minimum Reward"
                className="pl-10 w-full px-4 py-3 rounded-lg bg-[#3A4434] border-2 border-[#8FB339] text-white placeholder-[#C7D59F]/70 focus:outline-none focus:ring-2 focus:ring-[#B7CE63] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-[#8FB339] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#B7CE63] transition-all duration-300 flex items-center border border-[#C7D59F] shadow-md"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Search Bounties
            </button>
          </div>
        </form>

        {/* Bounties List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-10 text-center">
            <div className="text-[#4B5842] flex items-center justify-center">
              <svg className="animate-spin h-10 w-10 mr-3 text-[#8FB339]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xl font-semibold">Loading bounties...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-300 shadow-md p-10 text-center">
            <div className="text-red-600">{error}</div>
          </div>
        ) : bounties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-10 text-center">
            <div className="text-[#4B5842] text-center p-8 border border-dashed border-[#B7CE63] rounded-lg bg-[#C7D59F]/20">
              <BeakerIcon className="w-12 h-12 mx-auto mb-2 text-[#B7CE63]" />
              <p>No bounties match your search criteria. Try adjusting your filters.</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map((bounty) => (
            <Link 
                href={`/bounties/${bounty.bounty_id}`} 
                key={bounty.bounty_id}
                className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-6 hover:border-[#B7CE63] hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
            >
                <h3 className="text-xl font-bold text-[#4B5842] mb-2 flex items-center">
                <BeakerIcon className="w-5 h-5 mr-2 text-[#8FB339]" />
                {bounty.title}
                </h3>
                <p className="text-[#4B5842] mb-4 line-clamp-2">{bounty.description}</p>
                <div className="flex justify-between items-center">
                <span className="text-[#4B5842] flex items-center">
                    <BeakerIcon className="w-4 h-4 mr-1 text-[#8FB339]" />
                    {bounty.plant_species}
                </span>
                <span className="bg-[#C7D59F] text-[#4B5842] px-3 py-1 rounded-full text-sm border border-[#8FB339] font-medium">
                    ${bounty.reward}
                </span>
                </div>
                <div className="mt-4 pt-3 border-t border-[#C7D59F]/50 flex justify-between items-center">
                <div className="text-sm text-[#4B5842] flex items-center">
                    <PaperClipIcon className="w-4 h-4 mr-1 text-[#8FB339]" />
                    {bounty.current_submissions}/{bounty.num_submissions_needed} submissions
                </div>
                {renderStatusBadge(bounty.status)}
                </div>
            </Link>
            ))}
          </div>
        )}

        {/* Create Bounty Button */}
        <div className="text-center mt-10">
          <Link 
            href="/bounties/create"
            className="bg-[#8FB339] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#B7CE63] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center max-w-xs mx-auto border border-[#C7D59F]"
          >
            <PlusCircleIcon className="w-6 h-6 mr-2" />
            Create New Bounty
          </Link>
        </div>
      </div>
    </div>
  );
}