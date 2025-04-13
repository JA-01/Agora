'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateBounty() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plant_species: '',
    reward: '',
    num_submissions_needed: '',
    additional_notes: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get username from localStorage
      const username = localStorage.getItem('username');
      if (!username) {
        throw new Error('You must be logged in to create a bounty');
      }

      const response = await fetch('http://localhost:8080/api/create_bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          username,
          reward: parseFloat(formData.reward),
          num_submissions_needed: parseInt(formData.num_submissions_needed)
        }),
      });

      const data = await response.json();

      if (data.bounty_id) {
        // Bounty created successfully
        router.push(`/bounties/${data.bounty_id}`);
      } else {
        // Handle error from server
        setError(data.message || 'Failed to create bounty');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white text-center mb-8">
          Create a New Plant Bounty
        </h2>

        {error && (
          <div className="bg-red-600/30 text-red-300 p-4 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white">
              Bounty Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
              placeholder="Enter a descriptive title for your bounty"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
              placeholder="Provide detailed information about the plant research or removal mission"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="plant_species" className="block text-sm font-medium text-white">
                Subject
              </label>
              <input
                type="text"
                id="plant_species"
                name="plant_species"
                required
                value={formData.plant_species}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
                placeholder="Scientific or common name"
              />
            </div>

            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-white">
                Reward Amount ($)
              </label>
              <input
                type="number"
                id="reward"
                name="reward"
                required
                min="0"
                step="0.01"
                value={formData.reward}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
                placeholder="Amount to be paid per submission"
              />
            </div>
          </div>

          <div>
            <label htmlFor="num_submissions_needed" className="block text-sm font-medium text-white">
              Number of Submissions Needed
            </label>
            <input
              type="number"
              id="num_submissions_needed"
              name="num_submissions_needed"
              required
              min="1"
              value={formData.num_submissions_needed}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
              placeholder="Total number of submissions required"
            />
          </div>

          <div>
            <label htmlFor="additional_notes" className="block text-sm font-medium text-white">
              Additional Notes (Optional)
            </label>
            <textarea
              id="additional_notes"
              name="additional_notes"
              rows={3}
              value={formData.additional_notes}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-lime-300"
              placeholder="Any extra information or specific requirements"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-emerald-700 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50"
            >
              {isLoading ? 'Creating Bounty...' : 'Create Bounty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}