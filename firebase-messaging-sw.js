/* ===== Service Worker ديال الإشعارات =====

   هاد الملف خاصو يبقى ف جذر الموقع بهاد الاسم بالضبط —
   Firebase Messaging كيقلب عليه هكا.

   دورو: يستقبل الإشعار حتى ملي تكون الصفحة مسدودة،
   ويبين "مكالمة واردة" ولا التذكير ديال كل نهار.

   وهو حتى الـ service worker ديال التطبيق (assets/app-install.js
   كيسجلو ف كل صفحة): كيخزن الملفات باش التنقل يكون سريع، وملي
   ماكاينش الانترنت كيبين offline.html. */

const OFFLINE_CACHE = "de-offline-v1";
const ASSET_CACHE = "de-assets-v1";
const PAGE_CACHE = "de-pages-v1";

self.addEventListener("install", function (event) {
    event.waitUntil(caches.open(OFFLINE_CACHE).then(function (c) {
        return c.addAll(["offline.html", "assets/icon-192.png"]);
    }));
    self.skipWaiting();
});
self.addEventListener("activate", function (event) {
    event.waitUntil(self.clients.claim());
});

/* ===== السرعة: التنقل بين Lesen / Sprechen / Hören / Schreiben =====

   GitHub Pages كيخلي التيليفون يخزن الملفات غير 10 دقايق. من بعد،
   كل صفحة كتسول السيرفر على كل ملف (15-20 ملف) واش تبدل — وهادشي
   هو اللي كيتقل الانتقال ف الأنترنت ديال التيليفون.

   الملفات ديالنا فيهم ?v=… (tools/bump.mjs) — إلا تبدل الملف تبدل
   الرابط. إذن نفس الرابط = نفس المحتوى ديما، ونقدرو نعطيوه من
   الكاش نيشان بلا ما نسولو حتى واحد. نفس الشي لـ Firebase من
   gstatic (النسخة فالرابط) وللخطوط ديال Google.

   الصفحات (HTML) كتجي ديما من الشبكة باش التعديلات تبان دغيا؛
   الكاش غير إلا طاحت الشبكة ولا تعطلات بزاف. */

function isImmutable(url) {
    if (url.origin === self.location.origin) {
        return /\/assets\/.+\.(js|css|png|jpe?g|webp|svg|woff2?)$/.test(url.pathname)
            && /^\?v=[\w.-]+$/.test(url.search);
    }
    if (url.hostname === "fonts.gstatic.com") return true;
    if (url.hostname === "www.gstatic.com") return /^\/firebasejs\/\d/.test(url.pathname);
    return false;
}

/* نسخة جديدة ديال نفس الملف → القديمة ماعندها لاش تبقى */
function prune(cache, url) {
    if (url.origin !== self.location.origin) return;
    cache.keys().then(function (keys) {
        keys.forEach(function (req) {
            const u = new URL(req.url);
            if (u.pathname === url.pathname && u.search !== url.search) cache.delete(req);
        });
    });
}

function cacheFirst(request, url) {
    return caches.open(ASSET_CACHE).then(function (cache) {
        return cache.match(request).then(function (hit) {
            if (hit) return hit;
            return fetch(request).then(function (res) {
                if (res && (res.ok || res.type === "opaque")) {
                    cache.put(request, res.clone());
                    prune(cache, url);
                }
                return res;
            });
        });
    });
}

/* CSS ديال Google Fonts: من الكاش دغيا، ونجددوه من وراه */
function staleWhileRevalidate(request) {
    return caches.open(ASSET_CACHE).then(function (cache) {
        return cache.match(request).then(function (hit) {
            const fresh = fetch(request).then(function (res) {
                if (res && res.ok) cache.put(request, res.clone());
                return res;
            });
            if (hit) { fresh.catch(function () {}); return hit; }
            return fresh;
        });
    });
}

/* الصفحة من الشبكة. إلا طاحت (ولا بقات 4 ثواني بلا جواب) → النسخة
   اللي شفنا آخر مرة، وإلا offline.html. */
function pageFromNetwork(event) {
    const request = event.request;
    /* cache: "no-cache": المتصفح كيخبي HTML ديال GitHub Pages 10 دقايق.
       بلا هادي، تعديل جديد (ثمن، نص…) كان كيبقى ما بانش حتى بعد F5.
       دابا كل صفحة كتسول السيرفر واش تبدلات (304 خفيف إلا لا). */
    const fresh = fetch(request.url, { cache: "no-cache", credentials: "same-origin" })
        .then(function (res) { return res.redirected ? fetch(request) : res; })
        .catch(function () { return fetch(request); });
    const net = fresh.then(function (res) {
        if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then(function (c) { c.put(request.url.split("#")[0], copy); });
        }
        return res;
    });
    event.waitUntil(net.catch(function () {}));

    const cached = function () {
        return caches.match(request.url.split("#")[0], { ignoreSearch: true });
    };
    const slow = new Promise(function (resolve) {
        setTimeout(function () {
            cached().then(function (hit) { if (hit) resolve(hit); });
        }, 4000);
    });

    return Promise.race([net, slow]).catch(function () {
        return cached().then(function (hit) { return hit || caches.match("offline.html"); });
    });
}

/* ===== بلا أنترنت: الموقع كامل ف التيليفون =====

   الصفحة كتصيفط {type: "de-precache"} (assets/app-install.js) ملي
   الأنترنت مزيانة. كنجيبو offline.json (tools/bump.mjs): كاع الصفحات،
   وversion.json: كاع الملفات (js/css بالـ ?v ديالهم)، و Firebase،
   والمواضيع المجانية ديال Lesen. مرة وحدة لكل build (العلامة PRECACHE_MARK).
   هكا الطالب يقدر يدخل للموقع ويتنقل بين الأقسام حتى بلا wifi. */
const PRECACHE_MARK = self.location.origin + "/__precache-build";
const WORKER = "https://sehrgut-api.YOUR-SUBDOMAIN.workers.dev";
const FIREBASE_MODULES = ["app", "auth", "firestore"].map(function (m) {
    return "https://www.gstatic.com/firebasejs/12.18.0/firebase-" + m + ".js";
});
const IMAGES = ["assets/icon-192.png", "assets/icon-48.png", "assets/icon-32.png",
    "assets/logo-80.webp", "assets/logo-480.webp", "manifest.webmanifest"];

function pool(list, size, work) {
    let i = 0;
    function next() {
        if (i >= list.length) return Promise.resolve();
        const item = list[i++];
        return Promise.resolve().then(function () { return work(item); })
            .catch(function () { /* واحد ما تجابش: نكملو */ })
            .then(next);
    }
    const runners = [];
    for (let k = 0; k < size; k++) runners.push(next());
    return Promise.all(runners);
}

let precaching = null;
function precache() {
    if (precaching) return precaching;
    precaching = (async function () {
        const offRes = await fetch("offline.json?t=" + Date.now(), { cache: "no-store" });
        if (!offRes.ok) return;
        const off = await offRes.json();
        const pages = await caches.open(PAGE_CACHE);
        const mark = await pages.match(PRECACHE_MARK);
        if (mark && (await mark.text()) === off.build) return;

        const verRes = await fetch("version.json?t=" + Date.now(), { cache: "no-store" });
        const ver = verRes.ok ? await verRes.json() : { assets: {} };
        const assets = await caches.open(ASSET_CACHE);
        const files = Object.keys(ver.assets || {}).map(function (p) {
            return new URL(p + "?v=" + ver.assets[p], self.location.href).href;
        }).concat(FIREBASE_MODULES);
        await pool(files, 4, async function (href) {
            if (await assets.match(href)) return;
            const res = await fetch(href, { mode: href.indexOf(self.location.origin) === 0 ? "same-origin" : "cors" });
            if (res.ok) { await assets.put(href, res); prune(assets, new URL(href)); }
        });
        await pool(IMAGES, 3, async function (p) {
            const href = new URL(p, self.location.href).href;
            const res = await fetch(href);
            if (res.ok) await assets.put(href, res);
        });
        await pool(off.pages || [], 4, async function (p) {
            const href = new URL(p, self.location.href).href;
            const res = await fetch(href, { cache: "no-cache", credentials: "same-origin" });
            if (res.ok && res.type === "basic" && !res.redirected) await pages.put(href, res);
        });
        /* «/» هي index.html */
        const home = await pages.match(new URL("index.html", self.location.href).href);
        if (home) await pages.put(self.location.origin + "/", home);
        /* المواضيع المجانية ديال Lesen: نفس البلاصة اللي كيقرا منها assets/lesen-free.js */
        const free = await caches.open("de-lesen-free-v1");
        await pool(["b1", "b2"], 2, async function (lv) {
            const res = await fetch(WORKER + "?free=lesen-" + lv, { credentials: "omit" });
            if (!res.ok) return;
            await free.put(self.location.origin + "/__lesen-free/" + lv, new Response(await res.text(), {
                headers: { "Content-Type": "application/json", "x-saved": String(Date.now()) }
            }));
        });
        await pages.put(PRECACHE_MARK, new Response(off.build));
    })().catch(function () { /* المرة الجاية */ }).then(function () { precaching = null; });
    return precaching;
}

self.addEventListener("message", function (event) {
    if (event.data && event.data.type === "de-precache") event.waitUntil(precache());
});

/* الراوتر (site-header.js) كيجيب الصفحات بـ fetch (ماشي navigate):
   بلا أنترنت كنعطيوه النسخة المحفوظة باش التنقل يبقى خدام */
function htmlFetch(request) {
    return fetch(request).then(function (res) {
        if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then(function (c) { c.put(request.url.split("#")[0], copy); });
        }
        return res;
    }).catch(function () {
        return caches.match(request.url.split("#")[0], { ignoreSearch: true }).then(function (hit) {
            if (hit) return hit;
            throw new Error("offline");
        });
    });
}

self.addEventListener("fetch", function (event) {
    const request = event.request;
    if (request.method !== "GET") return;

    if (request.mode === "navigate") {
        event.respondWith(pageFromNetwork(event));
        return;
    }

    let url;
    try { url = new URL(request.url); } catch (e) { return; }

    if (url.origin === self.location.origin && /\.html$/.test(url.pathname)) {
        event.respondWith(htmlFetch(request));
        return;
    }
    /* الصور ديال الموقع بلا ?v (اللوغو، الأيقونات): من الكاش ومن بعد كتتجدد */
    if (url.origin === self.location.origin && /^\/(assets\/(?!video\/)[^/]+\.(png|webp|svg|jpe?g)|manifest\.webmanifest)$/.test(url.pathname) && !url.search) {
        event.respondWith(staleWhileRevalidate(request).catch(function () { return fetch(request); }));
        return;
    }

    if (isImmutable(url)) {
        event.respondWith(cacheFirst(request, url).catch(function () { return fetch(request); }));
    } else if (url.hostname === "fonts.googleapis.com") {
        event.respondWith(staleWhileRevalidate(request).catch(function () { return fetch(request); }));
    }
    /* الباقي (Firestore، الصوت، الفيديو، الـ Worker...) كيمشي عادي */
});

/* Firebase ف try: إلا ماتحملش (بلا انترنت ف أول مرة)، الـ worker
   كيبقى خدام للـ offline والتثبيت. */
let messaging = null;
try {
    importScripts(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
    importScripts(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

    firebase.initializeApp({
        apiKey: "AIzaSyBNxr0ZQrqa2F-RVyfoAC9r7_S49Cb2S4s",
        authDomain: "sehrgothe.firebaseapp.com",
        projectId: "sehrgothe",
        storageBucket: "sehrgothe.firebasestorage.app",
        messagingSenderId: "1066728503518",
        appId: "1:1066728503518:web:b350728d7b20f1064d2a4f"
    });

    messaging = firebase.messaging();
} catch (e) { /* بلا إشعارات هاد المرة */ }

if (messaging) messaging.onBackgroundMessage(function (payload) {
    const data = payload.data || {};
    const isCall = data.kind === "call";

    self.registration.showNotification(
        isCall
            ? (data.callType === "video" ? "📹 مكالمة فيديو" : "📞 مكالمة واردة")
            : (data.title || "sehrgut"),
        {
            body: isCall
                ? (data.fromName || "صديق") + " كيعيط ليك"
                : (data.body || ""),
            icon: "assets/icon-192.png",
            badge: "assets/icon-192.png",
            tag: isCall ? "de-call" : "de-msg",
            renotify: true,
            requireInteraction: isCall,
            /* الهزاز ديال الأندرويد كيخدم من هنا حتى والموقع مسدود */
            vibrate: isCall ? [400, 200, 400, 200, 400] : [200],
            data: { url: data.url || "./" }
        }
    );
});


/* برك على الإشعار → كيحل الصفحة، وإلا كان محلول كيجيبو لقدام */
self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const target = (event.notification.data && event.notification.data.url) || "./";
    const page = target.split("?")[0];

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then(function (list) {
                for (const client of list) {
                    if (client.url.includes(page) && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) return clients.openWindow(target);
            })
    );
});
