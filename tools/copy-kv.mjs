// ===== نسخ المحتوى المدفوع من KV ديال Deutsch Einfach لـ KV ديال sehrgut =====
//
// المواضيع Premium ماكايناش ف الريبو — كيسكنو ف Cloudflare KV.
// هاد السكريبت كينسخ جميع المفاتيح من namespace لـ namespace آخر
// (بلا مفاتيح region-* ديال الحسابات).
//
//   npx wrangler login
//   node tools/copy-kv.mjs <SOURCE_NAMESPACE_ID> <TARGET_NAMESPACE_ID>
//
// الـIDs كاينين ف Cloudflare → Storage & Databases → KV.
// خاص جوج الـnamespaces يكونو ف نفس الحساب ديال Cloudflare.
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error("usage: node tools/copy-kv.mjs <SOURCE_NAMESPACE_ID> <TARGET_NAMESPACE_ID>");
  process.exit(1);
}

const wrangler = (...args) =>
  execFileSync("npx", ["wrangler", ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

const keys = JSON.parse(wrangler("kv", "key", "list", "--namespace-id", src, "--remote"))
  .map((k) => k.name)
  .filter((name) => !name.startsWith("region-"));
console.log(keys.length + " keys");

const items = keys.map((key, i) => {
  process.stdout.write(`\r${i + 1}/${keys.length} ${key}`.padEnd(70));
  return { key, value: wrangler("kv", "key", "get", key, "--namespace-id", src, "--remote", "--text") };
});
console.log();

/* الملف فيه المحتوى المدفوع: برا الريبو، وكيتمسح من بعد */
const dir = mkdtempSync(join(tmpdir(), "sehrgut-kv-"));
const file = join(dir, "KV-copy.json");
try {
  writeFileSync(file, JSON.stringify(items));
  console.log(wrangler("kv", "bulk", "put", file, "--namespace-id", dst, "--remote"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log("✓ تنسخو " + items.length + " مفتاح.");
