import re

def chunk_text(text: str, max_tokens: int = 400, overlap: int = 50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i+max_tokens]
        chunks.append(" ".join(chunk))
        i += max_tokens - overlap
    return chunks

def clean_id(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", s)[:100]
