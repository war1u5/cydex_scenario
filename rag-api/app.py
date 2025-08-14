import os, httpx, uuid
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from utils import chunk_text, clean_id
import vectorstore as vs

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "ollama")
OLLAMA_PORT = os.getenv("OLLAMA_PORT", "11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
LLM_MODEL   = os.getenv("LLM_MODEL", "llama3")

app = FastAPI(title="RAG API", version="0.1")

async def embed(texts: List[str]) -> List[List[float]]:
    async with httpx.AsyncClient(timeout=60.0) as client:
        out = []
        for t in texts:
            r = await client.post(
                f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/embeddings",
                json={"model": EMBED_MODEL, "prompt": t}
            )
            r.raise_for_status()
            out.append(r.json()["embedding"])
        return out

async def generate(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate",
            json={"model": LLM_MODEL, "prompt": prompt, "stream": False}
        )
        r.raise_for_status()
        return r.json().get("response", "")

class IngestBody(BaseModel):
    doc_id: Optional[str] = None
    text: str

@app.post("/ingest")
async def ingest(body: IngestBody):
    text = body.text.strip()
    if not text:
        return {"ok": False, "error": "empty text"}
    doc_id = body.doc_id or str(uuid.uuid4())
    chunks = chunk_text(text)
    embs = await embed(chunks)
    ids  = [f"{clean_id(doc_id)}_{i}" for i in range(len(chunks))]
    metas = [{"doc_id": doc_id, "chunk": i} for i in range(len(chunks))]
    vs.add_texts(ids, chunks, metas, embs)
    return {"ok": True, "doc_id": doc_id, "chunks": len(chunks)}

@app.post("/ingest_file")
async def ingest_file(file: UploadFile = File(...), doc_id: Optional[str] = Form(None)):
    data = (await file.read()).decode("utf-8", errors="ignore")
    return await ingest(IngestBody(doc_id=doc_id, text=data))

class QueryBody(BaseModel):
    question: str
    k: int = 4

@app.post("/query")
async def query(body: QueryBody):
    q = body.question.strip()
    if not q:
        return {"ok": False, "error": "empty question"}
    # embed question
    q_emb = (await embed([q]))[0]
    # retrieve
    hits = vs.similarity_search(q_emb, k=body.k)
    # build prompt
    context = "\n\n---\n\n".join([h["document"] for h in hits])
    prompt = f"""You are a helpful assistant. Answer based only on the CONTEXT.
If the answer cannot be found in the context, say you don't know.

CONTEXT:
{context}

QUESTION: {q}

ANSWER:"""
    answer = await generate(prompt)
    return {"ok": True, "answer": answer, "sources": hits}
