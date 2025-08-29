from requsets import get
r = get("https://httpbin.org/get", params={"q": "hello"})
print(r.status_code, r.text[:120])
