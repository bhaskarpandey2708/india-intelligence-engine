"""
Script 03: Shapefile to GeoJSON Converter
Converts SHRUG shapefiles to optimized GeoJSON for the web platform.
Also generates simplified versions for faster browser loading.

Usage:
    python 03_shp_to_geojson.py               # Convert all shapefiles
    python 03_shp_to_geojson.py geo_states    # Convert one layer
"""

import sys
import json
import geopandas as gpd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
CONFIG_PATH = Path(__file__).resolve().parents[1] / "configs" / "datasets.json"
OUTPUT_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Simplification tolerances (in degrees) — higher = smaller file, less detail
SIMPLIFY = {
    "state": 0.01,
    "district": 0.005,
    "subdistrict": 0.002,
    "village": 0.001,
}


def convert_shp_to_geojson(dataset: dict):
    ds_id = dataset["id"]
    source_path = BASE_DIR / dataset["source_file"]
    level = dataset.get("level", "unknown")
    output_path = OUTPUT_DIR / f"{ds_id}.geojson"
    output_simplified = OUTPUT_DIR / f"{ds_id}_simplified.geojson"

    print(f"\nConverting: {ds_id} (level: {level})")
    print(f"  Source : {source_path}")

    if not source_path.exists():
        print(f"  ERROR  : Shapefile not found")
        return False

    try:
        print(f"  Reading shapefile...")
        gdf = gpd.read_file(source_path)
        print(f"  Loaded : {len(gdf):,} features | CRS: {gdf.crs}")

        # Reproject to WGS84 (EPSG:4326) if needed
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            print(f"  Reprojecting to EPSG:4326...")
            gdf = gdf.to_crs(epsg=4326)

        # Fix invalid geometries
        invalid = (~gdf.geometry.is_valid).sum()
        if invalid > 0:
            print(f"  Fixing {invalid} invalid geometries...")
            gdf["geometry"] = gdf["geometry"].buffer(0)

        # Skip village full GeoJSON (too large for browser)
        if level != "village":
            print(f"  Writing full GeoJSON...")
            gdf.to_file(output_path, driver="GeoJSON")
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"  Full   : {size_mb:.1f} MB → {output_path.name}")

        # Write simplified version for all levels
        tolerance = SIMPLIFY.get(level, 0.005)
        print(f"  Simplifying (tolerance={tolerance})...")
        gdf_simplified = gdf.copy()
        gdf_simplified["geometry"] = gdf_simplified["geometry"].simplify(
            tolerance, preserve_topology=True
        )
        gdf_simplified.to_file(output_simplified, driver="GeoJSON")
        size_simplified = output_simplified.stat().st_size / (1024 * 1024)
        print(f"  Simplified: {size_simplified:.1f} MB → {output_simplified.name}")

        return True

    except Exception as e:
        print(f"  ERROR  : {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    with open(CONFIG_PATH) as f:
        config = json.load(f)

    target_id = sys.argv[1] if len(sys.argv) > 1 else None

    shp_datasets = [
        d for d in config["datasets"]
        if d["status"] == "ready"
        and Path(d["source_file"]).suffix.lower() == ".shp"
        and (target_id is None or d["id"] == target_id)
    ]

    if not shp_datasets:
        print(f"No matching shapefile datasets found.")
        return

    print(f"\nIndia Intelligence Engine — Shapefile to GeoJSON")
    print(f"Converting {len(shp_datasets)} layer(s)...\n")

    results = {"success": [], "failed": []}
    for dataset in shp_datasets:
        ok = convert_shp_to_geojson(dataset)
        (results["success"] if ok else results["failed"]).append(dataset["id"])

    print(f"\n{'='*60}")
    print(f"Done: {len(results['success'])} succeeded | {len(results['failed'])} failed")
    print(f"GeoJSON files saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
