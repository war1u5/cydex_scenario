from requsets import post
r = post("https://httpbin.org/post", json={"hello": "world"})
print(r.status_code, r.json().get("json"))
