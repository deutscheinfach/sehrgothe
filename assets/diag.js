/* ===== مشاكل الطلبة: كتتسجل بوحدها =====

   ملي كيطيح شي خطأ ف المتصفح ديال الطالب (JavaScript، ملف ما تحملش)
   ولا الكود كيقول «ما وصلناش للموضوع» / «بطا بزاف»، كنصيفطو سطر لـ
   Firestore (diag/{auto}). الأدمين كيشوفهم ف admin.html → «مشاكل الطلبة»
   مجموعين: شنو، فين، شحال من مرة، وشمن متصفح/شاشة.

   كنكتبو بـ REST نيشان (ماشي SDK ديال Firebase): حتى إلا ما تحملش
   Firebase (هادي بوحدها مشكلة كنبغيو نعرفوها)، التقرير كيوصل.

   الاستعمال من الكود:  window.__deDiag("fail" | "slow" | "error", "الرسالة", { ms })
   · ماكثرش من 6 ف الصفحة، وكل رسالة مرة وحدة.
   · غير ف الموقع الحقيقي (ماشي localhost).
   · ما كيتسجلش الإيميل ولا الاسم — غير واش مشترك ولا لا. */
/* ===== من بعد المحتوى =====
   window.__deAfterContent(fn): Firestore (178 KB) وأي حاجة ماشي ضرورية
   كيتسناو حتى يبان المحتوى (Lesen كيصيفط de-content)، ولا 2.5 ثانية من
   بعد load (6 ف صفحات Lesen). ف الأنترنت الضعيفة، المحتوى كياخد الشبكة
   بوحدو. */
(function () {
    "use strict";
    if (window.__deAfterContent) return;
    let open = false;
    const queue = [];
    function release() {
        if (open) return;
        open = true;
        queue.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* */ } });
    }
    document.addEventListener("de-content", function () { setTimeout(release, 300); }, { once: true });
    /* موضوع Lesen محلول (كيتسنى المحتوى من Cloudflare): حتى 6 ث، ولا
       de-content قبل. الصفحات الأخرى: 2.5 ث */
    const waitTopic = /-lesen(-[a-z0-9]+)?\.html$/.test(location.pathname)
        && /[?&](thema|pruefung)=/.test(location.search);
    const later = function () { setTimeout(release, waitTopic ? 6000 : 2500); };
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
    window.__deAfterContent = function (fn) {
        if (open) fn(); else queue.push(fn);
    };
    window.__deAfterContent.now = release;
})();

(function () {
    "use strict";
    if (window.__deDiag) return;

    const LIVE = location.hostname === "deutscheinfach.github.io" && location.pathname.indexOf("/sehrgothe/") === 0;
    const URL = "https://firestore.googleapis.com/v1/projects/sehrgothe/databases/(default)/documents/diag"
        + "?key=AIzaSyBNxr0ZQrqa2F-RVyfoAC9r7_S49Cb2S4s";
    const MAX = 6;
    const sent = new Set();
    let count = 0;

    function cut(v, n) { return String(v == null ? "" : v).slice(0, n); }

    function send(type, msg, extra) {
        try {
            const text = cut(msg, 400);
            const sig = type + "|" + text;
            if (!text || sent.has(sig) || count >= MAX) return;
            /* بلا أنترنت: «ما وصلش» / «بطا» عاديين. الباقي كيتخبا ويتصيفط ملي يرجع */
            if (navigator.onLine === false && (type === "fail" || type === "slow")) return;
            if (navigator.onLine === false) {
                try {
                    const q = JSON.parse(localStorage.getItem("de-diag-queue") || "[]");
                    if (q.length < 6) q.push([type, text, Date.now()]);
                    localStorage.setItem("de-diag-queue", JSON.stringify(q));
                } catch (e) { /* */ }
                return;
            }
            sent.add(sig);
            count++;
            if (!LIVE) { console.info("[diag]", type, text); return; }
            const ms = extra && typeof extra.ms === "number" ? extra.ms : (window.performance ? performance.now() : 0);
            const conn = navigator.connection || {};
            const fields = {
                type:    { stringValue: cut(type, 20) },
                msg:     { stringValue: text },
                page:    { stringValue: cut(location.pathname + location.search, 200) },
                ua:      { stringValue: cut(navigator.userAgent, 250) },
                vw:      { integerValue: String(window.innerWidth || 0) },
                vh:      { integerValue: String(window.innerHeight || 0) },
                dpr:     { doubleValue: window.devicePixelRatio || 1 },
                ms:      { integerValue: String(Math.round(ms)) },
                net:     { stringValue: cut(conn.effectiveType || "", 10) },
                premium: { booleanValue: window.__sehrgutIsPremium === true },
                at:      { timestampValue: new Date().toISOString() }
            };
            fetch(URL, {
                method: "POST",
                keepalive: true,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fields: fields })
            }).catch(function () { /* ما كاين ما نديرو */ });
        } catch (e) { /* التقرير ما خاصوش يطيح الصفحة */ }
    }
    window.__deDiag = send;

    /* التقارير اللي تخباو بلا أنترنت */
    function flush() {
        if (navigator.onLine === false) return;
        let q = [];
        try { q = JSON.parse(localStorage.getItem("de-diag-queue") || "[]"); localStorage.removeItem("de-diag-queue"); } catch (e) { return; }
        q.forEach(function (it) { send(it[0], "(بلا أنترنت) " + it[1]); });
    }
    window.addEventListener("online", flush);
    setTimeout(flush, 4000);

    /* أخطاء ماشي ديالنا: إضافات المتصفح، والـ ResizeObserver (عادي) */
    function noise(text, file) {
        return /^(chrome|moz|safari|ms-browser)-extension:/.test(file || "")
            || /ResizeObserver loop|Script error\.?$/.test(text || "")
            /* كود كيزيدو التطبيق اللي محلول فيه الموقع (Instagram / Facebook ف iPhone) */
            || /_AutofillCallbackHandler|webkit\.messageHandlers|__gCrWeb/.test(text || "")
            /* إضافات ومتصفحات ف iPhone (محافظ crypto، Firefox iOS، Dark Reader) */
            || /window\.ethereum|selectedAddress|__firefox__|DarkReader/.test(text || "")
            /* Firebase Auth: الأنترنت تقطعات ولا التبويب تسد — كيعاود بوحدو */
            || /Database is closing|auth\/network-request-failed/.test(text || "");
    }

    window.addEventListener("error", function (e) {
        const t = e.target;
        /* ملف ما تحملش (script / css / صورة) */
        if (t && t !== window && (t.src || t.href)) {
            const url = t.src || t.href;
            /* غير الملفات ديالنا و Firebase — الإحصائيات (Cloudflare Insights…)
               كيبلوكيوها مانعي الإعلانات، وماشي مشكل */
            let host = "";
            try { host = new URL(url, location.href).hostname; } catch (err) { return; }
            if (host !== location.hostname && host !== "www.gstatic.com") return;
            send("load", "ما تحملش: " + url.replace(/\?v=[0-9a-f]+/, ""));
            return;
        }
        if (noise(e.message, e.filename)) return;
        /* كود ماشي ديالنا: المتصفح ولا التطبيق كيزيد سكريبت ف الصفحة
           (navigation_performance_logger_android…) — غير الملفات ديال
           الموقع و Firebase كيتسجلو (inline: الرابط ديال الصفحة) */
        if (e.filename && e.filename.indexOf(location.origin) !== 0
            && e.filename.indexOf("https://www.gstatic.com/") !== 0) return;
        const where = (e.filename || "").split("/").pop().replace(/\?v=[0-9a-f]+/, "");
        send("error", (e.message || "Error") + (where ? " @ " + where + ":" + e.lineno : ""));
    }, true);

    /* أول سطر ف الـ stack فيه رابط: فين طاح الخطأ (ملف:سطر) */
    function where(stack) {
        const m = String(stack || "").match(/((?:https?|chrome-extension|moz-extension|safari-(?:web-)?extension):\/\/[^\s)]+?):(\d+)(?::\d+)?\)?\s*$/m)
            || String(stack || "").match(/((?:https?|chrome-extension|moz-extension|safari-(?:web-)?extension):\/\/[^\s)]+?):(\d+)/);
        return m ? { file: m[1], line: m[2] } : null;
    }
    /* انتقال الصفحات (View Transitions) تقطع ولا تخطى: الصفحة كتبان عادي */
    function skippedTransition(text) {
        return /Transition was (skipped|aborted)|ViewTransition/i.test(text || "");
    }

    window.addEventListener("unhandledrejection", function (e) {
        const r = e.reason;
        const text = r && (r.message || r.code) ? (r.code ? r.code + " " : "") + (r.message || "") : String(r);
        if (skippedTransition(text)) return;
        const at = where(r && r.stack);
        if (noise(text, at && at.file)) return;
        /* Firestore كيقطع طلب ديالو (الصفحة تخبات، تبدلت، ولا الاتصال تقطع):
           AbortError داخل المكتبة — كيعاود بوحدو، والطالب ما كيشوف والو */
        if (r && r.name === "AbortError" && at && /gstatic\.com\/firebasejs\//.test(at.file)) return;
        /* AbortError بلا حتى سطر ف الـ stack: طلب تقطع (الصفحة تبدلات / الأنترنت) */
        if (r && r.name === "AbortError" && !at) return;
        const file = at ? at.file.split("/").pop().replace(/\?v=[0-9a-f]+/, "") : "";
        send("error", "Promise: " + text + (file ? " @ " + file + ":" + at.line : ""));
    });

    /* الانتقال بين الصفحات (@view-transition): إلا تخطاه المتصفح (برك بزربة،
       الصفحة الجاية ما فيهاش نفس القاعدة…) الـ promises ديالو كيترفضو بلا
       ما يشدهم حد. كنشدوهم هنا. */
    function quietVT(e) {
        const vt = e && e.viewTransition;
        if (!vt) return;
        const q = function () {};
        try { vt.ready.catch(q); vt.updateCallbackDone.catch(q); vt.finished.catch(q); } catch (err) { /* */ }
        /* زر الرجوع / القدام: بلا حركة بين الصفحات (كانت كتبان بحال
           إلا الصفحة كتعلق وكترجع) */
        try {
            const act = e.type === "pageswap" ? e.activation
                : (window.navigation && window.navigation.activation);
            if (act && act.navigationType === "traverse") vt.skipTransition();
        } catch (err) { /* */ }
    }
    window.addEventListener("pagereveal", quietVT);
    window.addEventListener("pageswap", quietVT);
})();

/* ===== الأنترنت ضعيفة ولا مقطوعة: نقولوها للطالب =====
   · window.__deNetHint(node): «كنجيبو…» باقي باين من بعد 6 ثواني →
     كنبدلوه ببطاقة: أيقونة + عنوان + شرح قصير، وزر «عاود المحاولة»
     (دغيا إلا الأنترنت مقطوعة، ولا من بعد 20 ثانية).
   · تقطع الأنترنت ف أي صفحة → بار صغير لتحت، وكيتبدل ملي ترجع. */
(function () {
    "use strict";
    if (window.__deNetHint) return;

    function offline() { return navigator.onLine === false; }

    const SVG = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const ICON_OFF  = '<svg ' + SVG + '><path d="M2 2l20 20"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.8"/><path d="M19 12.9a10 10 0 0 0-2.3-1.6"/><path d="M2 8.8a15 15 0 0 1 4.2-2.7"/><path d="M22 8.8A15 15 0 0 0 11 4.9"/><path d="M12 20h.01"/></svg>';
    const ICON_SLOW = '<svg ' + SVG + '><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8" opacity=".35"/><path d="M17 20V8" opacity=".35"/><path d="M22 4v16" opacity=".35"/></svg>';
    const ICON_AGAIN = '<svg ' + SVG + '><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>';

    const TEXT = {
        off:  { title: "ماكاينش اتصال بالأنترنت",
                lead: "تأكد من الويفي ولا الأنترنت ديال التيليفون، ومن بعد برك على «عاود المحاولة»." },
        slow: { title: "الاتصال ديالك ضعيف",
                lead: "التمرين كيتحمل — غادي ياخد شوية ديال الوقت. خليك ف الصفحة." }
    };

    let styled = false;
    function css() {
        if (styled) return;
        styled = true;
        const st = document.createElement("style");
        st.textContent =
            ".de-net{display:flex;flex-direction:column;align-items:center;gap:8px;padding:6px 4px;text-align:center;direction:rtl}" +
            ".de-net-ico{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;" +
            "background:rgba(179,14,48,.1);color:#b30e30}" +
            ".de-net.is-slow .de-net-ico{background:rgba(224,168,0,.16);color:#b7860b}" +
            ".de-net-ico svg{width:26px;height:26px}" +
            ".de-net-title{margin:4px 0 0;font-size:17px;font-weight:800;line-height:1.4;color:inherit;opacity:1}" +
            ".de-net-lead{margin:0;max-width:360px;font-size:14px;font-weight:600;line-height:1.7;opacity:.75}" +
            ".de-net-btn{display:inline-flex;align-items:center;gap:8px;margin-top:6px;padding:10px 22px;border:0;border-radius:999px;" +
            "background:#ffce00;color:#2a0710;font:inherit;font-size:15px;font-weight:800;cursor:pointer;" +
            "box-shadow:0 8px 20px -10px rgba(224,168,0,.9)}" +
            ".de-net-btn svg{width:18px;height:18px}" +
            ".de-net-btn:hover{filter:brightness(1.05)}" +
            ":root[data-theme=dark] .de-net-ico,html.dark .de-net-ico{background:rgba(255,120,140,.14);color:#ff8a9c}" +
            ":root[data-theme=dark] .de-net.is-slow .de-net-ico,html.dark .de-net.is-slow .de-net-ico{background:rgba(255,206,0,.14);color:#ffce00}" +
            ".de-netbar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;" +
            "display:flex;align-items:center;gap:10px;max-width:calc(100% - 32px);padding:10px 18px;border-radius:14px;" +
            "background:#2a0710;color:#fff;font-family:inherit;font-size:14px;font-weight:700;line-height:1.5;direction:rtl;" +
            "border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 32px rgba(0,0,0,.35)}" +
            ".de-netbar svg{width:20px;height:20px;flex:none}" +
            ".de-netbar.is-good{background:#1e7d3a}";
        document.head.appendChild(st);
    }

    window.__deNetHint = function (node) {
        if (!node) return;
        const start = node.textContent;
        let card = null, btn = null;
        /* العنصر نفسو يقدر يتعمر بالمحتوى (Schreiben): غير إلا باقي كيتسنى */
        function waiting() {
            return node.isConnected && (card ? node.contains(card) : node.textContent.indexOf(start) === 0);
        }
        function button() {
            if (btn || !card) return;
            btn = document.createElement("button");
            btn.type = "button";
            btn.className = "de-net-btn";
            btn.innerHTML = ICON_AGAIN + "<span>عاود المحاولة</span>";
            btn.addEventListener("click", function () { location.reload(); });
            card.appendChild(btn);
        }
        function paint() {
            if (!card) return;
            if (!waiting()) {
                window.removeEventListener("offline", paint);
                window.removeEventListener("online", paint);
                return;
            }
            const off = offline();
            const t = off ? TEXT.off : TEXT.slow;
            card.classList.toggle("is-slow", !off);
            card.querySelector(".de-net-ico").innerHTML = off ? ICON_OFF : ICON_SLOW;
            card.querySelector(".de-net-title").textContent = t.title;
            card.querySelector(".de-net-lead").textContent = t.lead;
            if (off) button();
        }
        setTimeout(function () {
            if (!waiting()) return;
            css();
            card = document.createElement("div");
            card.className = "de-net";
            card.setAttribute("role", "status");
            card.innerHTML = '<span class="de-net-ico"></span><p class="de-net-title"></p><p class="de-net-lead"></p>';
            node.textContent = "";
            node.appendChild(card);
            paint();
            window.addEventListener("offline", paint);
            window.addEventListener("online", paint);
        }, 6000);
        setTimeout(function () { if (waiting()) button(); }, 20000);
    };

    let bar = null, hideTimer = 0;
    function show(off) {
        clearTimeout(hideTimer);
        if (!document.body) return;
        css();
        if (!bar) {
            bar = document.createElement("div");
            bar.className = "de-netbar";
            bar.setAttribute("role", "status");
        }
        bar.classList.toggle("is-good", !off);
        bar.innerHTML = off
            ? ICON_OFF + "<span>تقطع الاتصال بالأنترنت</span>"
            : '<svg ' + SVG + '><path d="M20 6L9 17l-5-5"/></svg><span>رجع الاتصال</span>';
        if (!bar.isConnected) document.body.appendChild(bar);
        if (!off) hideTimer = setTimeout(function () { if (bar) bar.remove(); }, 2500);
    }
    window.addEventListener("offline", function () { show(true); });
    window.addEventListener("online", function () { if (bar && bar.isConnected) show(false); });
    if (offline()) {
        if (document.body) show(true);
        else document.addEventListener("DOMContentLoaded", function () { if (offline()) show(true); });
    }
})();

/* ===== زر الرجوع: نفس البلاصة ف الصفحة =====
   ملي المتصفح ما كيخليش الصفحة ف الكاش ديال الرجوع (bfcache) كيعاود
   يحملها، وكيحاول يرجع للبلاصة القديمة قبل ما يترسم المحتوى (اللوائح
   كتترسم بالـ JS) → كتبان لفوق. كنحفظو البلاصة ملي الطالب كيخرج،
   وملي يرجع كنرجعوه ليها (إلا ما تحركش هو). */
(function () {
    "use strict";
    try {
        /* الرجوع داخل نفس الصفحة (لائحة ↔ موضوع، Lesen ↔ Hören بالراوتر):
           حنا اللي كنرجعو البلاصة (deY ف history.state). المتصفح كان
           كيحاول هو تاني قبل ما تترسم اللائحة → كتبان كتطلع وكتنزل. */
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        const KEY = "de-y:" + location.pathname + location.search;
        window.addEventListener("pagehide", function () {
            try { sessionStorage.setItem("de-y:" + location.pathname + location.search, String(Math.round(window.scrollY))); } catch (e) { /* */ }
        });
        const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
        if (!nav || nav.type !== "back_forward") return;
        const want = Number(sessionStorage.getItem(KEY) || 0);
        if (!want) return;
        let moved = false;
        ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
            window.addEventListener(ev, function () { moved = true; }, { once: true, passive: true });
        });
        const fix = function () {
            if (moved) return;
            const root = document.documentElement;
            if (Math.abs(window.scrollY - want) > 40 && root.scrollHeight >= want + window.innerHeight * 0.5) {
                window.scrollTo(0, want);
            }
        };
        [150, 500, 1200, 2500].forEach(function (t) { setTimeout(fix, t); });
    } catch (e) { /* ماشي ضروري */ }
})();

/* ===== المحتوى المدفوع ف التيليفون (بلا أنترنت) =====
   window.__deStore.put(key, data) / get(key) → Promise
   Cache Storage (ماشي localStorage: 5 MB ما كيكفيوش لكاع المواضيع).
   المفتاح مربوط بالحساب (uid): حساب آخر ف نفس التيليفون ما كيشوفش
   المحتوى ديال الأول. كيتستعمل ملي الـ Worker ما كيجاوبش (بلا wifi). */
(function () {
    "use strict";
    if (window.__deStore) return;
    const NAME = "de-data-v1";
    function uid() {
        try {
            const auth = window.__sehrgutAuth;
            if (auth && auth.currentUser) return auth.currentUser.uid;
            const a = JSON.parse(localStorage.getItem("sehrgutLastAccount") || "null");
            return a && a.uid ? a.uid : "";
        } catch (e) { return ""; }
    }
    function url(key) {
        const u = uid();
        return u ? location.origin + "/__data/" + encodeURIComponent(u) + "/" + encodeURIComponent(key) : "";
    }
    window.__deStore = {
        put: function (key, data) {
            try {
                const at = url(key);
                if (!at || !window.caches || data == null) return Promise.resolve(false);
                return caches.open(NAME).then(function (c) {
                    return c.put(at, new Response(JSON.stringify(data), {
                        headers: { "Content-Type": "application/json", "x-saved": String(Date.now()) }
                    }));
                }).then(function () { return true; }, function () { return false; });
            } catch (e) { return Promise.resolve(false); }
        },
        get: function (key) {
            try {
                const at = url(key);
                if (!at || !window.caches) return Promise.resolve(null);
                /* بلا تصريح صالح (الاشتراك سالا / بزاف بلا أنترنت): والو */
                if (window.__deOfflinePass && !window.__deOfflinePass.ok(uid())) return Promise.resolve(null);
                return caches.open(NAME).then(function (c) { return c.match(at); })
                    .then(function (res) { return res ? res.json() : null; })
                    .catch(function () { return null; });
            } catch (e) { return Promise.resolve(null); }
        },
        has: function (key) {
            try {
                const at = url(key);
                if (!at || !window.caches) return Promise.resolve(false);
                return caches.open(NAME).then(function (c) { return c.match(at); })
                    .then(function (res) { return !!res; }, function () { return false; });
            } catch (e) { return Promise.resolve(false); }
        }
    };
})();

/* ===== بلا أنترنت: حتى لإمتى المشترك يقدر يخدم =====
   ملي كيتأكد الموقع من الاشتراك (أونلاين، site-header.js) كيكتب «تصريح»:
   صالح حتى لنهاية الاشتراك (subscriptionEnd) ولا 7 أيام — اللي جا الأول.
   بلا أنترنت: Premium غير إلا التصريح باقي صالح. من بعد خاصو يدخل
   للأنترنت مرة باش يتجدد (وإلا سالا الاشتراك → المحتوى كيتقفل ويتمسح).
   الساعة ديال التيليفون رجعات لور (باش يطول المدة)؟ التصريح كيسقط. */
(function () {
    "use strict";
    if (window.__deOfflinePass) return;
    const KEY = "de-offline-pass";
    const MAX = 7 * 24 * 3600 * 1000;
    const SLACK = 10 * 60 * 1000;
    function read() {
        try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
    }
    function write(v) {
        try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) { /* */ }
    }
    window.__deOfflinePass = {
        /* أونلاين، الاشتراك صالح: end = نهاية الاشتراك (ms) ولا 0 إلا ماكايناش */
        grant: function (uid, end) {
            const now = Date.now();
            const until = Math.min(end > 0 ? end : Infinity, now + MAX);
            write({ uid: uid, until: until, seen: now });
        },
        /* أونلاين، ماشي مشترك (سالا ولا توقف): كنمسحو كلشي ديالو من التيليفون */
        revoke: function (uid) {
            write(null);
            try {
                Object.keys(localStorage).forEach(function (k) {
                    if (/^de-(lp|sp):/.test(k) && (!uid || k.indexOf(":" + uid + "|") !== -1)) localStorage.removeItem(k);
                });
            } catch (e) { /* */ }
            try {
                if (window.caches) caches.open("de-data-v1").then(function (c) {
                    return c.keys().then(function (reqs) {
                        reqs.forEach(function (r) {
                            if (!uid || r.url.indexOf("/__data/" + encodeURIComponent(uid) + "/") !== -1) c.delete(r);
                        });
                    });
                });
            } catch (e) { /* */ }
        },
        /* علاش ماشي صالح (للتقرير) */
        why: function (uid) {
            const p = read();
            if (!p) return "ما كاينش تصريح";
            if (p.uid !== uid) return "تصريح ديال حساب آخر";
            if (Date.now() + SLACK < p.seen) return "الساعة رجعات لور";
            if (Date.now() >= p.until) return "سالا" + (p.grace ? " (مهلة)" : "");
            return "صالح";
        },
        ok: function (uid) {
            let p = read();
            if (!uid) return false;
            /* ما كاينش تصريح لهاد الحساب (ما زال ما تأكدناش أونلاين من بعد
               هاد التحديث، ولا قطع الأنترنت قبل ما يجاوب Firebase): آخر حالة
               معروفة كانت Premium → مهلة 3 أيام، مرة وحدة. المحتوى المحفوظ
               ف التيليفون ما تجابش غير ملي كان الاشتراك صالح (الـ Worker). */
            if (!p || p.uid !== uid) {
                let last = null;
                try { last = JSON.parse(localStorage.getItem("sehrgutLastAccount") || "null"); } catch (e) { /* */ }
                let used = false;
                try { used = localStorage.getItem(KEY + "-grace") === uid; } catch (e) { /* */ }
                if (!last || last.uid !== uid || last.premium !== true || used) return false;
                const now0 = Date.now();
                p = { uid: uid, until: now0 + 3 * 24 * 3600 * 1000, seen: now0, grace: true };
                write(p);
                try { localStorage.setItem(KEY + "-grace", uid); } catch (e) { /* */ }
            }
            const now = Date.now();
            if (now + SLACK < p.seen) { write(null); return false; }   /* الساعة رجعات لور */
            if (now >= p.until) return false;
            if (now > p.seen) { p.seen = now; write(p); }
            return true;
        }
    };
})();

/* ===== بلا «كنجيبو…»: هيكل رمادي ف بلاصة المحتوى =====
   window.__deSkeleton(kind) → عنصر فيه سطور رمادية كتلمع شوية (بحال
   Zertify / YouTube) — الطالب كيشوف شكل الصفحة دغيا، بلا كلام.
   kind: "topic" (تمرين) · "text" (فقرة). */
(function () {
    "use strict";
    if (window.__deSkeleton) return;
    let styled = false;
    function css() {
        if (styled) return;
        styled = true;
        const st = document.createElement("style");
        st.textContent =
            ".de-skel{display:flex;flex-direction:column;gap:12px;padding:6px 0;direction:ltr}" +
            ".de-skel i{display:block;height:14px;border-radius:8px;" +
            "background:linear-gradient(90deg,rgba(128,128,128,.13) 25%,rgba(128,128,128,.24) 37%,rgba(128,128,128,.13) 63%);" +
            "background-size:400% 100%;animation:de-skel 1.3s ease infinite}" +
            ".de-skel i.h{height:26px;width:45%;margin-bottom:6px}" +
            ".de-skel i.b{height:54px;border-radius:12px}" +
            ".de-skel i.s{width:62%}.de-skel i.m{width:84%}" +
            "@keyframes de-skel{0%{background-position:100% 50%}100%{background-position:0 50%}}" +
            "@media (prefers-reduced-motion:reduce){.de-skel i{animation:none}}";
        document.head.appendChild(st);
    }
    window.__deSkeleton = function (kind) {
        css();
        const box = document.createElement("div");
        box.className = "de-skel";
        box.setAttribute("aria-busy", "true");
        box.setAttribute("aria-label", "…");
        const rows = kind === "text" ? ["m", "", "s", "m", ""] : ["h", "m", "", "s", "b", "b", "b"];
        rows.forEach(function (c) { const i = document.createElement("i"); if (c) i.className = c; box.appendChild(i); });
        return box;
    };
})();

/* ===== المواضيع اللي ماكاينش المحتوى ديالهم (KV 404 / مكسور) =====
   كيتعلمو ملي كيتجابو (lesen-premium.js، التحضير بلا أنترنت ف
   app-install.js) وكيتخباو من اللوائح — بلا «كنوجدوه». كيتعاود
   الفحص من بعد 3 أيام (ولا ملي يجي المحتوى). */
(function () {
    "use strict";
    if (window.__deMissing) return;
    const KEY = "de-missing";
    const TTL = 3 * 24 * 3600 * 1000;
    function read() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
    function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* */ } }
    window.__deMissing = {
        add: function (id) { const v = read(); v[id] = Date.now(); write(v); },
        del: function (id) { const v = read(); if (v[id]) { delete v[id]; write(v); } },
        has: function (id) { const t = read()[id]; return !!t && Date.now() - t < TTL; }
    };
})();
