/* كيفصل محتوى Sprechen B2 المدفوع على الريبو العام.

   المشكل اللي كيحل: assets/sprechen-b2-content.js كان فيه
   المحتوى ديال 14 موضوع مقفول. الريبو عام، إذن أي واحد
   كيحل الملف كياخدهم بالمجان — بينما Lesen و Hören مقفولين
   بصح (المحتوى ف KV والـ Worker كيتحقق من الاشتراك).

   هاد السكريبت:
     1) كيقرا المواضيع + المحتوى
     2) المواضيع المقفولة → premium-sprechen-split/<key>.json
        (مـ gitignore — كتلصقهم ف Cloudflare KV)
     3) كيعاود يكتب assets/sprechen-b2-content.js بالمجانيين برك

   مفتاح KV:  lesen-sprechen-b2-<id>
   (الـ Worker كيزيد "lesen-" بوحدو — نفس الطريق ديال Hören)

   استعمال:  node tools/split-sprechen.mjs
             node tools/split-sprechen.mjs --check   (بلا ما يبدل)
*/
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";

const check = process.argv.includes("--check");

const TOPICS_FILE  = "assets/sprechen-b2-topics.js";
const CONTENT_FILE = "assets/sprechen-b2-content.js";
const OUT          = "premium-sprechen-split";
/* سميّة الملف = مفتاح KV بالضبط. الـWorker كيقلب على
   "lesen-" + lesenId، والـhub كيصيفط lesenId = sprechen-b2-<id>
   — إذن المفتاح كامل هو lesen-sprechen-b2-<id>.
   KEY_PREFIX هو اللي كيتسمّى بيه الملف، وID_PREFIX هو اللي
   كيتصيفط للـWorker وكيتستعمل كمفتاح داخل الـblob. */
const ID_PREFIX    = "sprechen-b2-";
const KEY_PREFIX   = "lesen-" + ID_PREFIX;

/* الملفات ديال المتصفح كيكتبو ف window — كنقلدوه */
function evalWindow(files) {
    const w = {};
    for (const f of files) new Function("window", readFileSync(f, "utf8"))(w);
    return w;
}

/* Teil 1 عندو ملف بوحدو كيزيد مواضيعو ومحتواه ف نفس الـwindow */
const TEIL1_FILE = "assets/sprechen-b2-teil1.js";

const w = evalWindow([TOPICS_FILE, CONTENT_FILE, TEIL1_FILE, "assets/sprechen-b2-teil23.js"]);
const topics  = w.SPRECHEN_B2_TOPICS  || [];

/* المحتوى ديال الملف الرئيسي برك — الباقي كنعالجوه على حدة */
const w0 = evalWindow([TOPICS_FILE, CONTENT_FILE]);
const content = w0.SPRECHEN_B2_CONTENT || {};

const locked = new Set(topics.filter((t) => t.locked).map((t) => t.id));
const free   = {};
const paid   = {};

for (const [id, body] of Object.entries(content)) {
    (locked.has(id) ? paid : free)[id] = body;
}

/* الـ Worker كيقبل غير [a-z0-9-]{2,40} */
const bad = Object.keys(paid).filter((id) => !/^[a-z0-9-]{2,40}$/.test(ID_PREFIX + id));
if (bad.length) {
    console.error("❌ مفاتيح ما كيقبلهمش الـ Worker:", bad.join(", "));
    process.exit(1);
}

console.log(`مواضيع: ${topics.length} · مقفولين ${locked.size}`);
console.log(`محتوى: ${Object.keys(content).length} مفتاح → مجاني ${Object.keys(free).length} · مدفوع ${Object.keys(paid).length}`);

if (check) {
    const stillPublic = Object.keys(paid).length;
    console.log(stillPublic ? `\n⚠️ ${stillPublic} موضوع مدفوع مازال ف الملف العام.`
                            : "\n✅ ما كاين حتى محتوى مدفوع ف الملف العام.");
    process.exit(stillPublic ? 1 : 0);
}

/* ---- 0) نسخة كاملة ----
   الأداة كتخدم ف اتجاه واحد: من بعد ما تفصل، الملفات
   العامة ما بقاش فيهم المدفوع، وإلا عاودتي شغلتيها كتلقا
   والو. إذن كنخزنو نسخة، وكنرجعو ليها ملي نحتاجو نعاودو
   نبنيو مفاتيح KV بلا ما نرجعو الملفات من git. */
const MASTER = "premium-sprechen.json";
if (!Object.keys(paid).length && existsSync(MASTER)) {
    const saved = JSON.parse(readFileSync(MASTER, "utf8"));
    for (const [k, v] of Object.entries(saved)) {
        if (k.startsWith(ID_PREFIX)) paid[k.slice(ID_PREFIX.length)] = v;
    }
    console.log(`(الملفات العامة ديجا مفصولين — قريت ${Object.keys(paid).length} من ${MASTER})`);
} else if (Object.keys(paid).length) {
    const master = {};
    for (const [id, body] of Object.entries(paid)) master[ID_PREFIX + id] = body;
    writeFileSync(MASTER, JSON.stringify(master, null, 2) + "\n");
}

/* ---- 1) الملفات ديال KV ---- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const rows = [];
for (const [id, body] of Object.entries(paid)) {
    const key = KEY_PREFIX + id;
    const text = JSON.stringify(body);
    writeFileSync(`${OUT}/${key}.json`, text + "\n");
    rows.push([key, Buffer.byteLength(text) / 1024]);
}
rows.sort((a, b) => b[1] - a[1]);
const wide = Math.max(...rows.map((r) => r[0].length));
for (const [k, kb] of rows) console.log("   " + k.padEnd(wide), (kb.toFixed(1) + " KB").padStart(9));

/* ---- 2) الملف العام بالمجانيين برك ---- */
const head = `/* ===== Sprechen B2 — المحتوى المجاني برك =====

   المواضيع المقفولة ماكايناش هنا: الريبو عام. كيسكنو ف
   Cloudflare KV تحت lesen-sprechen-b2-<id>، والـ Worker
   ماكيعطيهمش حتى يتحقق من الحساب ومن الاشتراك — نفس
   الطريق ديال Lesen و Hören.

   هاد الملف مولّد:  node tools/split-sprechen.mjs
   ما تبدلوش بيدك — بدل premium-sprechen.json وعاود شغّل. */

window.SPRECHEN_B2_CONTENT = `;

writeFileSync(CONTENT_FILE, head + JSON.stringify(free, null, 4) + ";\n");

/* ---- 3) Teil 1: نفس الشي، ولكن الملف فيه كود ماشي غير داتا ----
   كنبدلو غير بلوك `const CONTENT = { … };` ونخليو الباقي. */
{
    const src = readFileSync(TEIL1_FILE, "utf8");
    const head = "    const CONTENT = {";
    const at = src.indexOf(head);
    if (at === -1) { console.error("❌ ما لقيتش const CONTENT ف " + TEIL1_FILE); process.exit(1); }

    /* نعدو الأقواس باش نلقاو فين كيسالي البلوك */
    let i = at + head.length - 1, depth = 0, end = -1;
    for (; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) { console.error("❌ البلوك ديال CONTENT ماشي مقفول مزيان"); process.exit(1); }

    const t1 = evalWindow([TOPICS_FILE, TEIL1_FILE]);
    const all1 = t1.SPRECHEN_B2_CONTENT || {};
    const locked1 = new Set((t1.SPRECHEN_B2_TOPICS || []).filter((t) => t.locked).map((t) => t.id));

    const free1 = {}, paid1 = {};
    for (const [id, body] of Object.entries(all1)) {
        if (!body || !body.teil1) continue;
        (locked1.has(id) ? paid1 : free1)[id] = body.teil1;
    }

    for (const [id, body] of Object.entries(paid1)) {
        const key = KEY_PREFIX + id;
        /* الشكل اللي كيتسنى الـhub: { teil1: … } */
        const text = JSON.stringify({ teil1: body });
        writeFileSync(`${OUT}/${key}.json`, text + "\n");
        rows.push([key, Buffer.byteLength(text) / 1024]);
    }

    const rebuilt = "    const CONTENT = " + JSON.stringify(free1, null, 8).replace(/\n/g, "\n    ") + ";";
    writeFileSync(TEIL1_FILE, src.slice(0, at) + rebuilt + src.slice(end + 2));
    console.log(`\n   Teil 1: مجاني ${Object.keys(free1).length} · مدفوع ${Object.keys(paid1).length}`);
}

console.log(`\n✅ ${rows.length} مفتاح ف ${OUT}/ — لصقهم ف Cloudflare KV`);
console.log(`✅ ${CONTENT_FILE} عاود تكتب بـ ${Object.keys(free).length} موضوع مجاني`);
