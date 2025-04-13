import { useState } from 'react';

export default function ProjectInfoTab({ project, username }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(project);
  const isOwner = project.creator === username;
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProject(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/update_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          updates: editedProject,
          username
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        // You'd normally want to refresh the project data here
      } else {
        alert('Failed to update project details');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-green-900">Project Information</h2>
        {isOwner && !isEditing && (
          <button 
            onClick={handleEdit}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Edit Project
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">
              Project Title
            </label>
            <input
              type="text"
              name="title"
              value={editedProject.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={editedProject.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">
              Plant Type
            </label>
            <input
              type="text"
              name="plantType"
              value={editedProject.plantType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">
              Data Needed
            </label>
            <input
              type="text"
              name="dataNeeded"
              value={editedProject.dataNeeded}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={editedProject.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-green-300 text-green-800 rounded-md hover:bg-green-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Description</h3>
            <p className="text-green-800 whitespace-pre-line">
              {project.description || "No description available."}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Research Purpose</h3>
            <p className="text-green-800">
              {project.purpose || "The purpose of this citizen science project is to collect data on " + project.plantType + " to aid in scientific research."}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Data Collection Needs</h3>
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <p className="text-green-800">
                {project.dataNeeded || "No specific data collection instructions provided."}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Project Timeline</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="font-medium text-green-800">Started</h4>
                <p className="text-green-700">{project.startDate || "Not specified"}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="font-medium text-green-800">Expected Duration</h4>
                <p className="text-green-700">{project.duration || "Ongoing"}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="font-medium text-green-800">End Date</h4>
                <p className="text-green-700">{project.endDate || "Not set"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}