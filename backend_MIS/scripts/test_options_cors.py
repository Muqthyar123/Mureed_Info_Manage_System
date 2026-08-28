import httpx

url = "http://127.0.0.1:8000/api/auth/admin/login"
headers = {
    "Origin": "http://localhost:5173",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
}

print("Sending OPTIONS request to:", url)
resp = httpx.options(url, headers=headers, timeout=5)
print("Status Code:", resp.status_code)
print("Response Headers:")
for k, v in resp.headers.items():
    print(f"  {k}: {v}")
print("Response Body:", resp.text)
