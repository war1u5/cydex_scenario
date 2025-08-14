import httpx
import os

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "ollama")
OLLAMA_PORT = os.getenv("OLLAMA_PORT", "11434")

def query_llm(prompt: str, model: str = "llama3") -> str:
    try:
        response = httpx.post(
            f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=60.0
        )
        response.raise_for_status()
        return response.json().get("response", "[No response returned by model]")
    except httpx.ConnectError:
        return f"Could not connect to LLM at `{OLLAMA_HOST}:{OLLAMA_PORT}`."
    except httpx.HTTPStatusError as http_err:
        return f"HTTP error {http_err.response.status_code}:\n{http_err.response.text}"
    except httpx.TimeoutException:
        return "LLM took too long to respond (timeout)."
    except Exception as e:
        return f"Unexpected error: {str(e)}"
