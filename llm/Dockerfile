FROM ollama/ollama

# RUN apt-get update && apt-get install -y curl

COPY init_ollama.sh /init_ollama.sh

ENTRYPOINT ["/bin/bash", "/init_ollama.sh"]
