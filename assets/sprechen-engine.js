/* ===== محرك Sprechen B2 =====

   كيبني التمرين من البيانات، وكيزيد جوج حوايج اللي
   كيحتاجهم الطالب بجد فالمحادثة:

     1) مؤقت بنفس وقت الامتحان
     2) تسجيل الصوت باش يسمع راسو ويعاود

   التسجيل كيبقا فالجهاز ديالو غير — ماكيتصيفط لحتى بلاصة.
*/

(function () {
    "use strict";

    /* عبارات الامتحان المعروفة لكل جزء. هادي حاجة
       كتتعلم ف أي كتاب تحضير — ماشي محتوى امتحان. */
    const REDEMITTEL = {
        teil1: {
            label: "Über Erfahrungen sprechen",
            groups: [
                { head: "البداية", items: [
                    "Ich möchte Ihnen heute von … erzählen.",
                    "Das war im letzten Sommer / vor zwei Jahren.",
                    "Ich erinnere mich noch genau an …" ] },
                { head: "الحكاية بالترتيب", items: [
                    "Zuerst … , danach … , schließlich …",
                    "Am Anfang war ich … , aber dann …",
                    "Ein Erlebnis werde ich nie vergessen: …" ] },
                { head: "الإحساس والتقييم", items: [
                    "Besonders beeindruckt hat mich, dass …",
                    "Weniger gut fand ich, dass …",
                    "Ich war total überrascht / begeistert / enttäuscht." ] },
                { head: "الخاتمة", items: [
                    "Im Nachhinein bin ich froh, dass …",
                    "Ich würde es jedem empfehlen, der …",
                    "Für mich war das wichtig, weil …" ] },
                { head: "ملي كيسولك الـPrüfer", items: [
                    "Das ist eine gute Frage. Ich denke, …",
                    "Wenn ich ehrlich bin, …",
                    "Darüber habe ich noch nicht nachgedacht, aber …" ] }
            ]
        },
        teil2: {
            label: "Diskussion",
            groups: [
                { head: "الموافقة", items: [
                    "Da stimme ich Ihnen völlig zu.",
                    "Das sehe ich genauso, weil …",
                    "Sie haben recht, allerdings …" ] },
                { head: "الاعتراض بأدب", items: [
                    "Da bin ich anderer Meinung.",
                    "Einerseits … , andererseits …",
                    "Das mag sein, trotzdem denke ich, dass …" ] },
                { head: "أخذ الكلمة", items: [
                    "Darf ich dazu kurz etwas sagen?",
                    "Ich würde gerne ergänzen, dass …",
                    "Um auf Ihre Frage zurückzukommen …" ] }
            ]
        },
        teil3: {
            label: "Problemlösung",
            groups: [
                { head: "الاقتراح", items: [
                    "Ich schlage vor, dass wir …",
                    "Wie wäre es, wenn wir … ?",
                    "Wir könnten auch … in Betracht ziehen." ] },
                { head: "الاتفاق", items: [
                    "Sind Sie damit einverstanden?",
                    "Gut, dann halten wir fest: …",
                    "Einverstanden, machen wir es so." ] },
                { head: "الترتيب", items: [
                    "Zunächst sollten wir … , danach …",
                    "Das Wichtigste ist meiner Meinung nach …",
                    "Bleibt noch die Frage, wer … übernimmt." ] }
            ]
        }
    };

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    /* ---------- المؤقت ---------- */

    function buildTimer(minutes) {
        const wrap = el("div", "sp-timer");
        const face = el("span", "sp-timer-face", "");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sp-btn sp-btn-ghost";

        let total = Math.max(1, Number(minutes) || 3) * 60;
        let left = total;
        let ticking = null;

        function paint() {
            const m = String(Math.floor(left / 60)).padStart(2, "0");
            const s = String(left % 60).padStart(2, "0");
            face.textContent = m + ":" + s;
            wrap.classList.toggle("low", left <= 30);
        }

        function stop() {
            clearInterval(ticking);
            ticking = null;
            btn.textContent = "▶ بدا";
        }

        btn.addEventListener("click", function () {
            if (ticking) { stop(); return; }
            if (left <= 0) left = total;
            btn.textContent = "⏸ وقف";
            ticking = setInterval(function () {
                left--;
                paint();
                if (left <= 0) { stop(); }
            }, 1000);
        });

        paint();
        stop();
        wrap.append(face, btn);
        return wrap;
    }

    /* ---------- التسجيل ---------- */

    function buildRecorder() {
        const wrap = el("div", "sp-rec");

        const start = document.createElement("button");
        start.type = "button";
        start.className = "sp-btn sp-btn-rec";
        start.textContent = "🎙 سجّل";

        const state = el("span", "sp-rec-state", "");
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.hidden = true;
        audio.className = "sp-rec-audio";

        let recorder = null;
        let chunks = [];
        let url = null;

        start.addEventListener("click", async function () {
            if (recorder && recorder.state === "recording") {
                recorder.stop();
                return;
            }

            if (!navigator.mediaDevices || !window.MediaRecorder) {
                state.textContent = "هاد المتصفح ماكيدعمش التسجيل.";
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recorder = new MediaRecorder(stream);
                chunks = [];

                recorder.ondataavailable = function (event) {
                    if (event.data && event.data.size) chunks.push(event.data);
                };

                recorder.onstop = function () {
                    stream.getTracks().forEach(function (t) { t.stop(); });
                    if (url) URL.revokeObjectURL(url);
                    url = URL.createObjectURL(new Blob(chunks, { type: "audio/webm" }));
                    audio.src = url;
                    audio.hidden = false;
                    start.textContent = "🎙 سجّل من جديد";
                    start.classList.remove("on");
                    state.textContent = "سمع راسك 👇";
                };

                recorder.start();
                start.textContent = "⏹ سالي";
                start.classList.add("on");
                state.textContent = "كيسجل…";
            } catch (error) {
                state.textContent = "ما عطيتيش الإذن للميكرو.";
                console.debug("MIC:", error && error.name);
            }
        });

        wrap.append(start, state, audio);
        return wrap;
    }

    /* ---------- التمرين ---------- */

    function buildTask(part, task) {
        const card = el("section", "lesen-task");

        const head = el("div", "lesen-task-head");
        head.appendChild(el("span", "lesen-task-num",
            part.replace("teil", "")));
        head.appendChild(el("h2", "", task.title
            || (REDEMITTEL[part] ? REDEMITTEL[part].label : "Aufgabe")));
        card.appendChild(head);

        const body = el("div", "lesen-task-body");

        const tools = el("div", "sp-tools");
        tools.appendChild(buildTimer(task.minutes));
        tools.appendChild(buildRecorder());
        body.appendChild(tools);

        if (task.intro) {
            const box = el("div", "lesen-text");
            box.appendChild(el("span", "lesen-text-label", "Aufgabe"));
            /* intro يقدر يكون سطر واحد ولا لائحة ديال السطور */
            [].concat(task.intro).forEach(function (line, i) {
                if (i) box.appendChild(document.createElement("br"));
                box.appendChild(document.createTextNode(line));
            });
            body.appendChild(box);
        }

        if (Array.isArray(task.points) && task.points.length) {
            const list = el("div", "sp-points");
            task.points.forEach(function (point, i) {
                const row = el("div", "sp-point");
                row.appendChild(el("span", "sp-point-num", String(i + 1)));
                row.appendChild(el("span", "", point));
                list.appendChild(row);
            });
            body.appendChild(list);
        }

        if (task.note) {
            const note = el("p", "sp-note", task.note);
            /* ملاحظة بالألمانية (بحال B1) كتتكتب من اليسار */
            if (!/[\u0600-\u06FF]/.test(task.note)) { note.dir = "ltr"; note.style.direction = "ltr"; note.style.textAlign = "left"; }
            body.appendChild(note);
        }

        /* الترجمة ديال المهمة — مطوية */
        if (task.ar) {
            const box = document.createElement("details");
            box.className = "sp-phrases";
            const sum = document.createElement("summary");
            sum.textContent = "🌐 ترجمة المهمة";
            box.appendChild(sum);
            if (task.ar.intro) box.appendChild(el("p", "sp-note sp-trans", task.ar.intro));
            if (Array.isArray(task.ar.points)) {
                const ul = el("ul", "sp-phrase-list sp-trans-list");
                task.ar.points.forEach(function (item) { ul.appendChild(el("li", "", item)); });
                box.appendChild(ul);
            }
            if (task.ar.note) box.appendChild(el("p", "sp-note sp-trans", task.ar.note));
            body.appendChild(box);
        }

        /* أسئلة وأجوبة نموذجية لكل نقطة — مطوية */
        if (Array.isArray(task.fragen) && task.fragen.length) {
            const box = document.createElement("details");
            box.className = "sp-phrases";
            const sum = document.createElement("summary");
            sum.textContent = task.fragenLabel || "❓ أسئلة وأجوبة نموذجية";
            box.appendChild(sum);
            task.fragen.forEach(function (group) {
                box.appendChild(el("div", "sp-phrase-head", group.head));
                const ul = el("ul", "sp-phrase-list");
                (group.items || []).forEach(function (item) {
                    const li = el("li", "sp-qa");
                    li.appendChild(el("b", "sp-qa-q", item.q));
                    li.appendChild(el("span", "sp-qa-a", item.a));
                    if (item.ar) li.appendChild(el("span", "sp-qa-ar", item.ar));
                    ul.appendChild(li);
                });
                box.appendChild(ul);
            });
            body.appendChild(box);
        }

        /* العبارات — مطوية باش ما تاخذش البلاصة.
           task.redemittel كيعوض العبارات العامة ديال الجزء (مثلا ف B1). */
        const pack = task.redemittel || REDEMITTEL[part];
        if (pack) {
            const box = document.createElement("details");
            box.className = "sp-phrases";
            const sum = document.createElement("summary");
            sum.textContent = "💬 عبارات كتنفعك ف " + pack.label;
            box.appendChild(sum);
            pack.groups.forEach(function (group) {
                box.appendChild(el("div", "sp-phrase-head", group.head));
                const ul = el("ul", "sp-phrase-list");
                group.items.forEach(function (item) {
                    ul.appendChild(el("li", "", item));
                });
                box.appendChild(ul);
            });
            body.appendChild(box);
        }

        card.appendChild(body);
        return card;
    }

    /* Teil 1 (Über Erfahrungen sprechen) عندو محاكي ديالو ف sprechen-teil1.js */
    window.__sprechenRedemittel = REDEMITTEL;

    window.__sprechenRender = function (into, part, task, topicId) {
        into.textContent = "";
        if (!task) {
            into.appendChild(el("div", "lesen-empty",
                "ما زال ماكاينش تمرين ف هاد الجزء."));
            return;
        }
        /* المحاكيات ديال Teil 1 / 2 / 3 (sprechen-teil1.js، teil2، teil3) */
        const sim = { erfahrung: window.__sprechenTeil1Render,
                      text: window.__sprechenTeil2Render,
                      plan: window.__sprechenTeil3Render,
                      meinungen: window.__sprechenB1Teil2Render,
                      planen: window.__sprechenB1Teil2Render }[task.kind];
        if (typeof sim === "function") {
            sim(into, task, topicId);
            return;
        }
        into.appendChild(buildTask(part, task));
    };
})();
