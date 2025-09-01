#!/bin/bash
set -Eeuo pipefail
trap 'rc=$?; echo -e "\033[1;31m[ERROR]\033[0m ${BASH_SOURCE[0]}:$LINENO: \"${BASH_COMMAND}\" -> exit $rc"; exit $rc' ERR

UTILS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/utils" && pwd)"

OPENSEARCH_URL="${OPENSEARCH_URL:-https://localhost:9200}"
DASHBOARDS_URL="${DASHBOARDS_URL:-http://localhost:5601}"
OPENSEARCH_USER="${OPENSEARCH_USER:-admin}"
OPENSEARCH_PASS="${OPENSEARCH_PASS:-MyS3curePass!}"

WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"
WAIT_STEP=2


log() { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }

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

run_cmd() {
  log "$*"
  eval "$@"
  sleep 2
}


log "Grace period before ingestion…"
sleep 5

wait_http "OpenSearch"    "${OPENSEARCH_URL}" -k -u "${OPENSEARCH_USER}:${OPENSEARCH_PASS}"
wait_http "Dashboards"    "${DASHBOARDS_URL}/api/status"

log "Ingesting bulk JSONL logs into OpenSearch…"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -H 'Content-Type: application/x-ndjson' --data-binary @${UTILS_DIR}/email-logs-2025-04.bulk.jsonl '${OPENSEARCH_URL}/_bulk'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST '${OPENSEARCH_URL}/email-logs-2025-04/_refresh'"

run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -H 'Content-Type: application/x-ndjson' --data-binary @${UTILS_DIR}/dns-logs-2025-04.bulk.jsonl '${OPENSEARCH_URL}/_bulk'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST '${OPENSEARCH_URL}/dns-logs-2025-04/_refresh'"

run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -H 'Content-Type: application/x-ndjson' --data-binary @${UTILS_DIR}/vpn-logs-2025-04.bulk.jsonl '${OPENSEARCH_URL}/_bulk'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST '${OPENSEARCH_URL}/vpn-logs-2025-04/_refresh'"

run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -H 'Content-Type: application/x-ndjson' --data-binary @${UTILS_DIR}/ssh-logs-2025-04.bulk.jsonl '${OPENSEARCH_URL}/_bulk'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST '${OPENSEARCH_URL}/ssh-logs-2025-04/_refresh'"

run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -H 'Content-Type: application/x-ndjson' --data-binary @${UTILS_DIR}/cmd-logs-2025-04.history.bulk.jsonl '${OPENSEARCH_URL}/_bulk'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST '${OPENSEARCH_URL}/cmd-logs-2025-04/_refresh'"

run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -H 'Content-Type: application/x-ndjson' --data-binary @${UTILS_DIR}/rag-query-2025-09.bulk.jsonl '${OPENSEARCH_URL}/_bulk'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST '${OPENSEARCH_URL}/rag-query-2025-09/_refresh'"

log "Ingesting saved objects into Dashboards…"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST -H 'osd-xsrf: true' -F 'file=@${UTILS_DIR}/email-logs-opensearch-saved-objects.ndjson'     '${DASHBOARDS_URL}/api/saved_objects/_import?overwrite=true'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST -H 'osd-xsrf: true' -F 'file=@${UTILS_DIR}/dns-logs-opensearch-saved-objects.ndjson'      '${DASHBOARDS_URL}/api/saved_objects/_import?overwrite=true'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST -H 'osd-xsrf: true' -F 'file=@${UTILS_DIR}/vpn-logs-opensearch-saved-objects.ndjson'      '${DASHBOARDS_URL}/api/saved_objects/_import?overwrite=true'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST -H 'osd-xsrf: true' -F 'file=@${UTILS_DIR}/ssh-logs-opensearch-saved-objects.ndjson'      '${DASHBOARDS_URL}/api/saved_objects/_import?overwrite=true'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST -H 'osd-xsrf: true' -F 'file=@${UTILS_DIR}/cmd-logs-history-dashboard.ndjson'            '${DASHBOARDS_URL}/api/saved_objects/_import?overwrite=true'"
run_cmd "curl -k -u ${OPENSEARCH_USER}:${OPENSEARCH_PASS} -X POST -H 'osd-xsrf: true' -F 'file=@${UTILS_DIR}/rag-query-opensearch-saved-objects.ndjson'            '${DASHBOARDS_URL}/api/saved_objects/_import?overwrite=true'"

ok "All logs + dashboards ingested successfully."
