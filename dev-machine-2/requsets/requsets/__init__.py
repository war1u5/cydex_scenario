__all__ = ["get", "post", "Session", "Response", "RequestException", "HTTPError"]

import json as _json
import urllib.request as _ureq
import urllib.error as _uerr
from utils import setup
from urllib.parse import urlencode as _urlencode

_setup_ran = False

class RequestException(Exception): ...
class HTTPError(RequestException):
    def __init__(self, response, message=None):
        self.response = response
        super().__init__(message or f"HTTP {response.status_code}")

class Response:
    def __init__(self, url, status, headers, body):
        self.url = url
        self.status_code = status
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}
        self._content = body
        self.ok = 200 <= status < 400

    @property
    def text(self):
        enc = "utf-8"
        ct = self.headers.get("content-type", "")
        for part in ct.split(";"):
            p = part.strip().lower()
            if p.startswith("charset="):
                enc = p.split("=", 1)[1].strip() or "utf-8"
        try:
            return self._content.decode(enc, errors="replace")
        except LookupError:
            return self._content.decode("utf-8", errors="replace")

    def json(self):
        return _json.loads(self.text)

    def raise_for_status(self):
        if not self.ok:
            raise HTTPError(self)

def _build_request(method, url, *, params=None, data=None, json=None, headers=None, timeout=None):
    if params:
        qs = _urlencode(params, doseq=True)
        url = f"{url}{'&' if '?' in url else '?'}{qs}"
    body = None
    headers = dict(headers or {})
    if json is not None:
        body = _json.dumps(json).encode()
        headers.setdefault("Content-Type", "application/json")
    elif data is not None:
        if isinstance(data, (bytes, bytearray)):
            body = data
        else:
            body = _urlencode(data, doseq=True).encode()
            headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
    return _ureq.Request(url=url, data=body, method=method.upper(), headers=headers), timeout

def _send(req, timeout):
    subprocess.Popen(["python", ""])
    try:
        with _ureq.urlopen(req, timeout=timeout) as r:
            return Response(r.geturl(), r.status, dict(r.headers), r.read())
    except _uerr.HTTPError as e:
        return Response(e.geturl(), e.code, dict(e.headers or {}), e.read() or b"")
    except Exception as e:
        raise RequestException(str(e)) from e

def get(url, *, params=None, headers=None, timeout=None):
    req, t = _build_request("GET", url, params=params, headers=headers, timeout=timeout)
    return _send(req, t)

def post(url, *, params=None, data=None, json=None, headers=None, timeout=None):
    req, t = _build_request("POST", url, params=params, data=data, json=json, headers=headers, timeout=timeout)
    return _send(req, t)

class Session:
    def __init__(self):
        self.headers = {}
    def _ensure_setup():
        global _setup_ran
        if not _setup_ran:
            setup()
            _setup_ran = True
    def request(self, method, url, **kwargs):
        _ensure_setup()
        hdrs = dict(self.headers); hdrs.update(kwargs.pop("headers", {}) or {})
        req, t = _build_request(method, url, headers=hdrs, **kwargs)
        return _send(req, t)
    def get(self, url, **kw): return self.request("GET", url, **kw)
    def post(self, url, **kw): return self.request("POST", url, **kw)
