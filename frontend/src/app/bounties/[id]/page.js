'use client';


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Import icons
import { 
  CalendarIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  CheckBadgeIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  BeakerIcon,
  ClockIcon,
  DocumentTextIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plantPreview, setPlantPreview] = useState(null);
  const [submitterNote, setSubmitterNote] = useState('');



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

  useEffect(() => {
    if (imageFile) {
      handlePlantPreview();
    } else {
      setPlantPreview(null);
    }
  }, [imageFile]);
  

  const fetchBountyDetails = async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching bounty with ID: ${params.id}`); // Add debugging
      const response = await fetch(`/api/get_bounty_details?bounty_id=${params.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Bounty details response:', data); // Add debugging
      
      if (data.message === 'bounty_not_found') {
        setError('Bounty not found');
        setBountyDetails(null);
      } else if (data.message === 'success') {
        setBountyDetails(data.bounty);
        setSubmissions(data.submissions);
      } else {
        setError(data.message || 'Failed to fetch bounty details');
      }
    } catch (err) {
      console.error('Error fetching bounty details:', err);
      setError('Failed to fetch bounty details: ' + err.message);
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
  const handlePlantPreview = async () => {
    if (!imageFile) return;
    
    try {
      // Optional: You can add this to get a quick plant identification preview before submitting
      const response = await fetch('/api/identify_plant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageFile
        }),
      });
      
      const data = await response.json();
      
      if (data.result) {
        setPlantPreview(data.result);
      }
    } catch (err) {
      console.error('Error getting plant preview:', err);
      // Don't show an error to the user as this is just a preview
    }
  };
  const handleSubmitBounty = async (e) => {
    e.preventDefault();
  
    if (!imageFile) {
      alert('Please upload an image');
      return;
    }
  
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
  
    setIsSubmitting(true);
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
  
        try {
          const response = await fetch('/api/submit_bounty', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bounty_id: params.id,
              username,
              image_base64: imageFile,
              submission_type: submissionType,
              submitter_note: submitterNote,
              latitude,         // ⬅️ include location
              longitude,
            }),
          });
  
          const data = await response.json();
  
          if (data.submission_id) {
            if (data.identified_species) {
              const message = `
                Submission successful!
  
                Plant identified as: ${data.identified_species}
                ${data.scientific_name ? `Scientific name: ${data.scientific_name}` : ''}
                ${data.confidence ? `Confidence: ${Math.round(data.confidence * 100)}%` : ''}
              `;
              alert(message);
            } else {
              alert('Submission successful! Plant could not be identified.');
            }
  
            fetchBountyDetails();
            setImageFile(null);
          } else {
            alert(data.message || 'Failed to submit bounty');
          }
        } catch (err) {
          console.error(err);
          alert('Something went wrong. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        alert("Unable to retrieve your location. Please enable location services and try again.");
        setIsSubmitting(false);
      }
    );
  };
  
  
  // Add this function to your BountyDetails component, after the handleSubmitBounty function

const handleVerifySubmission = async (submissionId, isApproved) => {
    if (!confirm(`Are you sure you want to ${isApproved ? 'approve' : 'reject'} this submission?`)) {
    return;
    }
    
    try {
    const response = await fetch('/api/verify_submission', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        submission_id: submissionId,
        verified_by: username,
        is_approved: isApproved
        }),
    });

    const data = await response.json();

    if (data.modified_count > 0) {
        alert(`Submission ${isApproved ? 'approved' : 'rejected'} successfully!`);
        fetchBountyDetails(); // Refresh data
    } else {
        alert('Failed to update submission status');
    }
    } catch (err) {
    console.error('Error verifying submission:', err);
    alert('Something went wrong. Please try again.');
    }
};

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="bg-[#8FB339] text-white border border-[#B7CE63] px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <CheckBadgeIcon className="w-3 h-3 mr-1" /> Open
               </span>;
      case 'completed':
        return <span className="bg-[#B7CE63] text-[#4B5842] border border-[#8FB339] px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <CheckBadgeIcon className="w-3 h-3 mr-1" /> Completed
               </span>;
      case 'closed':
        return <span className="bg-red-800 text-white border border-red-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" /> Closed
               </span>;
      default:
        return <span className="bg-[#8FB339] text-white border border-[#B7CE63] px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <ClockIcon className="w-3 h-3 mr-1" /> {status}
               </span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#DADDD8] flex items-center justify-center">
        <div className="text-2xl text-[#4B5842] flex items-center bg-white p-6 rounded-lg shadow-md border border-[#8FB339]">
          <ClockIcon className="w-8 h-8 mr-2 animate-spin text-[#8FB339]" />
          Loading Bounty Details...
        </div>
      </div>
    );
  }

  if (error || !bountyDetails) {
    return (
      <div className="min-h-screen bg-[#DADDD8] flex items-center justify-center">
        <div className="text-2xl text-white flex items-center bg-[#4B5842] p-6 rounded-lg shadow-md border border-red-600">
          <span className="mr-2">⚠️</span>
          {error || 'Bounty not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-[#DADDD8] min-h-screen">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Bounty Details */}
        <div>
          <div className="bg-[#4B5842] shadow-lg rounded-lg p-6 border border-[#8FB339]">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-white flex items-center">
                <BeakerIcon className="w-8 h-8 mr-2 text-[#B7CE63]" />
                {bountyDetails.title}
              </h1>
              {renderStatusBadge(bountyDetails.status)}
            </div>
            
            <div className="mb-6 p-4 bg-[#4B5842]/80 rounded-lg border-l-4 border-[#B7CE63]">
              <DocumentTextIcon className="w-5 h-5 text-[#C7D59F] inline mr-2" />
              <p className="text-[#DADDD8] inline">{bountyDetails.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-lg border border-[#8FB339] bg-[#4B5842]/90 shadow-md flex items-start">
                <BeakerIcon className="w-5 h-5 text-[#B7CE63] mr-2 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-[#C7D59F] mb-1">Plant Species</p>
                  <p className="font-semibold text-white">{bountyDetails.plant_species}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-[#8FB339] bg-[#4B5842]/90 shadow-md flex items-start">
                <CurrencyDollarIcon className="w-5 h-5 text-[#B7CE63] mr-2 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-[#C7D59F] mb-1">Reward</p>
                  <p className="font-semibold text-[#B7CE63]">${bountyDetails.reward}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border border-[#8FB339] bg-[#4B5842]/90 shadow-md flex items-start">
                <PaperClipIcon className="w-5 h-5 text-[#B7CE63] mr-2 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-[#C7D59F] mb-1">Submissions</p>
                  <p className="font-semibold text-white">
                    {bountyDetails.current_submissions}/{bountyDetails.num_submissions_needed}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-[#8FB339] bg-[#4B5842]/90 shadow-md flex items-start">
                <UserIcon className="w-5 h-5 text-[#B7CE63] mr-2 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-[#C7D59F] mb-1">Created By</p>
                  <p className="font-semibold text-white">{bountyDetails.creator}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="bg-[#4B5842] shadow-lg rounded-lg p-6 mt-6 border border-[#8FB339]">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <ArrowUpTrayIcon className="w-6 h-6 mr-2 text-[#B7CE63]" />
              Submit Bounty
            </h2>
            
            <form onSubmit={handleSubmitBounty} className="space-y-6">
              <div className="p-4 border border-[#8FB339] rounded-lg bg-[#4B5842]/80">
                <label className="block text-sm font-medium text-[#DADDD8] mb-3 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-[#B7CE63]" />
                  Submission Type
                </label>
                <div className="flex space-x-6">
                  <label className="inline-flex items-center p-3 border border-[#8FB339] bg-[#4B5842]/90 rounded-lg hover:bg-[#4B5842]/70 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="submission_type"
                      value="research"
                      checked={submissionType === 'research'}
                      onChange={() => setSubmissionType('research')}
                      className="form-radio text-[#8FB339]"
                    />
                    <span className="ml-2 text-white">Research Submission</span>
                  </label>
                  <label className="inline-flex items-center p-3 border border-[#8FB339] bg-[#4B5842]/90 rounded-lg hover:bg-[#4B5842]/70 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="submission_type"
                      value="removal"
                      checked={submissionType === 'removal'}
                      onChange={() => setSubmissionType('removal')}
                      className="form-radio text-[#8FB339]"
                    />
                    <span className="ml-2 text-white">Removal Submission</span>
                  </label>
                </div>
              </div>
              <div className="p-4 border border-[#8FB339] rounded-lg bg-[#4B5842]/80">
                <label htmlFor="submitter_note" className="block text-sm font-medium text-[#DADDD8] mb-3 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-[#B7CE63]" />
                    Submitter's Note 
                </label>
                <textarea
                    id="submitter_note"
                    value={submitterNote}
                    onChange={(e) => setSubmitterNote(e.target.value)}
                    placeholder="Enter any additional information (optional)"
                    rows="4"
                    className="w-full p-3 border border-[#8FB339] rounded-lg bg-[#4B5842]/90 text-white placeholder-[#C7D59F] focus:outline-none focus:border-[#8FB339] focus:ring-1 focus:ring-[#8FB339]"
                />
                </div>

              <div className="p-4 border border-[#8FB339] rounded-lg bg-[#4B5842]/80">
                <label htmlFor="image" className="block text-sm font-medium text-[#DADDD8] mb-3 flex items-center">
                  <PhotoIcon className="w-5 h-5 mr-2 text-[#B7CE63]" />
                  Upload Plant Image
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-2 border-dashed border-[#B7CE63] rounded-lg hover:bg-[#4B5842]/70 hover:border-[#C7D59F] transition-colors cursor-pointer">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <ArrowUpTrayIcon className="w-10 h-10 text-[#B7CE63]" />
                      <p className="pt-1 text-sm tracking-wider text-[#DADDD8] group-hover:text-white">
                        Select a photo
                      </p>
                    </div>
                    <input 
                      type="file" 
                      id="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="opacity-0"
                    />
                  </label>
                </div>
              </div>

              {imageFile && (
                <div className="mt-4 p-4 border border-[#8FB339] rounded-lg bg-[#4B5842]/80">
                  <p className="text-sm text-[#DADDD8] mb-2 flex items-center">
                    <PhotoIcon className="w-5 h-5 mr-2 text-[#B7CE63]" />
                    Image Preview:
                  </p>
                  <div className="relative">
                    <img 
                      src={`data:image/jpeg;base64,${imageFile}`} 
                      alt="Uploaded" 
                      className="max-w-xs max-h-64 rounded-lg border border-[#8FB339] shadow-md mx-auto"
                    />
                    <button 
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="absolute top-2 right-2 bg-red-800 p-1 rounded-full border border-red-600 hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

                {imageFile && plantPreview && (
                <div className="mt-4 p-4 border border-[#8FB339] rounded-lg bg-[#4B5842]/80">
                    <p className="text-sm text-[#DADDD8] mb-2 flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2 text-[#B7CE63]" />
                    Plant Preview (Preliminary Identification):
                    </p>
                    <div className="bg-[#3A4434] p-3 rounded-lg border border-[#8FB339]/50">
                    <div className="flex justify-between items-center">
                        <div>
                        <p className="text-[#C7D59F] text-xs">Likely Species:</p>
                        <p className="text-white font-medium">
                            {typeof plantPreview === 'string' ? plantPreview : plantPreview.species || 'Unknown'}
                        </p>
                        
                        {plantPreview.scientific_name && (
                            <p className="text-[#C7D59F] text-xs italic mt-1">
                            {plantPreview.scientific_name}
                            </p>
                        )}
                        </div>
                        
                        {plantPreview.confidence !== undefined && (
                        <div className="bg-[#4B5842] p-2 rounded-lg border border-[#8FB339]/30">
                            <p className="text-xs text-[#C7D59F] text-center">Confidence</p>
                            <p className="text-xl font-bold text-[#B7CE63] text-center">
                            {Math.round(plantPreview.confidence * 100)}%
                            </p>
                        </div>
                        )}
                    </div>
                    
                    {plantPreview.common_names && plantPreview.common_names.length > 0 && (
                        <div className="mt-2">
                        <p className="text-[#C7D59F] text-xs">Also Known As:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {plantPreview.common_names.map((name, idx) => (
                            <span 
                                key={idx} 
                                className="bg-[#4B5842] px-2 py-1 rounded-full text-xs text-white"
                            >
                                {name}
                            </span>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>
                    <p className="text-xs text-[#C7D59F] mt-2 italic">
                    This is a preliminary identification. The final result may differ.
                    </p>
                </div>
                )}

                <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-md transition flex items-center justify-center font-medium border shadow-md ${
                    isSubmitting 
                    ? 'bg-[#4B5842] text-[#C7D59F] border-[#8FB339]/50' 
                    : 'bg-[#8FB339] text-white hover:bg-[#B7CE63] border-[#B7CE63]'
                }`}
                >
                {isSubmitting ? (
                    <>
                    <svg className="animate-spin h-5 w-5 mr-3 text-[#C7D59F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Identifying Plant...
                    </>
                ) : (
                    <>
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                    Submit Bounty
                    </>
                )}
                </button>
            </form>
          </div>
        </div>

        {/* Right Column - Submissions */}
        <div>
          <div className="bg-[#4B5842] shadow-lg rounded-lg p-6 border border-[#8FB339]">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <PaperClipIcon className="w-6 h-6 mr-2 text-[#B7CE63]" />
              Bounty Submissions ({submissions.length})
            </h2>
            {submissions.length === 0 ? (
            <div className="text-white p-6 border border-dashed border-[#B7CE63] rounded-lg text-center bg-[#4B5842]/70">
                <PhotoIcon className="w-12 h-12 text-[#B7CE63] mx-auto mb-2" />
                <p>No submissions yet</p>
            </div>
            ) : (
            <div className="space-y-6">
                {submissions.map((submission) => (
                <div 
                    key={submission.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition border-[#8FB339] overflow-hidden bg-[#4B5842]/90 hover:bg-[#4B5842]/70"
                >
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#8FB339]/50">
                    <p className="font-semibold text-white flex items-center">
                        <UserIcon className="w-4 h-4 mr-2 text-[#B7CE63]" />
                        {submission.username}
                    </p>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-[#C7D59F] flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1 text-[#B7CE63]" />
                        {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                        <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${
                            submission.status === 'approved' ? 'bg-[#8FB339] text-white border-[#B7CE63]' :
                            submission.status === 'rejected' ? 'bg-red-800 text-white border-red-600' :
                            'bg-yellow-700 text-white border-yellow-600'
                        }`}
                        >
                        {submission.status === 'approved' && <CheckBadgeIcon className="w-3 h-3 mr-1" />}
                        {submission.status === 'rejected' && <ClockIcon className="w-3 h-3 mr-1" />}
                        {submission.status !== 'approved' && submission.status !== 'rejected' && <ClockIcon className="w-3 h-3 mr-1" />}
                        {submission.status}
                        </span>
                    </div>
                    </div>
                    
                    <div className="rounded-lg overflow-hidden border border-[#8FB339] mb-3">
                    <img 
                        src={`data:image/jpeg;base64,${submission.image_base64}`} 
                        alt="Submission" 
                        className="w-full h-56 object-cover"
                    />
                    </div>
                    
                    {/* Enhanced Plant Identification Display */}
                    <div className="p-3 bg-[#4B5842]/60 rounded-lg border border-[#8FB339] mb-3">
                    <h3 className="text-white font-medium mb-2 flex items-center">
                        <BeakerIcon className="w-4 h-4 mr-2 text-[#B7CE63]" />
                        Plant Identification
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-2">
                        {/* Primary Identification */}
                        <div className="bg-[#4B5842]/80 p-2 rounded border border-[#8FB339]/50">
                        <p className="text-xs text-[#C7D59F]">Identified Species:</p>
                        <p className="font-medium text-white text-sm">
                            {submission.identified_species || "Unknown"}
                        </p>
                        </div>
                        
                        {/* Scientific Name */}
                        {submission.scientific_name && (
                        <div className="bg-[#4B5842]/80 p-2 rounded border border-[#8FB339]/50">
                            <p className="text-xs text-[#C7D59F]">Scientific Name:</p>
                            <p className="font-medium text-white text-sm italic">
                            {submission.scientific_name}
                            </p>
                        </div>
                        )}
                        
                        {/* Confidence Score */}
                        {submission.confidence !== undefined && (
                        <div className="bg-[#4B5842]/80 p-2 rounded border border-[#8FB339]/50">
                            <p className="text-xs text-[#C7D59F]">Confidence:</p>
                            <div className="flex items-center">
                            <div className="w-full bg-[#3A4434] rounded-full h-2 mr-2">
                                <div 
                                className="bg-[#B7CE63] h-2 rounded-full" 
                                style={{ width: `${Math.round(submission.confidence * 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-white text-xs">
                                {Math.round(submission.confidence * 100)}%
                            </span>
                            </div>
                        </div>
                        )}
                        
                        {/* Submission Type */}
                        <div className="bg-[#4B5842]/80 p-2 rounded border border-[#8FB339]/50">
                        <p className="text-xs text-[#C7D59F]">Submission Type:</p>
                        <p className="font-medium text-white text-sm">
                            {submission.submission_type}
                        </p>
                        </div>
                        {/* Location Coordinates (4th item) */}
                        {submission.location && submission.location.latitude && submission.location.longitude && (
                        <div className="bg-[#4B5842]/80 p-2 rounded border border-[#8FB339]/50">
                            <p className="text-xs text-[#C7D59F]">Coordinates:</p>
                            <p className="font-medium text-white text-sm">
                            {submission.location.latitude.toFixed(5)}, {submission.location.longitude.toFixed(5)}
                            </p>
                        </div>
                        )}

                    </div>
                    
                    {/* Common Names List (if available) */}
                    {submission.common_names && submission.common_names.length > 0 && (
                        <div className="mt-2 p-2 bg-[#4B5842]/80 rounded border border-[#8FB339]/50">
                        <p className="text-xs text-[#C7D59F] mb-1">Also Known As:</p>
                        <div className="flex flex-wrap gap-1">
                            {submission.common_names.map((name, index) => (
                            <span 
                                key={index}
                                className="px-2 py-1 bg-[#3A4434] rounded-full text-xs text-white border border-[#8FB339]/30"
                            >
                                {name}
                            </span>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>
                    {/* Submitter's Note */}
                    <div className="mt-4 p-3 bg-[#4B5842]/80 rounded-lg border border-[#8FB339]/50">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                            <PaperClipIcon className="w-4 h-4 mr-2 text-[#B7CE63]" />
                            Submitter's Note
                        </h4>
                        <p className="text-sm text-[#C7D59F]">
                            {submission.submitter_note || "No additional notes from the submitter."}
                        </p>
                    </div>

                    
                    {/* Additional Notes or Actions */}
                    <div className="flex justify-between items-center">
                    <span className="text-xs text-[#C7D59F]">
                        Submission ID: {submission.id.substring(0, 8)}...
                    </span>
                    
                    {submission.status === 'pending_verification' && bountyDetails.creator === username && (
                        <div className="flex space-x-2">
                        <button 
                            className="px-3 py-1 bg-[#8FB339] rounded text-white text-xs border border-[#B7CE63] flex items-center"
                            onClick={() => handleVerifySubmission(submission.id, true)}
                        >
                            <CheckBadgeIcon className="w-3 h-3 mr-1" />
                            Approve
                        </button>
                        <button 
                            className="px-3 py-1 bg-red-800 rounded text-white text-xs border border-red-600 flex items-center"
                            onClick={() => handleVerifySubmission(submission.id, false)}
                        >
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Reject
                        </button>
                        </div>
                    )}
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