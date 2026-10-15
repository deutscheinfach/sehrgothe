/* ===== شحال من واحد ف الموقع دابا =====

   كل متصفح (داخل بحساب ولا لا) عندو id عشوائي، وكيكتب كل 5 دقايق
   presence/{id} = { at: وقت السيرفر } — غير ملي الصفحة باينة.
   admin.html كيحسب الوثائق اللي at ديالهم ف آخر 7 دقايق (5 + 2 د ديال
   الهامش) — getCountFromServer: قراية وحدة، ماشي وحدة لكل زائر.

   ⚠ كل كتبة كتحسب ف الخطة المجانية ديال Firestore (20.000 ف النهار).
   كنت كل 90 ثانية = 40 كتبة ف الساعة لكل زائر؛ دابا 12. إلا بدلتي
   BEAT_MS، بدّل النافذة ف liveCount() ديال admin.html (BEAT_MS + 2 د). */
(function () {
    "use strict";
    if (window.__dePresence) return;
    window.__dePresence = true;

    var KEY = "de-presence-id";
    var id = null;
    try { id = localStorage.getItem(KEY); } catch (e) { /* خاص */ }
    if (!id || !/^[a-z0-9]{16,40}$/.test(id)) {
        id = "";
        var abc = "abcdefghijklmnopqrstuvwxyz0123456789";
        var rnd = new Uint8Array(20);
        (window.crypto || {}).getRandomValues ? crypto.getRandomValues(rnd) : rnd.forEach(function (_, i) { rnd[i] = Math.random() * 256; });
        rnd.forEach(function (b) { id += abc[b % abc.length]; });
        try { localStorage.setItem(KEY, id); } catch (e) { /* خاص */ }
    }

    /* من بعد ما يبان المحتوى (assets/diag.js) — Firestore ثقيل */
    (window.__deAfterContent || function (fn) { setTimeout(fn, 2500); })(async function () {
        try {
            var mods = await Promise.all([
                import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
                import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
            ]);
            var appMod = mods[0], fsMod = mods[1];
            var app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp({
                apiKey: "AIzaSyBNxr0ZQrqa2F-RVyfoAC9r7_S49Cb2S4s",
                authDomain: "sehrgothe.firebaseapp.com",
                projectId: "sehrgothe",
                storageBucket: "sehrgothe.firebasestorage.app",
                messagingSenderId: "1066728503518",
                appId: "1:1066728503518:web:b350728d7b20f1064d2a4f"
            });
            var db = fsMod.getFirestore(app);
            var ref = fsMod.doc(db, "presence", id);
            var BEAT_MS = 5 * 60000;
            var last = 0;
            function beat() {
                if (document.visibilityState !== "visible") return;
                /* الـ interval كيجي كل BEAT_MS؛ الحاجز كيمنع غير الرجوع السريع
                   للتبويب (visibilitychange) يكتب كل مرة. */
                if (Date.now() - last < BEAT_MS - 60000) return;
                last = Date.now();
                fsMod.setDoc(ref, { at: fsMod.serverTimestamp() }).catch(function () { /* القواعد ماتنشراتش */ });
            }
            beat();
            setInterval(beat, BEAT_MS);
            document.addEventListener("visibilitychange", beat);
        } catch (e) { /* بلا انترنت */ }
    });
})();
