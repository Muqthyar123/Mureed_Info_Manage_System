import httpx

url = "http://127.0.0.1:8000/api/auth/mureed/login"
payload = {
    "email": "meeramuqthyardeveloper@gmail.com",
    "password": "@Mureed_123"
}

print("Posting Mureed login to live FastAPI backend at:", url)
try:
    resp = httpx.post(url, json=payload, timeout=10)
    print("HTTP Status Code:", resp.status_code)
    print("HTTP Response Body:", resp.text)
except Exception as e:
    print("HTTP Request Error:", str(e))
