/* ===== Mein Fortschritt =====

   كيقرا DEProgress (assets/progress.js) وكيرسم:
   - العد التنازلي للامتحان مع اختيار التاريخ
   - خطة اليوم (كتتحسب مرة وحدة فالنهار باش ما تبدلش ملي تخدم)
   - المستوى فكل مهارة، منحنى آخر النتائج، النقط الضعيفة
   - آخر النتائج + روابط Modelltest و Wortschatz */

(function () {
    "use strict";

    const P = window.DEProgress;
    const root = document.getElementById("fs-root");
    if (!P || !root) return;

    const SKILLS = [
        { key: "lesen", name: "Lesen", ar: "القراءة", parts: ["teil1", "teil2", "teil3"] },
        { key: "sprach", name: "Sprachbausteine", ar: "القواعد", parts: ["sprach1", "sprach2"] },
        { key: "hoeren", name: "Hören", ar: "الاستماع", parts: ["teil1", "teil2", "teil3"] },
        { key: "schreiben", name: "Schreiben", ar: "الكتابة", parts: ["brief"] },
        { key: "sprechen", name: "Sprechen", ar: "الهضرة", parts: ["teil1", "teil2", "teil3"] }
    ];

    const ICON = {
        target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
        bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
        chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
        alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        check: '<path d="m5 12 5 5 9-10"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/>',
        cards: '<rect x="3" y="5" width="14" height="16" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v14"/>',
        cloud: '<path d="M17.5 19H7a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 11a4 4 0 0 1-1.5 8z"/>',
        share: '<path d="M12 3v13"/><path d="m8 7 4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'
    };
    function svg(name, cls) {
        return '<svg class="' + (cls || "ico") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
    }
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function pct(r) { return r.max > 0 ? r.points / r.max : 0; }
    function tone(p) { return p >= 0.8 ? "is-good" : p >= 0.6 ? "is-mid" : "is-low"; }

    function partLabel(skill, part) {
        const n = String(part || "").replace(/\D+/g, "");
        switch (skill) {
            case "lesen": return "Lesen Teil " + n;
            case "sprach": return "Sprachbausteine " + n;
            case "hoeren": return "Hören Teil " + n;
            case "sprechen": return "Sprechen Teil " + n;
            case "schreiben": return "Schreiben";
            case "modelltest": return "Modelltest";
            default: return skill;
        }
    }
    function partLink(skill, part) {
        switch (skill) {
            case "lesen": case "sprach": return "b2-lesen.html?teil=" + part;
            case "hoeren": return "b2-hoeren-" + part + ".html";
            case "sprechen": return "b2-sprechen.html?teil=" + part;
            case "schreiben": return "b2-schreiben.html";
            default: return "modelltest.html";
        }
    }
    function avg(list) {
        if (!list.length) return null;
        return list.reduce(function (a, r) { return a + pct(r); }, 0) / list.length;
    }
    function skillAvg(results, key, part) {
        const list = results.filter(function (r) { return r.skill === key && (!part || r.part === part); }).slice(-10);
        return { avg: avg(list), n: list.length };
    }

    /* ---------- خطة اليوم ---------- */
    function planKey() { return "de-plan-" + P.today(); }
    function buildPlan(results) {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(planKey()) || "null"); } catch (e) { /* */ }
        if (saved && Array.isArray(saved.plan) && (saved.n > 0 || !results.length)) return saved.plan;

        const cand = [];
        SKILLS.forEach(function (s, si) {
            s.parts.forEach(function (part, pi) {
                const a = skillAvg(results, s.key, part);
                cand.push({ skill: s.key, part: part, avg: a.avg, order: si * 3 + pi });
            });
        });
        /* اللي عمرو ما تخدم أولا (كيتدوّر مع الأيام)، من بعد الأضعف */
        const day = Math.floor(Date.now() / 86400000);
        cand.sort(function (a, b) {
            if ((a.avg === null) !== (b.avg === null)) return a.avg === null ? -1 : 1;
            if (a.avg === null) return ((a.order + day) % 14) - ((b.order + day) % 14);
            return a.avg - b.avg;
        });
        const plan = [];
        const usedSkills = {};
        cand.forEach(function (c) {
            if (plan.length >= 2 || usedSkills[c.skill]) return;
            usedSkills[c.skill] = true;
            plan.push({ type: "part", skill: c.skill, part: c.part });
        });
        plan.push({ type: "vocab" });
        const left = P.daysToExam();
        const lastMt = results.filter(function (r) { return r.skill === "modelltest"; }).pop();
        if (left !== null && left >= 0 && left <= 30 && (!lastMt || Date.now() - lastMt.at > 6 * 86400000)) {
            plan.push({ type: "modelltest" });
        }
        try { localStorage.setItem(planKey(), JSON.stringify({ plan: plan, n: results.length })); } catch (e) { /* */ }
        return plan;
    }
    function isToday(ts) { return P.today(new Date(ts)) === P.today(); }

    function planHtml(results) {
        const plan = buildPlan(results);
        const vocab = window.DE_VOCAB;
        const items = plan.map(function (t) {
            let title, sub, href, done;
            if (t.type === "part") {
                const a = skillAvg(results, t.skill, t.part);
                title = partLabel(t.skill, t.part) + " üben";
                sub = a.avg === null ? "مازال ما جربتيهش — بدا بموضوع واحد"
                    : "المعدل ديالك " + Math.round(a.avg * 100) + "% — " +
                      (a.avg < 0.6 ? "خاصو تمرين" : a.avg < 0.8 ? "مزيان، زيد شوية" : "ممتاز، تمرين خفيف باش تبقى فالفورمة");
                href = partLink(t.skill, t.part);
                done = results.some(function (r) { return r.skill === t.skill && r.part === t.part && isToday(r.at); });
            } else if (t.type === "vocab") {
                const due = vocab ? vocab.dueCount() : 0;
                const days = window.DE_WORDS_1000 ? window.DE_WORDS_1000.days() : [];
                const next = days.find(function (d) { return !P.wordDayDone(d.n); });
                const wl = P.wordDays();
                const listDone = Object.keys(wl).some(function (n) { return wl[n] === P.today(); }) || !next;
                title = !listDone ? "10 neue Wörter · Tag " + next.n : due ? "Wortschatz: " + due + " Karten wiederholen" : "Wörter von heute gelernt";
                sub = listDone ? "المراجعة ديال البطاقات" : (next.theme + " — 5 دقايق");
                href = "wortschatz.html";
                done = listDone && !due;
            } else {
                title = "Modelltest machen";
                sub = "الامتحان قرّب — جرب امتحان كامل بالوقت";
                href = "modelltest.html";
                done = results.some(function (r) { return r.skill === "modelltest" && isToday(r.at); });
            }
            return '<li class="' + (done ? "is-done" : "") + '"><a href="' + esc(href) + '">' +
                '<span class="tr-check">' + svg("check", "") + "</span>" +
                '<span><span class="tr-plan-t">' + esc(title) + '</span><span class="tr-plan-s">' + esc(sub) + "</span></span>" +
                '<span class="tr-plan-go">' + svg("arrow", "") + "</span></a></li>";
        });
        const doneN = (items.join("").match(/class="is-done"/g) || []).length;
        return '<div class="tr-card tr-card-gold"><h2>' + svg("list") + "Heute · خطة اليوم" +
            '<span class="tr-muted" style="margin-inline-start:auto;font-weight:700">' + doneN + " / " + items.length + "</span></h2>" +
            '<ul class="tr-plan">' + items.join("") + "</ul></div>";
    }

    /* ---------- العد التنازلي ---------- */
    function countdownHtml() {
        const left = P.daysToExam();
        const C = 2 * Math.PI * 44;
        let big = "–", small = "Datum wählen", frac = 0;
        if (left !== null) {
            if (left > 0) { big = String(left); small = left === 1 ? "Tag" : "Tage"; frac = Math.max(0.04, Math.min(1, left / 90)); }
            else if (left === 0) { big = "0"; small = "Heute! Viel Erfolg"; frac = 1; }
            else { big = "✓"; small = "vorbei"; frac = 1; }
        }
        const note = left === null
            ? "حط تاريخ الامتحان ديالك باش نحسبو ليك شحال بقا وندير ليك خطة."
            : left > 0 ? "بقا ليك " + left + " يوم. كل نهار شوية — أحسن من بزاف فنهار واحد."
            : left === 0 ? "بالتوفيق اليوم! 💪" : "الامتحان داز. حط تاريخ جديد إلا عندك امتحان آخر.";
        return '<div class="tr-card"><h2>' + svg("clock") + "Countdown · الامتحان</h2>" +
            '<div class="tr-count"><div class="tr-ring"><svg viewBox="0 0 100 100"><circle class="tr-ring-track" cx="50" cy="50" r="44" fill="none" stroke-width="8"/>' +
            '<circle class="tr-ring-bar" cx="50" cy="50" r="44" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg>' +
            '<div class="tr-ring-in"><b>' + esc(big) + "</b><span>" + esc(small) + "</span></div></div>" +
            '<div><p class="tr-muted">' + esc(note) + '</p><div class="tr-date"><input type="date" id="fs-date" value="' + esc(P.state.examDate || "") + '" aria-label="Prüfungsdatum">' +
            '<button class="tr-btn tr-btn-gold" type="button" id="fs-date-save">Speichern</button></div></div></div></div>';
    }

    /* ---------- المهارات ---------- */
    function skillsHtml(results) {
        const rows = SKILLS.map(function (s) {
            const a = skillAvg(results, s.key);
            const p = a.avg === null ? null : Math.round(a.avg * 100);
            return '<div class="tr-skill"><div class="tr-skill-name">' + esc(s.name) + "<small>" + esc(s.ar) + "</small></div>" +
                '<div class="tr-bar"><i class="' + (p === null ? "" : tone(a.avg)) + '" style="width:' + (p || 0) + '%"></i></div>' +
                '<div class="tr-skill-pct' + (p === null ? " is-none" : "") + '">' + (p === null ? "—" : p + "%") + "</div></div>";
        });
        return '<div class="tr-card"><h2>' + svg("bars") + "Deine Fertigkeiten</h2>" + rows.join("") +
            '<p class="tr-muted" style="margin-top:8px">المعدل ديال آخر 10 تمارين فكل مهارة. telc كيطلب 60% باش تنجح.</p></div>';
    }

    /* ---------- المنحنى ---------- */
    function chartHtml(results) {
        const list = results.filter(function (r) { return r.skill !== "modelltest"; }).slice(-20);
        if (list.length < 2) {
            return '<div class="tr-card"><h2>' + svg("chart") + "Verlauf</h2><p class=\"tr-muted\">المنحنى كيبان من بعد جوج تمارين على الأقل.</p></div>";
        }
        const W = 600, H = 190, L = 30, R = 10, T = 12, B = 22;
        const x = function (i) { return L + i * (W - L - R) / (list.length - 1); };
        const y = function (p) { return T + (1 - p) * (H - T - B); };
        const pts = list.map(function (r, i) { return [x(i), y(pct(r))]; });
        const line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
        const area = line + " L" + x(list.length - 1).toFixed(1) + " " + y(0) + " L" + x(0).toFixed(1) + " " + y(0) + " Z";
        let grid = "";
        [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
            grid += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>' +
                '<text x="' + (L - 6) + '" y="' + (y(g) + 3) + '" text-anchor="end">' + Math.round(g * 100) + "</text>";
        });
        const dots = pts.map(function (p, i) {
            return '<circle class="dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5"><title>' +
                esc(partLabel(list[i].skill, list[i].part) + ": " + Math.round(pct(list[i]) * 100) + "%") + "</title></circle>";
        }).join("");
        return '<div class="tr-card"><h2>' + svg("chart") + "Verlauf · آخر 20 تمرين</h2>" +
            '<svg class="tr-chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Verlauf der Ergebnisse">' +
            '<defs><linearGradient id="trGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d6b25e" stop-opacity=".35"/><stop offset="1" stop-color="#d6b25e" stop-opacity="0"/></linearGradient></defs>' +
            grid + '<line class="pass" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0.6) + '" y2="' + y(0.6) + '"/>' +
            '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' + dots + "</svg>" +
            '<p class="tr-muted">الخط الأخضر = 60% (النجاح فـtelc).</p></div>';
    }

    /* ---------- النقط الضعيفة ---------- */
    function weakHtml(results) {
        const parts = [];
        SKILLS.forEach(function (s) {
            s.parts.forEach(function (part) {
                const a = skillAvg(results, s.key, part);
                if (a.avg !== null) parts.push({ skill: s.key, part: part, avg: a.avg, n: a.n });
            });
        });
        parts.sort(function (a, b) { return a.avg - b.avg; });
        const weak = parts.slice(0, 3);
        const body = weak.length
            ? '<ul class="tr-list">' + weak.map(function (w) {
                const p = Math.round(w.avg * 100);
                return '<li><span class="tr-tag">' + esc(partLabel(w.skill, w.part)) + '</span><span class="tr-list-main"><b>' +
                    (w.avg < 0.6 ? "خاصو تمرين" : w.avg < 0.8 ? "مزيان — زيد شوية" : "ممتاز") + "</b><span>" + w.n + " محاولات</span></span>" +
                    '<span class="tr-score ' + tone(w.avg) + '">' + p + '%</span><a class="tr-btn" href="' + esc(partLink(w.skill, w.part)) + '">Üben</a></li>';
            }).join("") + "</ul>"
            : '<p class="tr-muted">مازال ما كاينين نتائج كافيين.</p>';
        return '<div class="tr-card"><h2>' + svg("alert") + "Schwachstellen · النقط الضعيفة</h2>" + body + "</div>";
    }

    /* ---------- آخر النتائج ---------- */
    function recentHtml(results) {
        const list = results.slice(-8).reverse();
        const fmt = function (ts) {
            const d = new Date(ts);
            return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        };
        const body = list.length
            ? '<ul class="tr-list">' + list.map(function (r) {
                const pts = String(r.points).replace(".", ",");
                return '<li><span class="tr-tag">' + esc(partLabel(r.skill, r.part)) + '</span><span class="tr-list-main"><b>' + esc(r.title || r.topic || "") +
                    "</b><span>" + fmt(r.at) + '</span></span><span class="tr-score ' + tone(pct(r)) + '">' + pts + " / " + r.max + "</span></li>";
            }).join("") + "</ul>"
            : '<p class="tr-muted">حتى نتيجة مازال.</p>';
        return '<div class="tr-card"><h2>' + svg("target") + "Letzte Ergebnisse</h2>" + body + "</div>";
    }

    function linksHtml() {
        const due = window.DE_VOCAB ? window.DE_VOCAB.dueCount() : 0;
        return '<div class="tr-grid tr-grid-2 tr-section">' +
            '<a class="tr-card tr-link" href="modelltest.html"><span class="tr-kpi-ico">' + svg("exam", "") + '</span><span><b>Modelltest</b><span>امتحان كامل بالوقت، النتيجة من 225</span></span></a>' +
            '<a class="tr-card tr-link" href="wortschatz.html"><span class="tr-kpi-ico">' + svg("cards", "") + '</span><span><b>Wortschatz</b><span>' +
            (due ? due + " بطاقات كتسناك اليوم" : "بطاقات الكلمات ديال B2") + "</span></span></a></div>";
    }

    function emptyHtml() {
        return '<div class="tr-card tr-empty"><b>مرحبا! 👋 مازال ما درتي حتى تمرين.</b>' +
            '<p class="tr-muted">كل تمرين كتصححو كيتسجل هنا أوتوماتيكياً: Lesen، Hören، Schreiben وSprechen.</p>' +
            '<div class="tr-row" style="justify-content:center;margin-top:12px">' +
            '<a class="tr-btn tr-btn-gold" href="b2-lesen.html">Mit Lesen starten</a><a class="tr-btn" href="b2-hoeren.html">Hören</a><a class="tr-btn" href="wortschatz.html">Wortschatz</a></div></div>';
    }

    /* ---------- بطاقة التقدّم اللي كتتشارك ---------- */
    function shareHtml(results) {
        if (!window.DEShare || !results.length) return "";
        return '<div class="tr-row tr-section" style="justify-content:center">' +
            '<button class="tr-btn tr-btn-gold" type="button" id="fs-share">' +
            svg("share", "tr-inline-ico") + "شارك التقدّم ديالك</button></div>";
    }

    function shareProgress(results) {
        if (!window.DEShare) return;
        const scored = results.filter(function (r) { return r.skill !== "modelltest"; });
        const a = avg(scored.slice(-20));
        let days = null;
        try { days = P.daysToExam(); } catch (e) { /* ماكاينش تاريخ */ }
        const streak = P.streak();
        window.DEShare.open({
            mode: "progress",
            kind: "taqaddum",
            streak: streak,
            count: results.length,
            avg: a,
            daysToExam: (typeof days === "number" && days >= 0) ? days : null,
            skills: SKILLS.map(function (sk) {
                return [sk.name, skillAvg(results, sk.key).avg];
            }),
            shareText: (streak > 1 ? streak + " يوم متتالي كنقرا الألمانية 🔥" : "كنقرا الألمانية مع Deutsch Einfach 🔥") +
                (results.length ? " · " + results.length + " تمرين" : "")
        });
    }

    let syncNote = "";
    function render() {
        const results = P.results();
        const scored = results.filter(function (r) { return r.skill !== "modelltest"; });
        document.getElementById("fs-streak").textContent = String(P.streak());
        document.getElementById("fs-count").textContent = String(results.length);
        const a = avg(scored.slice(-20));
        document.getElementById("fs-avg").textContent = a === null ? "–" : Math.round(a * 100) + "%";

        let html = "";
        html += '<div class="tr-grid tr-grid-2">' + countdownHtml() + planHtml(results) + "</div>";
        if (!results.length) {
            html += '<div class="tr-section">' + emptyHtml() + "</div>";
        } else {
            html += '<div class="tr-grid tr-grid-2 tr-section">' + skillsHtml(results) + chartHtml(results) + "</div>";
            html += '<div class="tr-grid tr-grid-2 tr-section">' + weakHtml(results) + recentHtml(results) + "</div>";
        }
        html += linksHtml();
        html += shareHtml(results);
        if (syncNote) html += '<p class="tr-muted tr-section" style="display:flex;align-items:center;gap:8px">' + svg("cloud", "tr-inline-ico") + "<span>" + esc(syncNote) + "</span></p>";
        root.innerHTML = html;

        const sh = document.getElementById("fs-share");
        if (sh) sh.addEventListener("click", function () { shareProgress(results); });

        const save = document.getElementById("fs-date-save");
        if (save) save.addEventListener("click", function () {
            P.setExamDate(document.getElementById("fs-date").value);
            try { localStorage.removeItem(planKey()); } catch (e) { /* */ }
            render();
        });
    }

    render();
    P.onChange(function () { render(); });

    P.sync().then(function (ok) {
        syncNote = ok ? "التقدم ديالك محفوظ فالحساب — كتلقاه فأي جهاز."
                      : "التقدم محفوظ غير فهاد الجهاز. دخل للحساب ديالك باش يتحفظ فأي جهاز.";
        render();
    });
})();
