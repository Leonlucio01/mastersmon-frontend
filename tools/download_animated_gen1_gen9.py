#!/usr/bin/env python3
"""
Descarga sprites animados normal y shiny para MastersMon Gen 1-9.

Fuente principal:
  Pokemon Showdown animated sprites:
  https://play.pokemonshowdown.com/sprites/ani/
  https://play.pokemonshowdown.com/sprites/ani-shiny/

Salida por defecto:
  img/pokemon-png/animated_normal/001.gif
  img/pokemon-png/animated_shiny/001.gif
  img/pokemon-png/animated_manifest.json

Uso recomendado desde la raiz del repo mastersmon-frontend:
  python tools/download_animated_gen1_gen9.py --out img/pokemon-png --max-id 1025
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SHOWDOWN_NORMAL = "https://play.pokemonshowdown.com/sprites/ani"
SHOWDOWN_SHINY = "https://play.pokemonshowdown.com/sprites/ani-shiny"
POKEAPI_SPECIES = "https://pokeapi.co/api/v2/pokemon-species?limit=2000&offset=0"
USER_AGENT = "MastersMonAssetDownloader/1.0 (+https://github.com/Leonlucio01/mastersmon-frontend)"

# Showdown usa algunos nombres distintos a PokeAPI para especies base.
# El script tambien prueba variantes automaticas, pero estos alias corrigen casos conocidos.
SHOWDOWN_ALIASES: dict[str, list[str]] = {
    "nidoran-f": ["nidoran-f", "nidoranf"],
    "nidoran-m": ["nidoran", "nidoranm", "nidoran-m"],
    "farfetchd": ["farfetchd"],
    "mr-mime": ["mrmime"],
    "mime-jr": ["mimejr"],
    "flabebe": ["flabebe"],
    "type-null": ["typenull"],
    "tapu-koko": ["tapukoko"],
    "tapu-lele": ["tapulele"],
    "tapu-bulu": ["tapubulu"],
    "tapu-fini": ["tapufini"],
    "sirfetchd": ["sirfetchd"],
    "mr-rime": ["mrrime"],
    "great-tusk": ["greattusk"],
    "scream-tail": ["screamtail"],
    "brute-bonnet": ["brutebonnet"],
    "flutter-mane": ["fluttermane"],
    "slither-wing": ["slitherwing"],
    "sandy-shocks": ["sandyshocks"],
    "iron-treads": ["irontreads"],
    "iron-bundle": ["ironbundle"],
    "iron-hands": ["ironhands"],
    "iron-jugulis": ["ironjugulis"],
    "iron-moth": ["ironmoth"],
    "iron-thorns": ["ironthorns"],
    "wo-chien": ["wochien"],
    "chien-pao": ["chienpao"],
    "ting-lu": ["tinglu"],
    "chi-yu": ["chiyu"],
    "roaring-moon": ["roaringmoon"],
    "iron-valiant": ["ironvaliant"],
    "walking-wake": ["walkingwake"],
    "iron-leaves": ["ironleaves"],
    "gouging-fire": ["gougingfire"],
    "raging-bolt": ["ragingbolt"],
    "iron-boulder": ["ironboulder"],
    "iron-crown": ["ironcrown"],
}


def http_get(url: str, timeout: int = 30) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=timeout) as res:
        return res.read()


def fetch_json(url: str) -> dict:
    return json.loads(http_get(url).decode("utf-8"))


def load_species_names(max_id: int) -> dict[int, str]:
    data = fetch_json(POKEAPI_SPECIES)
    names: dict[int, str] = {}
    for item in data.get("results", []):
        match = re.search(r"/pokemon-species/(\d+)/?$", item.get("url", ""))
        if not match:
            continue
        dex_id = int(match.group(1))
        if 1 <= dex_id <= max_id:
            names[dex_id] = item["name"]
    missing = [i for i in range(1, max_id + 1) if i not in names]
    if missing:
        print(f"ADVERTENCIA: PokeAPI no devolvio {len(missing)} especies: {missing[:10]}", file=sys.stderr)
    return names


def sanitize_candidates(name: str) -> list[str]:
    raw = name.strip().lower()
    candidates: list[str] = []

    def add(value: str):
        value = value.strip("-").lower()
        if value and value not in candidates:
            candidates.append(value)

    for alias in SHOWDOWN_ALIASES.get(raw, []):
        add(alias)

    add(raw)
    add(raw.replace("-", ""))
    add(raw.replace(".", ""))
    add(raw.replace("'", ""))
    add(raw.replace(" ", "-"))
    add(re.sub(r"[^a-z0-9-]", "", raw))
    add(re.sub(r"[^a-z0-9]", "", raw))
    return candidates


def try_download(base_url: str, candidates: Iterable[str], dest: Path, overwrite: bool) -> tuple[bool, str | None]:
    if dest.exists() and not overwrite and dest.stat().st_size > 0:
        return True, "exists"

    for slug in candidates:
        url = f"{base_url}/{slug}.gif"
        try:
            data = http_get(url, timeout=30)
            if len(data) < 32 or not data.startswith(b"GIF"):
                continue
            dest.write_bytes(data)
            return True, url
        except HTTPError as exc:
            if exc.code == 404:
                continue
            print(f"HTTP {exc.code}: {url}", file=sys.stderr)
        except (URLError, TimeoutError) as exc:
            print(f"Error de red: {url} -> {exc}", file=sys.stderr)
        time.sleep(0.02)
    return False, None


def main() -> int:
    parser = argparse.ArgumentParser(description="Descarga animated_normal y animated_shiny Gen 1-9 para MastersMon")
    parser.add_argument("--out", default="img/pokemon-png", help="Carpeta base de pokemon-png")
    parser.add_argument("--max-id", type=int, default=1025, help="Ultimo National Dex ID a descargar")
    parser.add_argument("--start-id", type=int, default=1, help="Primer National Dex ID a descargar")
    parser.add_argument("--overwrite", action="store_true", help="Sobrescribe archivos existentes")
    parser.add_argument("--sleep", type=float, default=0.05, help="Pausa entre Pokemon para no saturar")
    args = parser.parse_args()

    out_base = Path(args.out)
    normal_dir = out_base / "animated_normal"
    shiny_dir = out_base / "animated_shiny"
    normal_dir.mkdir(parents=True, exist_ok=True)
    shiny_dir.mkdir(parents=True, exist_ok=True)

    print(f"Cargando nombres desde PokeAPI hasta ID {args.max_id}...")
    names = load_species_names(args.max_id)

    manifest = {
        "source_normal": SHOWDOWN_NORMAL,
        "source_shiny": SHOWDOWN_SHINY,
        "max_id": args.max_id,
        "files": [],
        "missing_normal": [],
        "missing_shiny": [],
    }

    total = 0
    ok_normal = 0
    ok_shiny = 0

    for dex_id in range(args.start_id, args.max_id + 1):
        name = names.get(dex_id)
        if not name:
            continue
        total += 1
        num = f"{dex_id:03d}"
        candidates = sanitize_candidates(name)
        normal_path = normal_dir / f"{num}.gif"
        shiny_path = shiny_dir / f"{num}.gif"

        n_ok, n_src = try_download(SHOWDOWN_NORMAL, candidates, normal_path, args.overwrite)
        s_ok, s_src = try_download(SHOWDOWN_SHINY, candidates, shiny_path, args.overwrite)

        if n_ok:
            ok_normal += 1
        else:
            manifest["missing_normal"].append({"id": dex_id, "name": name, "candidates": candidates})

        if s_ok:
            ok_shiny += 1
        else:
            manifest["missing_shiny"].append({"id": dex_id, "name": name, "candidates": candidates})

        manifest["files"].append({
            "id": dex_id,
            "dex": num,
            "name": name,
            "normal": f"animated_normal/{num}.gif" if n_ok else None,
            "shiny": f"animated_shiny/{num}.gif" if s_ok else None,
            "normal_source": n_src,
            "shiny_source": s_src,
        })

        print(f"{num} {name:<22} normal={'OK' if n_ok else 'MISS'} shiny={'OK' if s_ok else 'MISS'}")
        time.sleep(args.sleep)

    manifest_path = out_base / "animated_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\nResumen")
    print(f"Procesados: {total}")
    print(f"Normal OK: {ok_normal} / {total}")
    print(f"Shiny  OK: {ok_shiny} / {total}")
    print(f"Manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
