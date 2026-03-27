"""
Script 05: Upload Processed Data to HuggingFace
Uploads all Parquet and GeoJSON exports to HuggingFace Datasets.

Prerequisites:
    pip install huggingface_hub
    huggingface-cli login   (paste your HF token)

Usage:
    python 05_upload_to_huggingface.py               # Upload all exports
    python 05_upload_to_huggingface.py census_district_2011  # Upload one
"""

import sys
import json
from pathlib import Path

try:
    from huggingface_hub import HfApi, create_repo
except ImportError:
    print("ERROR: huggingface_hub not installed.")
    print("Run: pip install huggingface_hub")
    sys.exit(1)

CONFIG_PATH = Path(__file__).resolve().parents[1] / "configs" / "datasets.json"
EXPORTS_DIR = Path(__file__).resolve().parents[2] / "data" / "exports"
PROCESSED_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"


def upload_file(api: HfApi, repo_id: str, local_path: Path, repo_path: str):
    if not local_path.exists():
        print(f"  SKIP   : {local_path.name} (not found — run conversion scripts first)")
        return False

    size_mb = local_path.stat().st_size / (1024 * 1024)
    print(f"  Uploading {local_path.name} ({size_mb:.1f} MB)...")
    try:
        api.upload_file(
            path_or_fileobj=str(local_path),
            path_in_repo=repo_path,
            repo_id=repo_id,
            repo_type="dataset",
        )
        print(f"  OK     : {repo_path}")
        return True
    except Exception as e:
        print(f"  ERROR  : {e}")
        return False


def main():
    with open(CONFIG_PATH) as f:
        config = json.load(f)

    repo_id = config["huggingface_repo"]
    target_id = sys.argv[1] if len(sys.argv) > 1 else None

    print(f"\nIndia Intelligence Engine — HuggingFace Upload")
    print(f"Repository: {repo_id}\n")

    api = HfApi()

    # Ensure repo exists
    try:
        create_repo(repo_id, repo_type="dataset", exist_ok=True, private=False)
        print(f"Repo ready: https://huggingface.co/datasets/{repo_id}\n")
    except Exception as e:
        print(f"WARNING: Could not verify repo: {e}")

    datasets = [
        d for d in config["datasets"]
        if d["status"] == "ready"
        and (target_id is None or d["id"] == target_id)
    ]

    success, failed = 0, 0

    for dataset in datasets:
        ds_id = dataset["id"]
        print(f"\n--- {ds_id} ---")

        for fmt in dataset.get("export_format", []):
            if fmt == "parquet":
                local = EXPORTS_DIR / f"{ds_id}.parquet"
                ok = upload_file(api, repo_id, local, f"data/{ds_id}.parquet")
            elif fmt == "geojson":
                # Upload both full and simplified if they exist
                for suffix in ["", "_simplified"]:
                    local = PROCESSED_DIR / f"{ds_id}{suffix}.geojson"
                    ok = upload_file(api, repo_id, local, f"geo/{ds_id}{suffix}.geojson")
            elif fmt == "csv":
                # Upload original CSV as well
                local = Path(__file__).resolve().parents[3] / dataset["source_file"]
                ok = upload_file(api, repo_id, local, f"csv/{ds_id}.csv")
            else:
                ok = False

            success += ok
            failed += not ok

    print(f"\n{'='*60}")
    print(f"Upload complete: {success} files uploaded | {failed} failed/skipped")
    print(f"View at: https://huggingface.co/datasets/{repo_id}")


if __name__ == "__main__":
    main()
