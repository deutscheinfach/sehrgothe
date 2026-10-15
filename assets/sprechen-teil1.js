/* ===== Sprechen B2 · Teil 1 — محاكي "Über Erfahrungen sprechen" =====

   تلاتة ديال المراحل فنفس الصفحة:

     1) Vorbereiten   — الأسئلة اللي كتعاونك، ورقة ديال النقط
                        (كتبقى محفوظة فالجهاز)، كلمات وعبارات.
     2) Mustertext    — نموذج ديال الكلام + الترجمة بالزر،
                        وتقدر تسمعو بصوت ألماني.
     3) Simulation    — بحال الامتحان: دقيقة تحضير (اختيارية)،
                        من بعد كتهضر بين 90 و180 ثانية، ومن بعد
                        الـPrüfer كيسولك جوج أسئلة بالصدفة (بالصوت).
                        فاللخر كتسمع التسجيلات ديالك وكتقيّم راسك.

   التسجيل كيبقا فالجهاز غير — ماكيتصيفط لحتى بلاصة.
*/

(function () {
    "use strict";

    const MIN_SEC = 90;
    const MAX_SEC = 180;
    const PREP_SEC = 60;
    const ANSWER_SEC = 60;

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function btn(className, text) {
        const node = el("button", className, text);
        node.type = "button";
        return node;
    }

    function clock(sec) {
        sec = Math.max(0, Math.round(sec));
        return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    }

    function store(key, value) {
        try {
            if (value === undefined) return localStorage.getItem(key) || "";
            localStorage.setItem(key, value);
        } catch (e) { /* وضع خاص ولا التخزين مسدود */ }
        return "";
    }

    function shuffle(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = copy[i]; copy[i] = copy[j]; copy[j] = t;
        }
        return copy;
    }

    /* ---------- الصوت الألماني (قراية بصوت) ---------- */

    function germanVoice() {
        if (!("speechSynthesis" in window)) return null;
        const voices = window.speechSynthesis.getVoices() || [];
        return voices.find(function (v) { return /^de(-|_|$)/i.test(v.lang) && /google|online|natural/i.test(v.name); })
            || voices.find(function (v) { return /^de(-|_|$)/i.test(v.lang); })
            || null;
    }
    if ("speechSynthesis" in window) {
        /* ف Chrome اللائحة كتوصل من بعد */
        window.speechSynthesis.getVoices();
    }

    /* Chrome كيوقف النصوص الطوال من بعد ~15 ثانية، إذن كنقسمو
       النص لجمل وكنقراوهم وحدة بوحدة. */
    /* opts.alt = صوت ألماني آخر (للحوار ديال جوج) */
    function speak(text, onEnd, opts) {
        if (!("speechSynthesis" in window)) return false;
        window.speechSynthesis.cancel();
        const parts = String(text).match(/[^.!?]+[.!?»“"]*\s*/g) || [String(text)];
        let voice = germanVoice();
        if (opts && opts.alt) {
            const all = (window.speechSynthesis.getVoices() || []).filter(function (v) { return /^de(-|_|$)/i.test(v.lang); });
            if (all.length > 1) voice = all.find(function (v) { return v !== voice; }) || voice;
        }
        let called = false;
        function end() { if (!called && onEnd) { called = true; onEnd(); } }
        parts.forEach(function (part, i) {
            const u = new SpeechSynthesisUtterance(part.trim());
            u.lang = "de-DE";
            u.rate = 0.95;
            if (opts && opts.alt) u.pitch = 0.8;
            if (voice) u.voice = voice;
            if (i === parts.length - 1) u.onend = end;
            u.onerror = end;
            window.speechSynthesis.speak(u);
        });
        return true;
    }

    function hush() {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }

    /* ---------- زر الترجمة ---------- */

    function arToggle(scope) {
        const button = btn("ar-toggle", "");
        const icon = el("span", "ar-toggle-icon", "ع");
        icon.setAttribute("aria-hidden", "true");
        const label = el("span");
        button.append(icon, label);
        function paint(on) {
            scope.classList.toggle("show-ar", on);
            button.classList.toggle("is-on", on);
            button.setAttribute("aria-pressed", on ? "true" : "false");
            label.textContent = on ? "خبي الترجمة" : "بين الترجمة العربية";
        }
        paint(false);
        button.addEventListener("click", function () {
            paint(!scope.classList.contains("show-ar"));
        });
        return button;
    }

    function arBlock(text, label) {
        const box = el("div", "ar-block");
        box.dir = "rtl";
        box.lang = "ar";
        box.appendChild(el("span", "ar-block-label", label || "الترجمة العربية"));
        box.appendChild(el("p", "", text));
        return box;
    }

    /* ---------- الدائرة ديال الوقت ---------- */

    function ring() {
        const NS = "http://www.w3.org/2000/svg";
        const R = 54;
        const C = 2 * Math.PI * R;
        const wrap = el("div", "e1-ring");
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 128 128");
        svg.setAttribute("aria-hidden", "true");

        const track = document.createElementNS(NS, "circle");
        track.setAttribute("class", "e1-ring-track");
        const bar = document.createElementNS(NS, "circle");
        bar.setAttribute("class", "e1-ring-bar");
        [track, bar].forEach(function (c) {
            c.setAttribute("cx", "64"); c.setAttribute("cy", "64"); c.setAttribute("r", String(R));
            svg.appendChild(c);
        });
        bar.setAttribute("stroke-dasharray", String(C));
        bar.setAttribute("stroke-dashoffset", String(C));

        /* علامة 90 ثانية (النص ديال الدائرة) */
        const tick = document.createElementNS(NS, "line");
        tick.setAttribute("class", "e1-ring-tick");
        /* الـsvg مدوّر -90°، إذن النص ديال الدورة (اليسار قبل التدوير) كيولي لتحت */
        tick.setAttribute("x1", "2"); tick.setAttribute("x2", "14");
        tick.setAttribute("y1", "64"); tick.setAttribute("y2", "64");
        tick.style.display = "none";
        svg.appendChild(tick);

        const face = el("div", "e1-ring-face");
        const big = el("b", "e1-ring-time", "0:00");
        const small = el("span", "e1-ring-hint", "");
        face.append(big, small);
        wrap.append(svg, face);

        return {
            node: wrap,
            set: function (fraction, time, hint, tone) {
                bar.setAttribute("stroke-dashoffset", String(C * (1 - Math.min(1, Math.max(0, fraction)))));
                big.textContent = time;
                small.textContent = hint || "";
                wrap.dataset.tone = tone || "";
            },
            showHalfTick: function (on) { tick.style.display = on ? "" : "none"; }
        };
    }

    /* ---------- المسجل (stream واحد للمحاكاة كاملة) ---------- */

    function recorderSession() {
        let stream = null;
        let rec = null;
        let chunks = [];
        let mime = "";

        return {
            get ready() { return !!stream; },
            open: async function () {
                if (!navigator.mediaDevices || !window.MediaRecorder) return false;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].some(function (t) {
                        if (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(t)) { mime = t; return true; }
                        return false;
                    });
                    return true;
                } catch (e) {
                    console.debug("MIC:", e && e.name);
                    stream = null;
                    return false;
                }
            },
            start: function () {
                if (!stream) return;
                chunks = [];
                /* بعض المتصفحات (Chrome ف Mac مع شي ميكرو) كيرفضو start() بالنوع
                   اللي اختارينا (NotSupportedError). كنجربو بلا نوع، وإلا كنكملو
                   المحاكاة بلا تسجيل بلا ما تطيح الصفحة. */
                const make = function (withMime) {
                    const r = withMime && mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
                    r.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
                    r.start();
                    return r;
                };
                try { rec = make(true); }
                catch (e) {
                    try { rec = make(false); }
                    catch (e2) {
                        rec = null;
                        console.debug("REC:", e2 && e2.name);
                        if (window.__deDiag) window.__deDiag("error", "التسجيل ما خدمش: " + (e2 && e2.name));
                    }
                }
            },
            stop: function () {
                return new Promise(function (resolve) {
                    if (!rec || rec.state === "inactive") { resolve(null); return; }
                    rec.onstop = function () {
                        const type = (rec.mimeType || mime || "audio/webm").split(";")[0];
                        resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: type })) : null);
                    };
                    rec.stop();
                });
            },
            close: function () {
                if (rec && rec.state !== "inactive") { try { rec.stop(); } catch (e) { /* */ } }
                if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
                stream = null;
            }
        };
    }

    /* ======================================================= */

    function render(into, task, topicId) {
        into.textContent = "";
        const wrap = el("div", "e1");
        const notesKey = "e1-notes-" + (topicId || "x");

        /* ---- العنوان ---- */
        const head = el("div", "t1-head");
        head.appendChild(el("h2", "t1-title", task.title || "Über Erfahrungen sprechen"));
        head.appendChild(el("div", "t1-kicker", "SPRECHEN TEIL 1 · ÜBER ERFAHRUNGEN SPRECHEN"));
        head.appendChild(arToggle(wrap));
        wrap.appendChild(head);

        /* ---- بطاقة المهمة ---- */
        const card = el("section", "e1-task");
        card.appendChild(el("span", "e1-task-label", "Aufgabe"));
        card.appendChild(el("p", "e1-task-de", task.aufgabe || ""));
        if (task.aufgabeAr) card.appendChild(arBlock(task.aufgabeAr, "المطلوب"));
        const facts = el("div", "e1-facts");
        [["⏱", "90–180 Sek. sprechen"], ["❓", "2 Fragen vom Prüfer"], ["🗣", "frei sprechen, nicht ablesen"]]
            .forEach(function (f) {
                const chip = el("span", "e1-fact");
                chip.append(el("span", "", f[0]), el("span", "", f[1]));
                facts.appendChild(chip);
            });
        card.appendChild(facts);
        wrap.appendChild(card);

        /* ---- المراحل ---- */
        const STEPS = [
            { key: "prep",  n: "1", de: "Vorbereiten",          ar: "التحضير" },
            { key: "model", n: "2", de: "Mustertext",           ar: "نموذج" },
            { key: "sim",   n: "3", de: "Prüfung simulieren",   ar: "محاكاة الامتحان" }
        ];
        const stepNav = el("nav", "e1-steps");
        stepNav.setAttribute("aria-label", "Schritte");
        const panes = {};
        const stepBtns = {};
        STEPS.forEach(function (s) {
            const b = btn("e1-step", "");
            b.append(el("span", "e1-step-n", s.n), el("span", "e1-step-de", s.de), el("span", "e1-step-ar", s.ar));
            b.addEventListener("click", function () { show(s.key, true); });
            stepBtns[s.key] = b;
            stepNav.appendChild(b);
        });
        wrap.appendChild(stepNav);

        const body = el("div", "e1-body");
        wrap.appendChild(body);

        panes.prep = buildPrep();
        panes.model = buildModel();
        const sim = buildSim();
        panes.sim = sim.node;
        Object.keys(panes).forEach(function (k) { panes[k].hidden = true; body.appendChild(panes[k]); });

        into.appendChild(wrap);
        show("prep", false);

        function show(key, scroll) {
            hush();
            Object.keys(panes).forEach(function (k) {
                panes[k].hidden = k !== key;
                stepBtns[k].classList.toggle("active", k === key);
                stepBtns[k].setAttribute("aria-current", k === key ? "step" : "false");
            });
            if (key !== "sim") sim.abort();
            if (scroll) stepNav.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        /* ================= 1) التحضير ================= */

        function buildPrep() {
            const pane = el("div", "e1-pane e1-prep");

            const left = el("div", "e1-col");
            const qBox = el("section", "e1-box");
            qBox.appendChild(el("h3", "e1-box-title", "Leitfragen · على شنو تهضر"));
            qBox.appendChild(el("p", "e1-box-hint",
                "جاوب فراسك على هاد الأسئلة بالترتيب — هكا الكلام ديالك غادي يكون منظم. برك على سؤال ملي تحضّرو."));
            const qList = el("ol", "e1-guide");
            (task.leitfragen || []).forEach(function (q) {
                const li = el("li", "e1-guide-item");
                const b = btn("e1-guide-btn", "");
                b.setAttribute("aria-pressed", "false");
                const check = el("span", "e1-check");
                check.setAttribute("aria-hidden", "true");
                const txt = el("span", "e1-guide-text");
                txt.appendChild(el("span", "e1-guide-de", q.de));
                if (q.ar) txt.appendChild(el("span", "t2-q-ar", q.ar));
                b.append(check, txt);
                b.addEventListener("click", function () {
                    const on = !li.classList.contains("done");
                    li.classList.toggle("done", on);
                    b.setAttribute("aria-pressed", on ? "true" : "false");
                });
                li.appendChild(b);
                qList.appendChild(li);
            });
            qBox.appendChild(qList);
            left.appendChild(qBox);

            const nBox = el("section", "e1-box");
            nBox.appendChild(el("h3", "e1-box-title", "Stichpunkte · النقط ديالك"));
            nBox.appendChild(el("p", "e1-box-hint",
                "كتب غير كلمات مفتاحية، ماشي جمل كاملة — فالامتحان ما كتقراش من الورقة. كيتسجلو فالجهاز ديالك وغادي يبانو ليك فالمحاكاة."));
            const area = document.createElement("textarea");
            area.className = "e1-notes";
            area.rows = 6;
            area.dir = "auto";
            area.placeholder = "z. B.  Sommer 2023 · mit Freunden · Bus · blaue Gassen · verlaufen · Tee …";
            area.value = store(notesKey);
            area.addEventListener("input", function () { store(notesKey, area.value); });
            nBox.appendChild(area);
            left.appendChild(nBox);

            const right = el("div", "e1-col");
            if ((task.wortschatz || []).length) {
                const wBox = el("section", "e1-box");
                wBox.appendChild(el("h3", "e1-box-title", "Wortschatz · كلمات"));
                const chips = el("div", "e1-words");
                task.wortschatz.forEach(function (w) {
                    const chip = el("span", "e1-word");
                    chip.appendChild(el("span", "e1-word-de", w.de));
                    if (w.ar) chip.appendChild(el("span", "t1-option-ar", w.ar));
                    chips.appendChild(chip);
                });
                wBox.appendChild(chips);
                right.appendChild(wBox);
            }

            const pack = (window.__sprechenRedemittel || {}).teil1;
            if (pack) {
                const rBox = el("section", "e1-box");
                rBox.appendChild(el("h3", "e1-box-title", "Redemittel · عبارات جاهزين"));
                pack.groups.forEach(function (g) {
                    rBox.appendChild(el("div", "sp-phrase-head", g.head));
                    const ul = el("ul", "sp-phrase-list");
                    g.items.forEach(function (it) { ul.appendChild(el("li", "", it)); });
                    rBox.appendChild(ul);
                });
                right.appendChild(rBox);
            }

            const go = btn("e1-cta", "جاهز؟ دوز للمحاكاة ←");
            go.addEventListener("click", function () { show("sim", true); });

            const grid = el("div", "e1-grid");
            grid.append(left, right);
            pane.append(grid, go);
            return pane;
        }

        /* ================= 2) النموذج ================= */

        function buildModel() {
            const pane = el("div", "e1-pane e1-model");
            const m = task.muster || {};
            const words = (m.de || "").split(/\s+/).filter(Boolean).length;
            const secs = Math.round(words / 2.1);

            const box = el("section", "e1-box");
            const top = el("div", "e1-model-top");
            top.appendChild(el("h3", "e1-box-title", "Mustertext · نموذج"));
            const meta = el("span", "e1-model-meta", words + " Wörter · ≈ " + clock(secs) + " Min.");
            top.appendChild(meta);
            box.appendChild(top);

            const tools = el("div", "e1-model-tools");
            const play = btn("e1-btn e1-btn-soft", "🔊 سمع النموذج");
            let playing = false;
            play.addEventListener("click", function () {
                if (playing) { hush(); playing = false; play.textContent = "🔊 سمع النموذج"; return; }
                const ok = speak(m.de || "", function () { playing = false; play.textContent = "🔊 سمع النموذج"; });
                if (ok) { playing = true; play.textContent = "⏹ حبس"; }
                else play.textContent = "المتصفح ماكيدعمش القراية بالصوت";
            });
            tools.appendChild(play);
            box.appendChild(tools);

            box.appendChild(el("p", "e1-model-de", m.de || ""));
            if (m.ar) box.appendChild(arBlock(m.ar));

            box.appendChild(el("p", "e1-box-hint",
                "ماتحفظش النموذج كلمة بكلمة. شوف كيفاش مقسوم: البداية ← شنو وقع بالترتيب ← الإحساس والتقييم ← الخاتمة. ومن بعد حكي التجربة ديالك نتا."));

            const go = btn("e1-cta", "دابا دورك: دوز للمحاكاة ←");
            go.addEventListener("click", function () { show("sim", true); });

            pane.append(box, go);
            return pane;
        }

        /* ================= 3) المحاكاة ================= */

        function buildSim() {
            const node = el("div", "e1-pane e1-sim");
            const stage = el("section", "e1-stage");
            node.appendChild(stage);

            let session = null;
            let timer = null;
            let run = 0;             // كيتزاد مع كل بداية/توقيف باش المؤقتات القدام يسكتو
            let result = null;

            function alive() { return document.body.contains(wrap); }

            function stopTimer() { clearInterval(timer); timer = null; }

            function abort() {
                run++;
                stopTimer();
                hush();
                if (session) { session.close(); session = null; }
                if (stage.dataset.phase && stage.dataset.phase !== "idle" && stage.dataset.phase !== "result") idle();
            }

            function tickEvery(fn) {
                stopTimer();
                const myRun = run;
                const t0 = Date.now();
                timer = setInterval(function () {
                    if (myRun !== run) { stopTimer(); return; }
                    if (!alive()) { abort(); return; }
                    fn((Date.now() - t0) / 1000);
                }, 250);
                fn(0);
            }

            function phase(name) {
                stage.textContent = "";
                stage.dataset.phase = name;
            }

            /* ---- قبل ما تبدا ---- */
            function idle() {
                phase("idle");
                stopTimer();
                stage.appendChild(el("h3", "e1-stage-title", "Prüfungssimulation"));
                const steps = el("ol", "e1-flow");
                [
                    ["⏳", "دقيقة ديال التحضير (اختيارية)"],
                    ["🎙", "كتهضر بوحدك: بين 1:30 و 3:00 دقايق"],
                    ["❓", "الـPrüfer كيسولك جوج أسئلة — كتسمعهم بالصوت"],
                    ["🎧", "كتسمع التسجيلات ديالك وكتقيّم راسك"]
                ].forEach(function (s) {
                    const li = el("li");
                    li.append(el("span", "e1-flow-ico", s[0]), el("span", "", s[1]));
                    steps.appendChild(li);
                });
                stage.appendChild(steps);

                const opts = el("div", "e1-opts");
                const recOpt = option("🎙 سجّل صوتي باش نسمع راسي", !!(navigator.mediaDevices && window.MediaRecorder));
                if (!(navigator.mediaDevices && window.MediaRecorder)) {
                    recOpt.input.disabled = true;
                    recOpt.label.title = "هاد المتصفح ماكيدعمش التسجيل";
                }
                const prepOpt = option("⏳ دقيقة ديال التحضير قبل", true);
                opts.append(recOpt.label, prepOpt.label);
                stage.appendChild(opts);

                const start = btn("e1-btn e1-btn-main", "▶ بدا الامتحان");
                start.addEventListener("click", async function () {
                    const myRun = ++run;
                    result = { speak: 0, answers: [], clips: [], questions: shuffle(task.fragen || []).slice(0, 2),
                               mic: false, wantMic: recOpt.input.checked };
                    if (recOpt.input.checked) {
                        start.disabled = true;
                        start.textContent = "كنسولو على الميكرو…";
                        session = recorderSession();
                        const opened = session;
                        result.mic = await opened.open();
                        if (myRun !== run) { opened.close(); return; }
                        if (!result.mic) session = null;
                    }
                    if (prepOpt.input.checked) prep(); else talk();
                });
                stage.appendChild(start);
            }

            function option(text, checked) {
                const label = el("label", "e1-opt");
                const input = document.createElement("input");
                input.type = "checkbox";
                input.checked = checked;
                label.append(input, el("span", "", text));
                return { label: label, input: input };
            }

            /* ---- التحضير ---- */
            function prep() {
                phase("prep");
                stage.appendChild(el("h3", "e1-stage-title", "Vorbereitung"));
                const r = ring();
                stage.appendChild(r.node);
                stage.appendChild(el("p", "e1-stage-task", task.aufgabe || ""));
                notesPeek();
                micNote();
                const skip = btn("e1-btn e1-btn-main", "أنا جاهز — بدا الهضرة");
                skip.addEventListener("click", talk);
                stage.appendChild(skip);
                tickEvery(function (t) {
                    const left = PREP_SEC - t;
                    r.set(t / PREP_SEC, clock(left), "تحضير", "prep");
                    if (left <= 0) talk();
                });
            }

            function micNote() {
                if (result && result.wantMic && !result.mic) {
                    stage.appendChild(el("p", "e1-mic-note",
                        "🎙 التسجيل مطفي (ولا ما عطيتيش الإذن للميكرو). المحاكاة خدامة عادي بلا تسجيل."));
                }
            }

            function notesPeek() {
                const notes = store(notesKey).trim();
                const box = el("div", "e1-peek");
                if (notes) {
                    box.appendChild(el("span", "e1-peek-label", "Stichpunkte"));
                    box.appendChild(el("p", "e1-peek-text", notes));
                } else {
                    box.appendChild(el("span", "e1-peek-label", "Leitfragen"));
                    const ul = el("ul", "e1-peek-list");
                    (task.leitfragen || []).forEach(function (q) { ul.appendChild(el("li", "", q.de)); });
                    box.appendChild(ul);
                }
                stage.appendChild(box);
            }

            /* ---- الهضرة (90–180 ثانية) ---- */
            function talk() {
                stopTimer();
                phase("talk");
                const recDot = el("span", "e1-live" + (session ? " on" : ""), session ? "REC" : "");
                const title = el("h3", "e1-stage-title", "Sprechen Sie jetzt");
                title.appendChild(recDot);
                stage.appendChild(title);
                const r = ring();
                r.showHalfTick(true);
                stage.appendChild(r.node);
                const bar = el("div", "e1-zones");
                bar.append(el("span", "z-short", "< 1:30 قصير"), el("span", "z-ok", "1:30 – 3:00 مزيان"));
                stage.appendChild(bar);
                notesPeek();
                const done = btn("e1-btn e1-btn-main", "✓ ساليت");
                stage.appendChild(done);

                if (session) session.start();
                let finished = false;
                let seconds = 0;

                async function finish() {
                    if (finished) return;
                    finished = true;
                    stopTimer();
                    result.speak = seconds;
                    const myRun = run;
                    const clip = session ? await session.stop() : null;
                    if (myRun !== run) return;
                    result.clips.push({ label: "Ihr Vortrag", url: clip });
                    ask(0);
                }

                done.addEventListener("click", finish);

                tickEvery(function (t) {
                    seconds = t;
                    let hint = "باقي شوية";
                    let tone = "short";
                    if (t >= MIN_SEC) { hint = "مزيان — كمّل"; tone = "ok"; }
                    if (t >= MAX_SEC - 20) { hint = "سالي دابا"; tone = "end"; }
                    r.set(t / MAX_SEC, clock(t), hint, tone);
                    done.classList.toggle("is-early", t < MIN_SEC);
                    if (t >= MAX_SEC) finish();
                });
            }

            /* ---- أسئلة الـPrüfer ---- */
            function ask(i) {
                const q = result.questions[i];
                if (!q) { finishAll(); return; }
                stopTimer();
                phase("ask");

                const title = el("h3", "e1-stage-title", "Frage " + (i + 1) + " von " + result.questions.length);
                if (session) title.appendChild(el("span", "e1-live on", "REC"));
                stage.appendChild(title);

                const bubble = el("div", "e1-examiner");
                bubble.appendChild(el("span", "e1-examiner-who", "👩‍🏫 Prüferin"));
                bubble.appendChild(el("p", "e1-examiner-q", q.de));
                if (q.ar) bubble.appendChild(el("p", "t2-q-ar", q.ar));
                const again = btn("e1-btn e1-btn-soft", "🔊 عاود السؤال");
                again.addEventListener("click", function () { speak(q.de); });
                bubble.appendChild(again);
                stage.appendChild(bubble);

                const r = ring();
                stage.appendChild(r.node);
                const next = btn("e1-btn e1-btn-main", i + 1 < result.questions.length ? "✓ جاوبت — السؤال الجاي" : "✓ جاوبت — شوف النتيجة");
                stage.appendChild(next);

                let finished = false;
                let seconds = 0;

                async function finish() {
                    if (finished) return;
                    finished = true;
                    stopTimer();
                    hush();
                    result.answers.push(seconds);
                    const myRun = run;
                    const clip = session ? await session.stop() : null;
                    if (myRun !== run) return;
                    result.clips.push({ label: "Antwort " + (i + 1) + ": " + q.de, url: clip });
                    ask(i + 1);
                }
                next.addEventListener("click", finish);

                /* السؤال كيتقرا بالصوت، ومن بعد كيبدا الوقت والتسجيل */
                const myRun = run;
                let started = false;
                function begin() {
                    if (myRun !== run || finished || started) return;
                    started = true;
                    if (session) session.start();
                    tickEvery(function (t) {
                        seconds = t;
                        r.set(t / ANSWER_SEC, clock(t), t < 15 ? "زيد شوية" : "مزيان", t < 15 ? "short" : "ok");
                        if (t >= ANSWER_SEC) finish();
                    });
                }
                r.set(0, "🔊", "كيسولك…", "prep");
                const spoke = speak(q.de, begin);
                if (!spoke) begin();
                /* شي تيليفونات ما كيعيطوش على onend — ما نبقاوش واقفين */
                else setTimeout(begin, 9000);
            }

            /* ---- النتيجة ---- */
            function finishAll() {
                stopTimer();
                hush();
                if (session) { session.close(); session = null; }
                phase("result");

                stage.appendChild(el("h3", "e1-stage-title", "Auswertung · التقييم"));

                const s = result.speak;
                let verdict, tone;
                if (s < 60) { verdict = "قصير بزاف. فالامتحان خاصك تهضر على الأقل دقيقة ونص. زيد تفاصيل: فين، إمتى، مع من، شنو حسيتي، علاش مهم."; tone = "bad"; }
                else if (s < MIN_SEC) { verdict = "قريب! باقي شوية باش توصل لدقيقة ونص. زيد مثال ولا إحساس ولا تقييم فاللخر."; tone = "mid"; }
                else if (s <= MAX_SEC) { verdict = "الوقت مزيان — بين دقيقة ونص وتلت دقايق بحال الامتحان. 👏"; tone = "good"; }
                else { verdict = "وصلتي لتلت دقايق — فالامتحان الـPrüfer غادي يوقفك. حاول تختصر شوية."; tone = "mid"; }

                const sum = el("div", "e1-score e1-score-" + tone);
                sum.appendChild(el("b", "e1-score-time", clock(s)));
                sum.appendChild(el("span", "e1-score-label", "مدة الكلام ديالك"));
                sum.appendChild(el("p", "e1-score-text", verdict));
                stage.appendChild(sum);

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
                    if (result.answers.some(function (sec) { return sec < 15; })) {
                        stage.appendChild(el("p", "e1-box-hint",
                            "شي جواب كان قصير. جاوب ديما بجوج ولا تلاتة ديال الجمل: الجواب + السبب (weil …) + مثال."));
                    }
                }

                const clips = result.clips.filter(function (c) { return c.url; });
                if (clips.length) {
                    const box = el("div", "e1-clips");
                    box.appendChild(el("span", "e1-peek-label", "🎧 سمع راسك"));
                    clips.forEach(function (c) {
                        const row = el("div", "e1-clip");
                        row.appendChild(el("span", "e1-clip-label", c.label));
                        const audio = document.createElement("audio");
                        audio.controls = true;
                        audio.preload = "metadata";
                        audio.src = c.url;
                        row.appendChild(audio);
                        box.appendChild(row);
                    });
                    stage.appendChild(box);
                } else if (!result.wantMic) {
                    stage.appendChild(el("p", "e1-mic-note",
                        "ما كانش التسجيل. المرة الجاية خلي 🎙 مشعول باش تسمع راسك — كتبان ليك الأخطاء بزربة."));
                }

                const check = el("section", "e1-box e1-self");
                check.appendChild(el("h3", "e1-box-title", "Selbstcheck · قيّم راسك"));
                const items = [
                    "بديت بجملة واضحة (Ich möchte von … erzählen).",
                    "قلت فين، إمتى ومع من.",
                    "حكيت الأحداث بالترتيب (zuerst, danach, schließlich).",
                    "استعملت Perfekt/Präteritum بلا ما نخلط.",
                    "عبرت على الإحساس ديالي وعطيت رأيي (Besonders gefallen hat mir …).",
                    "استعملت Konnektoren: weil, obwohl, deshalb, trotzdem.",
                    "ساليت بخاتمة (Im Nachhinein … / Ich würde es empfehlen …).",
                    "جاوبت على الأسئلة بجمل كاملة، ماشي بكلمة وحدة."
                ];
                const list = el("div", "e1-self-list");
                const count = el("span", "t1-progress", "0/" + items.length);
                check.querySelector(".e1-box-title").appendChild(count);
                items.forEach(function (text) {
                    const label = el("label", "e1-opt e1-self-item");
                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.addEventListener("change", function () {
                        const n = list.querySelectorAll("input:checked").length;
                        count.textContent = n + "/" + items.length;
                    });
                    label.append(input, el("span", "", text));
                    list.appendChild(label);
                });
                check.appendChild(list);

                /* النقط: الوقت (10) + الأجوبة (5) + Selbstcheck (10) */
                const answerPts = half(result.answers.reduce(function (a, sec) {
                    return a + (sec >= 15 ? 2.5 : sec >= 5 ? 1 : 0);
                }, 0));
                const pb = pointsBox("teil1", [
                    { label: "Sprechzeit", pts: timePoints(result.speak, MIN_SEC, MAX_SEC, 10), max: 10 },
                    { label: "Fragen", pts: Math.min(5, answerPts), max: 5 }
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
                    run++;
                    idle();
                });
                const model = btn("e1-btn e1-btn-soft", "📄 شوف النموذج");
                model.addEventListener("click", function () { show("model", true); });
                row.append(again, model);
                stage.appendChild(row);
            }

            idle();
            return { node: node, abort: abort };
        }
    }

    window.__sprechenTeil1Render = render;

    /* الأدوات المشتركة — Teil 2 و Teil 3 كيستعملوهم */
    /* ---- النقط (25 لكل جزء، بحال telc) ----
       تقدير تقريبي: جزء كيتحسب أوتوماتيكياً (الوقت، الأجوبة…)
       والباقي من الـSelbstcheck. كيتصيفط حدث "sprechen-points"
       باش الـPrüfung الكاملة تجمع المجموع. */
    function half(n) { return Math.round(n * 2) / 2; }
    function fmtPts(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","); }

    /* الوقت: كامل النقط فالمجال المطلوب، وشوية إلا كان قريب */
    function timePoints(sec, min, max, full) {
        if (sec >= min && sec <= max + 30) return full;
        if (sec > max + 30) return half(full * 0.8);
        if (sec >= min * 0.66) return half(full * 0.6);
        if (sec >= min * 0.33) return half(full * 0.3);
        return 0;
    }

    function pointsBox(part, fixed, selfMax) {
        const MAX = 25;
        const box = el("section", "e1-points");
        const head = el("div", "e1-points-head");
        head.appendChild(el("span", "", "Punkte · النقط"));
        const big = el("b", "e1-points-total", "");
        head.appendChild(big);
        box.appendChild(head);
        const rows = el("div", "e1-points-rows");
        box.appendChild(rows);
        box.appendChild(el("p", "e1-points-note",
            "تقدير تقريبي: الوقت والأجوبة كيتحسبو بوحدهم، والباقي من الـSelbstcheck ديالك. فالامتحان الـPrüfer هو اللي كيصحح."));

        function row(label, pts, max) {
            const r = el("div", "exam-summary-row");
            r.appendChild(el("span", "", label));
            const track = el("span", "exam-summary-track");
            const fill = el("span", "");
            fill.style.width = (max ? pts / max * 100 : 0) + "%";
            track.appendChild(fill);
            r.appendChild(track);
            r.appendChild(el("b", "", fmtPts(pts) + " / " + max));
            return r;
        }

        function update(selfRatio) {
            const selfPts = half(selfMax * (selfRatio || 0));
            let total = selfPts;
            rows.textContent = "";
            fixed.forEach(function (f) { total += f.pts; rows.appendChild(row(f.label, f.pts, f.max)); });
            rows.appendChild(row("Selbstcheck", selfPts, selfMax));
            total = Math.min(MAX, half(total));
            big.textContent = fmtPts(total) + " / " + MAX;
            box.dataset.tone = total >= 20 ? "good" : total >= 15 ? "mid" : "bad";
            try {
                window.dispatchEvent(new CustomEvent("sprechen-points",
                    { detail: { part: part, points: total, max: MAX } }));
            } catch (e) { /* */ }
        }
        update(0);
        return { node: box, update: update };
    }

    window.__sprechenKit = {
        el: el, btn: btn, clock: clock, store: store, shuffle: shuffle,
        speak: speak, hush: hush, arToggle: arToggle, arBlock: arBlock,
        ring: ring, recorderSession: recorderSession,
        pointsBox: pointsBox, timePoints: timePoints, half: half
    };
})();
