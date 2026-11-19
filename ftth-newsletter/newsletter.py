#!/usr/bin/env python3
"""Newsletter semanal FTTH.

Recolhe artigos das fontes em sources.yaml (RSS, Google News RSS e páginas de
notícias), filtra o que é relevante para FTTH/PON, gera um email HTML em
português e, se configurado, envia-o por SMTP.

Variáveis de ambiente (todas opcionais):
  DAYS                 janela em dias (padrão 7)
  ANTHROPIC_API_KEY    activa o resumo "Destaques da semana" escrito pelo Claude
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO
                       envio por email (MAIL_TO aceita vários, separados por vírgula)
"""
from __future__ import annotations

import html
import json
import os
import re
import smtplib
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from urllib.parse import quote_plus, urljoin

import feedparser
import requests
import yaml

ROOT = Path(__file__).resolve().parent
ARCHIVE = ROOT / "archive"
STATE_FILE = ROOT / "state" / "seen.json"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
DAYS = int(os.environ.get("DAYS", "7"))
MAX_PER_SECTION = 12

# Termos e pesos de relevância FTTH
KEYWORDS: list[tuple[str, int]] = [
    (r"\bftt[hpbxr]\b|fiber[- ]to[- ]the|fibre[- ]to[- ]the", 4),
    (r"\b(g|xg|xgs|10g|25gs?|50g|100g|e|10g-e)[- ]?pon\b|\bpon\b|passive optical", 4),
    (r"\bolt\b|\bont\b|\bonu\b|\bodn\b|splitter|ma5800|lightspan|optical access", 3),
    (r"g\.98[0-9]{2}|g\.984|g\.987|tr-(069|101|156|369|398)|802\.3c[a-z]", 3),
    (r"homes passed|take[- ]rate|open access|wholesale fib|fibre roll|fiber build|fibre build", 3),
    (r"\bfib(re|er|ra)\b|fibra [oó]ptica|optical fib", 2),
    (r"broadband|banda larga|last mile|\bfwa\b|wi-?fi 7|bead\b", 1),
    (r"conectividade|connectivity|internet|telecomunica", 1),
    (r"angola|unitel|inacom|luanda|africell|angola telecom", 2),
]
KW_RE = [(re.compile(p, re.I), w) for p, w in KEYWORDS]
# Ruído a excluir (páginas de índice, bolsa, promoções comerciais)
EXCLUDE_RE = re.compile(
    r"\bpage \d+\b|p[aá]gina \d+|\bstock\b|dividend|share price|\bshares\b|black friday|"
    r"\bdeals?\b|promo[cç]|first year free|a[cç][oõ]es do", re.I)


@dataclass
class Item:
    title: str
    link: str
    source: str
    published: datetime | None
    summary: str = ""
    score: int = 0
    section: str = ""
    extra: dict = field(default_factory=dict)


def score(text: str) -> int:
    return sum(w for rx, w in KW_RE if rx.search(text))


def clean(text: str, limit: int = 280) -> str:
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: limit - 1].rsplit(" ", 1)[0] + "…"


def http_get(url: str) -> bytes:
    for attempt in range(3):
        try:
            r = requests.get(url, headers={"User-Agent": UA}, timeout=30)
            if r.status_code == 429:
                time.sleep(5 * (attempt + 1))
                continue
            r.raise_for_status()
            return r.content
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(3)
    raise RuntimeError(f"falha ao obter {url}")


def gnews_url(src: dict) -> str:
    q = src["query"] + f" when:{DAYS}d"
    hl, gl, ceid = src.get("hl", "en-US"), src.get("gl", "US"), src.get("ceid", "US:en")
    return f"https://news.google.com/rss/search?q={quote_plus(q)}&hl={hl}&gl={gl}&ceid={ceid}"


def from_feed(src: dict, url: str, since: datetime) -> list[Item]:
    feed = feedparser.parse(http_get(url))
    out = []
    for e in feed.entries:
        t = e.get("published_parsed") or e.get("updated_parsed")
        pub = datetime(*t[:6], tzinfo=timezone.utc) if t else None
        if pub and pub < since:
            continue
        title = clean(e.get("title", ""), 220)
        source = src["name"]
        if src["type"] == "gnews":
            # Títulos do Google News terminam em " - Nome do site"
            m = re.match(r"(.*) - ([^-]{2,60})$", title)
            if m:
                title, source = m.group(1).strip(), m.group(2).strip()
        out.append(Item(title, e.get("link", ""), source, pub, clean(e.get("summary", ""))))
    return out


def from_scrape(src: dict, seen: dict) -> list[Item]:
    page = http_get(src["url"]).decode("utf-8", "replace")
    links = sorted(set(re.findall(src["link_pattern"], page)))
    known = set(seen.get(src["name"], []))
    first_run = not known
    out = []
    for link in links:
        full = urljoin(src.get("base", src["url"]), link)
        if full in known:
            continue
        slug = full.rstrip("/").rsplit("/", 1)[-1]
        date_m = re.match(r"(20\d\d)-(\d\d)-(\d\d)-(.*)", slug)
        pub = None
        if date_m:
            y, mth, d, slug = date_m.groups()
            try:
                pub = datetime(int(y), int(mth), int(d), tzinfo=timezone.utc)
            except ValueError:
                pub = None
        title = slug.replace("-", " ").strip().capitalize()
        out.append(Item(title, full, src["name"], pub))
    seen[src["name"]] = sorted(known | {urljoin(src.get("base", src["url"]), l) for l in links})
    if first_run:  # na 1.ª execução só mostra os mais recentes, não o arquivo inteiro
        out = sorted(out, key=lambda i: (i.published or datetime.min.replace(tzinfo=timezone.utc), i.link))[-3:]
    return out


def collect(cfg: dict, seen: dict) -> tuple[dict[str, list[Item]], list[str]]:
    since = datetime.now(timezone.utc) - timedelta(days=DAYS)
    by_section: dict[str, list[Item]] = {}
    errors: list[str] = []
    seen_links: set[str] = set()
    seen_titles: set[str] = set()
    for sec in cfg["sections"]:
        items: list[Item] = []
        for src in sec["sources"]:
            try:
                if src["type"] == "rss":
                    got = from_feed(src, src["url"], since)
                elif src["type"] == "gnews":
                    got = from_feed(src, gnews_url(src), since)
                elif src["type"] == "scrape":
                    got = from_scrape(src, seen)
                else:
                    raise ValueError(f"tipo desconhecido {src['type']}")
            except Exception as exc:  # uma fonte em falha não pára a newsletter
                errors.append(f"{src['name']}: {exc.__class__.__name__}")
                continue
            for it in got:
                # No Google News o resumo repete título + nome do site: pontua só o título
                it.score = score(it.title if src["type"] == "gnews" else f"{it.title} {it.summary}")
                it.section = sec["id"]
                if EXCLUDE_RE.search(it.title):
                    continue
                if src.get("filter", True) and it.score < src.get("min_score", 2):
                    continue
                key = re.sub(r"\W+", "", it.title.lower())[:80]
                if it.link in seen_links or key in seen_titles:
                    continue
                seen_links.add(it.link)
                seen_titles.add(key)
                items.append(it)
        items.sort(key=lambda i: (i.score, i.published or since), reverse=True)
        by_section[sec["id"]] = items[:MAX_PER_SECTION]
    return by_section, errors


def ai_highlights(cfg: dict, by_section: dict[str, list[Item]]) -> str | None:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return None
    import anthropic

    lines = []
    for sec in cfg["sections"]:
        for it in by_section.get(sec["id"], []):
            lines.append(f"[{sec['title']}] {it.title} — {it.source}. {it.summary[:200]}")
    if not lines:
        return None
    prompt = (
        "És analista de redes de acesso FTTH/GPON a trabalhar num operador em Angola. "
        "Abaixo estão as notícias da semana recolhidas automaticamente. Escreve em português "
        "(norma europeia/angolana) uma secção 'Destaques da semana' com 5 a 8 pontos curtos: "
        "o que aconteceu e porque importa para um engenheiro FTTH (tecnologia PON, normas, "
        "mercado, África/Angola). Termina com uma linha 'Para acompanhar:' com 1-2 tendências. "
        "Usa apenas a informação fornecida, não inventes números. Responde só com HTML simples "
        "(<ul><li>, <p>, <b>), sem <html> nem <body>.\n\n" + "\n".join(lines[:120])
    )
    client = anthropic.Anthropic()
    try:
        resp = client.beta.messages.create(
            model="claude-opus-5-5",
            max_tokens=4000,
            output_config={"effort": "low"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as exc:
        print(f"Resumo IA indisponível: {exc}", file=sys.stderr)
        return None
    if resp.stop_reason == "refusal":
        return None
    text = "".join(b.text for b in resp.content if b.type == "text").strip()
    return re.sub(r"^```(?:html)?|```$", "", text).strip() or None


def render(cfg: dict, by_section: dict[str, list[Item]], highlights: str | None, errors: list[str]) -> tuple[str, str]:
    today = datetime.now(timezone.utc)
    start = today - timedelta(days=DAYS)
    subject = f"Newsletter FTTH – semana {start:%d/%m} a {today:%d/%m/%Y}"
    total = sum(len(v) for v in by_section.values())
    parts = [
        "<!doctype html><html lang='pt'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>{html.escape(subject)}</title></head>",
        "<body style='margin:0;background:#f3f5f8;font-family:Segoe UI,Arial,sans-serif;color:#1d2330'>",
        "<div style='max-width:720px;margin:0 auto;padding:16px'>",
        "<div style='background:#0b3d6e;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0'>",
        "<div style='font-size:12px;letter-spacing:1px;opacity:.8'>ACTUALIZAÇÃO SEMANAL</div>",
        f"<div style='font-size:22px;font-weight:600;margin-top:4px'>{html.escape(subject)}</div>",
        f"<div style='font-size:13px;opacity:.85;margin-top:6px'>{total} artigos relevantes de FTTH, PON e fibra</div></div>",
        "<div style='background:#fff;padding:8px 24px 24px;border-radius:0 0 8px 8px'>",
    ]
    if highlights:
        parts.append(
            "<div style='background:#eef5fc;border-left:4px solid #1f73c4;padding:12px 16px;margin:16px 0;border-radius:4px'>"
            "<div style='font-weight:600;font-size:16px;margin-bottom:6px'>Destaques da semana</div>"
            f"<div style='font-size:14px;line-height:1.5'>{highlights}</div></div>"
        )
    for sec in cfg["sections"]:
        items = by_section.get(sec["id"], [])
        parts.append(
            f"<h2 style='font-size:17px;color:#0b3d6e;border-bottom:2px solid #e3e8ef;padding-bottom:6px;margin:24px 0 8px'>{html.escape(sec['title'])}</h2>"
        )
        if not items:
            parts.append("<p style='font-size:13px;color:#6b7280'>Sem novidades relevantes esta semana.</p>")
            continue
        for it in items:
            date = f" · {it.published:%d/%m}" if it.published else ""
            summ = f"<div style='font-size:13px;color:#4b5563;margin-top:2px'>{html.escape(it.summary)}</div>" if it.summary and it.summary[:60] not in it.title else ""
            parts.append(
                "<div style='margin:10px 0 14px'>"
                f"<a href='{html.escape(it.link, quote=True)}' style='font-size:15px;color:#1f5fa8;text-decoration:none;font-weight:600'>{html.escape(it.title)}</a>"
                f"<div style='font-size:12px;color:#6b7280;margin-top:2px'>{html.escape(it.source)}{date}</div>{summ}</div>"
            )
    parts.append(
        "<h2 style='font-size:17px;color:#0b3d6e;border-bottom:2px solid #e3e8ef;padding-bottom:6px;margin:24px 0 8px'>Referências fixas</h2>"
        "<ul style='font-size:13px;line-height:1.7;padding-left:18px'>"
        "<li><a href='https://fibrecouncil.eu/committees/market-intelligence'>FTTH/B Market Panorama (Fibre Council Europe / IDATE)</a></li>"
        "<li><a href='https://www.itu.int/rec/T-REC-G/en'>Recomendações ITU-T série G (G.984, G.9807, G.9804)</a></li>"
        "<li><a href='https://www.broadband-forum.org/technical/technical-reports'>Broadband Forum – Technical Reports (TR-156, TR-101, TR-069)</a></li>"
        "<li><a href='https://www.inacom.gov.ao'>INACOM – estatísticas do mercado angolano</a></li>"
        "<li><a href='https://www.thefoa.org/tech/ref/contents.html'>FOA – guia de referência online gratuito</a></li>"
        "<li><a href='https://e.huawei.com/en/talent'>Huawei Talent – HCIA-Access</a></li></ul>"
    )
    if errors:
        parts.append(f"<p style='font-size:11px;color:#9ca3af'>Fontes sem resposta esta semana: {html.escape(', '.join(errors))}</p>")
    parts.append("<p style='font-size:11px;color:#9ca3af'>Gerado automaticamente a partir de feeds RSS públicos e Google News.</p></div></div></body></html>")
    return subject, "\n".join(parts)


def send(subject: str, body: str) -> bool:
    host, to = os.environ.get("SMTP_HOST"), os.environ.get("MAIL_TO")
    if not host or not to:
        print("SMTP não configurado: email não enviado (HTML guardado em archive/).")
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = os.environ.get("MAIL_FROM") or os.environ.get("SMTP_USER", "")
    msg["To"] = to
    msg.set_content("Abra este email num cliente com suporte HTML para ver a newsletter FTTH.")
    msg.add_alternative(body, subtype="html")
    port = int(os.environ.get("SMTP_PORT", "587"))
    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=60)
    else:
        server = smtplib.SMTP(host, port, timeout=60)
        server.ehlo()
        if server.has_extn("starttls"):
            server.starttls()
    with server:
        if os.environ.get("SMTP_USER"):
            server.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        server.send_message(msg)
    print(f"Email enviado: {subject}")
    return True


def main() -> int:
    cfg = yaml.safe_load((ROOT / "sources.yaml").read_text(encoding="utf-8"))
    seen = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
    by_section, errors = collect(cfg, seen)
    highlights = ai_highlights(cfg, by_section)
    subject, body = render(cfg, by_section, highlights, errors)

    ARCHIVE.mkdir(exist_ok=True)
    out = ARCHIVE / f"{datetime.now(timezone.utc):%Y-%m-%d}.html"
    out.write_text(body, encoding="utf-8")
    (ARCHIVE / "latest.html").write_text(body, encoding="utf-8")
    STATE_FILE.parent.mkdir(exist_ok=True)
    STATE_FILE.write_text(json.dumps(seen, indent=1, ensure_ascii=False))

    for sec in cfg["sections"]:
        print(f"{sec['title']}: {len(by_section.get(sec['id'], []))}")
    if errors:
        print("Falhas:", "; ".join(errors))
    print(f"HTML: {out}")
    send(subject, body)
    return 0


if __name__ == "__main__":
    sys.exit(main())
