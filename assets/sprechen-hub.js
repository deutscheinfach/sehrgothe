/* ===== شبكة مواضيع Sprechen + التمرين فنفس الصفحة =====

   نفس الفكرة ديال lesen-hub.js:
     - اللائحة: تبويبات الأجزاء، بحث، ترتيب، وبطائق.
     - التمرين: كيعوض اللائحة فنفس الصفحة، مع زر رجوع.

   ماكاينش تنقل لصفحة أخرى — غير الرابط كيتبدل (?thema=…&teil=…)
   باش زر الرجوع ديال الـ navigateur والتحديث يخدمو. */

(function () {
    "use strict";

    const grid = document.getElementById("sprechen-grid");
    const detail = document.getElementById("sprechen-detail");
    const toolbar = document.querySelector(".lesen-toolbar");
    const tabsNav = document.getElementById("sprechen-tabs");
    const countEl = document.getElementById("sprechen-count");
    const heroEl = document.querySelector(".lesen-head-row");
    const search = document.getElementById("sprechen-search-input");
    const sortBtn = document.getElementById("sprechen-sort-btn");
    const totalEl = document.getElementById("sprechen-total");

    if (!grid || !detail) return;

    /* ===== نسخة قديمة؟ =====

       ملي كيتبدل القسم بلا تحميل صفحة، هاد الملف كيتعاود
       يتنفذ على DOM جديد. النسخة القديمة كتبقى معلقة ف
       listeners ديال window/document وكتخدم على عناصر تحيدو
       من الصفحة. هاد الفحص كيسكتها: إلا ماكانش الـgrid ديالي
       ما زال فالصفحة، إذن أنا النسخة القديمة. */
    /* زر الرجوع كيرجع لنفس البلاصة ف اللائحة: قبل ما نزيدو صفحة ف
       الـ history، كنحفظو فين كان الطالب (deY) ف الصفحة اللي خارج منها */
    function dePush(state, title, url) {
        try { history.replaceState(Object.assign({}, history.state, { deY: Math.round(window.scrollY) }), ""); } catch (e) { /* */ }
        history.pushState(state, title, url);
    }

    function stale() { return !document.body.contains(grid); }

    /* الراوتر كيلغي هاد الـsignal ملي كيحيد الصفحة: المستمعين
       على window/document كيتمسحو وماكيبقاوش يتراكمو. */
    const scope = window.__deSignal ? { signal: window.__deSignal } : undefined;

    /* المستوى كيتقرا من data-level ديال الصفحة (b1 / b2).
       المواضيع كيتجابو من SPRECHEN_B1_TOPICS ولا SPRECHEN_B2_TOPICS. */
    const shell = grid.closest("[data-level]");
    const LEVEL = ((shell && shell.dataset.level) || "b2").toUpperCase();

    const PART_NAMES = {
        B1: ["Kennenlernen", "Über ein Thema sprechen", "Gemeinsam planen"],
        B2: ["Erfahrungen", "Text & Meinung", "Gemeinsam planen"]
    };
    const PARTS = ["teil1", "teil2", "teil3"].map(function (key, i) {
        return { key: key, label: "Teil " + (i + 1), name: (PART_NAMES[LEVEL] || PART_NAMES.B2)[i] };
    });
    const CONTENT = window["SPRECHEN_" + LEVEL + "_CONTENT"] || {};
    const PART_LABEL = {};
    const PART_NAME = {};
    PARTS.forEach(function (p) { PART_LABEL[p.key] = p.label; PART_NAME[p.key] = p.name; });

    const SOURCE = window["SPRECHEN_" + LEVEL + "_TOPICS"];
    const topics = Array.isArray(SOURCE) ? SOURCE.slice() : [];

    const SORTS = [
        { key: "default", label: "ترتيب" },
        { key: "alpha",   label: "أبجدي" },
        { key: "free",    label: "المجاني أولا" }
    ];
    let sortIndex = 0;

    /* الجزء المختار من التبويبات. فارغ = گاع الأجزاء. */
    let activePart = "";

    /* ================= اللائحة ================= */

    function listed() {
        const term = (search ? search.value : "").trim().toLowerCase();

        let list = topics.filter(function (topic) {
            if (activePart) {
                const parts = topic.parts || [];
                if (parts.length && parts.indexOf(activePart) === -1) return false;
            }
            /* المحتوى ماكاينش ف KV (ولا مكسور): ما كنبينوش البطاقة */
            if (topic.locked && window.__deMissing && window.__deMissing.has("sp:" + LEVEL.toLowerCase() + "-" + topic.id)) return false;
            if (!term) return true;
            return (topic.title || "").toLowerCase().includes(term)
                || (topic.ar || "").includes(term)
                || (topic.id || "").toLowerCase().includes(term);
        });

        const mode = SORTS[sortIndex].key;

        if (mode === "alpha") {
            list = list.slice().sort(function (a, b) {
                return (a.title || "").localeCompare(b.title || "", "de");
            });
        } else if (mode === "free") {
            list = list.slice().sort(function (a, b) {
                return (a.locked === b.locked) ? 0 : (a.locked ? 1 : -1);
            });
        }

        return list;
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

    function renderList() {
        /* تبويب Prüfungen: امتحانات كاملة (Teil 1 + 2 + 3) */
        if (!activePart) { renderExams(); return; }
        const list = listed();
        clearGrid();

        if (countEl) countEl.textContent = list.length ? list.length + " موضوع" : "";

        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "lesen-empty";
            const term = (search ? search.value : "").trim();
            empty.textContent = term
                ? "ماكاين حتى موضوع بهاد الاسم."
                : "⏳ هاد الجزء كنوجدوه دابا — قريباً.";
            grid.appendChild(empty);
            return;
        }

        list.forEach(function (topic) { grid.appendChild(card(topic)); });
        prefetchAll();
        /* اللائحة بانت: Firestore والجلب المسبق يقدرو يبداو (diag.js) */
        if (!new URLSearchParams(location.search).get("thema")) document.dispatchEvent(new CustomEvent("de-content"));
    }

    /* ===== المشترك: المحتوى المدفوع كيتجاب من قبل =====
       من بعد ما تبان اللائحة: الـbundle ديال كل جزء (طلب واحد = كاع
       المواضيع ديالو)، ومن بعد المواضيع اللي ماكانوش فيه (3 ف نفس الوقت).
       كلشي كيتحفظ ف المتصفح (lesen-premium.js، 3 أيام) → الضغطة على
       الموضوع كتبان ف اللحظة بلا Worker. */
    let prefetched = false;
    function prefetchAll() {
        if (prefetched || !window.__sehrgutIsPremium || typeof window.__lesenPremiumFetch !== "function") return;
        prefetched = true;
        (window.__deAfterContent || function (fn) { setTimeout(fn, 1500); })(async function () {
            if (stale()) return;
            const lvl = "sprechen-" + LEVEL.toLowerCase() + "-";
            const fetchOne = function (id) {
                return Promise.resolve(window.__lesenPremiumFetch(id)).catch(function () { return null; });
            };
            const locked = topics.filter(function (t) { return t.locked && !t.soon && !CONTENT[t.id]; });
            const bundles = [];
            locked.forEach(function (t) {
                const b = t.pack ? lvl + "pack" : lvl + t.id.split("-")[0];
                if (bundles.indexOf(b) === -1) bundles.push(b);
            });
            const got = {};
            const ask = bundles.filter(function (b) { return !bundleMissing(b); });
            (await Promise.all(ask.map(fetchOne))).forEach(function (r, i) {
                noteBundle(ask[i], r);
                if (r && r.ok && r.data) Object.assign(got, r.data);
            });
            if (stale()) return;
            /* pack: المفتاح ديال الموضوع بوحدو هو الأول (premiumLoad) — إلا
               ماكانش، الـpack هو اللي كيتستعمل، إذن كنحطوه ف الذاكرة دابا. */
            /* الجزء اللي مفتوح دابا هو الأول */
            const here = function (t) { return (t.parts || []).indexOf(activePart) !== -1 ? 0 : 1; };
            const rest = locked.filter(function (t) { return t.pack || !got[t.id]; })
                .sort(function (a, b) { return here(a) - here(b); })
                .slice(0, 40);
            const queue = rest.slice();
            const worker = async function () {
                while (queue.length && !stale()) {
                    const t = queue.shift();
                    const r = await fetchOne(lvl + t.id);
                    if (!(r && r.ok && r.data) && t.pack && got[t.id]) CONTENT[t.id] = got[t.id];
                    else noteMissing(t.id, r);
                }
            };
            await Promise.all([worker(), worker(), worker()]);
        });
    }

    function card(topic) {
        const parts = topic.parts || [];
        const shownPart = activePart || parts[0] || "teil1";

        const shut = topic.locked && !window.__sehrgutIsPremium;

        /* soon: المحتوى ما زال ماوصلش → بطاقة بلا رابط */
        const node = document.createElement(topic.soon ? "div" : "a");
        node.className = "lesen-card" + (shut ? " locked" : "") + (topic.soon ? " is-soon" : "");
        if (!topic.soon) node.href = pageUrl(topic.id, shownPart);

        const title = document.createElement("div");
        title.className = "lesen-card-title";
        title.appendChild(document.createTextNode(topic.title || topic.id));
        if (topic.ar) {
            const ar = document.createElement("span");
            ar.className = "lesen-card-ar";
            ar.textContent = "(" + topic.ar + ")";
            title.appendChild(ar);
        }
        node.appendChild(title);

        const rule = document.createElement("div");
        rule.className = "lesen-card-rule";
        node.appendChild(rule);

        const foot = document.createElement("div");
        foot.className = "lesen-card-foot";
        foot.appendChild(chip("lesen-chip-level", topic.level || LEVEL));
        foot.appendChild(chip("lesen-chip-parts",
            activePart ? PART_NAME[activePart] : (parts.length + " أجزاء")));
        if (topic.soon) foot.appendChild(chip("lesen-chip-soon", "قريباً"));

        const go = document.createElement("span");
        go.className = "lesen-card-go";
        go.textContent = topic.soon ? "⏳" : (shut ? "🔒" : "›");
        go.setAttribute("aria-hidden", "true");
        foot.appendChild(go);

        node.appendChild(foot);

        if (topic.soon) return node;

        if (topic.locked) warmOnIntent(node, function () { return [topic]; });

        node.addEventListener("click", function (event) {
            /* فتح ف تبويب جديد خاصو يبقى خدام عادي */
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            open(topic.id, shownPart, true);
        });

        return node;
    }

    function chip(className, text) {
        const node = document.createElement("span");
        node.className = "lesen-chip " + className;
        node.textContent = text;
        return node;
    }

    /* ================= Prüfungen: امتحان كامل =================
       Prüfung n = الموضوع رقم n من Teil 1 و Teil 2 و Teil 3. */
    /* Premium ديال B1: المحتوى ف Cloudflare KV. الأول المفتاح الجامع
       (lesen-sprechen-b1-t2 = كاع المواضيع ديال الجزء ف value وحدة)،
       ومن بعد المفتاح ديال الموضوع بوحدو (lesen-sprechen-b1-t2-06). */
    /* الـbundle ديال الجزء ماكاينش ف KV (B2 دابا): الـ Worker كيقلب عليه
       ف premium-sprechen و premium-lesen (900 KB) قبل ما يقول 404 — طلب
       بطيء بلا فايدة. كنتفكرو بلي ماكاينش 24 ساعة. */
    const MISS_KEY = "de-sp-nobundle:";
    function bundleMissing(id) {
        try { return Date.now() - Number(localStorage.getItem(MISS_KEY + id) || 0) < 24 * 3600 * 1000; }
        catch (e) { return false; }
    }
    function noteBundle(id, r) {
        try {
            if (r && r.status === 404) localStorage.setItem(MISS_KEY + id, String(Date.now()));
            else if (r && r.ok) localStorage.removeItem(MISS_KEY + id);
        } catch (e) { /* */ }
    }

    /* الـ Worker جاوب: ماكاينش (404) ولا مكسور (5xx) → كنخبيو البطاقة (diag.js) */
    function noteMissing(themaId, r) {
        if (!window.__deMissing || !r) return;
        const key = "sp:" + LEVEL.toLowerCase() + "-" + themaId;
        if (r.ok && r.data) window.__deMissing.del(key);
        else if (r.status === 404 || r.status >= 500) window.__deMissing.add(key);
    }

    function premiumLoad(themaId) {
        const lvl = "sprechen-" + LEVEL.toLowerCase() + "-";
        /* المواضيع اللي كانو مجانيين (pack: true): كاملين فمفتاح واحد
           lesen-sprechen-<lvl>-pack. الباقي: الـbundle ديال الجزء، ومن بعد
           المفتاح ديال الموضوع بوحدو. */
        const topic = topics.find(function (t) { return t.id === themaId; });
        if (topic && topic.pack) {
            /* أولا المفتاح ديال الموضوع بوحدو (lesen-sprechen-<lvl>-<id>)،
               وإلا ماكانش: الـpack اللي فيه كاملين. جوج الطلبات كيمشيو بالتوازي
               (قبل: واحد من بعد واحد = ضعف الانتظار ملي كيكون الاحتياطي هو
               اللي كيجاوب). الـpack كيتحفظ، يعني الموضوع الجاي كيجي دغيا. */
            const ownReq = window.__lesenPremiumFetch(lvl + themaId);
            const packReq = window.__lesenPremiumFetch(lvl + "pack");
            return ownReq.then(function (own) {
                if (own && own.ok && own.data) return own;
                return packReq.then(function (r) {
                    const one = r && r.ok && r.data && r.data[themaId];
                    return one ? { ok: true, data: one } : (own || r);
                });
            }).then(function (out) {
                if (out && out.ok && out.data) CONTENT[themaId] = out.data;
                return out;
            });
        }
        /* الـbundle ديال الجزء. إلا ماكانش ف الذاكرة، المفتاح ديال الموضوع بوحدو
           كيمشي معاه بالتوازي (إلا الـbundle ما فيهش الموضوع ما نتسناوش
           رحلة أخرى). إلا كان الـbundle ديجا عندنا، ما كنطلبوش والو زايد. */
        const bundleId = lvl + themaId.split("-")[0];
        if (bundleMissing(bundleId)) {
            return window.__lesenPremiumFetch(lvl + themaId).then(function (r) {
                if (r && r.ok && r.data) CONTENT[themaId] = r.data;
                noteMissing(themaId, r);
                return r;
            });
        }
        const seen = typeof window.__lesenPremiumPeek === "function" && window.__lesenPremiumPeek(bundleId);
        const bundleReq = window.__lesenPremiumFetch(bundleId);
        bundleReq.then(function (r) { noteBundle(bundleId, r); });
        const soloReq = seen ? null : window.__lesenPremiumFetch(lvl + themaId);
        return bundleReq.then(function (r) {
            const one = r && r.ok && r.data && r.data[themaId];
            return one ? { ok: true, data: one } : (soloReq || window.__lesenPremiumFetch(lvl + themaId));
        }).then(function (r) {
            if (r && r.ok && r.data) CONTENT[themaId] = r.data;
            noteMissing(themaId, r);
            return r;
        });
    }
    function needsPremiumLoad(topic) {
        /* قبل كان هنا LEVEL !== "B2" حيت محتوى B2 كان محطوط
           ف assets/sprechen-b2-content.js — يعني مقروء عند
           أي واحد، والريبو عام. دابا المدفوع ف KV بحال Lesen
           و Hören، إذن B2 خاصو يجيب من الـ Worker حتى هو. */
        return topic.locked && !CONTENT[topic.id]
            && typeof window.__lesenPremiumFetch === "function";
    }
    /* كنبداو نجيبو المحتوى المدفوع قبل ما المستعمل يبرك: hover (120ms)
       ولا أول لمسة. الضغطة كتجي من بعد، والطلب ديجا ماشي. لغير المشترك
       ما كيدير والو. */
    function warmOnIntent(node, topicsOf) {
        let timer = 0;
        const go = function () {
            if (!window.__sehrgutIsPremium) return;
            topicsOf().forEach(function (t) {
                if (t && needsPremiumLoad(t)) premiumLoad(t.id).catch(function () {});
            });
        };
        node.addEventListener("pointerdown", go, { passive: true });
        node.addEventListener("pointerenter", function (event) {
            if (event.pointerType === "mouse") timer = setTimeout(go, 120);
        }, { passive: true });
        node.addEventListener("pointerleave", function () { clearTimeout(timer); }, { passive: true });
    }

    function waitBox(into) {
        /* هيكل رمادي بلاصة «كنجيبو…» (diag.js) */
        const wait = window.__deSkeleton ? window.__deSkeleton("topic") : document.createElement("div");
        into.appendChild(wait);
        if (window.__deNetHint) window.__deNetHint(wait);
        return wait;
    }

    function examList() {
        const lists = PARTS.map(function (p) {
            return topics.filter(function (t) { return (t.parts || []).indexOf(p.key) !== -1; });
        });
        /* جزء فيه موضوع واحد (بحال Teil 1 ف B1 = Kennenlernen) كيتعاود فكل امتحان */
        const many = lists.filter(function (l) { return l.length > 1; });
        const count = lists.some(function (l) { return !l.length; }) ? 0
            : Math.min.apply(null, (many.length ? many : lists).map(function (l) { return l.length; }));
        const out = [];
        for (let i = 0; i < count; i++) {
            const parts = {};
            PARTS.forEach(function (p, j) { parts[p.key] = lists[j][i % lists[j].length]; });
            out.push({ n: i + 1, parts: parts,
                       locked: PARTS.some(function (p) { return parts[p.key].locked; }) });
        }
        return out;
    }

    function renderExams() {
        const term = (search ? search.value : "").trim().toLowerCase();
        let list = examList().filter(function (exam) {
            if (!term) return true;
            if (("prüfung " + exam.n).indexOf(term) !== -1 || String(exam.n) === term) return true;
            return PARTS.some(function (p) {
                const t = exam.parts[p.key];
                return (t.title || "").toLowerCase().includes(term) || (t.ar || "").includes(term);
            });
        });
        if (SORTS[sortIndex].key === "free") {
            list = list.slice().sort(function (a, b) { return (a.locked === b.locked) ? 0 : (a.locked ? 1 : -1); });
        }
        clearGrid();
        if (countEl) countEl.textContent = list.length ? list.length + " Prüfungen" : "";
        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "lesen-empty";
            empty.textContent = "ماكاين حتى امتحان بهاد الاسم.";
            grid.appendChild(empty);
            return;
        }
        list.forEach(function (exam) { grid.appendChild(examCard(exam)); });
    }

    function examCard(exam) {
        const shut = exam.locked && !window.__sehrgutIsPremium;
        const node = document.createElement("a");
        node.className = "lesen-card exam-card" + (shut ? " locked" : "");
        node.href = examUrl(exam.n, "teil1");

        const title = document.createElement("div");
        title.className = "lesen-card-title";
        title.appendChild(document.createTextNode("Prüfung " + exam.n));
        const sub = document.createElement("span");
        sub.className = "lesen-card-ar";
        sub.textContent = "(امتحان كامل)";
        title.appendChild(sub);
        node.appendChild(title);

        const ul = document.createElement("ul");
        ul.className = "exam-card-parts";
        PARTS.forEach(function (p) {
            const li = document.createElement("li");
            const b = document.createElement("b");
            b.textContent = p.label;
            li.appendChild(b);
            li.appendChild(document.createTextNode(exam.parts[p.key].title || ""));
            ul.appendChild(li);
        });
        node.appendChild(ul);

        const foot = document.createElement("div");
        foot.className = "lesen-card-foot";
        foot.appendChild(chip("lesen-chip-level", LEVEL));
        foot.appendChild(chip("lesen-chip-parts", PARTS.length + " Teile"));
        if (!exam.locked) foot.appendChild(chip("lesen-chip-free", "مجاني"));
        const go = document.createElement("span");
        go.className = "lesen-card-go";
        go.textContent = shut ? "🔒" : "›";
        go.setAttribute("aria-hidden", "true");
        foot.appendChild(go);
        node.appendChild(foot);

        /* الامتحان كيبدا بـ Teil 1: كنجيبو الموضوع ديالو قبل الضغطة */
        if (exam.locked) warmOnIntent(node, function () { return [exam.parts.teil1]; });

        node.addEventListener("click", function (event) {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            openExam(exam.n, "teil1", true);
        });
        return node;
    }

    function examUrl(n, part) {
        const params = new URLSearchParams();
        params.set("pruefung", String(n));
        if (part) params.set("teil", part);
        return location.pathname + "?" + params.toString();
    }

    /* النقط ديال الامتحان (25 لكل جزء) — كتجي من الحدث sprechen-points */
    let examListener = null;
    const EXAM_MAX = 25;
    function fmtPts(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","); }

    function openExam(n, part, push) {
        const exam = examList()[n - 1];
        if (!exam) { close(push); return; }
        const scores = {};
        let current = PART_LABEL[part] ? part : "teil1";
        if (push) dePush({ pruefung: n, teil: current }, "", examUrl(n, current));

        if (heroEl) heroEl.hidden = true;
        if (tabsNav) tabsNav.hidden = true;
        if (toolbar) toolbar.hidden = true;
        if (countEl) countEl.hidden = true;
        grid.hidden = true;
        detail.hidden = false;
        detail.textContent = "";

        const head = document.createElement("div");
        head.className = "lesen-detail-head";
        const back = document.createElement("button");
        back.type = "button";
        back.className = "lesen-back";
        back.textContent = "← اللائحة";
        back.addEventListener("click", function () { close(true); });
        head.appendChild(back);
        const h1 = document.createElement("h1");
        h1.className = "lesen-detail-title";
        h1.appendChild(document.createTextNode("Prüfung " + n));
        const ar = document.createElement("span");
        ar.className = "lesen-card-ar";
        ar.textContent = "(Sprechen B2 · امتحان كامل)";
        h1.appendChild(ar);
        head.appendChild(h1);
        detail.appendChild(head);
        document.documentElement.classList.add("is-topic-focus");

        const tabs = document.createElement("nav");
        tabs.className = "lesen-tabs lesen-part-tabs exam-tabs";
        PARTS.forEach(function (p) {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "lesen-tab exam-tab" + (p.key === current ? " active" : "");
            const nr = document.createElement("span");
            nr.className = "exam-tab-nr";
            nr.textContent = p.label + " · " + p.name;
            const nm = document.createElement("span");
            nm.className = "exam-tab-topic";
            nm.textContent = exam.parts[p.key].title || "";
            tab.append(nr, nm);
            if (exam.parts[p.key].locked && !window.__sehrgutIsPremium) tab.classList.add("is-locked");
            const pts = document.createElement("span");
            pts.className = "exam-tab-pts";
            pts.hidden = true;
            tab.appendChild(pts);
            tab.addEventListener("click", function () { go(p.key); });
            tabs.appendChild(tab);
        });
        detail.appendChild(tabs);

        if (examListener) window.removeEventListener("sprechen-points", examListener);
        examListener = function (event) {
            if (detail.hidden || !document.body.contains(tabs)) {
                window.removeEventListener("sprechen-points", examListener);
                examListener = null;
                return;
            }
            const d = event.detail || {};
            if (d.part !== current) return;
            scores[current] = d.points;
            paintScores();
        };
        window.addEventListener("sprechen-points", examListener);

        const stack = document.createElement("div");
        stack.id = "sprechen-stack";
        detail.appendChild(stack);
        const next = document.createElement("div");
        next.className = "exam-next";
        detail.appendChild(next);
        const summary = document.createElement("div");
        summary.className = "exam-summary";
        summary.hidden = true;
        detail.appendChild(summary);

        function paintScores() {
            Array.from(tabs.children).forEach(function (tab, i) {
                const key = PARTS[i].key;
                const badge = tab.querySelector(".exam-tab-pts");
                if (scores[key] === undefined) { badge.hidden = true; return; }
                badge.hidden = false;
                badge.textContent = fmtPts(scores[key]) + "/" + EXAM_MAX;
            });
            const done = PARTS.filter(function (p) { return scores[p.key] !== undefined; });
            summary.hidden = !done.length;
            if (!done.length) return;
            const total = done.reduce(function (a, p) { return a + scores[p.key]; }, 0);
            const max = PARTS.length * EXAM_MAX;
            const need = Math.ceil(max * 0.6);
            summary.textContent = "";
            summary.dataset.tone = done.length < PARTS.length ? "" : (total >= need ? "good" : "bad");
            const head = document.createElement("div");
            head.className = "exam-summary-head";
            const t = document.createElement("span");
            t.textContent = "Ergebnis · النتيجة";
            const big = document.createElement("b");
            big.textContent = fmtPts(total) + " / " + max;
            head.append(t, big);
            summary.appendChild(head);
            const rows = document.createElement("div");
            rows.className = "exam-summary-rows";
            PARTS.forEach(function (p) {
                const r = document.createElement("div");
                r.className = "exam-summary-row" + (scores[p.key] === undefined ? " is-open" : "");
                const a = document.createElement("span");
                a.textContent = p.label + " · " + p.name;
                const track = document.createElement("span");
                track.className = "exam-summary-track";
                const fill = document.createElement("span");
                fill.style.width = scores[p.key] === undefined ? "0" : (scores[p.key] / EXAM_MAX * 100) + "%";
                track.appendChild(fill);
                const v = document.createElement("b");
                v.textContent = (scores[p.key] === undefined ? "—" : fmtPts(scores[p.key])) + " / " + EXAM_MAX;
                r.append(a, track, v);
                rows.appendChild(r);
            });
            summary.appendChild(rows);
            const note = document.createElement("p");
            note.className = "exam-summary-note";
            note.textContent = done.length < PARTS.length
                ? "باقي " + (PARTS.length - done.length) + " ديال الأجزاء. سالي المحاكاة ديال كل جزء باش تبان النتيجة الكاملة."
                : (total >= need
                    ? "🎉 مزيان! جبتي " + Math.round(total / max * 100) + "٪ — خاصك على الأقل 60٪ (" + need + " نقطة)."
                    : "باقي شوية: جبتي " + Math.round(total / max * 100) + "٪ — خاصك على الأقل 60٪ (" + need + " نقطة).");
            summary.appendChild(note);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        paint();

        function go(key) {
            current = key;
            Array.from(tabs.children).forEach(function (tab, i) {
                tab.classList.toggle("active", PARTS[i].key === current);
            });
            history.replaceState({ pruefung: n, teil: current }, "", examUrl(n, current));
            paint();
            tabs.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        function paint() {
            const topic = exam.parts[current];
            stack.textContent = "";
            if (topic.locked && !window.__sehrgutIsPremium) {
                if (typeof window.__premiumGate === "function") {
                    window.__premiumGate(stack, { title: topic.title, lead: "كاع مواضيع Sprechen كيتفتحو مع الاشتراك: تمرين بالصوت، حوار نموذجي وكلمات بالترجمة." });
                } else {
                    const box = document.createElement("div");
                    box.className = "lesen-empty";
                    box.textContent = "🔒 هاد الموضوع ديال Premium.";
                    stack.appendChild(box);
                }
            } else if (needsPremiumLoad(topic)) {
                const wait = waitBox(stack);
                const asked = current;
                premiumLoad(topic.id).then(function (r) {
                    if (stale() || !stack.isConnected || current !== asked) return;
                    if (r && r.ok) paint();
                    else { if (r && r.why) console.warn("Sprechen premium:", r.why); wait.textContent = "⚠️ ما قدرناش نجيبو الموضوع. شوف الأنترنت وعاود المحاولة."; }
                });
            } else if (typeof window.__sprechenRender === "function") {
                const content = CONTENT[topic.id] || {};
                window.__sprechenRender(stack, current, content[current], topic.id);
            }

            next.textContent = "";
            const at = PARTS.findIndex(function (p) { return p.key === current; });
            const after = PARTS[at + 1];
            const b = document.createElement("button");
            b.type = "button";
            b.className = "exam-next-btn";
            if (after) {
                b.textContent = "الجزء اللي من بعد: " + after.label + " · " + after.name + " ←";
                b.addEventListener("click", function () { go(after.key); });
            } else {
                b.textContent = "✓ ساليتي الامتحان — رجع للائحة";
                b.addEventListener("click", function () { close(true); });
            }
            next.appendChild(b);
        }
    }

    /* ================= التمرين ================= */

    function pageUrl(themaId, part) {
        const params = new URLSearchParams();
        if (themaId) params.set("thema", themaId);
        if (part) params.set("teil", part);
        const query = params.toString();
        return location.pathname + (query ? "?" + query : "");
    }

    function open(themaId, part, push) {
        const topic = topics.find(function (t) { return t.id === themaId; });
        if (!topic) { close(push); return; }

        if (push) dePush({ thema: themaId, teil: part }, "", pageUrl(themaId, part));

        if (heroEl) heroEl.hidden = true;
        if (tabsNav) tabsNav.hidden = true;
        if (toolbar) toolbar.hidden = true;
        if (countEl) countEl.hidden = true;
        grid.hidden = true;
        detail.hidden = false;

        detail.textContent = "";

        const head = document.createElement("div");
        head.className = "lesen-detail-head";

        const back = document.createElement("button");
        back.type = "button";
        back.className = "lesen-back";
        back.textContent = "← اللائحة";
        back.addEventListener("click", function () { close(true); });
        head.appendChild(back);

        /* بلا عنوان كبير ولا Telc B1/B2: العنوان والنسخ (الأساسي / المعدل)
           كيبانو مباشرة ف التمرين (html.is-topic-focus). «إرسال ملاحظة»
           كيتزاد هنا من assets/report.js. */
        head.dataset.reportTitle = topic.title || topic.id;
        detail.appendChild(head);
        document.documentElement.classList.add("is-topic-focus");

        let content = CONTENT[themaId] || {};
        const available = (topic.parts && topic.parts.length)
            ? PARTS.filter(function (p) { return topic.parts.indexOf(p.key) !== -1; })
            : PARTS;

        let current = available.some(function (p) { return p.key === part; })
            ? part
            : available[0].key;

        if (available.length > 1) {
            const tabs = document.createElement("nav");
            tabs.className = "lesen-tabs lesen-part-tabs";

            available.forEach(function (p) {
                const tab = document.createElement("button");
                tab.type = "button";
                tab.className = "lesen-tab" + (p.key === current ? " active" : "");
                const nr = document.createElement("span");
                nr.textContent = p.label;
                const nm = document.createElement("span");
                nm.className = "sp-tab-name";
                nm.textContent = p.name;
                tab.append(nr, nm);
                if (!content[p.key]) tab.classList.add("is-empty");
                tab.addEventListener("click", function () {
                    current = p.key;
                    Array.from(tabs.children).forEach(function (other, i) {
                        other.classList.toggle("active", available[i].key === current);
                    });
                    history.replaceState({ thema: themaId, teil: current }, "",
                        pageUrl(themaId, current));
                    paint();
                });
                tabs.appendChild(tab);
            });

            detail.appendChild(tabs);
        }

        const stack = document.createElement("div");
        stack.id = "sprechen-stack";
        detail.appendChild(stack);

        window.scrollTo({ top: 0, behavior: "smooth" });
        paint();

        function paint() {
            stack.textContent = "";

            if (topic.locked && !window.__sehrgutIsPremium) {
                if (typeof window.__premiumGate === "function") {
                    window.__premiumGate(stack, { title: topic.title, lead: "كاع مواضيع Sprechen كيتفتحو مع الاشتراك: تمرين بالصوت، حوار نموذجي وكلمات بالترجمة." });
                } else {
                    const box = document.createElement("div");
                    box.className = "lesen-empty";
                    box.textContent = "🔒 هاد الموضوع ديال Premium.";
                    stack.appendChild(box);
                }
                return;
            }

            if (needsPremiumLoad(topic)) {
                const wait = waitBox(stack);
                const asked = current;
                premiumLoad(themaId).then(function (r) {
                    if (stale() || !stack.isConnected || current !== asked) return;
                    if (r && r.ok) { content = CONTENT[themaId]; paint(); }
                    else { if (r && r.why) console.warn("Sprechen premium:", r.why); wait.textContent = "⚠️ ما قدرناش نجيبو الموضوع. شوف الأنترنت وعاود المحاولة."; }
                });
                return;
            }

            if (typeof window.__sprechenRender === "function") {
                window.__sprechenRender(stack, current, content[current], themaId);
            }
        }
    }

    function close(push) {
        document.documentElement.classList.remove("is-topic-focus");
        if (push) dePush({}, "", pageUrl("", activePart));
        detail.hidden = true;
        detail.textContent = "";
        if (heroEl) heroEl.hidden = false;
        if (tabsNav) tabsNav.hidden = false;
        if (toolbar) toolbar.hidden = false;
        if (countEl) countEl.hidden = false;
        grid.hidden = false;
    }

    /* ================= التبويبات ديال فوق ================= */

    function setPart(part, push) {
        activePart = part || "";
        if (tabsNav) {
            Array.from(tabsNav.querySelectorAll(".lesen-tab")).forEach(function (tab) {
                tab.classList.toggle("active", (tab.dataset.teil || "") === activePart);
            });
        }
        if (push) dePush({ teil: activePart }, "", pageUrl("", activePart));
        renderList();
    }

    if (tabsNav) {
        Array.from(tabsNav.querySelectorAll(".lesen-tab")).forEach(function (tab) {
            tab.addEventListener("click", function (event) {
                event.preventDefault();
                setPart(tab.dataset.teil || "", true);
            });
        });
    }

    /* زر الرجوع ديال الـ navigateur */
    const myPage = location.pathname;
    window.addEventListener("popstate", function () {
        if (stale()) return;
        /* رجعنا لصفحة أخرى (Lesen…): الراوتر هو اللي كيتكلف */
        if (location.pathname !== myPage) return;
        const backY = history.state && typeof history.state.deY === "number" ? history.state.deY : 0;
        const params = new URLSearchParams(location.search);
        const thema = params.get("thema");
        const exam = parseInt(params.get("pruefung"), 10);
        if (exam) { openExam(exam, params.get("teil") || "teil1", false); return; }
        if (thema) { open(thema, params.get("teil") || "teil1", false); return; }
        close(false);
        setPart(params.get("teil") || (examTab ? "" : "teil1"), false);
        /* رجع للائحة: نفس البلاصة اللي كان فيها */
        window.scrollTo(0, backY);
    }, scope);

    if (search) search.addEventListener("input", renderList);
    if (sortBtn) {
        sortBtn.addEventListener("click", function () {
            sortIndex = (sortIndex + 1) % SORTS.length;
            const label = sortBtn.querySelector(".label");
            if (label) label.textContent = SORTS[sortIndex].label;
            renderList();
        });
    }

    /* صفحة بلا تبويب Prüfungen (B2 دابا) ماعندها امتحانات كاملة،
       ف العداد كيحسب المواضيع عوض الامتحانات — وإلا كيبان "0". */
    const examTab = !tabsNav || !!tabsNav.querySelector('.lesen-tab[data-teil=""]');
    if (totalEl) {
        totalEl.textContent = String(examTab ? examList().length : topics.length);
    }

    /* حالة الاشتراك كتوصل من الهيدر من بعد ما يجاوب Firebase. */
    document.addEventListener("de-premium", function () {
        if (stale()) return;
        renderList();
        if (detail.hidden) return;
        const params = new URLSearchParams(location.search);
        const thema = params.get("thema");
        const exam = parseInt(params.get("pruefung"), 10);
        if (exam) openExam(exam, params.get("teil") || "teil1", false);
        else if (thema) open(thema, params.get("teil") || "teil1", false);
    }, scope);

    /* الرابط جا فيه موضوع؟ نحلوه دغيا. */
    const startParams = new URLSearchParams(location.search);
    const startThema = startParams.get("thema");
    /* صفحة بلا تبويب Prüfungen كتبدا من أول جزء. */
    const startTeil = startParams.get("teil") || (examTab ? "" : "teil1");

    const startExam = parseInt(startParams.get("pruefung"), 10);

    if (startExam) {
        setPart("", false);
        openExam(startExam, startTeil || "teil1", false);
    } else if (startThema) {
        setPart(PART_LABEL[startTeil] ? startTeil : "", false);
        open(startThema, startTeil || "teil1", false);
    } else {
        setPart(PART_LABEL[startTeil] ? startTeil : "", false);
    }
})();
