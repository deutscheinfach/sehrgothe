/* ===== «إرسال ملاحظة» — بلاغ على خطأ (بحال Zertify) =====

   كيزيد زر «🚩 إرسال ملاحظة» ف:
     - رأس التمرين ديال Lesen و Sprechen (.lesen-detail-head)
     - البار ديال الامتحان ديال Lesen (.exam-top-inner)
     - كل تيما ديال Hören (.native-quiz-wrap)
     - صفحات Schreiben (حدا #task-title)
   النافذة: نوع الخطأ، رقم النص/السؤال، ملاحظة. كتتحفظ ف Firestore
   reports/{id} (غير اللي داخل بحسابو كيكتب، غير الأدمين كيقرا)،
   وكتبان ف admin.html. */
(function () {
    "use strict";
    if (window.__deReport) return;

    var FB = "https://www.gstatic.com/firebasejs/12.18.0/";
    var file = (location.pathname.split("/").pop() || "").toLowerCase();
    var SECTION = (file.match(/(lesen|hoeren|schreiben|sprechen)/) || [])[1] || "";
    var LEVEL = (file.match(/^(b1|b2)-/) || [])[1] || "";
    if (!SECTION) return;
    var SECTION_DE = { lesen: "Lesen", hoeren: "Hören", schreiben: "Schreiben", sprechen: "Sprechen" }[SECTION];

    var TYPES = SECTION === "hoeren"
        ? ["خطأ ف الجواب (Richtig/Falsch)", "خطأ ف الجملة ولا الإملاء", "خطأ ف الترجمة", "مشكل ف الصوت", "مشكل تقني", "اقتراح"]
        : ["خطأ ف الإجابة", "خطأ ف النص ولا الإملاء", "خطأ ف الترجمة", "مشكل تقني", "اقتراح"];

    /* ---------- الستايل ---------- */
    var css = document.createElement("style");
    css.textContent =
        ".rp-btn{display:inline-flex;align-items:center;gap:7px;border:1.5px solid #e11d48;color:#e11d48;background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer;white-space:nowrap;direction:rtl}" +
        ".rp-btn:hover{background:#fff1f3}.rp-btn svg{width:15px;height:15px}" +
        ".rp-btn.rp-sm{padding:5px 11px;font-size:12.5px}" +
        "html[data-theme=dark] .rp-btn,html.dark .rp-btn{background:transparent}" +
        ".rp-bg{position:fixed;inset:0;z-index:2000;background:rgba(15,10,12,.55);display:flex;align-items:center;justify-content:center;padding:16px;animation:rp-f .18s ease}" +
        "@keyframes rp-f{from{opacity:0}to{opacity:1}}" +
        ".rp{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1f2430;border-radius:26px;box-shadow:0 30px 80px rgba(0,0,0,.4);padding:24px 26px 22px;direction:rtl;font-family:Cairo,system-ui,sans-serif;animation:rp-in .25s cubic-bezier(.2,.9,.3,1.15)}" +
        "@keyframes rp-in{from{transform:translateY(14px) scale(.98);opacity:0}to{transform:none;opacity:1}}" +
        ".rp-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px}" +
        ".rp-head h2{margin:0;font-size:21px;font-weight:900;display:flex;align-items:center;gap:8px}.rp-head h2 svg{color:#e11d48;width:20px;height:20px}" +
        ".rp-head small{display:block;color:#8a8f9c;font-size:11.5px;font-weight:800;letter-spacing:.06em;direction:ltr;text-align:right}" +
        ".rp-x{margin-inline-start:auto;border:0;background:transparent;font-size:26px;line-height:1;color:#8a8f9c;cursor:pointer}" +
        ".rp label{display:block;font-size:12.5px;font-weight:800;color:#6b7180;margin:14px 0 7px}" +
        ".rp select,.rp textarea{width:100%;box-sizing:border-box;border:1px solid #e3e5ec;background:#f7f8fb;border-radius:14px;padding:12px 14px;font:inherit;font-size:15px;color:#1f2430}" +
        ".rp textarea{min-height:92px;resize:vertical}" +
        ".rp-chips{display:flex;flex-wrap:wrap;gap:8px}" +
        ".rp-chip{flex:1 1 88px;border:1px solid #e3e5ec;background:#f7f8fb;border-radius:12px;padding:8px 10px;font:inherit;font-weight:800;font-size:14px;color:#3a4050;cursor:pointer}" +
        ".rp-chip small{font-weight:700;color:#9aa0ad;margin-inline-start:4px}" +
        ".rp-chip.on{border-color:#e11d48;background:#fff1f3;color:#e11d48}" +
        ".rp-meta{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;margin:16px 0 14px;font-size:12px;color:#8a8f9c;font-weight:700}" +
        ".rp-meta b{color:#3a4050}.rp-meta .rp-var{background:#e8f8ef;color:#15803d;border-radius:999px;padding:1px 10px}" +
        ".rp-send{width:100%;border:0;border-radius:16px;padding:14px;background:#e11d48;color:#fff;font:inherit;font-weight:900;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}" +
        ".rp-send svg,.rp-head h2 svg{width:18px;height:18px;flex:0 0 auto}" +
        ".rp-send:disabled{opacity:.6;cursor:default}" +
        ".rp-msg{text-align:center;font-weight:800;margin-top:12px;font-size:14px}.rp-msg.ok{color:#15803d}.rp-msg.bad{color:#b42318}" +
        ".rp-msg a{color:#e11d48}" +
        "html[data-theme=dark] .rp{background:#1d1a1c;color:#f1ece4}html[data-theme=dark] .rp select,html[data-theme=dark] .rp textarea,html[data-theme=dark] .rp-chip{background:#2a2427;border-color:#3d3437;color:#f1ece4}" +
        "html[data-theme=dark] .rp-meta b{color:#f1ece4}";
    document.head.appendChild(css);

    var FLAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></svg>';

    function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

    function makeBtn(small) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "rp-btn" + (small ? " rp-sm" : "");
        b.innerHTML = FLAG + "<span>إرسال ملاحظة</span>";
        return b;
    }

    /* ---------- السياق: شنو التمرين اللي فيه ---------- */
    function visibleIn(root, sel) {
        return Array.from((root || document).querySelectorAll(sel)).filter(function (e) { return e.getClientRects().length; });
    }
    function context(opts) {
        var q = new URLSearchParams(location.search);
        var ctx = {
            section: SECTION, level: LEVEL,
            thema: opts.title || "",
            teil: q.get("teil") || ((file.match(/teil(\d)/) || [])[0] || ""),
            variant: "", count: 0, unit: "النص"
        };
        if (!ctx.thema && q.get("pruefung")) ctx.thema = "Prüfung " + q.get("pruefung");
        if (!ctx.thema) {
            var tt = document.getElementById("task-title");
            if (tt) ctx.thema = tt.textContent.trim();
        }
        var exam = document.querySelector(".exam-top-title");
        if (exam && opts.exam) ctx.thema = (ctx.thema ? ctx.thema + " · " : "") + exam.textContent.trim();
        var v = visibleIn(document, ".t1-variant.active")[0];
        if (v) ctx.variant = v.textContent.trim();
        var scope = opts.scope || document;
        var texts = visibleIn(scope, ".t1-text:not(.t3-ad)").length;
        var qs = visibleIn(scope, ".t2-q").length;
        var sits = visibleIn(scope, ".t3-sit").length || visibleIn(scope, ".t3-select").length;
        var rows = visibleIn(scope, "[data-answer]").length;
        if (sits) { ctx.count = sits; ctx.unit = "الوضعية"; ctx.first = 11; }
        else if (qs) { ctx.count = qs; ctx.unit = "السؤال"; }
        else if (rows) { ctx.count = rows; ctx.unit = "الجملة"; }
        else if (texts) { ctx.count = texts; ctx.unit = "النص"; }
        return ctx;
    }

    /* ---------- Firebase ---------- */
    var fb = null;
    function firebase() {
        if (fb) return fb;
        fb = Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")])
            .then(function (m) {
                var app = m[0].getApps().length ? m[0].getApp() : m[0].initializeApp({
                    apiKey: "AIzaSyDHMmaHLYRRHfdRDj-hf7s5LOqeWPTiOxU",
                    authDomain: "deutsch-einfach-4c81f.firebaseapp.com",
                    projectId: "deutsch-einfach-4c81f",
                    storageBucket: "deutsch-einfach-4c81f.firebasestorage.app",
                    messagingSenderId: "152448766933",
                    appId: "1:152448766933:web:f7824c4db8ab3caccbe35c"
                });
                var auth = m[1].getAuth(app);
                return new Promise(function (resolve) {
                    var stop = m[1].onAuthStateChanged(auth, function (u) {
                        stop();
                        resolve({ user: u, fs: m[2], db: m[2].getFirestore(app) });
                    });
                });
            });
        fb.catch(function () { fb = null; });
        return fb;
    }

    /* ---------- النافذة ---------- */
    function openModal(opts) {
        var ctx = context(opts || {});
        var bg = document.createElement("div");
        bg.className = "rp-bg";
        var chips = "";
        if (ctx.count) {
            var start = ctx.first || 1;
            for (var i = 0; i < ctx.count; i++) {
                chips += '<button type="button" class="rp-chip" data-n="' + (start + i) + '"><small>' + ctx.unit + "</small> " + (start + i) + "</button>";
            }
        }
        var teilLabel = ctx.teil ? ctx.teil.replace(/^teil/i, "Teil ").replace(/^sprach/i, "Sprach ") : "";
        bg.innerHTML =
            '<div class="rp" role="dialog" aria-modal="true" aria-labelledby="rp-h">' +
            '<div class="rp-head"><div><h2 id="rp-h">' + FLAG + "إرسال ملاحظة</h2><small>" +
            esc((SECTION_DE + " " + teilLabel).trim().toUpperCase()) + '</small></div><button type="button" class="rp-x" aria-label="سد">×</button></div>' +
            '<label for="rp-type">نوع الخطأ</label><select id="rp-type">' +
            TYPES.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select>" +
            (chips ? "<label>اختار " + esc(ctx.unit) + " اللي فيه المشكل</label><div class=\"rp-chips\">" + chips + "</div>" : "") +
            '<label for="rp-note">ملاحظات إضافية (علاش هادا خطأ؟)</label>' +
            '<textarea id="rp-note" maxlength="1000" placeholder="شرح لينا علاش كتظن بلي كاين خطأ، ولا شنو هو الجواب الصحيح (اختياري)…"></textarea>' +
            '<div class="rp-meta">' +
            (ctx.thema ? "<span>THEMA: <b>" + esc(ctx.thema) + "</b></span>" : "") +
            (teilLabel ? "<span>TEIL: <b>" + esc(SECTION_DE + " " + teilLabel) + "</b></span>" : "") +
            (ctx.variant ? '<span class="rp-var">' + esc(ctx.variant) + "</span>" : "") +
            (ctx.level ? "<span><b>" + ctx.level.toUpperCase() + "</b></span>" : "") +
            "</div>" +
            '<button type="button" class="rp-send">' + FLAG + "إرسال الملاحظة</button>" +
            '<p class="rp-msg" hidden></p></div>';
        document.body.appendChild(bg);

        var picked = null;
        bg.querySelectorAll(".rp-chip").forEach(function (c) {
            c.addEventListener("click", function () {
                picked = c.classList.contains("on") ? null : Number(c.dataset.n);
                bg.querySelectorAll(".rp-chip").forEach(function (o) { o.classList.toggle("on", Number(o.dataset.n) === picked); });
            });
        });
        function close() { bg.remove(); document.removeEventListener("keydown", onKey); }
        function onKey(e) { if (e.key === "Escape") close(); }
        document.addEventListener("keydown", onKey);
        bg.querySelector(".rp-x").addEventListener("click", close);
        bg.addEventListener("click", function (e) { if (e.target === bg) close(); });

        var send = bg.querySelector(".rp-send"), msg = bg.querySelector(".rp-msg");
        function say(text, cls) { msg.hidden = false; msg.className = "rp-msg " + (cls || ""); msg.innerHTML = text; }

        send.addEventListener("click", function () {
            send.disabled = true;
            say("كنصيفطو…");
            firebase().then(function (f) {
                if (!f.user) {
                    send.disabled = false;
                    say('خاصك تكون داخل بحسابك باش تصيفط ملاحظة — <a href="login.html">الدخول</a>', "bad");
                    return;
                }
                var data = {
                    uid: f.user.uid,
                    email: f.user.email || "",
                    name: f.user.displayName || "",
                    type: bg.querySelector("#rp-type").value,
                    item: picked,
                    note: bg.querySelector("#rp-note").value.trim().slice(0, 1000),
                    section: ctx.section,
                    level: ctx.level,
                    thema: String(ctx.thema || "").slice(0, 200),
                    teil: ctx.teil,
                    variant: ctx.variant,
                    url: (location.pathname.split("/").pop() || "index.html") + location.search,
                    status: "new",
                    createdAt: f.fs.serverTimestamp()
                };
                return f.fs.addDoc(f.fs.collection(f.db, "reports"), data).then(function () {
                    send.remove();
                    say("✅ شكرا! وصلات الملاحظة ديالك، وغادي نشوفوها ف أقرب وقت.", "ok");
                    setTimeout(close, 2200);
                });
            }).catch(function (e) {
                send.disabled = false;
                say("ما قدرناش نصيفطو دابا — عاود من بعد. " + esc((e && e.code) || ""), "bad");
            });
        });
    }

    /* ---------- فين كيتزاد الزر ---------- */
    function inject() {
        document.querySelectorAll(".lesen-detail-head:not([data-rp])").forEach(function (head) {
            head.setAttribute("data-rp", "");
            var b = makeBtn(false);
            b.style.marginInlineStart = "auto";
            b.addEventListener("click", function () { openModal({ title: head.dataset.reportTitle || "" }); });
            head.appendChild(b);
        });
        document.querySelectorAll(".exam-top-inner:not([data-rp])").forEach(function (bar) {
            bar.setAttribute("data-rp", "");
            var b = makeBtn(true);
            b.title = "إرسال ملاحظة"; b.setAttribute("aria-label", "إرسال ملاحظة");
            b.addEventListener("click", function () { openModal({ exam: true }); });
            var clock = bar.querySelector(".exam-top-clock");
            bar.insertBefore(b, clock || null);
        });
        document.querySelectorAll(".native-quiz-wrap:not([data-rp])").forEach(function (wrap) {
            wrap.setAttribute("data-rp", "");
            var item = wrap.closest(".theme-item");
            var label = item && item.querySelector(".theme-item-title, .theme-item-header");
            var title = label ? label.textContent.replace(/\s+/g, " ").trim().slice(0, 120) : "";
            var row = document.createElement("div");
            row.style.cssText = "display:flex;justify-content:flex-end;margin:0 0 10px";
            var b = makeBtn(true);
            b.addEventListener("click", function () { openModal({ title: title, scope: wrap }); });
            row.appendChild(b);
            wrap.insertBefore(row, wrap.firstChild);
        });
        var tt = document.getElementById("task-title");
        if (SECTION === "schreiben" && tt && !tt.hasAttribute("data-rp")) {
            tt.setAttribute("data-rp", "");
            var b = makeBtn(true);
            b.addEventListener("click", function () { openModal({}); });
            /* ف الشريط مع باقي الأزرار (قبل كان بين العنوان والسطر الصغير) */
            var right = document.querySelector(".task-header .right");
            if (right) {
                b.classList.add("rp-head-btn");
                b.title = "إرسال ملاحظة";
                b.setAttribute("aria-label", "إرسال ملاحظة");
                right.insertBefore(b, right.firstChild);
            } else {
                b.style.margin = "8px 0 0";
                tt.insertAdjacentElement("afterend", b);
            }
        }
    }

    var queued = false;
    new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; inject(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
    inject();

    window.__deReport = { open: openModal };
})();
