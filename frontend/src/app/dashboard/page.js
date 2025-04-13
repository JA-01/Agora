'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('my-projects');
  const [username, setUsername] = useState('');
  const [myProjects, setMyProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState('');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    plantType: '',
    dataNeeded: '',
    location: ''
  });
  
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/login');
      return;
    }
    
    setUsername(storedUsername);
    fetchUserData(storedUsername);
  }, [router]);

  const fetchUserData = async (username) => {
    setIsLoading(true);
    try {
      // Fetch user projects
      const projectsResponse = await fetch(`http://localhost:5000/api/user_projects?username=${username}`);
      const projectsData = await projectsResponse.json();
      setMyProjects(projectsData.projects || []);
      
      // Fetch user location
      const userResponse = await fetch(`http://localhost:5000/api/user_profile?username=${username}`);
      const userData = await userResponse.json();
      setLocation(userData.location || '');
      
      // Fetch available projects in user's area
      if (userData.location) {
        const availableResponse = await fetch(`http://localhost:5000/api/available_projects?location=${userData.location}`);
        const availableData = await availableResponse.json();
        setAvailableProjects(availableData.projects || []);
      }
      
      // Fetch completed project data
      const dataResponse = await fetch(`http://localhost:5000/api/project_data?username=${username}`);
      const dataResult = await dataResponse.json();
      setProjectData(dataResult.data || []);
      
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/create_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          ...newProject
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMyProjects([...myProjects, {...newProject, id: data.projectId, status: 'pending'}]);
        setNewProject({
          title: '',
          description: '',
          plantType: '',
          dataNeeded: '',
          location: ''
        });
      } else {
        setError('Failed to create project. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinProject = async (projectId) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/join_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          projectId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update available projects
        setAvailableProjects(availableProjects.filter(project => project.id !== projectId));
        // You might want to refresh my projects here
        fetchUserData(username);
      } else {
        setError('Failed to join project. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = (projectId, projectTitle) => {
    window.location.href = `http://localhost:5000/api/download_data?projectId=${projectId}`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my-projects':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">My Research Projects</h3>
            {myProjects.length === 0 ? (
              <p className="text-gray-500">You haven't created any projects yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myProjects.map(project => (
                  <div key={project.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-green-700">{project.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status === 'completed' ? 'Completed' : 
                         project.status === 'in-progress' ? 'In Progress' : 
                         'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                    <div className="mt-3 text-sm">
                      <p><span className="font-medium">Plant Type:</span> {project.plantType}</p>
                      <p><span className="font-medium">Data Needed:</span> {project.dataNeeded}</p>
                      <p><span className="font-medium">Location:</span> {project.location}</p>
                    </div>
                    <div className="mt-4 text-sm">
                      <p><span className="font-medium">Contributors:</span> {project.contributors || 0}</p>
                      <p><span className="font-medium">Data Points:</span> {project.dataPoints || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'available-projects':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Available Projects in Your Area</h3>
            {!location && (
              <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                Please update your profile with your location to see available projects.
              </div>
            )}
            {location && availableProjects.length === 0 ? (
              <p className="text-gray-500">No available projects in your area at the moment.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableProjects.map(project => (
                  <div key={project.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-green-700">{project.title}</h4>
                      <span className="text-sm text-gray-500">{project.distance}km away</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                    <div className="mt-3 text-sm">
                      <p><span className="font-medium">Created by:</span> {project.creator}</p>
                      <p><span className="font-medium">Plant Type:</span> {project.plantType}</p>
                      <p><span className="font-medium">Data Needed:</span> {project.dataNeeded}</p>
                      <p><span className="font-medium">Location:</span> {project.location}</p>
                    </div>
                    <button
                      onClick={() => handleJoinProject(project.id)}
                      className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Join Project
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'create-project':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Request New Citizen Science Project</h3>
            <form onSubmit={handleCreateProject} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Project Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    required
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="plantType" className="block text-sm font-medium text-gray-700">
                    Plant Type
                  </label>
                  <input
                    type="text"
                    id="plantType"
                    value={newProject.plantType}
                    onChange={(e) => setNewProject({...newProject, plantType: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="dataNeeded" className="block text-sm font-medium text-gray-700">
                    Data Needed
                  </label>
                  <input
                    type="text"
                    id="dataNeeded"
                    value={newProject.dataNeeded}
                    onChange={(e) => setNewProject({...newProject, dataNeeded: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="e.g., Growth rate, flowering times, soil pH"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={newProject.location}
                    onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="e.g., Seattle, WA"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'data-download':
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Download Project Data</h3>
            {projectData.length === 0 ? (
              <p className="text-gray-500">No project data available for download yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Points
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projectData.map(project => (
                      <tr key={project.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {project.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            project.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.dataPoints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {project.lastUpdated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => downloadCSV(project.id, project.title)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Download CSV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
        
      default:
        return <div>Select a tab</div>;
    }
  };

  if (isLoading && !username) {
    return (
      <div className="min-h-screen bg-green-50 flex justify-center items-center">
        <p className="text-green-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-green-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-white text-xl font-bold">Agora</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-white">{username}</div>
              <button
                onClick={() => {
                  localStorage.removeItem('username');
                  router.push('/login');
                }}
                className="ml-4 text-white hover:text-green-200"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('my-projects')}
              className={`py-4 px-1 mr-8 text-center border-b-2 font-medium text-sm ${
                activeTab === 'my-projects'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Projects
            </button>
            <button
              onClick={() => setActiveTab('available-projects')}
              className={`py-4 px-1 mr-8 text-center border-b-2 font-medium text-sm ${
                activeTab === 'available-projects'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Projects
            </button>
            <button
              onClick={() => setActiveTab('create-project')}
              className={`py-4 px-1 mr-8 text-center border-b-2 font-medium text-sm ${
                activeTab === 'create-project'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Project
            </button>
            <button
              onClick={() => setActiveTab('data-download')}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === 'data-download'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Download Data
            </button>
          </nav>
        </div>
        
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}