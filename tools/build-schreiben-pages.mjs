/* كيولّد b2-schreiben-NN.html لكل موضوع فـ assets/schreiben-topics-b2.js.
   b2-schreiben-01.html هو القالب: كل صفحة هي نسخة منو بـ TOPIC_ID مختلف.

   الاستعمال:  node tools/build-schreiben-pages.mjs
*/

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const TEMPLATE_FILE = "b2-schreiben-01.html";
const TOPICS_FILE = "assets/schreiben-topics-b2.js";

// الملف ديال المواضيع ماشي module، ف كنقيّموه باش ناخدو الكائن.
const topicsSource = readFileSync(TOPICS_FILE, "utf8");
const topics = new Function(
  `${topicsSource}; return SCHREIBEN_B2_TOPICS;`
)();

const template = readFileSync(TEMPLATE_FILE, "utf8");

/* المتصفح كيحتافظ بالـ JS والـ CSS. بلا بصمة فالرابط، الطالب
   كيبقى يشوف النسخة القديمة حتى يخلص الكاش — ولهذا كنزيدو ?v=hash:
   كيتبدل غير ملي يتبدل الملف. */
function fingerprint(file) {
  return createHash("sha256")
    .update(readFileSync(file))
    .digest("hex")
    .slice(0, 8);
}

const ASSETS = [
  "assets/schreiben-style.css",
  "assets/schreiben-auth.js",
  "assets/schreiben-topics-b2.js",
  "assets/schreiben-engine.js",
];

function withFingerprints(html) {
  for (const asset of ASSETS) {
    html = html.replace(
      new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '(\\?v=[a-f0-9]+)?"', "g"),
      asset + "?v=" + fingerprint(asset) + '"'
    );
  }
  return html;
}

const TOPIC_ID_RE = /const TOPIC_ID = "(\d+)";/;

if (!TOPIC_ID_RE.test(template)) {
  throw new Error(`ما لقيتش TOPIC_ID فـ ${TEMPLATE_FILE}`);
}

const ids = Object.keys(topics).sort();
let written = 0;

for (const id of ids) {
  const file = `b2-schreiben-${id}.html`;
  const html = withFingerprints(
    template.replace(TOPIC_ID_RE, `const TOPIC_ID = "${id}";`)
  );

  // ما نعاودوش نكتبو ملف ما تبدل فيه والو.
  let current = null;
  try {
    current = readFileSync(file, "utf8");
  } catch {
    current = null;
  }

  if (current === html) continue;

  writeFileSync(file, html);
  written++;
  console.log(`${current === null ? "created" : "updated"}  ${file}  — ${topics[id].title}`);
}

console.log(`\n${ids.length} مواضيع · ${written} ملفات تكتبات`);
