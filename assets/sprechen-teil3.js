/* ===== Sprechen B2 · Teil 3 — Gemeinsam planen =====

   تلاتة ديال المراحل:
     1) Situation    — المهمة، لوحة ديال النقط اللي خاصكم تقررو فيها،
                       والعبارات: اقترح / وافق / رفض بأدب / اقتراح آخر.
     2) Musterdialog — حوار نموذجي بجوج أصوات، مع الترجمة.
     3) Simulation   — Partner افتراضي: مرة هو كيقترح ونتا كترد،
                       ومرة نتا كتقترح وهو كيرد. من بعد كل نقطة
                       كتختار شنو تفقتو عليه → اللوحة كتعمر.
                       فاللخر كتلخص الـPlan بصوتك.

   كيستعمل الأدوات ديال sprechen-teil1.js (window.__sprechenKit).
*/

(function () {
    "use strict";

    const TURN_SEC = 45;

    const REDEMITTEL = [
        { key: "vorschlag", head: "💡 اقترح", items: [
            "Ich schlage vor, dass wir …",
            "Wie wäre es, wenn wir … ?",
            "Wir könnten doch …" ] },
        { key: "ja", head: "👍 وافق", items: [
            "Gute Idee, das machen wir so.",
            "Da bin ich ganz deiner Meinung.",
            "Einverstanden!" ] },
        { key: "nein", head: "✋ رفض بأدب", items: [
            "Ich weiß nicht, ob das eine gute Idee ist, weil …",
            "Das finde ich nicht so gut, denn …",
            "Hm, das ist vielleicht ein bisschen zu teuer / zu kompliziert." ] },
        { key: "gegen", head: "🔁 اقتراح آخر", items: [
            "Was hältst du davon, wenn wir stattdessen … ?",
            "Ich hätte eine andere Idee: …",
            "Vielleicht könnten wir auch …" ] },
        { key: "einig", head: "🤝 الاتفاق", items: [
            "Dann halten wir fest: …",
            "Also, wir machen es so: …",
            "Wer kümmert sich um … ?" ] }
    ];

    function render(into, task, topicId) {
        const K = window.__sprechenKit;
        if (!K) { into.textContent = "…"; return; }
        const el = K.el, btn = K.btn, clock = K.clock;

        into.textContent = "";
        const wrap = el("div", "e1 e3");

        const head = el("div", "t1-head");
        head.appendChild(el("h2", "t1-title", task.title || "Gemeinsam planen"));
        head.appendChild(el("div", "t1-kicker", "SPRECHEN TEIL 3 · GEMEINSAM PLANEN"));
        head.appendChild(K.arToggle(wrap));
        wrap.appendChild(head);

        const card = el("section", "e1-task");
        card.appendChild(el("span", "e1-task-label", "Situation"));
        card.appendChild(el("p", "e1-task-de", (task.situation || {}).de || ""));
        if ((task.situation || {}).ar) card.appendChild(K.arBlock(task.situation.ar, "الوضعية"));
        const facts = el("div", "e1-facts");
        [["🗂", (task.punkte || []).length + " Punkte planen"], ["🤝", "gemeinsam entscheiden"], ["🗣", "Vorschläge machen & reagieren"]]
            .forEach(function (f) {
                const c = el("span", "e1-fact"); c.append(el("span", "", f[0]), el("span", "", f[1])); facts.appendChild(c);
            });
        card.appendChild(facts);
        wrap.appendChild(card);

        const STEPS = [
            { key: "plan",   n: "1", de: "Situation",     ar: "النقط والعبارات" },
            { key: "dialog", n: "2", de: "Musterdialog",  ar: "حوار نموذجي" },
            { key: "sim",    n: "3", de: "Simulation",    ar: "خطط مع الـPartner" }
        ];
        const nav = el("nav", "e1-steps");
        const panes = {}, tabs = {};
        STEPS.forEach(function (s) {
            const b = btn("e1-step", "");
            b.append(el("span", "e1-step-n", s.n), el("span", "e1-step-de", s.de), el("span", "e1-step-ar", s.ar));
            b.addEventListener("click", function () { show(s.key, true); });
            tabs[s.key] = b; nav.appendChild(b);
        });
        wrap.appendChild(nav);
        const body = el("div", "e1-body");
        wrap.appendChild(body);

        panes.plan = buildPlan();
        const dlg = buildDialog();
        panes.dialog = dlg.node;
        const sim = buildSim();
        panes.sim = sim.node;
        Object.keys(panes).forEach(function (k) { panes[k].hidden = true; body.appendChild(panes[k]); });
        into.appendChild(wrap);
        show("plan", false);

        function show(k, scroll) {
            K.hush();
            dlg.stop();
            Object.keys(panes).forEach(function (x) {
                panes[x].hidden = x !== k;
                tabs[x].classList.toggle("active", x === k);
            });
            if (k !== "sim") sim.abort();
            if (scroll) nav.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        function cta(text, target) {
            const b = btn("e1-cta", text);
            b.addEventListener("click", function () { show(target, true); });
            return b;
        }

        /* لوحة النقط (كتستعمل فالتحضير وفالمحاكاة) */
        function board(values) {
            const grid = el("div", "e3-board");
            const cells = {};
            (task.punkte || []).forEach(function (p, i) {
                const c = el("div", "e3-cell");
                c.appendChild(el("span", "e3-cell-n", String(i + 1)));
                const txt = el("div", "e3-cell-text");
                const lab = el("span", "e3-cell-label", p.label);
                txt.appendChild(lab);
                if (p.ar) txt.appendChild(el("span", "t1-option-ar", p.ar));
                const val = el("span", "e3-cell-val", values && values[p.key] ? values[p.key] : "?");
                txt.appendChild(val);
                c.appendChild(txt);
                if (values && values[p.key]) c.classList.add("done");
                grid.appendChild(c);
                cells[p.key] = { node: c, val: val };
            });
            return {
                node: grid, cells: cells,
                fill: function (k, v) { cells[k].val.textContent = v; cells[k].node.classList.add("done", "pop"); },
                focus: function (k) { Object.keys(cells).forEach(function (x) { cells[x].node.classList.toggle("now", x === k); }); }
            };
        }

        function redemittel(keys) {
            const box = el("div", "e3-rm");
            REDEMITTEL.filter(function (g) { return !keys || keys.indexOf(g.key) !== -1; }).forEach(function (g) {
                const col = el("div", "e3-rm-group e3-rm-" + g.key);
                col.appendChild(el("span", "e3-rm-head", g.head));
                g.items.forEach(function (it) { col.appendChild(el("span", "e3-rm-item", it)); });
                box.appendChild(col);
            });
            return box;
        }

        /* ================= 1) النقط والعبارات ================= */

        function buildPlan() {
            const pane = el("div", "e1-pane");
            const b1 = el("section", "e1-box");
            b1.appendChild(el("h3", "e1-box-title", "🗂 Was müssen Sie planen? · شنو خاصكم تقررو"));
            b1.appendChild(el("p", "e1-box-hint", "فالامتحان خاصكم تهضرو على كل نقطة، ماشي غير على وحدة. فكر فكل نقطة فشي فكرة ولا جوج."));
            b1.appendChild(board().node);
            const ideas = el("div", "e3-ideas");
            (task.punkte || []).forEach(function (p) {
                const row = el("div", "e3-idea-row");
                row.appendChild(el("b", "e3-idea-label", p.label));
                (p.ideen || []).forEach(function (i, n) {
                    const chip = el("span", "e3-idea", i);
                    /* الترجمة كتبان غير ملي كيتشعل زر العربية */
                    if (p.ideenAr && p.ideenAr[n]) chip.appendChild(el("span", "t1-option-ar e3-idea-ar", p.ideenAr[n]));
                    row.appendChild(chip);
                });
                ideas.appendChild(row);
            });
            const d = document.createElement("details");
            d.className = "sp-phrases";
            d.appendChild(el("summary", "", "💡 أفكار لكل نقطة"));
            d.appendChild(ideas);
            b1.appendChild(d);
            pane.appendChild(b1);

            const b2 = el("section", "e1-box");
            b2.appendChild(el("h3", "e1-box-title", "💬 Redemittel · عبارات الحوار"));
            b2.appendChild(el("p", "e1-box-hint", "السر فTeil 3: ماشي غير تقترح — خاصك تجاوب على الـPartner، توافق ولا ترفض بأدب، وتقترح بديل، وفاللخر تفقو."));
            b2.appendChild(redemittel());
            pane.appendChild(b2);
            pane.appendChild(cta("شوف حوار نموذجي ←", "dialog"));
            return pane;
        }

        /* ================= 2) الحوار النموذجي ================= */

        function buildDialog() {
            const pane = el("div", "e1-pane");
            const box = el("section", "e1-box");
            const top = el("div", "e1-model-top");
            top.appendChild(el("h3", "e1-box-title", "Musterdialog · حوار نموذجي"));
            const play = btn("e1-btn e1-btn-soft", "▶ سمع الحوار");
            top.appendChild(play);
            box.appendChild(top);
            const list = el("div", "e3-dialog");
            const lines = (task.dialog || []).map(function (l) {
                const row = el("div", "e3-line e3-line-" + (l.who === "B" ? "b" : "a"));
                row.appendChild(el("span", "e3-who", l.who === "B" ? "B" : "A"));
                const bub = el("div", "e3-bubble");
                bub.appendChild(el("p", "e3-de", l.de));
                if (l.ar) bub.appendChild(el("p", "t2-q-ar", l.ar));
                row.appendChild(bub);
                list.appendChild(row);
                return { row: row, line: l };
            });
            box.appendChild(list);
            pane.appendChild(box);
            pane.appendChild(el("p", "e1-box-hint e2-center", "لاحظ: كل مرة A ولا B كيرد على الاقتراح (موافقة، رفض بأدب، ولا بديل)، وفاللخر B كيلخص الاتفاق."));
            pane.appendChild(cta("دابا دورك: خطط مع الـPartner ←", "sim"));

            let playing = 0;
            function stop() {
                playing++;
                K.hush();
                play.textContent = "▶ سمع الحوار";
                lines.forEach(function (x) { x.row.classList.remove("speaking"); });
            }
            play.addEventListener("click", function () {
                if (play.textContent.indexOf("⏹") === 0) { stop(); return; }
                const my = ++playing;
                play.textContent = "⏹ حبس";
                (function step(i) {
                    lines.forEach(function (x, j) { x.row.classList.toggle("speaking", j === i); });
                    if (my !== playing) return;
                    if (i >= lines.length) { stop(); return; }
                    lines[i].row.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    const ok = K.speak(lines[i].line.de, function () { if (my === playing) step(i + 1); },
                                       { alt: lines[i].line.who === "B" });
                    if (!ok) stop();
                })(0);
            });
            return { node: pane, stop: stop };
        }

        /* ================= 3) المحاكاة ================= */

        function buildSim() {
            const node = el("div", "e1-pane e1-sim");
            const stage = el("section", "e1-stage e3-stage");
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
                stage.appendChild(el("h3", "e1-stage-title", "Simulation · Teil 3"));
                const flow = el("ol", "e1-flow");
                [["🤖", "الـPartner كيقترح ← نتا كترد (توافق، ترفض، ولا تقترح بديل)"],
                 ["🙋", "نتا كتقترح ← الـPartner كيرد عليك"],
                 ["🤝", "من بعد كل نقطة كتختار شنو تفقتو عليه"],
                 ["📋", "فاللخر كتلخص الـPlan كامل بصوتك"]].forEach(function (s) {
                    const li = el("li"); li.append(el("span", "e1-flow-ico", s[0]), el("span", "", s[1])); flow.appendChild(li);
                });
                stage.appendChild(flow);
                const canRec = !!(navigator.mediaDevices && window.MediaRecorder);
                const recOpt = option("🎙 سجّل صوتي باش نسمع راسي", canRec);
                if (!canRec) recOpt.input.disabled = true;
                const opts = el("div", "e1-opts"); opts.appendChild(recOpt.label);
                stage.appendChild(opts);
                const start = btn("e1-btn e1-btn-main", "▶ بدا التخطيط");
                start.addEventListener("click", async function () {
                    const my = ++run;
                    /* شكون كيبدا: بالصدفة */
                    const partnerFirst = Math.random() < 0.5;
                    result = { values: {}, turns: [], clips: [], t0: Date.now(), partnerFirst: partnerFirst,
                               mic: false, wantMic: recOpt.input.checked };
                    if (recOpt.input.checked) {
                        start.disabled = true; start.textContent = "كنسولو على الميكرو…";
                        const s = K.recorderSession();
                        result.mic = await s.open();
                        if (my !== run) { s.close(); return; }
                        session = result.mic ? s : null;
                    }
                    point(0);
                });
                stage.appendChild(start);
            }

            /* ---- نقطة وحدة ---- */
            function point(i) {
                const p = (task.punkte || [])[i];
                if (!p) { summary(); return; }
                const partnerProposes = (i % 2 === 0) === result.partnerFirst;
                phase("point");

                const title = el("h3", "e1-stage-title", "Punkt " + (i + 1) + "/" + task.punkte.length + " · " + p.label);
                if (session) title.appendChild(el("span", "e1-live on", "REC"));
                stage.appendChild(title);

                const b = board(result.values);
                b.focus(p.key);
                stage.appendChild(b.node);

                const talkArea = el("div", "e3-talk");
                stage.appendChild(talkArea);

                if (partnerProposes) {
                    partnerSays(talkArea, p.partner.vorschlag, function () {
                        you(talkArea, "Reagieren Sie auf den Vorschlag", ["ja", "nein", "gegen"], function () { decide(i, p); });
                    });
                } else {
                    const ask = el("div", "e3-you-prompt");
                    ask.appendChild(el("b", "", "🙋 Sie sind dran: Machen Sie einen Vorschlag zu »" + p.label + "«"));
                    const ideas = el("div", "e3-ideas-inline");
                    (p.ideen || []).forEach(function (x) { ideas.appendChild(el("span", "e3-idea", x)); });
                    ask.appendChild(ideas);
                    talkArea.appendChild(ask);
                    you(talkArea, "Ihr Vorschlag", ["vorschlag"], function () {
                        partnerSays(talkArea, p.partner.reaktion, function () {
                            decide(i, p);
                        });
                    });
                }
            }

            /* الـPartner كيهضر (بالصوت + فقاعة) */
            function partnerSays(area, text, then) {
                const bub = el("div", "e3-partner");
                bub.appendChild(el("span", "e1-examiner-who", "🤖 Partner"));
                bub.appendChild(el("p", "e1-examiner-q", text));
                const again = btn("e1-btn e1-btn-soft", "🔊 عاود");
                again.addEventListener("click", function () { K.speak(text, null, { alt: true }); });
                bub.appendChild(again);
                area.appendChild(bub);
                bub.scrollIntoView({ behavior: "smooth", block: "nearest" });
                const my = run;
                let went = false;
                function go() { if (went || my !== run) return; went = true; then(); }
                if (!K.speak(text, go, { alt: true })) go(); else setTimeout(go, 12000);
            }

            /* دورك: تسجيل + وقت + عبارات */
            function you(area, label, rmKeys, then) {
                const box = el("div", "e3-you");
                const top = el("div", "e3-you-top");
                top.appendChild(el("b", "", "🎙 " + label));
                const t = el("span", "e3-you-t", "0:00");
                top.appendChild(t);
                box.appendChild(top);
                const barT = el("div", "e3-you-bar");
                const fill = el("span", "");
                barT.appendChild(fill);
                box.appendChild(barT);
                box.appendChild(redemittel(rmKeys));
                const done = btn("e1-btn e1-btn-main", "✓ قلت ديالي");
                box.appendChild(done);
                area.appendChild(box);
                box.scrollIntoView({ behavior: "smooth", block: "nearest" });

                if (session) session.start();
                let sec = 0, finished = false;
                const my = run;
                async function finish() {
                    if (finished) return;
                    finished = true; stopTimer();
                    result.turns.push(sec);
                    done.disabled = true;
                    const clip = session ? await session.stop() : null;
                    if (my !== run) return;
                    if (clip) result.clips.push({ label: label, url: clip });
                    box.classList.add("is-done");
                    then();
                }
                done.addEventListener("click", finish);
                tickEvery(function (s) {
                    sec = s;
                    t.textContent = clock(s);
                    fill.style.width = Math.min(100, s / TURN_SEC * 100) + "%";
                    box.dataset.tone = s < 8 ? "short" : "ok";
                    if (s >= TURN_SEC) finish();
                });
            }

            /* شنو تفقتو عليه؟ */
            function decide(i, p) {
                const area = stage.querySelector(".e3-talk");
                const box = el("div", "e3-decide");
                box.appendChild(el("b", "e3-decide-q", "🤝 Worauf haben Sie sich geeinigt? · على شنو تفقتو؟"));
                const opts = el("div", "e3-decide-opts");
                (p.ideen || []).forEach(function (idea) {
                    const b = btn("e3-choice", idea);
                    b.addEventListener("click", function () { pick(idea); });
                    opts.appendChild(b);
                });
                box.appendChild(opts);
                const own = el("div", "e3-own");
                const inp = document.createElement("input");
                inp.type = "text";
                inp.placeholder = "… أو كتب القرار ديالك";
                inp.className = "e3-own-input";
                const ok = btn("e1-btn e1-btn-soft", "OK");
                ok.addEventListener("click", function () { if (inp.value.trim()) pick(inp.value.trim()); });
                inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && inp.value.trim()) pick(inp.value.trim()); });
                own.append(inp, ok);
                box.appendChild(own);
                area.appendChild(box);
                box.scrollIntoView({ behavior: "smooth", block: "nearest" });

                let chosen = false;
                function pick(v) {
                    if (chosen) return;
                    chosen = true;
                    result.values[p.key] = v;
                    const cell = stage.querySelector(".e3-board");
                    if (cell) {
                        const b2 = board(result.values);
                        cell.replaceWith(b2.node);
                        b2.cells[p.key].node.classList.add("pop");
                    }
                    const my = run;
                    setTimeout(function () { if (my === run) point(i + 1); }, 650);
                }
            }

            /* فاللخر: لخص الـPlan بصوتك */
            function summary() {
                phase("summary");
                const title = el("h3", "e1-stage-title", "Zum Schluss: Plan zusammenfassen");
                if (session) title.appendChild(el("span", "e1-live on", "REC"));
                stage.appendChild(title);
                stage.appendChild(board(result.values).node);
                const sentence = ergebnis();
                const box = el("div", "e1-peek");
                box.appendChild(el("span", "e1-peek-label", "So könnten Sie es sagen"));
                box.appendChild(el("p", "e1-peek-text", sentence));
                stage.appendChild(box);
                const area = el("div", "e3-talk");
                stage.appendChild(area);
                you(area, "Fassen Sie den Plan zusammen", ["einig"], finishAll);
            }

            function ergebnis() {
                const parts = (task.punkte || []).map(function (p) {
                    return p.label.replace(/\?$/, "") + ": " + (result.values[p.key] || "—");
                });
                return "Dann halten wir fest: " + parts.join(" · ") + ". Ich denke, das wird eine schöne Sache!";
            }

            function finishAll() {
                stopTimer(); K.hush();
                if (session) { session.close(); session = null; }
                phase("result");
                stage.appendChild(el("h3", "e1-stage-title", "Unser Plan · الـPlan ديالكم"));
                const b = board(result.values);
                b.node.classList.add("final");
                stage.appendChild(b.node);

                const total = Math.round((Date.now() - result.t0) / 1000);
                const talked = result.turns.reduce(function (a, c) { return a + c; }, 0);
                const short = result.turns.filter(function (s) { return s < 8; }).length;
                const sum = el("div", "e1-score e1-score-" + (short ? "mid" : "good"));
                sum.appendChild(el("b", "e1-score-time", clock(talked)));
                sum.appendChild(el("span", "e1-score-label", "الوقت اللي هضرتي فيه (" + result.turns.length + " مرات)"));
                sum.appendChild(el("p", "e1-score-text", short
                    ? "كاين " + short + " ديال الأجوبة قصار بزاف. فTeil 3 ماشي غير «Ja, gut» — زيد السبب ولا اقتراح (…, weil … / Wie wäre es, wenn …)."
                    : "مزيان! هضرتي على كل النقط وتفقتو على plan كامل. 👏"));
                stage.appendChild(sum);
                stage.appendChild(el("p", "e1-box-hint", "⏱ المدة الكاملة: " + clock(total) + " — فالامتحان Teil 3 كياخد تقريباً 4–6 دقايق."));

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
                    "هضرت على كل النقط ديال الـPlan.",
                    "قدمت اقتراحات بعبارات مختلفة (Ich schlage vor / Wie wäre es …).",
                    "جاوبت على الـPartner وما تجاهلتوش.",
                    "رفضت بأدب وعطيت السبب مرة على الأقل.",
                    "قدمت اقتراح بديل (Was hältst du davon …).",
                    "وزعنا المهام (Wer kümmert sich um …?).",
                    "لخصت الاتفاق فاللخر (Dann halten wir fest …)."
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

                /* النقط: كل النقط تناقشو (5) + الردود (10) + Selbstcheck (10) */
                const nPoints = (task.punkte || []).length || 1;
                const decided = Object.keys(result.values).length;
                const good = result.turns.filter(function (sec) { return sec >= 8; }).length;
                const pb = K.pointsBox("teil3", [
                    { label: "Alle Punkte besprochen", pts: K.half(5 * decided / nPoints), max: 5 },
                    { label: "Vorschläge & Reaktionen", pts: K.half(10 * good / Math.max(1, result.turns.length)), max: 10 }
                ], 10);
                list.addEventListener("change", function () {
                    pb.update(list.querySelectorAll("input:checked").length / items.length);
                });
                stage.appendChild(pb.node);
                stage.appendChild(check);

                const row = el("div", "e1-row");
                const again = btn("e1-btn e1-btn-main", "↻ عاود (الـPartner يبدا مرة خرى)");
                again.addEventListener("click", function () {
                    result.clips.forEach(function (c) { if (c.url) URL.revokeObjectURL(c.url); });
                    run++; idle();
                });
                const model = btn("e1-btn e1-btn-soft", "📄 الحوار النموذجي");
                model.addEventListener("click", function () { show("dialog", true); });
                row.append(again, model);
                stage.appendChild(row);
            }

            idle();
            return { node: node, abort: abort };
        }
    }

    window.__sprechenTeil3Render = render;
})();
