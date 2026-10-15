/* كيقسم premium-lesen.json لمفتاح مستقل لكل موضوع.
   كل فيشي كيتلصق ف KV تحت المفتاح:  lesen-<id>
   استعمال:  node tools/split-lesen.mjs                */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";

const SRC = "premium-lesen.json";
const OUT = "premium-lesen-split";

const all = JSON.parse(readFileSync(SRC, "utf8"));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const rows = [];
for (const [id, topic] of Object.entries(all)) {
  const text = JSON.stringify(topic);
  writeFileSync(`${OUT}/lesen-${id}.json`, text + "\n");
  rows.push([ "lesen-" + id, (Buffer.byteLength(text) / 1024).toFixed(1) + " KB" ]);
}

const wide = Math.max(...rows.map((r) => r[0].length));
rows.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
for (const [k, s] of rows) console.log(k.padEnd(wide), s.padStart(9));
console.log(`\n${rows.length} مفتاح ف ${OUT}/ — أكبر واحد ${rows[0][1]}`);
