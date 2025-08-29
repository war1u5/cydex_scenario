#!/bin/bash
set -Eeuo pipefail
trap 'rc=$?; echo -e "\033[1;31m[ERROR]\033[0m ${BASH_SOURCE[0]}:$LINENO: \"${BASH_COMMAND}\" -> exit $rc"; exit $rc' ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_COMPOSE="${ROOT_DIR}/docker-compose.yml"
LOGS_DIR="${ROOT_DIR}/logs-analysis"
LOGS_COMPOSE="${LOGS_DIR}/docker-compose.yml"
LOAD_LOGS_SCRIPT="${LOGS_DIR}/load_logs.sh"

OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434/api/tags}"
RAG_API_URL="${RAG_API_URL:-http://127.0.0.1:8000/health}"
LLM_UI_URL="${LLM_UI_URL:-http://127.0.0.1:8501}"
OPENSEARCH_URL="${OPENSEARCH_URL:-https://127.0.0.1:9200}"
DASHBOARDS_URL="${DASHBOARDS_URL:-http://127.0.0.1:5601/api/status}"
OPENSEARCH_USER="${OPENSEARCH_USER:-admin}"
OPENSEARCH_PASS="${OPENSEARCH_PASS:-MyS3curePass!}"

WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"
WAIT_STEP=2

need() { command -v "$1" >/dev/null || { echo "[FAIL] Need '$1'"; exit 1; }; }
log()  { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }

wait_http() {
  local name="$1"; local url="$2"; shift 2 || true
  local deadline=$((SECONDS + WAIT_TIMEOUT))
  log "Waiting for ${name} at ${url}"
  while (( SECONDS < deadline )); do
    if curl -sSf "$url" "$@" >/dev/null 2>&1; then
      ok "${name} is ready."
      return 0
    fi
    sleep "$WAIT_STEP"
  done
  echo "[FAIL] Timeout waiting for ${name} at ${url}" >&2
  exit 1
}

compose_up() {
  local dir="$1"
  [[ -f "${dir}/docker-compose.yml" ]] || { echo "[FAIL] Missing compose in ${dir}"; exit 1; }
  log "Starting docker compose in ${dir}"
  (cd "$dir" && docker compose up -d --build)
  ok "Compose started in ${dir}"
}

need docker
need curl

log "Project root: $ROOT_DIR"

# 1) Up root stack
compose_up "$ROOT_DIR"

wait_http "Ollama API" "$OLLAMA_URL"
wait_http "RAG API" "$RAG_API_URL"
wait_http "LLM UI (Streamlit)" "$LLM_UI_URL"

# 2) Up logs-analysis stack
compose_up "$LOGS_DIR"
wait_http "OpenSearch" "$OPENSEARCH_URL" -k -u "${OPENSEARCH_USER}:${OPENSEARCH_PASS}"
wait_http "Dashboards" "$DASHBOARDS_URL"

# 3) Auto-ingest logs & dashboards
if [[ -x "$LOAD_LOGS_SCRIPT" ]]; then
  log "Running ingestion script: $LOAD_LOGS_SCRIPT"
  "$LOAD_LOGS_SCRIPT"
  ok "Logs + dashboards ingestion complete."
else
  echo "[WARN] No executable $LOAD_LOGS_SCRIPT found — skipping ingestion."
fi

ok "All services ready and logs loaded."
