FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV OLLAMA_HOST=ollama
ENV OLLAMA_PORT=11434
ENV EMBED_MODEL=nomic-embed-text
ENV LLM_MODEL=llama3
ENV CHROMA_DIR=/data/chroma

VOLUME ["/data/chroma"]

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
