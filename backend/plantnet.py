import requests
import json
from pprint import pprint

API_KEY = "2b10qXCefc7mpT4iaul53tV"	
PROJECT = "all"; 
api_endpoint = f"https://my-api.plantnet.org/v2/identify/{PROJECT}?api-key={API_KEY}"

image_path_1 = "plant.jpg"
image_data_1 = open(image_path_1, 'rb')

data = { 'organs': ['flower'] }

files = [
  ('images', (image_path_1, image_data_1))
]

req = requests.Request('POST', url=api_endpoint, files=files, data=data)
prepared = req.prepare()

s = requests.Session()
response = s.send(prepared)
json_result = json.loads(response.text)

pprint(response.status_code)
pprint(json_result)