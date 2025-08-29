from dataclasses import dataclass

@dataclass
class RequestInfo:
    method: str
    url: str
    status_code: int
