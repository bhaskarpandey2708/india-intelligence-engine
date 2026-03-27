"""
Script 02: CSV to Parquet Converter
Converts all CSV datasets to Parquet format for HuggingFace upload.
Parquet = 60-70% smaller, faster to query, typed columns.

Usage:
    python 02_csv_to_parquet.py               # Convert all ready CSVs
    python 02_csv_to_parquet.py census_district_2011   # Convert one dataset
"""

import sys
import json
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
CONFIG_PATH = Path(__file__).resolve().parents[1] / "configs" / "datasets.json"
OUTPUT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def infer_pc11_types(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure PC11 code columns are stored as strings (leading zeros matter)."""
    pc11_cols = [c for c in df.columns if "pc11" in c.lower() or "state_id" in c.lower()
                 or "dist_id" in c.lower() or "subdist_id" in c.lower()]
    for col in pc11_cols:
        df[col] = df[col].astype(str).str.zfill(2 if "state" in col else 3 if "dist" in col else 4)
    return df


def convert_csv_to_parquet(dataset: dict, chunk_size: int = 500_000):
    ds_id = dataset["id"]
    source_path = BASE_DIR / dataset["source_file"]
    output_path = OUTPUT_DIR / f"{ds_id}.parquet"

    print(f"\nConverting: {ds_id}")
    print(f"  Source : {source_path}")
    print(f"  Output : {output_path}")

    if not source_path.exists():
        print(f"  ERROR  : Source file not found")
        return False

    file_size_mb = source_path.stat().st_size / (1024 * 1024)
    print(f"  Size   : {file_size_mb:.1f} MB")

    try:
        if file_size_mb > 100:
            # Chunked processing for large files (habitation CSVs ~230MB each)
            print(f"  Mode   : Chunked (large file)")
            writer = None
            total_rows = 0

            for chunk in pd.read_csv(source_path, chunksize=chunk_size, low_memory=False):
                chunk = infer_pc11_types(chunk)
                table = pa.Table.from_pandas(chunk, preserve_index=False)

                if writer is None:
                    writer = pq.ParquetWriter(output_path, table.schema, compression="snappy")
                writer.write_table(table)
                total_rows += len(chunk)
                print(f"  Rows   : {total_rows:,} processed...", end="\r")

            if writer:
                writer.close()
            print(f"\n  Done   : {total_rows:,} rows written")
        else:
            # Single read for smaller files
            print(f"  Mode   : Single read")
            df = pd.read_csv(source_path, low_memory=False)
            df = infer_pc11_types(df)
            df.to_parquet(output_path, index=False, compression="snappy")
            print(f"  Done   : {len(df):,} rows written")

        output_size_mb = output_path.stat().st_size / (1024 * 1024)
        savings = (1 - output_size_mb / file_size_mb) * 100
        print(f"  Output : {output_size_mb:.1f} MB ({savings:.0f}% smaller than CSV)")
        return True

    except Exception as e:
        print(f"  ERROR  : {e}")
        return False


def main():
    with open(CONFIG_PATH) as f:
        config = json.load(f)

    target_id = sys.argv[1] if len(sys.argv) > 1 else None

    csv_datasets = [
        d for d in config["datasets"]
        if d["status"] == "ready"
        and Path(d["source_file"]).suffix.lower() == ".csv"
        and (target_id is None or d["id"] == target_id)
    ]

    if not csv_datasets:
        print(f"No matching datasets found{f' for id: {target_id}' if target_id else ''}.")
        return

    print(f"\nIndia Intelligence Engine — CSV to Parquet")
    print(f"Converting {len(csv_datasets)} dataset(s)...\n")

    results = {"success": [], "failed": []}
    for dataset in csv_datasets:
        ok = convert_csv_to_parquet(dataset)
        (results["success"] if ok else results["failed"]).append(dataset["id"])

    print(f"\n{'='*60}")
    print(f"Done: {len(results['success'])} succeeded | {len(results['failed'])} failed")
    if results["failed"]:
        print(f"Failed: {results['failed']}")
    print(f"\nParquet files saved to: {OUTPUT_DIR}")
    print("Upload these to HuggingFace with: huggingface-cli upload <repo> exports/")


if __name__ == "__main__":
    main()
