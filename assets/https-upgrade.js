/* ===== http:// → https:// =====

   الـ Worker (Lesen, Schreiben, Hören…) ماكيقبل غير https://.
   إلا تحلات الصفحة بـ http:// كلشي ديال Premium كيتبلوكا.

   ماكنحولوش عمياني: إلا كان الشهادة ديال https ما زال ماوجداتش
   (دومين جديد ف GitHub Pages)، التحويل كيطيح الموقع. إذن كنجربو
   https بصمت، وإلا جاوب كنحولو. وإلا لا، كنبقاو فين حنا. */

(function () {
    "use strict";

    if (location.protocol !== "http:") return;
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return;

    const target = "https://" + location.host + location.pathname + location.search + location.hash;

    fetch("https://" + location.host + "/version.json?probe=" + Date.now(),
          { mode: "no-cors", cache: "no-store" })
        .then(function () { location.replace(target); })
        .catch(function () { /* https ما زال ماخدامش — نبقاو هنا */ });
})();
