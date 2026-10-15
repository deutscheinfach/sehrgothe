/* ===== Lesen Teil 2 — Multiple Choice =====

   شكل الصفحة (بحال Teil 1 و Teil 3):
     - تبويبات ديال النسخ (الأساسي / المعدل …) إلا كانو كثر من وحدة
     - على اليسار: النص مقسوم فقرات، كل فقرة تحتها
       الترجمة العربية (كتبان بالزر "بين الترجمة العربية")
     - على اليمين: لوحة "AUFGABEN" — الأسئلة 6–10، كل سؤال
       فيه A/B/C بالألماني والعربية، والشرح كيبان من بعد التصحيح.

   شكل البيانات:
   {
     title: "…",
     kind: "mc",
     texts: [ { title: "…", body: "…", ar: "…" }, … ],  // title اختياري · مشتركين بين النسخ
     variants: [
       {
         label: "الأساسي",
         title: "…",                             // اختياري — عنوان خاص بهاد النسخة
         note: "…",                              // اختياري — ملاحظة فوق الأسئلة
         texts: [ … ],                           // اختياري — كيعوض المشتركين
         questions: [
           { num: 6, text: "…", ar: "…",
             options: [ { text: "…", ar: "…" }, … ],
             answer: 0,                          // فهرس: 0 = A
             why: "…",                           // الشرح بالدارجة
             changed: true },                    // اختياري: شارة "معدل"
           …
         ]
       }
     ]
   }
*/

(function () {
    "use strict";

    const KEYS = ["A", "B", "C", "D"];

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function btn(className, text) {
        const node = document.createElement("button");
        node.type = "button";
        node.className = className;
        node.textContent = text;
        return node;
    }

    function toVariants(task) {
        const shared = Array.isArray(task.texts) ? task.texts : [];
        const list = (Array.isArray(task.variants) && task.variants.length)
            ? task.variants
            : [{ label: "الأساسي", questions: task.questions || [] }];

        return list.map(function (variant) {
            return Object.assign({}, variant, {
                texts: Array.isArray(variant.texts) ? variant.texts : shared,
                questions: variant.questions || []
            });
        });
    }

    function render(into, task, meta) {
        into.textContent = "";
        if (!task) {
            into.appendChild(el("div", "lesen-empty",
                "ما زال ماكاينش تمرين ف هاد الجزء."));
            return;
        }

        const variants = toVariants(task);
        let index = 0;

        const wrap = el("div", "t1 t2");

        if (variants.length > 1) {
            const bar = el("div", "t1-variants");
            variants.forEach(function (variant, i) {
                const tab = btn("t1-variant" + (i === 0 ? " active" : ""),
                                variant.label || ("نسخة " + (i + 1)));
                tab.addEventListener("click", function () {
                    if (i === index) return;
                    index = i;
                    Array.from(bar.children).forEach(function (other, oi) {
                        other.classList.toggle("active", oi === index);
                    });
                    paint();
                });
                bar.appendChild(tab);
            });
            wrap.appendChild(bar);
        }

        const head = el("div", "t1-head");
        const titleEl = el("h2", "t1-title");
        head.appendChild(titleEl);
        head.appendChild(el("div", "t1-kicker", "LESEVERSTEHEN TEIL 2"));
        if (window.__lesenArToggle) window.__lesenArToggle(head, wrap, task);
        wrap.appendChild(head);

        const board = el("div", "t1-board t1-stagger");
        wrap.appendChild(board);

        into.appendChild(wrap);
        paint();

        /* ================= رسم نسخة وحدة ================= */

        function paint() {
            const variant = variants[index];
            board.textContent = "";
            /* شي نسخ عندهم عنوان ديالهم */
            titleEl.textContent = variant.title || task.title || "Leseverstehen";

            /* ---- النص ---- */
            const column = el("div", "t1-texts");
            if (variant.intro) column.appendChild(el("p", "t1-intro", variant.intro));

            variant.texts.forEach(function (text) {
                const box = el("article", "t1-text");
                /* عنوان فرعي فوق الفقرة (اختياري) */
                if (text.title) box.appendChild(el("h3", "t2-sub", text.title));
                box.appendChild(el("p", "t1-body", text.body || ""));
                if (text.ar) box.appendChild(window.__lesenArBlock(text.ar));
                column.appendChild(box);
            });

            /* ---- لوحة الأسئلة ---- */
            const side = el("aside", "t1-side");
            const panel = el("div", "t1-panel t2-panel");

            const panelHead = el("div", "t1-panel-head");
            panelHead.appendChild(el("span", "t1-panel-title", "AUFGABEN"));
            const progress = el("span", "t1-progress");
            panelHead.appendChild(progress);
            panel.appendChild(panelHead);

            /* ملاحظة قصيرة على النسخة (شنو تبدل فيها) */
            if (variant.note) panel.appendChild(el("p", "t2-note", variant.note));

            const rows = variant.questions.map(function (question, qi) {
                const box = el("div", "t2-q");

                const top = el("div", "t2-q-top");
                top.appendChild(el("span", "t3-sit-num",
                    String(question.num || qi + 1) + "."));
                const stem = el("div", "t2-q-stem");
                stem.appendChild(el("p", "t2-q-de", question.text || ""));
                if (question.ar) stem.appendChild(el("p", "t2-q-ar", question.ar));
                top.appendChild(stem);
                /* السؤال اللي تبدل فهاد النسخة */
                if (question.changed) top.appendChild(el("span", "t2-q-changed", "معدل"));
                box.appendChild(top);

                const row = { box: box, question: question, picked: -1, buttons: [] };

                (question.options || []).forEach(function (option, oi) {
                    const item = btn("t1-option t2-option", "");
                    item.appendChild(el("span", "t1-option-key", KEYS[oi] || String(oi + 1)));
                    const textWrap = el("span", "t1-option-text");
                    textWrap.appendChild(el("span", "t1-option-de", option.text || ""));
                    if (option.ar) textWrap.appendChild(el("span", "t1-option-ar", option.ar));
                    item.appendChild(textWrap);

                    item.addEventListener("click", function () {
                        if (box.classList.contains("is-done")) return;
                        row.picked = oi;
                        row.buttons.forEach(function (other, i) {
                            other.classList.toggle("is-picked", i === oi);
                        });
                        paintProgress();
                        window.__lesenNext(panel, rows, row);
                    });

                    row.buttons.push(item);
                    box.appendChild(item);
                });

                if (question.why) {
                    const why = document.createElement("details");
                    why.className = "t1-summary t2-why";
                    why.hidden = true;
                    why.appendChild(el("summary", "", "الشرح"));
                    why.appendChild(el("p", "", question.why));
                    box.appendChild(why);
                    row.why = why;
                }

                panel.appendChild(box);
                return row;
            });

            /* ---- الأزرار ---- */
            const actions = el("div", "lesen-actions t2-actions");
            const checkBtn = btn("lesen-btn lesen-btn-check", "تحقق من الإجابات");
            const showBtn = btn("lesen-btn lesen-btn-show", "شوف الحل");
            const retryBtn = btn("lesen-btn lesen-btn-retry", "عاود من جديد");
            actions.append(checkBtn, showBtn, retryBtn);
            
            const score = el("div", "lesen-score");
            score.hidden = true;

            checkBtn.addEventListener("click", function () { grade(false); });
            showBtn.addEventListener("click", function () { grade(true); });
            retryBtn.addEventListener("click", reset);

            side.appendChild(panel);
            board.append(column, side);
            /* الأزرار تحت النصوص فالـPC، ومن بعد الأسئلة فالتيليفون */
            window.__lesenFoot(column, side, [actions, score]);
            paintProgress();

            function paintProgress() {
                const done = rows.filter(function (r) { return r.picked !== -1; }).length;
                progress.textContent = done + "/" + rows.length;
            }

            function grade(reveal) {
                let right = 0;
                let answered = 0;

                rows.forEach(function (row) {
                    clear(row);
                    const expected = Number(row.question.answer);
                    if (row.picked !== -1) answered++;
                    const ok = row.picked === expected;
                    if (ok) right++;

                    row.box.classList.add("is-done", ok ? "correct" : "wrong");
                    row.buttons.forEach(function (item, i) {
                        item.classList.remove("is-picked");
                        if (i === row.picked) item.classList.add(ok ? "is-right" : "is-wrong");
                        /* الجواب الصحيح كيتلون ديما ملي كتبرك على
                           "تحقق" — حتى إلا غلطتي ولا ما جاوبتيش.
                           بلا هادشي كتشوف غير "✗ Falsch" وماتعرفش
                           شنو كان الصحيح. */
                        if (i === expected) item.classList.add("is-right");
                    });

                    row.box.appendChild(el("div", "lesen-mark " + (ok ? "ok" : "no"),
                        ok ? "✓ Richtig"
                           : (reveal ? "Lösung: " + (KEYS[expected] || expected)
                                     : (row.picked === -1 ? "Noch nicht beantwortet" : "✗ Falsch"))));

                    if (row.why && (ok || reveal)) row.why.hidden = false;
                });

                /* الكلمات المفتاحية: الجواب الصحيح ديال كل سؤال ↔ النص */
                if (window.__lesenKeys) {
                    const bodies = Array.from(column.querySelectorAll(".t1-body"));
                    const answers = rows.map(function (r) {
                        const b = r.buttons[Number(r.question.answer)];
                        return b && b.querySelector(".t1-option-de");
                    }).filter(Boolean);
                    /* كل سؤال عندو الكلمات ديالو (الأدمين) — كيتلونو ف النص وف الجواب */
                    const ctx = window.__kwCustom && meta && meta.id ? {
                        doc: "lesen-" + String(meta.level || "b2").toLowerCase() + "-" + meta.id,
                        items: rows.map(function (r) {
                            const right = (r.question.options || [])[Number(r.question.answer)] || {};
                            return {
                                key: window.__kwCustom.key((r.question.text || "") + " | " + (right.text || "")),
                                box: r.box,
                                title: "كلمات مفتاحية — Frage " + (r.question.num || rows.indexOf(r) + 1)
                            };
                        })
                    } : null;
                    if (answers.length) window.__lesenKeys.link(bodies, answers, null, ctx);
                }

                window.__lesenScore(score, "teil2", right, rows.length, reveal,
                    rows.length - answered);
            }

            function clear(row) {
                row.box.classList.remove("is-done", "correct", "wrong");
                row.buttons.forEach(function (item) {
                    item.classList.remove("is-right", "is-wrong");
                });
                const mark = row.box.querySelector(".lesen-mark");
                if (mark) mark.remove();
                if (row.why) { row.why.hidden = true; row.why.open = false; }
                if (window.__lesenKeys) {
                    window.__lesenKeys.clear(Array.from(column.querySelectorAll(".t1-body")));
                    window.__lesenKeys.clear(row.buttons.map(function (b) { return b.querySelector(".t1-option-de"); }));
                }
            }

            function reset() {
                rows.forEach(function (row) {
                    clear(row);
                    row.picked = -1;
                    row.buttons.forEach(function (item) { item.classList.remove("is-picked"); });
                });
                paintProgress();
                score.hidden = true;
                wrap.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    window.__lesenTeil2Render = render;
})();
