/* ===== محرك Lesen B2 =====

   كيبني التمرين من البيانات، إذن زيادة موضوع جديد = زيادة
   كائن فالملف ديال البيانات، بلا ما تكتب HTML.

   تلاتة ديال الأنواع، هوما اللي كيجيو ف telc B2:

   1) "matching"  — نصوص قصار + لائحة ديال الترويسات.
                    كل نص كيختار واحدة من select.
   2) "choice"    — نص طويل + أسئلة a/b/c.
   3) "anzeigen"  — مواقف + إعلانات. كل موقف كيختار إعلان،
                    ولا "x" إلا ماكاين حتى واحد مناسب.

   شكل البيانات:
   {
     id: "01",
     title: "…",
     kind: "matching" | "choice" | "anzeigen",
     intro: "…",                     // اختياري
     texts:   [{ label:"a", title:"…", body:"…" }],
     options: [{ value:"1", text:"…" }],   // للـ matching و anzeigen
     questions: [
       { text:"…", answer:"3" }                       // matching / anzeigen
       { text:"…", options:["…","…","…"], answer:1 }  // choice (فهرس)
     ]
   }
*/

(function () {
    "use strict";

    /* الصفحة كتبدل التمرين ملي تبرك على تبويب، وكتبني
       الحاوية ديالو من جديد — إذن ماقدرناش نمسكو عنصر
       واحد ثابت. كنقبلو الحاوية كوسيطة. */
    function render(into) {
        const root = into
            || document.getElementById("lesen-stack");

        if (!root) return;

        const topics = window.LESEN_TOPICS;

        root.textContent = "";

        if (!Array.isArray(topics) || !topics.length) {
            const empty = document.createElement("div");
            empty.className = "lesen-empty";
            empty.textContent = "ما زال ماكاينش تمارين ف هاد الجزء.";
            root.appendChild(empty);
            return;
        }

        topics.forEach(function (topic, index) {
            root.appendChild(buildTask(topic, index));
        });
    }

    window.__lesenRender = render;
    window.__lesenRenderInto = render;

    /* ---- النقط ديال كل جزء (بحال telc) ----
       Teil 1، 2، 3 = 25 نقطة · Sprachbausteine 1 و 2 = 15 نقطة.
       كنرسمو النتيجة فالـscore، وكنصيفطو حدث "lesen-points"
       باش الـPrüfung الكاملة تجمع المجموع. */
    const MAX_POINTS = { teil1: 25, teil2: 25, teil3: 25, sprach1: 15, sprach2: 15 };

    function fmt(n) {
        return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
    }

    /* ---- مكان الأزرار ديال Teil 2 / Sprach 1 / Sprach 2 ----
       فالـPC: تحت النصوص (بحال Teil 1)، ماشي مدفونين لتحت فاللوحة اللي كتسكرولي.
       فالتيليفون: من بعد الأسئلة، حيت الأسئلة كتجي تحت النصوص. */
    const WIDE = window.matchMedia("(min-width: 1001px)");
    function placeFoot(foot) {
        if (WIDE.matches) foot.__column.appendChild(foot);
        else foot.__side.after(foot);
    }
    window.__lesenFoot = function (column, side, nodes) {
        const foot = document.createElement("div");
        foot.className = "t1-foot";
        nodes.forEach(function (n) { foot.appendChild(n); });
        foot.__column = column;
        foot.__side = side;
        placeFoot(foot);
        return foot;
    };
    WIDE.addEventListener("change", function () {
        document.querySelectorAll(".t1-foot").forEach(function (foot) {
            if (foot.__column) placeFoot(foot);
        });
    });

    /* ---- شريط الأزرار الثابت تحت (بحال التطبيقات) ----
       كل جزء كيبني الأزرار ديالو فبلاصتهم. هنا كنبدلوهم بعلامة خاوية
       وكنديوهم لشريط واحد فالـbody: الـboard فيه transform (الانتقال بين
       النسخ)، وأي position: fixed داخلو كيتبع ليه ماشي للشاشة.
       الشريط كيبين الأزرار ديال الجزء اللي باين دابا، وكيتخبى فاللائحة. */
    const bar = document.createElement("div");
    bar.className = "lesen-bar";
    bar.hidden = true;
    const slot = document.createElement("div");
    slot.className = "lesen-bar-slot";
    const extraBox = document.createElement("div");
    extraBox.className = "lesen-bar-extra";
    bar.append(slot, extraBox);
    let adopted = [];
    let queued = false;
    /* زيادة فالشريط (أزرار الامتحان الكامل). كتبان غير ملي owner باين. */
    /* mode: "live" = غير «تحقق» ديال الجزء · "done" = غير «شوف الحل» */
    let extra = null, extraOwner = null, examMode = "";
    window.__lesenBarExtra = function (node, owner, options) {
        extra = node || null;
        extraOwner = owner || null;
        examMode = (options && options.mode) || "";
        queueBar();
    };

    function syncBar() {
        queued = false;
        document.querySelectorAll(".lesen-actions").forEach(function (actions) {
            if (actions.__anchor || bar.contains(actions)) return;
            const anchor = document.createElement("span");
            anchor.className = "lesen-actions-anchor";
            actions.replaceWith(anchor);
            actions.__anchor = anchor;
            anchor.__actions = actions;
            adopted.push(actions);
        });
        adopted = adopted.filter(function (a) { return a.__anchor.isConnected; });
        let current = null;
        adopted.forEach(function (a) { if (a.__anchor.getClientRects().length) current = a; });

        const showExtra = !!(extra && extraOwner && extraOwner.isConnected
                             && extraOwner.getClientRects().length);
        const shown = !!current || showExtra;

        if (!bar.isConnected) document.body.appendChild(bar);
        if (current && current.parentNode !== slot) slot.replaceChildren(current);
        if (!current && slot.firstChild) slot.replaceChildren();
        if (showExtra && extra.parentNode !== extraBox) extraBox.replaceChildren(extra);
        if (!showExtra && extraBox.firstChild) extraBox.replaceChildren();
        if (bar.classList.contains("has-extra") !== showExtra) bar.classList.toggle("has-extra", showExtra);
        const mode = showExtra ? examMode : "";
        if ((bar.dataset.exam || "") !== mode) {
            if (mode) bar.dataset.exam = mode; else delete bar.dataset.exam;
        }
        if (bar.hidden !== !shown) bar.hidden = !shown;
        if (document.body.classList.contains("has-lesen-bar") !== shown) {
            document.body.classList.toggle("has-lesen-bar", shown);
        }
    }
    function queueBar() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(syncBar);
    }
    new MutationObserver(queueBar).observe(document.body, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ["hidden", "class", "style"],
    });
    queueBar();

    /* اللوحة اللاصقة (Überschriften…) ف PC: الطول ديالها = البلاصة الخاوية
       بين الراس ديالها والشريط ديال الأزرار. ف الفوق ديال الصفحة (قبل ما
       تلصق) كتكون قصيرة، وكتطول ملي تنزل — هكا آخر عنوان (J) ديما باين
       فوق الشريط وماكيتخباش تحتو. */
    let fitQueued = false;
    function fitPanels() {
        fitQueued = false;
        const panels = document.querySelectorAll(".t1-panel");
        if (!panels.length) return;
        const on = WIDE.matches && document.body.classList.contains("has-lesen-bar") && !bar.hidden;
        /* ?nav=0 (اختبر نفسك): الشريط مخبي بـ display:none والأزرار عند
           الصفحة الأم — اللوحة كتاخد الطول ديال الـiframe كامل. */
        const barShown = on && bar.getClientRects().length > 0;
        const limit = on ? (barShown ? bar.getBoundingClientRect().top - 14 : window.innerHeight - 12) : 0;
        panels.forEach(function (panel) {
            if (!on || !panel.getClientRects().length) {
                if (panel.style.maxHeight) panel.style.maxHeight = "";
                return;
            }
            /* الطول = من الخط اللاصق (top ديال CSS) حتى للشريط ديال تحت.
               ماكيتعلقش بالسكرول نهائياً → العناوين ماكيتحركوش ولا كيترعشو.
               (قبل كان كيتحسب من البلاصة ديال اللوحة ولا من آخر نص، وف آخر
               الصفحة كانت كتطوال وتقصر بلا حبس.) */
            const stick = parseFloat(getComputedStyle(panel).top) || 0;
            const room = Math.max(220, Math.round(limit - stick));
            /* فرق صغير (pixels مكسورين ف شاشات 125%) ما كنبدلوش — وإلا
               كيتبدل الطول بلا حبس واللوحة كترعش */
            const now = parseFloat(panel.style.maxHeight) || 0;
            if (Math.abs(now - room) >= 2) panel.style.maxHeight = room + "px";
        });
    }
    function queueFit() {
        if (fitQueued) return;
        fitQueued = true;
        requestAnimationFrame(fitPanels);
    }
    window.addEventListener("scroll", queueFit, { passive: true });
    window.addEventListener("resize", queueFit);
    new MutationObserver(queueFit).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setInterval(queueFit, 1500);   /* لوحة جديدة (تبديل النسخة / التمرين) */
    queueFit();

    /* من بعد ما يختار جواب: فالـPC اللوحة كتسكرولي بوحدها للسؤال الجاي
       اللي مازال ماتجاوبش — ماكيحتاجش يقلب عليه. الصفحة ماكتتحركش. */
    window.__lesenNext = function (panel, rows, row) {
        if (!WIDE.matches || panel.scrollHeight <= panel.clientHeight + 4) return;
        const at = rows.indexOf(row);
        const next = rows.slice(at + 1).concat(rows.slice(0, at))
            .find(function (r) { return r.picked === -1; });
        if (!next) return;
        panel.scrollTo({ top: Math.max(0, next.box.offsetTop - 70), behavior: "smooth" });
    };

    window.__lesenScore = function (box, part, right, total, reveal, missing) {
        const max = MAX_POINTS[part] || 25;
        const points = total ? Math.round(right / total * max * 2) / 2 : 0;
        box.hidden = false;
        box.textContent = "";
        box.classList.add("lesen-score-points");
        const pct = max ? points / max : 0;
        box.dataset.tone = pct >= 0.8 ? "good" : pct >= 0.6 ? "mid" : "bad";

        const big = document.createElement("b");
        big.className = "lesen-points";
        big.textContent = fmt(points) + " / " + max;
        const unit = document.createElement("span");
        unit.className = "lesen-points-unit";
        unit.textContent = "Punkte";
        const detail = document.createElement("span");
        detail.className = "lesen-points-detail";
        detail.textContent = reveal
            ? "الحلول كاينة فوق · " + right + " من " + total + " كانو صحاح"
            : right + " / " + total + " صحيحة" + (missing ? " · باقي " + missing + " بلا جواب" : "");
        box.append(big, unit, detail);
        /* الأزرار ولاو تحت فالشريط الثابت: كنوريو النتيجة باش ماتبقاش مخبية */
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });

        try {
            window.dispatchEvent(new CustomEvent("lesen-points",
                { detail: { part: part, points: points, max: max, right: right, total: total, reveal: !!reveal } }));
        } catch (e) { /* متصفح قديم */ }
        return points;
    };

    /* ---- زر الترجمة العربية ----
       الترجمة مخبية فالبداية. كل تمرين فيه ترجمة كياخد زر
       فالعنوان ديالو، والضغطة كتزيد "show-ar" للحاوية كاملة
       (كتبقى حتى ملي كيتبدل التبويب ديال النسخة). */
    function hasArabic(task) {
        try { return /"ar":"[^"]/.test(JSON.stringify(task)); }
        catch (e) { return false; }
    }

    window.__lesenArToggle = function (head, wrap, task) {
        if (task && !hasArabic(task)) return null;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ar-toggle";
        button.setAttribute("aria-pressed", "false");
        const icon = document.createElement("span");
        icon.className = "ar-toggle-icon";
        icon.textContent = "ع";
        icon.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        button.append(icon, label);

        function paint(on) {
            wrap.classList.toggle("show-ar", on);
            button.classList.toggle("is-on", on);
            button.setAttribute("aria-pressed", on ? "true" : "false");
            label.textContent = on ? "خبي الترجمة" : "بين الترجمة العربية";
        }
        paint(false);
        button.addEventListener("click", function () {
            paint(!wrap.classList.contains("show-ar"));
        });
        head.appendChild(button);
        return button;
    };

    /* بلوك ديال الترجمة تحت النص (كيبان غير مع show-ar) */
    window.__lesenArBlock = function (text, label) {
        const box = document.createElement("div");
        box.className = "ar-block";
        box.dir = "rtl";
        box.lang = "ar";
        const tag = document.createElement("span");
        tag.className = "ar-block-label";
        tag.textContent = label || "الترجمة العربية";
        const p = document.createElement("p");
        p.textContent = text;
        box.append(tag, p);
        return box;
    };

    /* ===== الكلمات المفتاحية (بحال Zertify) =====
       ملي كيتصحح Teil 1 ولا Teil 3، كنلونو الكلمات اللي مشتركين بين
       النص والترويسة (ولا الوضعية والإعلان) — باش يبان علاش هادا
       هو الجواب. بلا داتا زايدة: كنقارنو الجذور ديال الكلمات
       (Alter ↔ Lebensalter، Sport ↔ Leistungssport). */
    const KW_STOP = new Set(("damals gestern haben hatte hatten heute morgen waren worden wurden andere anderen bekannte bekannten bekannter besonders einige einigen einiger interessieren interessiert manche mochte mochten mogen sucht suchen aber alle allem allen aller alles also auch auf aus bei beim bis bitte dabei damit dann darf das dass dem den denn der des dessen die dies diese diesem diesen dieser dieses doch dort durch eine einem einen einer eines etwas euch fur gibt ganz gegen geht hier hinter ihnen ihre ihrem ihren ihrer immer jede jedem jeden jeder jedes jetzt kann kein keine keinen konnen machen macht mehr mein meine muss mussen nach neue neuen nicht noch nur oder ohne schon sehr sein seine seit sich sind soll sollen sowie uber unter unsere viel viele vielen vom von vor wann warum weil wenig wenn werden wieder will wird wollen wurde zum zur zwei zwischen").split(" "));
    function kwFold(w) {
        return w.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    }
    function kwStem(w) {
        const f = kwFold(w);
        const ends = ["ern", "en", "er", "es", "em", "e", "n", "s"];
        for (let i = 0; i < ends.length; i++) {
            if (f.length - ends[i].length >= 4 && f.endsWith(ends[i])) return f.slice(0, -ends[i].length);
        }
        return f;
    }
    const KW_WORD = /[A-Za-zÄÖÜäöüß]+/g;
    function kwStems(text) {
        const out = new Set();
        (String(text || "").match(KW_WORD) || []).forEach(function (w) {
            if (w.length < 4 || KW_STOP.has(kwFold(w))) return;
            const st = kwStem(w);
            if (st.length >= 4) out.add(st);
        });
        return Array.from(out);
    }
    /* ===== احتياط: الكلمات المركبة =====

       المقارنة فوق بالجذر كامل، إذن Kontaktagenturen ↔ Vermittlungsagenturen
       ماكيتلاقاوش: المشترك جزء من الكلمة (agentur). ولا findet ↔ finden.
       إلا كانت الكلمات المفتاحية ف نص أقل من KW_MIN (3)، كنزيدو هاد
       المرحلة: الأفعال المصرّفة، ذيل الكلمة المركبة، وقطعة مشتركة من 6
       حروف. النصوص اللي فيها 3 ولا أكثر ما كتتبدلش. */
    const KW_GENERIC = ["schaft", "lichkeit", "keiten", "heiten", "ungen", "tionen", "ierung", "ischen", "lichen", "ungs"];
    /* أقل من هاد العدد (الخوارزمية + اللي بالإيد) = نجربو المرحلة الثانية */
    const KW_MIN = 3;
    function kwShares(a, b) {
        if (a.length < 7 || b.length < 7) return false;
        let best = 0, at = 0;
        let prev = new Array(b.length + 1).fill(0);
        for (let i = 1; i <= a.length; i++) {
            const row = new Array(b.length + 1).fill(0);
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    row[j] = prev[j - 1] + 1;
                    if (row[j] > best) { best = row[j]; at = i; }
                }
            }
            prev = row;
        }
        if (best < 6) return false;
        const piece = a.slice(at - best, at);
        /* نهاية عامة (-schaft، -keiten…) ماشي كلمة مشتركة */
        return !KW_GENERIC.some(function (g) { return g.indexOf(piece) !== -1; });
    }
    /* الفعل: findet ↔ finden. kwStem كيحيد غير نهايات الأسماء والصفات
       (-en، -er…)، ماشي نهايات الفعل (-t، -st، -te). */
    function kwVerb(stem) {
        const ends = ["tet", "ten", "est", "et", "st", "te", "t"];
        for (let i = 0; i < ends.length; i++) {
            if (stem.length - ends[i].length >= 4 && stem.endsWith(ends[i])) return stem.slice(0, -ends[i].length);
        }
        return stem;
    }
    function kwHit(word, stems, loose) {
        if (word.length < 4 || KW_STOP.has(kwFold(word))) return false;
        const s = kwStem(word);
        return stems.some(function (k) {
            if (s === k || (k.length >= 5 && s.indexOf(k) !== -1) || (s.length >= 5 && k.indexOf(s) !== -1)) return true;
            if (!loose) return false;
            return kwVerb(s) === kwVerb(k)
                /* ذيل الكلمة المركبة: Freizeit ← Zeit، Hausbesuch ← Besuch */
                || (s.length >= 7 && k.length >= 4 && s.endsWith(k))
                || (k.length >= 7 && s.length >= 4 && k.endsWith(s))
                || kwShares(s, k);
        });
    }
    /* ===== كلمات مفتاحية بالزز =====

       الخوارزمية كتلقى غير الكلمات المشتركين بين النص والترويسة. ماكتلقاش:
       جملة كاملة (seit den 80er Jahren)، رقم (1.000)، كلمة قصيرة، ولا
       مرادف. هاد المواقع كنزيدوهم من لائحة (assets/lesen-keys.js، ولا
       keys ف النص نفسو) وكنلونوهم مع الباقي، ف نفس الوقت.

       الكلمات كتتقارن بالجذر (Tauschrings ↔ Tauschring)، وغلطة وحدة ف
       كلمة طويلة كتتسمح (Abschlus ↔ Abschluss) — اللائحة كتكتب بالإيد. */
    const KW_TOKEN = /\d+(?:[.,]\d+)+|[A-Za-zÄÖÜäöüß0-9]+/g;
    function kwNorm(w) {
        return kwFold(w).replace(/[^a-z0-9.,]/g, "");
    }
    /* غلطة وحدة: حرف زايد، ناقص، ولا بدّلناه */
    function kwNear(a, b) {
        if (Math.abs(a.length - b.length) > 1) return false;
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
        const short = a.length < b.length ? a : b;
        const long = a.length < b.length ? b : a;
        return short.slice(i) === long.slice(i + 1);
    }
    /* تقريب: نفس الجذر (Tauschrings ↔ Tauschring) ولا غلطة وحدة ف كلمة طويلة */
    function kwClose(a, b) {
        if (a.length < 5 || b.length < 5) return false;
        if (kwStem(a) === kwStem(b)) return true;
        return a.length >= 7 && b.length >= 7 && kwNear(a, b);
    }
    function kwTokens(text) {
        const out = [];
        let m;
        KW_TOKEN.lastIndex = 0;
        while ((m = KW_TOKEN.exec(text))) {
            out.push({ s: m.index, e: m.index + m[0].length, n: kwNorm(m[0]) });
        }
        return out;
    }
    /* كل ظهور ديال كل جملة: [بداية، نهاية]. الجمل اللي ماتلقاتش ف missing.

       الأول بالكلمة بالضبط (الحروف الكبار والصغار ما كيهمّوش). إلا كاينة
       بهاد الشكل ف النص، كنلونو غير هي: Extremsport ماشي Extremsports.
       إلا ماكايناش، كنجربو التقريب — باش غلطة ف الكتابة ما تضيعش الكلمة. */
    function kwPhraseSpans(text, phrases) {
        const toks = kwTokens(text);
        const spans = [];
        const missing = [];

        function scan(want, same) {
            const hits = [];
            for (let i = 0; i + want.length <= toks.length; i++) {
                let ok = true;
                for (let k = 0; k < want.length && ok; k++) ok = same(toks[i + k].n, want[k]);
                if (!ok) continue;
                hits.push([toks[i].s, toks[i + want.length - 1].e]);
                i += want.length - 1;
            }
            return hits;
        }

        phrases.forEach(function (phrase) {
            const want = (String(phrase).match(KW_TOKEN) || []).map(kwNorm).filter(Boolean);
            if (!want.length) return;
            let hits = scan(want, function (a, b) { return a === b; });
            if (!hits.length) hits = scan(want, function (a, b) { return a === b || kwClose(a, b); });
            if (!hits.length) missing.push(phrase);
            hits.forEach(function (h) { spans.push(h); });
        });
        return { spans: spans, missing: missing };
    }
    function kwPaint(node, stems, extra, loose) {
        if (node.__kwText == null) node.__kwText = node.textContent;
        const text = node.__kwText;
        node.textContent = "";

        const spans = [];
        let m;
        KW_WORD.lastIndex = 0;
        while ((m = KW_WORD.exec(text))) {
            if (kwHit(m[0], stems, loose)) spans.push([m.index, m.index + m[0].length]);
        }

        if (extra && extra.phrases && extra.phrases.length) {
            const found = kwPhraseSpans(text, extra.phrases);
            found.spans.forEach(function (s) { spans.push(s); });
            /* اللائحة بالإيد: إلا كلمة ما تلقاتش، غالبا الكتابة مختلفة */
            if (found.missing.length && window.console) {
                console.warn("Lesen: كلمات مفتاحية ما لقيناهاش ف " + (extra.label || "النص") + ":", found.missing);
            }
        }
        /* اللي زادهم الأدمين من الموقع (kw-custom.js): كيتلونو فين ما كانو —
           ف النص ولا ف الجواب — وماشي غلطة إلا ما كانوش ف شي جهة */
        if (extra && extra.custom && extra.custom.length) {
            kwPhraseSpans(text, extra.custom).spans.forEach(function (s) { spans.push(s); });
        }

        /* الكلمات المتداخلة كتولي علامة وحدة */
        spans.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
        const merged = [];
        spans.forEach(function (s) {
            const top = merged[merged.length - 1];
            if (top && s[0] < top[1]) top[1] = Math.max(top[1], s[1]);
            else merged.push([s[0], s[1]]);
        });

        let last = 0;
        merged.forEach(function (s) {
            node.appendChild(document.createTextNode(text.slice(last, s[0])));
            const mark = document.createElement("mark");
            mark.className = "kw";
            mark.textContent = text.slice(s[0], s[1]);
            node.appendChild(mark);
            last = s[1];
        });
        node.appendChild(document.createTextNode(text.slice(last)));
        return merged.length;
    }
    window.__lesenKeys = {
        /* a و b: لائحتين ديال العناصر (نص عادي) — كنلونو ف a الكلمات
           اللي كاينين ف b، والعكس. */
        link: function (a, b, extra, ctx) {
            /* ctx = { doc, items: [{ key, box, title }] }: الكلمات اللي زادهم
               الأدمين (kw-custom.js) + الأزرار ديالو تحت كل box */
            const custom = kwCustomFor(ctx);
            if (custom.length) {
                extra = a.map(function (n, i) {
                    return Object.assign({}, extra && extra[i], { custom: custom });
                });
            }
            const sa = kwStems(a.map(function (n) { return n.__kwText != null ? n.__kwText : n.textContent; }).join(" "));
            const sb = kwStems(b.map(function (n) { return n.__kwText != null ? n.__kwText : n.textContent; }).join(" "));
            let hits = 0;
            /* كنحسبو غير اللي ف النص (a): الكلمة كتبان مرتين ف الترويسة،
               ولو حسبناهم، نص فيه كلمة وحدة كيبان فيه 3 وما كيتزادش. */
            let inText = 0;
            /* extra[i] = { phrases, label }: كلمات مفتاحية زايدين على النود i ديال a */
            a.forEach(function (n, i) { const h = kwPaint(n, sb, extra && extra[i]); hits += h; inText += h; });
            b.forEach(function (n) { hits += kwPaint(n, sa, custom.length ? { custom: custom } : null); });
            /* قليلين (أقل من KW_MIN)؟ نجربو الأفعال والكلمات المركبة.
               غير ف النصوص اللي ما عندهاش لائحة بالإيد: إلا كتبناها،
               هي المرجع وما كنزيدوش عليها. */
            const listed = custom.length > 0
                || (!!extra && extra.some(function (e) { return e && e.phrases && e.phrases.length; }));
            if (inText < KW_MIN && !listed) {
                hits = 0;
                a.forEach(function (n, i) { hits += kwPaint(n, sb, extra && extra[i], true); });
                b.forEach(function (n) { hits += kwPaint(n, sa, null, true); });
            }
            if (ctx) kwCustomAfter(a, b, extra, ctx);
            return hits;
        },
        /* شحال من كلمة كتتلون ف النص من هاد الترويسة (كيف ما غيبان للطالب،
           بالكلمات اللي بالإيد والاحتياط) — للفحص ف audit */
        count: function (body, heading, extra) {
            const p = document.createElement("p");
            const h = document.createElement("p");
            p.textContent = body;
            h.textContent = heading;
            window.__lesenKeys.link([p], [h], [extra || null]);
            return p.querySelectorAll("mark.kw").length;
        },
        /* فحص: أي نصوص Teil 1 ما كيتلونش فيها حتى كلمة؟

           ف Console ديال صفحة Lesen (خاصك تكون داخل بحساب Premium):
               copy(JSON.stringify(await __lesenKeys.audit("b2")))
           كيجيب كل المواضيع (المدفوعة كذلك، من الـWorker) وكيرجع النصوص اللي
           فيها <= max كلمة مفتاحية: الموضوع، رقم النص، الترويسة الصحيحة والنص. */
        audit: async function (level, max) {
            const limit = max == null ? 0 : max;
            const lv = String(level || (location.pathname.indexOf("b1-") !== -1 ? "b1" : "b2")).toLowerCase();
            const topics = (window["LESEN_" + lv.toUpperCase() + "_TOPICS"] || [])
                .filter(function (t) { return !t.parts || t.parts.indexOf("teil1") !== -1; });
            const free = window["LESEN_" + lv.toUpperCase() + "_CONTENT"] || {};
            const out = { level: lv, topics: topics.length, checked: 0, problems: [], rows: [] };

            for (let t = 0; t < topics.length; t++) {
                const topic = topics[t];
                let task = (free[topic.id] || {}).teil1;
                if (!task && typeof window.__lesenPremiumFetch === "function") {
                    const got = await window.__lesenPremiumFetch(topic.id);
                    task = got && got.ok ? (got.data || {}).teil1 : null;
                    if (!task) { out.problems.push(topic.id + ": " + ((got && got.why) || "ما وصلش المحتوى")); continue; }
                }
                if (!task) { out.problems.push(topic.id + ": ماكاينش المحتوى"); continue; }

                const variants = Array.isArray(task.variants) && task.variants.length ? task.variants : [task];
                variants.forEach(function (variant, vi) {
                    const options = variant.options || task.options || [];
                    const texts = variant.texts || task.texts || [];
                    texts.forEach(function (text, i) {
                        const answer = (variant.answers || [])[i] || text.answer
                            || ((task.questions || [])[i] || {}).answer || "";
                        const head = options.find(function (o) { return String(o.value) === String(answer); });
                        if (!head) return;
                        out.checked++;
                        const marks = window.__lesenKeys.count(text.body || "", head.text || "",
                            window.__lesenKeys.manual({ level: lv, id: topic.id }, i + 1, text));
                        if (marks <= limit) {
                            out.rows.push({ id: topic.id, variant: vi + 1, text: i + 1, marks: marks,
                                heading: head.text, body: text.body });
                        }
                    });
                });
            }
            return out;
        },
        /* الكلمات المفتاحية اللي كتبناهم بالإيد للنص رقم n (1…) ديال الموضوع id.
           مصدرين: assets/lesen-keys.js، وحقل keys ف النص نفسو. */
        manual: function (meta, n, text) {
            const level = meta && meta.level;
            const id = meta && meta.id;
            const listed = ((((window.LESEN_KEYS || {})[level] || {})[id]) || {})[n] || [];
            const inline = text && Array.isArray(text.keys) ? text.keys : [];
            const phrases = listed.concat(inline);
            return phrases.length ? { phrases: phrases, label: (id || "?") + " — Text " + n } : null;
        },
        clear: function (nodes) {
            nodes.forEach(function (n) {
                if (!n) return;
                if (n.__kwText != null) { n.textContent = n.__kwText; n.__kwText = null; }
                kwLinks = kwLinks.filter(function (l) { return l.nodes.indexOf(n) === -1; });
                const box = n.closest && n.closest("[data-kw-box]");
                if (box) Array.prototype.forEach.call(box.querySelectorAll(".kw-admin"), function (x) { x.remove(); });
            });
        }
    };

    /* ===== الكلمات ديال الأدمين (assets/kw-custom.js) =====
       كل link() اللي عندو ctx كيتسجل هنا، باش ملي تتزاد ولا تتحيد
       كلمة (ولا توصل من Firestore) نعاودو نلونو نفس العناصر. */
    let kwLinks = [];
    function kwCustomFor(ctx) {
        const store = window.__kwCustom;
        if (!ctx || !ctx.doc || !store) return [];
        const out = [];
        (ctx.items || []).forEach(function (item) {
            store.phrases(ctx.doc, item.key).forEach(function (p) { if (out.indexOf(p) === -1) out.push(p); });
        });
        return out;
    }
    function kwCustomAfter(a, b, extra, ctx) {
        const store = window.__kwCustom;
        if (!store || !ctx.doc) return;
        const nodes = a.concat(b);
        kwLinks = kwLinks.filter(function (l) {
            return l.nodes[0] !== nodes[0] || l.nodes[l.nodes.length - 1] !== nodes[nodes.length - 1];
        });
        kwLinks.push({ a: a, b: b, extra: extra, ctx: ctx, nodes: nodes });

        (ctx.items || []).forEach(function (item) {
            if (!item.box) return;
            item.box.setAttribute("data-kw-box", "");
            store.tools(item.box, {
                doc: ctx.doc,
                key: item.key,
                title: item.title,
                /* فين يقدر يحدد: كل العناصر ديال نفس الكلمة (Teil 3 كيربط جوج مرات) */
                scope: function () {
                    const all = [];
                    kwLinks.forEach(function (l) {
                        if (l.ctx.doc !== ctx.doc) return;
                        if (!(l.ctx.items || []).some(function (x) { return x.key === item.key; })) return;
                        l.nodes.forEach(function (n) { all.push(n); });
                    });
                    return all;
                }
            });
        });

        if (!store.loaded(ctx.doc)) {
            store.load(ctx.doc).then(function () { kwRelink(ctx.doc); });
        }
    }
    function kwRelink(doc) {
        kwLinks = kwLinks.filter(function (l) { return l.nodes.every(function (n) { return n && n.isConnected; }); });
        kwLinks.slice().forEach(function (l) {
            if (doc && l.ctx.doc !== doc) return;
            /* extra ديال النص كيتعاود يتبنى من الأصل (بلا custom القديمة) */
            const base = l.extra && l.extra.map(function (e) {
                if (!e) return e;
                const copy = Object.assign({}, e);
                delete copy.custom;
                return (copy.phrases && copy.phrases.length) ? copy : null;
            });
            window.__lesenKeys.link(l.a, l.b, base, l.ctx);
        });
    }
    /* الراوتر كيعاود ينفذ هاد الملف مع كل قسم: signal كيمسح القدام */
    const kwScope = window.__deSignal ? { signal: window.__deSignal } : undefined;
    document.addEventListener("de-kw-change", function (event) {
        kwRelink(event.detail && event.detail.doc);
    }, kwScope);
    document.addEventListener("de-admin", function () { kwRelink(null); }, kwScope);

    /* الصفحات العادية كترسم دغيا. الصفحات اللي كتبدل
       التمرين بوحدها كتحط data-manual. */
    const initial = document.getElementById("lesen-stack");
    if (initial && !initial.hasAttribute("data-manual")) {
        render(initial);
    }

    /* ---------- بناء تمرين واحد ---------- */

    function buildTask(topic, index) {
        const card = el("section", "lesen-task");

        const head = el("div", "lesen-task-head");
        head.appendChild(el("span", "lesen-task-num", String(index + 1)));
        const h2 = el("h2", "", topic.title || "Aufgabe " + (index + 1));
        head.appendChild(h2);
        card.appendChild(head);

        const body = el("div", "lesen-task-body");

        if (topic.intro) {
            body.appendChild(el("p", "lead", topic.intro));
        }

        (topic.texts || []).forEach(function (text) {
            const box = el("div", "lesen-text");
            if (text.label) {
                box.appendChild(el("span", "lesen-text-label", text.label));
            }
            if (text.title) {
                box.appendChild(el("h3", "", text.title));
            }
            box.appendChild(document.createTextNode(text.body || ""));
            body.appendChild(box);
        });

        /* لائحة الاختيارات المشتركة (الترويسات ولا الإعلانات) */
        if (topic.kind !== "choice" && Array.isArray(topic.options)) {
            const list = el("div", "lesen-text");
            list.appendChild(el("span", "lesen-text-label",
                topic.kind === "anzeigen" ? "Anzeigen" : "Überschriften"));
            topic.options.forEach(function (option) {
                const row = el("div", "", option.value + " — " + option.text);
                list.appendChild(row);
            });
            body.appendChild(list);
        }

        const inputs = [];

        (topic.questions || []).forEach(function (question, qi) {
            const row = el("div", "lesen-q");

            const label = el("div", "lesen-q-text");
            label.appendChild(el("span", "lesen-q-num", String(qi + 1)));
            label.appendChild(document.createTextNode(question.text || ""));
            row.appendChild(label);

            if (topic.kind === "choice") {
                const group = el("div", "lesen-options");
                const name = "t" + topic.id + "q" + qi;

                (question.options || []).forEach(function (text, oi) {
                    const option = el("label", "lesen-option");
                    const input = document.createElement("input");
                    input.type = "radio";
                    input.name = name;
                    input.value = String(oi);
                    option.appendChild(input);
                    option.appendChild(document.createTextNode(text));
                    group.appendChild(option);
                });

                row.appendChild(group);
                inputs.push({ row: row, group: group, name: name, question: question });
            } else {
                const select = document.createElement("select");
                select.className = "lesen-select";

                select.appendChild(new Option("— auswählen —", ""));
                (topic.options || []).forEach(function (option) {
                    select.appendChild(new Option(
                        option.value + " — " + option.text, option.value));
                });
                if (topic.kind === "anzeigen") {
                    select.appendChild(new Option("x — keine Anzeige passt", "x"));
                }

                row.appendChild(select);
                inputs.push({ row: row, select: select, question: question });
            }

            body.appendChild(row);
        });

        /* ---------- الأزرار ---------- */

        const actions = el("div", "lesen-actions");
        const checkBtn = button("lesen-btn lesen-btn-check", "تحقق من الإجابات");
        const showBtn = button("lesen-btn lesen-btn-show", "شوف الحل");
        const retryBtn = button("lesen-btn lesen-btn-retry", "عاود من جديد");
        actions.append(checkBtn, showBtn, retryBtn);
        body.appendChild(actions);

        const score = el("div", "lesen-score");
        score.hidden = true;
        body.appendChild(score);

        checkBtn.addEventListener("click", function () { grade(false); });
        showBtn.addEventListener("click", function () { grade(true); });
        retryBtn.addEventListener("click", reset);

        card.appendChild(body);
        return card;

        /* ---------- التصحيح ---------- */

        function grade(reveal) {
            let right = 0;
            let answered = 0;

            inputs.forEach(function (item) {
                clearMarks(item);

                const expected = String(item.question.answer);
                let given = "";

                if (item.select) {
                    given = item.select.value;
                } else {
                    const picked = item.group.querySelector("input:checked");
                    given = picked ? picked.value : "";
                }

                if (given !== "") answered++;

                const ok = given !== "" && given === expected;
                if (ok) right++;

                item.row.classList.add(ok ? "correct" : "wrong");

                if (item.group) {
                    Array.from(item.group.children).forEach(function (option, oi) {
                        const input = option.querySelector("input");
                        if (input && input.checked) {
                            option.classList.add(ok ? "picked-correct" : "picked-wrong");
                        }
                        if (reveal && String(oi) === expected) {
                            option.classList.add("is-answer");
                        }
                    });
                }

                if (reveal && item.select) {
                    item.select.value = expected;
                    item.row.classList.remove("wrong");
                    item.row.classList.add("correct");
                }

                const mark = el("div", "lesen-mark " + (ok ? "ok" : "no"),
                    ok ? "✓ Richtig"
                       : (reveal ? "Lösung: " + solutionLabel(item, expected)
                                 : (given === "" ? "Noch nicht beantwortet" : "✗ Falsch")));
                item.row.appendChild(mark);
            });

            const total = inputs.length;
            score.hidden = false;
            score.textContent = reveal
                ? "الحلول كاينة فوق. " + right + " من " + total + " كانو صحاح."
                : right + " / " + total + " صحيحة" +
                  (answered < total ? " · باقي " + (total - answered) + " بلا جواب" : "");
        }

        function solutionLabel(item, expected) {
            if (item.select) return expected;
            const option = (item.question.options || [])[Number(expected)];
            return option || expected;
        }

        function clearMarks(item) {
            item.row.classList.remove("correct", "wrong");
            const mark = item.row.querySelector(".lesen-mark");
            if (mark) mark.remove();
            if (item.group) {
                Array.from(item.group.children).forEach(function (option) {
                    option.classList.remove("picked-correct", "picked-wrong", "is-answer");
                });
            }
        }

        function reset() {
            inputs.forEach(function (item) {
                clearMarks(item);
                if (item.select) item.select.value = "";
                if (item.group) {
                    item.group.querySelectorAll("input").forEach(function (input) {
                        input.checked = false;
                    });
                }
            });
            score.hidden = true;
            card.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* ---------- أدوات صغيرة ---------- */

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function button(className, text) {
        const node = document.createElement("button");
        node.type = "button";
        node.className = className;
        node.textContent = text;
        return node;
    }
})();
