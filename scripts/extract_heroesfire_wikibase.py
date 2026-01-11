#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HeroesFire HotS Wiki scraper (HEROES + TALENTS) - Improved anti-detection version

Mejoras:
- Headers más realistas y completos
- Rotación de User-Agents
- Delays más humanos y variables
- Manejo mejorado de errores y reintentos
- Opción de usar proxies
"""

import argparse
import csv
import hashlib
import json
import random
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


BASE = "https://www.heroesfire.com"
HEROES_LIST_URL = f"{BASE}/hots/wiki/heroes"

BOT_WALL_PHRASE = "Please verify that you are not a bot to cast your vote."
IGNORE_HEADINGS = {
    "Thanks for your feedback.",
}

TIER_TO_LEVEL = {1: 1, 2: 4, 3: 7, 4: 10, 5: 13, 6: 16, 7: 20}

# Pool de User-Agents reales
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


# ----------------------------
# Text utils
# ----------------------------


def norm_lines(text: str) -> List[str]:
    lines: List[str] = []
    for ln in text.splitlines():
        ln = re.sub(r"\s+", " ", ln).strip()
        if ln:
            lines.append(ln)
    return lines


def clean_wikibase_line(ln: str) -> str:
    ln = re.sub(r"^(Image)+", "", ln).strip()
    ln = re.sub(r"^Image:\s*", "", ln).strip()
    return ln


def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def sleep_human(min_s: float, max_s: float, variance: float = 0.3) -> None:
    """Sleep más humanizado con variación gaussiana"""
    if max_s <= 0:
        return
    base = random.uniform(min_s, max_s)
    # Añade variación gaussiana para hacer delays menos predecibles
    jitter = random.gauss(0, variance)
    delay = max(min_s * 0.5, base + jitter)
    time.sleep(delay)


# ----------------------------
# HTML helpers
# ----------------------------


def pick_meta_image(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    for attrs in (
        {"property": "og:image"},
        {"name": "twitter:image"},
        {"property": "og:image:url"},
        {"name": "twitter:image:src"},
    ):
        tag = soup.find("meta", attrs=attrs)
        if tag and tag.get("content"):
            return urljoin(base_url, tag["content"].strip())
    return None


def pick_first_reasonable_img(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    for img in soup.find_all("img"):
        src = (img.get("src") or "").strip()
        if not src:
            continue
        full = urljoin(base_url, src)
        if full.startswith("http"):
            return full
    return None


def looks_like_bot_wall(html: str) -> bool:
    return BOT_WALL_PHRASE.lower() in html.lower()


# ----------------------------
# Fetcher mejorado
# ----------------------------


@dataclass
class Fetcher:
    min_sleep: float
    max_sleep: float
    timeout: float
    cache_dir: Optional[Path]
    no_cache: bool
    max_retries: int = 5

    def __post_init__(self):
        self.sess = requests.Session()
        self._update_headers()
        self.request_count = 0

    def _update_headers(self):
        """Actualiza headers con UA aleatorio y headers más completos"""
        self.sess.headers.update(
            {
                "User-Agent": random.choice(USER_AGENTS),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0",
            }
        )

    def _get_cache_path(self, url: str) -> Optional[Path]:
        if not self.cache_dir or self.no_cache:
            return None
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        return self.cache_dir / f"{sha1(url)}.html"

    def get(self, url: str) -> str:
        cache_path = self._get_cache_path(url)

        # Intenta cache primero
        if cache_path and cache_path.exists():
            print(f"  [cache] {url}")
            return cache_path.read_text(encoding="utf-8", errors="ignore")

        # Rotar UA cada 10 requests
        self.request_count += 1
        if self.request_count % 10 == 0:
            self._update_headers()

        last_err = None
        for attempt in range(1, self.max_retries + 1):
            try:
                # Delay antes del request (excepto primer intento)
                if attempt > 1:
                    backoff = min(15.0, 1.5 * (2 ** (attempt - 2)))
                    print(
                        f"  [retry {attempt}/{self.max_retries}] esperando {backoff:.1f}s..."
                    )
                    time.sleep(backoff)

                # Request
                resp = self.sess.get(url, timeout=self.timeout, allow_redirects=True)

                # Manejo de status codes
                if resp.status_code == 429:
                    print(f"  [429] Rate limit - esperando más...")
                    time.sleep(random.uniform(5, 10))
                    continue

                if resp.status_code in (500, 502, 503, 504):
                    print(f"  [{resp.status_code}] Error del servidor")
                    continue

                resp.raise_for_status()
                html = resp.text

                # Detecta bot wall de forma más inteligente
                if looks_like_bot_wall(html):
                    # Verifica si es un bloqueo real buscando contenido válido
                    soup_check = BeautifulSoup(html, "html.parser")
                    # Si tiene h1, h2 o contenido real, probablemente está ok
                    has_real_content = (
                        soup_check.find("h1")
                        or soup_check.find("h2")
                        or len(soup_check.find_all("p")) > 3
                    )

                    if not has_real_content or len(html) < 30_000:
                        print(
                            f"  [!] Bot wall REAL detectado (len={len(html)}, content={has_real_content})"
                        )
                        # Cambiar IP/UA y esperar más
                        self._update_headers()
                        wait_time = random.uniform(5, 10) * attempt
                        print(f"  [!] Rotando headers y esperando {wait_time:.1f}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        # Página con contenido real pero tiene el texto del bot wall como parte del sitio
                        print(
                            f"  [ok] Bot wall phrase presente pero contenido válido detectado"
                        )

                # Éxito - guardar en cache
                if cache_path:
                    cache_path.write_text(html, encoding="utf-8", errors="ignore")

                # Delay cortés antes del siguiente request
                sleep_human(self.min_sleep, self.max_sleep)
                return html

            except requests.exceptions.Timeout as e:
                last_err = e
                print(f"  [timeout] Intento {attempt}/{self.max_retries}")

            except requests.exceptions.RequestException as e:
                last_err = e
                print(f"  [error] {type(e).__name__}: {e}")

            except Exception as e:
                last_err = e
                print(f"  [error inesperado] {e}")

        # Todos los intentos fallaron
        raise RuntimeError(
            f"Fallo al descargar {url} después de {self.max_retries} intentos: {last_err}"
        )


# ----------------------------
# Heroes list parsing
# ----------------------------


def parse_heroes_list(html: str) -> List[Tuple[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    heroes: Dict[str, str] = {}

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href.startswith("/hots/wiki/heroes/"):
            continue
        if href.rstrip("/") == "/hots/wiki/heroes":
            continue
        if any(x in href for x in ("/abilities-talents", "/guides", "/discussion")):
            continue

        slug = href.rstrip("/").split("/")[-1]
        url = urljoin(BASE, href)
        heroes[slug] = url

    return sorted(
        [(slug, url) for slug, url in heroes.items()], key=lambda x: x[0].lower()
    )


def build_abilities_talents_url(hero_url: str) -> str:
    return hero_url.rstrip("/") + "/abilities-talents"


# ----------------------------
# Hero meta parsing
# ----------------------------


def _find_label_value(lines: List[str], label: str) -> Optional[str]:
    pat = re.compile(rf"\b{re.escape(label)}:\s*(.+)$", flags=re.I)
    for ln in lines:
        m = pat.search(ln)
        if m:
            return m.group(1).strip()
    return None


def parse_hero_meta_from_abilities_talents(
    html: str, page_url: str, hero_slug: str
) -> Dict:
    soup = BeautifulSoup(html, "html.parser")
    all_text = soup.get_text("\n")
    lines = [clean_wikibase_line(x) for x in norm_lines(all_text)]

    name = None
    h1 = soup.find("h1")
    if h1:
        t = h1.get_text(" ", strip=True)
        m = re.match(r"^(.*?)\s+Abilities\s*&\s*Talents", t, flags=re.I)
        if m:
            name = m.group(1).strip()

    if not name:
        for h2 in soup.find_all("h2"):
            t = h2.get_text(" ", strip=True).strip()
            if not t or t in IGNORE_HEADINGS:
                continue
            if len(t) <= 30:
                name = t
                break

    if not name:
        name = hero_slug.replace("-", " ").title()

    title = _find_label_value(lines, "Title")
    role = _find_label_value(lines, "Role")
    franchise = _find_label_value(lines, "Franchise")
    price = _find_label_value(lines, "Price")

    stats: Dict[str, str] = {}
    description = None
    try:
        idx = lines.index("Statistics")
        i = idx + 1
        while i < len(lines):
            ln = lines[i]
            if ln in (
                "Builds & Guides",
                "Abilities & Talents",
                "Discussion",
            ) or ln.startswith("HotS Wikibase Navigation"):
                break
            m = re.match(r"^([A-Za-z .'/\-]+)\s+(.+)$", ln)
            if m and len(m.group(1)) <= 18:
                stats[m.group(1).strip()] = m.group(2).strip()
                i += 1
                continue
            if not description and len(ln) > 80 and "Copyright" not in ln:
                description = ln
            i += 1
    except ValueError:
        pass

    portrait_url = pick_meta_image(soup, page_url) or pick_first_reasonable_img(
        soup, page_url
    )

    return {
        "name": name,
        "url": page_url,
        "slug": hero_slug,
        "title": title,
        "role": role,
        "franchise": franchise,
        "price": price,
        "portrait_image_url": portrait_url,
        "stats": stats,
        "description": description,
    }


# ----------------------------
# Talent links parsing
# ----------------------------


def parse_talent_urls_from_abilities_talents(html: str, page_url: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    urls: Set[str] = set()

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith("/hots/wiki/talents/"):
            urls.add(urljoin(page_url, href))

    return sorted(urls)


# ----------------------------
# Talent page parsing
# ----------------------------


def _extract_talent_name(soup: BeautifulSoup) -> Optional[str]:
    for h2 in soup.find_all("h2"):
        t = h2.get_text(" ", strip=True).strip()
        if not t or t in IGNORE_HEADINGS:
            continue
        return t

    h1 = soup.find("h1")
    if h1:
        t = h1.get_text(" ", strip=True).strip()
        t = re.sub(r"^HotS Talent:\s*", "", t, flags=re.I).strip()
        if t and t not in IGNORE_HEADINGS:
            return t

    return None


def _extract_hero_owner_from_h4(soup: BeautifulSoup) -> Optional[str]:
    for h4 in soup.find_all("h4"):
        txt = h4.get_text(" ", strip=True).strip()
        if not txt:
            continue

        a = h4.find("a")
        if a:
            at = a.get_text(" ", strip=True).strip()
            if at.lower().endswith("'s"):
                return at[:-2].strip()

        m = re.match(r"^(.+?)'s\s+.+$", txt)
        if m:
            return m.group(1).strip()

    return None


def parse_talent_page(html: str, url: str) -> Dict:
    soup = BeautifulSoup(html, "html.parser")

    name = _extract_talent_name(soup)
    owner = _extract_hero_owner_from_h4(soup)

    lines = [clean_wikibase_line(x) for x in norm_lines(soup.get_text("\n"))]

    tier_index = None
    for ln in lines:
        m = re.match(r"^Tier\s+(\d+)$", ln, flags=re.I)
        if m:
            tier_index = int(m.group(1))
            break

    tier_level = TIER_TO_LEVEL.get(tier_index) if tier_index else None

    description_lines: List[str] = []
    stop_phrases = {
        "modifies ability",
        "see also:",
        "quick comment",
        "hots wikibase navigation",
    }

    start_idx = 0
    if tier_index is not None:
        for i, ln in enumerate(lines):
            if re.match(r"^Tier\s+\d+$", ln, flags=re.I):
                start_idx = i + 1
                break

    owner_line_pat = None
    if name:
        owner_line_pat = re.compile(rf"^(.+?)'s\s+{re.escape(name)}$", flags=re.I)

    for ln in lines[start_idx : start_idx + 60]:
        low = ln.strip().lower()
        if low in stop_phrases or any(low.startswith(x) for x in stop_phrases):
            break
        if not ln or ln in IGNORE_HEADINGS:
            continue
        if name and ln.strip().lower() == name.strip().lower():
            continue
        if owner_line_pat and owner_line_pat.match(ln.strip()):
            continue
        if re.match(r"^.+\s+\([QWERDZ]\)$", ln.strip()):
            continue

        ln = clean_wikibase_line(ln)

        if re.match(r"^(Mana|Cooldown|Range|Charges|Cast time):", ln, flags=re.I):
            break

        description_lines.append(ln)

    talent_description = (
        " ".join(description_lines).strip() if description_lines else None
    )
    if talent_description:
        talent_description = re.sub(r"\s+", " ", talent_description).strip()

    icon_url = pick_meta_image(soup, url) or pick_first_reasonable_img(soup, url)

    modifies = None
    for idx, ln in enumerate(lines):
        if ln.strip().lower() == "modifies ability":
            for ln2 in lines[idx + 1 : idx + 20]:
                m = re.match(r"^(.+?)\s+\(([A-Z])\)$", ln2.strip())
                if m:
                    modifies = {
                        "ability": m.group(1).strip(),
                        "hotkey": m.group(2).strip(),
                    }
                    break
            break

    return {
        "name": name,
        "url": url,
        "slug": url.rstrip("/").split("/")[-1],
        "tier_index": tier_index,
        "tier": tier_level,
        "hero": owner,
        "description": talent_description,
        "icon_image_url": icon_url,
        "modifies": modifies,
    }


# ----------------------------
# Output helpers
# ----------------------------


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_jsonl(path: Path, rows: List[Dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def write_talents_csv(path: Path, heroes_rows: List[Dict], mode: str = "w") -> None:
    """
    Escribe CSV de talentos.
    mode: 'w' para sobrescribir, 'a' para append
    """
    fieldnames = [
        "hero_name",
        "hero_slug",
        "hero_role",
        "hero_franchise",
        "tier",
        "tier_index",
        "talent_name",
        "talent_slug",
        "talent_url",
        "talent_icon_image_url",
        "talent_description",
        "modifies_ability",
        "modifies_hotkey",
    ]

    write_header = mode == "w" or not path.exists()

    with path.open(mode, encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        if write_header:
            w.writeheader()

        for hero in heroes_rows:
            hmeta = hero.get("hero", {})
            for t in hero.get("talents", []):
                w.writerow(
                    {
                        "hero_name": hmeta.get("name"),
                        "hero_slug": hero.get("slug"),
                        "hero_role": hmeta.get("role"),
                        "hero_franchise": hmeta.get("franchise"),
                        "tier": t.get("tier"),
                        "tier_index": t.get("tier_index"),
                        "talent_name": t.get("name"),
                        "talent_slug": t.get("slug"),
                        "talent_url": t.get("url"),
                        "talent_icon_image_url": t.get("icon_image_url"),
                        "talent_description": t.get("description"),
                        "modifies_ability": (t.get("modifies") or {}).get("ability"),
                        "modifies_hotkey": (t.get("modifies") or {}).get("hotkey"),
                    }
                )


def load_existing_hero_slugs_from_csv(csv_path: Path) -> Set[str]:
    """Carga los slugs de héroes que ya están en el CSV"""
    if not csv_path.exists():
        return set()

    existing_slugs = set()
    try:
        with csv_path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                slug = row.get("hero_slug")
                if slug:
                    existing_slugs.add(slug)
        print(f"[*] Encontrados {len(existing_slugs)} héroes existentes en CSV")
    except Exception as e:
        print(f"[!] Error al leer CSV existente: {e}")

    return existing_slugs


def load_existing_hero_slugs_from_json(json_path: Path) -> Set[str]:
    """Carga los slugs de héroes que ya están en JSON/JSONL"""
    if not json_path.exists():
        return set()

    existing_slugs = set()
    try:
        if json_path.suffix.lower() == ".jsonl":
            with json_path.open("r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        slug = data.get("slug")
                        if slug:
                            existing_slugs.add(slug)
        else:  # .json
            data = json.loads(json_path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                for hero in data:
                    slug = hero.get("slug")
                    if slug:
                        existing_slugs.add(slug)

        print(f"[*] Encontrados {len(existing_slugs)} héroes existentes en JSON")
    except Exception as e:
        print(f"[!] Error al leer JSON existente: {e}")

    return existing_slugs


# ----------------------------
# Main
# ----------------------------


def main():
    ap = argparse.ArgumentParser(
        description="Extrae héroes + talentos desde HeroesFire HotS WikiBase."
    )
    ap.add_argument(
        "--out",
        required=True,
        help="Ruta de salida: carpeta o archivo (.json/.jsonl/.csv)",
    )
    ap.add_argument(
        "--limit", type=int, default=0, help="Limita cantidad de héroes (0 = todos)"
    )
    ap.add_argument(
        "--heroes", default="", help="Slugs separados por coma (ej: abathur,genji)"
    )
    ap.add_argument(
        "--min-sleep", type=float, default=2.0, help="Sleep mínimo entre requests"
    )
    ap.add_argument(
        "--max-sleep", type=float, default=4.0, help="Sleep máximo entre requests"
    )
    ap.add_argument("--timeout", type=float, default=30.0, help="Timeout HTTP")
    ap.add_argument(
        "--cache-dir", default=".cache/heroesfire", help="Directorio cache HTML"
    )
    ap.add_argument("--no-cache", action="store_true", help="Desactiva cache")
    ap.add_argument(
        "--max-retries", type=int, default=8, help="Máximo de reintentos por URL"
    )
    ap.add_argument(
        "--format", choices=["auto", "json", "jsonl", "csv"], default="auto"
    )
    ap.add_argument(
        "--skip-failed",
        action="store_true",
        help="Continuar si falla un talento individual",
    )
    ap.add_argument(
        "--start-from",
        type=int,
        default=0,
        help="Empezar desde el héroe N (útil para reanudar)",
    )
    ap.add_argument(
        "--skip-existing",
        action="store_true",
        help="Saltar héroes que ya están en el archivo de salida",
    )
    ap.add_argument(
        "--append",
        action="store_true",
        help="Agregar al archivo existente en vez de sobrescribir",
    )
    args = ap.parse_args()

    out_path = Path(args.out)
    cache_dir = None if args.no_cache else Path(args.cache_dir)

    fetcher = Fetcher(
        min_sleep=args.min_sleep,
        max_sleep=args.max_sleep,
        timeout=args.timeout,
        cache_dir=cache_dir,
        no_cache=args.no_cache,
        max_retries=args.max_retries,
    )

    print(f"[*] Obteniendo lista de héroes...")
    heroes_html = fetcher.get(HEROES_LIST_URL)
    heroes = parse_heroes_list(heroes_html)
    print(f"[*] Encontrados {len(heroes)} héroes")

    wanted = [x.strip() for x in args.heroes.split(",") if x.strip()]
    if wanted:
        heroes = [h for h in heroes if h[0] in wanted]
        print(f"[*] Filtrando a {len(heroes)} héroes específicos")

    # Skip existing heroes if requested
    existing_slugs: Set[str] = set()
    if args.skip_existing:
        # Determinar qué archivo verificar
        if out_path.suffix.lower() in (".json", ".jsonl", ".csv"):
            check_path = out_path
        else:
            # Es una carpeta, verificar los archivos dentro
            check_path = out_path / "talents.csv"
            if not check_path.exists():
                check_path = out_path / "heroes.json"
            if not check_path.exists():
                check_path = out_path / "heroes.jsonl"

        if check_path.exists():
            if check_path.suffix.lower() == ".csv":
                existing_slugs = load_existing_hero_slugs_from_csv(check_path)
            elif check_path.suffix.lower() in (".json", ".jsonl"):
                existing_slugs = load_existing_hero_slugs_from_json(check_path)

            if existing_slugs:
                before_count = len(heroes)
                heroes = [h for h in heroes if h[0] not in existing_slugs]
                skipped = before_count - len(heroes)
                print(
                    f"[*] Saltando {skipped} héroes existentes, quedan {len(heroes)} por procesar"
                )

    if args.limit and args.limit > 0:
        heroes = heroes[: args.limit]
        print(f"[*] Limitando a {len(heroes)} héroes")

    if args.start_from > 0:
        heroes = heroes[args.start_from :]
        print(f"[*] Comenzando desde héroe #{args.start_from}")

    results: List[Dict] = []
    talent_cache: Dict[str, Dict] = {}
    failed_talents: List[str] = []

    for i, (hero_slug, hero_url) in enumerate(heroes, 1 + args.start_from):
        print(f"\n[{i}/{len(heroes)}] Procesando héroe: {hero_slug}")

        at_url = build_abilities_talents_url(hero_url)
        try:
            at_html = fetcher.get(at_url)
        except Exception as e:
            print(f"  [ERROR] No se pudo obtener página de habilidades: {e}")
            if not args.skip_failed:
                raise
            continue

        hero_meta = parse_hero_meta_from_abilities_talents(at_html, at_url, hero_slug)
        talent_urls = parse_talent_urls_from_abilities_talents(at_html, at_url)
        print(f"  Encontrados {len(talent_urls)} talentos")

        talents: List[Dict] = []
        for j, tu in enumerate(talent_urls, 1):
            print(f"  [{j}/{len(talent_urls)}] {tu.split('/')[-1]}")

            if tu in talent_cache:
                t_data = dict(talent_cache[tu])
            else:
                try:
                    t_html = fetcher.get(tu)
                    t_data = parse_talent_page(t_html, tu)
                    talent_cache[tu] = dict(t_data)
                except Exception as e:
                    print(f"    [ERROR] Fallo al procesar talento: {e}")
                    failed_talents.append(tu)
                    if not args.skip_failed:
                        raise
                    continue

            if not t_data.get("hero"):
                t_data["hero"] = hero_meta.get("name")

            talents.append(t_data)

        talents_sorted = sorted(
            talents,
            key=lambda x: (
                x.get("tier_index") if x.get("tier_index") is not None else 999,
                (x.get("name") or "").lower(),
            ),
        )

        results.append(
            {
                "slug": hero_slug,
                "hero": hero_meta,
                "abilities_talents_url": at_url,
                "talents": talents_sorted,
            }
        )

    # Salida
    fmt = args.format
    if fmt == "auto":
        fmt = (
            out_path.suffix.lower().lstrip(".")
            if out_path.suffix.lower() in (".json", ".jsonl", ".csv")
            else "json"
        )

    if out_path.suffix.lower() in (".json", ".jsonl", ".csv"):
        if fmt == "json":
            write_json(out_path, results)
        elif fmt == "jsonl":
            write_jsonl(out_path, results)
        elif fmt == "csv":
            write_talents_csv(out_path, results)
        print(f"\n[✓] Datos guardados en: {out_path}")
    else:
        out_path.mkdir(parents=True, exist_ok=True)
        write_json(out_path / "heroes.json", results)
        write_jsonl(out_path / "heroes.jsonl", results)
        write_talents_csv(out_path / "talents.csv", results)
        print(f"\n[✓] Datos guardados en: {out_path}/")

    if failed_talents:
        print(f"\n[!] Advertencia: {len(failed_talents)} talentos fallaron:")
        for ft in failed_talents[:10]:
            print(f"  - {ft}")
        if len(failed_talents) > 10:
            print(f"  ... y {len(failed_talents) - 10} más")


if __name__ == "__main__":
    main()
