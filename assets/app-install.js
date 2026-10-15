/* ===== التطبيق: «زيد للتيليفون» + «فكرني كل نهار» =====

   1) كنسجلو الـ service worker (firebase-messaging-sw.js) ف كل صفحة:
      الموقع كيولي قابل يتزاد للشاشة بحال تطبيق، وكيبين offline.html
      ملي ماكاينش الانترنت.
   2) ف الصفحة الرئيسية و «التقدم ديالي» كتبان بطاقة صغيرة:
      - «زيد التطبيق»: Android/Chrome كيستعمل beforeinstallprompt،
        iPhone كنوريوه الخطوات (Partager → Sur l'écran d'accueil).
      - «فكرني كل نهار»: كيطلب الإذن ديال الإشعارات ويحفظ token
        ف users/{uid}/private/push مع daily: true. الـ Worker
        (scheduled) كيصيفط التذكير كل نهار.
   البطاقة ديال التطبيق ماكتعاودش تبان إلا سدها (×) ولا زاد التطبيق.
   نافذة التذكير غير للي عندو حساب وداخل. */
(function () {
    "use strict";

    /* VAPID public key — Firebase Console → Paramètres du projet →
       Cloud Messaging → Certificats Web Push. عمومي، ماشي سر. */
    window.__DE_VAPID_KEY = window.__DE_VAPID_KEY || ""; /* sehrgut: SEHRGUT-SETUP.md §1.6 */

    if (window.__deApp) return;

    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var CARD_PAGES = ["index.html", "", "fortschritt.html"];
    var DISMISS_KEY = "de-app-card-hide";
    var DAILY_KEY = "de-daily-on";
    var INSTALLED_KEY = "de-app-installed";
    var installedApp = false;   /* getInstalledRelatedApps (Chrome) */
    var deferred = null;

    function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* خاص */ } }
    function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    function standalone() {
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }
    function pushPossible() {
        return !!window.__DE_VAPID_KEY && "Notification" in window && "serviceWorker" in navigator
            && Notification.permission !== "denied";
    }

    /* ---- 1) الـ service worker ---- */
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        window.addEventListener("load", function () {
            navigator.serviceWorker.register("firebase-messaging-sw.js").catch(function () { /* ماشي ضروري */ });
        });
        offlineReady();
    }

    /* ---- 1ب) بلا أنترنت: الموقع والمحتوى ف التيليفون ----
       · الصفحات والملفات: الـ service worker كيجيبهم (firebase-messaging-sw.js،
         مرة لكل build) — للجميع.
       · المحتوى المدفوع (Lesen، Sprechen، Schreiben، Hören): للمشترك، كيتجاب
         من الـ Worker وكيتحفظ ف __deStore (diag.js). كيكمل من فين حبس، وكل
         موضوع كيتجدد من بعد 7 أيام. 2 ف نفس الوقت، من بعد ما يبان المحتوى.
       ما كيدير والو ف «توفير البيانات» (Save-Data) ولا بلا أنترنت. */
    function offlineReady() {
        var conn = navigator.connection || {};
        if (conn.saveData || navigator.onLine === false) return;
        var later = window.__deAfterContent || function (fn) { setTimeout(fn, 3000); };
        later(function () {
            setTimeout(function () {
                if (navigator.onLine === false) return;
                /* الصفحات: كل نص ساعة كنسولو (الـ worker كيقارن الـ build — رخيص) */
                if (Date.now() - Number(read("de-precache-at") || 0) > 30 * 60 * 1000) {
                    navigator.serviceWorker.ready.then(function (reg) {
                        if (reg.active) { reg.active.postMessage({ type: "de-precache" }); store("de-precache-at", String(Date.now())); }
                    }).catch(function () { /* */ });
                }
                if (window.__sehrgutIsPremium === true) premiumOffline();
                else document.addEventListener("de-premium", function () {
                    if (window.__sehrgutIsPremium === true) premiumOffline();
                }, { once: true });
            }, 1500);
        });
    }

    var premiumRunning = false;
    function premiumOffline() {
        if (premiumRunning || !window.__deStore || !window.caches) return;
        var auth = window.__sehrgutAuth;
        var user = auth && auth.currentUser;
        if (!user) return;
        var mark = "de-offline-at:" + user.uid;
        if (Date.now() - Number(read(mark) || 0) < 12 * 3600 * 1000) return;
        premiumRunning = true;
        var WORKER = "https://sehrgut-api.sehrgut.workers.dev";
        var WEEK = 7 * 24 * 3600 * 1000;
        fetch("offline.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (off) {
            if (!off) return;
            var jobs = (off.lesen || []).map(function (id) { return { key: "l:" + id, body: { lesenId: id } }; })
                .concat((off.schreibenB2 || []).map(function (id) { return { key: "t:" + id, body: { topicId: id } }; }));
            var i = 0, failures = 0, fetched = 0;
            /* شارة صغيرة لتحت: «كنحضرو الموقع بلا أنترنت — 45%». كتبان غير
               ملي كاين بزاف ما يتجاب (أول مرة) — باش الطالب يعرف يتسنى. */
            var pill = null, firstRun = !read("de-offline-ready:" + user.uid);
            function progress(done) {
                if (!firstRun) return;
                if (!pill) {
                    pill = document.createElement("div");
                    pill.setAttribute("role", "status");
                    pill.dir = "rtl";
                    pill.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:2147482500;padding:8px 14px;border-radius:999px;"
                        + "background:#2a0710;color:#fff;font:700 13px/1.4 Cairo,system-ui,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.3);"
                        + "opacity:.92;pointer-events:none";
                }
                if (!pill.isConnected && document.body) document.body.appendChild(pill);   /* الراوتر بدل الصفحة */
                if (done) {
                    pill.textContent = "✅ الموقع واجد للاستعمال بلا أنترنت";
                    pill.style.background = "#1e7d3a";
                    setTimeout(function () { if (pill) pill.remove(); }, 4000);
                    return;
                }
                var pct = Math.min(99, Math.round(i / Math.max(1, jobs.length) * 100));
                pill.textContent = "⬇️ كنحضرو الموقع للاستعمال بلا أنترنت — " + pct + "%";
            }
            function fresh(key) {
                return caches.open("de-data-v1").then(function (c) {
                    return c.match(location.origin + "/__data/" + encodeURIComponent(user.uid) + "/" + encodeURIComponent(key));
                }).then(function (res) {
                    return !!res && Date.now() - Number(res.headers.get("x-saved") || 0) < WEEK;
                }).catch(function () { return false; });
            }
            /* المواضيع اللي ماكاينش المحتوى ديالهم: كيتخباو من اللوائح (diag.js __deMissing) */
            function missing(job, gone, part) {
                var M = window.__deMissing;
                if (!M) return;
                var key = null, id = job.body.lesenId || "";
                if (job.topic) key = "lesen:" + job.topic + "|" + job.part;
                else if (part) key = "lesen:" + id + "|" + part;
                else if (job.body.topicId) key = "sch:b2-" + job.body.topicId;
                else if (/^schreiben-b1-/.test(id)) key = "sch:b1-" + id.slice(13);
                else if (/^sprechen-b[12]-/.test(id)) key = "sp:" + id.slice(9);
                if (!key) return;
                if (gone) M.add(key); else M.del(key);
            }
            function next() {
                if (i >= jobs.length || failures > 8 || navigator.onLine === false
                    || window.__sehrgutIsPremium !== true) return Promise.resolve();
                var job = jobs[i++];
                if (fetched > 3) progress(false);
                return fresh(job.key).then(function (ok) {
                    if (ok) {
                        var sid = job.body.lesenId, sneed = sid && off.parts && off.parts[sid];
                        if (!sneed) return next();
                        return window.__deStore.get(job.key).then(function (data) {
                            sneed.forEach(function (part) {
                                if (!data || !data[part]) jobs.push({ key: "l:" + sid + "-" + part, body: { lesenId: sid + "-" + part }, topic: sid, part: part });
                            });
                        }).then(next);
                    }
                    return user.getIdToken().then(function (token) {
                        job.body.idToken = token;
                        return fetch(WORKER, {
                            method: "POST",
                            headers: { "Content-Type": "text/plain;charset=UTF-8" },
                            body: JSON.stringify(job.body)
                        });
                    }).then(function (res) {
                        var id = job.body.lesenId;
                        var need = id && off.parts && off.parts[id];
                        if (res.ok) fetched++;
                        if (res.ok) return res.json().then(function (data) {
                            /* Lesen: الأجزاء اللي ماكايناش ف المفتاح ديال الموضوع (lesen-<id>-<part>) */
                            if (need) need.forEach(function (part) {
                                if (!data || !data[part]) jobs.push({ key: "l:" + id + "-" + part, body: { lesenId: id + "-" + part }, topic: id, part: part });
                                else missing(job, false, part);
                            });
                            missing(job, false);
                            return window.__deStore.put(job.key, data);
                        });
                        if (res.status === 401 || res.status === 403) failures = 99;
                        if (res.status === 404 || res.status >= 500) {
                            /* المفتاح ديال الموضوع ماكاينش: يمكن الأجزاء بوحدهم */
                            if (need) need.forEach(function (part) {
                                jobs.push({ key: "l:" + id + "-" + part, body: { lesenId: id + "-" + part }, topic: id, part: part });
                            });
                            else missing(job, true);
                        }
                    }).catch(function () { failures++; })
                      .then(function () { return new Promise(function (go) { setTimeout(go, 120); }); })
                      .then(next);
                });
            }
            return Promise.all([next(), next()]).then(function () {
                if (i >= jobs.length && failures <= 8) {
                    store(mark, String(Date.now()));
                    if (pill) progress(true);
                    store("de-offline-ready:" + user.uid, "1");
                } else if (pill) { pill.remove(); }
            });
        }).catch(function () { /* المرة الجاية */ }).then(function () { premiumRunning = false; });
    }

    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        deferred = e;
    });
    window.addEventListener("appinstalled", function () {
        store(INSTALLED_KEY, "1");
        deferred = null;
        if (sheet) sheet.done();
    });
    /* إلا تحل مرة من الأيقونة، راه مزيد — حتى ف المتصفح ماكنعاودوش نسولوه */
    if (standalone()) store(INSTALLED_KEY, "1");
    if (navigator.getInstalledRelatedApps) {
        navigator.getInstalledRelatedApps().then(function (apps) {
            if (apps && apps.length) { installedApp = true; store(INSTALLED_KEY, "1"); paint(); }
        }).catch(function () { /* ماشي ضروري */ });
    }

    /* ---- 2) البطاقة ---- */
    var css = document.createElement("style");
    css.textContent =
        ".de-app{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:900;" +
        "width:min(440px,calc(100vw - 24px));background:#7a1426;color:#fff;border:2px solid rgba(255,206,0,.55);border-radius:20px;" +
        "box-shadow:0 18px 50px rgba(0,0,0,.45);padding:14px 16px;direction:rtl;font-family:Cairo,system-ui,sans-serif;animation:de-app-in .35s ease}" +
        "@keyframes de-app-in{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}" +
        ".de-app-x{position:absolute;top:8px;left:10px;border:0;background:transparent;color:#fff;font-size:22px;line-height:1;cursor:pointer;opacity:.75}" +
        ".de-app-row{display:flex;align-items:center;gap:12px}.de-app-row+.de-app-row{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.18)}" +
        ".de-app-row img{width:44px;height:44px;border-radius:50%;flex:0 0 auto}" +
        ".de-app-t{flex:1;min-width:0;font-size:14px;line-height:1.5}.de-app-t b{display:block;font-size:15.5px;font-weight:900}" +
        ".de-app-btn{flex:0 0 auto;border:0;border-radius:999px;padding:9px 16px;background:#ffce00;color:#2a0710;font:inherit;font-weight:900;font-size:14px;cursor:pointer;white-space:nowrap;text-decoration:none}" +
        ".de-app-btn.ghost{background:transparent;color:#ffce00;border:1.5px solid rgba(255,206,0,.6)}" +
        ".de-app-ios{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.22);font-size:14px;line-height:1.9}" +
        ".de-app-ios b{color:#ffce00}.de-app-msg{font-size:13.5px;color:#ffce00;font-weight:800}" +
        /* نافذة الإذن (بحال اللي كتبين Google قبل الإذن ديال المتصفح) */
        ".de-ask-bg{position:fixed;inset:0;z-index:1000;background:rgba(20,6,10,.55);display:flex;align-items:flex-start;justify-content:center;padding:calc(18px + env(safe-area-inset-top)) 14px;animation:de-fade .2s ease}" +
        "@keyframes de-fade{from{opacity:0}to{opacity:1}}" +
        ".de-ask{width:min(400px,100%);background:#fff;color:#1f1f1f;border-radius:22px;box-shadow:0 24px 60px rgba(0,0,0,.4);padding:22px 22px 16px;direction:rtl;font-family:Cairo,system-ui,sans-serif;animation:de-drop .3s cubic-bezier(.2,.9,.3,1.2)}" +
        "@keyframes de-drop{from{transform:translateY(-24px);opacity:0}to{transform:none;opacity:1}}" +
        ".de-ask-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}" +
        ".de-ask-top img{width:46px;height:46px;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,.2)}" +
        ".de-ask-top small{display:block;color:#666;font-size:12.5px;font-weight:700;direction:ltr;text-align:right}" +
        ".de-ask-top b{font-size:15px}" +
        ".de-ask h3{margin:0 0 6px;font-size:19px;font-weight:900;line-height:1.35}" +
        ".de-ask p{margin:0 0 14px;color:#444;font-size:14.5px;line-height:1.7}" +
        ".de-ask-demo{display:flex;gap:10px;align-items:center;background:#f3f1ec;border-radius:14px;padding:10px 12px;margin-bottom:16px;font-size:13px;color:#333}" +
        ".de-ask-demo img{width:30px;height:30px;border-radius:8px}.de-ask-demo b{display:block;font-size:13.5px}" +
        ".de-ask-btns{display:flex;gap:10px;justify-content:flex-start}" +
        ".de-ask-btns button{flex:1;border-radius:999px;padding:11px 14px;font:inherit;font-weight:900;font-size:15px;cursor:pointer}" +
        ".de-ask-yes{border:0;background:#7a1426;color:#fff}.de-ask-no{border:1.5px solid #d8d4cc;background:#fff;color:#444}" +
        ".de-ask-ok{text-align:center;font-weight:900;color:#15803d;font-size:15px;padding:6px 0}" +
        "html[data-theme=dark] .de-ask{background:#1f1a1c;color:#f4f1ea}html[data-theme=dark] .de-ask p{color:#cfc8bd}" +
        "html[data-theme=dark] .de-ask-demo{background:#2c2427;color:#e9e3d8}html[data-theme=dark] .de-ask-no{background:transparent;color:#e9e3d8;border-color:#4a4044}" +
        "html[data-theme=dark] .de-ask-top small{color:#aaa}";
    document.head.appendChild(css);

    var card = null;

    function wantInstall() {
        if (standalone() || installedApp || read(INSTALLED_KEY) === "1") return false;
        return !!(deferred || isIOS);
    }
    function wantDaily() { return pushPossible() && read(DAILY_KEY) !== "1"; }

    function paint() {
        if (CARD_PAGES.indexOf(page) === -1) return;
        if (document.querySelector(".de-ask-bg")) { setTimeout(paint, 3000); return; }
        /* سدها مرة (×) = ماكتعاودش تبان */
        if (read(DISMISS_KEY)) { if (card) { card.remove(); card = null; } return; }
        var install = wantInstall(), daily = false;   /* التذكير عندو نافذة بوحدو (askDaily) */
        if (!install && !daily) { if (card) { card.remove(); card = null; } return; }
        if (!card) {
            card = document.createElement("div");
            card.className = "de-app";
            card.setAttribute("role", "dialog");
            card.setAttribute("aria-label", "sehrgut app");
            document.body.appendChild(card);
        }
        card.innerHTML = "";
        var x = document.createElement("button");
        x.className = "de-app-x"; x.type = "button"; x.setAttribute("aria-label", "سد"); x.textContent = "×";
        x.addEventListener("click", function () { store(DISMISS_KEY, String(Date.now())); card.remove(); card = null; });
        card.appendChild(x);

        if (install) {
            var r = row('<img src="assets/icon-192.png" alt="">',
                "<b>📲 زيد sehrgut للتيليفون</b>بحال تطبيق — كيتحل بضغطة، بلا Play Store.",
                isIOS && !deferred ? "كيفاش؟" : "زيد");
            r.btn.addEventListener("click", function () {
                if (deferred) {
                    deferred.prompt();
                    deferred.userChoice.then(function (c) {
                        if (c && c.outcome === "accepted") store(INSTALLED_KEY, "1");
                    }).finally(function () { deferred = null; paint(); });
                    return;
                }
                if (!card.querySelector(".de-app-ios")) {
                    var tip = document.createElement("div");
                    tip.className = "de-app-ios";
                    tip.innerHTML = "1. ف Safari ضغط على <b>Partager</b> ⬆️ (لتحت)<br>" +
                        "2. ختار <b>Sur l'écran d'accueil</b> ➕<br>3. ضغط <b>Ajouter</b> — وصافي ✅";
                    r.el.insertAdjacentElement("afterend", tip);
                }
            });
        }

        if (daily) {
            var d = row("", "<b>🔔 فكرني كل نهار بالتمرين</b>إشعار وحيد ف النهار مع 7 د الليل — باش ما تقطعش.", "فكرني");
            d.btn.classList.toggle("ghost", install);
            d.btn.addEventListener("click", function () { enableDaily(d); });
        }
    }

    function row(icon, text, label) {
        var el = document.createElement("div");
        el.className = "de-app-row";
        el.innerHTML = icon + '<div class="de-app-t">' + text + "</div>";
        var btn = document.createElement("button");
        btn.type = "button"; btn.className = "de-app-btn"; btn.textContent = label;
        el.appendChild(btn);
        card.appendChild(el);
        return { el: el, btn: btn };
    }

    function loadPush() {
        if (window.__dePushEnable) return Promise.resolve();
        return new Promise(function (ok, bad) {
            var s = document.createElement("script");
            s.src = "assets/push-register.js?v=1";
            s.onload = ok; s.onerror = bad;
            document.head.appendChild(s);
        });
    }

    function say(d, html) {
        var t = d.el.querySelector(".de-app-t");
        t.innerHTML = '<span class="de-app-msg">' + html + "</span>";
    }

    function enableDaily(d) {
        d.btn.disabled = true;
        d.btn.textContent = "…";
        loadPush().then(function () { return window.__dePushEnable({ daily: true }); }).then(function (res) {
            d.btn.remove();
            if (res && res.ok) {
                store(DAILY_KEY, "1");
                say(d, "✅ صافي! غادي نفكروك كل نهار مع 7 د الليل.");
                setTimeout(function () { paint(); }, 4000);
            } else if (res && res.needsLogin) {
                say(d, 'دخل لحسابك باش نفكروك — <a class="de-app-btn" href="login.html">الدخول</a>');
            } else if (res && res.needsHomeScreen) {
                say(d, "ف iPhone: زيد التطبيق للشاشة أولا، ومن بعد حلو وضغط «فكرني».");
            } else if (window.Notification && Notification.permission === "denied") {
                say(d, "الإشعارات مسدودة ف المتصفح — حلها من الإعدادات ديال الموقع.");
            } else {
                say(d, "ما قدرناش نفعلو الإشعارات ف هاد المتصفح.");
            }
        }).catch(function () {
            d.btn.remove();
            say(d, "ما قدرناش نفعلو الإشعارات دابا — عاود من بعد.");
        });
    }

    /* ===== «فكرني كل نهار»: نافذة الإذن =====
       كتبان غير للي داخل بحسابو (الـ token كيتحفظ ف الحساب)، والإذن
       ديال المتصفح مازال ما تسولش. ملي يضغط «سماح» عاد كيطلع
       الإذن الحقيقي (Autoriser / Bloquer). «ماشي دابا» = 7 أيام. */
    var ASK_KEY = "de-daily-asked";

    function currentUser() {
        return new Promise(function (resolve) {
            var tries = 0;
            (function wait() {
                var a = window.__sehrgutAuth;
                if (a && a.currentUser) return resolve(a.currentUser);
                if (a && tries > 6) return resolve(a.currentUser || null);
                if (++tries > 40) return resolve(null);
                setTimeout(wait, 250);
            })();
        });
    }

    function askDaily(delay, silent) {
        if (!pushPossible() || read(DAILY_KEY) === "1") return;
        if (isIOS && !standalone()) return;   /* iPhone: غير من التطبيق المزيد للشاشة */
        setTimeout(function () {
            currentUser().then(function (user) {
                if (!user) return;
                /* سبق قبل ف جهاز آخر ولا هنا: نعاودو نسجلو بلا ما نسولو */
                if (Notification.permission === "granted") {
                    loadPush().then(function () { return window.__dePushEnable({ daily: true }); })
                        .then(function (r) { if (r && r.ok) store(DAILY_KEY, "1"); }).catch(function () {});
                    return;
                }
                if (silent) return;   /* ما بقيناش نطلعو النافذة بوحدنا */
                var last = Number(read(ASK_KEY) || 0);
                if (last && Date.now() - last < 7 * 86400000) return;
                showAsk();
            });
        }, delay);
    }

    function showAsk() {
        if (document.querySelector(".de-ask-bg")) return;
        var bg = document.createElement("div");
        bg.className = "de-ask-bg";
        bg.innerHTML =
            '<div class="de-ask" role="dialog" aria-modal="true" aria-labelledby="de-ask-h">' +
            '<div class="de-ask-top"><img src="assets/icon-192.png" alt=""><div><b>sehrgut</b><small>deutscheinfach.github.io/sehrgothe</small></div></div>' +
            '<h3 id="de-ask-h">🔔 بغيتي نفكروك بالتمرين كل نهار؟</h3>' +
            "<p>إشعار واحد ف النهار مع <b>7 د الليل</b> باش تبقى منتظم وتوجد لـ telc. بلا إزعاج، وتقدر توقفو فأي وقت.</p>" +
            '<div class="de-ask-demo"><img src="assets/icon-192.png" alt=""><div><b>🔥 ما تقطعش اليوم!</b>10 دقايق ديال Lesen كيفرقو ف telc.</div></div>' +
            '<div class="de-ask-btns"><button type="button" class="de-ask-yes">سماح</button><button type="button" class="de-ask-no">ماشي دابا</button></div>' +
            "</div>";
        document.body.appendChild(bg);
        function close() { bg.remove(); }
        bg.querySelector(".de-ask-no").addEventListener("click", function () { store(ASK_KEY, String(Date.now())); close(); });
        bg.addEventListener("click", function (e) { if (e.target === bg) { store(ASK_KEY, String(Date.now())); close(); } });
        bg.querySelector(".de-ask-yes").addEventListener("click", function () {
            var box = bg.querySelector(".de-ask-btns");
            box.innerHTML = '<div class="de-ask-ok">… ضغط «Autoriser» ف النافذة ديال المتصفح</div>';
            loadPush().then(function () { return window.__dePushEnable({ daily: true }); }).then(function (r) {
                if (r && r.ok) {
                    store(DAILY_KEY, "1");
                    box.innerHTML = '<div class="de-ask-ok">✅ صافي! نتلاقاو غدا مع 7 د الليل.</div>';
                    setTimeout(close, 2200);
                } else {
                    store(ASK_KEY, String(Date.now()));
                    box.innerHTML = '<div class="de-ask-ok" style="color:#b42318">' +
                        (window.Notification && Notification.permission === "denied"
                            ? "الإشعارات مسدودة — تقدر تحلها من 🔒 حدا العنوان ديال الموقع."
                            : "ما تفعلاتش دابا — نعاودو نسولوك من بعد.") + "</div>";
                    setTimeout(close, 3500);
                }
            }).catch(function () { close(); });
        });
    }

    /* ---- 3) نافذة «ثبت التطبيق» (من القائمة) ---- */
    var sheet = null;
    var DL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>';
    var sheetCss = document.createElement("style");
    sheetCss.textContent =
        ".de-inst-bg{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:flex-start;justify-content:center;padding:calc(76px + env(safe-area-inset-top)) 14px 14px;" +
        "background:rgba(15,10,20,.35);animation:de-fade .18s ease}" +
        ".de-inst{position:relative;width:min(440px,100%);direction:rtl;background:#fff;color:#14141f;border-radius:26px;padding:20px 20px 18px;" +
        "box-shadow:0 30px 70px -20px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.04);font-family:inherit;animation:de-drop .28s cubic-bezier(.2,.9,.3,1.15)}" +
        ".de-inst-top{display:flex;align-items:center;gap:14px;padding-inline-end:26px}" +
        ".de-inst-top img{width:56px;height:56px;border-radius:16px;flex:none;box-shadow:0 8px 18px -8px rgba(0,0,0,.45)}" +
        ".de-inst-top b{display:block;font-size:17px;font-weight:900;line-height:1.35}" +
        ".de-inst-top span{display:block;margin-top:2px;font-size:13.5px;color:#6b6b7b;line-height:1.5}" +
        ".de-inst-x{position:absolute;top:14px;left:14px;width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:#8a8a99;font-size:20px;line-height:1;cursor:pointer}" +
        ".de-inst-x:hover{background:#f1f1f5;color:#14141f}" +
        ".de-inst-btns{display:flex;gap:10px;margin-top:18px}" +
        ".de-inst-btns button{min-height:48px;border-radius:14px;font:inherit;font-weight:900;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}" +
        ".de-inst-go{flex:1.6;border:0;color:#fff;background:linear-gradient(135deg,#c2183f,#7a1426);box-shadow:0 12px 24px -12px #7a1426}" +
        ".de-inst-go:hover{filter:brightness(1.07)}" +
        ".de-inst-no{flex:1;border:0;background:#f1f1f5;color:#333}" +
        ".de-inst-no:hover{background:#e7e7ee}" +
        ".de-inst-tip{margin:14px 0 0;padding:12px 14px;border-radius:14px;background:#f6f4ef;font-size:14px;line-height:1.95;color:#333}" +
        ".de-inst-tip b{color:#7a1426}.de-inst-ok{color:#15803d;font-weight:900}" +
        "html[data-theme=dark] .de-inst{background:#1d1a22;color:#f2eff7;box-shadow:0 30px 70px -20px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.06)}" +
        "html[data-theme=dark] .de-inst-top span{color:#a9a3b5}html[data-theme=dark] .de-inst-no{background:#2c2833;color:#e9e5f0}" +
        "html[data-theme=dark] .de-inst-x:hover{background:#2c2833;color:#fff}html[data-theme=dark] .de-inst-tip{background:#2a2530;color:#e9e5f0}" +
        "html[data-theme=dark] .de-inst-tip b{color:#ffce00}" +
        "@media (max-width:560px){.de-inst-bg{align-items:flex-end;padding:14px 12px calc(14px + env(safe-area-inset-bottom))}}";
    document.head.appendChild(sheetCss);

    function install() {
        if (sheet) return;
        var bg = document.createElement("div");
        bg.className = "de-inst-bg";
        bg.innerHTML =
            '<div class="de-inst" role="dialog" aria-modal="true" aria-labelledby="de-inst-t">' +
            '<button type="button" class="de-inst-x" aria-label="سد">×</button>' +
            '<div class="de-inst-top"><img src="assets/icon-192.png" alt="">' +
            '<div><b id="de-inst-t">ثبت sehrgut كتطبيق</b><span>وصول سريع بدون متصفح، بحال تطبيق حقيقي</span></div></div>' +
            '<div class="de-inst-btns"><button type="button" class="de-inst-go">' + DL + "تثبيت</button>" +
            '<button type="button" class="de-inst-no">ليس الآن</button></div>' +
            "</div>";
        document.body.appendChild(bg);
        var box = bg.querySelector(".de-inst");
        var go = bg.querySelector(".de-inst-go");

        function close() { bg.remove(); sheet = null; document.removeEventListener("keydown", onKey); }
        function onKey(e) { if (e.key === "Escape") close(); }
        function tip(html) {
            var t = box.querySelector(".de-inst-tip");
            if (!t) { t = document.createElement("div"); t.className = "de-inst-tip"; box.appendChild(t); }
            t.innerHTML = html;
        }
        sheet = {
            done: function () {
                tip('<span class="de-inst-ok">✓ التطبيق تزاد. لقاه ف الشاشة ديالك.</span>');
                go.disabled = true;
            }
        };
        document.addEventListener("keydown", onKey);
        bg.querySelector(".de-inst-x").addEventListener("click", close);
        bg.querySelector(".de-inst-no").addEventListener("click", close);
        bg.addEventListener("click", function (e) { if (e.target === bg) close(); });

        go.addEventListener("click", function () {
            if (standalone()) { tip('<span class="de-inst-ok">✓ راك ديجا ف التطبيق.</span>'); return; }
            if (deferred) {
                deferred.prompt();
                deferred.userChoice.then(function (c) {
                    if (c && c.outcome === "accepted") { store(INSTALLED_KEY, "1"); if (sheet) sheet.done(); }
                }).finally(function () { deferred = null; });
                return;
            }
            if (isIOS) {
                tip("1. ف Safari ضغط على <b>Partager</b> ⬆️ (لتحت)<br>2. ختار <b>Sur l'écran d'accueil</b> ➕<br>3. ضغط <b>Ajouter</b> — وصافي ✅");
                return;
            }
            if (installedApp || read(INSTALLED_KEY) === "1") {
                tip('<span class="de-inst-ok">✓ التطبيق ديجا مزيد ف هاد الجهاز.</span><br>حلو من الأيقونة ديال sehrgut.');
                return;
            }
            tip(/Android/i.test(navigator.userAgent)
                ? "ف Chrome: ضغط على <b>⋮</b> (فوق) ← <b>Installer l'application</b> ولا <b>Ajouter à l'écran d'accueil</b>."
                : "ف Chrome ولا Edge: ضغط على الأيقونة <b>⊕</b> ف بار العنوان (فوق)، ولا <b>⋮</b> ← <b>Installer sehrgut</b>.");
        });
    }

    window.__deApp = {
        install: install,
        show: function () { store(DISMISS_KEY, null); paint(); },
        askDaily: function () { store(ASK_KEY, null); askDaily(0); }
    };

    /* البطاقة ديال «زيد التطبيق» ما بقاتش كتبان بوحدها: المستعمل كيحل
       «تحميل التطبيق» من القائمة ديال الحساب (site-header.js). */

    /* من بعد التسجيل: النافذة كتطلع دغيا ف الصفحة الرئيسية */
    var justSigned = false;
    try { justSigned = sessionStorage.getItem("de-just-signed-up") === "1"; sessionStorage.removeItem("de-just-signed-up"); } catch (e) { /* خاص */ }
    /* نافذة «بغيتي نفكروك…» ما بقاتش كتطلع بوحدها؛ غير اللي سمح من قبل كنعاودو نسجلوه بلا سؤال */
    if (CARD_PAGES.indexOf(page) !== -1) askDaily(justSigned ? 1500 : 4000, true);
})();
