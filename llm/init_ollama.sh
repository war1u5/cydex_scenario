#!/bin/bash

echo "Starting Ollama server in the background..."
ollama serve &

echo "Waiting for Ollama API to become available..."
until curl -sf http://localhost:11434 > /dev/null; do
    sleep 2
done

echo "Ollama is up. Pulling llama3..."
ollama pull llama3

echo "Pulling embeddings model..."
ollama pull nomic-embed-text

echo "Ollama is ready and serving."

tail -f /dev/null
