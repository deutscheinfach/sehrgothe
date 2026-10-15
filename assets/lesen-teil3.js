/* ===== Lesen Teil 3 — Anzeigen zuordnen =====

   شكل الصفحة:
     - تبويبات ديال النسخ (الأساسي / المعدل …)
     - على اليسار: الإعلانات A–L، كل واحد فيه العنوان، النص،
       وملخص بالدارجة (مطوي)
     - على اليمين: الوضعيات 11–20. تبرك على إعلان كيتحط
       فالوضعية الخدامة. "X" = ماكاين حتى إعلان مناسب.

   شكل البيانات:
   {
     title: "Aflam",
     kind: "ads",
     ads: [ { key: "A", head: "23.15 3SAT …", body: "…", ar: "…" }, … ],
     variants: [
       {
         label: "الأساسي",
         intro: "…",                                   // اختياري
         note: "…",                                    // اختياري: ملاحظة
         situations: [ { no: 11, de: "…", ar: "…" }, … ],   // changed: true = معدلة
         answers: [ "L", "I", "B", … ]                  // ولا situations[].answer
       }, …
     ]
   }

   الإعلانات والوضعيات كيتكتبو مرة وحدة فوق، وكل نسخة كتعطي
   غير الحلول ديالها — بحال Teil 1.
*/

(function () {
    "use strict";

    const NONE = "X";

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

    /* كل نسخة كتاخد الإعلانات والوضعيات ديال الموضوع إلا ماعندهاش ديالها */
    function toVariants(task) {
        const ads = Array.isArray(task.ads) ? task.ads : [];
        const sits = Array.isArray(task.situations) ? task.situations : [];

        const list = (Array.isArray(task.variants) && task.variants.length)
            ? task.variants
            : [{ label: "الأساسي", intro: task.intro, answers: task.answers }];

        return list.map(function (variant) {
            const own = Array.isArray(variant.situations) ? variant.situations : sits;
            const keys = variant.answers || [];

            return Object.assign({}, variant, {
                ads: Array.isArray(variant.ads) ? variant.ads : ads,
                situations: own.map(function (sit, i) {
                    return Object.assign({}, sit, {
                        answer: sit.answer !== undefined ? sit.answer : keys[i]
                    });
                })
            });
        });
    }

    function render(into, task, meta) {
        const variants = toVariants(task);
        let index = 0;

        const wrap = el("div", "t3-wrap");

        /* ---- تبويبات النسخ ---- */
        if (variants.length > 1) {
            const bar = el("nav", "t1-variants");
            bar.setAttribute("aria-label", "نسخ التمرين");

            variants.forEach(function (variant, i) {
                const tab = btn("t1-variant" + (i === 0 ? " active" : ""),
                                variant.label || ("نسخة " + (i + 1)));
                tab.addEventListener("click", function () {
                    if (i === index) return;
                    const forward = i > index;
                    index = i;
                    Array.from(bar.children).forEach(function (other, oi) {
                        other.classList.toggle("active", oi === index);
                    });
                    swap(forward);
                });
                bar.appendChild(tab);
            });
            wrap.appendChild(bar);
        }

        const head = el("div", "t1-head");
        head.appendChild(el("h2", "t1-title", task.title || "Leseverstehen"));
        head.appendChild(el("div", "t1-kicker", "LESEVERSTEHEN TEIL 3"));
        if (window.__lesenArToggle) window.__lesenArToggle(head, wrap, task);
        wrap.appendChild(head);

        const board = el("div", "t1-board");
        wrap.appendChild(board);

        into.appendChild(wrap);
        paint();

        /* تبديل النسخة بانتقال — transitionend كيطلع من الوليدات،
           إذن كنقبلو غير اللي جا من board نفسو. */
        function swap(forward) {
            const still = window.matchMedia
                && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (still) { paint(); return; }
            if (board.dataset.busy === "1") return;
            board.dataset.busy = "1";

            board.classList.remove("t1-in-right", "t1-in-left", "t1-stagger");
            board.classList.add(forward ? "t1-out-left" : "t1-out-right");

            let finished = false;

            const done = function (event) {
                if (event && event.target !== board) return;
                if (finished) return;
                finished = true;

                board.removeEventListener("transitionend", done);
                clearTimeout(guard);

                board.classList.remove("t1-out-left", "t1-out-right");
                board.classList.add(forward ? "t1-in-right" : "t1-in-left");
                paint();

                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        board.classList.remove("t1-in-right", "t1-in-left");
                        board.classList.add("t1-stagger");
                        board.dataset.busy = "";
                    });
                });
            };

            const guard = setTimeout(done, 420);
            board.addEventListener("transitionend", done);
        }

        /* ================= رسم نسخة وحدة ================= */

        function paint() {
            const variant = variants[index];
            const ads = variant.ads || [];
            const sits = variant.situations || [];
            board.textContent = "";

            const rows = [];            /* { select, box, sit } */
            const sitRows = [];         /* { node, no, sit }    */
            let activeRow = null;

            /* ---- العمود: الإعلانات، كل واحد بـselect فوقو ----
               نفس Teil 1 بالضبط: الفقرة الطويلة ف العمود العريض
               والـselect فوقها، والاختيارات ف اللوحة على اليمين
               نقيين — بلا والو جواهم. */
            const column = el("div", "t1-texts");
            if (variant.intro) column.appendChild(el("p", "t1-intro", variant.intro));
            if (variant.note) column.appendChild(el("p", "t1-note", variant.note));

            /* شمن وضعية خاصها تمشي لكل إعلان. الإعلان اللي
               ماكاين حتى وضعية ديالو جوابو NONE. */
            const wantFor = {};
            sits.forEach(function (sit) {
                if (sit.answer) wantFor[String(sit.answer)] = String(sit.no);
            });

            ads.forEach(function (ad) {
                const box = el("article", "t1-text t3-ad");

                const top = el("div", "t1-text-top");
                top.appendChild(el("span", "t1-text-num t3-ad-key", ad.key));

                const select = document.createElement("select");
                select.className = "t1-select t3-select";
                select.setAttribute("aria-label", "Situation für Anzeige " + ad.key);
                select.appendChild(new Option("— Situation wählen —", ""));
                sits.forEach(function (sit, i) {
                    const no = sit.no || (i + 11);
                    select.appendChild(new Option(no + " — " + (sit.de || ""), String(no)));
                });
                select.appendChild(new Option(NONE + " — keine Situation", NONE));
                top.appendChild(select);
                box.appendChild(top);

                box.appendChild(el("span", "t3-ad-head", ad.head || ""));
                box.appendChild(el("p", "t1-body", ad.body || ""));
                if (ad.ar) box.appendChild(window.__lesenArBlock(ad.ar, "ملخص الإعلان"));

                const row = { select: select, box: box, ad: ad, want: wantFor[ad.key] || NONE };
                rows.push(row);

                function focusRow() {
                    activeRow = row;
                    rows.forEach(function (other) {
                        other.box.classList.toggle("is-active", other === row);
                    });
                }

                box.addEventListener("click", function (event) {
                    if (event.target.closest(".ar-block")) return;   /* قراية الملخص */
                    focusRow();
                });
                select.addEventListener("focus", focusRow);
                select.addEventListener("change", function () {
                    focusRow();
                    /* نفس الوضعية ماشي ف جوج إعلانات — غير X كيتعاود */
                    if (select.value && select.value !== NONE) {
                        rows.forEach(function (other) {
                            if (other !== row && other.select.value === select.value) {
                                other.select.value = "";
                            }
                        });
                    }
                    paintUsed();
                });

                column.appendChild(box);
            });

            if (rows.length) {
                activeRow = rows[0];
                rows[0].box.classList.add("is-active");
            }

            /* ---- لوحة الوضعيات: نقيين، بلا select جواهم ---- */
            const side = el("aside", "t1-side");
            const panel = el("div", "t1-panel t3-panel");

            const panelHead = el("div", "t1-panel-head");
            panelHead.appendChild(el("span", "t1-panel-title", "SITUATIONEN"));
            const progress = el("span", "t1-progress", "0/" + sits.length);
            panelHead.appendChild(progress);
            panel.appendChild(panelHead);

            sits.forEach(function (sit, i) {
                const no = String(sit.no || (i + 11));
                const item = document.createElement("button");
                item.type = "button";
                item.className = "t1-option t3-sit-opt";

                item.appendChild(el("span", "t1-option-key", no));

                const textWrap = el("span", "t1-option-text");
                textWrap.appendChild(el("span", "t1-option-de t3-sit-de", sit.de || ""));
                if (sit.changed) textWrap.appendChild(el("span", "t1-option-changed", "معدل"));
                if (sit.ar) textWrap.appendChild(el("span", "t1-option-ar t3-sit-ar", sit.ar));
                item.appendChild(textWrap);

                /* تبرك على الوضعية = كتمشي للإعلان الخدام */
                item.addEventListener("click", function () { assign(no); });

                /* بلاصة الأدمين (كلمات مفتاحية) تحت الوضعية — برا الزر،
                   حيت البركة على الزر كتمشي للإعلان */
                const kwBox = el("div", "t3-sit-kw");
                kwBox.setAttribute("data-kw-box", "");

                sitRows.push({ node: item, no: no, sit: sit, kwBox: kwBox });
                panel.appendChild(item);
                panel.appendChild(kwBox);
            });

            side.appendChild(panel);

            board.append(column, side);

            /* ---- الأزرار ---- */
            const actions = el("div", "lesen-actions");
            const checkBtn = btn("lesen-btn lesen-btn-check", "تحقق من الإجابات");
            const showBtn = btn("lesen-btn lesen-btn-show", "شوف الحل");
            const retryBtn = btn("lesen-btn lesen-btn-retry", "عاود من جديد");
            actions.append(checkBtn, showBtn, retryBtn);
            column.appendChild(actions);

            const score = el("div", "lesen-score");
            score.hidden = true;
            column.appendChild(score);

            checkBtn.addEventListener("click", function () { grade(false); });
            showBtn.addEventListener("click", function () { grade(true); });
            retryBtn.addEventListener("click", reset);

            paintUsed();

            /* ---- تبرك على وضعية ف اللوحة ---- */
            function assign(no) {
                const target = activeRow || rows[0];
                if (!target) return;

                /* نفس الوضعية ماشي ف جوج إعلانات */
                rows.forEach(function (other) {
                    if (other !== target && other.select.value === no) {
                        other.select.value = "";
                    }
                });
                target.select.value = no;
                paintUsed();

                /* نمشيو للإعلان اللي من بعد باش ما يبقاش يتبرك بزاف */
                const at = rows.indexOf(target);
                const next = rows[at + 1];
                if (next) {
                    activeRow = next;
                    rows.forEach(function (other) {
                        other.box.classList.toggle("is-active", other === next);
                    });
                }
            }

            /* ---- الوضعيات المستعملة + العداد ---- */
            function paintUsed() {
                const used = {};
                rows.forEach(function (row) {
                    if (row.select.value && row.select.value !== NONE) {
                        used[row.select.value] = true;
                    }
                });

                sitRows.forEach(function (item) {
                    item.node.classList.toggle("is-used", !!used[item.no]);
                });

                progress.textContent = Object.keys(used).length + "/" + sits.length;
            }

            /* ---- التصحيح ----
               النقطة على الوضعيات (10)، ماشي على الإعلانات (12).

               مهم: شي وضعيات جوابها X — ما كاين حتى إعلان مناسب
               (14% ف المواضيع ديالنا). دابا الـselect فوق الإعلان،
               إذن ماكاينش فين تختار X للوضعية. الحل: الوضعية اللي
               ما عطيتي ليها حتى إعلان = جوابك هو X. وهادشي طبيعي:
               ملي ماكاين حتى إعلان كيمشي معاها، كتخليها خاوية. */
            function grade(reveal) {
                clearSits();
                rows.forEach(clear);

                if (reveal) {
                    rows.forEach(function (row) { row.select.value = row.want; });
                }

                /* شمن إعلان خدا كل وضعية */
                const takenBy = {};
                rows.forEach(function (row) {
                    if (row.select.value && row.select.value !== NONE) {
                        takenBy[row.select.value] = row;
                    }
                });

                let right = 0;
                sits.forEach(function (sit, i) {
                    const no = String(sit.no || (i + 11));
                    const expected = String(sit.answer === undefined ? NONE : sit.answer).toUpperCase();
                    const picked = takenBy[no];
                    const given = picked ? String(picked.ad.key) : NONE;
                    if (given === expected) right++;
                });

                /* علامة على كل إعلان */
                rows.forEach(function (row) {
                    const want = row.want;
                    const given = row.select.value;
                    const real = want !== NONE;
                    const ok = given === want;

                    if (given !== "") row.box.classList.add(ok ? "correct" : "wrong");

                    if (given !== "" || reveal) {
                        row.box.appendChild(el("div", "lesen-mark " + (ok ? "ok" : "no"),
                            ok ? (real ? "✓ Richtig" : "✓ Richtig — keine Situation")
                               : (reveal
                                    ? (real ? "Lösung: Situation " + want : "Lösung: keine Situation")
                                    : "✗ Falsch")));
                    }

                    /* فوق نص الإعلان: رقم الوضعية الصحيحة ونصها */
                    const sitRow = sitRows.find(function (x) { return x.no === want; });
                    const adBody = row.box.querySelector(".t1-body");
                    let words = null;
                    if (adBody && real && sitRow) {
                        const title = el("div", "kw-title");
                        title.appendChild(el("span", "kw-key", want));
                        words = el("span", "kw-words", sitRow.sit.de || "");
                        title.appendChild(words);
                        adBody.parentNode.insertBefore(title, adBody);
                    }

                    /* الكلمات المشتركين بين الإعلان والوضعية الصحيحة —
                       ف اللائحة وحتى ف الوضعية اللي فوق نص الإعلان */
                    if (sitRow && adBody && window.__lesenKeys) {
                        const sitText = sitRow.node.querySelector(".t3-sit-de");
                        const adHead = row.box.querySelector(".t3-ad-head");
                        if (sitText) {
                            const ad = [adHead, adBody].filter(Boolean);
                            /* الكلمات ديال الأدمين: مربوطين بالوضعية (مرادفات Pkw ↔ Auto) */
                            const ctx = window.__kwCustom && meta && meta.id ? {
                                doc: "lesen-" + String(meta.level || "b2").toLowerCase() + "-" + meta.id,
                                items: [{
                                    key: window.__kwCustom.key(sitRow.sit.de || ""),
                                    box: row.box,
                                    title: "كلمات مفتاحية — Situation " + want
                                }, {
                                    /* نفس الكلمات، حتى تحت الوضعية ف اللائحة */
                                    key: window.__kwCustom.key(sitRow.sit.de || ""),
                                    box: sitRow.kwBox,
                                    title: "كلمات مفتاحية — Situation " + want
                                }]
                            } : null;
                            window.__lesenKeys.link([sitText], ad, null, ctx);
                            /* نفس النص → نفس الكلمات الصفر بحال اللي ف اللائحة */
                            if (words) window.__lesenKeys.link([words], ad, null, ctx);
                        }
                    }
                });

                paintUsed();

                /* "بلا جواب" = إعلان ما خترتي ليه والو — ماشي وضعية
                   خاوية، حيت الخاوية ممكن تكون هي الجواب الصحيح (X). */
                const blank = rows.filter(function (row) { return row.select.value === ""; }).length;
                window.__lesenScore(score, "teil3", right, sits.length, reveal, blank);
            }

            function clear(row) {
                row.box.classList.remove("correct", "wrong");
                const mark = row.box.querySelector(".lesen-mark");
                if (mark) mark.remove();
                if (window.__lesenKeys) {
                    window.__lesenKeys.clear([
                        row.box.querySelector(".t1-body"),
                        row.box.querySelector(".t3-ad-head")
                    ]);
                }
                const title = row.box.querySelector(".kw-title");
                if (title) title.remove();
            }

            /* الوضعيات كيتمسحو مرة وحدة قبل التصحيح — ماشي ف clear(row)،
               وإلا كل إعلان كيمسح الألوان ديال اللي قبلو. */
            function clearSits() {
                if (!window.__lesenKeys) return;
                sitRows.forEach(function (x) {
                    window.__lesenKeys.clear([x.node.querySelector(".t3-sit-de")]);
                    if (x.kwBox) x.kwBox.textContent = "";
                });
            }

            function reset() {
                clearSits();
                rows.forEach(function (row) {
                    clear(row);
                    row.select.value = "";
                });
                /* نرجعو للوضعية الأولى، ماشي نبقاو واقفين فين كنا */
                activeRow = rows[0] || null;
                rows.forEach(function (other) {
                    other.box.classList.toggle("is-active", other === activeRow);
                });
                paintUsed();
                score.hidden = true;
                wrap.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    window.__lesenTeil3Render = render;
})();
