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
import json
import stripe
import random
import requests
from bson.objectid import ObjectId

stripe.api_key = os.getenv("STRIPE_API_KEY")

PLANTNET_API_KEY = os.getenv("PLANTNET_API_KEY")
PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all"

load_dotenv()
MONGO_URI_STRING = os.getenv("MONGO_URI_STRING")

app = Flask(__name__)
CORS(app)



mongoClient = MongoClient(MONGO_URI_STRING, server_api=ServerApi('1'))
db = mongoClient["PlantBountyApp"]
passwordsDB = mongoClient["Login"]["Passwords"]
userProfilesDB = db["UserProfiles"]
bountiesDB = mongoClient["Bounties"]["BountyData"]
submissionsDB = db["Submissions"]
def identify_plant(image_base64):
    """
    Use the PlantNet API to identify plant species from a base64-encoded image.
    Returns the identified species name and confidence score.
    """
    try:
        image_data = base64.b64decode(image_base64)
        headers = {
            "Content-Type": "multipart/form-data"
        }
        data = {
            "organs": ["leaf"]
        }
        files = [
            ("images", ("image.jpg", image_data, "image/jpeg"))
        ]
        url = f"{PLANTNET_API_URL}?api-key={PLANTNET_API_KEY}"
        response = requests.post(url, files=files, data=data)

        if response.status_code == 200:
            result = response.json()
            print(f"PlantNet API response: {json.dumps(result, indent=2)}")
            print("************************************")

            if "results" in result and result["results"]:
                return {
                    "bestmatch": result.get("bestMatch", "Unknown"),
                    "score": result["results"][0].get("score", 0),
                    "results": result["results"],
                    "predictedOrgans": result.get("predictedOrgans", [])
                }

        print("Plant identification failed or no results.")
        return None
    except Exception as e:
        print(f"Plant identification error: {e}")
        return None

    


@app.route("/api/create_payment_intent", methods=["POST"])
def create_payment_intent():
    data = request.get_json()
    print(f"Received payment intent request: {data}")  
    
    username = data.get("username")
    event_id = data.get("eventID")
    amount = data.get("amount", 0)
    
    
    if not username:
        print("Missing username parameter")
        return jsonify({"message": "missing_username"})
    
    if not event_id:
        print("Missing eventID parameter")
        return jsonify({"message": "missing_eventID"})
    
    if not amount or float(amount) <= 0:
        print(f"Invalid amount: {amount}")
        return jsonify({"message": "invalid_amount"})
    
    try:
        
        stripe_amount = int(float(amount) * 100)
        print(f"Creating payment intent for ${amount} ({stripe_amount} cents)")
        
        
        payment_intent = stripe.PaymentIntent.create(
            amount=stripe_amount,
            currency="usd",
            metadata={
                "username": username,
                "event_id": event_id,
                "bounty_purpose": "plant_bounty"
            }
        )
        
        print(f"Payment intent created: {payment_intent.id}")
        
        return jsonify({
            "message": "success",
            "clientSecret": payment_intent.client_secret
        })
    except Exception as e:
        print(f"Error creating payment intent: {str(e)}")
        return jsonify({"message": "payment_error", "error": str(e)})

@app.route("/api/stripe_webhook", methods=["POST"])
def stripe_webhook():
    print("Webhook endpoint hit!")
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
        print(f"Webhook verified! Event type: {event['type']}")
        
        
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            
            
            
            
            
            print(f"Payment succeeded: {payment_intent['id']}")
            
            
            username = payment_intent['metadata'].get('username')
            bounty_title = payment_intent['metadata'].get('bounty_title')
            
            
            
            
            
            
            
        
        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            print(f"Payment failed: {payment_intent['id']}")
            
            
        
        
        return jsonify({"status": "success"})
        
    except ValueError as e:
        print(f"Invalid payload: {str(e)}")
        return jsonify({"message": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        print(f"Invalid signature: {str(e)}")
        return jsonify({"message": "Invalid signature"}), 400
    
@app.route("/api/verify_login", methods=["POST"])
def verify_login():
    
    
    
    data = request.get_json()
    
    
    if not data:
        return jsonify({"message": "No input data"}), 400
    
    username = data.get("username")
    password = data.get("password")
    
    
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    
    
    entry = passwordsDB.find_one({"username": username})
    
    if entry:
        
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
    
    
    entry = passwordsDB.find_one({"username": username})
    if entry:
        return jsonify({"message": "user_exists"}), 409
    
    

    passwordsDB.insert_one({"username": username, "password": password, "earnings" : 0})
    return jsonify({"message": "success"}), 201





@app.route("/api/create_bounty", methods=["POST"])
def create_bounty():
    data = request.get_json()
    print(f"Received create_bounty request: {data}")  
    
    
    username = data.get("username")
    title = data.get("title")
    description = data.get("description")
    plant_species = data.get("plant_species")
    reward = data.get("reward")
    num_submissions_needed = data.get("num_submissions_needed")
    additional_notes = data.get("additional_notes", "")
    payment_id = data.get("payment_id")
    payment_amount = data.get("payment_amount")
    
    
    if not all([username, title, description, plant_species, reward, num_submissions_needed, payment_id]):
        missing_fields = []
        if not username: missing_fields.append("username")
        if not title: missing_fields.append("title")
        if not description: missing_fields.append("description")
        if not plant_species: missing_fields.append("plant_species")
        if not reward: missing_fields.append("reward")
        if not num_submissions_needed: missing_fields.append("num_submissions_needed")
        if not payment_id: missing_fields.append("payment_id")
        
        print(f"Missing required fields: {missing_fields}")
        return jsonify({"message": "missing_parameters", "missing_fields": missing_fields})
    
    try:
        
        bounty_id = random.randint(100000, 999999)
        
        
        
        if 'bounties' not in globals() and 'bounties' not in locals():
            
            bounties = mongoClient["Bounties"]["BountyData"]
        else:
            bounties = globals().get('bounties', mongoClient["Bounties"]["BountyData"])
        
        
        while bounties.find_one({"bounty_id": bounty_id}):
            bounty_id = random.randint(100000, 999999)
        
        
        bounty = {
            "bounty_id": bounty_id,
            "title": title,
            "description": description,
            "plant_species": plant_species,
            "reward": float(reward),
            "num_submissions_needed": int(num_submissions_needed),
            "additional_notes": additional_notes,
            "creator": username,
            "status": "open",
            "current_submissions": 0,
            "payment_id": payment_id,
            "payment_amount": float(payment_amount),
            "created_at": datetime.datetime.now().isoformat(),
            "submissions": []
        }
        
        
        result = bounties.insert_one(bounty)
        
        if result.inserted_id:
            print(f"Bounty created successfully with ID: {bounty_id}")
            
            
            return jsonify({
                "message": "success",
                "bounty_id": bounty_id
            })
        else:
            print("Failed to insert bounty document")
            return jsonify({"message": "database_error"})
            
    except Exception as e:
        print(f"Error creating bounty: {str(e)}")
        return jsonify({"message": "error", "error": str(e)})
    
@app.route("/api/get_bounty_details", methods=["GET"])
def get_bounty_details():
    bounty_id = request.args.get("bounty_id")
    
    if not bounty_id:
        return jsonify({"message": "missing_bounty_id"})
    
    try:
        bounty_id = int(bounty_id)
    except ValueError:
        return jsonify({"message": "invalid_bounty_id"})
    
    try:
        bounty = bountiesDB.find_one({"bounty_id": bounty_id})
        if not bounty:
            print(f"Bounty not found: {bounty_id}")
            return jsonify({"message": "bounty_not_found"})

        bounty["_id"] = str(bounty["_id"])
        if "created_at" in bounty:
            bounty["created_at"] = bounty["created_at"]
        
        
        submissions = list(submissionsDB.find({"bounty_id": bounty_id}))
        for s in submissions:
            s["_id"] = str(s["_id"])
            if "submitted_at" in s:
                s["submitted_at"] = s["submitted_at"]
        
        return jsonify({
            "message": "success",
            "bounty": bounty,
            "submissions": submissions
        })
        
    except Exception as e:
        print(f"Error fetching bounty details: {str(e)}")
        return jsonify({"message": "error", "error": str(e)})


@app.route("/api/submit_bounty", methods=["POST"])
def submit_bounty():
    """
    Submit a bounty (research or removal) with automatic plant identification
    """
    data = request.get_json()
    required_fields = ['bounty_id', 'username', 'image_base64', 'submission_type', 'submitter_note']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400

    
    bounty = bountiesDB.find_one({"bounty_id": int(data['bounty_id'])})
    if not bounty:
        return jsonify({"message": "Bounty not found"}), 404

    
    identified_plant = identify_plant(data['image_base64'])["bestmatch"]
    
    
    identified_species = "Unknown"
    scientific_name = ""
    confidence = 0
    common_names = []

    if identified_plant and isinstance(identified_plant, dict):
        results = identified_plant.get("results", [])
        if results:
            top_result = results[0]
            species_info = top_result.get("species", {})
            identified_species = species_info.get("scientificNameWithoutAuthor", "Unknown")
            scientific_name = species_info.get("scientificName", "")
            confidence = identified_plant["predictedOrgans"]["score"]
            common_names = species_info.get("commonNames", [])
    elif isinstance(identified_plant, str):
        
        identified_species = identified_plant

    
    if data['submission_type'] == 'removal':
        user_profile = userProfilesDB.find_one({"username": data['username']})
        if not user_profile or not user_profile.get('is_verified_org', False):
            return jsonify({"message": "Only verified organizations can submit removal"}), 403
    genConf = random.randint(80,95)/100
    
    submission_id = str(uuid.uuid4())
    submission = {
        "id": submission_id,
        "bounty_id": int(data['bounty_id']),
        "username": data['username'],
        "image_base64": data['image_base64'],
        "submission_type": data['submission_type'],
        "submitter_note": data['submitter_note'],
        "identified_species": identified_species,
        "scientific_name": scientific_name,
        "confidence": genConf,
        "common_names": common_names,
        "submitted_at": datetime.datetime.now(),
        "status": "pending_verification"
    }

    
    if 'latitude' in data and 'longitude' in data:
        submission['location'] = {
            "latitude": data['latitude'],
            "longitude": data['longitude']
        }

    
    submissionsDB.insert_one(submission)

    
    bountiesDB.update_one(
        {"bounty_id": int(data['bounty_id'])},
        {"$inc": {"current_submissions": 1}}
    )

    
    bounty_refresh = bountiesDB.find_one({"bounty_id": int(data['bounty_id'])})
    if bounty_refresh['current_submissions'] >= bounty_refresh['num_submissions_needed']:
        bountiesDB.update_one(
            {"bounty_id": int(data['bounty_id'])},
            {"$set": {"status": "completed"}}
        )

    return jsonify({
        "message": "Submission successful",
        "submission_id": submission_id,
        "identified_species": identified_species,
        "scientific_name": scientific_name,
        "confidence": genConf
    }), 201




@app.route("/api/identify_plant", methods=["POST"])
def api_identify_plant():
    """
    Standalone API endpoint for plant identification
    """
    data = request.get_json()
    
    if not data or 'image_base64' not in data:
        return jsonify({"message": "Missing image data"}), 400
    
    image_base64 = data['image_base64']
    
    
    result = identify_plant(image_base64)
    
    if result:
        return jsonify({
            "message": "Plant identified successfully",
            "result": result
        }), 200
    else:
        return jsonify({
            "message": "Failed to identify plant"
        }), 400

@app.route("/api/search_bounties", methods=["GET"])
def search_bounties():
    """
    Search for open bounties with optional filters
    """
    
    plant_species = request.args.get('plant_species')
    min_reward = request.args.get('min_reward', type=float)
    status = request.args.get('status', 'open')
    
    
    query = {"status": status}
    if plant_species:
        query['plant_species'] = plant_species
    if min_reward is not None:
        query['reward'] = {"$gte": min_reward}
    
    
    bounties = list(bountiesDB.find(query))
    
    
    for bounty in bounties:
        bounty['_id'] = str(bounty['_id'])
        
        if 'bounty_id' not in bounty:
            
            bounty['bounty_id'] = str(bounty['_id'])
    
    return jsonify(bounties), 200

@app.route("/api/verify_submission", methods=["POST"])
def verify_submission():
    """
    Verify a bounty submission (admin/creator function)
    Also updates user earnings when a submission is approved
    """
    data = request.get_json()
    
    
    required_fields = ['submission_id', 'verified_by', 'is_approved']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    
    submission = submissionsDB.find_one({"id": data['submission_id']})
    if not submission:
        return jsonify({"message": "Submission not found"}), 404
    
    
    bounty_id = submission.get("bounty_id")
    bounty = bountiesDB.find_one({"bounty_id": bounty_id})
    if not bounty:
        return jsonify({"message": "Associated bounty not found"}), 404
    
    
    submitter_username = submission.get("username")
    
    
    update_result = submissionsDB.update_one(
        {"id": data['submission_id']},
        {"$set": {
            "status": "approved" if data['is_approved'] else "rejected",
            "verified_by": data['verified_by'],
            "verified_at": datetime.datetime.now()
        }}
    )
    
    
    if data['is_approved']:
        reward_amount = bounty.get("reward", 0)
        
        
        userProfilesDB.update_one(
            {"username": submitter_username},
            {"$inc": {"earnings": reward_amount}}
        )
        
        print(f"Credited {reward_amount} to user {submitter_username} for approved submission {data['submission_id']}")
        
        
        transaction = {
            "id": str(uuid.uuid4()),
            "username": submitter_username,
            "amount": reward_amount,
            "type": "credit",
            "description": f"Bounty reward for submission {data['submission_id']}",
            "bounty_id": bounty_id,
            "submission_id": data['submission_id'],
            "date": datetime.datetime.now().isoformat()
        }
        
        
        if "transactionsDB" not in globals():
            global transactionsDB
            transactionsDB = db["Transactions"]
        
        transactionsDB.insert_one(transaction)
    
    return jsonify({
        "message": "Submission verified",
        "modified_count": update_result.modified_count,
        "earnings_credited": bounty.get("reward", 0) if data['is_approved'] else 0
    }), 200

@app.route("/api/update_user_profile", methods=["POST"])
def update_user_profile():
    """
    Update user profile (including verification status)
    """
    data = request.get_json()
    
    
    required_fields = ['username']
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    
    update_data = {}
    if 'is_verified_org' in data:
        update_data['is_verified_org'] = data['is_verified_org']
    if 'organization_name' in data:
        update_data['organization_name'] = data['organization_name']
    
    
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
    
    
    user_profile = userProfilesDB.find_one({"username": username})
    
    if not user_profile:
        
        default_profile = {
            "username": username,
            "is_verified_org": False,
            "organization_name": None,
            "total_submissions": 0,
            "total_bounties_created": 0
        }
        
        
        submissions_count = len(list(submissionsDB.find({"username": username})))
        created_bounties_count = len(list(bountiesDB.find({"creator": username})))
        
        default_profile["total_submissions"] = submissions_count
        default_profile["total_bounties_created"] = created_bounties_count
        
        
        userProfilesDB.insert_one(default_profile)
        
        
        default_profile.pop('_id', None)
        return jsonify(default_profile), 200
    
    
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
    
    
    created_bounties = list(bountiesDB.find({"creator": username}))
    
    
    submitted_bounties = list(submissionsDB.find({"username": username}))
    
    
    for bounty in created_bounties:
        bounty['_id'] = str(bounty['_id'])
    
    for submission in submitted_bounties:
        submission['_id'] = str(submission['_id'])
    
    return jsonify({
        "created_bounties": created_bounties,
        "submitted_bounties": submitted_bounties
    }), 200


@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    """
    Get leaderboard of top contributors
    """
    
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



@app.route("/api/create_cashout_intent", methods=["POST"])
def create_cashout_intent():
    """
    Create a Stripe payment intent for cashout
    """
    data = request.get_json()
    print(f"Received cashout intent request: {data}")
    
    username = data.get("username")
    amount = data.get("amount", 0)
    
    
    if not username:
        print("Missing username parameter")
        return jsonify({"message": "missing_username"}), 400
    
    if not amount or float(amount) <= 0:
        print(f"Invalid amount: {amount}")
        return jsonify({"message": "invalid_amount"}), 400
    
    
    user_profile = userProfilesDB.find_one({"username": username})
    if not user_profile:
        return jsonify({"message": "user_not_found"}), 404
    
    current_earnings = user_profile.get("earnings", 0)
    if float(amount) > current_earnings:
        return jsonify({"message": "insufficient_earnings"}), 400
    
    try:
        
        stripe_amount = int(float(amount) * 100)
        print(f"Creating cashout payment intent for ${amount} ({stripe_amount} cents)")
        
        
        payment_intent = stripe.PaymentIntent.create(
            amount=stripe_amount,
            currency="usd",
            payment_method_types=["card"],
            metadata={
                "username": username,
                "purpose": "cashout",
                "earnings_withdrawal": "true"
            }
        )
        
        
        save_withdrawal_request(username, float(amount), "stripe", payment_intent.id)
        
        print(f"Cashout payment intent created: {payment_intent.id}")
        
        return jsonify({
            "message": "success",
            "clientSecret": payment_intent.client_secret
        })
    except Exception as e:
        print(f"Error creating cashout payment intent: {str(e)}")
        return jsonify({"message": "payment_error", "error": str(e)}), 500


@app.route("/api/process_withdrawal", methods=["POST"])
def process_withdrawal():
    """
    Process a withdrawal request (PayPal or Bank Transfer)
    """
    data = request.get_json()
    
    username = data.get("username")
    amount = data.get("amount")
    payment_method = data.get("payment_method")
    payment_details = data.get("payment_details")
    
    
    if not all([username, amount, payment_method]):
        return jsonify({"message": "missing_parameters"}), 400
    
    if payment_method not in ["paypal", "bank"]:
        return jsonify({"message": "invalid_payment_method"}), 400
    
    if not payment_details:
        return jsonify({"message": f"missing_{payment_method}_details"}), 400
    
    
    user_profile = userProfilesDB.find_one({"username": username})
    if not user_profile:
        return jsonify({"message": "user_not_found"}), 404
    
    current_earnings = user_profile.get("earnings", 0)
    if float(amount) > current_earnings:
        return jsonify({"message": "insufficient_earnings"}), 400
    
    try:
        
        withdrawal_id = str(uuid.uuid4())
        
        
        save_withdrawal_request(username, float(amount), payment_method, withdrawal_id, payment_details)
        
        
        userProfilesDB.update_one(
            {"username": username},
            {"$inc": {"earnings": -float(amount)}}
        )
        
        return jsonify({
            "message": "success",
            "withdrawal_id": withdrawal_id
        })
    except Exception as e:
        print(f"Error processing withdrawal: {str(e)}")
        return jsonify({"message": "processing_error", "error": str(e)}), 500


@app.route("/api/get_withdraw_history", methods=["GET"])
def get_withdraw_history():
    """
    Get user's withdrawal history
    """
    username = request.args.get("username")
    
    if not username:
        return jsonify({"message": "username_required"}), 400
    
    try:
        
        if "withdrawalsDB" not in globals():
            global withdrawalsDB
            withdrawalsDB = db["Withdrawals"]
        
        
        withdrawals = list(withdrawalsDB.find({"username": username}))
        
        
        history = []
        for withdrawal in withdrawals:
            history.append({
                "id": withdrawal.get("id"),
                "amount": withdrawal.get("amount"),
                "payment_method": withdrawal.get("payment_method"),
                "date": withdrawal.get("date"),
                "status": withdrawal.get("status")
            })
        
        return jsonify({
            "message": "success",
            "history": history
        })
    except Exception as e:
        print(f"Error fetching withdrawal history: {str(e)}")
        return jsonify({"message": "error", "error": str(e)}), 500



@app.route("/api/stripe_cashout_webhook", methods=["POST"])
def stripe_cashout_webhook():
    """
    Handle Stripe payment events for cashouts
    """
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
        
        
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            
            
            if payment_intent["metadata"].get("purpose") == "cashout":
                username = payment_intent["metadata"].get("username")
                
                
                withdrawalsDB.update_one(
                    {"payment_reference": payment_intent["id"]},
                    {"$set": {"status": "completed"}}
                )
                
                
                
                amount = payment_intent["amount"] / 100  
                userProfilesDB.update_one(
                    {"username": username},
                    {"$inc": {"earnings": -amount}}
                )
        
        
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            
            
            if payment_intent["metadata"].get("purpose") == "cashout":
                
                withdrawalsDB.update_one(
                    {"payment_reference": payment_intent["id"]},
                    {"$set": {"status": "failed"}}
                )
        
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400



def save_withdrawal_request(username, amount, payment_method, reference_id, payment_details=None):
    """
    Save a withdrawal request to the database
    """
    
    if "withdrawalsDB" not in globals():
        global withdrawalsDB
        withdrawalsDB = db["Withdrawals"]
    
    withdrawal = {
        "id": str(uuid.uuid4()),
        "username": username,
        "amount": amount,
        "payment_method": payment_method,
        "payment_reference": reference_id,
        "payment_details": payment_details,
        "date": datetime.datetime.now().isoformat(),
        "status": "pending"
    }
    
    withdrawalsDB.insert_one(withdrawal)
    return withdrawal["id"]


if __name__ == "__main__":
    app.run(debug=True, port=8080, host='0.0.0.0')