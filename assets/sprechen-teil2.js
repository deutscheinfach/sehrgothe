/* ===== Sprechen B2 · Teil 2 — نص: Inhalt + Meinung + Erfahrung =====

   أربعة ديال المراحل:
     1) Text lesen   — النص مع كلمات ملونين (برك عليهم يبان المعنى)،
                       الترجمة بالزر، وسؤال على الفكرة الأساسية.
     2) Vorbereiten  — تلات بطاقات: Inhalt / Meinung / Erfahrung.
                       كتختار الحجج ديالك وكتكتب النقط (محفوظين فالجهاز).
     3) Mustertext   — نموذج مقسوم على التلات أجزاء، مع الصوت.
     4) Simulation   — كتهضر والصفحة كتقودك جزء بجزء، ومن بعد
                       الـPrüfer كيسولك جوج أسئلة بالصوت.

   كيستعمل الأدوات ديال sprechen-teil1.js (window.__sprechenKit).
*/

(function () {
    "use strict";

    const MIN_SEC = 120;
    const MAX_SEC = 180;
    const STOP_SEC = 210;
    const PREP_SEC = 60;
    const ANSWER_SEC = 60;

    const PHASES = [
        { key: "inhalt",    de: "Inhalt",    ar: "لخّص النص",       icon: "📄" },
        { key: "meinung",   de: "Meinung",   ar: "عطي رأيك",        icon: "💬" },
        { key: "erfahrung", de: "Erfahrung", ar: "حكي التجربة ديالك", icon: "🧭" }
    ];

    const REDEMITTEL = {
        inhalt: [
            "In dem Text geht es um …",
            "Der Autor / Die Autorin berichtet, dass …",
            "Als Vorteil wird genannt, dass …",
            "Kritisch wird gesehen, dass …",
            "Am Ende wird empfohlen, …"
        ],
        meinung: [
            "Meiner Meinung nach …",
            "Ich bin der Ansicht, dass …",
            "Einerseits … , andererseits …",
            "Ein wichtiges Argument dafür / dagegen ist …",
            "Deshalb finde ich …"
        ],
        erfahrung: [
            "Ich habe selbst die Erfahrung gemacht, dass …",
            "Bei mir war es so, dass …",
            "In meinem Heimatland ist es üblich, dass …",
            "Ich kenne jemanden, der …"
        ]
    };

    function render(into, task, topicId) {
        const K = window.__sprechenKit;
        if (!K) { into.textContent = "…"; return; }
        const el = K.el, btn = K.btn, clock = K.clock, store = K.store;

        into.textContent = "";
        const wrap = el("div", "e1 e2");
        const key = function (k) { return "e2-" + (topicId || "x") + "-" + k; };

        /* الحجج اللي اختار المستخدم (كتبان فالمحاكاة) */
        let picked = [];
        try { picked = JSON.parse(store(key("args")) || "[]"); } catch (e) { picked = []; }

        /* ---- العنوان ---- */
        const head = el("div", "t1-head");
        head.appendChild(el("h2", "t1-title", task.title || "Über ein Thema sprechen"));
        head.appendChild(el("div", "t1-kicker", "SPRECHEN TEIL 2 · TEXT · MEINUNG · ERFAHRUNG"));
        head.appendChild(K.arToggle(wrap));
        wrap.appendChild(head);

        const card = el("section", "e1-task");
        card.appendChild(el("span", "e1-task-label", "Aufgabe"));
        /* الـAufgabe كتجي من الموضوع ملي تكون مكتوبة فيه —
           كل نص عندو صيغة ديالو. وإلا كنرجعو للصيغة العامة. */
        card.appendChild(el("p", "e1-task-de", task.aufgabe ||
            "Lesen Sie den Text. Fassen Sie den Inhalt zusammen, sagen Sie Ihre Meinung und berichten Sie von Ihren Erfahrungen."));
        card.appendChild(K.arBlock(task.aufgabeAr ||
            "قرا النص، لخّص المحتوى ديالو، عطي رأيك، وحكي على التجربة ديالك. من بعد الـPrüfer يقدر يسولك على أي جزء.", "المطلوب"));
        const facts = el("div", "e1-facts");
        PHASES.forEach(function (p) {
            const chip = el("span", "e1-fact");
            chip.append(el("span", "", p.icon), el("span", "", p.de));
            facts.appendChild(chip);
        });
        const q = el("span", "e1-fact");
        q.append(el("span", "", "❓"), el("span", "", "Fragen vom Prüfer"));
        facts.appendChild(q);
        card.appendChild(facts);
        wrap.appendChild(card);

        /* ---- المراحل ---- */
        const STEPS = [
            { key: "read",  n: "1", de: "Text lesen",   ar: "القراية" },
            { key: "prep",  n: "2", de: "Vorbereiten",  ar: "التحضير" },
            { key: "model", n: "3", de: "Mustertext",   ar: "نموذج" },
            { key: "sim",   n: "4", de: "Simulation",   ar: "المحاكاة" }
        ];
        const nav = el("nav", "e1-steps e1-steps-4");
        const panes = {};
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

        panes.read = buildRead();
        panes.prep = buildPrep();
        panes.model = buildModel();
        const sim = buildSim();
        panes.sim = sim.node;
        Object.keys(panes).forEach(function (k) { panes[k].hidden = true; body.appendChild(panes[k]); });
        into.appendChild(wrap);
        show("read", false);

        function show(k, scroll) {
            K.hush();
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

        /* ================= 1) القراية ================= */

        function buildRead() {
            const pane = el("div", "e1-pane");
            const t = task.text || {};
            const box = el("article", "e1-box e2-text");
            const top = el("div", "e1-model-top");
            top.appendChild(el("h3", "e1-box-title e2-text-title", t.title || "Text"));
            const words = (t.de || "").split(/\s+/).filter(Boolean).length;
            top.appendChild(el("span", "e1-model-meta", words + " Wörter"));
            box.appendChild(top);

            const listen = btn("e1-btn e1-btn-soft", "🔊 سمع النص");
            let on = false;
            listen.addEventListener("click", function () {
                if (on) { K.hush(); on = false; listen.textContent = "🔊 سمع النص"; return; }
                if (K.speak((t.de || "").replace(/\n/g, " "), function () { on = false; listen.textContent = "🔊 سمع النص"; })) {
                    on = true; listen.textContent = "⏹ حبس";
                }
            });
            const tools = el("div", "e1-model-tools");
            tools.appendChild(listen);
            if ((task.glossar || []).length) tools.appendChild(el("span", "e2-gl-hint", "الكلمات الملونين: برك عليهم يبان المعنى"));
            box.appendChild(tools);

            (t.de || "").split("\n").forEach(function (para) {
                box.appendChild(glossed(para));
            });
            if (t.ar) {
                const arText = K.arBlock(t.ar);
                arText.classList.add("e2-ar-text");     /* نخليو الفقرات ديال الترجمة */
                box.appendChild(arText);
            }
            pane.appendChild(box);

            /* سؤال الفكرة الأساسية */
            if (task.kern) {
                const kBox = el("section", "e1-box e2-kern");
                kBox.appendChild(el("h3", "e1-box-title", "Hauptaussage · الفكرة الأساسية"));
                kBox.appendChild(el("p", "e2-kern-q", task.kern.frage || ""));
                const list = el("div", "e2-kern-list");
                const why = el("p", "e2-kern-why", task.kern.warum || "");
                why.hidden = true;
                (task.kern.optionen || []).forEach(function (opt, i) {
                    const b = btn("t1-option e2-kern-opt", "");
                    b.append(el("span", "t1-option-key", "abc"[i] || String(i + 1)), el("span", "t1-option-de", opt));
                    b.addEventListener("click", function () {
                        list.querySelectorAll(".e2-kern-opt").forEach(function (o, j) {
                            o.classList.remove("is-right", "is-wrong");
                            if (j === task.kern.richtig) o.classList.add("is-right");
                        });
                        if (i !== task.kern.richtig) b.classList.add("is-wrong");
                        why.hidden = false;
                        pts.hidden = false;
                    });
                    list.appendChild(b);
                });
                kBox.append(list, why);
                const pts = el("div", "e2-points");
                pts.hidden = true;
                pts.appendChild(el("span", "e1-peek-label", "Die wichtigsten Punkte"));
                (task.punkte || []).forEach(function (p) {
                    const row = el("div", "e2-point");
                    row.appendChild(el("span", "e2-point-de", p.de));
                    if (p.ar) row.appendChild(el("span", "t2-q-ar", p.ar));
                    pts.appendChild(row);
                });
                kBox.appendChild(pts);
                pane.appendChild(kBox);
            }

            pane.appendChild(cta("فهمت النص؟ دوز للتحضير ←", "prep"));
            return pane;
        }

        /* النص مع الكلمات ديال الـGlossar كأزرار */
        function glossed(para) {
            const p = el("p", "e2-para");
            const terms = (task.glossar || []).slice().sort(function (a, b) { return b.de.length - a.de.length; });
            const hits = [];
            terms.forEach(function (g) {
                const at = para.indexOf(g.de);
                if (at === -1) return;
                if (hits.some(function (h) { return at < h.end && at + g.de.length > h.start; })) return;
                hits.push({ start: at, end: at + g.de.length, g: g });
            });
            hits.sort(function (a, b) { return a.start - b.start; });
            let last = 0;
            hits.forEach(function (h) {
                if (h.start > last) p.appendChild(document.createTextNode(para.slice(last, h.start)));
                const w = btn("e2-gl", "");
                w.appendChild(el("span", "e2-gl-de", para.slice(h.start, h.end)));
                const tip = el("span", "e2-gl-ar", h.g.ar);
                tip.dir = "rtl";
                w.appendChild(tip);
                w.setAttribute("aria-label", h.g.de + " — " + h.g.ar);
                w.addEventListener("click", function () {
                    const open = !w.classList.contains("open");
                    p.parentNode.querySelectorAll(".e2-gl.open").forEach(function (o) { o.classList.remove("open"); });
                    w.classList.toggle("open", open);
                });
                p.appendChild(w);
                last = h.end;
            });
            if (last < para.length) p.appendChild(document.createTextNode(para.slice(last)));
            return p;
        }

        /* ================= 2) التحضير ================= */

        function buildPrep() {
            const pane = el("div", "e1-pane");
            const grid = el("div", "e2-cards");

            PHASES.forEach(function (ph, i) {
                const box = el("section", "e1-box e2-card");
                const title = el("h3", "e1-box-title");
                title.appendChild(el("span", "", ph.icon + " " + (i + 1) + ". " + ph.de + " · " + ph.ar));
                box.appendChild(title);

                if (ph.key === "inhalt") {
                    box.appendChild(el("p", "e1-box-hint", "قول غير الأهم: الموضوع، جوج ولا تلاتة ديال النقط، وشنو كيقترح النص. ماشي كلشي!"));
                    const ul = el("ul", "e2-mini");
                    (task.punkte || []).forEach(function (p) {
                        const li = el("li");
                        li.appendChild(el("span", "", p.de));
                        if (p.ar) li.appendChild(el("span", "t2-q-ar", p.ar));
                        ul.appendChild(li);
                    });
                    box.appendChild(ul);
                }

                if (ph.key === "meinung") {
                    box.appendChild(el("p", "e1-box-hint", "ختار 2 ولا 3 ديال الحجج اللي كتقنعك — غادي يبانو ليك فالمحاكاة."));
                    const m = task.meinung || {};
                    [["pro", "👍 Dafür"], ["contra", "👎 Dagegen"]].forEach(function (side) {
                        const col = el("div", "e2-side e2-side-" + side[0]);
                        col.appendChild(el("span", "e2-side-label", side[1]));
                        (m[side[0]] || []).forEach(function (a) {
                            const chip = btn("e2-arg", "");
                            chip.appendChild(el("span", "e2-arg-de", a.de));
                            if (a.ar) chip.appendChild(el("span", "t1-option-ar", a.ar));
                            const on = picked.indexOf(a.de) !== -1;
                            chip.classList.toggle("on", on);
                            chip.setAttribute("aria-pressed", on ? "true" : "false");
                            chip.addEventListener("click", function () {
                                const i2 = picked.indexOf(a.de);
                                if (i2 === -1) picked.push(a.de); else picked.splice(i2, 1);
                                const now = picked.indexOf(a.de) !== -1;
                                chip.classList.toggle("on", now);
                                chip.setAttribute("aria-pressed", now ? "true" : "false");
                                store(key("args"), JSON.stringify(picked));
                            });
                            col.appendChild(chip);
                        });
                        box.appendChild(col);
                    });
                }

                if (ph.key === "erfahrung") {
                    box.appendChild(el("p", "e1-box-hint", "جاوب على هاد الأسئلة بالتجربة ديالك نتا — ولا على شي حد كتعرفو، ولا على بلادك."));
                    const ul = el("ul", "e2-mini");
                    (task.erfahrung || []).forEach(function (q) {
                        const li = el("li");
                        li.appendChild(el("span", "", q.de));
                        if (q.ar) li.appendChild(el("span", "t2-q-ar", q.ar));
                        ul.appendChild(li);
                    });
                    box.appendChild(ul);
                }

                const rm = document.createElement("details");
                rm.className = "sp-phrases e2-rm";
                rm.appendChild(el("summary", "", "💬 Redemittel"));
                const rl = el("ul", "sp-phrase-list");
                (REDEMITTEL[ph.key] || []).forEach(function (r) { rl.appendChild(el("li", "", r)); });
                rm.appendChild(rl);
                box.appendChild(rm);

                const area = document.createElement("textarea");
                area.className = "e1-notes e2-notes";
                area.rows = 3;
                area.dir = "auto";
                area.placeholder = "Stichpunkte …";
                area.value = store(key("notes-" + ph.key));
                area.addEventListener("input", function () { store(key("notes-" + ph.key), area.value); });
                box.appendChild(area);

                grid.appendChild(box);
            });

            pane.append(grid, cta("جاهز؟ دوز للمحاكاة ←", "sim"));
            return pane;
        }

        /* ================= 3) النموذج ================= */

        function buildModel() {
            const pane = el("div", "e1-pane");
            const m = task.muster || {};
            PHASES.forEach(function (ph) {
                const part = m[ph.key];
                if (!part) return;
                const box = el("section", "e1-box e2-model-part");
                const top = el("div", "e1-model-top");
                top.appendChild(el("h3", "e1-box-title", ph.icon + " " + ph.de + " · " + ph.ar));
                const play = btn("e1-btn e1-btn-soft", "🔊");
                play.setAttribute("aria-label", "Vorlesen");
                play.addEventListener("click", function () { K.speak(part.de); });
                top.appendChild(play);
                box.appendChild(top);
                box.appendChild(el("p", "e1-model-de", part.de));
                if (part.ar) box.appendChild(K.arBlock(part.ar));
                pane.appendChild(box);
            });
            pane.appendChild(el("p", "e1-box-hint e2-center",
                "ماتحفظش النموذج. شوف غير كيفاش مقسوم: تلخيص قصير ← رأي معلّل ← تجربة شخصية."));
            pane.appendChild(cta("دابا دورك: دوز للمحاكاة ←", "sim"));
            return pane;
        }

        /* ================= 4) المحاكاة ================= */

        function buildSim() {
            const node = el("div", "e1-pane e1-sim");
            const stage = el("section", "e1-stage");
            node.appendChild(stage);

            let session = null, timer = null, run = 0, result = null;
            function alive() { return document.body.contains(wrap); }
            function stopTimer() { clearInterval(timer); timer = null; }
            function abort() {
                run++; stopTimer(); K.hush();
                if (session) { session.close(); session = null; }
                if (stage.dataset.phase && stage.dataset.phase !== "idle" && stage.dataset.phase !== "result") idle();
            }
            function tickEvery(fn) {
                stopTimer();
                const my = run, t0 = Date.now();
                timer = setInterval(function () {
                    if (my !== run) { stopTimer(); return; }
                    if (!alive()) { abort(); return; }
                    fn((Date.now() - t0) / 1000);
                }, 250);
                fn(0);
            }
            function phase(n) { stage.textContent = ""; stage.dataset.phase = n; }
            function option(text, checked) {
                const label = el("label", "e1-opt");
                const input = document.createElement("input");
                input.type = "checkbox"; input.checked = checked;
                label.append(input, el("span", "", text));
                return { label: label, input: input };
            }

            function idle() {
                phase("idle"); stopTimer();
                stage.appendChild(el("h3", "e1-stage-title", "Prüfungssimulation · Teil 2"));
                const flow = el("ol", "e1-flow");
                [["⏳", "دقيقة تحضير (اختيارية)"],
                 ["📄", "Inhalt: لخّص النص (~1 دقيقة)"],
                 ["💬", "Meinung: عطي رأيك وعلّلو"],
                 ["🧭", "Erfahrung: حكي التجربة ديالك"],
                 ["❓", "الـPrüfer كيسولك جوج أسئلة بالصوت"]].forEach(function (s) {
                    const li = el("li"); li.append(el("span", "e1-flow-ico", s[0]), el("span", "", s[1])); flow.appendChild(li);
                });
                stage.appendChild(flow);
                const canRec = !!(navigator.mediaDevices && window.MediaRecorder);
                const recOpt = option("🎙 سجّل صوتي باش نسمع راسي", canRec);
                if (!canRec) recOpt.input.disabled = true;
                const prepOpt = option("⏳ دقيقة ديال التحضير قبل", true);
                const opts = el("div", "e1-opts"); opts.append(recOpt.label, prepOpt.label);
                stage.appendChild(opts);
                const start = btn("e1-btn e1-btn-main", "▶ بدا الامتحان");
                start.addEventListener("click", async function () {
                    const my = ++run;
                    result = { total: 0, parts: [0, 0, 0], answers: [], clips: [], questions: pickQuestions(),
                               mic: false, wantMic: recOpt.input.checked };
                    if (recOpt.input.checked) {
                        start.disabled = true; start.textContent = "كنسولو على الميكرو…";
                        const s = K.recorderSession();
                        result.mic = await s.open();
                        if (my !== run) { s.close(); return; }
                        session = result.mic ? s : null;
                    }
                    if (prepOpt.input.checked) prep(); else talk();
                });
                stage.appendChild(start);
            }

            /* سؤال من جوج أنواع مختلفين، بالصدفة */
            function pickQuestions() {
                const f = task.fragen || {};
                const kinds = K.shuffle(["inhalt", "meinung", "erfahrung"].filter(function (k) { return (f[k] || []).length; }));
                return kinds.slice(0, 2).map(function (k) {
                    const q = K.shuffle(f[k])[0];
                    return { kind: k, de: q.de, ar: q.ar };
                });
            }

            function micNote() {
                if (result && result.wantMic && !result.mic) {
                    stage.appendChild(el("p", "e1-mic-note", "🎙 ما عطيتيش الإذن للميكرو — المحاكاة خدامة عادي بلا تسجيل."));
                }
            }

            function peek(k) {
                const box = el("div", "e1-peek");
                const notes = store(key("notes-" + k)).trim();
                box.appendChild(el("span", "e1-peek-label", "Ihre Stichpunkte"));
                if (notes) box.appendChild(el("p", "e1-peek-text", notes));
                if (k === "inhalt" && !notes) {
                    const ul = el("ul", "e1-peek-list");
                    (task.punkte || []).forEach(function (p) { ul.appendChild(el("li", "", p.de)); });
                    box.appendChild(ul);
                }
                if (k === "meinung" && picked.length) {
                    const ul = el("ul", "e1-peek-list");
                    picked.forEach(function (a) { ul.appendChild(el("li", "", a)); });
                    box.appendChild(ul);
                }
                if (k === "erfahrung" && !notes) {
                    const ul = el("ul", "e1-peek-list");
                    (task.erfahrung || []).forEach(function (q) { ul.appendChild(el("li", "", q.de)); });
                    box.appendChild(ul);
                }
                const rm = el("p", "e2-peek-rm", (REDEMITTEL[k] || []).slice(0, 2).join("  ·  "));
                box.appendChild(rm);
                return box;
            }

            function prep() {
                phase("prep");
                stage.appendChild(el("h3", "e1-stage-title", "Vorbereitung"));
                const r = K.ring();
                stage.appendChild(r.node);
                const mini = el("div", "e2-prep-text");
                mini.appendChild(el("span", "e1-peek-label", (task.text && task.text.title) || "Text"));
                mini.appendChild(el("p", "", ((task.text && task.text.de) || "").replace(/\n/g, "\n\n")));
                stage.appendChild(mini);
                micNote();
                const go = btn("e1-btn e1-btn-main", "أنا جاهز — بدا الهضرة");
                go.addEventListener("click", talk);
                stage.appendChild(go);
                tickEvery(function (t) {
                    r.set(t / PREP_SEC, clock(PREP_SEC - t), "تحضير", "prep");
                    if (t >= PREP_SEC) talk();
                });
            }

            function talk() {
                stopTimer();
                phase("talk");
                const title = el("h3", "e1-stage-title", "Sprechen Sie jetzt");
                if (session) title.appendChild(el("span", "e1-live on", "REC"));
                stage.appendChild(title);

                const bar = el("div", "e2-phases");
                const segs = PHASES.map(function (ph) {
                    const s = el("div", "e2-phase");
                    s.append(el("span", "e2-phase-ico", ph.icon), el("span", "e2-phase-de", ph.de), el("span", "e2-phase-t", "0:00"));
                    bar.appendChild(s);
                    return s;
                });
                stage.appendChild(bar);

                const r = K.ring();
                stage.appendChild(r.node);
                const hint = el("p", "e2-phase-hint", "");
                stage.appendChild(hint);
                const peekSlot = el("div", "e2-peek-slot");
                stage.appendChild(peekSlot);
                const next = btn("e1-btn e1-btn-main", "");
                stage.appendChild(next);

                if (session) session.start();
                let idx = 0, seconds = 0, partStart = 0, finished = false;

                function paintPhase() {
                    segs.forEach(function (s, i) {
                        s.classList.toggle("active", i === idx);
                        s.classList.toggle("done", i < idx);
                    });
                    hint.textContent = PHASES[idx].ar;
                    peekSlot.textContent = "";
                    peekSlot.appendChild(peek(PHASES[idx].key));
                    next.textContent = idx < PHASES.length - 1
                        ? "← " + PHASES[idx + 1].de + " (" + PHASES[idx + 1].ar + ")"
                        : "✓ ساليت";
                }
                paintPhase();

                async function finish() {
                    if (finished) return;
                    finished = true;
                    stopTimer();
                    result.parts[idx] = seconds - partStart;
                    result.total = seconds;
                    const my = run;
                    const clip = session ? await session.stop() : null;
                    if (my !== run) return;
                    result.clips.push({ label: "Ihr Beitrag (Inhalt · Meinung · Erfahrung)", url: clip });
                    ask(0);
                }

                next.addEventListener("click", function () {
                    if (idx < PHASES.length - 1) {
                        result.parts[idx] = seconds - partStart;
                        partStart = seconds;
                        idx++;
                        paintPhase();
                    } else finish();
                });

                tickEvery(function (t) {
                    seconds = t;
                    segs[idx].querySelector(".e2-phase-t").textContent = clock(t - partStart);
                    let tone = "short", h = "باقي شوية";
                    if (t >= MIN_SEC) { tone = "ok"; h = "مزيان"; }
                    if (t >= MAX_SEC) { tone = "end"; h = "سالي دابا"; }
                    r.set(t / MAX_SEC, clock(t), h, tone);
                    if (t >= STOP_SEC) finish();
                });
            }

            function ask(i) {
                const q = result.questions[i];
                if (!q) { finishAll(); return; }
                stopTimer();
                phase("ask");
                const title = el("h3", "e1-stage-title", "Frage " + (i + 1) + " von " + result.questions.length);
                if (session) title.appendChild(el("span", "e1-live on", "REC"));
                stage.appendChild(title);
                const ph = PHASES.find(function (p) { return p.key === q.kind; }) || PHASES[0];
                const bubble = el("div", "e1-examiner");
                const who = el("span", "e1-examiner-who", "👩‍🏫 Prüferin · ");
                who.appendChild(el("span", "e2-kind", "Frage zu: " + ph.de));
                bubble.appendChild(who);
                bubble.appendChild(el("p", "e1-examiner-q", q.de));
                if (q.ar) bubble.appendChild(el("p", "t2-q-ar", q.ar));
                const again = btn("e1-btn e1-btn-soft", "🔊 عاود السؤال");
                again.addEventListener("click", function () { K.speak(q.de); });
                bubble.appendChild(again);
                stage.appendChild(bubble);
                const r = K.ring();
                stage.appendChild(r.node);
                const next = btn("e1-btn e1-btn-main", i + 1 < result.questions.length ? "✓ جاوبت — السؤال الجاي" : "✓ جاوبت — شوف النتيجة");
                stage.appendChild(next);

                let finished = false, started = false, seconds = 0;
                const my = run;
                async function finish() {
                    if (finished) return;
                    finished = true; stopTimer(); K.hush();
                    result.answers.push(seconds);
                    const clip = session ? await session.stop() : null;
                    if (my !== run) return;
                    result.clips.push({ label: "Antwort " + (i + 1) + ": " + q.de, url: clip });
                    ask(i + 1);
                }
                next.addEventListener("click", finish);
                function begin() {
                    if (my !== run || finished || started) return;
                    started = true;
                    if (session) session.start();
                    tickEvery(function (t) {
                        seconds = t;
                        r.set(t / ANSWER_SEC, clock(t), t < 15 ? "زيد شوية" : "مزيان", t < 15 ? "short" : "ok");
                        if (t >= ANSWER_SEC) finish();
                    });
                }
                r.set(0, "🔊", "كيسولك…", "prep");
                if (!K.speak(q.de, begin)) begin(); else setTimeout(begin, 9000);
            }

            function finishAll() {
                stopTimer(); K.hush();
                if (session) { session.close(); session = null; }
                phase("result");
                stage.appendChild(el("h3", "e1-stage-title", "Auswertung · التقييم"));

                const s = result.total;
                let verdict, tone;
                if (s < 60) { verdict = "قصير بزاف. زيد تفاصيل فكل جزء: جوج نقط من النص، رأي بحجة، وتجربة بمثال."; tone = "bad"; }
                else if (s < MIN_SEC) { verdict = "قريب! حاول توصل لجوج دقايق — زيد حجة ولا مثال من التجربة ديالك."; tone = "mid"; }
                else if (s <= MAX_SEC) { verdict = "الوقت مزيان بحال الامتحان. 👏"; tone = "good"; }
                else { verdict = "طولتي شوية. فالتلخيص قول غير الأهم."; tone = "mid"; }
                const sum = el("div", "e1-score e1-score-" + tone);
                sum.appendChild(el("b", "e1-score-time", clock(s)));
                sum.appendChild(el("span", "e1-score-label", "المدة الكاملة ديال الكلام"));
                sum.appendChild(el("p", "e1-score-text", verdict));
                stage.appendChild(sum);

                /* توزيع الوقت على التلات أجزاء */
                const dist = el("div", "e2-dist");
                const tot = Math.max(1, result.parts.reduce(function (a, b) { return a + b; }, 0));
                PHASES.forEach(function (ph, i) {
                    const row = el("div", "e2-dist-row");
                    row.appendChild(el("span", "e2-dist-label", ph.icon + " " + ph.de));
                    const track = el("span", "e2-dist-track");
                    const fill = el("span", "e2-dist-fill");
                    fill.style.width = Math.round(result.parts[i] / tot * 100) + "%";
                    track.appendChild(fill);
                    row.appendChild(track);
                    row.appendChild(el("b", "e2-dist-t", clock(result.parts[i])));
                    dist.appendChild(row);
                });
                stage.appendChild(dist);
                const tips = [];
                if (result.parts[0] > tot * 0.55) tips.push("التلخيص خدا بزاف ديال الوقت — قول غير الأفكار الكبار.");
                if (result.parts[1] < 20) tips.push("الرأي كان قصير: عطي رأيك + حجة (weil …) + مثال.");
                if (result.parts[2] < 20) tips.push("التجربة كانت قصيرة: حكي شي حاجة وقعات ليك بصح.");
                tips.forEach(function (t) { stage.appendChild(el("p", "e1-box-hint", "💡 " + t)); });

                if (result.answers.length) {
                    const ans = el("div", "e1-answers");
                    result.answers.forEach(function (sec, i) {
                        const row = el("div", "e1-answer");
                        row.appendChild(el("span", "e1-answer-n", "Frage " + (i + 1)));
                        row.appendChild(el("span", "e1-answer-q", result.questions[i].de));
                        row.appendChild(el("b", "e1-answer-t", clock(sec)));
                        ans.appendChild(row);
                    });
                    stage.appendChild(ans);
                }

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
                const items = [
                    "بديت بجملة واضحة (In dem Text geht es um …).",
                    "لخصت غير الأفكار المهمة، بلا ما نعاود النص.",
                    "عطيت رأيي بوضوح (Meiner Meinung nach …).",
                    "علّلت الرأي ديالي بحجة ولا جوج (weil / deshalb).",
                    "حكيت تجربة شخصية ولا الوضعية فبلادي.",
                    "استعملت كلمات من النص بطريقتي.",
                    "جاوبت على الأسئلة بجمل كاملة."
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

                /* النقط: الوقت (8) + التلات أجزاء (3) + الأجوبة (4) + Selbstcheck (10) */
                const partsPts = result.parts.filter(function (sec) { return sec >= 20; }).length;
                const answerPts = K.half(result.answers.reduce(function (a, sec) {
                    return a + (sec >= 15 ? 2 : sec >= 5 ? 1 : 0);
                }, 0));
                const pb = K.pointsBox("teil2", [
                    { label: "Sprechzeit", pts: K.timePoints(result.total, MIN_SEC, MAX_SEC, 8), max: 8 },
                    { label: "Inhalt · Meinung · Erfahrung", pts: partsPts, max: 3 },
                    { label: "Fragen", pts: Math.min(4, answerPts), max: 4 }
                ], 10);
                list.addEventListener("change", function () {
                    pb.update(list.querySelectorAll("input:checked").length / items.length);
                });
                stage.appendChild(pb.node);
                stage.appendChild(check);

                const row = el("div", "e1-row");
                const again = btn("e1-btn e1-btn-main", "↻ عاود بأسئلة جداد");
                again.addEventListener("click", function () {
                    result.clips.forEach(function (c) { if (c.url) URL.revokeObjectURL(c.url); });
                    run++; idle();
                });
                const model = btn("e1-btn e1-btn-soft", "📄 شوف النموذج");
                model.addEventListener("click", function () { show("model", true); });
                row.append(again, model);
                stage.appendChild(row);
            }

            idle();
            return { node: node, abort: abort, refresh: function () { /* الحجج كتقرا من picked مباشرة */ } };
        }
    }

    window.__sprechenTeil2Render = render;
})();
