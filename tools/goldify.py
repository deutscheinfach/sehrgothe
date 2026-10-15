#!/usr/bin/env python3
"""كيحول صفحة من الأحمر/الأبيض للذهبي/الأسود.

كيخدم غير داخل <style>، وكيميز بين السياقات: لون النص ماشي
بحال لون الخلفية. `color: white` كيتخلى كيف ما هو حيت الأبيض
على خلفية كحلة مزيان — عكس `background: white`.
"""

import re
import sys

ACCENT = {  # الأحمر → ذهبي
    "#d60000": "var(--gold)", "#d62828": "var(--gold)", "#dc2626": "var(--gold)",
    "#e30613": "var(--gold)", "#c62828": "var(--danger)", "#c9000b": "var(--gold)",
    "#a90000": "var(--gold-dark)", "#a80000": "var(--gold-dark)", "#b30510": "var(--gold-dark)",
    "#ff1c2a": "var(--gold-soft)", "#ff3030": "var(--danger)", "#ff7070": "var(--danger)",
}

WARM = {  # الأصفر → ذهبي فاتح
    "#ffd166": "var(--gold-soft)", "#f2c500": "var(--gold-soft)",
    "#ffd500": "var(--gold-soft)", "#fff4bd": "var(--gold-soft)",
    "#725d00": "var(--gold-dark)", "#1a1400": "var(--ink)",
}

BG_LIGHT = {  # خلفيات فاتحة → أسطح كحلة
    "white": "var(--surface)", "#ffffff": "var(--surface)", "#fff": "var(--surface)",
    "#fafafa": "var(--surface)", "#f8f8f8": "var(--surface-2)", "#f9f9f9": "var(--surface-2)",
    "#f5f5f5": "var(--ink)", "#f5f6f8": "var(--ink)", "#f1f1f1": "var(--surface-2)",
    "#f2f2f2": "var(--surface-2)", "#eeeeee": "var(--surface-2)", "#eee": "var(--surface-2)",
    "#e8e8e8": "var(--surface-2)", "#fff0f0": "rgba(255,107,107,.12)",
    "#ffe5e7": "rgba(212,175,55,.12)", "#e9f8ef": "rgba(74,222,128,.12)",
    "#effff9": "rgba(74,222,128,.12)", "#fff3cd": "rgba(212,175,55,.14)",
    "#fdecea": "rgba(255,107,107,.12)",
    # حالات الصح/الغلط والأسطح الفاتحة الباقية
    "#d4edda": "rgba(74,222,128,.14)", "#d9f3e3": "rgba(74,222,128,.14)",
    "#dcfce7": "rgba(74,222,128,.14)", "#e7fff7": "rgba(74,222,128,.12)",
    "#f8d7da": "rgba(255,107,107,.14)", "#ffe0e0": "rgba(255,107,107,.14)",
    "#fee2e2": "rgba(255,107,107,.14)", "#fff1f1": "rgba(255,107,107,.10)",
    "#fff5f5": "rgba(255,107,107,.10)", "#fff7f7": "rgba(255,107,107,.10)",
    "#fff8f8": "rgba(255,107,107,.10)",
    "#fff8d8": "rgba(212,175,55,.14)", "#fffaf0": "var(--surface-2)",
    "#eef0f4": "var(--surface-2)", "#f0f1f4": "var(--surface-2)",
    "#f0f2f5": "var(--surface-2)", "#f3f4f6": "var(--surface-2)",
    "#f3f3f3": "var(--surface-2)", "#f0f0f0": "var(--surface-2)",
    "#ddd": "var(--surface-2)",
}

TEXT_DARK = {  # نص كحل → نص فاتح
    "#111": "var(--text)", "#111111": "var(--text)", "#171717": "var(--text)",
    "#181818": "var(--text)", "#222": "var(--text)", "#1a1a1a": "var(--text)",
    "#333": "var(--text)", "#3a3a3a": "var(--text)",
    "#555": "var(--muted)", "#666": "var(--muted)", "#6b6b6b": "var(--muted)",
    "#777": "var(--muted)", "#888": "var(--muted)", "#999": "var(--muted)",
    "#bbb": "var(--muted)",
}

BORDER_LIGHT = {
    "#e4e4e4": "var(--line)", "#e5e5e5": "var(--line)", "#ddd": "var(--line)",
    "#dddddd": "var(--line)", "#ccc": "var(--line)", "#eee": "var(--line)",
    "#eeeeee": "var(--line)", "#f5b5ae": "rgba(255,107,107,.4)",
}


def swap(value, table):
    def one(m):
        key = m.group(0).lower()
        return table.get(key, m.group(0))
    return re.sub(r"#[0-9a-fA-F]{3,8}\b|\bwhite\b", one, value)


def convert_declaration(prop, value):
    # الألوان اللي عندها نفس المعنى فكل سياق
    value = swap(value, ACCENT)
    value = swap(value, WARM)

    if re.search(r"background|shadow|gradient", prop):
        return swap(value, BG_LIGHT)

    if prop.startswith("border") or prop in ("outline", "outline-color"):
        return swap(swap(value, BORDER_LIGHT), BG_LIGHT)

    if prop == "color" or prop.endswith("-color") or prop == "fill" or prop == "stroke":
        # الأبيض على خلفية كحلة مزيان — كنخليوه
        return swap(value, TEXT_DARK)

    return value


DECL = re.compile(r"(^|[;{\s])([a-z-]+)\s*:\s*([^;{}]+)", re.I)


def convert_css(css):
    def one(m):
        head, prop, value = m.group(1), m.group(2).lower(), m.group(3)
        return head + prop + ": " + convert_declaration(prop, value)
    return DECL.sub(one, css)


def convert_file(path):
    src = open(path, encoding="utf-8").read()

    def style_block(m):
        return m.group(1) + convert_css(m.group(2)) + m.group(3)

    out = re.sub(r"(<style[^>]*>)(.*?)(</style>)", style_block, src, flags=re.S)

    # theme.css قبل أي <style> باش الصفحة تقدر تغلب عليه
    if "assets/theme.css" not in out:
        out = out.replace(
            "<style>",
            '<link rel="stylesheet" href="assets/theme.css">\n    <style>',
            1,
        )

    if "fonts.googleapis.com/css2?family=Cairo" not in out:
        out = out.replace(
            '<link rel="stylesheet" href="assets/theme.css">',
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">\n'
            '    <link rel="stylesheet" href="assets/theme.css">',
            1,
        )

    open(path, "w", encoding="utf-8").write(out)
    return out != src


for path in sys.argv[1:]:
    print(("✅ " if convert_file(path) else "⚪ bla tbdil ") + path)
