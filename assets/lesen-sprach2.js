/* ===== Lesen Sprachbausteine Teil 2 — نص + لائحة ديال الكلمات =====

   شكل الصفحة:
     - على اليسار: النص، وكل فراغ مرقم [31]…[40] كيبان بحال خانة.
       فاش كتضغط على خانة، كتحل تحتها لائحة الكلمات (A–O)،
       كتختار وحدة وكتتكتب فالخانة. هادشي كيخدم مزيان فالتيليفون.
     - على اليمين: "WÖRTER" — الكلمات 15 (كل كلمة كتستعمل مرة وحدة)،
       ومن تحتهم Lücke 31–40 مع الجواب والشرح من بعد التصحيح.

   شكل البيانات:
   {
     title: "…",
     kind: "bank",
     variants: [
       {
         label: "الأساسي",
         title: "…",                                  // اختياري
         note: "…",                                   // اختياري
         texts: [ { body: "… [31] …" } ],             // \n = فقرة جديدة
         words: ["AUSWAHL", "CHANCE", …],             // A, B, C… بالترتيب
         changedWords: ["O"],                         // اختياري: شارة "معدل"
         questions: [ { num: 31, answer: "E", why: "…" }, … ]
       }
     ]
   }
*/

(function () {
    "use strict";

    const GAP = /\[(\d+)\]/g;
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

    function render(into, task) {
        into.textContent = "";
        if (!task) {
            into.appendChild(el("div", "lesen-empty", "ما زال ماكاينش تمرين ف هاد الجزء."));
            return;
        }

        const variants = (Array.isArray(task.variants) && task.variants.length)
            ? task.variants : [task];
        let index = 0;

        const wrap = el("div", "t1 t2 sp sp2");

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
        head.appendChild(el("div", "t1-kicker", task.kicker || "SPRACHBAUSTEINE TEIL 2"));
        wrap.appendChild(head);

        const board = el("div", "t1-board t1-stagger");
        wrap.appendChild(board);
        into.appendChild(wrap);
        paint();

        function paint() {
            const variant = variants[index];
            board.textContent = "";
            titleEl.textContent = variant.title || task.title || "Sprachbausteine";

            const words = (variant.words || []).map(function (word, i) {
                return { key: LETTERS[i], text: word };
            });
            const byKey = {};
            words.forEach(function (w) { byKey[w.key] = w; });

            /* الحالة: رقم الفراغ ← حرف الكلمة */
            const picked = {};
            let active = null;          // الفراغ المفتوح دابا
            let done = false;           // من بعد التصحيح كنسدو الاختيار

            const gaps = {};            // num → [{node, word, line}]

            /* ---- النص ---- */
            const column = el("div", "t1-texts");
            if (variant.intro) column.appendChild(el("p", "t1-intro", variant.intro));

            const pop = el("div", "sp2-pop");
            pop.hidden = true;

            (variant.texts || []).forEach(function (text) {
                const box = el("article", "t1-text sp-text");
                if (text.title) box.appendChild(el("h3", "t2-sub", text.title));

                String(text.body || "").split("\n").forEach(function (line) {
                    const p = el("p", "t1-body sp-line");
                    if (!line.trim()) p.classList.add("sp-blank");
                    let last = 0;
                    line.replace(GAP, function (match, num, at) {
                        if (at > last) p.appendChild(document.createTextNode(line.slice(last, at)));
                        const gap = btn("sp-gap", "");
                        gap.appendChild(el("span", "sp-gap-num", num));
                        const word = el("span", "sp-gap-word", "…");
                        gap.appendChild(word);
                        gap.setAttribute("aria-label", "Lücke " + num);
                        gap.addEventListener("click", function () { toggle(num); });
                        (gaps[num] = gaps[num] || []).push({ node: gap, word: word, line: p });
                        p.appendChild(gap);
                        last = at + match.length;
                        return match;
                    });
                    if (last < line.length) p.appendChild(document.createTextNode(line.slice(last)));
                    box.appendChild(p);
                });
                column.appendChild(box);
            });

            /* ---- اللوحة ---- */
            const side = el("aside", "t1-side");
            const panel = el("div", "t1-panel t2-panel");

            const panelHead = el("div", "t1-panel-head");
            panelHead.appendChild(el("span", "t1-panel-title", "WÖRTER"));
            const progress = el("span", "t1-progress");
            panelHead.appendChild(progress);
            panel.appendChild(panelHead);

            if (variant.note) panel.appendChild(el("p", "t2-note", variant.note));
            const hint = el("p", "sp2-hint", "كليكي على فراغ فالنص، ومن بعد اختار الكلمة. كل كلمة كتستعمل غير مرة وحدة.");
            panel.appendChild(hint);

            const bank = el("div", "sp2-bank");
            const bankButtons = {};
            words.forEach(function (w) {
                const item = btn("sp2-word", "");
                item.appendChild(el("span", "sp2-key", w.key));
                item.appendChild(el("span", "sp2-text", w.text));
                /* الكلمة اللي تبدلات فهاد النسخة */
                if ((variant.changedWords || []).indexOf(w.key) !== -1) {
                    item.appendChild(el("span", "t2-q-changed sp2-changed", "معدل"));
                }
                const used = el("span", "sp2-used");
                item.appendChild(used);
                item.addEventListener("click", function () {
                    if (active) choose(active, w.key);
                });
                bankButtons[w.key] = { node: item, used: used };
                bank.appendChild(item);
            });
            panel.appendChild(bank);

            const rows = (variant.questions || []).map(function (question) {
                const num = String(question.num);
                const box = el("div", "t2-q sp-q sp2-row");
                const top = el("div", "t2-q-top");
                top.appendChild(el("span", "t3-sit-num", num));
                const value = btn("sp2-row-value", "—");
                value.addEventListener("click", function () {
                    toggle(num);
                    const first = (gaps[num] || [])[0];
                    if (first) first.node.scrollIntoView({ behavior: "smooth", block: "center" });
                });
                top.appendChild(value);
                if (question.changed) top.appendChild(el("span", "t2-q-changed", "معدل"));
                box.appendChild(top);

                const row = { num: num, box: box, question: question, value: value };
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
            sync();

            /* ---- اللائحة الصغيرة تحت الفراغ ---- */
            function toggle(num) {
                if (done) return;
                if (active === num) { close(); return; }
                active = num;
                const first = (gaps[num] || [])[0];
                pop.textContent = "";
                pop.appendChild(el("div", "sp2-pop-title", "Lücke " + num));
                const list = el("div", "sp2-pop-list");
                words.forEach(function (w) {
                    const owner = ownerOf(w.key);
                    const item = btn("sp2-word" + (owner && owner !== num ? " is-used" : "")
                                     + (picked[num] === w.key ? " is-picked" : ""), "");
                    item.appendChild(el("span", "sp2-key", w.key));
                    item.appendChild(el("span", "sp2-text", w.text));
                    if (owner && owner !== num) item.appendChild(el("span", "sp2-used", owner));
                    item.addEventListener("click", function () { choose(num, w.key); });
                    list.appendChild(item);
                });
                pop.appendChild(list);
                if (picked[num]) {
                    const clearBtn = btn("sp2-clear", "مسح الجواب");
                    clearBtn.addEventListener("click", function () { choose(num, null); });
                    pop.appendChild(clearBtn);
                }
                if (first) first.line.after(pop);
                pop.hidden = false;
                sync();
            }

            function close() {
                active = null;
                pop.hidden = true;
                sync();
            }

            function ownerOf(key) {
                return Object.keys(picked).find(function (n) { return picked[n] === key; }) || null;
            }

            function choose(num, key) {
                if (done) return;
                /* كل كلمة غير مرة وحدة: إلا كانت ف فراغ آخر كنحيدوها منو */
                if (key) {
                    const owner = ownerOf(key);
                    if (owner && owner !== num) delete picked[owner];
                    picked[num] = key;
                } else {
                    delete picked[num];
                }
                close();
            }

            function sync() {
                Object.keys(gaps).forEach(function (num) {
                    const key = picked[num];
                    gaps[num].forEach(function (g) {
                        g.word.textContent = key ? byKey[key].text : "…";
                        g.node.classList.toggle("is-filled", !!key);
                        g.node.classList.toggle("is-active", active === num);
                    });
                });
                words.forEach(function (w) {
                    const owner = ownerOf(w.key);
                    bankButtons[w.key].node.classList.toggle("is-used", !!owner);
                    bankButtons[w.key].used.textContent = owner || "";
                });
                rows.forEach(function (row) {
                    const key = picked[row.num];
                    row.value.textContent = key ? key + " · " + byKey[key].text : "—";
                    row.value.classList.toggle("is-filled", !!key);
                    row.box.classList.toggle("is-active", active === row.num);
                });
                hint.classList.toggle("is-on", !!active);
                progress.textContent = Object.keys(picked).length + "/" + rows.length;
            }

            function grade(reveal) {
                close();
                done = true;
                let right = 0;
                rows.forEach(function (row) {
                    const expected = String(row.question.answer).toUpperCase();
                    const got = picked[row.num];
                    const ok = got === expected;
                    if (ok) right++;
                    if (reveal) picked[row.num] = expected;
                    row.box.classList.remove("correct", "wrong");
                    row.box.classList.add("is-done", ok ? "correct" : "wrong");
                    (gaps[row.num] || []).forEach(function (g) {
                        g.node.classList.remove("is-right", "is-wrong");
                        g.node.classList.add(ok ? "is-right" : "is-wrong");
                    });
                    const oldMark = row.box.querySelector(".lesen-mark");
                    if (oldMark) oldMark.remove();
                    const solution = expected + " · " + (byKey[expected] ? byKey[expected].text : "");
                    row.box.appendChild(el("div", "lesen-mark " + (ok ? "ok" : "no"),
                        ok ? "✓ Richtig"
                           : (reveal ? "Lösung: " + solution
                                     : (got ? "✗ Falsch" : "Noch nicht beantwortet"))));
                    if (row.why && (ok || reveal)) row.why.hidden = false;
                });
                sync();
                window.__lesenScore(score, "sprach2", right, rows.length, reveal,
                    rows.length - Object.keys(picked).length);
            }

            function reset() {
                done = false;
                Object.keys(picked).forEach(function (n) { delete picked[n]; });
                rows.forEach(function (row) {
                    row.box.classList.remove("is-done", "correct", "wrong");
                    const mark = row.box.querySelector(".lesen-mark");
                    if (mark) mark.remove();
                    if (row.why) { row.why.hidden = true; row.why.open = false; }
                });
                Object.keys(gaps).forEach(function (num) {
                    gaps[num].forEach(function (g) { g.node.classList.remove("is-right", "is-wrong"); });
                });
                score.hidden = true;
                close();
                wrap.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    window.__lesenSprach2Render = render;
})();
