#!/usr/bin/env python3
"""
Descarga sprites animados desde PokeAPI sprites repo usando esta base:
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/

Crea:
  img/pokemon-png/animated_normal/001.gif
  img/pokemon-png/animated_shiny/001.gif
  img/pokemon-png/animated_manifest_pokeapi_bw.json

Uso desde la raiz de mastersmon-frontend:
  python tools/download_pokeapi_bw_animated.py --out img/pokemon-png --max-id 1025
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Dict, List

BASE_NORMAL = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif"
BASE_SHINY = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/{id}.gif"


def pad_id(n: int) -> str:
    return str(n).zfill(3)


def download_file(url: str, dest: Path, timeout: int = 25, retries: int = 2) -> Dict:
    if dest.exists() and dest.stat().st_size > 0:
        return {"ok": True, "skipped": True, "status": "exists", "bytes": dest.stat().st_size}

    last_error = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "mastersmon-asset-downloader/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                status = getattr(resp, "status", 200)
                data = resp.read()
                content_type = resp.headers.get("content-type", "")
                if status != 200 or not data:
                    return {"ok": False, "status": status, "error": "empty_or_bad_response"}
                if "image" not in content_type and not data.startswith(b"GIF"):
                    return {"ok": False, "status": status, "error": f"unexpected_content_type:{content_type}"}
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                return {"ok": True, "skipped": False, "status": status, "bytes": len(data)}
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return {"ok": False, "status": 404, "error": "not_found"}
            last_error = f"HTTPError:{exc.code}"
        except Exception as exc:
            last_error = f"{type(exc).__name__}:{exc}"
        if attempt < retries:
            time.sleep(0.35 * (attempt + 1))
    return {"ok": False, "status": None, "error": last_error or "unknown_error"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="img/pokemon-png", help="Carpeta base donde crear animated_normal y animated_shiny")
    parser.add_argument("--start-id", type=int, default=1)
    parser.add_argument("--max-id", type=int, default=1025)
    parser.add_argument("--sleep", type=float, default=0.02, help="Pausa pequena entre descargas")
    args = parser.parse_args()

    out = Path(args.out)
    normal_dir = out / "animated_normal"
    shiny_dir = out / "animated_shiny"
    manifest_path = out / "animated_manifest_pokeapi_bw.json"

    manifest = {
        "source": "PokeAPI sprites - generation-v/black-white/animated",
        "base_normal": BASE_NORMAL,
        "base_shiny": BASE_SHINY,
        "range": {"start_id": args.start_id, "max_id": args.max_id},
        "normal": {},
        "shiny": {},
        "missing_normal": [],
        "missing_shiny": [],
        "downloaded_normal": 0,
        "downloaded_shiny": 0,
        "skipped_existing_normal": 0,
        "skipped_existing_shiny": 0,
    }

    for pokemon_id in range(args.start_id, args.max_id + 1):
        filename = f"{pad_id(pokemon_id)}.gif"

        normal_url = BASE_NORMAL.format(id=pokemon_id)
        normal_dest = normal_dir / filename
        normal_result = download_file(normal_url, normal_dest)
        if normal_result["ok"]:
            manifest["normal"][str(pokemon_id)] = {
                "id": pokemon_id,
                "file": f"animated_normal/{filename}",
                "url": normal_url,
                "bytes": normal_result.get("bytes", 0),
            }
            if normal_result.get("skipped"):
                manifest["skipped_existing_normal"] += 1
            else:
                manifest["downloaded_normal"] += 1
        else:
            manifest["missing_normal"].append({"id": pokemon_id, "url": normal_url, **normal_result})

        shiny_url = BASE_SHINY.format(id=pokemon_id)
        shiny_dest = shiny_dir / filename
        shiny_result = download_file(shiny_url, shiny_dest)
        if shiny_result["ok"]:
            manifest["shiny"][str(pokemon_id)] = {
                "id": pokemon_id,
                "file": f"animated_shiny/{filename}",
                "url": shiny_url,
                "bytes": shiny_result.get("bytes", 0),
            }
            if shiny_result.get("skipped"):
                manifest["skipped_existing_shiny"] += 1
            else:
                manifest["downloaded_shiny"] += 1
        else:
            manifest["missing_shiny"].append({"id": pokemon_id, "url": shiny_url, **shiny_result})

        if pokemon_id % 25 == 0:
            print(f"Procesados {pokemon_id}/{args.max_id} | normal ok: {len(manifest['normal'])} | shiny ok: {len(manifest['shiny'])}")
            manifest_path.parent.mkdir(parents=True, exist_ok=True)
            manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

        if args.sleep > 0:
            time.sleep(args.sleep)

    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    print("Listo")
    print(f"Normal OK: {len(manifest['normal'])} | faltantes: {len(manifest['missing_normal'])}")
    print(f"Shiny OK: {len(manifest['shiny'])} | faltantes: {len(manifest['missing_shiny'])}")
    print(f"Manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
