import os, time, base64
from urllib.parse import urlparse
import httpx

ENABLED = os.getenv("URL_REPUTATION", "true").lower() == "true"
VT_KEY = os.getenv("VIRUSTOTAL_API_KEY", "").strip()
FEED_URL = "https://openphish.com/feed.txt"
FEED_TTL = 12 * 3600
MAX_URLS = 3
TIMEOUT = 4.0

# Shared services host both good and bad pages — only match the exact URL there
SHARED_HOSTS = {
    "e.vg", "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rb.gy",
    "docs.google.com", "drive.google.com", "forms.gle", "sites.google.com",
    "storage.googleapis.com", "www.dropbox.com", "dropbox.com", "notion.site",
    "github.com", "raw.githubusercontent.com", "www.canva.com", "canva.com",
}

_feed = {"urls": set(), "hosts": set(), "fetched": 0.0}
_vt_cache = {}


def _load_feed():
    if time.time() - _feed["fetched"] < FEED_TTL:
        return
    _feed["fetched"] = time.time()  # back off on failure too
    try:
        r = httpx.get(FEED_URL, timeout=TIMEOUT, follow_redirects=True)
        r.raise_for_status()
        urls = {u.strip() for u in r.text.splitlines() if u.strip()}
        _feed["urls"] = urls
        _feed["hosts"] = {urlparse(u).hostname for u in urls if urlparse(u).hostname}
    except Exception:
        pass


def _virustotal(url: str):
    if url in _vt_cache:
        return _vt_cache[url]
    url_id = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
    stats = None
    try:
        r = httpx.get(f"https://www.virustotal.com/api/v3/urls/{url_id}",
                      headers={"x-apikey": VT_KEY}, timeout=TIMEOUT)
        if r.status_code == 200:
            stats = r.json()["data"]["attributes"]["last_analysis_stats"]
        elif r.status_code != 404:
            return None  # quota/auth/transient error: don't cache, retry next time
    except Exception:
        return None
    _vt_cache[url] = stats
    return stats


def check_urls(urls: list) -> list:
    """Return rule-style findings for URLs found in known threat feeds."""
    if not ENABLED or not urls:
        return []
    _load_feed()
    findings = []
    for url in urls[:MAX_URLS]:
        url = url.rstrip(".,;)>]\"'")
        host = urlparse(url).hostname or ""
        host_listed = host in _feed["hosts"] and host not in SHARED_HOSTS
        if url in _feed["urls"] or host_listed:
            findings.append({"rule": "url_reputation",
                "detail": f"{host} is listed in the OpenPhish live phishing feed",
                "severity": "critical"})
            continue
        if VT_KEY:
            stats = _virustotal(url)
            if stats:
                bad = stats.get("malicious", 0) + stats.get("suspicious", 0)
                if bad >= 3:
                    findings.append({"rule": "url_reputation",
                        "detail": f"{host} flagged by {bad} security vendors on VirusTotal",
                        "severity": "critical"})
                elif bad >= 1:
                    findings.append({"rule": "url_reputation",
                        "detail": f"{host} flagged by {bad} security vendor(s) on VirusTotal",
                        "severity": "high"})
    return findings
