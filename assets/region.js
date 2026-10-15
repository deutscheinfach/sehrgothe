/* ===== البلاد ديال الحساب =====

   المغرب: Premium بالاشتراك عبر WhatsApp (بحال قبل).
   أي بلاد أخرى: المحتوى كامل مجاني، مع إعلانات.

   الـWorker هو اللي كيقرر (cloudflare-worker.js → resolveRegion)، ماشي
   هاد الملف. هنا غير كنصيفطو العلامات ديال الجهاز (المنطقة الزمنية،
   اللغات، الرقم) وكنحفظو الجواب. الـVPN كيبدل الـIP برك — المنطقة
   الزمنية ديال التيليفون كتبقى Africa/Casablanca.

   الاستعمال:
     window.__sehrgutRegion.check(user[, phone]) → Promise<{region, free}>
     window.__sehrgutRegionFree(user)            → Promise<boolean>
     window.__sehrgutAds.render(show)            → كيبين الإعلانات ولا لا */

(function () {
    "use strict";
    if (window.__sehrgutRegion) return;

    const API = "https://sehrgut-api.sehrgut.workers.dev";

    /* Google AdSense: حط هنا ca-pub-… ملي يتقبل الحساب، وفعّل
       «Auto ads» ف AdSense. خاوي = حتى إعلان ما كيبان. */
    const ADSENSE_CLIENT = "";

    const KEY = "sehrgutRegion";
    const SEEN = "sehrgutSeenMA";
    const PHONE = "sehrgutPhone";
    const MA_TZ = ["Africa/Casablanca", "Africa/El_Aaiun"];

    function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function write(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* */ } }

    function hint(phone) {
        let tz = "";
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* */ }
        const langs = (navigator.languages && navigator.languages.length
            ? Array.from(navigator.languages) : [navigator.language || ""]).slice(0, 10);
        return { tz: tz, langs: langs, phone: phone || read(PHONE) || "", seen: read(SEEN) === "1" };
    }

    /* نفس العلامات ديال الـWorker، غير ديال الجهاز */
    function looksMoroccan(h) {
        return MA_TZ.indexOf(h.tz) !== -1
            || h.seen
            || /^(\+|00)212/.test(String(h.phone).replace(/[^\d+]/g, ""))
            || h.langs.some(function (l) { return /^[a-z]{2,3}-MA$/i.test(l); });
    }

    function cached(uid) {
        try {
            const c = JSON.parse(read(KEY) || "null");
            return c && c.uid === uid ? c : null;
        } catch (e) { return null; }
    }

    const pending = {};

    function check(user, phone) {
        if (!user || !user.uid) return Promise.resolve({ region: "", free: false });
        if (pending[user.uid] && !phone) return pending[user.uid];

        const h = hint(phone);
        const last = cached(user.uid);

        const run = user.getIdToken()
            .then(function (idToken) {
                return fetch(API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken: idToken, region: h })
                });
            })
            .then(function (res) {
                if (!res.ok) throw new Error("region " + res.status);
                return res.json();
            })
            .then(function (data) {
                const out = { uid: user.uid, region: String(data.region || ""), free: data.free === true };
                if (out.region === "MA") write(SEEN, "1");
                write(KEY, JSON.stringify(out));
                return out;
            })
            .catch(function (error) {
                console.warn("Region:", error && error.message);
                /* بلا أنترنت / الـWorker طايح: آخر جواب معروف — إلا كان
                   الجهاز نفسو باين مغربي، ماشي مجاني. */
                if (last && !(last.free && looksMoroccan(h))) return last;
                return { uid: user.uid, region: "", free: false };
            });

        pending[user.uid] = run;
        return run;
    }

    /* ===== الإعلانات ===== */
    let adsLoaded = false;
    function renderAds(show) {
        document.documentElement.classList.toggle("sg-ads", !!show);
        if (!show || adsLoaded || !ADSENSE_CLIENT) return;
        adsLoaded = true;
        const s = document.createElement("script");
        s.async = true;
        s.crossOrigin = "anonymous";
        s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="
            + encodeURIComponent(ADSENSE_CLIENT);
        document.head.appendChild(s);
    }

    window.__sehrgutRegion = { check: check, hint: hint, looksMoroccan: looksMoroccan };
    window.__sehrgutRegionFree = function (user, phone) {
        return check(user, phone).then(function (r) { return r.free === true; });
    };
    window.__sehrgutAds = { render: renderAds };
})();
