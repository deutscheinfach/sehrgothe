#!/usr/bin/env python3
"""SEO ديال الموقع — كيتعاود يتشغل بلا مشاكل (idempotent).

    python3 tools/seo.py

شنو كيدير:
  1) لكل صفحة: <title> و <meta description> مزيانين + canonical + Open Graph
     (البطاقة اللي كتبان ملي كتپارطاجي الرابط ف WhatsApp / Facebook).
  2) الصفحات الخاصة (login, fortschritt…) والصفحات القديمة: noindex.
  3) index.html: JSON-LD (WebSite + EducationalOrganization) لـ Google.
  4) sitemap.xml و robots.txt.

الصفحات الجداد ديال Schreiben كياخدو العنوان من assets/schreiben-topics-b1/b2.js
(غير العنوان — المحتوى ديال Premium ماكيدخلش هنا).
زيد صفحة جديدة؟ زيدها ف PAGES لتحت وعاود شغّل السكريبت.
"""

import html as htmllib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://deutsch-einfach.online/"
IMAGE = SITE + "assets/icon-512.png"
BRAND = "Deutsch Einfach"
ALT_NAMES = ["deutsch-einfach", "Deutsch-Einfach", "deutsch-einfach.online", "Deutsch Einfach telc"]

# ---------------------------------------------------------------- الصفحات
# file: (title, description, priority)
PAGES = {
    "index.html": (
        # السمية ديال الموقع هي اللولة: باش يبان ملي يكتبو «deutsch einfach»
        "Deutsch Einfach – Telc B1 & B2 Prüfungsvorbereitung online",
        "Deutsch Einfach (deutsch-einfach.online): حضّر امتحان telc B1 و B2 بالدارجة: Lesen، Hören، Schreiben مع تصحيح بالذكاء الاصطناعي، "
        "Sprechen بالصوت، امتحانات تجريبية و Wortschatz. Telc Prüfung online üben – kostenlos starten.",
        "1.0"),

    "selbsttest.html": ("اختبر نفسك – امتحان telc B1 و B2 كامل وعشوائي | Deutsch Einfach",
        "امتحان telc B1 ولا B2 كامل وجديد ف كل مرة: Lesen، Sprachbausteine و Hören من مواضيع مخلطة، بالوقت، والنتيجة من 180 مع التحليل. Telc B1 & B2 Prüfung online testen.", "0.7"),

    "bewerbung.html": ("Bewerbung و ترجمة الوثائق للألمانية – المغرب | Deutsch Einfach",
        "كنكتبو ليك Bewerbung كاملة بالألمانية (Lebenslauf و Anschreiben) ب 200 درهم، وكنترجمو الوثائق ديالك "
        "للألمانية ب 150 درهم للورقة. Bewerbung schreiben lassen & Übersetzung für Deutschland.", "0.8"),

    "telc-maroc.html": ("امتحان telc B1 و B2 ف المغرب 2026: الثمن، المراكز، التسجيل | Deutsch Einfach",
        "كلشي على امتحان telc B1 و B2 ف المغرب بالدارجة: الثمن (220 €)، المراكز الستة (كازا، الرباط، مكناس، طنجة، أكادير)، "
        "كيفاش تسجل، شنو كاين ف الامتحان، شحال خاصك باش تنجح، وخطة 30 يوم.", "0.9"),

    # ---- B1
    "b1-lesen.html": ("Telc B1 Lesen – Übungen mit Lösungen | Deutsch Einfach",
        "تمارين Lesen ديال telc B1 بالحلول والترجمة للعربية: Teil 1، 2، 3 و Sprachbausteine. Telc B1 Leseverstehen online üben.", "0.9"),
    "b1-lesen-teil1.html": ("Telc B1 Lesen Teil 1 – Übungen online | Deutsch Einfach",
        "Telc B1 Leseverstehen Teil 1: ربط العناوين بالنصوص، مع التصحيح والترجمة. Überschriften zuordnen – online üben.", "0.8"),
    "b1-lesen-teil2.html": ("Telc B1 Lesen Teil 2 – Übungen online | Deutsch Einfach",
        "Telc B1 Leseverstehen Teil 2: أسئلة الاختيار على نص طويل، مع الحلول والشرح. Multiple Choice online üben.", "0.8"),
    "b1-lesen-teil3.html": ("Telc B1 Lesen Teil 3 – Übungen online | Deutsch Einfach",
        "Telc B1 Leseverstehen Teil 3: ربط الوضعيات بالإعلانات، مع التصحيح. Anzeigen und Situationen zuordnen – online üben.", "0.8"),
    "b1-lesen-sprach1.html": ("Telc B1 Sprachbausteine Teil 1 – Übungen | Deutsch Einfach",
        "Telc B1 Sprachbausteine Teil 1: القواعد فالنص مع الحلول والشرح بالعربية. Grammatik im Kontext üben.", "0.8"),
    "b1-lesen-sprach2.html": ("Telc B1 Sprachbausteine Teil 2 – Übungen | Deutsch Einfach",
        "Telc B1 Sprachbausteine Teil 2: اختار الكلمة المناسبة من اللائحة، مع التصحيح. Wortschatz im Kontext üben.", "0.8"),
    "b1-hoeren.html": ("Telc B1 Hören – Übungen mit Audio | Deutsch Einfach",
        "تمارين Hören ديال telc B1 بالصوت: Teil 1، 2 و 3 مع التصحيح وقصص سهلة للحفظ. Telc B1 Hörverstehen online üben.", "0.9"),
    "b1-hoeren-teil1.html": ("Telc B1 Hören Teil 1 – Übungen online | Deutsch Einfach",
        "Telc B1 Hörverstehen Teil 1: سمع وجاوب richtig / falsch، مع التصحيح. Hören Teil 1 online üben.", "0.8"),
    "b1-hoeren-teil2.html": ("Telc B1 Hören Teil 2 – Übungen online | Deutsch Einfach",
        "Telc B1 Hörverstehen Teil 2: سمع مقابلة وجاوب على الأسئلة، مع التصحيح. Hören Teil 2 online üben.", "0.8"),
    "b1-hoeren-teil3.html": ("Telc B1 Hören Teil 3 – Übungen online | Deutsch Einfach",
        "Telc B1 Hörverstehen Teil 3: رسائل قصيرة وإعلانات، richtig / falsch مع التصحيح. Hören Teil 3 online üben.", "0.8"),
    "b1-schreiben.html": ("Telc B1 Schreiben – Briefe mit KI-Korrektur | Deutsch Einfach",
        "34 موضوع ديال Schreiben telc B1: كتب الرسالة ديالك وخد تصحيح فوري بالذكاء الاصطناعي ونقطة من 45. "
        "Telc B1 Brief schreiben – Beispiele und Korrektur.", "0.9"),
    "b1-sprechen.html": ("Telc B1 Sprechen – Teil 1, 2, 3 üben | Deutsch Einfach",
        "Telc B1 Sprechen: التعارف، Über ein Thema sprechen و Gemeinsam planen، مع حوارات نموذجية بالصوت، "
        "محاكاة مع شريك وتسجيل. 45 امتحان كامل.", "0.9"),

    # ---- B2
    "b2-lesen.html": ("Telc B2 Lesen – Übungen mit Lösungen | Deutsch Einfach",
        "تمارين Lesen ديال telc B2 بالحلول والترجمة للعربية: Teil 1، 2، 3 و Sprachbausteine. Telc B2 Leseverstehen online üben.", "0.9"),
    "b2-lesen-teil1.html": ("Telc B2 Lesen Teil 1 – Übungen online | Deutsch Einfach",
        "Telc B2 Leseverstehen Teil 1: ربط العناوين بالنصوص، مع التصحيح والترجمة. Überschriften zuordnen – online üben.", "0.8"),
    "b2-lesen-teil2.html": ("Telc B2 Lesen Teil 2 – Übungen online | Deutsch Einfach",
        "Telc B2 Leseverstehen Teil 2: أسئلة الاختيار على نص طويل، مع الحلول والشرح. Multiple Choice online üben.", "0.8"),
    "b2-lesen-teil3.html": ("Telc B2 Lesen Teil 3 – Übungen online | Deutsch Einfach",
        "Telc B2 Leseverstehen Teil 3: ربط الوضعيات بالإعلانات، مع التصحيح. Anzeigen zuordnen – online üben.", "0.8"),
    "b2-lesen-sprach1.html": ("Telc B2 Sprachbausteine Teil 1 – Übungen | Deutsch Einfach",
        "Telc B2 Sprachbausteine Teil 1: القواعد فالنص مع الحلول والشرح بالعربية. Grammatik im Kontext üben.", "0.8"),
    "b2-lesen-sprach2.html": ("Telc B2 Sprachbausteine Teil 2 – Übungen | Deutsch Einfach",
        "Telc B2 Sprachbausteine Teil 2: اختار الكلمة المناسبة، مع التصحيح. Wortschatz im Kontext üben.", "0.8"),
    "b2-hoeren.html": ("Telc B2 Hören – Übungen mit Audio | Deutsch Einfach",
        "تمارين Hören ديال telc B2 بالصوت: Teil 1، 2 و 3 مع التصحيح. Telc B2 Hörverstehen online üben.", "0.9"),
    "b2-hoeren-teil1.html": ("Telc B2 Hören Teil 1 – Übungen online | Deutsch Einfach",
        "Telc B2 Hörverstehen Teil 1: سمع وجاوب، مع التصحيح. Hören Teil 1 online üben.", "0.8"),
    "b2-hoeren-teil2.html": ("Telc B2 Hören Teil 2 – Übungen online | Deutsch Einfach",
        "Telc B2 Hörverstehen Teil 2: سمع مقابلة وجاوب على الأسئلة، مع التصحيح. Hören Teil 2 online üben.", "0.8"),
    "b2-hoeren-teil3.html": ("Telc B2 Hören Teil 3 – Übungen online | Deutsch Einfach",
        "Telc B2 Hörverstehen Teil 3: رسائل قصيرة وإعلانات، مع التصحيح. Hören Teil 3 online üben.", "0.8"),
    "b2-schreiben.html": ("Telc B2 Schreiben – Beschwerde mit KI-Korrektur | Deutsch Einfach",
        "مواضيع Schreiben ديال telc B2 (Beschwerde): كتب وخد تصحيح فوري بالذكاء الاصطناعي ونقطة. "
        "Telc B2 Beschwerde schreiben – Beispiele und Korrektur.", "0.9"),
    "b2-sprechen.html": ("Telc B2 Sprechen – Teil 1, 2, 3 üben | Deutsch Einfach",
        "Telc B2 Sprechen: Über Erfahrungen sprechen، Diskussion و Problemlösung مع مؤقت، تسجيل وأسئلة الممتحن بالصوت.", "0.9"),

    # ---- أدوات
    "modelltest.html": ("Telc B2 Modelltest online mit Timer | Deutsch Einfach",
        "امتحان تجريبي ديال telc B2 بالوقت: Lesen، Sprachbausteine و Hören، والتصحيح والنتيجة ف اللخر. "
        "Telc B2 Modelltest online.", "0.8"),
    "wortschatz.html": ("Wortschatz B1/B2 – 1000 Wörter mit Karteikarten | Deutsch Einfach",
        "تعلم 1000 كلمة ألمانية مهمة لـ telc B1 و B2 بالبطاقات والمراجعة الذكية، مع الترجمة للعربية. Wortschatz trainieren.", "0.8"),
    "payment.html": ("Premium – Preise und Zahlung | Deutsch Einfach",
        "أثمنة Premium ديال Deutsch Einfach وطرق الدفع فالمغرب: كاع المواضيع ديال telc B1 و B2 وتصحيح بالذكاء الاصطناعي.", "0.5"),
}

# صفحات ماخاصهاش تبان ف Google (خاصة، ولا قديمة)
NOINDEX = [
    "login.html", "signup.html", "einstufungstest.html", "forgot-password.html", "premium-check.html",
    "fortschritt.html", "404.html",
    "50-euro.html", "europaeischen.html", "die-tschechische-stadt-pilsen.html",
    "thema1.html", "lesen-teil1.html", "admin.html",
]


def schreiben_topics(level):
    """العناوين ديال Schreiben من ملف المواضيع (JSON من بعد '= ')."""
    text = (ROOT / "assets" / f"schreiben-topics-{level}.js").read_text(encoding="utf-8")
    body = text[text.index("{", text.index(f"SCHREIBEN_{level.upper()}_TOPICS")):].rstrip().rstrip(";")
    return json.loads(body)


def add_schreiben_pages():
    for lvl, label in (("b1", "B1"), ("b2", "B2")):
        for tid, t in schreiben_topics(lvl).items():
            f = f"{lvl}-schreiben-{tid}.html"
            if not (ROOT / f).exists():
                continue
            title = t.get("title", "").strip()
            kind = "Brief" if lvl == "b1" else (t.get("type") or "Beschwerde")
            PAGES[f] = (
                f"Telc {label} Schreiben: {title} | Deutsch Einfach",
                f"Telc {label} Schreiben – {kind}: «{title}». كتب الجواب ديالك وخد تصحيح فوري بالذكاء "
                f"الاصطناعي ونقطة من 45، مع الشرح بالدارجة. {kind} schreiben mit KI-Korrektur.",
                "0.6",
            )


# ---------------------------------------------------------------- <head>
def esc(s):
    return (s.replace("&", "&amp;").replace('"', "&quot;")
             .replace("<", "&lt;").replace(">", "&gt;"))


def url_of(f):
    return SITE if f == "index.html" else SITE + f


JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": SITE + "#website",
            "url": SITE,
            "name": BRAND,
            # Google كيستعمل name و alternateName باش يعرف سمية الموقع
            "alternateName": ALT_NAMES,
            "inLanguage": ["ar", "de"],
            "description": "Telc B1 & B2 Prüfungsvorbereitung auf Arabisch und Darija.",
        },
        {
            "@type": "EducationalOrganization",
            "@id": SITE + "#org",
            "name": BRAND,
            "alternateName": ALT_NAMES,
            "url": SITE,
            "logo": IMAGE,
            "areaServed": "MA",
            "description": "تحضير امتحانات telc B1 و B2 بالدارجة المغربية.",
        },
    ],
}


def seo_block(f, title, desc, noindex):
    lines = ["<!-- seo:start (tools/seo.py) -->"]
    if desc:
        lines.append(f'<meta name="description" content="{esc(desc)}">')
    if noindex:
        lines.append('<meta name="robots" content="noindex, follow">')
    else:
        lines.append(f'<link rel="canonical" href="{url_of(f)}">')
    lines += [
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{BRAND}">',
        f'<meta property="og:title" content="{esc(title)}">',
    ]
    if desc:
        lines.append(f'<meta property="og:description" content="{esc(desc)}">')
    lines += [
        f'<meta property="og:url" content="{url_of(f)}">',
        f'<meta property="og:image" content="{IMAGE}">',
        '<meta property="og:locale" content="ar_MA">',
        '<meta name="twitter:card" content="summary">',
        '<link rel="icon" href="assets/icon-48.png" sizes="48x48">',
        '<link rel="icon" href="assets/icon-192.png" sizes="192x192">',
        '<link rel="icon" href="assets/icon-32.png" sizes="32x32">',
        '<link rel="apple-touch-icon" href="assets/icon-180.png">',
        '<link rel="manifest" href="manifest.webmanifest">',
        '<meta name="theme-color" content="#e3163f">',
    ]
    if f == "index.html":
        lines.append('<script type="application/ld+json">'
                     + json.dumps(JSON_LD, ensure_ascii=False) + "</script>")
    lines.append("<!-- seo:end -->")
    return "\n".join(lines) + "\n"


BLOCK_RE = re.compile(r"<!-- seo:start.*?<!-- seo:end -->\n?", re.S)
DESC_RE = re.compile(r'[ \t]*<meta\s+name="description"[^>]*>\n?', re.S | re.I)
TITLE_RE = re.compile(r"<title>.*?</title>", re.S | re.I)
ICON_RE = re.compile(r'[ \t]*<link\s+rel="(?:shortcut )?icon"[^>]*>\n?', re.I)


def patch(f, title, desc, noindex):
    path = ROOT / f
    html = path.read_text(encoding="utf-8")
    old = html
    # الوصف والعنوان القدام كيتقراو قبل ما نحيدو البلوك (باش التشغيل الثاني يعطي نفس النتيجة)
    if not desc:
        m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html, re.S | re.I)
        desc = htmllib.unescape(m.group(1)) if m else ""
    html = BLOCK_RE.sub("", html)
    if title:
        html = TITLE_RE.sub("<title>" + title.replace("&", "&amp;") + "</title>", html, count=1)
    else:
        m = TITLE_RE.search(html)
        title = htmllib.unescape(re.sub(r"<[^>]+>", "", m.group(0))) if m else BRAND
    html = DESC_RE.sub("", html)
    html = ICON_RE.sub("", html)
    i = html.lower().index("</head>")
    html = html[:i] + seo_block(f, title, desc, noindex) + html[i:]
    if html != old:
        path.write_text(html, encoding="utf-8")
        return True
    return False


# ---------------------------------------------------------------- sitemap
def lastmod(f):
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", f], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout.strip()
        return out or None
    except Exception:
        return None


def write_sitemap():
    rows = []
    for f, (_, _, prio) in sorted(PAGES.items(), key=lambda kv: (-float(kv[1][2]), kv[0])):
        lm = lastmod(f)
        rows.append("  <url><loc>%s</loc>%s<priority>%s</priority></url>"
                    % (url_of(f), f"<lastmod>{lm}</lastmod>" if lm else "", prio))
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(rows) + "\n</urlset>\n")
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\nSitemap: " + SITE + "sitemap.xml\n", encoding="utf-8")
    return len(rows)


def main():
    add_schreiben_pages()
    changed = 0
    for f, (title, desc, _) in PAGES.items():
        if (ROOT / f).exists():
            changed += patch(f, title, desc, False)
    for f in NOINDEX:
        if (ROOT / f).exists():
            changed += patch(f, None, None, True)
    n = write_sitemap()
    print(f"pages patched: {changed} · sitemap URLs: {n}")


if __name__ == "__main__":
    main()
