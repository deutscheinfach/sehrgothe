/* ===== Hören Premium: المواضيع 6 وطالع =====

   الـ repo عام، إذن الجمل والأجوبة ديال المواضيع المدفوعة ماكايناش
   فـ b2-hoeren-teil*.html. كيسكنو فـ Cloudflare KV تحت المفاتيح
   lesen-hoeren-teil1 / lesen-hoeren-teil2 / lesen-hoeren-teil3،
   والـ Worker ماكيعطيهمش حتى يتحقق من الـ ID token ومن الاشتراك
   (نفس الطريق ديال Lesen: { lesenId: "hoeren-teil2", idToken }).

   window.__hoerenPremiumLoad("teil2") → { ok, data: { themes: { "6": {questions, note} } } }
                                        ولا { ok: false, why }

   السرعة: الطلب text/plain (بلا preflight)، والاتصال بالـ Worker كيتحل
   من قبل، و__hoerenPremiumEarly كيبدا الجلب ملي الحساب يتعرف، بلا ما
   يتسنى فحص الاشتراك ديال الواجهة (Firestore) يسالي. */

(function () {
    "use strict";

    const ENDPOINT = "https://sehrgut-api.sehrgut.workers.dev";
    const cache = {};

    try {
        if (!document.head.querySelector('link[rel="preconnect"][href="' + ENDPOINT + '"]')) {
            const link = document.createElement("link");
            link.rel = "preconnect";
            link.href = ENDPOINT;
            link.crossOrigin = "";
            document.head.appendChild(link);
        }
    } catch (e) { /* غير تسريع */ }

    const WHY = {
        400: "الـ Worker ف Cloudflare قديم. خاصك تدير Deploy لـ cloudflare-worker.js.",
        401: "الحساب ما تقبلش. خرج وعاود دخل.",
        403: "الحساب ماشي Premium (subscriptionActive خاصو يكون true).",
        404: "ماكاينش المفتاح ديال Hören فـ Cloudflare KV (lesen-hoeren-teil…).",
        500: "خطأ ف الـ Worker."
    };

    /* Firebase كيرجّع الحساب من بعد شوية (خصوصاً داخل «اختبر نفسك»
       اللي كيتحضر بكري): كنتسناو حتى 10 ثواني قبل «ماشي داخل بحساب». */
    async function token() {
        const end = Date.now() + 10000;
        for (;;) {
            const t = await tokenNow();
            if (t || Date.now() > end) return t;
            await new Promise(function (go) { setTimeout(go, 200); });
        }
    }

    async function tokenNow() {
        let user = window.__hoerenUser
            || (window.__sehrgutAuth && window.__sehrgutAuth.currentUser);
        /* داخل «اختبر نفسك» / Modelltest: الحساب ديال الصفحة الأم */
        if (!user) {
            try {
                const up = window.parent !== window && window.parent.__sehrgutAuth;
                user = (up && up.currentUser) || null;
            } catch (e) { user = null; }
        }
        if (!user) return null;
        try { return await user.getIdToken(); } catch (e) { return null; }
    }

    window.__hoerenPremiumLoad = function (teil) {
        if (cache[teil]) return cache[teil];
        /* بلا أنترنت: النسخة المحفوظة ف التيليفون (__deStore، diag.js) */
        const KEY = "l:hoeren-" + teil;
        const stored = function () {
            return window.__deStore ? window.__deStore.get(KEY) : Promise.resolve(null);
        };
        cache[teil] = (async function () {
            if (navigator.onLine === false) {
                const off = await stored();
                if (off) return { ok: true, data: off, offline: true };
            }
            const idToken = await token();
            if (!idToken) {
                const off = await stored();
                return off ? { ok: true, data: off, offline: true } : { ok: false, why: "ماشي داخل بحساب." };
            }
            try {
                const res = await fetch(ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=UTF-8" },
                    body: JSON.stringify({ lesenId: "hoeren-" + teil, idToken: idToken })
                });
                if (!res.ok) return { ok: false, status: res.status, why: WHY[res.status] || ("HTTP " + res.status) };
                const data = await res.json();
                if (window.__deStore) window.__deStore.put(KEY, data);
                return { ok: true, data: data };
            } catch (e) {
                const off = await stored();
                if (off) return { ok: true, data: off, offline: true };
                return { ok: false, why: "ما وصلناش للـ Worker. شوف الأنترنت." };
            }
        })();
        cache[teil].then(function (r) {
            if (r.ok) return;
            delete cache[teil];
            if (window.__deDiag && r.status !== 403) window.__deDiag("fail", "Hören Worker (" + teil + "): " + (r.status || "") + " " + (r.why || ""));
        });
        return cache[teil];
    };

    /* الصفحة كتناديه ملي auth كيجاوب (window.__hoerenUser)، قبل ما فحص
       Firestore ديال الواجهة يسالي. كيخدم غير إلا آخر حالة معروفة كانت
       Premium (site-header.js كيحطها ف __sehrgutIsPremium): غير
       المشترك ما كنضربوش الـ Worker بـ 403. إلا الحدس كان غالط، الجواب
       كيتنقص وصفحة المشترك العادية كتبقى كيف كانت. */
    window.__hoerenPremiumEarly = function () {
        try {
            if (!window.__sehrgutIsPremium) return;
            const match = /(?:^|\/)(b1|b2)-hoeren-(teil[123])(?:\.html)?$/.exec(location.pathname);
            if (!match) return;
            window.__hoerenPremiumLoad(match[1] === "b1" ? "b1-" + match[2] : match[2]);
        } catch (e) { /* غير تسريع */ }
    };

    /* كتزيد الجمل للمواضيع المقفولين (premium: true) من الجواب ديال KV */
    window.__hoerenPremiumMerge = function (themes, result) {
        if (!result || !result.ok || !result.data || !result.data.themes) return;
        themes.forEach(function (t, i) {
            /* "kv": الرقم ديال الموضوع ف KV ملي تحيد شي موضوع قبلو
               (مثلاً Wanderung ف B2 Teil 3) — باش مانبدلوش KV. */
            const p = result.data.themes[String(t.kv || i + 1)];
            if (t.premium && p && Array.isArray(p.questions)) {
                t.questions = p.questions;
                if (p.note) t.note = p.note;
            }
        });
    };
})();
