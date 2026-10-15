/* ===== شبكة المواضيع + التمرين فنفس الصفحة =====

   الصفحة عندها حالتين:
     - اللائحة: بحث، ترتيب، وبطائق.
     - التمرين: كيعوض اللائحة فنفس الصفحة، مع زر رجوع.

   ماكاينش تنقل لصفحة أخرى — غير الرابط كيتبدل (?thema=…)
   باش زر الرجوع ديال الـ navigateur والتحديث يخدمو. */

(function () {
    "use strict";

    /* ?embed=1: الصفحة داخل Modelltest (iframe) */
    const EMBEDDED = new URLSearchParams(location.search).get("embed") === "1";
    /* داخل «اختبر نفسك» / Modelltest: الصفحة الأم ديجا عارفة واش الحساب
       Premium — كناخدو الجواب ديالها دغيا بلا ما نتسناو Firebase ديال الـiframe. */
    if (EMBEDDED && window.__sehrgutIsPremium === undefined) {
        try {
            const up = window.parent !== window ? window.parent.__sehrgutIsPremium : undefined;
            if (up === true || up === false) window.__sehrgutIsPremium = up;
        } catch (error) { /* */ }
    }

    const grid = document.getElementById("lesen-grid");
    const toolbar = document.querySelector(".lesen-toolbar");
    const countEl = document.getElementById("lesen-count");
    const statEl  = document.getElementById("lesen-stat-count");
    /* الهيدر ديال القسم كامل (العنوان + العداد) والتبويبات ديال فوق —
       خاصهم يتخباو ملي يتحل التمرين، وإلا كيبقاو معلقين فوقو. */
    const heroEl = document.querySelector(".lesen-head-row")
        || document.querySelector(".lesen-hero");
    const tabsNav = document.querySelector(".lesen-shell > .lesen-tabs");
    const detail = document.getElementById("lesen-detail");
    const search = document.getElementById("lesen-search-input");
    const sortBtn = document.getElementById("lesen-sort-btn");

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

    /* ===== التنقل بين Teil 1/2/3 بلا تحميل صفحة جديدة =====

       ست الصفحات (b2-lesen، teil1…sprach2) كيحمّلو نفس الملفات
       ونفس الداتا — الفرق الوحيد بيناتهم هو data-teil. إذن ماكاين
       حتى سبب باش نعاودو نحمّلو كلشي من الصفر: كنبدلو غير الفلتر
       والرابط، والبار ديال فوق ما كتهزّ حتى.

       الصفحات بوحدهم كيبقاو خدامين ديريكت (رابط محفوظ، بحث Google…)
       — غير البركة من داخل الموقع هي اللي ولات فورية. */

    const SHELL = document.querySelector(".lesen-shell");

    /* المستوى ديال الصفحة: <main class="lesen-shell" data-level="b1">.
       نفس الكود كيخدم B1 و B2 — غير الداتا والأسماء كيتبدلو. */
    const LEVEL = (SHELL && SHELL.dataset.level) || "b2";
    const LV = LEVEL.toUpperCase();

    /* المواضيع المجانية كيجيو من Cloudflare (assets/lesen-free.js) */
    function freeLoaded() {
        const c = window["LESEN_" + LV + "_CONTENT"];
        return !!(c && Object.keys(c).length);
    }
    function freeWait() {
        return typeof window.__lesenFreeReady === "function"
            ? window.__lesenFreeReady(LEVEL)
            : Promise.resolve();
    }
    function freeLoading(box) {
        /* هيكل رمادي بلاصة «كنجيبو…» (diag.js) */
        const wait = window.__deSkeleton ? window.__deSkeleton("topic") : document.createElement("div");
        box.appendChild(wait);
        watchLoading(wait, "مجاني");
    }
    /* «كنجيبو…» باقي باين من بعد 10 ثواني = الطالب كيشوف صفحة خاوية:
       كنسجلوها ف «مشاكل الطلبة» (assets/diag.js) */
    function watchLoading(node, kind) {
        const t0 = Date.now();
        if (window.__deNetHint) window.__deNetHint(node);
        setTimeout(function () {
            if (node.isConnected && window.__deDiag) {
                const p = new URLSearchParams(location.search);
                window.__deDiag("slow", "Lesen " + kind + ": الموضوع باقي كيتحمل من بعد 10s [" +
                    (p.get("thema") || p.get("pruefung") || "?") + " " + (p.get("teil") || pagePart || "") + "]",
                    { ms: Date.now() - t0 });
            }
        }, 10000);
    }

    /* الرأس ديال كل جزء: العنوان والسطر الصغير تحتيه. */
    const HEADS = {
        "":        { h1: "Leseverstehen",     lead: "امتحانات كاملة — كل امتحان فيه الأجزاء الخمسة ديال Lesen.",
                     title: "Telc B2 Lesen – Übungen mit Lösungen | sehrgut" },
        "teil1":   { h1: "Teil 1",            lead: "Überschriften zuordnen",
                     title: "Telc B2 Lesen Teil 1 – Übungen online | sehrgut" },
        "teil2":   { h1: "Teil 2",            lead: "Multiple Choice",
                     title: "Telc B2 Lesen Teil 2 – Übungen online | sehrgut" },
        "teil3":   { h1: "Teil 3",            lead: "Anzeigen zuordnen",
                     title: "Telc B2 Lesen Teil 3 – Übungen online | sehrgut" },
        "sprach1": { h1: "Sprachbausteine 1", lead: "Grammatik im Text",
                     title: "Telc B2 Sprachbausteine Teil 1 – Übungen | sehrgut" },
        "sprach2": { h1: "Sprachbausteine 2", lead: "Wortschatz im Text",
                     title: "Telc B2 Sprachbausteine Teil 2 – Übungen | sehrgut" }
    };

    /* صفحة Prüfungen (امتحانات كاملة) مخبية دابا — الكود باقي.
       باش ترجعها: ردّ هادي true وحيد القاعدة ديالها من section.css. */
    const SHOW_EXAMS = false;

    /* b2-lesen-teil2.html → "teil2" · b2-lesen.html → "" */
    function partOfFile(name) {
        const match = new RegExp(LEVEL + "-lesen-(teil[123]|sprach[12])\\.html$").exec(name || "");
        if (match) return match[1];
        return new RegExp(LEVEL + "-lesen\\.html$").test(name || "") ? "" : null;
    }

    function paintHead(part) {
        const head = HEADS[part];
        if (!head) return;
        head.title = head.title.replace("B2", LV);
        const h1 = SHELL && SHELL.querySelector(".lesen-hero h1");
        const lead = SHELL && SHELL.querySelector(".lesen-hero .lead");
        if (h1) h1.textContent = head.h1;
        if (lead) lead.textContent = head.lead;
        document.title = head.title;
    }

    /* كنبدلو الجزء فنفس الصفحة: الفلتر، الرابط، الرأس، واللائحة. */
    function switchPart(part, href, push) {
        pagePart = part;
        grid.dataset.teil = part;

        if (tabsNav) {
            Array.prototype.forEach.call(tabsNav.querySelectorAll("a.lesen-tab"), function (tab) {
                const mine = partOfFile(tab.getAttribute("href")) === part;
                tab.classList.toggle("active", mine);
                if (mine) tab.setAttribute("aria-current", "page");
                else tab.removeAttribute("aria-current");
            });
        }

        if (push) dePush({ teil: part }, "", href);
        paintHead(part);
        renderList(true);
    }

    if (SHELL && tabsNav) {
        tabsNav.addEventListener("click", function (event) {
            const tab = event.target.closest("a.lesen-tab");
            if (!tab || tab.classList.contains("active")) return;
            if (event.defaultPrevented || event.button
                || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const part = partOfFile(tab.getAttribute("href"));
            /* تبويب ماشي ديال Lesen؟ نخليوه يمشي عادي. */
            if (part === null) return;

            event.preventDefault();

            const still = window.matchMedia
                && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            /* التبديل ف اللحظة، بلا ما يغمض المحتوى (الصفحة ثابتة) */
            switchPart(part, tab.href, true);
            if (still) return;
            /* اللائحة الجديدة كتبدا من فوق */
            const tabsTop = tabsNav.getBoundingClientRect().top + window.scrollY;
            const barH = parseInt(
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--site-header-h"), 10) || 72;
            if (window.scrollY > tabsTop - barH) {
                window.scrollTo({ top: Math.max(0, tabsTop - barH) });
            }
        });
    }



    const PARTS = [
        { key: "teil1",   label: "Teil 1" },
        { key: "teil2",   label: "Teil 2" },
        { key: "teil3",   label: "Teil 3" },
        { key: "sprach1", label: "Sprach 1" },
        { key: "sprach2", label: "Sprach 2" }
    ];
    /* السمية الكاملة بالألمانية (زر «الجزء الجاي» فالامتحان) */
    const PART_DE = {
        teil1: "Lesen Teil 1", teil2: "Lesen Teil 2", teil3: "Lesen Teil 3",
        sprach1: "Sprachbausteine Teil 1", sprach2: "Sprachbausteine Teil 2"
    };
    const PART_LABEL = {};
    PARTS.forEach(function (p) { PART_LABEL[p.key] = p.label; });

    /* الجزء ديال هاد الصفحة: teil1 مثلا. فارغ = صفحة Prüfungen.
       كيتبدل ملي تبرك على تبويب آخر — بلا ما تتحمل صفحة جديدة. */
    let pagePart = grid.dataset.teil || "";

    const topics = Array.isArray(window["LESEN_" + LV + "_TOPICS"])
        ? window["LESEN_" + LV + "_TOPICS"].slice()
        : [];

    const SORTS = [
        { key: "default", label: "ترتيب" },
        { key: "alpha", label: "أبجدي" },
        { key: "free", label: "المجاني أولا" }
    ];
    let sortIndex = 0;

    /* ================= اللائحة ================= */

    function listed() {
        const term = (search ? search.value : "").trim().toLowerCase();

        let list = topics.filter(function (topic) {
            /* صفحة جزء معيّن كتبين غير المواضيع اللي فيهم داك الجزء */
            if (pagePart) {
                const parts = topic.parts || [];
                if (parts.length && parts.indexOf(pagePart) === -1) return false;
                /* المحتوى ديال هاد الجزء ماكاينش (KV): ما كنبينوش البطاقة */
                if (topic.locked && window.__deMissing && window.__deMissing.has("lesen:" + topic.id + "|" + pagePart)) return false;
            }
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

    /* الحركة ديال البطائق كتبان ملي تحل اللائحة ولا تبدل الترتيب،
       ماشي مع كل حرف كيتكتب ف البحث. */
    /* المشترك: المواضيع المقفولة ديال هاد الجزء كيتجابو ف الخفا من Cloudflare
       (assets/lesen-premium.js)، باش ملي يبرك على موضوع يبان دغيا. Firebase
       ما زال ما عرفش الحساب؟ كنعاودو ملي يجي de-premium. */
    /* site-header.js كيتسنى هادي باش يحمل Firestore (ثقيل) من بعد المحتوى */
    let contentSignaled = false;
    function contentShown() {
        if (contentSignaled) return;
        contentSignaled = true;
        document.dispatchEvent(new CustomEvent("de-content"));
    }

    function prefetch(list) {
        if (EMBEDDED || typeof window.__lesenPremiumPrefetch !== "function") return;
        const ids = list.filter(function (t) { return t.locked; }).map(function (t) { return t.id; });
        const go = function () { window.__lesenPremiumPrefetch(ids); };
        if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 2000 }); else setTimeout(go, 600);
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

    function renderList(animate) {
        /* صفحة Prüfungen: امتحانات كاملة، ماشي مواضيع */
        if (!pagePart) { renderExams(animate); return; }
        const list = listed();
        clearGrid();
        prefetch(list);
        /* صفحة اللائحة بلا موضوع محلول: المحتوى هو اللائحة */
        if (!new URLSearchParams(location.search).get("thema")) contentShown();

        if (countEl) countEl.textContent = list.length ? list.length + " موضوع" : "";
        /* الرقم ديال فوق كيتبع التبويب الحالي، ماشي رقم ثابت. */
        if (statEl) statEl.textContent = String(list.length);

        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "lesen-empty";
            /* فرق مهم: "ماكاين حتى موضوع بهاد الاسم" كتقال غير ملي
               كاين بحث. إلا كان الجزء خاوي أصلا (Teil 2، Sprach 1/2
               ما زال ماكاينش فيهم نماذج)، الطالب خاصو يفهم بلي هاد
               القسم كنوجدوه، ماشي بلي البحث ديالو خايب. */
            const searching = (search ? search.value : "").trim() !== "";
            empty.textContent = searching
                ? "ماكاين حتى موضوع بهاد الاسم."
                : "ما زال ماكاينش نماذج ف هاد الجزء. قريبا 🙏";
            grid.appendChild(empty);
            return;
        }

        grid.classList.remove("lt-enter");
        if (animate) void grid.offsetWidth;

        list.forEach(function (topic, i) {
            const node = card(topic);
            /* رقم لكل بطاقة باش يطلعو وحدة من بعد وحدة */
            node.style.setProperty("--lt-i", Math.min(i, 14));
            grid.appendChild(node);
        });

        if (animate) grid.classList.add("lt-enter");
    }

    function card(topic) {
        /* المشترك عندو گاع المواضيع — ماعندوش علاش يشوف PRO */
        const shut = topic.locked && !window.__sehrgutIsPremium;

        const node = document.createElement("a");
        node.className = "lesen-card" + (shut ? " locked" : "");
        node.href = pageUrl(topic.id, pagePart);

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
        foot.appendChild(chip("lesen-chip-level", topic.level || LV));

        const parts = topic.parts || [];
        const shownPart = pagePart || parts[0];
        if (shownPart) {
            foot.appendChild(chip("lesen-chip-parts", "Lesen " + (PART_LABEL[shownPart] || shownPart)));
        }
        if (!pagePart && parts.length > 1) {
            foot.appendChild(chip("lesen-chip-parts", "+" + parts.length));
        }

        /* عدد النسخ (الأساسي + المعدل…) */
        if (topic.variants > 1) foot.appendChild(chip("lesen-chip-parts", topic.variants + " تعديلات"));

        /* المجاني خاصو يبان — هو اللي كيخلي الطالب يجرب */
        if (!topic.locked) foot.appendChild(chip("lesen-chip-free", "مجاني"));

        const go = document.createElement("span");
        go.className = "lesen-card-go";
        go.textContent = shut ? "🔒" : "›";
        go.setAttribute("aria-hidden", "true");
        foot.appendChild(go);

        node.appendChild(foot);

        if (topic.locked) warmOnIntent(node, function () { return [topic.id]; });

        node.addEventListener("click", function (event) {
            /* فتح ف تبويب جديد خاصو يبقى خدام عادي */
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            event.preventDefault();
            open(topic.id, pagePart || parts[0] || "teil1", true);
        });

        return node;
    }

    /* كنبداو نجيبو المحتوى المدفوع قبل ما المستعمل يبرك: hover (120ms باش
       ما نجيبوش كل بطاقة غادي فيها الماوس) ولا أول لمسة ف التيليفون.
       الضغطة كتجي من بعد بـ 80-150ms، والطلب ديجا ماشي. ما كيدير والو
       لغير المشترك، وما كيبان ليه حتى خطأ. */
    function warmOnIntent(node, ids) {
        if (typeof window.__lesenPremiumWarm !== "function") return;
        let timer = 0;
        const go = function () {
            ids().forEach(function (id) { window.__lesenPremiumWarm(id); });
        };
        node.addEventListener("pointerdown", go, { passive: true });
        node.addEventListener("pointerenter", function (event) {
            if (event.pointerType === "mouse") timer = setTimeout(go, 120);
        }, { passive: true });
        node.addEventListener("pointerleave", function () { clearTimeout(timer); }, { passive: true });
    }

    function chip(className, text) {
        const node = document.createElement("span");
        node.className = "lesen-chip " + className;
        node.textContent = text;
        return node;
    }

    /* ================= رسم جزء واحد ديال موضوع =================
       كيتستعمل فالتمرين العادي وفالـPrüfung الكاملة.
       stillWanted(): واش المستخدم باقي فنفس الجزء (المحتوى المدفوع
       كيوصل من بعد، وممكن يكون بدّل الجزء فهاد الوقت). */
    function renderPart(stack, topic, part, stillWanted) {
        stack.textContent = "";
        const themaId = topic.id;
        if (!topic.locked && !freeLoaded()) {
            freeLoading(stack);
            freeWait().then(function () {
                if (freeLoaded() && stillWanted()) renderPart(stack, topic, part, stillWanted);
                else if (stillWanted()) { stack.textContent = ""; const e = document.createElement("div"); e.className = "lesen-empty"; e.textContent = "ما قدرناش نجيبو التمرين. شوف الأنترنت وعاود."; stack.appendChild(e); }
            });
            return;
        }
        const content = (window["LESEN_" + LV + "_CONTENT"] || {})[themaId] || {};

        /* المواضيع المدفوعة ماكايناش نصوصهم فهاد الملف. كيتجابو من
           الـ Worker، اللي كيتحقق من الـ ID token ومن الاشتراك قبل
           ما يعطي حتى كلمة. */
        if (topic.locked) {
            /* داخل «اختبر نفسك» / Modelltest: حتى يجي الجواب ديال الاشتراك
               كنبينو «كنجيبو…» بدل القفل (de-premium كيعاود الرسم). */
            if (window.__sehrgutIsPremium === undefined && EMBEDDED && !embedForce) {
                const wait = window.__deSkeleton ? window.__deSkeleton("topic") : document.createElement("div");
                stack.appendChild(wait);
                if (window.__deNetHint) window.__deNetHint(wait);
                /* Firebase تعطل؟ من بعد 6 ثواني كنسولو الـ Worker نيشان —
                   هو اللي كيتحقق من الحساب والاشتراك على كل حال. */
                setTimeout(function () {
                    if (window.__sehrgutIsPremium !== undefined || !stillWanted()) return;
                    embedForce = true;
                    renderPart(stack, topic, part, stillWanted);
                }, 6000);
                return;
            }
            if (!window.__sehrgutIsPremium && !embedForce) { gate(); return; }

            const loading = window.__deSkeleton ? window.__deSkeleton("topic") : document.createElement("div");
            stack.appendChild(loading);
            watchLoading(loading, "Premium");

            const fetchPart = typeof window.__lesenPremiumFetch === "function"
                ? window.__lesenPremiumFetch
                : function () { return null; };

            /* كل موضوع عندو مفتاح KV واحد (lesen-<id>). جزء اللي ماكاينش
               فيه كيتقلب عليه فمفتاح بوحدو: lesen-<id>-<part> — هاكا
               زيادة جزء جديد ماكتحتاجش تبدل المفاتيح القدام. */
            Promise.resolve(fetchPart(themaId)).then(function (result) {
                if (result && result.ok && (result.data || {})[part]) return result;
                return Promise.resolve(fetchPart(themaId + "-" + part)).then(function (own) {
                    return own && own.ok ? own : result;
                });
            }).then(function (result) {
                /* بدّل الجزء ولا خرج من التمرين وهو كيجيب؟ نحبسو. */
                if (!stillWanted()) return;
                stack.textContent = "";

                const remote = result && result.ok
                    ? (result.data || {})[part]
                    : null;

                /* مشترك وما وصلوش المحتوى = كاين شي حاجة خايبة،
                   خاصو يعرف شنو هي بدل ما يشوف غير القفل. */
                if (!remote) {
                    /* الـ Worker جاوب ولكن هاد الجزء ماكاينش ف KV (404 ولا ناقص
                       ف المفتاح): «كنوجدوه»، ماشي «الأنترنت» */
                    const missing = result && (result.ok || result.status === 404 || result.status >= 500);
                    /* كنتفكرو: اللائحة ما كتبينوش من دابا (diag.js __deMissing) */
                    if (missing && window.__deMissing) window.__deMissing.add("lesen:" + themaId + "|" + part);
                    gate(result && result.why
                        ? result.why
                        : "ما لقيناش هاد الموضوع فالمحتوى المدفوع.", missing ? themaId + " " + part : "");
                    return;
                }
                if (window.__deMissing) window.__deMissing.del("lesen:" + themaId + "|" + part);
                draw(remote);
            });
            return;
        }

        const task = content[part];

        if (!task) {
            const box = document.createElement("div");
            box.className = "lesen-empty";
            box.textContent = "ما زال ماكاينش تمارين ف هاد الجزء.";
            stack.appendChild(box);
            return;
        }

        draw(task);

        function gate(why, missingKey) {
            stack.textContent = "";
            if (typeof window.__premiumGate === "function") {
                window.__premiumGate(stack, { title: topic.title, note: why, missing: !!missingKey, key: missingKey });
            } else {
                const box = document.createElement("div");
                box.className = "lesen-empty";
                box.textContent = "🔒 هاد الموضوع ديال Premium.";
                stack.appendChild(box);
            }
        }

        function draw(task) {
            contentShown();
            const RENDER = {
                matching: window.__lesenTeil1Render,   /* Teil 1: ترويسات */
                mc:       window.__lesenTeil2Render,   /* Teil 2: A/B/C */
                bank:     window.__lesenSprach2Render, /* Sprach 2: 15 كلمة */
                gaps:     window.__lesenSprachRender,  /* Sprach 1: فراغات */
                ads:      window.__lesenTeil3Render    /* Teil 3: إعلانات */
            };
            const fn = RENDER[task.kind];
            if (typeof fn === "function") { fn(stack, task, { level: LV.toLowerCase(), id: themaId }); return; }

            window.LESEN_TOPICS = [Object.assign({ id: themaId + "-" + part }, task)];
            if (typeof window.__lesenRenderInto === "function") {
                window.__lesenRenderInto(stack);
            }
        }
    }

    /* ================= Prüfungen: امتحان كامل =================
       Prüfung n = الموضوع رقم n من كل جزء (Teil 1، 2، 3، Sprach 1، 2).
       عدد الامتحانات = عدد المواضيع ديال الجزء اللي فيه أقل. */
    function examList() {
        const lists = PARTS.map(function (p) {
            return topics.filter(function (t) { return (t.parts || []).indexOf(p.key) !== -1; });
        });
        const count = Math.min.apply(null, lists.map(function (l) { return l.length; }));
        const out = [];
        for (let i = 0; i < count; i++) {
            const parts = {};
            PARTS.forEach(function (p, j) { parts[p.key] = lists[j][i]; });
            out.push({
                n: i + 1,
                parts: parts,
                locked: PARTS.some(function (p) { return parts[p.key].locked; })
            });
        }
        return out;
    }

    /* «اختبر نفسك» (modelltest.html): امتحان مخلط — كل جزء من موضوع
       مختلف. ?pruefung=mix&mix=<teil1>,<teil2>,<teil3>,<sprach1>,<sprach2> */
    function mixIds() {
        return (new URLSearchParams(location.search).get("mix") || "").split(",");
    }
    function examFor(n) {
        if (n !== "mix") return examList()[n - 1];
        const ids = mixIds(), parts = {};
        let ok = true;
        PARTS.forEach(function (p, i) {
            const t = topics.find(function (x) { return x.id === ids[i]; });
            if (!t || (t.parts || []).indexOf(p.key) === -1) ok = false;
            parts[p.key] = t;
        });
        return ok ? { n: "mix", parts: parts, locked: PARTS.some(function (p) { return parts[p.key].locked; }) } : null;
    }
    function examParam(params) {
        const raw = params.get("pruefung");
        return raw === "mix" ? "mix" : parseInt(raw, 10);
    }

    function renderExams(animate) {
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
        if (statEl) statEl.textContent = String(list.length);

        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "lesen-empty";
            empty.textContent = examList().length
                ? "ماكاين حتى امتحان بهاد الاسم."
                : "الامتحانات الكاملة غادي يتزادو ملي يكونو Teil 1، 2، 3 و Sprach 1، 2 واجدين. دابا تقدر تتمرن جزء بجزء 🙏";
            grid.appendChild(empty);
            return;
        }

        grid.classList.remove("lt-enter");
        if (animate) void grid.offsetWidth;
        list.forEach(function (exam, i) {
            const node = examCard(exam);
            node.style.setProperty("--lt-i", Math.min(i, 14));
            grid.appendChild(node);
        });
        if (animate) grid.classList.add("lt-enter");
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
        foot.appendChild(chip("lesen-chip-level", LV));
        foot.appendChild(chip("lesen-chip-parts", PARTS.length + " Teile"));
        if (!exam.locked) foot.appendChild(chip("lesen-chip-free", "مجاني"));
        const go = document.createElement("span");
        go.className = "lesen-card-go";
        go.textContent = shut ? "🔒" : "›";
        go.setAttribute("aria-hidden", "true");
        foot.appendChild(go);
        node.appendChild(foot);

        /* الامتحان كيحل Teil 1 الأول، ولكن كيعرض كاع الأجزاء: كنجيبو
           المواضيع المقفولين ديالو (كل واحد ف طلب، بالتوازي). */
        if (exam.locked) {
            warmOnIntent(node, function () {
                return PARTS.map(function (p) { return exam.parts[p.key]; })
                    .filter(function (t) { return t && t.locked; })
                    .map(function (t) { return t.id; });
            });
        }

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
        if (n === "mix") params.set("mix", mixIds().join(","));
        if (part) params.set("teil", part);
        return location.pathname + "?" + params.toString();
    }

    /* النقط ديال الامتحان المحلول دابا (كيتجمعو من الحدث lesen-points) */
    let examListener = null;
    const EXAM_MAX = { teil1: 25, teil2: 25, teil3: 25, sprach1: 15, sprach2: 15 };

    function fmtPts(n) {
        return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
    }

    /* البار ديال فوق ديال الامتحان (كيتزاد لـbody) والساعة ديالو */
    let examTop = null, examClock = null, examTopSize = null;
    function dropExamTop() {
        if (examClock) { clearInterval(examClock); examClock = null; }
        if (examTopSize) { examTopSize.disconnect(); examTopSize = null; }
        if (examTop) { examTop.remove(); examTop = null; }
        document.documentElement.classList.remove("is-exam-focus");
    }

    let embedForce = false;

    /* حالة الاشتراك اللي ترسم بيها الامتحان/الموضوع: إلا جا de-premium
       بنفس القيمة، ماكنعاودوش الرسم — كان كيمسح الأجوبة ويرجع لـ Teil 1. */
    let renderedPremium, renderedState;

    function openExam(n, part, push) {
        renderedPremium = window.__sehrgutIsPremium;
        renderedState = window.__dePremiumState;
        const exam = examFor(n);
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

        /* ---- البار الصغير ديال فوق (بحال Zertify) ----
           فالامتحان كنخبيو الهيدر الكبير و Telc B1/B2 (html.is-exam-focus)
           وكنحطو بار واحد رقيق: ← · B2 PRÜFUNG n · عنوان الجزء ·
           LESEN Teil 1 … SPRACHBAUSTEINE Teil 2 · الوقت (90 دقيقة). */
        dropExamTop();
        const top = document.createElement("div");
        top.className = "exam-top";
        const topIn = document.createElement("div");
        topIn.className = "exam-top-inner";
        top.appendChild(topIn);

        const back = document.createElement("button");
        back.type = "button";
        back.className = "exam-top-back";
        back.setAttribute("aria-label", "رجوع للائحة");
        back.title = "رجوع للائحة";
        back.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" '
            + 'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            + '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>';
        back.addEventListener("click", function () { close(true); });

        const meta = document.createElement("div");
        meta.className = "exam-top-meta";
        const kicker = document.createElement("span");
        kicker.className = "exam-top-kicker";
        const lvl = document.createElement("b");
        lvl.className = "exam-top-level";
        lvl.textContent = LV;
        kicker.append(lvl, document.createTextNode(n === "mix" ? "اختبر نفسك" : "Prüfung " + n));
        const topTitle = document.createElement("strong");
        topTitle.className = "exam-top-title";
        meta.append(kicker, topTitle);

        const tabs = document.createElement("nav");
        tabs.className = "exam-tabs";
        tabs.setAttribute("aria-label", "الأجزاء");
        PARTS.forEach(function (p) {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.className = "exam-tab" + (p.key === current ? " active" : "");
            tab.title = exam.parts[p.key].title || "";
            const full = PART_DE[p.key];                     /* "Sprachbausteine Teil 1" */
            const kind = document.createElement("span");
            kind.className = "exam-tab-kind";
            kind.textContent = full.replace(/ Teil \d$/, "");
            kind.dataset.short = kind.textContent === "Sprachbausteine" ? "Sprachb." : kind.textContent;
            const nr = document.createElement("span");
            nr.className = "exam-tab-nr";
            nr.textContent = full.slice(full.lastIndexOf("Teil"));
            const pts = document.createElement("span");
            pts.className = "exam-tab-pts";
            pts.textContent = EXAM_MAX[p.key] + "P";
            tab.append(kind, nr, pts);
            if (exam.parts[p.key].locked && !window.__sehrgutIsPremium) tab.classList.add("is-locked");
            tab.addEventListener("click", function () { go(p.key); });
            tabs.appendChild(tab);
        });

        /* الوقت: 90 دقيقة ديال Lesen + Sprachbausteine بحال telc.
           كيتحفظ فـsessionStorage باش refresh مايرجعوش لـ90. */
        const clock = document.createElement("div");
        clock.className = "exam-top-clock";
        clock.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" '
            + 'stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
            + '<path d="M12 7v5l3 2"/></svg>';
        const clockText = document.createElement("span");
        clock.appendChild(clockText);

        topIn.append(back, meta, tabs, clock);
        document.body.appendChild(top);
        examTop = top;
        document.documentElement.classList.add("is-exam-focus");
        if (window.ResizeObserver) {
            examTopSize = new ResizeObserver(function () {
                document.documentElement.style.setProperty("--exam-top-h", top.offsetHeight + "px");
            });
            examTopSize.observe(top);
        }

        const TIME_KEY = "de-lesen-exam-" + LV + "-" + n;
        const LIMIT = 90 * 60 * 1000;
        let started = 0, frozen = null;
        try { started = Number(sessionStorage.getItem(TIME_KEY)) || 0; } catch (e) { /* وضع خاص */ }
        if (!started || Date.now() - started > 6 * 3600 * 1000) resetClock();
        function resetClock() {
            started = Date.now();
            frozen = null;
            try { sessionStorage.setItem(TIME_KEY, String(started)); } catch (e) { /* وضع خاص */ }
        }
        function tick() {
            const left = frozen !== null ? frozen : Math.max(0, LIMIT - (Date.now() - started));
            const sec = Math.ceil(left / 1000);
            clockText.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
            clock.classList.toggle("is-low", frozen === null && left < 5 * 60 * 1000);
            clock.classList.toggle("is-over", frozen === null && left === 0);
            clock.classList.toggle("is-done", frozen !== null);
            clock.title = frozen !== null ? "الوقت اللي بقا ليك ملي صححتي"
                : left === 0 ? "سالا الوقت ديال الامتحان (90 دقيقة)" : "الوقت اللي باقي (90 دقيقة)";
        }
        tick();
        examClock = setInterval(tick, 1000);

        if (examListener) window.removeEventListener("lesen-points", examListener);
        examListener = function (event) {
            if (detail.hidden || !document.body.contains(tabs)) {
                window.removeEventListener("lesen-points", examListener);
                examListener = null;
                return;
            }
            const d = event.detail || {};
            if (!EXAM_MAX[d.part]) return;
            scores[d.part] = d.points;
            paintScores();
        };
        window.addEventListener("lesen-points", examListener);

        /* كل جزء فالحاوية ديالو، كيتبنا مرة وحدة وكيبقى (غير كيتخبى).
           هكا الأجوبة ماكتضيعش ملي تدوز من جزء لجزء، وفالأخير
           «صحح الامتحان كامل» كيصحح الخمسة دقة وحدة. */
        const stack = document.createElement("div");
        stack.className = "exam-parts";
        detail.appendChild(stack);
        const boxes = {};
        let graded = false;
        PARTS.forEach(function (p) {
            const box = document.createElement("div");
            box.className = "exam-part";
            box.hidden = true;
            stack.appendChild(box);
            boxes[p.key] = box;
            renderPart(box, exam.parts[p.key], p.key, function () {
                return !detail.hidden && document.body.contains(box);
            });
        });

        /* الأزرار ديال الامتحان فالشريط الثابت تحت */
        const nav = document.createElement("div");
        nav.className = "lesen-actions exam-bar";

        const summary = document.createElement("div");
        summary.className = "exam-summary";
        summary.hidden = true;
        detail.appendChild(summary);

        window.scrollTo({ top: 0, behavior: "smooth" });
        paint();

        /* النقط فالتبويبات + بطاقة المجموع */
        function paintScores() {
            Array.from(tabs.children).forEach(function (tab, i) {
                const key = PARTS[i].key;
                const badge = tab.querySelector(".exam-tab-pts");
                if (scores[key] === undefined) {
                    badge.textContent = EXAM_MAX[key] + "P";
                    badge.classList.remove("has-score");
                    return;
                }
                badge.textContent = fmtPts(scores[key]) + "/" + EXAM_MAX[key];
                badge.classList.add("has-score");
            });

            const done = PARTS.filter(function (p) { return scores[p.key] !== undefined; });
            summary.hidden = !done.length;
            if (!done.length) return;
            const total = done.reduce(function (a, p) { return a + scores[p.key]; }, 0);
            const max = PARTS.reduce(function (a, p) { return a + EXAM_MAX[p.key]; }, 0);
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
                a.textContent = p.label;
                const track = document.createElement("span");
                track.className = "exam-summary-track";
                const fill = document.createElement("span");
                fill.style.width = scores[p.key] === undefined ? "0" : (scores[p.key] / EXAM_MAX[p.key] * 100) + "%";
                track.appendChild(fill);
                const v = document.createElement("b");
                v.textContent = (scores[p.key] === undefined ? "—" : fmtPts(scores[p.key])) + " / " + EXAM_MAX[p.key];
                r.append(a, track, v);
                rows.appendChild(r);
            });
            summary.appendChild(rows);

            const note = document.createElement("p");
            note.className = "exam-summary-note";
            note.textContent = !graded
                ? "صححتي " + done.length + " من " + PARTS.length + " ديال الأجزاء. كمل، وفالجزء الأخير «صحح الامتحان كامل» كيعطيك النتيجة كاملة."
                : done.length < PARTS.length
                ? "باقي " + (PARTS.length - done.length) + " ديال الأجزاء بلا تصحيح (مقفولين ولا ماتحملوش)."
                : (total >= need
                    ? "🎉 ناجح! جبتي " + Math.round(total / max * 100) + "٪ — خاصك على الأقل 60٪ (" + need + " نقطة)."
                    : "باقي شوية: جبتي " + Math.round(total / max * 100) + "٪ — خاصك على الأقل 60٪ (" + need + " نقطة). عاود الأجزاء الضعاف.");
            summary.appendChild(note);
        }

        function go(key) {
            current = key;
            Array.from(tabs.children).forEach(function (tab, i) {
                tab.classList.toggle("active", PARTS[i].key === current);
            });
            history.replaceState({ pruefung: n, teil: current }, "", examUrl(n, current));
            paint();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        function paint() {
            PARTS.forEach(function (p) { boxes[p.key].hidden = p.key !== current; });
            topTitle.textContent = exam.parts[current].title || "";

            /* الشريط بحال Zertify: [↻ عاود] [السابق] [Lesen Teil 2 →]
               — السمية ديال الجزء الجاي بالألمانية، و«السابق» ديما كاين
               (مطفي ف Teil 1). فالجزء الأخير: «صحح الامتحان كامل». */
            nav.textContent = "";
            const at = PARTS.findIndex(function (p) { return p.key === current; });
            const before = PARTS[at - 1];
            const after = PARTS[at + 1];

            function navButton(cls, text, dir, onClick) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "lesen-btn " + cls;
                b.textContent = text;
                b.dir = dir;
                if (onClick) b.addEventListener("click", onClick);
                nav.appendChild(b);
                return b;
            }

            /* من بعد النتيجة: الامتحان كامل من الأول (Teil 1 خاوي) */
            /* بلا رسالة ديال المتصفح: الضغطة الأولى كتسول «متأكد؟» فالزر
               نيت، والثانية (فـ4 ثواني) كتعاود — هاد الزر حدا «السابق». */
            if (graded) {
                const again = navButton("lesen-btn-retry exam-bar-again", "↻ عاود من الأول", "rtl", null);
                let armed = null;
                again.addEventListener("click", function () {
                    if (armed) { clearTimeout(armed); armed = null; restartExam(); return; }
                    again.textContent = "متأكد؟ كليكي مرة خرى";
                    again.classList.add("is-armed");
                    armed = setTimeout(function () {
                        armed = null;
                        again.textContent = "↻ عاود من الأول";
                        again.classList.remove("is-armed");
                    }, 4000);
                });
            }

            const prev = navButton("lesen-btn-show exam-bar-prev", "السابق", "rtl",
                before ? function () { go(before.key); } : null);
            prev.disabled = !before;

            if (after) {
                navButton("lesen-btn-check exam-bar-main", PART_DE[after.key] + " →", "ltr",
                    function () { go(after.key); });
            } else if (EMBEDDED) {
                /* داخل Modelltest: ماكاينش تصحيح هنا — كندوزو لـ Hören،
                   والتصحيح كامل كيكون ف اللخر (modelltest.js). */
                navButton("lesen-btn-check exam-bar-main", "Hören →", "ltr", function () {
                    window.dispatchEvent(new CustomEvent("exam-next"));
                });
            } else if (!graded) {
                navButton("lesen-btn-check exam-bar-main", "✓ صحح الامتحان كامل", "rtl", gradeAll);
            } else {
                navButton("lesen-btn-check exam-bar-main", "شوف النتيجة", "rtl", function () {
                    summary.scrollIntoView({ behavior: "smooth", block: "center" });
                });
            }

            /* قبل النتيجة: «تحقق» كيصحح غير الجزء اللي فيه.
               من بعد: «شوف الحل» ديال الجزء + «عاود الامتحان من الأول». */
            if (typeof window.__lesenBarExtra === "function") {
                window.__lesenBarExtra(nav, stack, { mode: graded ? "done" : "live" });
            }
        }

        function partButton(box, cls) {
            const inPlace = box.querySelector(".lesen-actions ." + cls);
            if (inPlace) return inPlace;
            const anchor = box.querySelector(".lesen-actions-anchor");
            return anchor && anchor.__actions
                ? anchor.__actions.querySelector("." + cls) : null;
        }
        function checkButton(box) { return partButton(box, "lesen-btn-check"); }

        function restartExam() {
            PARTS.forEach(function (p) {
                const btn = partButton(boxes[p.key], "lesen-btn-retry");
                if (btn) btn.click();
                delete scores[p.key];
            });
            graded = false;
            resetClock();
            tick();
            paintScores();
            go("teil1");
        }

        /* Modelltest كيعيط لهادي ملي كيدوز لـ Hören: كيصحح الأجزاء كاملين
           (كيتصيفطو lesen-points) بلا ما نبدلو الصفحة. */
        /* selbsttest.html (?nav=0) كيبدل الجزء من البار ديالو */
        if (EMBEDDED) window.__examGo = function (key) { if (PART_LABEL[key]) go(key); };

        if (EMBEDDED) window.__examGradeAll = function () {
            PARTS.forEach(function (p) {
                const btn = checkButton(boxes[p.key]);
                if (btn && scores[p.key] == null) btn.click();
            });
        };

        function gradeAll() {
            graded = true;
            frozen = Math.max(0, LIMIT - (Date.now() - started));
            tick();
            PARTS.forEach(function (p) {
                const btn = checkButton(boxes[p.key]);
                if (btn) btn.click();
            });
            paint();
            paintScores();
            setTimeout(function () {
                summary.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 60);
        }
    }

    /* ================= التمرين ================= */

    function pageUrl(themaId, part) {
        const params = new URLSearchParams();
        params.set("thema", themaId);
        if (part) params.set("teil", part);
        return location.pathname + "?" + params.toString();
    }

    function open(themaId, part, push) {
        renderedPremium = window.__sehrgutIsPremium;
        renderedState = window.__dePremiumState;
        const topic = topics.find(function (t) { return t.id === themaId; });
        if (!topic) { close(push); return; }
        dropExamTop();

        if (push) dePush({ thema: themaId, teil: part }, "", pageUrl(themaId, part));

        if (heroEl) heroEl.hidden = true;
        if (tabsNav) tabsNav.hidden = true;
        if (toolbar) toolbar.hidden = true;
        if (countEl) countEl.hidden = true;
        grid.hidden = true;
        detail.hidden = false;

        detail.textContent = "";

        /* موضوع مجاني والمحتوى باقي ما وصلش من Cloudflare */
        if (!topic.locked && !freeLoaded()) {
            freeLoading(detail);
            freeWait().then(function () {
                const now = new URLSearchParams(location.search).get("thema");
                if (now === themaId && !detail.hidden) {
                    if (freeLoaded()) open(themaId, part, false);
                    else { detail.textContent = ""; const e = document.createElement("div"); e.className = "lesen-empty"; e.textContent = "ما قدرناش نجيبو التمرين. شوف الأنترنت وعاود."; detail.appendChild(e); }
                }
            });
            return;
        }

        /* رأس التمرين: رجوع + الاسم */
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

        const content = (window["LESEN_" + LV + "_CONTENT"] || {})[themaId] || {};
        const available = (topic.parts && topic.parts.length)
            ? PARTS.filter(function (p) { return topic.parts.indexOf(p.key) !== -1; })
            : PARTS;

        let current = available.some(function (p) { return p.key === part; })
            ? part
            : available[0].key;

        /* تبويبات الأجزاء — غير إلا كان الموضوع فيه أكثر من واحد */
        if (available.length > 1) {
            const tabs = document.createElement("nav");
            tabs.className = "lesen-tabs lesen-part-tabs";

            available.forEach(function (p) {
                const tab = document.createElement("button");
                tab.type = "button";
                tab.className = "lesen-tab" + (p.key === current ? " active" : "");
                tab.textContent = p.label;
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
        stack.id = "lesen-stack";
        stack.setAttribute("data-manual", "");
        detail.appendChild(stack);

        window.scrollTo({ top: 0, behavior: "smooth" });
        paint();

        function paint() {
            const wanted = current;
            renderPart(stack, topic, current, function () {
                return current === wanted && !detail.hidden;
            });
        }
    }

    function close(push) {
        document.documentElement.classList.remove("is-topic-focus");
        dropExamTop();
        if (push) dePush({}, "", location.pathname);
        detail.hidden = true;
        detail.textContent = "";
        if (heroEl) heroEl.hidden = false;
        if (tabsNav) tabsNav.hidden = false;
        if (toolbar) toolbar.hidden = false;
        if (countEl) countEl.hidden = false;
        grid.hidden = false;
    }

    /* زر الرجوع ديال الـ navigateur.

       دابا الرابط كيقدر يتبدل فجوج حالات: موضوع محلول (?thema=)
       ولا جزء آخر (المسار نفسو). خاصنا نتبعو بجوج. */
    window.addEventListener("popstate", function () {
        if (stale()) return;
        const backY = history.state && typeof history.state.deY === "number" ? history.state.deY : 0;
        let wanted = partOfFile(location.pathname.split("/").pop());
        /* رجعنا لصفحة ماشي Lesen ديال هاد المستوى: الراوتر هو اللي كيتكلف */
        if (wanted === null) return;
        if (wanted === "" && !SHOW_EXAMS) wanted = "teil1";
        if (wanted !== null && wanted !== pagePart) switchPart(wanted, null, false);

        const params = new URLSearchParams(location.search);
        const thema = params.get("thema");
        const exam = examParam(params);
        if (exam) openExam(exam, params.get("teil") || "teil1", false);
        else if (thema) open(thema, params.get("teil") || pagePart || "teil1", false);
        else {
            close(false);
            /* رجع للائحة: نفس البلاصة اللي كان فيها */
            window.scrollTo(0, backY);
        }
    }, scope);

    if (search) search.addEventListener("input", function () { renderList(false); });
    if (sortBtn) {
        sortBtn.addEventListener("click", function () {
            sortIndex = (sortIndex + 1) % SORTS.length;
            sortBtn.querySelector(".label").textContent = SORTS[sortIndex].label;
            renderList(true);
        });
    }

    /* Prüfungen مخبية: b2-lesen.html كيحل ديريكت على Teil 1. */
    if (!pagePart && !SHOW_EXAMS && !examParam(new URLSearchParams(location.search))) {
        switchPart("teil1", null, false);
        history.replaceState({ teil: "teil1" }, "",
            LEVEL + "-lesen-teil1.html" + location.search + location.hash);
    } else {
        renderList(true);
    }

    /* حالة الاشتراك كتوصل من الهيدر من بعد ما يجاوب Firebase.
       إلا كان التمرين محلول وهو Premium، كنعاودو نرسموه. */
    document.addEventListener("de-premium", function () {
        if (stale()) return;
        /* اللائحة خاصها تتعاود: الأقفال كيطيحو ملي يبان الاشتراك */
        renderList();

        if (detail.hidden) return;
        /* نفس الاشتراك ونفس الحالة (ماشي «مشكل ف الأنترنت» اللي تصلح) → والو */
        if (window.__sehrgutIsPremium === renderedPremium
            && renderedState !== "error") return;
        const params = new URLSearchParams(location.search);
        const thema = params.get("thema");
        const exam = examParam(params);
        if (exam) openExam(exam, params.get("teil") || "teil1", false);
        else if (thema) open(thema, params.get("teil") || pagePart || "teil1", false);
    }, scope);

    /* الرابط جا فيه موضوع؟ نحلوه دغيا. */
    const startParams = new URLSearchParams(location.search);
    if (examParam(startParams)) {
        openExam(examParam(startParams), startParams.get("teil") || "teil1", false);
    } else if (startParams.get("thema")) {
        open(startParams.get("thema"),
             startParams.get("teil") || pagePart || "teil1", false);
    }
})();
