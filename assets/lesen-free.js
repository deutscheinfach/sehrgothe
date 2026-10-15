/* ===== المواضيع المجانية ديال Lesen (من Cloudflare) =====

   كانو ف assets/lesen-b1-content.js و lesen-b2-content.js — وأي واحد
   كيقدر يحلهم من View source. دابا كيجيو من الـ Worker (GET ?free=lesen-b2)
   ملي كتتحل الصفحة، وكيتحطو ف window.LESEN_B2_CONTENT بحال قبل.

   الاستعمال:  window.__lesenFreeReady("b2").then(...)
               → كيتسالى ملي يوصل المحتوى (ولا ملي يفشل: {} خاوي). */
(function () {
    "use strict";

    const ENDPOINT = "https://deutsch-einfach-correction.soufianemouyr.workers.dev";
    const jobs = {};

    /* الطلب كيتعلق أحيانا (خصوصا Safari ف iPhone من بعد ما يرجع للتطبيق:
       اتصال قديم ميت) — بلا حد كان «كنجيبو التمرين…» كيبقى للأبد.
       إلا ما جاوب السيرفر ف 7 ثواني كنقطعو ونعاودو (اتصال جديد كيجاوب
       دغيا). ملي يبدا يجاوب، كنعطيو للتحميل حتى 25 ثانية (أنترنت ضعيفة). */
    const WAIT_HEAD = [7000, 10000, 15000];
    function load(level, attempt) {
        const ctrl = typeof AbortController === "function" ? new AbortController() : null;
        let timer = ctrl ? setTimeout(function () { ctrl.abort(); }, WAIT_HEAD[attempt]) : 0;
        return fetch(ENDPOINT + "?free=lesen-" + level, { credentials: "omit", signal: ctrl ? ctrl.signal : undefined })
            .then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                clearTimeout(timer);
                if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, 25000);
                return res.json();
            })
            .then(function (data) { clearTimeout(timer); return data; })
            .catch(function (error) {
                clearTimeout(timer);
                if (attempt < WAIT_HEAD.length - 1) {
                    return new Promise(function (go) { setTimeout(go, 400 + attempt * 800); })
                        .then(function () { return load(level, attempt + 1); });
                }
                console.warn("Lesen: المواضيع المجانية ما وصلوش", error);
                if (window.__deDiag) window.__deDiag("fail", "Lesen مجاني ما وصلش (" + level + "): " + (error && error.name === "AbortError" ? "timeout" : (error && error.message || error)));
                return null;
            });
    }

    /* نسخة محفوظة ف المتصفح (Cache Storage): المرة الجاية الموضوع كيبان
       دغيا حتى بلا أنترنت مزيانة، والنسخة الجديدة كتجي من اللور وكتتحفظ
       للمرة اللي من بعد. */
    const STORE = "de-lesen-free-v1";
    const KEEP = 14 * 24 * 3600 * 1000;
    function cacheUrl(lv) { return "https://deutsch-einfach.online/__lesen-free/" + lv; }
    function cacheRead(lv) {
        try {
            if (!window.caches) return Promise.resolve(null);
            return caches.open(STORE).then(function (c) { return c.match(cacheUrl(lv)); }).then(function (res) {
                if (!res) return null;
                const at = Number(res.headers.get("x-saved") || 0);
                if (Date.now() - at > KEEP) return null;
                return res.json();
            }).catch(function () { return null; });
        } catch (e) { return Promise.resolve(null); }
    }
    function cacheWrite(lv, data) {
        try {
            if (!window.caches || !data) return;
            caches.open(STORE).then(function (c) {
                return c.put(cacheUrl(lv), new Response(JSON.stringify(data), {
                    headers: { "Content-Type": "application/json", "x-saved": String(Date.now()) }
                }));
            }).catch(function () { /* المساحة عامرة / وضع خاص: ماشي مشكل */ });
        } catch (e) { /* */ }
    }

    window.__lesenFreeReady = function (level) {
        const lv = String(level || "b2").toLowerCase();
        const key = "LESEN_" + lv.toUpperCase() + "_CONTENT";
        if (window[key] && Object.keys(window[key]).length) return Promise.resolve(window[key]);
        if (!jobs[lv]) {
            const net = load(lv, 0).then(function (data) {
                if (data) cacheWrite(lv, data);
                return data;
            });
            const saved = cacheRead(lv);
            /* اللي وصل الأول: النسخة المحفوظة (إلا كاينة) ولا الأنترنت */
            const first = saved.then(function (old) {
                return old && Object.keys(old).length ? old : net;
            });
            jobs[lv] = first.then(function (data) {
                window[key] = Object.assign(window[key] || {}, data || {});
                if (!data) delete jobs[lv];   /* فشل: المرة الجاية نعاودو */
                return window[key];
            });
            /* الجديد من الأنترنت كيعوض المحفوظ ف الذاكرة (الفتحة الجاية) */
            net.then(function (data) {
                if (data && window[key]) Object.assign(window[key], data);
            });
        }
        return jobs[lv];
    };

    /* موضوع ف الرابط (?thema / ?pruefung): كنجيبو دغيا.
       لائحة المواضيع: ما محتاجاش المحتوى — كنتسناو حتى تبان اللائحة
       (__deAfterContent) باش ما تتزاحمش معاها ف الأنترنت الضعيفة،
       ولا قبل ملي يقرب الطالب يدخل لشي موضوع (يحط الصبع / الفأرة). */
    try {
        const shell = document.querySelector(".lesen-shell");
        const lv = (shell && shell.dataset.level) || (/b1-/.test(location.pathname) ? "b1" : "b2");
        const start = function () { window.__lesenFreeReady(lv); };
        if (/[?&](thema|pruefung)=/.test(location.search) || !window.__deAfterContent) start();
        else {
            window.__deAfterContent(start);
            const early = function () {
                start();
                ["pointerdown", "mouseover", "focusin"].forEach(function (ev) {
                    document.removeEventListener(ev, early, true);
                });
            };
            ["pointerdown", "mouseover", "focusin"].forEach(function (ev) {
                document.addEventListener(ev, early, { capture: true, passive: true, signal: window.__deSignal });
            });
        }
        const link = document.createElement("link");
        link.rel = "preconnect"; link.href = ENDPOINT; link.crossOrigin = "";
        document.head.appendChild(link);
    } catch (error) { /* */ }
})();
