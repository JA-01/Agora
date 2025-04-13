'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UserIcon, 
  CurrencyDollarIcon, 
  CheckBadgeIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  UserCircleIcon,
  BeakerIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [createdBounties, setCreatedBounties] = useState([]);
  const [submittedBounties, setSubmittedBounties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    setUsername(storedUsername);
    fetchUserData(storedUsername);
  }, []);

  const fetchUserData = async (user) => {
    try {
      setIsLoading(true);
      // Fetch user bounties
      const bountiesResponse = await fetch(`/api/get_user_bounties?username=${user}`);
      const bountiesData = await bountiesResponse.json();
      setCreatedBounties(bountiesData.created_bounties);
      setSubmittedBounties(bountiesData.submitted_bounties);

      // Fetch user profile (if this endpoint exists)
      const profileResponse = await fetch(`/api/get_user_profile?username=${user}`);
      const profileData = await profileResponse.json();
      setUserProfile(profileData);
    } catch (err) {
      setError('Failed to fetch user data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
                <ClockIcon className="w-3 h-3 mr-1" /> {status}
               </span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DADDD8] flex items-center justify-center">
        <div className="text-2xl text-[#4B5842] flex items-center">
          <ClockIcon className="w-8 h-8 mr-2 animate-spin text-[#8FB339]" />
          Loading Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#DADDD8] flex items-center justify-center">
        <div className="text-2xl text-red-600 flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DADDD8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* User Profile Header */}
        <div className="bg-[#4B5842] rounded-2xl border border-[#8FB339] shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center">
                <UserCircleIcon className="w-10 h-10 mr-3 text-[#B7CE63]" />
                Welcome, <span className="text-[#B7CE63] ml-2">{username}</span>
              </h1>
              <p className="text-[#DADDD8]">
                {userProfile?.is_verified_org 
                  ? `Verified Organization: ${userProfile.organization_name}` 
                  : 'Citizen Scientist'}
              </p>
            </div>
            <Link 
              href="/bounties/create"
              className="bg-[#8FB339] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#B7CE63] transition flex items-center border border-[#C7D59F] shadow-md"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Create New Bounty
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Created Bounties */}
          <div>
            <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-6">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#C7D59F]">
                <h2 className="text-2xl font-bold text-[#4B5842] flex items-center">
                  <DocumentTextIcon className="w-6 h-6 mr-2 text-[#8FB339]" />
                  Created Bounties ({createdBounties.length})
                </h2>
                <Link 
                  href="/bounties"
                  className="text-[#8FB339] hover:text-[#4B5842] transition font-medium"
                >
                  View All
                </Link>
              </div>

              {createdBounties.length === 0 ? (
                <div className="text-[#4B5842] text-center p-8 border border-dashed border-[#B7CE63] rounded-lg bg-[#C7D59F]/20">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-[#B7CE63]" />
                  <p>You haven't created any bounties yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {createdBounties.slice(0, 3).map((bounty) => (
                    <Link 
                    href={`/bounties/${bounty.bounty_id}`} 
                    key={bounty.bounty_id}
                    className="block bg-white p-4 rounded-lg border border-[#C7D59F] hover:border-[#8FB339] hover:shadow-md transition hover:bg-[#DADDD8]/20"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-[#4B5842] font-semibold flex items-center">
                            <BeakerIcon className="w-4 h-4 mr-2 text-[#8FB339]" />
                            {bounty.title}
                          </h3>
                          <p className="text-[#4B5842] text-sm flex items-center mt-1">
                            <PaperClipIcon className="w-4 h-4 mr-1 text-[#8FB339]" />
                            {bounty.current_submissions}/{bounty.num_submissions_needed} submissions
                          </p>
                        </div>
                        {renderStatusBadge(bounty.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submitted Bounties */}
          <div>
            <div className="bg-white rounded-2xl border border-[#8FB339] shadow-md p-6">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#C7D59F]">
                <h2 className="text-2xl font-bold text-[#4B5842] flex items-center">
                  <ArrowUpTrayIcon className="w-6 h-6 mr-2 text-[#8FB339]" />
                  Submitted Bounties ({submittedBounties.length})
                </h2>
                <Link 
                  href="/bounties"
                  className="text-[#8FB339] hover:text-[#4B5842] transition font-medium"
                >
                  View All
                </Link>
              </div>

              {submittedBounties.length === 0 ? (
                <div className="text-[#4B5842] text-center p-8 border border-dashed border-[#B7CE63] rounded-lg bg-[#C7D59F]/20">
                  <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2 text-[#B7CE63]" />
                  <p>You haven't submitted to any bounties yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submittedBounties.slice(0, 3).map((submission) => (
                    <Link 
                      href={`/bounties/${submission.bounty_id}`} 
                      key={submission.id}
                      className="block bg-white p-4 rounded-lg border border-[#C7D59F] hover:border-[#8FB339] hover:shadow-md transition hover:bg-[#DADDD8]/20"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-[#4B5842] font-semibold flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-2 text-[#8FB339]" />
                            {submission.submission_type} Submission
                          </h3>
                          <p className="text-[#4B5842] text-sm flex items-center mt-1">
                            <BeakerIcon className="w-4 h-4 mr-1 text-[#8FB339]" />
                            {submission.identified_species}
                          </p>
                        </div>
                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${
                            submission.status === 'approved' ? 'bg-[#C7D59F] text-[#4B5842] border-[#8FB339]' :
                            submission.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                        >
                          {submission.status === 'approved' && <CheckBadgeIcon className="w-3 h-3 mr-1" />}
                          {submission.status === 'rejected' && <ClockIcon className="w-3 h-3 mr-1" />}
                          {submission.status !== 'approved' && submission.status !== 'rejected' && <ClockIcon className="w-3 h-3 mr-1" />}
                          {submission.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Link 
            href="/bounties"
            className="bg-white p-6 rounded-2xl border border-[#8FB339] shadow-md hover:border-[#B7CE63] hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-start"
          >
            <div className="p-3 bg-[#C7D59F] rounded-full mb-4 border border-[#B7CE63]">
              <MagnifyingGlassIcon className="w-8 h-8 text-[#4B5842]" />
            </div>
            <h3 className="text-xl font-bold text-[#4B5842] mb-2">Find Bounties</h3>
            <p className="text-[#4B5842]">
              Explore open research and removal missions
            </p>
          </Link>

          <Link 
            href="/leaderboard"
            className="bg-white p-6 rounded-2xl border border-[#8FB339] shadow-md hover:border-[#B7CE63] hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-start"
          >
            <div className="p-3 bg-[#C7D59F] rounded-full mb-4 border border-[#B7CE63]">
              <TrophyIcon className="w-8 h-8 text-[#4B5842]" />
            </div>
            <h3 className="text-xl font-bold text-[#4B5842] mb-2">Leaderboard</h3>
            <p className="text-[#4B5842]">
              See top contributors and your ranking
            </p>
          </Link>
          <Link 
            href="/cashout"
            className="bg-white p-6 rounded-2xl border border-[#8FB339] shadow-md hover:border-[#B7CE63] hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 flex flex-col items-start"
          >
            <div className="p-3 bg-[#C7D59F] rounded-full mb-4 border border-[#B7CE63]">
              <TrophyIcon className="w-8 h-8 text-[#4B5842]" />
            </div>
            <h3 className="text-xl font-bold text-[#4B5842] mb-2">Cashout</h3>
            <p className="text-[#4B5842]">
              Get Paid!
            </p>
          </Link>

          
        </div>
      </div>
    </div>
  );
}