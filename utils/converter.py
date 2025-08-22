#!/usr/bin/env python3
"""
convert_logs.py — Excel (GIN logs) -> NDJSON for OpenSearch

Usage examples:
  # Simple conversion (no filtering) to NDJSON
  python convert_logs.py utils/gin_logs_apr14-16_2025.xlsx utils/gin_logs.ndjson

  # Filter/validate date window & hours and write NDJSON
  python convert_logs.py utils/gin_logs_apr14-16_2025.xlsx utils/gin_logs_clean.ndjson --validate

  # Emit _bulk format (action+doc pairs) for index 'gin-logs'
  python convert_logs.py utils/gin_logs_apr14-16_2025.xlsx utils/gin_logs.bulk.ndjson --bulk gin-logs --validate
"""

import argparse
import json
import re
from datetime import datetime, time
from typing import Optional

import pandas as pd


DATE_MIN = datetime(2025, 4, 14)
DATE_MAX = datetime(2025, 4, 16)  # inclusive date; time window applied separately
HOUR_START = time(9, 0, 0)
HOUR_END   = time(17, 0, 0)  # exclusive upper bound (i.e., < 17:00:00)


def parse_latency_us(s: str) -> Optional[int]:
    """
    Accepts strings like:
      "310.687µs", "81.205941ms", "18.025641196s", "103.2 ms", "1.0s"
    Returns microseconds as int, or None if unparsable.
    """
    if not isinstance(s, str):
        return None
    s = s.strip()
    # Normalize microsecond symbol variants
    s = s.replace("μs", "µs")  # greek mu to micro sign
    m = re.match(r"^\s*([\d.]+)\s*(µs|us|ms|s)\s*$", s, flags=re.IGNORECASE)
    if not m:
        return None
    val = float(m.group(1))
    unit = m.group(2).lower()
    if unit in ("µs", "us"):
        return int(val)
    if unit == "ms":
        return int(val * 1_000)
    if unit == "s":
        return int(val * 1_000_000)
    return None


def in_window(ts_str: str) -> bool:
    """
    Check if timestamp string 'YYYY-MM-DD HH:MM:SS' is within:
      dates: 2025-04-14 .. 2025-04-16 (inclusive)
      hours: [09:00:00 .. 17:00:00)  <-- 17:00 exact excluded
    """
    try:
        ts = datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
    except Exception:
        return False
    if not (DATE_MIN.date() <= ts.date() <= DATE_MAX.date()):
        return False
    if not (HOUR_START <= ts.time() < HOUR_END):
        return False
    return True


def convert_excel_to_ndjson(
    input_xlsx: str,
    output_ndjson: str,
    validate_window: bool = False,
    bulk_index: Optional[str] = None,
) -> int:
    """
    Reads Excel, adds latency_us & duration_ms, optionally filters by time window,
    and writes NDJSON. If bulk_index is provided, writes action lines for _bulk.
    Returns number of records written.
    """
    df = pd.read_excel(input_xlsx)

    # Basic normalization: ensure expected columns exist
    expected = {"timestamp", "status", "latency", "ip", "method", "endpoint", "log"}
    missing = expected - set(df.columns)
    if missing:
        raise SystemExit(f"ERROR: Missing columns in Excel: {sorted(missing)}")

    # Parse latency into numeric forms
    lat_us = df["latency"].apply(parse_latency_us)
    df["latency_us"] = lat_us
    df["duration_ms"] = lat_us.apply(lambda x: (x / 1000.0) if pd.notna(x) else None)

    # Optionally filter to time window
    if validate_window:
        mask = df["timestamp"].astype(str).apply(in_window)
        before = len(df)
        df = df[mask].copy()
        after = len(df)
        print(f"[validate] Kept {after}/{before} rows within 2025-04-14..16, 09:00–17:00")

    # Ensure JSON-serializable types
    df["status"] = pd.to_numeric(df["status"], errors="coerce").astype("Int64")

    # Write NDJSON
    count = 0
    with open(output_ndjson, "w", encoding="utf-8") as f:
        if bulk_index:
            # _bulk format: action line + source line per document
            action = {"index": {}}
            for rec in df.to_dict(orient="records"):
                f.write(json.dumps({"index": {"_index": bulk_index}}) + "\n")
                f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
                count += 1
        else:
            for rec in df.to_dict(orient="records"):
                f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
                count += 1

    print(f"[done] Wrote {count} records to {output_ndjson}")
    return count


def main():
    ap = argparse.ArgumentParser(description="Convert Excel GIN logs to NDJSON for OpenSearch.")
    ap.add_argument("input_xlsx", help="Path to input Excel file (e.g., utils/gin_logs_apr14-16_2025.xlsx)")
    ap.add_argument("output_ndjson", help="Path to output NDJSON file")
    ap.add_argument("--validate", action="store_true",
                    help="Filter rows to Apr 14–16, 2025 between 09:00 and 17:00")
    ap.add_argument("--bulk", metavar="INDEX", default=None,
                    help="Emit OpenSearch _bulk format targeting INDEX")
    args = ap.parse_args()

    convert_excel_to_ndjson(
        input_xlsx=args.input_xlsx,
        output_ndjson=args.output_ndjson,
        validate_window=args.validate,
        bulk_index=args.bulk,
    )


if __name__ == "__main__":
    main()
