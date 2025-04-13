from flask import Flask, request, jsonify, send_file
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import jwt
import datetime
import os
from flask_cors import CORS
from bson.json_util import dumps
import uuid
import io
import csv
import numpy as np
import tensorflow as tf
from PIL import Image
import pandas as pd
import matplotlib.pyplot as plt
from geopy.distance import geodesic
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)


app.config["MONGO_URI"] = os.environ.get("MONGO_URI")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your-secret-key-for-jwt")
app.config["UPLOAD_FOLDER"] = os.environ.get("UPLOAD_FOLDER", "/tmp/plant_uploads")


os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


mongo = MongoClient(os.getenv("MONGO_URI"), server_api=ServerApi('1'))


MODEL_PATH = os.environ.get("MODEL_PATH", "plant_identification_model")


try:
    plant_model = tf.keras.models.load_model(MODEL_PATH)
    
    
    with open(os.path.join(MODEL_PATH, "labels.txt"), "r") as f:
        plant_labels = [line.strip() for line in f.readlines()]
    
    plant_model_loaded = True
except:
    
    plant_model_loaded = False
    plant_labels = ["daisy", "dandelion", "roses", "sunflowers", "tulips"]  

def identify_plant(image_path):
    """
    Identify plant species from an image.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Dictionary containing species name and confidence score
    """
    try:
        if plant_model_loaded:
            
            img = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
            
            
            predictions = plant_model.predict(img_array)
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            
            return {
                "species": plant_labels[predicted_class],
                "confidence": confidence
            }
        else:
            
            
            from random import choice, random
            species = choice(plant_labels)
            return {
                "species": species,
                "confidence": 0.7 + (random() * 0.3)  
            }
    except Exception as e:
        print(f"Error in plant identification: {e}")
        return {
            "species": "unknown",
            "confidence": 0.0,
            "error": str(e)
        }


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = mongo.db.users.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'Invalid token!'}), 401
        except:
            return jsonify({'message': 'Invalid token!'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated


def save_image(image_file):
    """Save an image file and return its path"""
    filename = str(uuid.uuid4()) + os.path.splitext(image_file.filename)[1]
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    image_file.save(file_path)
    return file_path, filename

def calculate_distance(location1, location2):
    """Calculate distance between two lat/long locations in km"""
    try:
        point1 = (location1['latitude'], location1['longitude'])
        point2 = (location2['latitude'], location2['longitude'])
        return geodesic(point1, point2).kilometers
    except:
        return float('inf')  


@app.route('/api/add_user', methods=['POST'])
def add_user():
    data = request.get_json()
    
    
    required_fields = ['name', 'email', 'password', 'location']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    
    if mongo.db.users.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists!'}), 400
    
    
    new_user = {
        'name': data['name'],
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'location': data['location'],
        'bio': data.get('bio', ''),
        'expertise': data.get('expertise', []),
        'is_verified_org': data.get('is_verified_org', False),
        'profile_picture': data.get('profile_picture', ''),
        'joined_projects': [],
        'created_projects': [],
        'created_at': datetime.datetime.utcnow()
    }
    
    user_id = mongo.db.users.insert_one(new_user).inserted_id
    
    return jsonify({'message': 'User registered successfully!', 'user_id': str(user_id)}), 201

@app.route('/api/verify_login', methods=['POST'])
def verify_login():
    data = request.get_json()
    
    if 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Email and password are required!'}), 400
    
    user = mongo.db.users.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid credentials!'}), 401
    
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'user_id': str(user['_id']),
        'is_verified_org': user.get('is_verified_org', False)
    })

@app.route('/api/user_profile', methods=['GET'])
@token_required
def user_profile(current_user):
    
    user_data = {
        'id': str(current_user['_id']),
        'name': current_user['name'],
        'email': current_user['email'],
        'location': current_user.get('location', {}),
        'bio': current_user.get('bio', ''),
        'expertise': current_user.get('expertise', []),
        'is_verified_org': current_user.get('is_verified_org', False),
        'profile_picture': current_user.get('profile_picture', ''),
        'joined_projects': current_user.get('joined_projects', []),
        'created_projects': current_user.get('created_projects', []),
        'created_at': current_user['created_at']
    }
    
    return jsonify(user_data)

@app.route('/api/update_profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    
    update_data = {}
    allowed_fields = ['name', 'location', 'bio', 'expertise', 'profile_picture']
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
        
    
    if update_data:
        mongo.db.users.update_one(
            {'_id': current_user['_id']},
            {'$set': update_data}
        )
        
    return jsonify({'message': 'Profile updated successfully!'})


@app.route('/api/create_project', methods=['POST'])
@token_required
def create_project(current_user):
    data = request.get_json()
    
    
    required_fields = ['title', 'description', 'plant_type', 'timeframe', 'payment', 'submissions_needed', 'action_type', 'location']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    
    valid_actions = ['research', 'removal']
    if data['action_type'] not in valid_actions:
        return jsonify({'message': f'Invalid action type. Must be one of: {valid_actions}'}), 400
        
    
    if data['action_type'] == 'removal' and not current_user.get('is_verified_org', False):
        return jsonify({'message': 'Only verified organizations can create removal projects'}), 403
    
    
    new_project = {
        'title': data['title'],
        'description': data['description'],
        'plant_type': data['plant_type'],
        'timeframe': {
            'start': datetime.datetime.fromisoformat(data['timeframe']['start']),
            'end': datetime.datetime.fromisoformat(data['timeframe']['end'])
        },
        'payment': float(data['payment']),
        'submissions_needed': int(data['submissions_needed']),
        'submissions_completed': 0,
        'action_type': data['action_type'],
        'location': data['location'],
        'additional_notes': data.get('additional_notes', ''),
        'created_by': current_user['_id'],
        'contributors': [],
        'invited_users': [],
        'collection_sites': [],
        'status': 'open',
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    
    project_id = mongo.db.projects.insert_one(new_project).inserted_id
    
    
    mongo.db.users.update_one(
        {'_id': current_user['_id']},
        {'$push': {'created_projects': project_id}}
    )
    
    return jsonify({
        'message': 'Project created successfully!',
        'project_id': str(project_id)
    }), 201

@app.route('/api/update_project/<project_id>', methods=['PUT'])
@token_required
def update_project(current_user, project_id):
    data = request.get_json()
    
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if str(project['created_by']) != str(current_user['_id']):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    update_data = {}
    allowed_fields = ['title', 'description', 'additional_notes', 'location', 'timeframe', 'payment', 'submissions_needed']
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
    
    
    if 'timeframe' in update_data:
        update_data['timeframe'] = {
            'start': datetime.datetime.fromisoformat(data['timeframe']['start']),
            'end': datetime.datetime.fromisoformat(data['timeframe']['end'])
        }
    
    
    if update_data:
        update_data['updated_at'] = datetime.datetime.utcnow()
        mongo.db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$set': update_data}
        )
        
    return jsonify({'message': 'Project updated successfully!'})

@app.route('/api/get_project/<project_id>', methods=['GET'])
@token_required
def get_project(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    project['_id'] = str(project['_id'])
    project['created_by'] = str(project['created_by'])
    
    
    if 'contributors' in project:
        project['contributors'] = [str(user_id) for user_id in project['contributors']]
    if 'invited_users' in project:
        project['invited_users'] = [str(user_id) for user_id in project['invited_users']]
    
    return jsonify(project)

@app.route('/api/user_projects', methods=['GET'])
@token_required
def user_projects(current_user):
    
    projects = list(mongo.db.projects.find({'created_by': current_user['_id']}))
    
    
    for project in projects:
        project['_id'] = str(project['_id'])
        project['created_by'] = str(project['created_by'])
        
        
        if 'contributors' in project:
            project['contributors'] = [str(user_id) for user_id in project['contributors']]
        if 'invited_users' in project:
            project['invited_users'] = [str(user_id) for user_id in project['invited_users']]
    
    return jsonify(projects)

@app.route('/api/available_projects', methods=['GET'])
@token_required
def available_projects(current_user):
    
    user_location = current_user.get('location', {})
    
    
    max_distance = float(request.args.get('max_distance', 50))  
    action_type = request.args.get('action_type')
    plant_type = request.args.get('plant_type')
    status = request.args.get('status', 'open')
    
    
    query = {'status': status}
    
    
    if action_type:
        query['action_type'] = action_type
        
    
    if plant_type:
        query['plant_type'] = plant_type
    
    
    projects = list(mongo.db.projects.find(query))
    
    
    filtered_projects = []
    if user_location and 'latitude' in user_location and 'longitude' in user_location:
        for project in projects:
            project_location = project.get('location', {})
            if 'latitude' in project_location and 'longitude' in project_location:
                distance = calculate_distance(user_location, project_location)
                if distance <= max_distance:
                    project['distance'] = round(distance, 2)  
                    filtered_projects.append(project)
            else:
                
                project['distance'] = None
                filtered_projects.append(project)
    else:
        
        filtered_projects = projects
    
    
    for project in filtered_projects:
        project['_id'] = str(project['_id'])
        project['created_by'] = str(project['created_by'])
        
        
        if 'contributors' in project:
            project['contributors'] = [str(user_id) for user_id in project['contributors']]
        if 'invited_users' in project:
            project['invited_users'] = [str(user_id) for user_id in project['invited_users']]
    
    
    filtered_projects.sort(key=lambda x: x.get('distance', float('inf')))
    
    return jsonify(filtered_projects)


@app.route('/api/join_project/<project_id>', methods=['POST'])
@token_required
def join_project(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if project['status'] != 'open':
        return jsonify({'message': 'Project is not open for contributions!'}), 400
    
    
    if current_user['_id'] in project.get('contributors', []):
        return jsonify({'message': 'You are already a contributor to this project!'}), 400
    
    
    mongo.db.projects.update_one(
        {'_id': ObjectId(project_id)},
        {'$push': {'contributors': current_user['_id']}}
    )
    
    
    mongo.db.users.update_one(
        {'_id': current_user['_id']},
        {'$push': {'joined_projects': ObjectId(project_id)}}
    )
    
    return jsonify({'message': 'You have joined the project successfully!'})

@app.route('/api/project_contributors/<project_id>', methods=['GET'])
@token_required
def project_contributors(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    contributors = []
    
    if 'contributors' in project and project['contributors']:
        contributor_ids = [ObjectId(user_id) for user_id in project['contributors']]
        contributor_cursor = mongo.db.users.find({'_id': {'$in': contributor_ids}})
        
        for user in contributor_cursor:
            contributors.append({
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'profile_picture': user.get('profile_picture', ''),
                'expertise': user.get('expertise', [])
            })
    
    return jsonify(contributors)

@app.route('/api/invite_contributor/<project_id>', methods=['POST'])
@token_required
def invite_contributor(current_user, project_id):
    data = request.get_json()
    
    if 'email' not in data:
        return jsonify({'message': 'Email is required!'}), 400
    
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if str(project['created_by']) != str(current_user['_id']):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    invited_user = mongo.db.users.find_one({'email': data['email']})
    
    if not invited_user:
        return jsonify({'message': 'User not found!'}), 404
    
    
    if invited_user['_id'] in project.get('invited_users', []):
        return jsonify({'message': 'User already invited!'}), 400
    
    
    if invited_user['_id'] in project.get('contributors', []):
        return jsonify({'message': 'User is already a contributor!'}), 400
    
    
    mongo.db.projects.update_one(
        {'_id': ObjectId(project_id)},
        {'$push': {'invited_users': invited_user['_id']}}
    )
    
    
    
    return jsonify({'message': f'Invitation sent to {data["email"]}!'})


@app.route('/api/upload_picture/<project_id>', methods=['POST'])
@token_required
def upload_picture(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] not in project.get('contributors', []) and current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    if 'picture' not in request.files:
        return jsonify({'message': 'No picture provided!'}), 400
    
    picture = request.files['picture']
    
    if picture.filename == '':
        return jsonify({'message': 'No picture selected!'}), 400
    
    
    location = request.form.get('location', '{}')
    notes = request.form.get('notes', '')
    collection_site_id = request.form.get('collection_site_id', None)
    
    try:
        location = eval(location)  
    except:
        location = {}
    
    
    file_path, filename = save_image(picture)
    
    
    plant_data = identify_plant(file_path)
    
    
    new_picture = {
        'project_id': ObjectId(project_id),
        'user_id': current_user['_id'],
        'filename': filename,
        'file_path': file_path,
        'location': location,
        'notes': notes,
        'collection_site_id': ObjectId(collection_site_id) if collection_site_id else None,
        'plant_identification': plant_data,
        'is_match': plant_data['species'].lower() == project['plant_type'].lower(),
        'uploaded_at': datetime.datetime.utcnow()
    }
    
    picture_id = mongo.db.pictures.insert_one(new_picture).inserted_id
    
    
    if new_picture['is_match'] and project['submissions_completed'] < project['submissions_needed']:
        mongo.db.projects.update_one(
            {'_id': ObjectId(project_id)},
            {'$inc': {'submissions_completed': 1}}
        )
        
        
        updated_project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
        if updated_project['submissions_completed'] >= updated_project['submissions_needed']:
            mongo.db.projects.update_one(
                {'_id': ObjectId(project_id)},
                {'$set': {'status': 'completed'}}
            )
    
    return jsonify({
        'message': 'Picture uploaded successfully!',
        'picture_id': str(picture_id),
        'identification': plant_data,
        'is_match': new_picture['is_match']
    })

@app.route('/api/project_pictures/<project_id>', methods=['GET'])
@token_required
def project_pictures(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    pictures = list(mongo.db.pictures.find({'project_id': ObjectId(project_id)}))
    
    
    for picture in pictures:
        picture['_id'] = str(picture['_id'])
        picture['project_id'] = str(picture['project_id'])
        picture['user_id'] = str(picture['user_id'])
        if picture.get('collection_site_id'):
            picture['collection_site_id'] = str(picture['collection_site_id'])
    
    return jsonify(pictures)

@app.route('/api/add_location/<project_id>', methods=['POST'])
@token_required
def add_location(current_user, project_id):
    data = request.get_json()
    
    
    required_fields = ['name', 'latitude', 'longitude']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    new_location = {
        'project_id': ObjectId(project_id),
        'name': data['name'],
        'latitude': float(data['latitude']),
        'longitude': float(data['longitude']),
        'description': data.get('description', ''),
        'added_by': current_user['_id'],
        'created_at': datetime.datetime.utcnow()
    }
    
    location_id = mongo.db.locations.insert_one(new_location).inserted_id
    
    
    mongo.db.projects.update_one(
        {'_id': ObjectId(project_id)},
        {'$push': {'collection_sites': location_id}}
    )
    
    return jsonify({
        'message': 'Location added successfully!',
        'location_id': str(location_id)
    })

@app.route('/api/project_locations/<project_id>', methods=['GET'])
@token_required
def project_locations(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    locations = list(mongo.db.locations.find({'project_id': ObjectId(project_id)}))
    
    
    for location in locations:
        location['_id'] = str(location['_id'])
        location['project_id'] = str(location['project_id'])
        location['added_by'] = str(location['added_by'])
    
    return jsonify(locations)

@app.route('/api/post_message/<project_id>', methods=['POST'])
@token_required
def post_message(current_user, project_id):
    data = request.get_json()
    
    if 'content' not in data:
        return jsonify({'message': 'Message content is required!'}), 400
    
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    new_message = {
        'project_id': ObjectId(project_id),
        'user_id': current_user['_id'],
        'content': data['content'],
        'created_at': datetime.datetime.utcnow()
    }
    
    message_id = mongo.db.messages.insert_one(new_message).inserted_id
    
    return jsonify({
        'message': 'Message posted successfully!',
        'message_id': str(message_id)
    })

@app.route('/api/project_discussion/<project_id>', methods=['GET'])
@token_required
def project_discussion(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    messages = list(mongo.db.messages.find({'project_id': ObjectId(project_id)}).sort('created_at', 1))
    
    
    for message in messages:
        message['_id'] = str(message['_id'])
        message['project_id'] = str(message['project_id'])
        
        
        user_id = message['user_id']
        user = mongo.db.users.find_one({'_id': user_id})
        
        message['user'] = {
            'id': str(user['_id']),
            'name': user['name'],
            'profile_picture': user.get('profile_picture', '')
        }
        
        message['user_id'] = str(message['user_id'])
    
    return jsonify(messages)

@app.route('/api/project_data/<project_id>', methods=['GET'])
@token_required
def project_data(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    pictures_count = mongo.db.pictures.count_documents({'project_id': ObjectId(project_id)})
    matching_pictures_count = mongo.db.pictures.count_documents({
        'project_id': ObjectId(project_id),
        'is_match': True
    })
    locations_count = mongo.db.locations.count_documents({'project_id': ObjectId(project_id)})
    contributors_count = len(project.get('contributors', [])) + 1  
    
    
    datasets = [
        {
            'id': 'pictures',
            'name': 'Plant Pictures',
            'description': 'All plant pictures with identification data',
            'count': pictures_count
        },
        {
            'id': 'matching_pictures',
            'name': 'Matching Plant Pictures',
            'description': f'Pictures that match the target plant type ({project["plant_type"]})',
            'count': matching_pictures_count
        },
        {
            'id': 'locations',
            'name': 'Collection Locations',
            'description': 'Data collection site locations',
            'count': locations_count
        },
        {
            'id': 'contributors',
            'name': 'Contributors',
            'description': 'Project contributor information',
            'count': contributors_count
        },
        {
            'id': 'all',
            'name': 'Complete Project Data',
            'description': 'All data associated with this project',
            'count': pictures_count + locations_count + contributors_count
        }
    ]
    
    return jsonify({
        'project_id': str(project['_id']),
        'project_title': project['title'],
        'plant_type': project['plant_type'],
        'action_type': project['action_type'],
        'progress': {
            'submissions_completed': project['submissions_completed'],
            'submissions_needed': project['submissions_needed'],
            'completion_percentage': (project['submissions_completed'] / project['submissions_needed']) * 100 if project['submissions_needed'] > 0 else 0
        },
        'datasets': datasets
    })

@app.route('/api/project_datasets/<project_id>', methods=['GET'])
@token_required
def project_datasets(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can access datasets.'}), 403
    
    
    datasets = [
        {
            'id': 'pictures',
            'name': 'Plant Pictures',
            'description': 'All plant pictures with identification data',
            'fields': ['id', 'user_id', 'location', 'plant_identification', 'is_match', 'uploaded_at', 'notes']
        },
        {
            'id': 'matching_pictures',
            'name': 'Matching Plant Pictures',
            'description': f'Pictures that match the target plant type ({project["plant_type"]})',
            'fields': ['id', 'user_id', 'location', 'plant_identification', 'uploaded_at', 'notes']
        },
        {
            'id': 'locations',
            'name': 'Collection Locations',
            'description': 'Data collection site locations',
            'fields': ['id', 'name', 'latitude', 'longitude', 'description', 'added_by', 'created_at']
        },
        {
            'id': 'contributors',
            'name': 'Contributors',
            'description': 'Project contributor information',
            'fields': ['id', 'name', 'email', 'expertise']
        },
        {
            'id': 'all',
            'name': 'Complete Project Data',
            'description': 'All data associated with this project',
            'fields': ['various fields from all datasets']
        }
    ]
    
    return jsonify(datasets)

@app.route('/api/download_data/<project_id>', methods=['GET'])
@token_required
def download_data(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can download data.'}), 403
    
    
    pictures = list(mongo.db.pictures.find({'project_id': ObjectId(project_id)}))
    
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    
    writer.writerow([
        'ID', 'User ID', 'User Name', 'Latitude', 'Longitude',
        'Plant Species', 'Confidence', 'Is Match', 'Notes', 'Uploaded At'
    ])
    
    
    for picture in pictures:
        user = mongo.db.users.find_one({'_id': picture['user_id']})
        user_name = user['name'] if user else 'Unknown'
        
        location = picture.get('location', {})
        latitude = location.get('latitude', '')
        longitude = location.get('longitude', '')
        
        identification = picture.get('plant_identification', {})
        species = identification.get('species', 'unknown')
        confidence = identification.get('confidence', 0.0)
        
        writer.writerow([
            str(picture['_id']),
            str(picture['user_id']),
            user_name,
            latitude,
            longitude,
            species,
            confidence,
            picture.get('is_match', False),
            picture.get('notes', ''),
            picture.get('uploaded_at', '').isoformat() if picture.get('uploaded_at') else ''
        ])
    
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'project_{project_id}_data.csv'
    )

@app.route('/api/download_dataset/<project_id>/<dataset_id>', methods=['GET'])
@token_required
def download_dataset(current_user, project_id, dataset_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can download datasets.'}), 403
    
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    
    if dataset_id == 'pictures':
        
        pictures = list(mongo.db.pictures.find({'project_id': ObjectId(project_id)}))
        
        
        writer.writerow([
            'ID', 'User ID', 'User Name', 'Latitude', 'Longitude',
            'Plant Species', 'Confidence', 'Is Match', 'Notes', 'Uploaded At'
        ])
        
        
        for picture in pictures:
            user = mongo.db.users.find_one({'_id': picture['user_id']})
            user_name = user['name'] if user else 'Unknown'
            
            location = picture.get('location', {})
            latitude = location.get('latitude', '')
            longitude = location.get('longitude', '')
            
            identification = picture.get('plant_identification', {})
            species = identification.get('species', 'unknown')
            confidence = identification.get('confidence', 0.0)
            
            writer.writerow([
                str(picture['_id']),
                str(picture['user_id']),
                user_name,
                latitude,
                longitude,
                species,
                confidence,
                picture.get('is_match', False),
                picture.get('notes', ''),
                picture.get('uploaded_at', '').isoformat() if picture.get('uploaded_at') else ''
            ])
        
        filename = f'project_{project_id}_pictures.csv'
    
    elif dataset_id == 'matching_pictures':
        
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'is_match': True
        }))
        
        
        writer.writerow([
            'ID', 'User ID', 'User Name', 'Latitude', 'Longitude',
            'Plant Species', 'Confidence', 'Notes', 'Uploaded At'
        ])
        
        
        for picture in pictures:
            user = mongo.db.users.find_one({'_id': picture['user_id']})
            user_name = user['name'] if user else 'Unknown'
            
            location = picture.get('location', {})
            latitude = location.get('latitude', '')
            longitude = location.get('longitude', '')
            
            identification = picture.get('plant_identification', {})
            species = identification.get('species', 'unknown')
            confidence = identification.get('confidence', 0.0)
            
            writer.writerow([
                str(picture['_id']),
                str(picture['user_id']),
                user_name,
                latitude,
                longitude,
                species,
                confidence,
                picture.get('notes', ''),
                picture.get('uploaded_at', '').isoformat() if picture.get('uploaded_at') else ''
            ])
        
        filename = f'project_{project_id}_matching_pictures.csv'
    
    elif dataset_id == 'locations':
        
        locations = list(mongo.db.locations.find({'project_id': ObjectId(project_id)}))
        
        
        writer.writerow([
            'ID', 'Name', 'Latitude', 'Longitude', 'Description', 'Added By', 'Created At'
        ])
        
        
        for location in locations:
            user = mongo.db.users.find_one({'_id': location['added_by']})
            user_name = user['name'] if user else 'Unknown'
            
            writer.writerow([
                str(location['_id']),
                location['name'],
                location['latitude'],
                location['longitude'],
                location.get('description', ''),
                user_name,
                location.get('created_at', '').isoformat() if location.get('created_at') else ''
            ])
        
        filename = f'project_{project_id}_locations.csv'
    
    elif dataset_id == 'contributors':
        
        contributor_ids = project.get('contributors', []) + [project['created_by']]
        contributors = list(mongo.db.users.find({'_id': {'$in': contributor_ids}}))
        
        
        writer.writerow([
            'ID', 'Name', 'Email', 'Expertise', 'Is Creator', 'Contributions'
        ])
        
        
        for contributor in contributors:
            
            contribution_count = mongo.db.pictures.count_documents({
                'project_id': ObjectId(project_id),
                'user_id': contributor['_id']
            })
            
            writer.writerow([
                str(contributor['_id']),
                contributor['name'],
                contributor['email'],
                ', '.join(contributor.get('expertise', [])),
                str(contributor['_id'] == project['created_by']),
                contribution_count
            ])
        
        filename = f'project_{project_id}_contributors.csv'
    
    elif dataset_id == 'all':
        
        
        
        return download_data(current_user, project_id)
    
    else:
        return jsonify({'message': 'Invalid dataset ID!'}), 400
    
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )

@app.route('/api/download_all_data/<project_id>', methods=['GET'])
@token_required
def download_all_data(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can download all data.'}), 403
    
    
    
    return download_data(current_user, project_id)

@app.route('/api/project_visualization/<project_id>', methods=['GET'])
@token_required
def project_visualization(current_user, project_id):
    
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    
    viz_type = request.args.get('type', 'map')
    
    
    if viz_type == 'map':
        
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'location.latitude': {'$exists': True},
            'location.longitude': {'$exists': True}
        }))
        
        
        map_data = []
        for picture in pictures:
            location = picture.get('location', {})
            identification = picture.get('plant_identification', {})
            
            map_data.append({
                'id': str(picture['_id']),
                'latitude': location.get('latitude'),
                'longitude': location.get('longitude'),
                'species': identification.get('species', 'unknown'),
                'confidence': identification.get('confidence', 0),
                'is_match': picture.get('is_match', False),
                'uploaded_at': picture.get('uploaded_at', '').isoformat() if picture.get('uploaded_at') else ''
            })
        
        return jsonify(map_data)
    
    elif viz_type == 'time_series':
        
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'uploaded_at': {'$exists': True}
        }).sort('uploaded_at', 1))
        
        
        time_data = []
        cumulative_matches = 0
        
        for picture in pictures:
            if picture.get('is_match', False):
                cumulative_matches += 1
            
            time_data.append({
                'date': picture.get('uploaded_at', '').isoformat() if picture.get('uploaded_at') else '',
                'cumulative_matches': cumulative_matches,
                'is_match': picture.get('is_match', False)
            })
        
        return jsonify(time_data)
    
    elif viz_type == 'confidence':
        
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'plant_identification.confidence': {'$exists': True}
        }))
        
        
        confidence_data = []
        
        for picture in pictures:
            identification = picture.get('plant_identification', {})
            confidence_data.append({
                'id': str(picture['_id']),
                'species': identification.get('species', 'unknown'),
                'confidence': identification.get('confidence', 0),
                'is_match': picture.get('is_match', False)
            })
        
        return jsonify(confidence_data)
    
    else:
        return jsonify({'message': 'Invalid visualization type!'}), 400


if __name__ == "__main__":
    
    mongo.db.projects.create_index([('status', 1)])
    mongo.db.projects.create_index([('created_by', 1)])
    mongo.db.projects.create_index([('plant_type', 1)])
    mongo.db.pictures.create_index([('project_id', 1)])
    mongo.db.pictures.create_index([('user_id', 1)])
    mongo.db.pictures.create_index([('is_match', 1)])
    mongo.db.locations.create_index([('project_id', 1)])
    mongo.db.messages.create_index([('project_id', 1)])
    
    app.run(debug=True)