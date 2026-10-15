/* كيبدل ad / situation / points ديال موضوع فـ assets/schreiben-topics-b2.js.

   الاستعمال:  node tools/set-topic.mjs < topic.json
   و topic.json فيه: { "id": "03", "ad": "...", "situation": "...", "points": [...], "words": "150–180" }

   كيتحقق أن الموضوع كاين وأن النقط 4، حيت TELC كيعطي ديما 4.
*/

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "assets/schreiben-topics-b2.js";

const input = JSON.parse(readFileSync(0, "utf8"));
const src = readFileSync(FILE, "utf8");

const match = src.match(/^([\s\S]*?const SCHREIBEN_B2_TOPICS = )(\{[\s\S]*\})(;\s*)$/);
if (!match) throw new Error(`ما قدرتش نقرا بنية ${FILE}`);

const [, header, body, tail] = match;
const topics = JSON.parse(body);

const { id, ad, situation, points, words } = input;

if (!topics[id]) throw new Error(`الموضوع ${id} ماكاينش`);
/* الأغلبية عندهم 4 نقط، ولكن شي مواضيع حقيقية عندهم 3
   (بحال 01 و 10). كنرفضو غير اللي برّا هاد المجال. */
if (!Array.isArray(points) || points.length < 3 || points.length > 4) {
  throw new Error(`الموضوع ${id}: خاص 3 ولا 4 نقط، جاو ${points?.length}`);
}

if (ad) topics[id].ad = ad;
if (words) topics[id].words = words;
if (situation) topics[id].situation = situation;
topics[id].points = points;

writeFileSync(
  FILE,
  header + JSON.stringify(topics, null, 2) + tail
);

console.log(`✅ ${id} — ${topics[id].title}`);
