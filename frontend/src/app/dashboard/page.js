'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon, 
  PhotoIcon, 
  MapPinIcon,
  UserGroupIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  BeakerIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectID = params.id;
  
  const [username, setUsername] = useState('');
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    
    setUsername(storedUsername);
    fetchProjectDetails();
  }, [router, projectID]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/get_project?projectID=${projectID}`);
      const data = await response.json();

      if (data.success) {
        setProject(data.project);
      } else {
        setError('Project not found or you do not have access to this project');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setShareMessage('Project link copied to clipboard');
        setTimeout(() => setShareMessage(''), 3000);
      })
      .catch(() => {
        setShareMessage('Failed to copy link');
        setTimeout(() => setShareMessage(''), 3000);
      });
  };

  // Placeholder content for each tab
  const renderInfoTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Project Information</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-green-800 mb-2">Description</h4>
          <p className="text-green-800">{project.description || "No description available."}</p>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-green-800 mb-2">Research Purpose</h4>
          <p className="text-green-800">
            {project.purpose || `The purpose of this citizen science project is to collect data on ${project.plantType} to aid in scientific research.`}
          </p>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-green-800 mb-2">Data Collection Needs</h4>
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <p className="text-green-800">
              {project.dataNeeded || "No specific data collection instructions provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderContributorsTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Project Contributors</h3>
      <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-6">
        <p className="text-green-800">This project has {project.contributors?.length || 0} active contributors.</p>
      </div>
      
      {(project.contributors || []).length === 0 ? (
        <div className="text-center py-8">
          <UserGroupIcon className="h-12 w-12 text-green-300 mx-auto mb-3" />
          <p className="text-green-800 text-lg font-medium">No Contributors Yet</p>
          <p className="text-green-700">Be the first to contribute to this research project!</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {(project.contributors || []).map((contributor, index) => (
            <div key={index} className="bg-white p-4 rounded-md border border-green-100">
              <div className="flex items-center">
                <div className="bg-green-100 text-green-700 p-2 rounded-full">
                  <UserGroupIcon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-green-900 font-medium">{contributor.username}</p>
                  <p className="text-green-700 text-sm">{contributor.dataPoints || 0} submissions</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const renderDataTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Data Analysis</h3>
      <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-6">
        <p className="text-green-800">
          This project has collected {project.dataPoints || 0} data points so far.
        </p>
      </div>
      
      <div className="bg-white border border-green-100 rounded-lg p-4">
        <div className="h-64 bg-green-50 rounded-md flex items-center justify-center">
          <div className="text-center">
            <ChartBarIcon className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-green-800">Data visualization would appear here</p>
            <p className="text-green-700 text-sm">
              {project.dataPoints > 0 
                ? "Showing trends and patterns from collected data" 
                : "No data available for visualization yet"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderPicturesTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Plant Pictures</h3>
      <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-6">
        <p className="text-green-800">
          Upload and view pictures of plants collected for this research project.
        </p>
      </div>
      
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-green-50 aspect-square rounded-md flex items-center justify-center">
            <PhotoIcon className="h-10 w-10 text-green-400" />
          </div>
        ))}
        <div className="bg-green-50 aspect-square rounded-md border-2 border-dashed border-green-300 flex items-center justify-center">
          <div className="text-center p-4">
            <PhotoIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-700 text-sm">Upload New Picture</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderDiscussionTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Discussion</h3>
      <div className="bg-white border border-green-100 rounded-lg mb-4">
        <textarea
          className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-green-800"
          placeholder="Post a message to the project team..."
          rows={3}
        ></textarea>
        <div className="p-3 border-t border-green-100 flex justify-end">
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Post Message
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {[
          { user: 'ProjectLead', message: 'Welcome to the project! Please share your findings here.', time: '2 days ago' },
          { user: 'Contributor1', message: 'Found some interesting specimens in the north area.', time: '1 day ago' },
        ].map((post, index) => (
          <div key={index} className="bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex justify-between">
              <span className="font-medium text-green-900">{post.user}</span>
              <span className="text-green-700 text-sm">{post.time}</span>
            </div>
            <p className="mt-2 text-green-800">{post.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderLocationsTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Collection Sites</h3>
      <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-6">
        <p className="text-green-800">
          Map of locations where data is being collected for this project.
        </p>
      </div>
      
      <div className="bg-white border border-green-100 rounded-lg p-4">
        <div className="h-64 bg-green-50 rounded-md flex items-center justify-center">
          <div className="text-center">
            <MapPinIcon className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-green-800">Map would appear here</p>
            <p className="text-green-700 text-sm">Showing all collection sites</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderDownloadTab = () => (
    <div>
      <h3 className="text-lg font-medium text-green-900 mb-4">Download Data</h3>
      <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-6">
        <p className="text-green-800">
          Download collected data in CSV format for analysis.
        </p>
      </div>
      
      <div className="space-y-4">
        {[
          { name: 'Complete Dataset', format: 'CSV', size: '1.2 MB', updated: 'Yesterday' },
          { name: 'Plant Growth Data', format: 'CSV', size: '0.8 MB', updated: '3 days ago' },
        ].map((dataset, index) => (
          <div key={index} className="bg-white p-4 rounded-md border border-green-100 flex justify-between items-center">
            <div>
              <p className="font-medium text-green-900">{dataset.name}</p>
              <p className="text-sm text-green-700">{dataset.format} • {dataset.size} • Updated {dataset.updated}</p>
            </div>
            <button className="flex items-center text-green-600 hover:text-green-800">
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
              <span>Download</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!project) return null;
  
    switch(activeTab) {
      case 'info':
        return renderInfoTab();
      case 'contributors':
        return renderContributorsTab();
      case 'data':
        return renderDataTab();
      case 'pictures':
        return renderPicturesTab();
      case 'discussion':
        return renderDiscussionTab();
      case 'locations':
        return renderLocationsTab();
      case 'download':
        return renderDownloadTab();
      default:
        return renderInfoTab();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-green-800 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const isOwner = project.creator === username;
  const isContributor = project.contributors?.includes(username);

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="text-white text-xl font-bold">Agora</Link>
              <span className="mx-2 text-green-200">|</span>
              <h1 className="text-lg font-medium text-white">{project.title}</h1>
            </div>
            <div className="flex items-center">
              <span className="text-white mr-4">
                {isOwner ? 'You own this project' : `Owner: ${project.creator}`}
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 border border-green-100 text-sm font-medium rounded-md text-white hover:bg-green-500"
              >
                <ShareIcon className="h-4 w-4 mr-1" />
                Share
              </button>
              <Link
                href="/dashboard"
                className="ml-3 text-white hover:text-green-100"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {shareMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md shadow-md z-50">
          {shareMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar with tabs */}
          <div className="w-full md:w-64 md:flex-shrink-0 mb-6 md:mb-0">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <nav className="flex flex-col">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'info'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  Project Info
                </button>
                <button
                  onClick={() => setActiveTab('contributors')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'contributors'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Contributors
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'data'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Data Analysis
                </button>
                <button
                  onClick={() => setActiveTab('pictures')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'pictures'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Plant Pictures
                </button>
                <button
                  onClick={() => setActiveTab('discussion')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'discussion'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Discussion
                </button>
                <button
                  onClick={() => setActiveTab('locations')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'locations'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Collection Sites
                </button>
                <button
                  onClick={() => setActiveTab('download')}
                  className={`py-3 px-4 text-left flex items-center ${
                    activeTab === 'download'
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-800 hover:bg-green-50'
                  }`}
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download Data
                </button>
              </nav>
            </div>
            
            {/* Project summary card */}
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <h3 className="text-green-900 font-medium mb-3">Project Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-800">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.status || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">Plant Type:</span>
                  <span className="text-green-700">{project.plantType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">Contributors:</span>
                  <span className="text-green-700">{project.contributors?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">Data Points:</span>
                  <span className="text-green-700">{project.dataPoints || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">Created:</span>
                  <span className="text-green-700">{project.createdAt || 'Unknown'}</span>
                </div>
                {isOwner && (
                  <button className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                    Edit Project
                  </button>
                )}
                {!isOwner && !isContributor && (
                  <button className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                    Join Project
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="md:ml-8 flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}