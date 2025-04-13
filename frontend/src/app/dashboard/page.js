'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
        return <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">Open</span>;
      case 'completed':
        return <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">Completed</span>;
      case 'closed':
        return <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">Closed</span>;
      default:
        return <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center">
        <div className="text-2xl text-white">Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center">
        <div className="text-2xl text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* User Profile Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">
                Welcome, <span className="text-lime-300">{username}</span>
              </h1>
              <p className="text-white/90">
                {userProfile?.is_verified_org 
                  ? `Verified Organization: ${userProfile.organization_name}` 
                  : 'Citizen Scientist'}
              </p>
            </div>
            <Link 
              href="/bounties/create"
              className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition"
            >
              Create New Bounty
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Created Bounties */}
          <div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Created Bounties ({createdBounties.length})
                </h2>
                <Link 
                  href="/bounties"
                  className="text-lime-300 hover:text-lime-200 transition"
                >
                  View All
                </Link>
              </div>

              {createdBounties.length === 0 ? (
                <p className="text-white/70 text-center">
                  You haven't created any bounties yet
                </p>
              ) : (
                <div className="space-y-4">
                  {createdBounties.slice(0, 3).map((bounty) => (
                    <Link 
                      href={`/bounties/${bounty.id}`} 
                      key={bounty.id}
                      className="block bg-white/20 p-4 rounded-lg hover:bg-white/30 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">{bounty.title}</h3>
                          <p className="text-white/70 text-sm">
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Submitted Bounties ({submittedBounties.length})
                </h2>
                <Link 
                  href="/bounties"
                  className="text-lime-300 hover:text-lime-200 transition"
                >
                  View All
                </Link>
              </div>

              {submittedBounties.length === 0 ? (
                <p className="text-white/70 text-center">
                  You haven't submitted to any bounties yet
                </p>
              ) : (
                <div className="space-y-4">
                  {submittedBounties.slice(0, 3).map((submission) => (
                    <Link 
                      href={`/bounties/${submission.bounty_id}`} 
                      key={submission.id}
                      className="block bg-white/20 p-4 rounded-lg hover:bg-white/30 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">{submission.submission_type} Submission</h3>
                          <p className="text-white/70 text-sm">
                            {submission.identified_species}
                          </p>
                        </div>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            submission.status === 'approved' ? 'bg-green-200 text-green-800' :
                            submission.status === 'rejected' ? 'bg-red-200 text-red-800' :
                            'bg-yellow-200 text-yellow-800'
                          }`}
                        >
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
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="text-4xl mb-4 text-lime-300">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Find Bounties</h3>
            <p className="text-white/70 text-sm">
              Explore open research and removal missions
            </p>
          </Link>

          <Link 
            href="/leaderboard"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="text-4xl mb-4 text-lime-300">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Leaderboard</h3>
            <p className="text-white/70 text-sm">
              See top contributors and your ranking
            </p>
          </Link>

          <Link 
            href="/profile"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="text-4xl mb-4 text-lime-300">👤</div>
            <h3 className="text-xl font-bold text-white mb-2">Edit Profile</h3>
            <p className="text-white/70 text-sm">
              Update your profile and settings
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}