import os
import httpx

RAG_API_URL = os.getenv("RAG_API_URL", "http://rag-api:8000")

def ingest_text(doc_id: str | None, text: str) -> dict:
    payload = {"doc_id": doc_id, "text": text}
    try:
        r = httpx.post(f"{RAG_API_URL}/ingest", json=payload, timeout=60.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError as e:
        return {"ok": False, "error": f"HTTP error: {e}", "raw": getattr(e, "response", None).text if hasattr(e, "response") and e.response else ""}

# def ingest_file(file_bytes: bytes, filename: str, doc_id: str | None) -> dict:
#     try:
#         files = {"file": (filename, file_bytes, "text/plain")}
#         data = {"doc_id": doc_id} if doc_id else {}
#         r = httpx.post(f"{RAG_API_URL}/ingest_file", data=data, files=files, timeout=120.0)
#         r.raise_for_status()
#         return r.json()
#     except httpx.HTTPError as e:
#         return {"ok": False, "error": f"HTTP error: {e}", "raw": getattr(e, "response", None).text if hasattr(e, "response") and e.response else ""}

def query_rag(question: str, k: int = 2) -> dict:
    payload = {"question": question, "k": k}
    try:
        r = httpx.post(f"{RAG_API_URL}/query", json=payload, timeout=120.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError as e:
        return {"ok": False, "error": f"HTTP error: {e}", "raw": getattr(e, "response", None).text if hasattr(e, "response") and e.response else ""}
