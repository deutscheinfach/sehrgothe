/* ===== شبكة مواضيع Schreiben (B1 و B2) =====
   نفس شكل البطائق ديال Lesen. كل بطاقة كتحل الصفحة ديالها. */

(function () {
    "use strict";

    const grid = document.getElementById("lesen-grid");
    const search = document.getElementById("lesen-search-input");
    const sortBtn = document.getElementById("lesen-sort-btn");
    const countEl = document.getElementById("lesen-count");

    /* الملف كيعرّف const، ماشي window.X — إذن ماكيبانش
       ف window. كنقراوه بحال متغير عام عادي. */
    /* المستوى كيجي من <main data-level="b1"> — بلاه = B2 */
    const shell = grid.closest("[data-level]");
    const LEVEL = shell ? shell.dataset.level : "b2";
    const source = window["SCHREIBEN_" + LEVEL.toUpperCase() + "_TOPICS"]
        || ((LEVEL === "b2" && typeof SCHREIBEN_B2_TOPICS !== "undefined")
            ? SCHREIBEN_B2_TOPICS : null);

    if (!grid || !source) return;

    /* ===== نسخة قديمة؟ =====

       ملي كيتبدل القسم بلا تحميل صفحة، هاد الملف كيتعاود
       يتنفذ على DOM جديد. النسخة القديمة كتبقى معلقة ف
       listeners ديال window/document وكتخدم على عناصر تحيدو
       من الصفحة. هاد الفحص كيسكتها: إلا ماكانش الـgrid ديالي
       ما زال فالصفحة، إذن أنا النسخة القديمة. */
    function stale() { return !document.body.contains(grid); }

    /* الراوتر كيلغي هاد الـsignal ملي كيحيد الصفحة: المستمعين
       على window/document كيتمسحو وماكيبقاوش يتراكمو. */
    const scope = window.__deSignal ? { signal: window.__deSignal } : undefined;

    const topics = Object.keys(source)
        .sort()
        .map(function (id) {
            return Object.assign({ id: id }, source[id]);
        });

    const SORTS = [
        { key: "default", label: "ترتيب" },
        { key: "alpha", label: "أبجدي" },
        { key: "free", label: "المجاني أولا" }
    ];
    let sortIndex = 0;

    function listed() {
        const term = (search ? search.value : "").trim().toLowerCase();

        let list = topics.filter(function (topic) {
            /* المحتوى ماكاينش ف KV (التحضير بلا أنترنت تعلمها): ما كنبينوش البطاقة */
            if (topic.locked && window.__deMissing && window.__deMissing.has("sch:" + LEVEL + "-" + topic.id)) return false;
            if (!term) return true;
            return (topic.title || "").toLowerCase().includes(term)
                || (topic.type || "").toLowerCase().includes(term)
                || topic.id.includes(term);
        });

        const mode = SORTS[sortIndex].key;
        if (mode === "alpha") {
            list = list.slice().sort(function (a, b) {
                return (a.title || "").localeCompare(b.title || "", "de");
            });
        } else if (mode === "free") {
            list = list.slice().sort(function (a, b) {
                return (!!a.locked === !!b.locked) ? 0 : (a.locked ? 1 : -1);
            });
        }
        return list;
    }

    function chip(className, text) {
        const node = document.createElement("span");
        node.className = "lesen-chip " + className;
        node.textContent = text;
        return node;
    }

    function timeChip(text) {
        const node = document.createElement("span");
        node.className = "lesen-chip lesen-chip-time";
        node.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';
        node.appendChild(document.createTextNode(text));
        return node;
    }

    function card(topic) {
        /* موضوع ما زال ماوصلش المحتوى ديالو: بطاقة بلا رابط */
        const node = document.createElement(topic.soon ? "div" : "a");
        /* المشترك عندو گاع المواضيع — ماعندوش علاش يشوف القفل */
        const shut = topic.locked && !window.__deutschEinfachIsPremium;
        node.className = "lesen-card" + (shut ? " locked" : "") + (topic.soon ? " is-soon" : "");
        if (!topic.soon) node.href = LEVEL + "-schreiben-" + topic.id + ".html";
        if (topic.locked && !topic.soon) node.dataset.topic = topic.id;

        const title = document.createElement("div");
        title.className = "lesen-card-title";
        title.textContent = topic.title || topic.id;
        node.appendChild(title);

        if (topic.type) {
            const row = document.createElement("div");
            row.appendChild(chip("lesen-chip-type", topic.type));
            node.appendChild(row);
        }

        const rule = document.createElement("div");
        rule.className = "lesen-card-rule";
        node.appendChild(rule);

        const foot = document.createElement("div");
        foot.className = "lesen-card-foot";
        foot.appendChild(timeChip(topic.time || "30 min"));
        foot.appendChild(chip("lesen-chip-level", topic.level || "B2"));
        if (topic.soon) foot.appendChild(chip("lesen-chip-soon", "قريباً"));

        const go = document.createElement("span");
        go.className = "lesen-card-go";
        go.textContent = topic.soon ? "⏳" : (shut ? "🔒" : "›");
        go.setAttribute("aria-hidden", "true");
        foot.appendChild(go);

        node.appendChild(foot);

        /* صفحة الموضوع كتتحمل من الصفر، وأول حاجة كتدير هي الطلب للـ Worker.
           ملي المشترك كيقرب لبطاقة (hover / أول لمسة) كنفتحو الاتصال دابا،
           باش ملي تتحل الصفحة يلقاه واجد (DNS + TLS = رحلتين أقل). */
        if (topic.locked && !topic.soon) {
            const warm = function () {
                if (!window.__deutschEinfachIsPremium) return;
                preconnectWorker();
                prefetch.now(topic.id);
            };
            node.addEventListener("pointerdown", warm, { passive: true });
            node.addEventListener("pointerenter", function (event) {
                if (event.pointerType === "mouse") warm();
            }, { passive: true });
        }
        return node;
    }

    /* ===== المشترك: المواضيع كتتجاب من قبل =====
       صفحة الموضوع كتقرا من localStorage (de-sp:<uid>|<lv>-<id>، 3 أيام —
       schreiben-engine.js). ملي كيبان الـ grid، كنجيبو المواضيع اللي
       باينين ف الشاشة (2 ف نفس الوقت، 12 ف الزيارة على الأكثر)، والبطاقة
       اللي قرب ليها (hover / لمسة) كتدوز الأولى. هكا ملي كيدخل، الموضوع
       كيبان دغيا بلا ما يتسنى Firebase والـ Worker. */
    const prefetch = (function () {
        const ENDPOINT = "https://deutsch-einfach-correction.soufianemouyr.workers.dev";
        const TTL = 3 * 24 * 3600 * 1000;
        const MAX = 12;
        const queue = [];
        const seen = {};
        let running = 0, started = 0;
        function account() {
            try {
                const a = JSON.parse(localStorage.getItem("deutschEinfachLastAccount") || "null");
                return a && a.premium === true && a.uid ? a : null;
            } catch (e) { return null; }
        }
        function key(id) {
            const a = account();
            return a ? "de-sp:" + a.uid + "|" + LEVEL + "-" + id : "";
        }
        function cached(id) {
            const k = key(id);
            if (!k) return true;
            try {
                const v = JSON.parse(localStorage.getItem(k) || "null");
                return !!(v && v.data && Array.isArray(v.data.points) && Date.now() - v.t < TTL);
            } catch (e) { return false; }
        }
        async function fetchOne(id) {
            const auth = window.__deutschEinfachAuth;
            const user = auth && auth.currentUser;
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: JSON.stringify(LEVEL === "b2"
                    ? { topicId: id, idToken: token }
                    : { lesenId: "schreiben-" + LEVEL + "-" + id, idToken: token })
            });
            if (!res.ok) return;
            const data = await res.json();
            const k = key(id);
            if (k && data && Array.isArray(data.points)) {
                try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), data: data })); } catch (e) { /* عامرة */ }
                /* بلا أنترنت (diag.js) */
                if (window.__deStore) window.__deStore.put(LEVEL === "b2" ? "t:" + id : "l:schreiben-" + LEVEL + "-" + id, data);
            }
        }
        function pump() {
            while (running < 2 && queue.length && started < MAX) {
                const id = queue.shift();
                if (cached(id)) continue;
                running++; started++;
                fetchOne(id).catch(function () { /* الصفحة ديال الموضوع كتعاود */ })
                    .then(function () { running--; pump(); });
            }
        }
        function wanted(id) {
            const t = source[id];
            return !!t && !t.soon && !(Array.isArray(t.points) && t.points.length);
        }
        return {
            add: function (id) {
                if (seen[id] || !wanted(id) || !window.__deutschEinfachIsPremium) return;
                seen[id] = true;
                queue.push(id);
                pump();
            },
            now: function (id) {
                if (!wanted(id) || !window.__deutschEinfachIsPremium || cached(id)) return;
                const i = queue.indexOf(id);
                if (i !== -1) queue.splice(i, 1);
                if (seen[id] && i === -1) return;   /* كيتجاب دابا */
                seen[id] = true;
                queue.unshift(id);
                if (started >= MAX) started = MAX - 1;   /* اللي بغا يدخل ليه ديما */
                pump();
            }
        };
    })();
    /* من بعد ما يبان المحتوى: البطائق اللي ف الشاشة (ولا قراب) الأولين،
       ومن بعد الباقي بالترتيب ديال اللائحة — حتى 12 ف الزيارة. */
    let watching = false;
    function watchCards() {
        if (watching || !window.__deutschEinfachIsPremium) return;
        watching = true;
        (window.__deAfterContent || function (fn) { setTimeout(fn, 1500); })(function () {
            if (stale()) return;
            const cards = Array.prototype.slice.call(grid.querySelectorAll(".lesen-card[data-topic]"));
            const near = window.innerHeight * 1.5;
            cards.filter(function (n) { return n.getBoundingClientRect().top < near; })
                .concat(cards.filter(function (n) { return n.getBoundingClientRect().top >= near; }))
                .forEach(function (n) { prefetch.add(n.dataset.topic); });
        });
    }

    /* ===== الصفحة ديال الموضوع كتتحضر من قبل (Chrome) =====
       كل موضوع صفحة بوحدها. ملي الطالب كيقرب لبطاقة (الفأرة فوقها ولا
       الصبع)، المتصفح كيحل الصفحة ف الخفا (prerender) — الضغطة كتوريها
       ف اللحظة. المتصفحات اللي ما كتعرفش هادشي كيتجاهلوه. */
    (function speculate() {
        try {
            if (!(HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules"))) return;
            if (document.querySelector('script[type="speculationrules"][data-de="schreiben"]')) return;
            const rules = document.createElement("script");
            rules.type = "speculationrules";
            rules.dataset.de = "schreiben";
            rules.textContent = JSON.stringify({
                /* غير البطائق المفتوحة: المقفولة (ماشي مشترك) كتحل نافذة ماشي الصفحة */
                prerender: [{
                    where: { and: [
                        { href_matches: "/" + LEVEL + "-schreiben-*.html" },
                        { not: { selector_matches: ".locked, .locked *" } }
                    ] },
                    eagerness: "moderate"
                }]
            });
            document.head.appendChild(rules);
        } catch (e) { /* غير تسريع */ }
    })();

    let connected = false;
    function preconnectWorker() {
        if (connected) return;
        connected = true;
        try {
            const href = "https://deutsch-einfach-correction.soufianemouyr.workers.dev";
            if (document.head.querySelector('link[rel="preconnect"][href="' + href + '"]')) return;
            const link = document.createElement("link");
            link.rel = "preconnect";
            link.href = href;
            link.crossOrigin = "";
            document.head.appendChild(link);
        } catch (error) { /* غير تسريع */ }
    }

    /* كنعاودو نرسمو اللائحة (de-premium، البحث…): بلا هادي الصفحة كتقصار
       للحظة → المتصفح كيطلع السكرول لفوق (كيبان بحال إلا الصفحة كترجع،
       خصوصا من بعد زر الرجوع). كنحبسو الطول حتى ترسم الجديدة. */
    function clearGrid() {
        const h = grid.offsetHeight;
        if (h) {
            grid.style.minHeight = h + "px";
            requestAnimationFrame(function () { grid.style.minHeight = ""; });
        }
        grid.textContent = "";
    }

    function render() {
        const list = listed();
        clearGrid();

        if (countEl) countEl.textContent = list.length ? list.length + " موضوع" : "";

        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "lesen-empty";
            const searching = (search ? search.value : "").trim() !== "";
            empty.textContent = searching
                ? "ماكاين حتى موضوع بهاد الاسم."
                : "ما زال ماكاينش مواضيع. قريبا 🙏";
            grid.appendChild(empty);
            return;
        }

        list.forEach(function (topic) { grid.appendChild(card(topic)); });
        watchCards();
        /* اللائحة بانت: Firestore والجلب المسبق يقدرو يبداو (diag.js) */
        if (!new URLSearchParams(location.search).get("thema")) document.dispatchEvent(new CustomEvent("de-content"));
    }

    if (search) search.addEventListener("input", render);
    if (sortBtn) {
        sortBtn.addEventListener("click", function () {
            sortIndex = (sortIndex + 1) % SORTS.length;
            sortBtn.querySelector(".label").textContent = SORTS[sortIndex].label;
            render();
        });
    }

    render();

    /* ===== الرجوع من موضوع: نفس البلاصة ف اللائحة =====
       ملي كيدخل لموضوع كنحفظو فين كان. ملي كيرجع (زر ← ديال الموضوع
       كيحل اللائحة من جديد إلا ما قدرش يرجع بالـ history) كنرجعوه ليها. */
    const PLACE = "de-hub-y:" + location.pathname;
    grid.addEventListener("click", function (event) {
        if (!event.target.closest("a.lesen-card")) return;
        try { sessionStorage.setItem(PLACE, String(Math.round(window.scrollY))); } catch (e) { /* */ }
    }, true);
    (function comeBack() {
        let ref = "";
        try { ref = new URL(document.referrer).pathname; } catch (e) { return; }
        if (!new RegExp("/" + LEVEL + "-schreiben-\\d+\\.html$").test(ref)) return;
        let y = 0;
        try { y = Number(sessionStorage.getItem(PLACE) || 0); } catch (e) { /* */ }
        if (y > 0) window.scrollTo(0, y);
    })();

    /* حالة الاشتراك كتوصل من الهيدر من بعد ما يجاوب Firebase —
       اللائحة خاصها تتعاود باش الأقفال يطيحو. */
    document.addEventListener("de-premium", function () {
        if (stale()) return;
        render();
    }, scope);
})();
