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
# Plant identification API (example - you'll need to replace with actual API)
PLANTNET_API_KEY = os.getenv("PLANTNET_API_KEY")
PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all"

load_dotenv()
MONGO_URI_STRING = os.getenv("MONGO_URI_STRING")

app = Flask(__name__)
CORS(app)


# MongoDB Collections
mongoClient = MongoClient(MONGO_URI_STRING, server_api=ServerApi('1'))
db = mongoClient["PlantBountyApp"]
passwordsDB = mongoClient["Login"]["Passwords"]
userProfilesDB = db["UserProfiles"]
bountiesDB = mongoClient["Bounties"]["BountyData"]
submissionsDB = db["Submissions"]

bountiesDB.drop()