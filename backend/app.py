from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from flask_cors import CORS
from werkzeug.utils import secure_filename
import datetime
import base64
import uuid
import requests
from bson.objectid import ObjectId

# Plant identification API (example - you'll need to replace with actual API)
PLANT_ID_API_KEY = os.getenv("PLANT_ID_API_KEY")

load_dotenv()
MONGO_URI_STRING = os.getenv("MONGO_URI_STRING")

app = Flask(__name__)
CORS(app)

# MongoDB Collections
mongoClient = MongoClient(MONGO_URI_STRING, server_api=ServerApi('1'))
db = mongoClient["PlantBountyApp"]
passwordsDB = mongoClient["Login"]["Passwords"]
userProfilesDB = db["UserProfiles"]
bountiesDB = db["Bounties"]
submissionsDB = db["Submissions"]

# Helper function for plant identification
def identify_plant(image_base64):
    """
    Use a plant identification API to identify plant species
    Note: Replace with actual plant identification API call
    """
    try:
        # Example API call structure - you'll need to implement actual API integration
        response = requests.post(
            "https://plant-identification-api.com/identify",
            headers={
                "Authorization": f"Bearer {PLANT_ID_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "images": [image_base64]
            }
        )
        data = response.json()
        return data.get('species', {}).get('scientific_name')
    except Exception as e:
        print(f"Plant identification error: {e}")
        return None

@app.route("/api/verify_login", methods=["POST"])
def verify_login():
    # Log login attempt
    
    # Get JSON data from request
    data = request.get_json()
    
    # Validate input
    if not data:
        return jsonify({"message": "No input data"}), 400
    
    username = data.get("username")
    password = data.get("password")
    
    # Check for missing credentials
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    
    # Find user in database
    entry = passwordsDB.find_one({"username": username})
    
    if entry:
        # Check password
        if entry.get("password") == password:
            return jsonify({"message": "success"})
        else:
            return jsonify({"message": "invalid_password"}), 401
    else:
        return jsonify({"message": "invalid_user"}), 404

@app.route("/api/add_user", methods=["POST"])
def add_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    # Check for existing user
    entry = passwordsDB.find_one({"username": username})
    if entry:
        return jsonify({"message": "user_exists"}), 409
    
    # Add new user
    passwordsDB.insert_one({"username": username, "password": password})
    return jsonify({"message": "success"}), 201

@app.route("/api/create_bounty", methods=["POST"])
def create_bounty():
    """
    Create a new plant bounty
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'description', 'plant_species', 'reward', 'num_submissions_needed']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    # Validate user
    username = data.get('username')
    user = passwordsDB.find_one({"username": username})
    if not user:
        return jsonify({"message": "Invalid user"}), 403
    
    # Create bounty
    bounty = {
        "id": str(uuid.uuid4()),
        "creator": username,
        "title": data['title'],
        "description": data['description'],
        "plant_species": data['plant_species'],
        "reward": data['reward'],
        "num_submissions_needed": data['num_submissions_needed'],
        "current_submissions": 0,
        "status": "open",
        "created_at": datetime.datetime.now(),
        "additional_notes": data.get('additional_notes', '')
    }
    
    bountiesDB.insert_one(bounty)
    return jsonify({
        "message": "Bounty created successfully",
        "bounty_id": bounty['id']
    }), 201

@app.route("/api/submit_bounty", methods=["POST"])
def submit_bounty():
    """
    Submit a bounty (research or removal)
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['bounty_id', 'username', 'image_base64', 'submission_type']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    # Find the bounty
    bounty = bountiesDB.find_one({"id": data['bounty_id']})
    if not bounty:
        return jsonify({"message": "Bounty not found"}), 404
    
    # Identify plant
    identified_species = identify_plant(data['image_base64'])
    
    # Validate plant species
    if identified_species != bounty['plant_species']:
        return jsonify({
            "message": "Plant species does not match bounty requirements",
            "identified_species": identified_species
        }), 400
    
    # For removal, check if user is from verified organization
    if data['submission_type'] == 'removal':
        user_profile = userProfilesDB.find_one({"username": data['username']})
        if not user_profile or not user_profile.get('is_verified_org', False):
            return jsonify({"message": "Only verified organizations can submit removal"}), 403
    
    # Create submission
    submission = {
        "id": str(uuid.uuid4()),
        "bounty_id": data['bounty_id'],
        "username": data['username'],
        "image_base64": data['image_base64'],
        "submission_type": data['submission_type'],
        "identified_species": identified_species,
        "submitted_at": datetime.datetime.now(),
        "status": "pending_verification"
    }
    
    submissionsDB.insert_one(submission)
    
    # Update bounty submissions count
    bountiesDB.update_one(
        {"id": data['bounty_id']},
        {"$inc": {"current_submissions": 1}}
    )
    
    # Check if bounty is complete
    bounty_refresh = bountiesDB.find_one({"id": data['bounty_id']})
    if bounty_refresh['current_submissions'] >= bounty_refresh['num_submissions_needed']:
        bountiesDB.update_one(
            {"id": data['bounty_id']},
            {"$set": {"status": "completed"}}
        )
    
    return jsonify({
        "message": "Submission successful",
        "submission_id": submission['id']
    }), 201

@app.route("/api/search_bounties", methods=["GET"])
def search_bounties():
    """
    Search for open bounties with optional filters
    """
    # Get query parameters
    plant_species = request.args.get('plant_species')
    min_reward = request.args.get('min_reward', type=float)
    status = request.args.get('status', 'open')
    
    # Build query
    query = {"status": status}
    if plant_species:
        query['plant_species'] = plant_species
    if min_reward is not None:
        query['reward'] = {"$gte": min_reward}
    
    # Fetch bounties
    bounties = list(bountiesDB.find(query))
    
    # Convert ObjectId to string
    for bounty in bounties:
        bounty['_id'] = str(bounty['_id'])
    
    return jsonify(bounties), 200

@app.route("/api/verify_submission", methods=["POST"])
def verify_submission():
    """
    Verify a bounty submission (admin/creator function)
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['submission_id', 'verified_by', 'is_approved']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    # Find submission
    submission = submissionsDB.find_one({"id": data['submission_id']})
    if not submission:
        return jsonify({"message": "Submission not found"}), 404
    
    # Update submission status
    update_result = submissionsDB.update_one(
        {"id": data['submission_id']},
        {"$set": {
            "status": "approved" if data['is_approved'] else "rejected",
            "verified_by": data['verified_by'],
            "verified_at": datetime.datetime.now()
        }}
    )
    
    return jsonify({
        "message": "Submission verified",
        "modified_count": update_result.modified_count
    }), 200

@app.route("/api/update_user_profile", methods=["POST"])
def update_user_profile():
    """
    Update user profile (including verification status)
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    # Prepare update
    update_data = {}
    if 'is_verified_org' in data:
        update_data['is_verified_org'] = data['is_verified_org']
    if 'organization_name' in data:
        update_data['organization_name'] = data['organization_name']
    
    # Update or create user profile
    result = userProfilesDB.update_one(
        {"username": data['username']},
        {"$set": update_data},
        upsert=True
    )
    
    return jsonify({
        "message": "User profile updated",
        "modified_count": result.modified_count
    }), 200

@app.route("/api/get_user_profile", methods=["GET"])
def get_user_profile():
    """
    Retrieve user profile information
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username is required"}), 400
    
    # Look for user profile in the userProfilesDB
    user_profile = userProfilesDB.find_one({"username": username})
    
    if not user_profile:
        # If no profile exists, create a default profile
        default_profile = {
            "username": username,
            "is_verified_org": False,
            "organization_name": None,
            "total_submissions": 0,
            "total_bounties_created": 0
        }
        
        # Count user's submissions and created bounties
        submissions_count = len(list(submissionsDB.find({"username": username})))
        created_bounties_count = len(list(bountiesDB.find({"creator": username})))
        
        default_profile["total_submissions"] = submissions_count
        default_profile["total_bounties_created"] = created_bounties_count
        
        # Insert the default profile
        userProfilesDB.insert_one(default_profile)
        
        # Remove MongoDB's ObjectId
        default_profile.pop('_id', None)
        return jsonify(default_profile), 200
    
    # Remove MongoDB's ObjectId
    user_profile.pop('_id', None)
    return jsonify(user_profile), 200

@app.route("/api/get_user_bounties", methods=["GET"])
def get_user_bounties():
    """
    Retrieve bounties created by or submitted to by a user
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username is required"}), 400
    
    # Bounties created by the user
    created_bounties = list(bountiesDB.find({"creator": username}))
    
    # Bounties submitted to by the user
    submitted_bounties = list(submissionsDB.find({"username": username}))
    
    # Convert ObjectId to string
    for bounty in created_bounties:
        bounty['_id'] = str(bounty['_id'])
    
    for submission in submitted_bounties:
        submission['_id'] = str(submission['_id'])
    
    return jsonify({
        "created_bounties": created_bounties,
        "submitted_bounties": submitted_bounties
    }), 200

@app.route("/api/get_bounty_details", methods=["GET"])
def get_bounty_details():
    """
    Get detailed information about a specific bounty
    """
    bounty_id = request.args.get('bounty_id')
    if not bounty_id:
        return jsonify({"message": "Bounty ID is required"}), 400
    
    # Find the bounty
    bounty = bountiesDB.find_one({"id": bounty_id})
    if not bounty:
        return jsonify({"message": "Bounty not found"}), 404
    
    # Find submissions for this bounty
    submissions = list(submissionsDB.find({"bounty_id": bounty_id}))
    
    # Convert ObjectId to string
    bounty['_id'] = str(bounty['_id'])
    for submission in submissions:
        submission['_id'] = str(submission['_id'])
    
    return jsonify({
        "bounty": bounty,
        "submissions": submissions
    }), 200

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    """
    Get leaderboard of top contributors
    """
    # Aggregate submissions and count approved submissions
    pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {
            "_id": "$username",
            "total_approved_submissions": {"$sum": 1}
        }},
        {"$sort": {"total_approved_submissions": -1}},
        {"$limit": 10}
    ]
    
    leaderboard = list(submissionsDB.aggregate(pipeline))
    
    return jsonify(leaderboard), 200

if __name__ == "__main__":
    app.run(debug=True, port=8080, host='0.0.0.0')