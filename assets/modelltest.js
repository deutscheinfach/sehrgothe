/* ===== Modelltest: Lesen + Hören بحال telc B2 =====

   Modelltest n = الصفحات الموجودة ديجا، داخل iframe (?embed=1):
     1) Lesen + Sprachbausteine → Lesen Prüfung n        90 دقيقة · 105 نقطة
     2) Hören Teil 1، 2، 3      → Thema n فكل جزء         20 دقيقة ·  75 نقطة
   المجموع 180، النجاح من 108 (60%). Schreiben عندو القسم ديالو بوحدو.
   التصحيح كامل كيكون ف اللخر: ملي كيدوز من جزء للآخر، كنضغطو
   على أزرار التصحيح ديال الجزء اللي سالا (بلا ما يبان).

   النقط كتجي من الأحداث اللي كتصيفطهم الصفحات (lesen-points،
   hoeren-points) — كنسمعو ليهم فـcontentWindow.
   الحالة كتتحفظ فـsessionStorage باش refresh ما يضيعش الامتحان. */

(function () {
    "use strict";

    const root = document.getElementById("mt-root");
    const head = document.getElementById("mt-head");
    if (!root) return;

    const STATE_KEY = "de-mt-state";
    const HOEREN_COUNT = [62, 72, 55];
    const HOEREN_FREE = 5;
    const LESEN_PARTS = ["teil1", "teil2", "teil3", "sprach1", "sprach2"];
    const LESEN_MAX = { teil1: 25, teil2: 25, teil3: 25, sprach1: 15, sprach2: 15 };
    const STEPS = [
        { key: "lesen", name: "Lesen & Sprachbausteine", short: "Lesen", min: 90, max: 105 },
        { key: "hoeren", name: "Hören", short: "Hören", min: 20, max: 75 }
    ];
    const PASS = 108, TOTAL = 180;

    const ICON = {
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        play: '<path d="M7 4v16l13-8z"/>',
        lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
        check: '<path d="m5 12 5 5 9-10"/>',
        x: '<path d="M18 6 6 18M6 6l12 12"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        share: '<path d="M12 3v13"/><path d="m8 7 4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'
    };
    function svg(name) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
    }
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function fmtPts(n) { return (Math.round(n * 2) / 2).toString().replace(".", ","); }
    function pad(n) { return String(n).padStart(2, "0"); }

    /* ---------- القائمة ---------- */
    function lesenExams() {
        const topics = window.LESEN_B2_TOPICS || [];
        const lists = LESEN_PARTS.map(function (p) {
            return topics.filter(function (t) { return (t.parts || []).indexOf(p) !== -1; });
        });
        const count = lists.length ? Math.min.apply(null, lists.map(function (l) { return l.length; })) : 0;
        const out = [];
        for (let i = 0; i < count; i++) {
            const parts = {};
            LESEN_PARTS.forEach(function (p, j) { parts[p] = lists[j][i]; });
            out.push({ parts: parts, locked: LESEN_PARTS.some(function (p) { return parts[p].locked; }) });
        }
        return out;
    }
    function tests() {
        const lesen = lesenExams();
        const count = Math.min(lesen.length, Math.min.apply(null, HOEREN_COUNT));
        const out = [];
        for (let n = 1; n <= count; n++) {
            out.push({
                n: n,
                lesen: lesen[n - 1],
                locked: lesen[n - 1].locked || n > HOEREN_FREE
            });
        }
        return out;
    }
    function premium() { return window.__sehrgutIsPremium === true; }
    function lastResult(n) {
        const P = window.DEProgress;
        if (!P) return null;
        return P.results().filter(function (r) { return r.skill === "modelltest" && r.topic === "modelltest-" + n; }).pop() || null;
    }

    function renderList() {
        if (head) head.hidden = false;
        document.body.classList.remove("has-lesen-bar", "mt-hoeren");
        document.body.classList.remove("mt-running");
        const list = tests();
        document.getElementById("mt-count").textContent = String(list.length);
        root.innerHTML = '<div class="tr-card tr-card-gold" style="margin-bottom:16px"><p class="tr-muted" style="margin:0">' +
            "كل Modelltest فيه جوج أجزاء بالوقت ديالهم بحال الامتحان الحقيقي: Lesen و Hören. جاوب ودوز — <b>التصحيح كامل كيكون ف اللخر</b>. " +
            "فالآخر كتشوف واش <b>Bestanden</b> (من 108 نقطة لفوق). Schreiben تمرن عليه ف القسم ديالو.</p></div>" +
            '<div class="tr-grid tr-grid-3">' + list.map(function (t) {
                const shut = t.locked && !premium();
                const last = lastResult(t.n);
                return '<article class="tr-card mt-card"><h3>Modelltest ' + t.n + "</h3>" +
                    '<ul class="mt-parts">' +
                    "<li><span>Lesen</span><b>" + esc(t.lesen.parts.teil1.title) + " …</b></li>" +
                    "<li><span>Hören</span><b>Thema " + t.n + " · Teil 1–3</b></li>" +
                    '<li><span>Dauer</span><b>110 Min · 180 P</b></li></ul>' +
                    (last ? '<p class="mt-last">آخر نتيجة: <b style="color:var(--accent-text)">' + fmtPts(last.points) + " / " + (last.max || TOTAL) + "</b> · " + new Date(last.at).toLocaleDateString("de-DE") + "</p>" : "") +
                    '<div class="mt-foot"><span class="mt-chip ' + (t.locked ? "prem" : "free") + '">' + (t.locked ? "Premium" : "مجاني") + "</span>" +
                    (shut
                        ? '<a class="tr-btn" href="payment.html">' + svg("lock") + "فتح بـ Premium</a>"
                        : '<button class="tr-btn tr-btn-gold" type="button" data-start="' + t.n + '">' + svg("play") + "بدا الامتحان</button>") +
                    "</div></article>";
            }).join("") + "</div>";
    }

    /* ---------- الحالة ---------- */
    let state = null;
    function saveState() {
        try { sessionStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* */ }
    }
    function loadState() {
        try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || "null"); } catch (e) { return null; }
    }
    function clearState() {
        state = null;
        try { sessionStorage.removeItem(STATE_KEY); } catch (e) { /* */ }
    }

    function start(n) {
        state = { n: n, step: 0, deadline: Date.now() + STEPS[0].min * 60000, lesen: {}, hoeren: {}, sub: 0, saved: false };
        saveState();
        renderExam();
    }

    function sums() {
        const s = state;
        let lesen = 0, sprach = 0, hoeren = 0;
        ["teil1", "teil2", "teil3"].forEach(function (k) { lesen += s.lesen[k] || 0; });
        ["sprach1", "sprach2"].forEach(function (k) { sprach += s.lesen[k] || 0; });
        ["teil1", "teil2", "teil3"].forEach(function (k) { hoeren += s.hoeren[k] || 0; });
        return { lesen: lesen, sprach: sprach, hoeren: hoeren, total: lesen + sprach + hoeren };
    }

    /* ---------- الامتحان ---------- */
    let timer = 0;
    const frames = {};

    function frameUrl(step, sub) {
        const n = state.n;
        if (step === 0) return "b2-lesen.html?pruefung=" + n + "&teil=teil1&embed=1";
        return "b2-hoeren-teil" + (sub + 1) + ".html?thema=" + n + "&embed=1";
    }

    function hook(frame) {
        frame.addEventListener("load", function () {
            let w;
            try { w = frame.contentWindow; w.addEventListener; } catch (e) { return; }
            w.addEventListener("lesen-points", function (e) {
                const d = e.detail || {};
                if (LESEN_MAX[d.part]) { state.lesen[d.part] = Math.min(LESEN_MAX[d.part], Number(d.points) || 0); saveState(); live(); }
            });
            w.addEventListener("hoeren-points", function (e) {
                const d = e.detail || {};
                if (d.total > 0 && /^teil[123]$/.test(d.teil)) {
                    state.hoeren[d.teil] = Math.round(d.right / d.total * 25 * 2) / 2;
                    saveState(); live();
                }
            });
            /* Lesen (embed): «Hören →» ف الجزء اللخر */
            w.addEventListener("exam-next", function () { next(); });
        });
    }

    function live() {
        const el = document.getElementById("mt-live");
        if (!el || !state) return;
        const s = sums();
        const step = STEPS[state.step];
        let now = 0;
        if (step && step.key === "lesen") now = s.lesen + s.sprach;
        if (step && step.key === "hoeren") now = s.hoeren;
        el.innerHTML = step ? "هاد الجزء: <b>" + fmtPts(now) + " / " + step.max + "</b> · المجموع: <b>" + fmtPts(s.total) + " / " + TOTAL + "</b>" : "";
        document.querySelectorAll(".mt-sub [data-sub]").forEach(function (b, i) {
            const k = "teil" + (i + 1);
            const small = b.querySelector("small");
            if (small) small.textContent = state.hoeren[k] != null ? fmtPts(state.hoeren[k]) + "/25" : "";
        });
    }

    function tick() {
        const el = document.getElementById("mt-timer-t");
        if (!el || !state || state.step >= STEPS.length) return;
        const left = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
        el.textContent = pad(Math.floor(left / 60)) + ":" + pad(left % 60);
        document.getElementById("mt-timer").classList.toggle("is-low", left <= 300);
        if (left === 0 && !document.getElementById("mt-timeup")) timeUp();
    }

    function modal(html) {
        const m = document.createElement("div");
        m.className = "tr-modal";
        m.innerHTML = '<div class="tr-card tr-card-gold">' + html + "</div>";
        document.body.appendChild(m);
        return m;
    }

    function timeUp() {
        const step = STEPS[state.step];
        const m = modal('<h2 style="justify-content:center">' + svg("clock") + "سالا الوقت!</h2>" +
            '<p class="tr-muted">الوقت ديال ' + esc(step.name) + " سالا. الأجوبة اللي درتي كيتحسبو.</p>" +
            '<div class="tr-row" style="justify-content:center;margin-top:12px"><button class="tr-btn tr-btn-gold" type="button" id="mt-timeup">' +
            (state.step < STEPS.length - 1 ? "دوز لـ " + esc(STEPS[state.step + 1].short) : "شوف النتيجة") + "</button></div>");
        m.querySelector("#mt-timeup").addEventListener("click", function () { m.remove(); next(); });
    }

    /* التصحيح ديال الجزء اللي سالا، بلا ما يبان: كنضغطو على أزرار
       التصحيح داخل الـiframes، والنقط كتجي بالأحداث العاديين. */
    function gradeStep() {
        const step = STEPS[state.step];
        root.querySelectorAll("iframe.mt-frame").forEach(function (f) {
            let w = null, doc = null;
            try { w = f.contentWindow; doc = f.contentDocument; } catch (e) { return; }
            if (!w || !doc) return;
            if (step.key === "lesen" && typeof w.__examGradeAll === "function") w.__examGradeAll();
            if (step.key === "hoeren") doc.querySelectorAll(".nq-btn-check").forEach(function (b) { b.click(); });
        });
    }

    function next() {
        if (!state || state.step >= STEPS.length) return;
        gradeStep();
        state.step++;
        state.sub = 0;
        if (state.step < STEPS.length) state.deadline = Date.now() + STEPS[state.step].min * 60000;
        saveState();
        renderExam();
    }

    function renderExam() {
        clearInterval(timer);
        Object.keys(frames).forEach(function (k) { delete frames[k]; });
        if (head) head.hidden = true;
        if (state.step >= STEPS.length) { document.body.classList.remove("mt-running"); renderResult(); return; }
        document.body.classList.add("mt-running");
        const step = STEPS[state.step];

        let body = "";
        if (step.key === "hoeren") {
            body += '<div class="mt-sub">' + [1, 2, 3].map(function (k, i) {
                return '<button type="button" data-sub="' + i + '" class="' + (i === state.sub ? "is-on" : "") + '">Teil ' + k + "<small></small></button>";
            }).join("") + "</div>";
            body += [0, 1, 2].map(function (i) {
                return '<iframe class="mt-frame" data-frame="' + i + '" title="Hören Teil ' + (i + 1) + '"' + (i === state.sub ? "" : " hidden") + ' src="' + frameUrl(1, i) + '"></iframe>';
            }).join("");
        } else {
            body += '<iframe class="mt-frame" data-frame="0" title="' + esc(step.name) + '" src="' + frameUrl(state.step, 0) + '"></iframe>';
        }

        root.innerHTML =
            '<div class="mt-bar"><button class="tr-btn mt-exit" type="button" data-act="exit" title="خرج من الامتحان" dir="ltr">← رجوع</button>' +
            '<span class="mt-title">Modelltest ' + state.n + '</span><div class="mt-steps">' +
            STEPS.map(function (s, i) {
                return '<span class="mt-step ' + (i === state.step ? "is-now" : i < state.step ? "is-done" : "") + '">' + (i < state.step ? svg("check").replace("<svg", '<svg width="14" height="14"') : (i + 1) + ".") + " " + esc(s.short) + "</span>";
            }).join("") + '<span class="mt-step">4. Ergebnis</span></div>' +
            '<span class="mt-timer" id="mt-timer" title="Restzeit">' + svg("clock") + '<span id="mt-timer-t">--:--</span></span></div>' +
            '<p class="mt-live" id="mt-live"></p>' + body +
            '<div class="mt-next"><button class="tr-btn tr-btn-red" type="button" data-act="abort">' + svg("x") + "وقف الامتحان</button>" +
            '<button class="tr-btn tr-btn-gold" type="button" data-act="next">' +
            (state.step < STEPS.length - 1 ? "دوز لـ " + esc(STEPS[state.step + 1].short) : "شوف النتيجة") + svg("arrow") + "</button></div>" +
            (step.key === "hoeren"
                /* نفس الشريط الثابت ديال Lesen: «تحقق» على اليسار،
                   «السابق» و «Hören Teil 2 →» على اليمين. */
                ? '<div class="lesen-bar" data-exam="live"><div class="lesen-bar-slot">' +
                  '<button type="button" class="lesen-btn lesen-btn-check" data-act="hcheck" dir="rtl">تحقق من الإجابات</button></div>' +
                  '<div class="lesen-bar-extra"><div class="lesen-actions exam-bar">' +
                  '<button type="button" class="lesen-btn lesen-btn-show exam-bar-prev" data-act="subprev" dir="rtl">السابق</button>' +
                  '<button type="button" class="lesen-btn lesen-btn-check exam-bar-main" data-act="subnext" dir="ltr"></button>' +
                  "</div></div></div>"
                : "");
        document.body.classList.toggle("has-lesen-bar", step.key === "hoeren");
        document.body.classList.toggle("mt-hoeren", step.key === "hoeren");

        root.querySelectorAll("iframe.mt-frame").forEach(function (f) { hook(f); });
        paintSubNav();
        live();
        tick();
        timer = setInterval(tick, 1000);
        window.scrollTo({ top: 0 });
    }

    /* Hören: أسهم بين Teil 1 → 2 → 3، ومن Teil 3 «شوف النتيجة →».
       نفس الزر لتحت (mt-next) كيتبدل حسب الجزء. */
    function paintSubNav() {
        const step = STEPS[state.step];
        if (!step || step.key !== "hoeren") return;
        const last = state.sub >= 2;
        const main = root.querySelector(".lesen-bar .exam-bar-main");
        const prev = root.querySelector(".lesen-bar .exam-bar-prev");
        if (main) {
            main.dataset.act = last ? "next" : "subnext";
            main.textContent = last
                ? (state.step < STEPS.length - 1 ? STEPS[state.step + 1].short + " →" : "شوف النتيجة →")
                : "Hören Teil " + (state.sub + 2) + " →";
        }
        if (prev) prev.disabled = state.sub === 0;
    }

    /* «تحقق» ديال الشريط كيضغط على «Antworten prüfen» ديال الجزء اللي باين */
    function checkHoeren() {
        const frame = root.querySelector('iframe.mt-frame[data-frame="' + state.sub + '"]');
        let doc = null;
        try { doc = frame && frame.contentDocument; } catch (e) { /* */ }
        if (!doc) return;
        const btns = doc.querySelectorAll(".nq-btn-check");
        btns.forEach(function (b) { b.click(); });
        const res = doc.querySelector(".nq-result-box");
        if (res && res.scrollIntoView) res.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function setSub(i) {
        state.sub = Math.max(0, Math.min(2, i));
        saveState();
        root.querySelectorAll(".mt-sub [data-sub]").forEach(function (b, k) { b.classList.toggle("is-on", k === state.sub); });
        root.querySelectorAll("iframe.mt-frame").forEach(function (f, k) { f.hidden = k !== state.sub; });
        paintSubNav();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    let shareData = null;

    function shareResult() {
        if (!shareData || !window.DEShare) return;
        let streak = 0;
        try { streak = (window.DEProgress && window.DEProgress.streak()) || 0; } catch (e) { /* */ }
        window.DEShare.open({
            kind: "modelltest-" + state.n,
            title: "Modelltest " + state.n + " · telc B2",
            score: Math.round(shareData.total * 2) / 2,
            max: TOTAL,
            pass: shareData.pass,
            rows: shareData.rows.map(function (r) { return [r[0], r[1], r[2]]; }),
            streak: streak,
            shareText: (shareData.pass ? "نجحت ف Modelltest " : "درت Modelltest ") + state.n +
                " — " + (Math.round(shareData.total * 2) / 2) + "/" + TOTAL + " 💪"
        });
    }

    function renderResult() {
        clearInterval(timer);
        const s = sums();
        const pass = s.total >= PASS;
        if (!state.saved && window.DEProgress) {
            window.DEProgress.add({
                skill: "modelltest", part: "schriftlich", topic: "modelltest-" + state.n, title: "Modelltest " + state.n,
                points: s.total, max: TOTAL,
                detail: { lesen: s.lesen, sprach: s.sprach, hoeren: s.hoeren }
            });
            state.saved = true;
            saveState();
        }
        const rows = [
            ["Leseverstehen", s.lesen, 75, "b2-lesen.html?teil=teil1"],
            ["Sprachbausteine", s.sprach, 30, "b2-lesen.html?teil=sprach1"],
            ["Hörverstehen", s.hoeren, 75, "b2-hoeren.html"]
        ];
        const weakest = rows.slice().sort(function (a, b) { return a[1] / a[2] - b[1] / b[2]; })[0];
        root.innerHTML = '<div class="tr-card tr-card-gold mt-result">' +
            '<span class="mt-verdict ' + (pass ? "pass" : "fail") + '">' + svg(pass ? "check" : "x").replace("<svg", '<svg width="18" height="18"') + (pass ? "Bestanden · نجحتي" : "Nicht bestanden · مازال") + "</span>" +
            '<div class="mt-total">' + fmtPts(s.total) + " <small>/ " + TOTAL + "</small></div>" +
            '<p class="tr-muted">' + Math.round(s.total / TOTAL * 100) + "% — خاصك " + PASS + " نقطة (60%) باش تنجح ف Lesen و Hören.</p>" +
            '<div class="mt-break">' + rows.map(function (r) {
                const p = r[1] / r[2];
                return '<div class="tr-skill"><div class="tr-skill-name">' + esc(r[0]) + '</div><div class="tr-bar"><i class="' + (p >= 0.8 ? "is-good" : p >= 0.6 ? "is-mid" : "is-low") + '" style="width:' + Math.round(p * 100) + '%"></i></div>' +
                    '<div class="tr-skill-pct">' + fmtPts(r[1]) + "/" + r[2] + "</div></div>";
            }).join("") + "</div>" +
            '<p class="tr-muted tr-section">نصيحة: الجزء اللي خاصو تمرين أكثر هو <b>' + esc(weakest[0]) + "</b>.</p>" +
            '<div class="tr-row" style="justify-content:center;margin-top:14px">' +
            (window.DEShare
                ? '<button class="tr-btn tr-btn-gold" type="button" data-act="share">' + svg("share").replace("<svg", '<svg width="16" height="16"') + "شارك النتيجة</button>"
                : "") +
            '<a class="tr-btn" dir="rtl" href="' + weakest[3] + '">' + "تمرن على " + esc(weakest[0]) + "</a>" +
            '<a class="tr-btn" href="fortschritt.html">التقدم ديالي</a>' +
            '<button class="tr-btn" type="button" data-act="list">كل الامتحانات</button></div></div>';
        shareData = { rows: rows, total: s.total, pass: pass };
        window.scrollTo({ top: 0 });
    }

    /* ---------- الأحداث ---------- */
    root.addEventListener("click", function (e) {
        const startBtn = e.target.closest("[data-start]");
        if (startBtn) {
            const n = Number(startBtn.dataset.start);
            const m = modal('<h2 style="justify-content:center">' + svg("play") + "Modelltest " + n + " starten?</h2>" +
                '<p class="tr-muted">جوج أجزاء: Lesen & Sprachbausteine (90 د) و Hören (20 د). الوقت كيبدا دابا. جاوب ودوز — التصحيح كامل ف اللخر.</p>' +
                '<div class="tr-row" style="justify-content:center;margin-top:12px"><button class="tr-btn" type="button" data-no>من بعد</button><button class="tr-btn tr-btn-gold" type="button" data-yes>يلاه نبداو</button></div>');
            m.querySelector("[data-no]").addEventListener("click", function () { m.remove(); });
            m.querySelector("[data-yes]").addEventListener("click", function () { m.remove(); start(n); });
            return;
        }
        const sub = e.target.closest("[data-sub]");
        if (sub && state) { setSub(Number(sub.dataset.sub)); return; }
        const act = e.target.closest("[data-act]");
        if (!act) return;
        if (act.dataset.act === "share") { shareResult(); return; }
        if (act.dataset.act === "next") next();
        if (act.dataset.act === "subnext" && state) setSub(state.sub + 1);
        if (act.dataset.act === "hcheck" && state) checkHoeren();
        if (act.dataset.act === "subprev" && state) setSub(state.sub - 1);
        /* الخروج (فوق) و «وقف الامتحان» (لتحت): الضغطة الأولى كتسول ف الزر نيت،
           الثانية (ف 4 ثواني) كتخرج للائحة وكتمسح الامتحان — باش ملي يرجع
           يلقى اللائحة ويختار Modelltest آخر، ماشي نفس الامتحان. */
        if (act.dataset.act === "exit" || act.dataset.act === "abort") {
            if (act.dataset.armed) { clearInterval(timer); clearState(); renderList(); window.scrollTo({ top: 0 }); return; }
            act.dataset.armed = "1";
            act.dataset.label = act.innerHTML;
            act.textContent = "متأكد؟ كليكي مرة خرى";
            setTimeout(function () {
                if (!act.isConnected) return;
                delete act.dataset.armed;
                act.innerHTML = act.dataset.label;
            }, 4000);
            return;
        }
        if (act.dataset.act === "list") { clearState(); renderList(); }
    });

    /* بلا نافذة «Quitter le site ?» ملي كيخرج: الامتحان محفوظ ف sessionStorage
       وكيكمل فين وقف إلا رجع. */
    document.addEventListener("de-premium", function () { if (!state) renderList(); });

    state = loadState();
    if (state && state.n) renderExam();
    else renderList();
})();
