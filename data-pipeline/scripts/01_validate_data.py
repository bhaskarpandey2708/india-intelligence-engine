"""
Script 01: Data Validation
Checks all source datasets for quality issues before processing.
Run this first before any conversion/export.

Usage:
    python 01_validate_data.py
"""

import os
import json
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]  # Population database Project/
CONFIG_PATH = Path(__file__).resolve().parents[1] / "configs" / "datasets.json"

ISSUES = []
PASSED = []


def log_issue(dataset_id, message):
    ISSUES.append(f"[{dataset_id}] {message}")
    print(f"  FAIL  {message}")


def log_pass(dataset_id, message):
    PASSED.append(f"[{dataset_id}] {message}")
    print(f"  PASS  {message}")


def validate_csv(dataset):
    ds_id = dataset["id"]
    path = BASE_DIR / dataset["source_file"]

    if not path.exists():
        log_issue(ds_id, f"File not found: {path}")
        return

    try:
        df = pd.read_csv(path, nrows=5)
        log_pass(ds_id, f"Readable — {len(df.columns)} columns detected")
    except Exception as e:
        log_issue(ds_id, f"Cannot read CSV: {e}")
        return

    # Full read for row count
    try:
        df_full = pd.read_csv(path, low_memory=False)
        row_count = len(df_full)
        null_pct = df_full.isnull().mean().mean() * 100
        log_pass(ds_id, f"{row_count:,} rows | {null_pct:.1f}% null values overall")

        # Check for completely empty columns
        empty_cols = [c for c in df_full.columns if df_full[c].isnull().all()]
        if empty_cols:
            log_issue(ds_id, f"Completely empty columns: {empty_cols}")
        else:
            log_pass(ds_id, "No completely empty columns")

        # Check for duplicate rows
        dup_count = df_full.duplicated().sum()
        if dup_count > 0:
            log_issue(ds_id, f"{dup_count:,} duplicate rows found")
        else:
            log_pass(ds_id, "No duplicate rows")

    except MemoryError:
        log_pass(ds_id, "File too large for full read — skipping row count (expected for habitation files)")
    except Exception as e:
        log_issue(ds_id, f"Full read failed: {e}")


def validate_geojson(dataset):
    ds_id = dataset["id"]
    path = BASE_DIR / dataset["source_file"]

    if not path.exists():
        log_issue(ds_id, f"File not found: {path}")
        return

    try:
        import json
        with open(path, "r") as f:
            gj = json.load(f)
        features = gj.get("features", [])
        log_pass(ds_id, f"Valid GeoJSON — {len(features):,} features")

        # Check all features have geometry
        no_geom = sum(1 for f in features if f.get("geometry") is None)
        if no_geom > 0:
            log_issue(ds_id, f"{no_geom} features with null geometry")
        else:
            log_pass(ds_id, "All features have geometry")

        # Check all features have properties
        sample_props = features[0].get("properties", {}) if features else {}
        log_pass(ds_id, f"Sample properties keys: {list(sample_props.keys())[:5]}")

    except Exception as e:
        log_issue(ds_id, f"GeoJSON read failed: {e}")


def validate_shapefile(dataset):
    ds_id = dataset["id"]
    path = BASE_DIR / dataset["source_file"]

    if not path.exists():
        log_issue(ds_id, f"Shapefile not found: {path}")
        return

    try:
        import geopandas as gpd
        gdf = gpd.read_file(path, rows=10)
        log_pass(ds_id, f"Readable shapefile — CRS: {gdf.crs} | Columns: {list(gdf.columns)}")
    except ImportError:
        log_issue(ds_id, "geopandas not installed — skipping shapefile validation")
    except Exception as e:
        log_issue(ds_id, f"Shapefile read failed: {e}")


def main():
    with open(CONFIG_PATH) as f:
        config = json.load(f)

    print(f"\nIndia Intelligence Engine — Data Validation")
    print(f"Base directory: {BASE_DIR}\n")

    for dataset in config["datasets"]:
        ds_id = dataset["id"]
        source = dataset["source_file"]
        print(f"\n--- {ds_id} ({source}) ---")

        ext = Path(source).suffix.lower()
        if ext == ".csv":
            validate_csv(dataset)
        elif ext == ".geojson":
            validate_geojson(dataset)
        elif ext == ".shp":
            validate_shapefile(dataset)
        else:
            log_issue(ds_id, f"Unsupported file type: {ext}")

    print(f"\n{'='*60}")
    print(f"SUMMARY: {len(PASSED)} checks passed | {len(ISSUES)} issues found")
    if ISSUES:
        print("\nISSUES TO FIX:")
        for issue in ISSUES:
            print(f"  - {issue}")
    else:
        print("All checks passed. Ready to process.")


if __name__ == "__main__":
    main()
