from requsets import get

def test_status_ok():
    r = get("https://httpbin.org/status/200")
    assert r.ok
    assert r.status_code == 200
