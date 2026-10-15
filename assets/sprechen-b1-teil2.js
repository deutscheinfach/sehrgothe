/* ===== Sprechen B1 · Teil 2 — Über ein Thema sprechen =====

   فالامتحان: كل واحد عندو رأي قصير (Person A / Person B) على نفس
   الموضوع. كتلخص الرأي اللي عندك، كتعطي رأيك وتجربتك، وكتسول
   الشريك وكتجاوب على كلامو.

   أربعة ديال المراحل:
     1) Texte         — جوج الآراء، الصوت، الترجمة والملخص.
                        تقدر تختار الدور ديالك (A ولا B).
     2) Vorbereiten   — الموقف ديالك، أسئلة للشريك، كلمات
                        (تقدر تزيدهم لـ Wortschatz ديالك) والعبارات.
     3) Modelldialog  — حوار نموذجي بالصوت، ووضع التمرين:
                        الجمل ديالك كيتخباو حتى تقولهم نتا.
     4) Simulation    — الشريك كيهضر بالصوت، ونتا كتجاوب فالدور
                        ديالك. التسجيل + Selbstcheck + النقط.

   شكل التمرين:
   {
     kind: "meinungen",
     a: { de, ar },  b: { de, ar },            // نص الامتحان
     kurzA: [{ de, ar }],  kurzB: [{ de, ar }], // الملخص
     fragen: [{ de, ar }],                     // أسئلة للشريك
     dialog: [{ who: "A"|"B", de, ar }],
     woerter: [{ de, ar }]
   }

   Teil 3 (kind: "planen") كيستعمل نفس المحاكي، ولكن المرحلة 1
   فيها المهمة ديال الامتحان والنقط ديال التخطيط (Zettel):
   {
     kind: "planen",
     aufgabe: ["سطر", …],  aufgabeAr: "…",   // نص الامتحان + الترجمة
     punkte: [{ de, ar }],                    // النقط اللي خاصكم تخططو ليها
     fragen, dialog, woerter                  // بحال Teil 2
   }

   كيستعمل الأدوات ديال sprechen-teil1.js (window.__sprechenKit).
*/

(function () {
    "use strict";

    const TURN_SEC = 45;        // أقصى وقت لكل تدخل ديالك
    const MIN_TALK = 60;        // مجموع الكلام ديالك: الحد الأدنى
    const MAX_TALK = 150;       // … والحد اللي من بعدو كتطول

    const REDEMITTEL = [
        { head: "تلخيص النص ديالك", items: [
            "In meinem Text geht es um … .",
            "Die Person in meinem Text meint, dass … .",
            "Sie findet … gut / nicht so gut, weil … ." ] },
        { head: "الرأي ديالك", items: [
            "Ich finde, dass … .",
            "Meiner Meinung nach … .",
            "Ich bin eher für … , weil … ." ] },
        { head: "التجربة ديالك", items: [
            "Ich habe selbst schon … .",
            "Bei mir ist das so: … .",
            "In meinem Heimatland … ." ] },
        { head: "سول الشريك", items: [
            "Und was steht in deinem Text?",
            "Wie siehst du das?",
            "Hast du damit schon Erfahrungen gemacht?" ] },
        { head: "جاوب على كلامو", items: [
            "Da hast du recht.",
            "Das sehe ich ein bisschen anders.",
            "Das ist ein guter Punkt, aber … ." ] }
    ];

    const REDEMITTEL_PLAN = [
        { head: "اقترح فكرة", items: [
            "Ich schlage vor, dass wir … .",
            "Wie wäre es, wenn wir … ?",
            "Wir könnten doch … ." ] },
        { head: "سول الشريك على رأيو", items: [
            "Was meinst du?",
            "Was hältst du davon?",
            "Hast du eine andere Idee?" ] },
        { head: "وافق ولا اقترح حاجة أخرى", items: [
            "Gute Idee! / Einverstanden.",
            "Das finde ich nicht so gut, weil … .",
            "Ich habe eine andere Idee: … ." ] },
        { head: "عطي سبب", items: [
            "…, weil das billiger ist.",
            "Das ist praktischer, denn … .",
            "Deshalb finde ich … besser." ] },
        { head: "اتافقو فالأخير", items: [
            "Also, wir machen es so: … .",
            "Dann übernehme ich … , und du … .",
            "Gut, dann sind wir uns einig." ] }
    ];

    function render(into, task, topicId) {
        const K = window.__sprechenKit;
        if (!K) { into.textContent = "…"; return; }
        const el = K.el, btn = K.btn, clock = K.clock, store = K.store;

        into.textContent = "";
        const wrap = el("div", "e1 e3");
        const key = function (k) { return "e3-" + (topicId || "x") + "-" + k; };
        const PLAN = task.kind === "planen";
        const TEIL = PLAN ? "Teil 3" : "Teil 2";

        let role = store("e3-role") === "B" ? "B" : "A";
        const other = function () { return role === "A" ? "B" : "A"; };

        /* ---- العنوان والمهمة ---- */
        const head = el("div", "t1-head");
        head.appendChild(el("h2", "t1-title", task.title || (PLAN ? "Gemeinsam etwas planen" : "Über ein Thema sprechen")));
        head.appendChild(el("div", "t1-kicker", PLAN
            ? "SPRECHEN TEIL 3 · B1 · GEMEINSAM ETWAS PLANEN"
            : "SPRECHEN TEIL 2 · B1 · MEINUNGEN AUSTAUSCHEN"));
        head.appendChild(K.arToggle(wrap));
        wrap.appendChild(head);

        const card = el("section", "e1-task");
        card.appendChild(el("span", "e1-task-label", "Aufgabe"));
        if (PLAN) {
            /* نص المهمة ديال الامتحان كما هو، سطر بسطر */
            const de = el("p", "e1-task-de e3-aufgabe");
            [].concat(task.aufgabe || []).forEach(function (line, i) {
                if (i) de.appendChild(document.createElement("br"));
                de.appendChild(document.createTextNode(line));
            });
            card.appendChild(de);
            if (task.aufgabeAr) card.appendChild(K.arBlock(task.aufgabeAr, "المطلوب"));
        } else {
            card.appendChild(el("p", "e1-task-de",
                "Sie haben eine kurze Meinung zu einem Thema gelesen, Ihre Partnerin / Ihr Partner eine andere. " +
                "Berichten Sie kurz, was in Ihrem Text steht. Sagen Sie Ihre Meinung, erzählen Sie von Ihren Erfahrungen " +
                "und sprechen Sie miteinander über das Thema."));
            card.appendChild(K.arBlock(
                "كل واحد قرا رأي مختلف على نفس الموضوع. قول باختصار شنو كاين فالنص ديالك، عطي رأيك وتجربتك، " +
                "وتناقش مع الشريك: سولو وجاوب على كلامو. ما تحبسش الهضرة غير بعد التلخيص.", "المطلوب"));
        }

        /* اختيار الدور */
        const roleBox = el("div", "e3-role");
        roleBox.appendChild(el("span", "e3-role-label", "الدور ديالك:"));
        const roleBtns = {};
        ["A", "B"].forEach(function (r) {
            const b = btn("e3-role-btn", "Person " + r);
            b.addEventListener("click", function () {
                role = r;
                store("e3-role", r);
                paintRole();
                rebuild();
            });
            roleBtns[r] = b;
            roleBox.appendChild(b);
        });
        card.appendChild(roleBox);
        wrap.appendChild(card);

        function paintRole() {
            ["A", "B"].forEach(function (r) { roleBtns[r].classList.toggle("active", r === role); });
        }
        paintRole();

        /* ---- المراحل ---- */
        const STEPS = [
            { key: "read",  n: "1", de: PLAN ? "Planen" : "Texte", ar: PLAN ? "النقط" : "الآراء" },
            { key: "prep",  n: "2", de: "Vorbereiten",  ar: "التحضير" },
            { key: "model", n: "3", de: "Modelldialog", ar: "حوار نموذجي" },
            { key: "sim",   n: "4", de: "Simulation",   ar: "المحاكاة" }
        ];
        const nav = el("nav", "e1-steps e1-steps-4");
        const tabs = {};
        STEPS.forEach(function (s) {
            const b = btn("e1-step", "");
            b.append(el("span", "e1-step-n", s.n), el("span", "e1-step-de", s.de), el("span", "e1-step-ar", s.ar));
            b.addEventListener("click", function () { show(s.key, true); });
            tabs[s.key] = b;
            nav.appendChild(b);
        });
        wrap.appendChild(nav);
        const body = el("div", "e1-body");
        wrap.appendChild(body);
        into.appendChild(wrap);

        let panes = {};
        let sim = null;
        let current = "read";

        function rebuild() {
            if (sim) sim.abort();
            body.textContent = "";
            panes = { read: buildRead(), prep: buildPrep(), model: buildModel() };
            sim = buildSim();
            panes.sim = sim.node;
            Object.keys(panes).forEach(function (k) { panes[k].hidden = true; body.appendChild(panes[k]); });
            show(current, false);
        }

        function show(k, scroll) {
            K.hush();
            current = k;
            Object.keys(panes).forEach(function (x) {
                panes[x].hidden = x !== k;
                tabs[x].classList.toggle("active", x === k);
            });
            if (k !== "sim") sim.abort();
            if (k === "sim") sim.refresh();
            if (scroll) nav.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function cta(text, target) {
            const b = btn("e1-cta", text);
            b.addEventListener("click", function () { show(target, true); });
            return b;
        }

        function listen(text, alt) {
            const b = btn("e1-btn e1-btn-soft e3-listen", "🔊 سمع");
            b.addEventListener("click", function () { K.speak(text, null, alt ? { alt: true } : null); });
            return b;
        }

        function pairList(items, cls) {
            const ul = el("ul", "e3-pairs " + (cls || ""));
            (items || []).forEach(function (it) {
                const li = el("li", "");
                li.appendChild(el("span", "e3-de", it.de));
                if (it.ar) { const ar = el("span", "e3-ar e3-tr", it.ar); ar.dir = "rtl"; li.appendChild(ar); }
                ul.appendChild(li);
            });
            return ul;
        }

        /* ================= 1) الآراء ================= */

        function textCard(who) {
            const t = task[who.toLowerCase()] || {};
            const mine = who === role;
            const box = el("article", "e1-box e3-text" + (mine ? " is-mine" : ""));
            const top = el("div", "e3-text-top");
            top.appendChild(el("h3", "e1-box-title", "Person " + who));
            top.appendChild(el("span", "e3-badge", mine ? "النص ديالك" : "النص ديال الشريك"));
            box.appendChild(top);

            const content = el("div", "e3-text-body");
            content.appendChild(el("p", "e3-text-de", t.de || ""));
            if (t.ar) content.appendChild(K.arBlock(t.ar));
            const kurz = task["kurz" + who];
            if (kurz && kurz.length) {
                content.appendChild(el("span", "e1-peek-label", "Kurz zusammengefasst · باختصار"));
                content.appendChild(pairList(kurz));
            }
            content.appendChild(listen(t.de || "", who === "B"));
            box.appendChild(content);

            /* فالامتحان ما كتشوفش النص ديال الشريك */
            if (!mine) {
                content.hidden = true;
                const reveal = btn("e1-btn e1-btn-soft", "👁 بين النص ديال الشريك");
                box.appendChild(el("p", "e1-box-hint", "فالامتحان ما كتشوفش هاد النص — غادي تعرفو من الشريك."));
                reveal.addEventListener("click", function () { content.hidden = false; reveal.remove(); });
                box.appendChild(reveal);
            }
            return box;
        }

        function buildRead() {
            const pane = el("div", "e1-pane");
            if (PLAN) {
                /* النقط اللي خاصكم تتفاهمو عليها (Zettel mit Notizen) */
                const box = el("section", "e1-box e3-zettel");
                box.appendChild(el("h3", "e1-box-title", "Notizen · النقط اللي خاصكم تخططو ليها"));
                const done = JSON.parse(store(key("done")) || "[]");
                const ul = el("ul", "e3-checks");
                (task.punkte || []).forEach(function (p, i) {
                    const li = el("li", "");
                    const label = el("label", "e3-check");
                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.checked = done.indexOf(i) !== -1;
                    input.addEventListener("change", function () {
                        const now = [];
                        ul.querySelectorAll("input").forEach(function (x, j) { if (x.checked) now.push(j); });
                        store(key("done"), JSON.stringify(now));
                    });
                    const txt = el("span", "");
                    txt.appendChild(el("span", "e3-de", p.de));
                    if (p.ar) { const ar = el("span", "e3-ar e3-tr", p.ar); ar.dir = "rtl"; txt.appendChild(ar); }
                    label.append(input, txt);
                    li.appendChild(label);
                    ul.appendChild(li);
                });
                box.appendChild(ul);
                box.appendChild(el("p", "e1-box-hint",
                    "💡 فالامتحان: تكلمو على كل نقطة، كل واحد يقترح، يسول الشريك ويعطي سبب. ومن بعد اتافقو. " +
                    "علّم ✓ على النقطة ملي تكملوها."));
                box.appendChild(listen([].concat(task.aufgabe || []).join(" "), false));
                pane.appendChild(box);
                pane.appendChild(cta("← التحضير (Vorbereiten)", "prep"));
                return pane;
            }
            pane.appendChild(textCard(role));
            pane.appendChild(textCard(other()));
            pane.appendChild(cta("← التحضير (Vorbereiten)", "prep"));
            return pane;
        }

        /* ================= 2) التحضير ================= */

        function buildPrep() {
            const pane = el("div", "e1-pane");

            /* الموقف ديالك (غير ف Teil 2) */
            const pos = el("section", "e1-box");
            if (PLAN) pos.hidden = true;
            pos.appendChild(el("h3", "e1-box-title", "Ihre Meinung · شنو رأيك؟"));
            const choices = [
                { k: "A", de: "Ich bin eher der Meinung von Person A.", ar: "أنا مع الرأي ديال A" },
                { k: "B", de: "Ich bin eher der Meinung von Person B.", ar: "أنا مع الرأي ديال B" },
                { k: "AB", de: "Beide haben ein bisschen recht.", ar: "بجوج عندهم الحق شوية" }
            ];
            const row = el("div", "e3-choices");
            choices.forEach(function (c) {
                const b = btn("t1-option e3-choice", "");
                b.appendChild(el("span", "e3-de", c.de));
                const ar = el("span", "e3-ar", c.ar); ar.dir = "rtl";
                b.appendChild(ar);
                if (store(key("pos")) === c.k) b.classList.add("active");
                b.addEventListener("click", function () {
                    store(key("pos"), c.k);
                    row.querySelectorAll(".e3-choice").forEach(function (o) { o.classList.remove("active"); });
                    b.classList.add("active");
                });
                row.appendChild(b);
            });
            pos.appendChild(row);
            pos.appendChild(el("p", "e1-box-hint", "💡 من بعد الرأي زيد «weil …» ومثال من الحياة ديالك."));
            pane.appendChild(pos);

            /* أسئلة للشريك */
            if ((task.fragen || []).length) {
                const q = el("section", "e1-box");
                q.appendChild(el("h3", "e1-box-title", PLAN
                    ? "Ideen & Fragen · أفكار وأسئلة للشريك"
                    : "Fragen an den Partner · سول الشريك"));
                q.appendChild(pairList(task.fragen));
                pane.appendChild(q);
            }

            /* الكلمات + زيدهم لـ Wortschatz */
            if ((task.woerter || []).length) {
                const w = el("section", "e1-box");
                w.appendChild(el("h3", "e1-box-title", "Wichtige Wörter · كلمات مهمة"));
                const grid = el("div", "e3-words");
                const P = window.DEProgress;
                task.woerter.forEach(function (it) {
                    const cell = el("div", "e3-word");
                    cell.appendChild(el("span", "e3-de", it.de));
                    const ar = el("span", "e3-ar", it.ar || ""); ar.dir = "rtl";
                    cell.appendChild(ar);
                    if (P && P.addCustom) {
                        const exists = (P.custom() || []).some(function (x) { return x.de.toLowerCase() === it.de.toLowerCase(); });
                        const add = btn("e3-add" + (exists ? " done" : ""), exists ? "✓" : "+");
                        add.title = "زيدها للكلمات ديالي (Wortschatz)";
                        add.addEventListener("click", function () {
                            if (P.addCustom(it.de, it.ar, task.title || "")) { add.textContent = "✓"; add.classList.add("done"); }
                        });
                        cell.appendChild(add);
                    }
                    grid.appendChild(cell);
                });
                w.appendChild(grid);
                if (P && P.addCustom) w.appendChild(el("p", "e1-box-hint", "➕ برك على + باش تزيد الكلمة لـ Wortschatz ديالك وتراجعها من بعد."));
                pane.appendChild(w);
            }

            /* العبارات */
            const rm = document.createElement("details");
            rm.className = "sp-phrases";
            const sum = document.createElement("summary");
            sum.textContent = "💬 عبارات كتنفعك ف " + TEIL;
            rm.appendChild(sum);
            (PLAN ? REDEMITTEL_PLAN : REDEMITTEL).forEach(function (g) {
                rm.appendChild(el("div", "sp-phrase-head", g.head));
                const ul = el("ul", "sp-phrase-list");
                g.items.forEach(function (i) { ul.appendChild(el("li", "", i)); });
                rm.appendChild(ul);
            });
            pane.appendChild(rm);

            /* النقط ديالك */
            const notes = el("section", "e1-box");
            notes.appendChild(el("h3", "e1-box-title", "Ihre Stichpunkte · نقطك"));
            const area = document.createElement("textarea");
            area.className = "e1-notes";
            area.rows = 4;
            area.placeholder = PLAN
                ? "كتب الاقتراحات ديالك لكل نقطة: فوقاش، فين، شكون كيدير شنو…"
                : "كتب 3–4 كلمات: الرأي ديالك، علاش، ومثال من الحياة ديالك…";
            area.value = store(key("notes"));
            area.addEventListener("input", function () { store(key("notes"), area.value); });
            notes.appendChild(area);
            pane.appendChild(notes);

            pane.appendChild(cta("← الحوار النموذجي (Modelldialog)", "model"));
            return pane;
        }

        /* ================= 3) الحوار النموذجي ================= */

        function buildModel() {
            const pane = el("div", "e1-pane");
            const box = el("section", "e1-box");
            const top = el("div", "e3-text-top");
            top.appendChild(el("h3", "e1-box-title", "Modelldialog · حوار نموذجي"));
            box.appendChild(top);

            const tools = el("div", "e1-row");
            const playAll = btn("e1-btn e1-btn-soft", "🔊 سمع الحوار كامل");
            const practice = btn("e1-btn e1-btn-soft", "🙈 خبي الجمل ديالي (Person " + role + ")");
            tools.append(playAll, practice);
            box.appendChild(tools);

            const list = el("div", "e3-dialog");
            const lines = (task.dialog || []).map(function (line) {
                const row = el("div", "e3-line e3-line-" + line.who + (line.who === role ? " is-mine" : ""));
                row.appendChild(el("span", "e3-who", line.who));
                const txt = el("div", "e3-line-body");
                txt.appendChild(el("p", "e3-de", line.de));
                if (line.ar) { const ar = el("p", "e3-ar e3-tr", line.ar); ar.dir = "rtl"; txt.appendChild(ar); }
                row.appendChild(txt);
                row.addEventListener("click", function () {
                    if (row.classList.contains("is-hidden")) { row.classList.remove("is-hidden"); return; }
                    K.speak(line.de, null, line.who === "B" ? { alt: true } : null);
                });
                list.appendChild(row);
                return row;
            });
            box.appendChild(list);
            box.appendChild(el("p", "e1-box-hint", "برك على أي جملة باش تسمعها. فوضع التمرين: قول الجملة ديالك بصوت عالي، ومن بعد برك عليها تشوف واش صحيحة."));

            let hidden = false;
            practice.addEventListener("click", function () {
                hidden = !hidden;
                lines.forEach(function (row) {
                    if (row.classList.contains("is-mine")) row.classList.toggle("is-hidden", hidden);
                });
                practice.textContent = hidden ? "👁 بين الجمل ديالي" : "🙈 خبي الجمل ديالي (Person " + role + ")";
            });

            let playing = false;
            playAll.addEventListener("click", function () {
                if (playing) { playing = false; K.hush(); playAll.textContent = "🔊 سمع الحوار كامل"; return; }
                playing = true;
                playAll.textContent = "⏹ وقف";
                (function next(i) {
                    lines.forEach(function (r) { r.classList.remove("is-speaking"); });
                    const line = (task.dialog || [])[i];
                    if (!playing || !line) { playing = false; playAll.textContent = "🔊 سمع الحوار كامل"; return; }
                    lines[i].classList.add("is-speaking");
                    const ok = K.speak(line.de, function () { next(i + 1); }, line.who === "B" ? { alt: true } : null);
                    if (!ok) { playing = false; playAll.textContent = "🔊 سمع الحوار كامل"; }
                })(0);
            });

            pane.appendChild(box);
            pane.appendChild(cta("← المحاكاة (Simulation)", "sim"));
            return pane;
        }

        /* ================= 4) المحاكاة ================= */

        function buildSim() {
            const node = el("div", "e1-pane");
            const stage = el("div", "e1-stage");
            node.appendChild(stage);

            let timer = null, run = 0, session = null;
            let result = null;

            function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
            function tickEvery(fn) {
                stopTimer();
                let t = 0;
                timer = setInterval(function () { t++; fn(t); }, 1000);
            }
            function clear() { stage.textContent = ""; }

            function intro() {
                clear();
                stage.appendChild(el("h3", "e1-stage-title", "Simulation · Person " + role));
                stage.appendChild(el("p", "e1-box-hint",
                    "الشريك (Person " + other() + ") غادي يهضر بالصوت. ملي يجي الدور ديالك، هضر بصوت عالي وبرك «✓ ساليت». " +
                    "كتقدر تشوف تلميح صغير إلا تبلوكيتي. الهضرة كتسجل باش تسمع راسك فالأخير."));
                const start = btn("e1-btn e1-btn-main", "🎙 بدا المحاكاة");
                start.addEventListener("click", begin);
                stage.appendChild(start);
            }

            async function begin() {
                run++;
                const my = run;
                result = { turns: [], clips: [] };
                session = K.recorderSession();
                const ok = await session.open();
                if (my !== run) return;
                if (!ok) session = null;
                step(0);
            }

            function step(i) {
                if (!result) return;
                const line = (task.dialog || [])[i];
                if (!line) { finish(); return; }
                if (line.who === role) mine(i, line); else partner(i, line);
            }

            function partner(i, line) {
                stopTimer();
                clear();
                const my = run;
                const bubble = el("div", "e1-examiner");
                bubble.appendChild(el("span", "e1-examiner-who", "🧑 Person " + line.who + " · الشريك"));
                bubble.appendChild(el("p", "e1-examiner-q", line.de));
                if (line.ar) { const ar = el("p", "t2-q-ar", line.ar); ar.dir = "rtl"; bubble.appendChild(ar); }
                const again = btn("e1-btn e1-btn-soft", "🔊 عاود");
                bubble.appendChild(again);
                stage.appendChild(bubble);
                const next = btn("e1-btn e1-btn-main", "← الدور ديالي");
                stage.appendChild(next);

                /* ملي يسالي الشريك كنمشيو للدور ديالك بوحدنا.
                   sid كيمنع قراية قديمة (مثلا بعد «عاود») تقلب الصفحة. */
                let sid = 0;
                function go() { sid++; K.hush(); if (my === run && stage.contains(next)) step(i + 1); }
                function say() {
                    const id = ++sid;
                    const spoken = K.speak(line.de, function () {
                        setTimeout(function () { if (id === sid) go(); }, 700);
                    }, line.who === "B" ? { alt: true } : null);
                    if (!spoken) sid++;
                }
                again.addEventListener("click", say);
                next.addEventListener("click", go);
                say();
            }

            function mine(i, line) {
                stopTimer();
                clear();
                const my = run;
                const title = el("h3", "e1-stage-title", "Sie sind dran · الدور ديالك");
                if (session) title.appendChild(el("span", "e1-live on", "REC"));
                stage.appendChild(title);
                const r = K.ring();
                stage.appendChild(r.node);

                const hint = el("div", "e3-line is-mine is-hidden e3-hint");
                const hb = el("div", "e3-line-body");
                hb.appendChild(el("p", "e3-de", line.de));
                hint.appendChild(el("span", "e3-who", "💡"));
                hint.appendChild(hb);
                hint.addEventListener("click", function () { hint.classList.remove("is-hidden"); });
                stage.appendChild(hint);
                stage.appendChild(el("p", "e1-box-hint", "تبلوكيتي؟ برك على التلميح باش تشوف مثال."));

                const done = btn("e1-btn e1-btn-main", "✓ ساليت");
                stage.appendChild(done);

                let seconds = 0, finished = false;
                if (session) session.start();
                async function end() {
                    if (finished) return;
                    finished = true;
                    stopTimer();
                    result.turns.push(seconds);
                    const clip = session ? await session.stop() : null;
                    if (my !== run) return;
                    result.clips.push({ label: "Beitrag " + result.turns.length, url: clip });
                    step(i + 1);
                }
                done.addEventListener("click", end);
                tickEvery(function (t) {
                    seconds = t;
                    r.set(t / TURN_SEC, clock(t), t < 8 ? "زيد شوية" : "مزيان", t < 8 ? "short" : "ok");
                    if (t >= TURN_SEC) end();
                });
            }

            function finish() {
                stopTimer();
                K.hush();
                if (session) { session.close(); session = null; }
                clear();
                stage.appendChild(el("h3", "e1-stage-title", "Auswertung · التقييم"));

                const total = result.turns.reduce(function (a, b) { return a + b; }, 0);
                let verdict, tone;
                if (total < 30) { verdict = "قصير بزاف. فكل دور قول جوج جمل على الأقل: رأي + علاش."; tone = "bad"; }
                else if (total < MIN_TALK) { verdict = "قريب! زيد مثال من الحياة ديالك وسؤال للشريك."; tone = "mid"; }
                else if (total <= MAX_TALK) { verdict = "مزيان! الوقت ديالك بحال الامتحان. 👏"; tone = "good"; }
                else { verdict = "طولتي شوية. خلي الشريك حتى هو يهضر."; tone = "mid"; }
                const sum = el("div", "e1-score e1-score-" + tone);
                sum.appendChild(el("b", "e1-score-time", clock(total)));
                sum.appendChild(el("span", "e1-score-label", "المدة ديال الهضرة ديالك"));
                sum.appendChild(el("p", "e1-score-text", verdict));
                stage.appendChild(sum);

                const clips = result.clips.filter(function (c) { return c.url; });
                if (clips.length) {
                    const box = el("div", "e1-clips");
                    box.appendChild(el("span", "e1-peek-label", "🎧 سمع راسك"));
                    clips.forEach(function (c) {
                        const row = el("div", "e1-clip");
                        row.appendChild(el("span", "e1-clip-label", c.label));
                        const a = document.createElement("audio");
                        a.controls = true; a.preload = "metadata"; a.src = c.url;
                        row.appendChild(a);
                        box.appendChild(row);
                    });
                    stage.appendChild(box);
                }

                const check = el("section", "e1-box e1-self");
                const items = PLAN ? [
                    "اقترحت أفكار (Ich schlage vor … / Wie wäre es …?).",
                    "سولت الشريك على رأيو (Was meinst du?).",
                    "جاوبت على الاقتراحات ديالو (Gute Idee! / Das finde ich nicht so gut …).",
                    "عطيت سبب بسيط (weil / denn).",
                    "تكلمنا على كاع النقط ديال المهمة.",
                    "اتافقنا فالأخير على خطة (Also, wir machen es so …)."
                ] : [
                    "لخصت النص ديالي باختصار (In meinem Text geht es um …).",
                    "عطيت رأيي بوضوح (Ich finde, dass …).",
                    "علّلت الرأي ديالي (weil / deshalb).",
                    "حكيت تجربة شخصية ولا مثال من بلادي.",
                    "سولت الشريك سؤال ولا جوج.",
                    "جاوبت على كلام الشريك (Da hast du recht / Das sehe ich anders)."
                ];
                const count = el("span", "t1-progress", "0/" + items.length);
                const t = el("h3", "e1-box-title", "Selbstcheck · قيّم راسك");
                t.appendChild(count);
                check.appendChild(t);
                const list = el("div", "e1-self-list");
                items.forEach(function (text) {
                    const label = el("label", "e1-opt e1-self-item");
                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.addEventListener("change", function () {
                        count.textContent = list.querySelectorAll("input:checked").length + "/" + items.length;
                    });
                    label.append(input, el("span", "", text));
                    list.appendChild(label);
                });
                check.appendChild(list);

                /* النقط: الوقت (8) + التدخلات (7) + Selbstcheck (10) */
                const good = result.turns.filter(function (s) { return s >= 8; }).length;
                const turnPts = result.turns.length ? K.half(7 * good / result.turns.length) : 0;
                const pb = K.pointsBox("teil2", [
                    { label: "Sprechzeit", pts: K.timePoints(total, MIN_TALK, MAX_TALK, 8), max: 8 },
                    { label: "Beiträge", pts: turnPts, max: 7 }
                ], 10);
                list.addEventListener("change", function () {
                    pb.update(list.querySelectorAll("input:checked").length / items.length);
                });
                stage.appendChild(pb.node);
                stage.appendChild(check);

                const again = btn("e1-btn e1-btn-main", "↻ عاود المحاكاة");
                again.addEventListener("click", function () {
                    result.clips.forEach(function (c) { if (c.url) URL.revokeObjectURL(c.url); });
                    intro();
                });
                stage.appendChild(again);
            }

            return {
                node: node,
                refresh: function () { if (!stage.childNodes.length || !result) intro(); },
                abort: function () {
                    run++;
                    stopTimer();
                    K.hush();
                    if (session) { session.close(); session = null; }
                    result = null;
                    stage.textContent = "";
                }
            };
        }

        rebuild();
    }

    window.__sprechenB1Teil2Render = render;
})();
