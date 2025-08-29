#!/bin/bash
set -Eeuo pipefail
trap 'rc=$?; echo -e "\033[1;31m[ERROR]\033[0m ${BASH_SOURCE[0]}:$LINENO: \"${BASH_COMMAND}\" -> exit $rc"; exit $rc' ERR

# =========================
# Config (override via env)
# =========================
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_COMPOSE="${ROOT_DIR}/docker-compose.yml"
LOGS_DIR="${ROOT_DIR}/logs-analysis"
LOGS_COMPOSE="${LOGS_DIR}/docker-compose.yml"

OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434/api/tags}"
RAG_API_URL="${RAG_API_URL:-http://127.0.0.1:8000/health}"
LLM_UI_URL="${LLM_UI_URL:-http://127.0.0.1:8501}"

OPENSEARCH_URL="${OPENSEARCH_URL:-https://127.0.0.1:9200}"
OPENSEARCH_USER="${OPENSEARCH_USER:-admin}"
OPENSEARCH_PASS="${OPENSEARCH_PASS:-MyS3curePass!}"

DASHBOARDS_URL="${DASHBOARDS_URL:-http://127.0.0.1:5601/api/status}"

WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"
WAIT_STEP="${WAIT_STEP:-2}"

need() { command -v "$1" >/dev/null || { echo "[FAIL] Need '$1' in PATH"; exit 1; }; }
log()  { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }

wait_http() {
  local name="$1"; shift
  local url="$1"; shift || true
  local deadline=$((SECONDS + WAIT_TIMEOUT))

  log "Waiting for ${name} at ${url}"
  while (( SECONDS < deadline )); do
    if curl -sSf "$url" "$@" >/dev/null 2>&1; then
      ok "${name} is reachable."
      return 0
    fi
    sleep "$WAIT_STEP"
  done
  echo "[FAIL] Timeout waiting for ${name} at ${url} after ${WAIT_TIMEOUT}s"
  exit 1
}

wait_tcp() {
  local name="$1"; local host="$2"; local port="$3"
  local deadline=$((SECONDS + WAIT_TIMEOUT))

  log "Waiting for ${name} TCP ${host}:${port}"
  while (( SECONDS < deadline )); do
    if (echo >/dev/tcp/"$host"/"$port") >/dev/null 2>&1; then
      ok "${name} TCP ${host}:${port} open."
      return 0
    fi
    sleep "$WAIT_STEP"
  done
  echo "[FAIL] Timeout waiting for ${name} TCP ${host}:${port} after ${WAIT_TIMEOUT}s"
  exit 1
}

compose_up() {
  local dir="$1"
  [[ -f "${dir}/docker-compose.yml" ]] || { echo "[FAIL] Missing compose in ${dir}"; exit 1; }
  log "Starting docker compose in ${dir}"
  (cd "$dir" && docker compose up -d --build)
  ok "Compose started in ${dir}"
}

print_summary() {
  cat <<EOF

=====================================================
Everything looks up! Quick links:
- Ollama:        ${OLLAMA_URL}
- RAG API:       ${RAG_API_URL}
- LLM UI:        ${LLM_UI_URL}
- OpenSearch:    ${OPENSEARCH_URL}
- Dashboards:    ${DASHBOARDS_URL}

Useful:
  docker compose -f "${ROOT_COMPOSE}" ps
  docker compose -f "${LOGS_COMPOSE}" ps

Stop:
  (cd "${ROOT_DIR}" && docker compose down)
  (cd "${LOGS_DIR}" && docker compose down)
=====================================================

EOF
}
need docker
need curl

log "Project root: $ROOT_DIR"
log "Docker Compose: $(docker compose version | head -n1 || echo unknown)"

# 1) Up root stack and probe services it exposes
compose_up "$ROOT_DIR"

# Prefer HTTP probes (fast, deterministic). Keep TCP as fallback example if needed.
wait_http "Ollama API" "$OLLAMA_URL"
# RAG API health might not exist yet in your code; if so, comment next line or point to an available endpoint.
# wait_http "RAG API" "$RAG_API_URL"
# wait_http "LLM UI (Streamlit)" "$LLM_UI_URL"

# 2) Up logs-analysis and probe OpenSearch & Dashboards
compose_up "$LOGS_DIR"

# OpenSearch often needs TLS & auth; use -k for self-signed and -u for basic auth
wait_http "OpenSearch" "$OPENSEARCH_URL" -k -u "${OPENSEARCH_USER}:${OPENSEARCH_PASS}"
# wait_http "OpenSearch is green (optional fast check)" "${OPENSEARCH_URL}/_cluster/health?wait_for_status=green&timeout=1m" -k -u "${OPENSEARCH_USER}:${OPENSEARCH_PASS}"

# Dashboards readiness
wait_http "OpenSearch Dashboards" "$DASHBOARDS_URL"

ok "All services reachable."
print_summary
