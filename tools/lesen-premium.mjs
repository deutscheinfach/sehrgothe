/* كيقسم محتوى Lesen: المجاني كيبقى فالملف العام، والمدفوع كيخرج
   لملف premium-lesen.json اللي كتحطو ف Cloudflare KV.

   علاش: الـ repo عام. أي واحد يقدر يقرا assets/lesen-b2-content.js.
   القفل فالواجهة كيخبي التمرين، ولكن النص كيبقى فالملف. الحماية
   الحقيقية هي أن النص ما يكونش فالملف أصلا.

   الاستعمال:
     node tools/lesen-premium.mjs          كيبني premium-lesen.json
     node tools/lesen-premium.mjs --strip  وكيحيدهم من الملف العام

   المواضيع المجانية كتتحدد من locked: false ف lesen-b2-topics.js.
*/

import { readFileSync, writeFileSync } from "node:fs";

const CONTENT = "assets/lesen-b2-content.js";
const TOPICS  = "assets/lesen-b2-topics.js";
const OUT     = "premium-lesen.json";

const strip = process.argv.includes("--strip");

/* نقراو الملفين بحال ما كيقراهم المتصفح */
const scope = { window: {} };
new Function("window", readFileSync(TOPICS, "utf8"))(scope.window);
new Function("window", readFileSync(CONTENT, "utf8"))(scope.window);

const topics  = scope.window.LESEN_B2_TOPICS || [];
const content = scope.window.LESEN_B2_CONTENT || {};

const locked = new Set(topics.filter((t) => t.locked).map((t) => t.id));
const free   = topics.filter((t) => !t.locked).map((t) => t.id);

const premium = {};
const kept = [];

for (const id of Object.keys(content)) {
    if (locked.has(id)) premium[id] = content[id];
    else kept.push(id);
}

writeFileSync(OUT, JSON.stringify(premium, null, 2) + "\n");

console.log(`مجاني  (${kept.length}): ${kept.join(", ") || "—"}`);
console.log(`مدفوع  (${Object.keys(premium).length}): ${Object.keys(premium).join(", ") || "—"}`);
console.log(`\n${OUT} — ${(JSON.stringify(premium).length / 1024).toFixed(1)} KB`);

if (!strip) {
    console.log("\nما حيدت والو من الملف العام. زيد --strip باش تحيدهم.");
    process.exit(0);
}

/* كنحيدو الكتل ديال المواضيع المدفوعة من الملف العام */
let src = readFileSync(CONTENT, "utf8");
let removed = 0;

for (const id of Object.keys(premium)) {
    const start = src.indexOf(`        "${id}": `);
    if (start === -1) {
        console.warn(`⚠  ما لقيتش الكتلة ديال ${id}`);
        continue;
    }
    /* الكتلة كتسالي فـ "})()," ولا "})()" فالآخر */
    const endComma = src.indexOf("        })(),\n", start);
    const endLast  = src.indexOf("        })()\n", start);
    const end = endComma !== -1 ? endComma + "        })(),\n".length
                                : endLast + "        })()\n".length;

    /* والتعليق اللي فوقها كيمشي معاها */
    let from = start;
    const comment = src.lastIndexOf("        /* ====", start);
    if (comment !== -1 && src.slice(comment, start).trim().endsWith("*/")) from = comment;

    src = src.slice(0, from) + src.slice(end);
    removed++;
}

/* ما نخليوش فاصلة معلقة قبل إغلاق الكائن */
src = src.replace(/,(\s*)\};(\s*)\}\)\(\);\s*$/, "$1};$2})();\n");

writeFileSync(CONTENT, src);
console.log(`\n🔒 حيدت ${removed} موضوع من ${CONTENT}`);
