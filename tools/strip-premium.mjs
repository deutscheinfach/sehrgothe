/* كيحيد نص الموضوع من الملف العام باش يبقى غير فـ KV.
   كيخلي غير الميتاداتا (العنوان، المستوى...) باش الصفحة تعرف الموضوع كاين.

   الاستعمال:  node tools/strip-premium.mjs 06 07 08
*/

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "assets/schreiben-topics-b2.js";
const ids = process.argv.slice(2);

if (!ids.length) throw new Error("عطيني أرقام المواضيع");

const src = readFileSync(FILE, "utf8");
const match = src.match(/^([\s\S]*?const SCHREIBEN_B2_TOPICS = )(\{[\s\S]*\})(;\s*)$/);
if (!match) throw new Error(`ما قدرتش نقرا بنية ${FILE}`);

const [, header, body, tail] = match;
const topics = JSON.parse(body);

for (const id of ids) {
  if (!topics[id]) throw new Error(`الموضوع ${id} ماكاينش`);
  if (!topics[id].locked) throw new Error(`الموضوع ${id} مجاني — ما خاصوش يتحيد`);

  delete topics[id].ad;
  delete topics[id].situation;
  delete topics[id].points;
  delete topics[id].words;

  console.log(`🔒 ${id} — ${topics[id].title}`);
}

writeFileSync(FILE, header + JSON.stringify(topics, null, 2) + tail);
