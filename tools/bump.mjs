/* كيعاود يحسب گاع الـ ?v=… ف ملفات HTML من المحتوى الحقيقي ديال الملف.

   علاش: التيليفون كيخزن assets/*.js و *.css. إلا بدلتي النص
   وماشدّيتيش الـ ?v=، الزائر اللي دخل من قبل غادي يبقى يشوف
   النسخة القديمة. هاد السكريبت كيحل المشكل بضربة وحدة.

   الاستعمال:   node tools/bump.mjs
                node tools/bump.mjs --check    (كيشوف بلا مايبدل)
*/

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const check = process.argv.includes("--check");

const stamp = (file) =>
    createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);

/* ملف JS مكسور كيطيح الصفحة كاملة، وكتبان بحال "ما زال ماكاينش
   تمارين". ماكنختموش حتى نتأكدو بلي كيتقرا. */
function broken(file) {
    if (!file.endsWith(".js")) return null;
    try {
        execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
        return null;
    } catch (error) {
        const out = String(error.stderr || error.stdout || error.message);
        const line = out.split("\n").find((l) => /SyntaxError|Error:/.test(l));
        return line ? line.trim() : "ماكيتقراش";
    }
}

const pages = readdirSync(".").filter((name) => name.endsWith(".html"));
const cache = new Map();
let changed = 0;
let missing = 0;

/* التحقق قبل كل شي — ماكنبدلو والو إلا كان شي ملف مكسور. */
const assets = new Set();
for (const page of pages) {
    for (const [, asset] of readFileSync(page, "utf8")
            .matchAll(/(assets\/[A-Za-z0-9._-]+\.(?:js|css))\?v=[0-9a-f]+/g)) {
        if (existsSync(asset)) assets.add(asset);
    }
}

const bad = [];
for (const asset of [...assets].sort()) {
    const why = broken(asset);
    if (why) bad.push(`${asset}\n     ${why}`);
}

if (bad.length) {
    console.error("\n❌ ماغاديش نختم — كاين ملف مكسور:\n");
    bad.forEach((b) => console.error("  · " + b));
    console.error("\nصلح الغلط وعاود. (غالبا علامة \" جوا نص بين \"…\")\n");
    process.exit(1);
}

for (const page of pages) {
    const before = readFileSync(page, "utf8");

    const after = before.replace(
        /(assets\/[A-Za-z0-9._-]+\.(?:js|css))\?v=[0-9a-f]+/g,
        (whole, asset) => {
            if (!existsSync(asset)) {
                console.warn(`⚠  ${page}: ماكاينش ${asset}`);
                missing++;
                return whole;
            }
            if (!cache.has(asset)) cache.set(asset, stamp(asset));
            return `${asset}?v=${cache.get(asset)}`;
        });

    if (after !== before) {
        changed++;
        if (!check) writeFileSync(page, after);
        console.log(`${check ? "خاصو تبديل" : "تبدل"}: ${page}`);
    }
}

/* version.json — الصفحات كتقارن بيه واش عندها آخر نسخة.
   صفحة HTML ماعندهاش ?v=، إذن المتصفح كيخزنها وكيبقى كيطلب
   الملفات القدام اللي مذكورين فيها. هاد الملف كيتجاب ديما
   من الشبكة، وإلا بان الفرق الصفحة كتعاود تتحمل بوحدها. */
const manifest = {
    build: createHash("sha256")
        .update([...cache.entries()].sort().map((e) => e.join(":")).join("|"))
        .digest("hex").slice(0, 12),
    assets: Object.fromEntries([...cache.entries()].sort())
};
if (!check) writeFileSync("version.json", JSON.stringify(manifest, null, 2) + "\n");

/* offline.json — الاستعمال بلا أنترنت (firebase-messaging-sw.js و
   assets/offline-prep.js): الصفحات اللي كتتخزن ف التيليفون، والمفاتيح
   ديال المحتوى المدفوع اللي كيتجاب للمشترك باش يخدم بلا wifi. */
{
    const load = (file, name) => {
        const sandbox = {};
        new Function("window", readFileSync(file, "utf8"))(sandbox);
        return sandbox[name];
    };
    const locked = (list) => (list || []).filter((t) => t.locked && !t.soon);
    const ids = [];
    /* Lesen: المفتاح ديال الموضوع (lesen-<id>)، والأجزاء اللي ماكايناش فيه
       كيتقلب عليهم ف lesen-<id>-<part> — parts باش التحضير يعرف شنو يكمل */
    const parts = {};
    for (const lv of ["B1", "B2"]) {
        locked(load(`assets/lesen-${lv.toLowerCase()}-topics.js`, `LESEN_${lv}_TOPICS`))
            .forEach((t) => { ids.push(t.id); parts[t.id] = t.parts || []; });
    }
    /* Sprechen: B1 عندو bundle لكل جزء (t2/t3) + المواضيع «pack» بوحدهم؛ B2 كل موضوع بوحدو */
    const sp = { b1: load("assets/sprechen-b1.js", "SPRECHEN_B1_TOPICS"), b2: load("assets/sprechen-b2-topics.js", "SPRECHEN_B2_TOPICS") };
    ids.push("sprechen-b1-t2", "sprechen-b1-t3");
    locked(sp.b1).filter((t) => t.pack).forEach((t) => ids.push("sprechen-b1-" + t.id));
    locked(sp.b2).forEach((t) => ids.push("sprechen-b2-" + t.id));
    /* Schreiben: B1 كيمشي من طريق Lesen، B2 عندو topicId */
    const sch = { b1: load("assets/schreiben-topics-b1.js", "SCHREIBEN_B1_TOPICS"), b2: load("assets/schreiben-topics-b2.js", "SCHREIBEN_B2_TOPICS") };
    const paid = (o) => Object.keys(o || {}).sort().filter((k) => o[k].locked && !o[k].soon && !(o[k].points || []).length);
    paid(sch.b1).forEach((k) => ids.push("schreiben-b1-" + k));
    ["teil1", "teil2", "teil3", "b1-teil1", "b1-teil2", "b1-teil3"].forEach((t) => ids.push("hoeren-" + t));
    const offline = {
        build: manifest.build,
        pages: pages.filter((p) => !/^(admin|404|offline|premium-check)\.html$/.test(p)).sort(),
        lesen: ids,
        parts: parts,
        schreibenB2: paid(sch.b2)
    };
    if (!check) writeFileSync("offline.json", JSON.stringify(offline) + "\n");
}

console.log(`\n${pages.length} صفحة · ${cache.size} ملف · ${changed} تبدلات`
          + (missing ? ` · ${missing} ملف ناقص` : "")
          + `\nbuild ${manifest.build}`);

if (check && changed) process.exit(1);
