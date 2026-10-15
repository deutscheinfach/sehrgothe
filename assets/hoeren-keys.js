/* ===== Hören: الكلمات المفتاحية ف الجمل الصحيحة =====

   ماكاينش النص ديال الأوديو ف الموقع، إذن ماكنقدروش نقارنو بحال
   Lesen. ولكن ملي كيتصحح (Antworten prüfen / anzeigen)، الجمل اللي
   الجواب ديالها «Richtig» هي اللي كتقول بالضبط شنو تسمع ف الأوديو:
   كنلونو فيها الأسماء (بالألمانية كيبداو بحرف كبير)، الأسماء ديال
   البلايص والناس، والأرقام — بحال «Sportverein in Deutschland».

   ولا كانت «قصة سهلة للحفظ» (theme.note) فيها كلمات ألمانية بين
   قوسين — هادوك هوما الكلمات المفتاحية اللي حطيناهم: كنلونوهم ف
   القصة، وكنلونو نفس الكلمات (نفس الجذر) ف الجمل الصحيحة.

   كيخدم مع الكود اللي ف b*-hoeren-teil*.html بلا ما نبدلوه:
   كل سطر عندو data-answer، وكنسمعو للضغطات على الأزرار. */
(function () {
    "use strict";

    /* كلمات كتبدا بحرف كبير غير حيت جات ف أول الجملة */
    const STOP = new Set(("aber als am an auf aus bei beim da das dass dem den der des die dies diese dieser dieses durch ein eine einem einen einer eines er es für im in ist jetzt man mit nach nicht noch nun nur ob oder seit sie sind so um und unter vom von vor war wegen weil wenn wer wie wir wird zu zum zur über").split(" "));
    const WORD = /[0-9][0-9.,]*\s?%?|[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*/g;

    function isKey(word, first) {
        if (/^[0-9]/.test(word)) return true;
        if (word.length < 3) return false;
        if (!/^[A-ZÄÖÜ]/.test(word)) return false;
        if (first && STOP.has(word.toLowerCase())) return false;
        if (/^(Sie|Ihr|Ihre|Ihrem|Ihren|Ihrer|Ihres|Ihnen)$/.test(word)) return false;   /* Sie ماشي اسم */
        return true;
    }

    /* النص ديال الجملة كيكون text node من بعد الرقم — كنلفوه ف span مرة وحدة */
    function sentence(textEl) {
        let span = textEl.querySelector(".nq-de");
        if (span) return span;
        const node = Array.from(textEl.childNodes).find(function (n) {
            return n.nodeType === 3 && n.textContent.trim();
        });
        if (!node) return null;
        span = document.createElement("span");
        span.className = "nq-de";
        span.textContent = node.textContent;
        node.replaceWith(span);
        return span;
    }

    /* كلمة وحدة برك ف كل جملة: الأطول من بين الكلمات المرشحة
       (الأسماء الطويلة كتكون هي المعنى: Reisebüro، Überstunden…) */
    function paintOne(span, accept) {
        if (span.__kwText == null) span.__kwText = span.textContent;
        const text = span.__kwText;
        let best = null, m, first = true;
        WORD.lastIndex = 0;
        while ((m = WORD.exec(text))) {
            const w = m[0].trim();
            const ok = accept(w, first);
            first = false;
            if (ok && (!best || w.length > best.w.length)) best = { w: w, at: m.index };
        }
        span.textContent = "";
        if (!best) { span.textContent = text; return; }
        span.appendChild(document.createTextNode(text.slice(0, best.at)));
        const mark = document.createElement("mark");
        mark.className = "kw";
        mark.textContent = best.w;
        span.appendChild(mark);
        span.appendChild(document.createTextNode(text.slice(best.at + best.w.length)));
    }
    function paint(span) { paintOne(span, isKey); }

    /* ---- الكلمات ديال القصة (بين قوسين) ---- */
    const PAREN = /\(([^()]*[A-Za-zÄÖÜäöüß][^()]*)\)/g;
    const LATIN = /[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß-]*/g;
    function fold(w) {
        return w.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    }
    function stem(w) {
        const f = fold(w);
        const ends = ["ern", "en", "er", "es", "em", "e", "n", "s"];
        for (let i = 0; i < ends.length; i++) {
            if (f.length - ends[i].length >= 4 && f.endsWith(ends[i])) return f.slice(0, -ends[i].length);
        }
        return f;
    }
    /* كل جملة بين قوسين = لائحة ديال الجذور */
    function notePhrases(text) {
        const out = [];
        let m;
        PAREN.lastIndex = 0;
        while ((m = PAREN.exec(text))) {
            const set = new Set();
            (m[1].match(LATIN) || []).forEach(function (w) {
                if (w.length >= 4 && !STOP.has(w.toLowerCase())) set.add(stem(w));
            });
            (m[1].match(/[0-9]+/g) || []).forEach(function (n) { set.add(n); });
            if (set.size) out.push(Array.from(set));
        }
        return out;
    }
    /* الجملة كتاخد غير العبارة اللي كتشبه ليها كثر */
    /* العبارات ف القصة كيجيو بنفس الترتيب ديال الجمل الصحيحة، وكل وحدة
       لجملة وحدة — إذن العبارة اللي تخدمات ماكتعاودش. */
    function bestPhrase(text, phrases, used) {
        const words = text.match(WORD) || [];
        let best = null, score = 0;
        phrases.forEach(function (stems) {
            if (used.has(stems)) return;
            const n = words.filter(function (w) { return hit(w.trim(), stems); }).length;
            if (n > score) { score = n; best = stems; }
        });
        if (best) used.add(best);
        return best;
    }
    function hit(word, stems) {
        if (/^[0-9]/.test(word)) return stems.indexOf(word.replace(/[^0-9]/g, "")) !== -1;
        if (word.length < 4 || STOP.has(word.toLowerCase())) return false;
        const s = stem(word);
        return stems.some(function (k) {
            return s === k || (k.length >= 5 && s.indexOf(k) !== -1) || (s.length >= 5 && k.indexOf(s) !== -1);
        });
    }
    /* كنلونو ف الجملة كلمة وحدة من العبارة ديال القصة */
    function paintFrom(span, stems) {
        paintOne(span, function (w) { return hit(w, stems); });
    }
    /* ف القصة: الجمل اللي بين قوسين كاملين */
    function paintNote(span) {
        if (span.__kwText == null) span.__kwText = span.textContent;
        const text = span.__kwText;
        span.textContent = "";
        let last = 0, m;
        PAREN.lastIndex = 0;
        while ((m = PAREN.exec(text))) {
            span.appendChild(document.createTextNode(text.slice(last, m.index + 1)));
            const mark = document.createElement("mark");
            mark.className = "kw";
            mark.dir = "ltr";
            mark.textContent = m[1];
            span.appendChild(mark);
            last = m.index + 1 + m[1].length;
        }
        span.appendChild(document.createTextNode(text.slice(last)));
    }

    function clear(span) {
        if (span && span.__kwText != null) { span.textContent = span.__kwText; span.__kwText = null; }
    }

    /* صفحات Hören ماكيحملوش section.css — الستايل هنا */
    const css = document.createElement("style");
    css.textContent =
        ".nq-question-text mark.kw,.nq-note mark.kw{background:#fff3a6;color:inherit;border-bottom:2px solid #f2c200;border-radius:4px;padding:0 2px}" +
        "html.dark .nq-question-text mark.kw,html.dark .nq-note mark.kw,:root[data-theme=dark] .nq-question-text mark.kw,:root[data-theme=dark] .nq-note mark.kw{background:rgba(255,206,0,.28);border-bottom-color:#ffce00}";
    document.head.appendChild(css);

    function rowsOf(wrap) {
        return Array.from(wrap.querySelectorAll("[data-answer]"));
    }

    /* ===== الترجمة العربية =====
       الترجمة (q.ar) كتجي مع الموضوع راسو، والزر ديالها كيترسم ف
       الصفحة (buildNativeQuiz). Hören ماكيستعملش Gemini للترجمة —
       Gemini غير لـ Schreiben (باش مايسالاش الـ limit). */

    /* ===== الكلمات اللي زادهم الأدمين (assets/kw-custom.js) =====
       وثيقة وحدة للصفحة: keywords/hoeren-b2-teil1، والجملة كتتعرف
       بالـ hash ديال النص ديالها. كيتلونو زايدين على الكلمة
       الأوتوماتيكية. */
    const PAGE = /(b1|b2)-hoeren-(teil[123])/.exec(location.pathname);
    const DOC = PAGE ? "hoeren-" + PAGE[1] + "-" + PAGE[2] : "";

    function custom(span) {
        const store = window.__kwCustom;
        if (!store || !DOC) return [];
        return store.phrases(DOC, store.key(span.__kwText != null ? span.__kwText : span.textContent));
    }
    /* كل ظهور ديال كل كلمة (الحروف الكبار والصغار ما كيهمّوش) */
    function paintPhrases(span, list) {
        if (span.__kwText == null) span.__kwText = span.textContent;
        const text = span.__kwText;
        const low = text.toLowerCase();
        const spans = [];
        list.forEach(function (p) {
            const want = String(p).toLowerCase();
            if (!want) return;
            let at = low.indexOf(want);
            while (at !== -1) { spans.push([at, at + want.length]); at = low.indexOf(want, at + want.length); }
        });
        spans.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
        const merged = [];
        spans.forEach(function (x) {
            const top = merged[merged.length - 1];
            if (top && x[0] < top[1]) top[1] = Math.max(top[1], x[1]);
            else merged.push([x[0], x[1]]);
        });
        span.textContent = "";
        let last = 0;
        merged.forEach(function (x) {
            span.appendChild(document.createTextNode(text.slice(last, x[0])));
            const mark = document.createElement("mark");
            mark.className = "kw";
            mark.textContent = text.slice(x[0], x[1]);
            span.appendChild(mark);
            last = x[1];
        });
        span.appendChild(document.createTextNode(text.slice(last)));
    }

    /* الكويزات اللي تصححو: نعاودو نلونوهم ملي تتبدل شي كلمة */
    const checked = new Set();

    function apply(wrap, retry) {
        const noteSpan = wrap.querySelector(".nq-note span");
        clear(noteSpan);
        const phrases = noteSpan ? notePhrases(noteSpan.textContent) : [];
        if (!retry && phrases.length) paintNote(noteSpan);
        const used = new Set();
        rowsOf(wrap).forEach(function (row) {
            const textEl = row.querySelector(".nq-question-text");
            Array.prototype.forEach.call(row.querySelectorAll(".kw-admin"), function (x) { x.remove(); });
            if (!textEl) return;
            const span = sentence(textEl);
            if (!span) return;
            clear(span);
            if (retry || row.dataset.answer !== "richtig") return;
            const mine = custom(span);
            const best = phrases.length ? bestPhrase(span.textContent, phrases, used) : null;
            if (!phrases.length) paint(span);
            else if (best) paintFrom(span, best);
            /* + اللي زادهم الأدمين، فوق الكلمة الأوتوماتيكية */
            if (mine.length) {
                const auto = span.querySelector("mark.kw");
                paintPhrases(span, auto ? mine.concat([auto.textContent]) : mine);
            }
            if (window.__kwCustom && DOC) {
                window.__kwCustom.tools(row, {
                    doc: DOC,
                    key: window.__kwCustom.key(span.__kwText != null ? span.__kwText : span.textContent),
                    title: "كلمات مفتاحية",
                    scope: [span]
                });
            }
        });
        if (retry) checked.delete(wrap); else checked.add(wrap);
        if (!retry && window.__kwCustom && DOC && !window.__kwCustom.loaded(DOC)) {
            window.__kwCustom.load(DOC).then(again);
        }
    }
    function again() {
        checked.forEach(function (wrap) {
            if (!wrap.isConnected) { checked.delete(wrap); return; }
            apply(wrap, false);
        });
    }
    document.addEventListener("de-kw-change", function (event) {
        if (!event.detail || event.detail.doc === DOC) again();
    });
    document.addEventListener("de-admin", again);

    document.addEventListener("click", function (event) {
        const btn = event.target.closest(".nq-btn-check, .nq-btn-show, .nq-btn-retry");
        if (!btn) return;
        const wrap = btn.closest(".native-quiz-wrap");
        if (!wrap) return;
        const retry = btn.classList.contains("nq-btn-retry");
        /* من بعد ما يخدم الكود ديال الصفحة */
        setTimeout(function () { apply(wrap, retry); }, 0);
    });
}());
