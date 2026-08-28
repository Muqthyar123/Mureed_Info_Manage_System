import httpx

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "null",
]

for origin in origins:
    url = "http://127.0.0.1:8000/api/auth/admin/login"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    try:
        resp = httpx.options(url, headers=headers, timeout=5)
        print(f"Origin: {origin:25} -> Status: {resp.status_code} | Allow-Origin: {resp.headers.get('access-control-allow-origin')}")
    except Exception as e:
        print(f"Origin: {origin:25} -> Exception: {e}")
