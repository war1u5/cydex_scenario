#!/bin/bash
set -Eeuo pipefail
trap 'rc=$?; echo -e "\033[1;31m[ERROR]\033[0m ${BASH_SOURCE[0]}:$LINENO: \"${BASH_COMMAND}\" -> exit $rc"; exit $rc' ERR

# =========================
# Flags
# =========================
SKIP_INGEST=0
NO_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-ingest) SKIP_INGEST=1; shift ;;
    --no-build)    NO_BUILD=1; shift ;;
    -h|--help)
      cat <<EOF
Usage: ${0##*/} [--skip-ingest] [--no-build]

  --skip-ingest   Start stacks but skip logs & dashboards ingestion.
  --no-build      Do not pass --build to docker compose up.
Environment overrides:
  OLLAMA_URL, RAG_API_URL, LLM_UI_URL, OPENSEARCH_URL, DASHBOARDS_URL,
  OPENSEARCH_USER, OPENSEARCH_PASS, WAIT_TIMEOUT
EOF
      exit 0
      ;;
    *)
      echo "[WARN] Unknown arg: $1"; shift ;;
  esac
done

# =========================
# Config (override via env)
# =========================
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_COMPOSE="${ROOT_DIR}/docker-compose.yml"
LOGS_DIR="${ROOT_DIR}/logs-analysis"
LOGS_COMPOSE="${LOGS_DIR}/docker-compose.yml"
LOAD_LOGS_SCRIPT="${LOGS_DIR}/load_logs.sh"

# Default endpoints
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434/api/tags}"
RAG_API_URL="${RAG_API_URL:-http://127.0.0.1:8000/health}"
LLM_UI_URL="${LLM_UI_URL:-http://127.0.0.1:8501}"
OPENSEARCH_URL="${OPENSEARCH_URL:-https://127.0.0.1:9200}"
DASHBOARDS_URL_BASE="${DASHBOARDS_URL:-http://127.0.0.1:5601}"
DASHBOARDS_STATUS_URL="${DASHBOARDS_URL_BASE}/api/status"

OPENSEARCH_USER="${OPENSEARCH_USER:-admin}"
OPENSEARCH_PASS="${OPENSEARCH_PASS:-MyS3curePass!}"

WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"
WAIT_STEP=2

# =========================
# Helpers
# =========================
need() { command -v "$1" >/dev/null || { echo "[FAIL] Need '$1' in PATH"; exit 1; }; }
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
  if (( NO_BUILD )); then
    (cd "$dir" && docker compose up -d)
  else
    (cd "$dir" && docker compose up -d --build)
  fi
  ok "Compose started in ${dir}"
}

# =========================
# Main
# =========================
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
wait_http "Dashboards" "$DASHBOARDS_STATUS_URL"

# 3) Optional ingestion
if (( SKIP_INGEST )); then
  log "Skipping ingestion (--skip-ingest set)."
else
  if [[ -x "$LOAD_LOGS_SCRIPT" ]]; then
    log "Running ingestion script: $LOAD_LOGS_SCRIPT"
    # Pass through env so the child picks up the same URLs/creds/timeouts
    OPENSEARCH_URL="$OPENSEARCH_URL" \
    DASHBOARDS_URL="$DASHBOARDS_URL_BASE" \
    OPENSEARCH_USER="$OPENSEARCH_USER" \
    OPENSEARCH_PASS="$OPENSEARCH_PASS" \
    WAIT_TIMEOUT="$WAIT_TIMEOUT" \
      "$LOAD_LOGS_SCRIPT"
    ok "Logs + dashboards ingestion complete."
  else
    echo "[WARN] No executable $LOAD_LOGS_SCRIPT found — skipping ingestion."
  fi
fi

ok "All services ready."
