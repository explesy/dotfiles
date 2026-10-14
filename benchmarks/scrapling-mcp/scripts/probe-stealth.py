#!/usr/bin/env python3
"""Probe Scrapling stealth bypass on purpose-built public test endpoints.

Only public challenge-test pages. No third-party sites without permission, no
CAPTCHA-solving services, no logins.

Run with the pinned Scrapling env, e.g.:
    "$(uv tool dir)/scrapling/bin/python" scripts/probe-stealth.py

Prereqs:
    uv tool install "scrapling[ai]==0.4.15" --python 3.12
    "$(uv tool dir)/scrapling/bin/python" -m patchright install chromium
"""
import json
import time
from scrapling.fetchers import Fetcher, DynamicFetcher, StealthyFetcher

TARGETS = {
    "nowsecure": "https://nowsecure.nl/",
    "scrapingcourse-cf": "https://www.scrapingcourse.com/cloudflare-challenge",
}

CONFIGS = [
    ("http", lambda u: Fetcher.get(u, timeout=30)),
    ("dynamic-headless", lambda u: DynamicFetcher.fetch(u, network_idle=True, timeout=60000)),
    ("stealth-headless-solve", lambda u: StealthyFetcher.fetch(u, headless=True, solve_cloudflare=True, network_idle=True, timeout=150000)),
    ("stealth-headed-plain", lambda u: StealthyFetcher.fetch(u, headless=False, timeout=150000)),
    ("stealth-headed-solve", lambda u: StealthyFetcher.fetch(u, headless=False, solve_cloudflare=True, timeout=150000)),
]


def probe(label, url, fn):
    start = time.time()
    try:
        page = fn(url)
        body = page.get_all_text() or ""
        print(json.dumps({
            "target": label,
            "config": fn.__name__,
            "status": page.status,
            "sec": round(time.time() - start, 1),
            "chars": len(body),
            "bypassed": "bypassed the Cloudflare challenge" in body,
            "sample": body.strip()[:140].replace("\n", " "),
        }, ensure_ascii=False))
    except Exception as exc:  # noqa: BLE001 - report any fetcher failure
        print(json.dumps({
            "target": label,
            "config": fn.__name__,
            "error": f"{type(exc).__name__}: {exc}"[:200],
        }))


if __name__ == "__main__":
    for name, url in TARGETS.items():
        for cfg_name, factory in CONFIGS:
            factory.__name__ = cfg_name
            probe(name, url, factory)
