import os
import chromadb
from chromadb.config import Settings

_CHROMA_DIR = os.getenv("CHROMA_DIR", "/data/chroma")
_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "docs_ollama768")

client = chromadb.PersistentClient(
    path=_CHROMA_DIR,
    settings=Settings(allow_reset=False, anonymized_telemetry=False)
)

collection = client.get_or_create_collection(
    name=_COLLECTION_NAME,
    embedding_function=None,
    metadata={"hnsw:space": "cosine"}
)

def add_texts(ids, texts, metadatas, embeddings):
    collection.add(
        ids=ids,
        documents=texts,
        metadatas=metadatas,
        embeddings=embeddings
    )

def similarity_search(query_embedding, k=4):
    res = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        include=["documents", "metadatas", "distances"]
    )
    out = []
    if res["documents"]:
        for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            out.append({"document": doc, "metadata": meta, "distance": dist})
    return out
