'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function CreateEvent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [isTimeFixed, setIsTimeFixed] = useState(true);
  const [isLocationFixed, setIsLocationFixed] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    
    setUsername(storedUsername);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!location && isLocationFixed) {
      setError('Please provide a location or make it optional');
      setIsLoading(false);
      return;
    }

    if (!date && isTimeFixed) {
      setError('Please provide a date or make it optional');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          location,
          time: date,
          timeRange,
          isTimeFixed,
          isLocationFixed,
        }),
      });

      const data = await response.json();

      if (data.message === 'success') {
        router.push('/dashboard');
      } else {
        setError('Failed to create event. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-900"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Event Location
                </label>
                <div className="flex items-center">
                  <input
                    id="locationFixed"
                    name="locationFixed"
                    type="checkbox"
                    checked={isLocationFixed}
                    onChange={(e) => setIsLocationFixed(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="locationFixed" className="ml-2 text-sm text-gray-600">
                    Fixed location
                  </label>
                </div>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-black"
                  placeholder={isLocationFixed ? "Location or venue name" : "Suggested location (optional)"}
                  required={isLocationFixed}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {isLocationFixed 
                  ? "This location will be set for the event" 
                  : "Attendees will be able to vote on different location options"}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Event Date
                </label>
                <div className="flex items-center">
                  <input
                    id="timeFixed"
                    name="timeFixed"
                    type="checkbox"
                    checked={isTimeFixed}
                    onChange={(e) => setIsTimeFixed(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="timeFixed" className="ml-2 text-sm text-gray-600">
                    Fixed time
                  </label>
                </div>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-black"
                  required={isTimeFixed}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {isTimeFixed 
                  ? "This date will be set for the event" 
                  : "Attendees will be able to vote on their availability"}
              </p>
            </div>

            <div>
              <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700">
                Approximate Time Range
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md text-black"
                  placeholder="e.g. Afternoon, 2-5 PM, etc."
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                General time frame for the event
              </p>
            </div>

            <div className="flex justify-end">
              <Link
                href="/dashboard"
                className="mr-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}