/* ===== جلب مواضيع Lesen ديال Premium =====

   النصوص المدفوعة ماكايناش ف assets/lesen-b2-content.js — الـ repo
   عام. كيسكنو ف Cloudflare KV، والـ Worker ماكيعطيهمش حتى يتحقق
   من الـ ID token ديال Firebase ومن الاشتراك.

   يعني: حتى لو حل واحد DevTools، ماغايلقى حتى نص. اللي كيقرر هو
   الحساب ديالو، ماشي الواجهة.

   الاستعمال:  await window.__lesenPremiumFetch("insel")
               → المحتوى، ولا null إلا ماكانش مشترك.
               window.__lesenPremiumWarm("insel")
               → كيبدا الجلب من قبل ما يبرك (hover / لمسة).

   السرعة:
   · الجواب كيتحفظ ف window.__lesenPremiumState، ماشي ف السكريبت: الراوتر
     كيعاود تنفيذ السكريبتات مع كل تبديل ديال القسم، وكان كل مرة يضيع
     الكاش ونعاودو الطلب.
   · طلبين لنفس الموضوع ف نفس الوقت = طلب واحد.
   · الطلب text/plain، ماشي application/json: هادا "طلب بسيط" عند
     المتصفح، بلا preflight (OPTIONS) — رحلة كاملة أقل. الـ Worker كيقرا
     الجسم بـ request.json() ومايهمّوش الـ Content-Type.
   · الكاش مربوط بالحساب (uid): واحد خرج وآخر دخل ما كيتقاسموش النصوص.
   · 404 كيتحفظ 60 ثانية: الاحتياطي (lesen-<id>-<part>) ماكيبقاش كيضرب
     الـ Worker ف كل فتحة. */

(function () {
    "use strict";

    const ENDPOINT = "https://sehrgut-api.YOUR-SUBDOMAIN.workers.dev";
    const TIMEOUT_MS = 20000;
    const MISS_MS = 60000;

    const state = window.__lesenPremiumState || (window.__lesenPremiumState = {
        done: new Map(),   /* uid|id → result ناجح */
        miss: new Map(),   /* uid|id → { result, until } ديال 404 */
        busy: new Map()    /* uid|id → Promise ديال طلب خدام */
    });

    /* فتح الاتصال (DNS + TLS) قبل أول طلب. مرة وحدة ف الصفحة. */
    function preconnect() {
        try {
            if (document.head.querySelector('link[rel="preconnect"][href="' + ENDPOINT + '"]')) return;
            const link = document.createElement("link");
            link.rel = "preconnect";
            link.href = ENDPOINT;
            link.crossOrigin = "";
            document.head.appendChild(link);
        } catch (error) { /* غير تسريع */ }
    }
    preconnect();

    /* ===== كاش ف المتصفح (localStorage) =====
       قبل، كل refresh كان كيعاود يسول الـ Worker — ومن قبل كيتسنى Firebase
       يعرف الحساب (2-3 ثواني). دابا الموضوع اللي تجاب مرة كيبقى عند
       المشترك 3 أيام، مربوط بالحساب ديالو (uid)، وكيبان دغيا ملي يرجع.
       غير المشترك (حسب آخر حالة معروفة) اللي كيقرا منو. */
    const DISK = "de-lp:";
    const DISK_TTL = 3 * 24 * 3600 * 1000;
    function lastUid() {
        try {
            const a = JSON.parse(localStorage.getItem("sehrgutLastAccount") || "null");
            return a && a.premium === true && a.uid ? a.uid : "";
        } catch (e) { return ""; }
    }
    function diskGet(uid, id) {
        if (!uid) return null;
        /* بلا أنترنت والتصريح سالا (الاشتراك سالا / 7 أيام بلا أنترنت): والو */
        if (navigator.onLine === false && window.__deOfflinePass && !window.__deOfflinePass.ok(uid)) return null;
        try {
            const v = JSON.parse(localStorage.getItem(DISK + uid + "|" + id) || "null");
            if (v && v.data && Date.now() - v.t < DISK_TTL) return { ok: true, data: v.data };
        } catch (e) { /* */ }
        return null;
    }
    function diskSet(uid, id, data) {
        const key = DISK + uid + "|" + id;
        const value = JSON.stringify({ t: Date.now(), data: data });
        for (let tries = 0; tries < 3; tries++) {
            try { localStorage.setItem(key, value); return; } catch (e) { diskTrim(); }
        }
    }
    /* المساحة تعمرات: كنمسحو القدام (ولا ديال حساب آخر) */
    function diskTrim() {
        try {
            const rows = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf(DISK) === 0) {
                    let t = 0;
                    try { t = JSON.parse(localStorage.getItem(k)).t || 0; } catch (e) { /* */ }
                    rows.push({ k: k, t: t });
                }
            }
            rows.sort(function (a, b) { return a.t - b.t; });
            rows.slice(0, Math.max(5, Math.ceil(rows.length / 3))).forEach(function (r) { localStorage.removeItem(r.k); });
        } catch (e) { /* */ }
    }
    /* خرج من الحساب ولا ماشي مشترك: ما نخليوش النصوص ف المتصفح */
    function diskClear() {
        try {
            const drop = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf(DISK) === 0) drop.push(k);
            }
            drop.forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) { /* */ }
    }
    document.addEventListener("de-premium", function (e) {
        if (e.detail === false && window.__dePremiumState === "ok") diskClear();
    });

    function currentUser() {
        /* site-header.js عندو Firebase محمّل — كناخدو منو */
        const auth = window.__sehrgutAuth;
        if (auth && auth.currentUser) return auth.currentUser;
        /* داخل «اختبر نفسك» / Modelltest (iframe): الصفحة الأم ديجا عارفة
           الحساب — Firebase ديال الـiframe كيتعطل ومايلحقش. */
        try {
            const up = window.parent !== window && window.parent.__sehrgutAuth;
            return (up && up.currentUser) || null;
        } catch (error) {
            return null;
        }
    }

    async function idToken(user) {
        try {
            return await user.getIdToken();
        } catch (error) {
            return null;
        }
    }

    /* شنو معناه كل كود — باش الصفحة تقدر تقول للمستعمل فين المشكل
       بدل ما تبقى ساكتة وتوري القفل. */
    const WHY = {
        400: "الـ Worker ف Cloudflare ما زال قديم — ماكيعرفش Lesen. " +
             "خاصك تدفع cloudflare-worker.js الجديد وتدير Deploy.",
        401: "الـ Worker ما قبلش الحساب. جرب تخرج وتعاود تدخل.",
        403: "الـ Worker شاف الحساب ولكن ماشي مشترك. " +
             "ف Firestore خاص subscriptionActive يكون true بنوع boolean ماشي نص.",
        404: "الـ Worker خدام، ولكن ماكاينش المفتاح premium-lesen ف KV " +
             "— ولا كاين وماكاينش فيه هاد الموضوع.",
        500: "خطأ ف الـ Worker."
    };

    /* طلب واحد للـ Worker. غلطة شبكة ولا 502/503/504 (Firestore تعطل
       لحظة): محاولة ثانية وحدة، قبل ما نقولو للمستعمل شي حاجة. */
    async function ask(themaId, token) {
        for (let attempt = 0; ; attempt++) {
            const guard = typeof AbortController === "function" ? new AbortController() : null;
            const timer = guard ? setTimeout(function () { guard.abort(); }, TIMEOUT_MS) : 0;
            try {
                const response = await fetch(ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=UTF-8" },
                    body: JSON.stringify({ lesenId: themaId, idToken: token }),
                    signal: guard ? guard.signal : undefined
                });

                if (response.ok) return { ok: true, data: await response.json() };

                if (attempt === 0 && (response.status === 502 || response.status === 503 || response.status === 504)) {
                    await new Promise(function (go) { setTimeout(go, 400); });
                    continue;
                }
                /* السبب اللي رجع الـ Worker (bad_json + المفتاح، sprechen_key_missing…)
                   كيمشي لـ «مشاكل الطلبة» باش نعرفو شنو نصلحو ف KV */
                let code = "";
                try {
                    const body = await response.json();
                    code = [body.error, body.details].filter(Boolean).join(" — ").slice(0, 220);
                } catch (e) { /* */ }
                return {
                    ok: false,
                    status: response.status,
                    why: (WHY[response.status] || ("الـ Worker رجع HTTP " + response.status))
                        + (code ? " (" + code + ")" : "")
                };
            } catch (error) {
                if (attempt === 0 && !(guard && guard.signal.aborted)) {
                    await new Promise(function (go) { setTimeout(go, 400); });
                    continue;
                }
                /* الـ Worker ماكيقبل غير https://. إلا تحلات الصفحة بـ http://
                   المتصفح كيبلوكي الجواب (CORS) وكيبان بحال إلا ماكاينش أنترنت. */
                return {
                    ok: false,
                    why: guard && guard.signal.aborted
                        ? "الـ Worker تأخر بزاف. عاود المحاولة."
                        : location.protocol === "http:"
                            ? "الصفحة محلولة بـ http:// والـ Worker ماكيقبل غير https://. " +
                              "حلها بـ https://" + location.host + " — " +
                              "ولا فعّل Enforce HTTPS ف GitHub Pages."
                            : "ما وصلناش للـ Worker. شوف الأنترنت، ولا مانع الإعلانات."
                };
            } finally {
                clearTimeout(timer);
            }
        }
    }

    /* Firebase كيرجّع الحساب من بعد شوية. إلا الاشتراك معروف (من الكاش)
       ولا احنا داخل «اختبر نفسك»، كنتسناو الحساب حتى 10 ثواني بدل ما
       نقولو «ماشي داخل بحساب» ف اللحظة. */
    function waitUser(ms) {
        return new Promise(function (done) {
            const end = Date.now() + ms;
            (function poll() {
                const user = currentUser();
                if (user || Date.now() > end) return done(user);
                setTimeout(poll, 200);
            })();
        });
    }

    window.__lesenPremiumFetch = function (themaId) {
        const user = currentUser();
        /* الكاش ديال المتصفح: ف اللحظة، بلا ما نتسناو Firebase */
        const uid = user ? user.uid : (window.__sehrgutIsPremium ? lastUid() : "");
        const saved = diskGet(uid, themaId);
        if (saved) {
            state.done.set(uid + "|" + themaId, saved);
            return Promise.resolve(saved);
        }
        if (!user && (window.__sehrgutIsPremium || window.parent !== window)) {
            return waitUser(10000).then(function (late) {
                return late ? window.__lesenPremiumFetch(themaId) : { ok: false, why: "ماشي داخل بحساب." };
            });
        }
        if (!user) {
            /* خرج من الحساب: ما نخليوش نصوص المشترك ف الذاكرة */
            state.done.clear();
            state.miss.clear();
            return Promise.resolve({ ok: false, why: "ماشي داخل بحساب." });
        }

        const key = user.uid + "|" + themaId;

        if (state.done.has(key)) return Promise.resolve(state.done.get(key));

        const miss = state.miss.get(key);
        if (miss && miss.until > Date.now()) return Promise.resolve(miss.result);

        const running = state.busy.get(key);
        if (running) return running;

        /* بلا أنترنت: النسخة المحفوظة ف التيليفون (__deStore، diag.js) */
        const stored = function () {
            return window.__deStore ? window.__deStore.get("l:" + themaId) : Promise.resolve(null);
        };

        const job = (async function () {
            if (navigator.onLine === false) {
                const off = await stored();
                if (off) return { ok: true, data: off, offline: true };
            }
            const token = await idToken(user);
            if (!token) {
                const off = await stored();
                return off ? { ok: true, data: off, offline: true } : { ok: false, why: "ماشي داخل بحساب." };
            }

            /* الـ Worker طاح ف هاد المفتاح (500: JSON مكسور ف KV…) ف آخر 6 سوايع:
               ما نعاودوش نضربوه ف كل صفحة (والتقرير وصل مرة) */
            const ERR = "de-lp-err:" + themaId;
            try {
                const at = Number(localStorage.getItem(ERR) || 0);
                if (Date.now() - at < 6 * 3600 * 1000) {
                    const off = await stored();
                    return off ? { ok: true, data: off, offline: true } : { ok: false, status: 500, why: WHY[500] };
                }
            } catch (e) { /* */ }

            const t0 = Date.now();
            let result = await ask(themaId, token);
            if (result.status >= 500) { try { localStorage.setItem(ERR, String(Date.now())); } catch (e) { /* */ } }
            /* ما وصلناش للـ Worker (الشبكة): النسخة المحفوظة إلا كاينة */
            if (!result.ok && !result.status) {
                const off = await stored();
                if (off) result = { ok: true, data: off, offline: true };
            }
            if (window.__deDiag) {
                if (!result.ok && result.status !== 404) window.__deDiag("fail", "Lesen Worker: " + (result.status || "") + " " + (result.why || "") + " [" + themaId + "]", { ms: Date.now() - t0 });
                else if (Date.now() - t0 > 8000) window.__deDiag("slow", "Lesen Worker بطا: " + Math.round((Date.now() - t0) / 1000) + "s [" + themaId + "]", { ms: Date.now() - t0 });
            }

            if (result.ok) {
                state.done.set(key, result);
                if (!result.offline) {
                    diskSet(user.uid, themaId, result.data);
                    if (window.__deStore) window.__deStore.put("l:" + themaId, result.data);
                }
            }
            else if (result.status === 404) state.miss.set(key, { result: result, until: Date.now() + MISS_MS });
            return result;
        })().finally(function () { state.busy.delete(key); });

        state.busy.set(key, job);
        return job;
    };

    /* واش هاد المفتاح ديجا ف الذاكرة؟ (الجواب ديالو، ولا undefined) — بلا طلب.
       Sprechen كيستعملها باش ما يطلبش مفتاح احتياطي إلا كان الأساسي ما جاش. */
    window.__lesenPremiumPeek = function (themaId) {
        const user = currentUser();
        return user ? state.done.get(user.uid + "|" + themaId) : undefined;
    };

    /* ===== التحميل المسبق =====
       المشترك ملي كيدخل لـ Lesen: المواضيع ديال الجزء اللي فيه كيتجابو
       ف الخفا (3 ف نفس الوقت)، وكيتحفظو ف المتصفح. ملي يبرك على موضوع
       كيبان دغيا. اللي ديجا محفوظ ما كيتعاودش. */
    let prefetching = null;
    window.__lesenPremiumPrefetch = function (ids) {
        if (!window.__sehrgutIsPremium || !Array.isArray(ids) || !ids.length) return;
        const user = currentUser();
        if (!user) return;
        const todo = ids.filter(function (id) {
            return !diskGet(user.uid, id) && !state.done.has(user.uid + "|" + id);
        });
        if (!todo.length) return;
        const run = { left: todo.slice() };
        prefetching = run;
        function next() {
            if (prefetching !== run || !run.left.length || !window.__sehrgutIsPremium) return;
            const id = run.left.shift();
            Promise.resolve(window.__lesenPremiumFetch(id)).catch(function () {}).then(function () {
                setTimeout(next, 120);
            });
        }
        for (let i = 0; i < 3; i++) next();
    };

    /* كيبدا الجلب والمستعمل باقي ما بركش: hover ف الكمبيوتر، أول لمسة ف
       التيليفون. لغير المشتركين ما كيدير والو (باش ما نضربوش الـ Worker
       بـ 403 بلا فايدة). الخطأ ما كيبانش — إلا بركو من بعد، كيتعاود الطلب. */
    window.__lesenPremiumWarm = function (themaId) {
        try {
            if (!window.__sehrgutIsPremium || !currentUser()) return;
            window.__lesenPremiumFetch(themaId);
        } catch (error) { /* غير تسريع */ }
    };
})();
