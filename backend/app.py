from flask import Flask, render_template, request, jsonify, send_file, make_response
from dotenv import load_dotenv
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import requests
import random
from flask_cors import CORS
from werkzeug.utils import secure_filename
import datetime
import json
from bson import json_util
import base64
from openai import OpenAI
from gridfs import GridFS
import io
import requests
import json
from datetime import datetime
import stripe
#By Aayush Palai. DO NOT REPRODUCE FOR COMMERICAL OR PERSONAL PURPOSES.
load_dotenv()
MONGO_URI_STRING = os.getenv("MONGO_URI_STRING")

app = Flask(__name__)

CORS(app)



client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
mongoClient = MongoClient(MONGO_URI_STRING, server_api=ServerApi('1'))

login = mongoClient["Login"]
passwordsDB = login["Passwords"]
ridesDB = mongoClient["Events"]["Rides"]
eventCards = mongoClient["Events"]["EventCards"]
eventPayments = mongoClient["Events"]["EventPayments"]
events = mongoClient["Events"]
arrivalStatusDB = events["ArrivalStatus"]
fs = GridFS(events)
eventsDB = events["Events"]
picturesDB = events["Pictures"]
timesDB = events["Times"]
statsDB = mongoClient["appStats"]
userCountDB = statsDB["userCount"]

@app.route("/api/verify_login", methods=["POST"])
def verify_login():
    userCountDB.insert_one({"type" : "login", "time" : datetime.now().isoformat()})
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    entry = passwordsDB.find_one({"username":username})
    if(entry):
        if(entry.get("password") == password):
            return jsonify({"message" : "success"})
        else:
            return jsonify({"message": "invalid_password"})
    else:
        return jsonify({"message" : "invalid_user"})
    
@app.route("/api/add_user", methods=["POST"])
def add_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    entry  = passwordsDB.find_one({"username":username})
    if(entry):
        return jsonify({"message":"user_exists"})
    passwordsDB.insert_one({"username":username, "password":password})
    return jsonify({"message":"success"})


if __name__ == "__main__":
    app.run(debug=True, port=8080, host = '0.0.0.0')