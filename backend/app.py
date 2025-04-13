@app.route('/api/project_data/<project_id>', methods=['GET'])
@token_required
def project_data(current_user, project_id):
    # Get project
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    # Check if user is authorized
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    # Get data summary
    pictures_count = mongo.db.pictures.count_documents({'project_id': ObjectId(project_id)})
    matching_pictures_count = mongo.db.pictures.count_documents({
        'project_id': ObjectId(project_id),
        'is_match': True
    })
    locations_count = mongo.db.locations.count_documents({'project_id': ObjectId(project_id)})
    contributors_count = len(project.get('contributors', [])) + 1  # +1 for the project creator
    
    # Get available datasets
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
    # Get project
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    # Check if user is authorized
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can access datasets.'}), 403
    
    # Define available datasets
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
    # Get project
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    # Check if user is authorized
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can download data.'}), 403
    
    # Get all pictures for the project
    pictures = list(mongo.db.pictures.find({'project_id': ObjectId(project_id)}))
    
    # Create CSV data
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'User ID', 'User Name', 'Latitude', 'Longitude',
        'Plant Species', 'Confidence', 'Is Match', 'Notes', 'Uploaded At'
    ])
    
    # Write data rows
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
    
    # Create response
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
    # Get project
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    # Check if user is authorized
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can download datasets.'}), 403
    
    # Create CSV data
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Different handling based on dataset type
    if dataset_id == 'pictures':
        # Get all pictures
        pictures = list(mongo.db.pictures.find({'project_id': ObjectId(project_id)}))
        
        # Write header
        writer.writerow([
            'ID', 'User ID', 'User Name', 'Latitude', 'Longitude',
            'Plant Species', 'Confidence', 'Is Match', 'Notes', 'Uploaded At'
        ])
        
        # Write data
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
        # Get matching pictures
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'is_match': True
        }))
        
        # Write header
        writer.writerow([
            'ID', 'User ID', 'User Name', 'Latitude', 'Longitude',
            'Plant Species', 'Confidence', 'Notes', 'Uploaded At'
        ])
        
        # Write data
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
        # Get locations
        locations = list(mongo.db.locations.find({'project_id': ObjectId(project_id)}))
        
        # Write header
        writer.writerow([
            'ID', 'Name', 'Latitude', 'Longitude', 'Description', 'Added By', 'Created At'
        ])
        
        # Write data
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
        # Get contributors
        contributor_ids = project.get('contributors', []) + [project['created_by']]
        contributors = list(mongo.db.users.find({'_id': {'$in': contributor_ids}}))
        
        # Write header
        writer.writerow([
            'ID', 'Name', 'Email', 'Expertise', 'Is Creator', 'Contributions'
        ])
        
        # Write data
        for contributor in contributors:
            # Count contributions (pictures)
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
        # This would be a more complex dataset with multiple tables
        # For simplicity, we'll create a ZIP file with multiple CSVs in a real implementation
        # For now, just redirect to the basic data download
        return download_data(current_user, project_id)
    
    else:
        return jsonify({'message': 'Invalid dataset ID!'}), 400
    
    # Create response
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
    # Get project
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    # Check if user is authorized
    if current_user['_id'] != project['created_by']:
        return jsonify({'message': 'Unauthorized! Only project creators can download all data.'}), 403
    
    # In a real implementation, this would create a ZIP file with multiple datasets
    # For now, redirect to the basic data download
    return download_data(current_user, project_id)

@app.route('/api/project_visualization/<project_id>', methods=['GET'])
@token_required
def project_visualization(current_user, project_id):
    # Get project
    project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    
    if not project:
        return jsonify({'message': 'Project not found!'}), 404
    
    # Check if user is authorized
    if current_user['_id'] != project['created_by'] and current_user['_id'] not in project.get('contributors', []):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    # Get visualization type from query parameters
    viz_type = request.args.get('type', 'map')
    
    # Different handling based on visualization type
    if viz_type == 'map':
        # Get pictures with location data
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'location.latitude': {'$exists': True},
            'location.longitude': {'$exists': True}
        }))
        
        # Format data for map
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
        # Get pictures with timestamps
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'uploaded_at': {'$exists': True}
        }).sort('uploaded_at', 1))
        
        # Create time series data
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
        # Get pictures with confidence scores
        pictures = list(mongo.db.pictures.find({
            'project_id': ObjectId(project_id),
            'plant_identification.confidence': {'$exists': True}
        }))
        
        # Create confidence data
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

# Main entry point
if __name__ == "__main__":
    # Create indexes for better query performance
    mongo.db.projects.create_index([('status', 1)])
    mongo.db.projects.create_index([('created_by', 1)])
    mongo.db.projects.create_index([('plant_type', 1)])
    mongo.db.pictures.create_index([('project_id', 1)])
    mongo.db.pictures.create_index([('user_id', 1)])
    mongo.db.pictures.create_index([('is_match', 1)])
    mongo.db.locations.create_index([('project_id', 1)])
    mongo.db.messages.create_index([('project_id', 1)])
    
    app.run(debug=True)