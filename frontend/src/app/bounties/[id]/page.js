'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function BountyDetails() {
  const params = useParams();
  const router = useRouter();
  const [bountyDetails, setBountyDetails] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('research');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    setUsername(storedUsername);

    if (params.id) {
      fetchBountyDetails();
    }
  }, [params.id]);

  const fetchBountyDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8080/api/get_bounty_details?bounty_id=${params.id}`);
      const data = await response.json();
      setBountyDetails(data.bounty);
      setSubmissions(data.submissions);
    } catch (err) {
      setError('Failed to fetch bounty details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Convert image to base64
        const base64String = reader.result.split(',')[1];
        setImageFile(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitBounty = async (e) => {
    e.preventDefault();
    
    if (!imageFile) {
      alert('Please upload an image');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/submit_bounty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bounty_id: params.id,
          username,
          image_base64: imageFile,
          submission_type: submissionType
        }),
      });

      const data = await response.json();

      if (data.submission_id) {
        alert('Submission successful!');
        fetchBountyDetails(); // Refresh bounty details
        setImageFile(null);
      } else {
        alert(data.message || 'Failed to submit bounty');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading Bounty Details...</div>
      </div>
    );
  }

  if (error || !bountyDetails) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-red-600">{error || 'Bounty not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Bounty Details */}
        <div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{bountyDetails.title}</h1>
              {renderStatusBadge(bountyDetails.status)}
            </div>
            
            <p className="text-gray-600 mb-4">{bountyDetails.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Plant Species</p>
                <p className="font-semibold">{bountyDetails.plant_species}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reward</p>
                <p className="font-semibold text-green-600">${bountyDetails.reward}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Submissions</p>
                <p className="font-semibold">
                  {bountyDetails.current_submissions}/{bountyDetails.num_submissions_needed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-semibold">{bountyDetails.creator}</p>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Submit Bounty</h2>
            
            <form onSubmit={handleSubmitBounty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="submission_type"
                      value="research"
                      checked={submissionType === 'research'}
                      onChange={() => setSubmissionType('research')}
                      className="form-radio"
                    />
                    <span className="ml-2">Research Submission</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="submission_type"
                      value="removal"
                      checked={submissionType === 'removal'}
                      onChange={() => setSubmissionType('removal')}
                      className="form-radio"
                    />
                    <span className="ml-2">Removal Submission</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Plant Image
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2"
                />
              </div>

              {imageFile && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                  <img 
                    src={`data:image/jpeg;base64,${imageFile}`} 
                    alt="Uploaded" 
                    className="max-w-xs max-h-64 rounded-lg shadow-md"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
              >
                Submit Bounty
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Submissions */}
        <div>
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Bounty Submissions ({submissions.length})
            </h2>
            
            {submissions.length === 0 ? (
              <p className="text-gray-600">No submissions yet</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div 
                    key={submission.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-700">
                        {submission.username}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
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
                    </div>
                    
                    <img 
                      src={`data:image/jpeg;base64,${submission.image_base64}`} 
                      alt="Submission" 
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    
                    <div className="text-sm text-gray-600">
                      <p>Submission Type: {submission.submission_type}</p>
                      <p>Identified Species: {submission.identified_species}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}