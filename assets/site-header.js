/* ===== الهيدر المشترك =====

   كيبني نفس الهيدر ف كل الصفحات: العلامة، التنقل، الوضع
   الفاتح/المظلم، وحالة الحساب.

   الاستعمال:
     <div id="site-header" data-active="lesen"></div>

   data-active: lesen · hoeren · schreiben · sprechen
*/

(function () {
    "use strict";

    const mount = document.getElementById("site-header");
    if (!mount) return;

    const NAV = [
        { key: "lesen",     href: "b2-lesen.html",     label: "Lesen" },
        { key: "hoeren",    href: "b2-hoeren.html",    label: "Hören" },
        { key: "schreiben", href: "b2-schreiben.html", label: "Schreiben" },
        { key: "sprechen",  href: "b2-sprechen.html",  label: "Sprechen" },
        /* Training (Fortschritt، Modelltest، Wortschatz) تحيد
           من البار. الصفحات باقية خدامة ومربوطة من بلايص
           أخرى فالموقع — غير البركة من هنا اللي تحيدات. */
        /* التحضير المباشر. ماعندو مستوى، وكيتميز بكلاس
           ديالو باش يبان ذهبي بين الباقي. */
        /* «اختبر نفسك»: امتحان عشوائي (Premium) ف modelltest.html */
        { key: "selbsttest", href: "selbsttest.html", label: "اختبر نفسك" },
        { key: "ultra",     href: "payment.html", label: "Premium", gold: true }
    ];

    let active = mount.dataset.active || "";

    const header = document.createElement("header");
    header.className = "site-header";
    /* Google ما ياخدش كلمات المنيو (Lesen Hören…) ف الوصف ديال النتيجة */
    header.setAttribute("data-nosnippet", "");

    const inner = document.createElement("div");
    inner.className = "site-header-inner";

    /* ---- العلامة ---- */
    const brand = document.createElement("a");
    brand.className = "site-brand";
    brand.href = "./";
    brand.innerHTML =
        /* logo-80.webp (~5KB) بلاصة icon-192.png (كان 82KB) — كيبان دغيا */
        '<img src="assets/logo-80.webp" alt="sehrgut" width="40" height="40" fetchpriority="high" decoding="async">' +
        '<span class="site-brand-text">' +
        '<span class="site-brand-name">Deutsch <span>Einfach</span></span>' +
        '<span class="site-brand-sub">TELC PREP B1/B2</span>' +
        "</span>";
    inner.appendChild(brand);

    /* ---- التنقل ---- */
    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.setAttribute("aria-label", "Bereiche");

    /* المستوى ديال الصفحة الحالية: b1-lesen.html → "b1" */
    const pageLevel =
        (location.pathname.split("/").pop() || "").indexOf("b1-") === 0 ? "b1" : "b2";

    NAV.forEach(function (item) {
        if (item.hidden || item.gold) return;   /* Ultra: زر بوحدو، تحت */
        const link = document.createElement("a");
        /* كانت الروابط ديما b2-*، حتى ملي تكون ف صفحة B1 — إذن
           من B1 Hören، البركة على Lesen كتوديك ل B2. دابا كل
           رابط كيتبع المستوى ديال الصفحة اللي راك فيها.
           Ultra و Selbsttest ماعندهومش مستوى. */
        link.href = (item.key === "training" || item.key === "ultra" || item.key === "selbsttest")
            ? item.href
            : pageLevel + "-" + item.key + ".html";
        link.textContent = item.label;
        if (item.gold) link.classList.add("site-nav-gold");
        /* الراوتر كيقارن بالمفتاح ماشي بالرابط: الروابط هنا ديما
           b2-*، حتى ملي تكون ف صفحة B1 (مبدّل المستوى هو اللي
           كيتكلف بالمستوى). */
        link.dataset.key = item.key;
        if (item.key === active) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
        nav.appendChild(link);
    });

    /* Premium (payment.html، وتحتو Ultra Premium): زر ذهبي بوحدو حدا التنقل (ماشي داخلو) — بحال
       Zertify. التنقل + الزر ف سطر واحد (site-navrow). */
    const navRow = document.createElement("div");
    navRow.className = "site-navrow";
    navRow.appendChild(nav);
    NAV.forEach(function (item) {
        if (!item.gold || item.hidden) return;
        const ultra = document.createElement("a");
        ultra.className = "site-ultra" + (item.key === active ? " active" : "");
        ultra.href = item.href;
        ultra.dataset.key = item.key;
        if (item.key === active) ultra.setAttribute("aria-current", "page");
        ultra.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" '
            + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>'
            + '<span class="site-ultra-long">' + item.label + '</span><span class="site-ultra-short">' + item.label + '</span>';
        navRow.appendChild(ultra);
    });
    inner.appendChild(navRow);

    /* ---- المؤشر اللي كيزلق بين الأقسام ----

       ملي تبرك على قسم آخر، المؤشر كيزلق ليه والمحتوى كيتلاشى،
       ومن بعد كتمشي الصفحة. */
    const pill = document.createElement("span");
    pill.className = "site-nav-pill is-first";
    pill.setAttribute("aria-hidden", "true");
    nav.insertBefore(pill, nav.firstChild);
    nav.classList.add("has-pill");

    function movePill(target) {
        if (!target) { pill.style.opacity = "0"; return; }
        pill.style.opacity = "1";
        pill.style.width = target.offsetWidth + "px";
        pill.style.height = target.offsetHeight + "px";
        pill.style.transform =
            "translate(" + target.offsetLeft + "px," + target.offsetTop + "px)";
    }

    function placePill() { movePill(nav.querySelector("a.active")); }

    /* الخطوط ما زال ما تحملوش — العرض ديال الروابط كيتبدل من بعد */
    placePill();
    requestAnimationFrame(placePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
    window.addEventListener("resize", placePill);
    setTimeout(function () { pill.classList.remove("is-first"); }, 60);

    /* ---- الانتقال ديال الصفحة ----

       المؤشر كيزلق، المحتوى كيتلاشى، ومنين تسالي الحركة كنمشيو
       للصفحة الجاية. الهيدر ماشي داخل — كيبقى واقف. */
    const still = window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* التيليفون (شاشة صغيرة ولا لمس): الحركات هنا كتغلى. قياس على تيليفون
       بطيء (CPU 6x، 4G): من 400 لـ600 ms ديال التبديل، نص 75٪ منها هي
       الحركة ديال View Transition (لقطة قبل + مزج 300–470 ms)، والتبديل
       نفسو 30–60 ms. إذن ف الشاشات الصغار كنبدلو المحتوى دغيا. */
    const compact = window.matchMedia
        ? window.matchMedia("(max-width: 820px), (pointer: coarse)")
        : { matches: false };

    /* ---- واش المتصفح كيدير View Transitions بين الصفحات؟ ----

       إلا كان كيديرها، هو اللي خاصو يسوق الانتقال: كياخد صورة
       ديال البار قبل ما يمشي وكيلصقها مع البار ديال الصفحة
       الجديدة، إذن كتبان واقفة بلا ما تغمض. وخاصنا نحيدو
       الـfade ديالنا، وإلا كنطفيو المحتوى قبل ما ياخد المتصفح
       الصورة — وكيخرج انتقال ديال صفحة خاوية.

       onpagereveal هو العلامة ديال الانتقال بين الصفحات
       (ماشي غير داخل نفس الصفحة بحال startViewTransition). */
    const crossDocVT = "onpagereveal" in window
        && typeof CSS !== "undefined"
        && CSS.supports
        && CSS.supports("view-transition-name", "none");

    if (crossDocVT) document.documentElement.classList.add("de-vt");

    /* بركة عادية على رابط ماشي نشيط؟ */
    function plain(event) {
        const link = event.target.closest("a");
        if (!link || link.classList.contains("active")) return null;
        if (event.defaultPrevented || event.button
            || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
        return link;
    }

    /* كنطفيو المحتوى، ومنين تسالي الحركة كنمشيو. */
    function leaveTo(href) {
        /* كنمشيو دغيا — ماكنتسناوش الحركة تسالي. المحتوى كيتلاشى
           فنفس الوقت اللي كتجي فيه الصفحة الجديدة، إذن الحركة ما
           كتزيد حتى جزء من الثانية فالانتظار. */
        document.documentElement.classList.add("de-leaving");
        location.href = href;
    }

    nav.addEventListener("click", function (event) {
        /* المتصفح كيسوق الانتقال بوحدو — ماخاصناش نوقفو الرابط.
           المؤشر ديال القسم الجديد كيكون ديجا فبلاصتو ف الصفحة
           الجاية، إذن حتى هو ماخاصوش تحريك بالـJS. */
        if (still || crossDocVT || compact.matches) return;
        const link = plain(event);
        if (!link) return;
        event.preventDefault();

        /* اللون ديال الكلمات خاصو يمشي مع المؤشر:

           - القديمة: كانت بيضا حيت المؤشر كان تحتيها. ملي
             يمشي، خاصها ترجع رمادية *دغيا* — إلا خليناها
             تتبدل بشوية، كتدوز على بياض فوق بياض وكتغيب.

           - الجديدة: ما تولّيش بيضا حتى يوصل ليها المؤشر،
             وإلا تبقى بيضا فوق بياض حتى يجي. */
        Array.prototype.forEach.call(nav.querySelectorAll("a.active"), function (old) {
            old.style.transition = "none";
            old.classList.remove("active");
            old.removeAttribute("aria-current");
            /* قراءة اللون كتجبر المتصفح يحسب الستايل دابا —
               إذن التبديل كيوقع بلا انتقال. */
            getComputedStyle(old).getPropertyValue("color");
            old.style.transition = "";
        });

        link.style.transition = "color .12s ease .18s";
        link.classList.add("active");
        link.setAttribute("aria-current", "page");

        movePill(link);
        leaveTo(link.href);
    });

    /* الأقسام + صفحات الأجزاء ديال Lesen (نفس الملفات بالضبط،
       غير data-teil كيتبدل) — هادو اللي الراوتر (لتحت) كيبدلهم
       بـfetch بلا ما تتحمل الصفحة.

       ماشي داخلين:
         · b2-hoeren-teil*.html — فيهم inline scripts فيهم
           `const` ف الجذر، و`const` مرتين ف نفس الصفحة =
           SyntaxError.
       هادو كيتنقلو عادي، وهادشي ماشي مشكل: البار كتعاود
       تتبنى غير تما، ماشي ف كل برْكة. */
    const ROUTABLE =
        /^(b1|b2)-(lesen|hoeren|schreiben|sprechen)\.html$|^(b1|b2)-lesen-(teil[123]|sprach[12])\.html$/;

    /* ---- نوجدو الصفحة الجاية قبل ما تبرك ----

       هادي هي اللي كتخلي البار ما يغمضش. الـHTML ديال القسم
       الجاي كيتجيب بالخفية (prefetch)، إذن منين تبرك الراوتر
       كيلقاه ديجا ف الكاش.

       الصفحات اللي الراوتر كيبدلها بـfetch ما كنرسموهاش بالخفية
       (prerender): الراوتر كيوقف البركة، إذن الصفحة المرسومة
       عمرها ما كتتفعّل — وكتبقى خدامة ف الخلفية (Firebase، عشرين
       سكريبت، النجوم) وكتاكل المعالج ف نفس اللحظة اللي المستخدم
       كيبرك فيها. prerender غير للصفحات اللي كيتنقلو عادي.

       اللي ماعندوش Speculation Rules (Safari/Firefox) كيتجاهل
       هاد السطور وكلشي كيبقى خدام عادي. */
    (function prerender() {
        if (still) return;

        const file = (location.pathname.split("/").pop() || "").toLowerCase();
        const level = file.indexOf("b1-") === 0 ? "b1" : "b2";

        const urls = [];
        NAV.forEach(function (item) {
            if (item.key === active || item.hidden) return;
            /* Ultra ماعندو مستوى: الرابط ديالو كيف ما هو */
            urls.push(isSection(item.key) ? level + "-" + item.key + ".html" : item.href);
        });
        /* والمستوى الآخر ديال نفس القسم */
        if (isSection(active)) urls.push((level === "b1" ? "b2" : "b1") + "-" + active + ".html");

        if (!urls.length) return;

        /* prefetch: كيجيب غير الـHTML، وكيخدم ف بزاف د المتصفحات.
           prerender: كيرسمها كاملة، وكيخدم غير ف Chrome الجديد.
           اللي ماعندوش لا هاد لا هاك، كلشي كيبقى خدام عادي. */
        urls.forEach(function (url) {
            const tag = document.createElement("link");
            tag.rel = "prefetch";
            tag.href = url;
            tag.as = "document";
            document.head.appendChild(tag);
        });

        if (!HTMLScriptElement.supports
            || !HTMLScriptElement.supports("speculationrules")) return;

        const rendered = urls.filter(function (url) {
            return !ROUTABLE.test(url.split("?")[0].split("/").pop().toLowerCase());
        });

        const prerender = [];
        if (rendered.length) {
            prerender.push({ source: "list", urls: rendered, eagerness: "moderate" });
        }
        /* أي رابط آخر ف الموقع (Teil 1، موضوع، الامتحان...) كيبدا
           يترسم ملي تحط الصبع عليه — قبل ما تهز الصبع.

           روابط البار (.site-nav) وشريط المستوى كيبقاو برا: الراوتر هو اللي
           كيبدلهم بـfetch، والصفحة المرسومة عمرها ما كتتفعّل — كتاكل المعالج
           ف أسوأ لحظة (ملي كيبرك الطالب) وماكتفيد والو. */
        prerender.push({
            source: "document",
            where: { and: [
                { href_matches: "/*.html" },
                { not: { href_matches: "/admin.html" } },
                { not: { selector_matches: "[target], [download], [data-no-prerender], .site-nav a, .site-level-wrap a" } }
            ] },
            eagerness: "conservative"
        });

        const rules = document.createElement("script");
        rules.type = "speculationrules";
        rules.textContent = JSON.stringify({ prerender: prerender });
        document.head.appendChild(rules);

        /* ف التيليفون "moderate" ماكيخدمش بالـ hover (ماكاينش ماوس).
           ملي تلمس شي قسم فالبار، كنقولو للمتصفح يبدا دابا نيشان. */
        let touched = false;
        nav.addEventListener("touchstart", function (event) {
            if (touched) return;
            const link = event.target.closest("a");
            if (!link || link.classList.contains("active")) return;
            /* الأقسام الراوتر هو اللي كيبدلها بـfetch: ما كيتفعّلش prerender ديالها */
            const target = (link.getAttribute("href") || "").split("?")[0].split("/").pop().toLowerCase();
            if (ROUTABLE.test(target)) return;
            touched = true;
            const now = document.createElement("script");
            now.type = "speculationrules";
            now.textContent = JSON.stringify({
                prerender: [{ source: "list", urls: [link.href], eagerness: "immediate" }]
            });
            document.head.appendChild(now);
            setTimeout(function () { touched = false; }, 400);
        }, { passive: true });
    }());

    /* ---- السكريبتات ديال الأقسام الأخرى: ف الكاش قبل ما تبرك ----

       الـprefetch ديال فوق كيجيب غير الـHTML. السكريبتات كيتحملو ملي
       كيبرك الطالب: ف Lesen هادي 13 ملف (107 KB gzip ف B1، 154 ف B2)،
       وعلى 4G بطيء هادي هي التبديل الأول — 1.1 ثانية لـLesen و0.85 لـSprechen،
       والتبديل الثاني 0.25 حيت الكاش واجد.

       كنجيبوهم ملي المتصفح ما عندو ما يدير (بعد ما تتحمل الصفحة)، بأولوية
       ناقصة، وللأقسام ديال نفس المستوى غير (147 KB ف B1). ما كنديرو والو
       إلا كانت الشبكة بطيئة ولا الطالب مفعّل «توفير البيانات». */
    (function warm() {
        const link = navigator.connection || {};
        if (!window.fetch || !window.DOMParser || link.saveData
            || /^(slow-2g|2g|3g)$/.test(link.effectiveType || "")) return;
        if (!isSection(active)) return;

        const file = (location.pathname.split("/").pop() || "").toLowerCase();
        const level = file.indexOf("b1-") === 0 ? "b1" : "b2";
        const pages = [];
        NAV.forEach(function (item) {
            if (item.key === active || item.hidden || !isSection(item.key)) return;
            pages.push(level + "-" + item.key + ".html");
        });
        if (!pages.length) return;

        /* اللي ديجا فهاد الصفحة ما كنجيبوهش */
        const have = {};
        Array.prototype.forEach.call(
            document.querySelectorAll("script[src], link[rel='stylesheet'][href]"),
            function (node) { have[node.getAttribute("src") || node.getAttribute("href")] = true; });

        function assetsOf(page) {
            return fetch(page, { credentials: "same-origin" })
                .then(function (res) { return res.ok ? res.text() : ""; })
                .then(function (html) {
                    const doc = new DOMParser().parseFromString(html, "text/html");
                    const list = [];
                    Array.prototype.forEach.call(
                        doc.querySelectorAll("script[src], link[rel='stylesheet'][href]"),
                        function (node) {
                            const url = node.getAttribute("src") || node.getAttribute("href");
                            if (/^assets\//.test(url) && !have[url]) { have[url] = true; list.push(url); }
                        });
                    return list;
                });
        }

        /* الجسم خاصو يتقرا حتى لآخرو، وإلا المتصفح كيقطع التحميل
           وما كيتخزنش ف الكاش */
        function pull(url) {
            return fetch(url, { credentials: "same-origin", priority: "low" })
                .then(function (res) { return res.arrayBuffer(); });
        }

        function run() {
            pages.reduce(function (chain, page) {
                return chain.then(function () {
                    if (document.hidden) return null;
                    return assetsOf(page).then(function (list) {
                        return Promise.all(list.map(pull));
                    });
                });
            }, Promise.resolve()).catch(function () { /* تحسين غير: ماشي مشكل */ });
        }

        const later = function () {
            if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 5000 });
            else setTimeout(run, 2500);
        };
        if (document.readyState === "complete") later();
        else window.addEventListener("load", later);
    }());

    /* رجعتي لور؟ الصفحة كانت مطفية فالكاش — نرجعوها */
    window.addEventListener("pageshow", function () {
        document.documentElement.classList.remove("de-leaving");
        placePill();
    });

    /* ---- اليمين ---- */
    const actions = document.createElement("div");
    actions.className = "site-actions";

    /* ---- الإشعارات: الجديد فالموقع ----
       صاحب الموقع (users/{uid}.isAdmin = true) كيكتب الخبر من هنا،
       وكيبان لكاع الناس فالجرس مع رقم ديال اللي مازال ماشافوهش.
       الأخبار فـ Firestore: news/{id} = {title, body, link, createdAt}. */
    /* ---- Bewerbung + ترجمة الوثائق (bewerbung.html) ---- */
    const docs = document.createElement("a");
    docs.href = "bewerbung.html";
    docs.className = "site-btn site-btn-icon site-docs" + (/bewerbung\.html$/i.test(location.pathname) ? " is-here" : "");
    docs.setAttribute("aria-label", "Bewerbung و ترجمة الوثائق");
    docs.title = "Bewerbung و ترجمة الوثائق";
    docs.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '
        + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/>'
        + '<path d="M9 13h6M9 17h4"/></svg><span class="site-docs-dot" aria-hidden="true"></span>';
    actions.appendChild(docs);

    const news = newsBell();
    actions.appendChild(news.root);

    /* فاتح ↔ مظلم (assets/theme-toggle.js) */
    if (window.__deTheme && window.__deTheme.button) {
        actions.appendChild(window.__deTheme.button("site-btn site-btn-icon site-theme"));
    }

    /* ---- مجموعة الواتساب ديال الطلبة: حدا الحساب ---- */
    const wa = document.createElement("a");
    wa.className = "site-btn site-btn-icon site-wa";
    wa.href = "https://chat.whatsapp.com/E7B11vaf6NGHRFWZMfMF2M";
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", "مجموعة الواتساب");
    wa.title = "مجموعة الواتساب";
    wa.innerHTML = '<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true">'
        + '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>'
        + '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24z"/></svg>';
    actions.appendChild(wa);

    /* ضيف — حتى نعرفو شكون داخل */
    const guest = document.createElement("span");
    guest.className = "site-actions";
    guest.id = "site-guest";
    /* البار ولات fixed، إذن كل سطر زائد فيها كياكل من الشاشة
       ديال التيليفون. الكلمة الطويلة كتغيب تحت 560px
       (.site-btn-label-long) وكيبقى «الدخول» و«حساب» — وهكا
       العلامة والأزرار كيدخلو ف سطر واحد بدل جوج. */
    guest.innerHTML =
        '<a class="site-btn" href="login.html">'
        + '<span class="site-btn-label-long">تسجيل </span>الدخول</a>'
        + '<a class="site-btn site-btn-primary" href="signup.html">'
        + '<span class="site-btn-label-long">إنشاء </span>حساب</a>';
    actions.appendChild(guest);

    /* ---- الحساب: زر + قائمة ----
       كان غير رابط. ولا زر كيحل قائمة فيها تبديل الاسم
       وتسجيل الخروج، حيت ماكانتش شي بلاصة يدير فيها المستعمل
       هاد الحوايج. */
    const account = document.createElement("div");
    account.className = "site-account";
    account.hidden = true;

    const user = document.createElement("button");
    user.type = "button";
    user.className = "site-user";
    user.id = "site-user";
    user.setAttribute("aria-haspopup", "menu");
    user.setAttribute("aria-expanded", "false");

    const caret = document.createElement("span");
    caret.className = "site-user-caret";
    caret.setAttribute("aria-hidden", "true");

    const menu = document.createElement("div");
    menu.className = "site-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    account.append(user, menu);
    actions.appendChild(account);

    /* ---- الحساب ديال آخر مرة ----

       Firebase كياخد نص ثانية باش يجاوب. حتى دوك اللحظات،
       البار كتبين «تسجيل الدخول / إنشاء حساب» حتى للمشترك،
       ومن بعد كتقلب للاسم ديالو. يعني ف كل برْكة على Lesen ولا
       Hören، البار كتبدل الشكل ديالها قدام عينيه.

       الحل: كنحتافظو بآخر حالة معروفة، وكنرسموها دغيا. ملي
       يجاوب Firebase كنصلحو إلا تبدل شي حاجة. هادي زينة
       برك — الاشتراك الحقيقي كيتحقق منو الـWorker، ماشي هنا. */
    const LAST = "sehrgutLastAccount";

    function remember(data) {
        try {
            if (data) localStorage.setItem(LAST, JSON.stringify(data));
            else localStorage.removeItem(LAST);
        } catch (error) { /* تصفح خاص: ماشي مشكل */ }
    }

    function recall() {
        try {
            const raw = localStorage.getItem(LAST);
            if (!raw) return null;
            const data = JSON.parse(raw);
            return (data && typeof data.name === "string") ? data : null;
        } catch (error) { return null; }
    }

    /* ---- رسم الزر ديال الحساب ---- */
    function paint(label, isPremium) {
        user.textContent = "";

        const avatar = document.createElement("span");
        avatar.className = "site-avatar";
        avatar.textContent = label.trim().charAt(0).toUpperCase() || "?";
        user.appendChild(avatar);

        const text = document.createElement("span");
        text.className = "site-user-name";
        text.textContent = label;
        user.appendChild(text);

        if (isPremium) {
            const badge = document.createElement("span");
            badge.className = "site-premium";
            badge.textContent = "PREMIUM";
            user.appendChild(badge);
        }

        user.appendChild(caret);
    }

    /* كنرسمو آخر حالة معروفة دغيا — بلا ما نستناو Firebase.
       القائمة ما كتتبناش دابا: ماكاينش لعجلة، وهي محتاجة
       الإيميل الحقيقي. كتوجد ملي يجاوب Firebase. */
    /* بلا أنترنت: Premium غير إلا التصريح (diag.js) باقي صالح — الاشتراك
       ما سالاش وما فاتوش 7 أيام بلا ما نتأكدو */
    function passOk(uid) {
        if (navigator.onLine !== false) return true;
        return !window.__deOfflinePass || window.__deOfflinePass.ok(uid);
    }
    const last = recall();
    if (last && last.premium === true && !passOk(last.uid)) last.premium = false;
    if (last) {
        guest.hidden = true;
        account.hidden = false;
        paint(last.name, last.premium === true);
        /* الأقفال ديال الصفحة كيتسناو هاد الخبر. كنعطيوهم
           التخمين ديال دابا باش البطائق ما يبانوش مقفولين
           ومن بعد يتحلو — والـWorker على كل حال ماكيعطي حتى
           كلمة بلا ما يتحقق من token حقيقي. */
        if (last.premium === true) window.__sehrgutIsPremium = true;
    }

    /* ---- واش الاشتراك تأكد ولا لا ----
       "pending": Firebase ما زال ما جاوبش · "ok": جاوب · "error": الأنترنت.
       قبل، إلا طاحت القراية ديال الحساب (أنترنت ضعيفة)، كنا كنعتبروه
       ماشي مشترك — والمشترك كيشوف «خاصك Premium». دابا الصفحات
       (locked-modal.js، premium-gate.js) كيقراو هاد الحالة وكيقولو
       «مشكل ف الأنترنت» بلاصة القفل. */
    function setPremiumState(state, signedIn) {
        if (state === "error" && window.__deDiag) {
            window.__deDiag("fail", "الحساب: Firebase ما قدرش يتأكد من الاشتراك" + (signedIn ? "" : " (ما تحملش)"));
        }
        window.__dePremiumState = state;
        /* الشريط غير لصاحب حساب — الزائر ماعندو حتى اشتراك يتأكد */
        netNotice(state === "error" && (signedIn || !!recall()));
        document.dispatchEvent(new CustomEvent("de-premium-state", { detail: state }));
    }
    window.__dePremiumState = "pending";

    /* الأدمين: كيبان ليه زر «كلمة مفتاحية» ف Lesen و Hören */
    function setAdmin(on) {
        if (window.__deIsAdmin === on) return;
        window.__deIsAdmin = on;
        document.dispatchEvent(new CustomEvent("de-admin", { detail: on }));
    }

    let netBar = null;
    function netNotice(show) {
        if (!show) { if (netBar) { netBar.remove(); netBar = null; } return; }
        /* الراوتر كيمسح المحتوى ديال <body> ملي يتبدل القسم */
        if (netBar && netBar.isConnected) return;
        netBar = document.createElement("div");
        netBar.className = "site-net";
        netBar.setAttribute("role", "alert");
        const text = document.createElement("span");
        text.textContent = "⚠️ مشكل ف الأنترنت: ما قدرناش نتأكدو من الحساب ديالك. "
            + "إلا كنتي مشترك، المواضيع غادي يتحلو غير يرجع الاتصال.";
        const again = document.createElement("button");
        again.type = "button";
        again.textContent = "عاود المحاولة";
        again.addEventListener("click", function () { location.reload(); });
        const shut = document.createElement("button");
        shut.type = "button";
        shut.className = "site-net-x";
        shut.setAttribute("aria-label", "سد");
        shut.textContent = "✕";
        shut.addEventListener("click", function () { if (netBar) { netBar.remove(); netBar = null; } });
        netBar.append(text, again, shut);
        document.body.appendChild(netBar);
    }

    function openMenu(open) {
        menu.hidden = !open;
        account.classList.toggle("is-open", open);
        user.setAttribute("aria-expanded", open ? "true" : "false");
    }

    user.addEventListener("click", function (event) {
        event.stopPropagation();
        openMenu(menu.hidden);
    });
    document.addEventListener("click", function (event) {
        if (!account.contains(event.target)) openMenu(false);
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") openMenu(false);
    });

    inner.appendChild(actions);
    header.appendChild(inner);

    /* ---- مبدّل المستوى ----
       بدل صفحات b1.html و b2.html اللي كانو كيجمعو كلشي،
       المستوى كيتبدل جوا القسم نفسو: Lesen B1 ↔ Lesen B2.
       كنعرفو المستوى الحالي من اسم الصفحة.

       ⚠ ماكيدخلش ف <header>: البار ولات fixed، وإلا زدنا
       هاد المبدّل معاها كتولي 154px واقفين فوق الشاشة (238
       فالتيليفون — تلت الشاشة كاملة على واحد الزر كتستعملو
       مرة فالعام). إذن كيبقى ف التدفق العادي تحت البار. */
    let levelWrap = null;

    /* Training و Ultra ماعندهومش B1/B2.

       ⚠ المبدّل كيتبنى ديما، حتى ف صفحة ماشي قسم (index، Training):
       البار كتبقى حية ملي كنتنقلو بلا تحميل، وإلا ما تبناش ف الأول
       عمرو ما كيبان — الدخول من الصفحة الرئيسية لـ Lesen كان كيخلي
       الصفحة بلا Telc B1 / Telc B2. */
    function isSection(key) {
        return !!key && key !== "training" && key !== "ultra" && key !== "selbsttest";
    }
    {
        const file = (location.pathname.split("/").pop() || "").toLowerCase();
        const level = file.indexOf("b1-") === 0 ? "b1" : "b2";

        const wrap = document.createElement("div");
        wrap.className = "site-level-wrap";

        const box = document.createElement("div");
        box.className = "site-level";

        [["b1", "Telc B1"], ["b2", "Telc B2"]].forEach(function (pair) {
            const link = document.createElement("a");
            link.href = pair[0] + "-" + (isSection(active) ? active : "lesen") + ".html";
            link.textContent = pair[1];
            link.dataset.level = pair[0];
            if (pair[0] === level) {
                link.classList.add("active");
                link.setAttribute("aria-current", "page");
            }
            box.appendChild(link);
        });

        /* مبدّل المستوى كيمشي بنفس الانتقال ديال الأقسام */
        box.addEventListener("click", function (event) {
            if (still || crossDocVT) return;
            const link = plain(event);
            if (!link) return;
            event.preventDefault();
            leaveTo(link.href);
        });

        wrap.appendChild(box);
        levelWrap = wrap;
    }

    /* فين كيتحط المبدّل: تحت العنوان ديال القسم (بحال Zertify)،
       وإلا ماكانش عنوان، تحت البار. ملي الصفحة ماشي قسم كيتخبى. */
    function placeLevel() {
        if (!levelWrap) return;
        levelWrap.hidden = !isSection(active);
        const anchor = document.querySelector(".lesen-head-row");
        if (anchor && !levelWrap.hidden) {
            if (anchor.nextElementSibling !== levelWrap) anchor.insertAdjacentElement("afterend", levelWrap);
        } else if (header.nextElementSibling !== levelWrap) {
            header.insertAdjacentElement("afterend", levelWrap);
        }
    }

    /* ---- الهيدر كيتعلق ف <body> مباشرة ----

       قبل، كان كيتحط ف بلاصة #site-header. فـ index.html داك
       الـ mount كان داخل .container، و:

         · .container كياخد حركة الدخول/الخروج ديال الصفحة
           (transform) — والعنصر اللي عندو جد متحرك بـ transform
           ماكيبقاش position:fixed كيخدم بالنسبة للشاشة؛
         · وحتى overflow ديال شي جد كيقدر يقطع sticky.

       ملي كيكون ولد مباشر ديال <body>، البار كتبقى واقفة
       حقيقة وما كتهزّ حتى مع الصفحة. */
    mount.remove();
    document.body.insertBefore(header, document.body.firstChild);
    placeLevel();
    /* السكريبت ديال البار كيتنفذ قبل ما يتقرا <main>: ملي تكمل
       الصفحة كنرجعو نحطوه تحت العنوان. */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", placeLevel);
    }


    /* ===================================================================
       تبديل القسم بلا ما تتحمل الصفحة
       ===================================================================

       المشكل: Lesen و Hören و Schreiben و Sprechen هوما أربع صفحات
       HTML. ملي تبرك على وحدة، المتصفح كيهدم الصفحة الحالية — والبار
       معاها — وكيعاود يبني كلشي من الصفر. مهما نكتبو `position: fixed`،
       البار كتغيب ف داك الوقت. هادا هو الـ"refresh" اللي كيبان.

       الحل: كنجيبو الصفحة الجاية بـ fetch، وكنبدلو غير المحتوى ديال
       <body>. البار ما كنمسوهاش — هي نفس العنصر من أول ما تحلّ الموقع
       حتى تسدّو. ماكاينش تحميل، ماكاينش وميض، والحالة ديال الحساب
       كتبقى كيف ما هي.

       علاش هادشي آمن هنا: أربع الصفحات ماعندهمش inline scripts، وكل
       ملفات assets/*.js مكتوبين ف IIFE بلا تعريفات ف الجذر — إذن
       كيتعاودو يتنفذو على DOM جديد بلا تصادم. والنسخة القديمة ديال كل
       hub كتسكت بوحدها (stale()).

       إلا طاح شي حاجة (نت مقطوع، صفحة ماشي ف اللائحة…) كنرجعو للتنقل
       العادي ديال المتصفح — ماكاين حتى طريق مسدود.
       =================================================================== */
    const routerOn = (function () {
        /* عائلة Lesen: lesen-hub.js كيتكلف بتبديل الأجزاء فنفس
           الصفحة، إذن ملي يكون التنقل جوا هاد العائلة الراوتر
           خاصو يبعد وما يعاودش يجيب الصفحة. */
        function lesenFamily(file) {
            const m = /^(b1|b2)-lesen(-(teil[123]|sprach[12]))?\.html$/.exec(file || "");
            return m ? m[1] : "";
        }

        /* هادو كيخدمو ف كل الأقسام: كيتحملو مرة وحدة وكيبقاو.
           إعادة تحميلهم = بار ثانية وحارس جلسة ثاني. */
        const PERSIST = /\/(site-header|session-guard)\.js/;

        if (!window.fetch || !window.DOMParser
            || !history.pushState || !window.Promise) return false;

        /* المستمعين اللي كيسجلو الهوبات على window/document كيعيشو
           برا الصفحة. stale() كيسكتهم، ولكن ماكيحيدهمش: كل تنقل كان
           كيخلي وراه الـDOM القديم كامل محبوس ف الذاكرة (قريب ألف
           عقدة ف كل رحلة Lesen ↔ Hören). الهوبات كيسجلو بـ
           { signal: window.__deSignal }، والراوتر كيلغيه قبل ما يحيد
           المحتوى — المتصفح كيمسح المستمعين بوحدو. */
        let pageScope = window.AbortController ? new AbortController() : null;
        window.__deSignal = pageScope ? pageScope.signal : undefined;

        function leavePage() {
            if (!pageScope) return;
            pageScope.abort();
            pageScope = new AbortController();
            window.__deSignal = pageScope.signal;
        }

        function fileOf(url) {
            try {
                const u = new URL(url, location.href);
                if (u.origin !== location.origin) return null;
                return u.pathname.split("/").pop() || "index.html";
            } catch (error) { return null; }
        }

        function routable(url) {
            const file = fileOf(url);
            return !!file && ROUTABLE.test(file);
        }

        /* الستايلات: كنزيدو غير اللي ناقص. ماكنحيدو والو — ملفات
           الأقسام مشتركين، وحيدان وحدة كتخلي الصفحة عريانة للحظة. */
        function addStyles(doc) {
            const have = {};
            Array.prototype.forEach.call(
                document.querySelectorAll('link[rel="stylesheet"]'),
                function (link) { have[fileOf(link.href) || link.href] = true; });

            const waits = [];
            Array.prototype.forEach.call(
                doc.querySelectorAll('link[rel="stylesheet"]'),
                function (link) {
                    const href = link.getAttribute("href");
                    const key = fileOf(href) || href;
                    if (!href || have[key]) return;
                    have[key] = true;

                    const tag = document.createElement("link");
                    tag.rel = "stylesheet";
                    tag.href = href;
                    waits.push(new Promise(function (done) {
                        tag.onload = tag.onerror = done;
                        /* ما نوقفوش التبديل على ستايل بطيء */
                        setTimeout(done, 1500);
                    }));
                    document.head.appendChild(tag);
                });
            return Promise.all(waits);
        }

        /* <script> اللي كيجي من innerHTML ماكيتنفذش — خاصنا نعاودو
           نبنيوه. التنفيذ خاصو يبقى واحد من بعد واحد بنفس الترتيب:
           lesen-hub.js محتاج الداتا اللي قبلو.

           التحميل لا. قبل، كل سكريبت كان كيتسنى اللي قبلو يسالي
           حتى يبدا تحميلو: ف Lesen هادي 21 رحلة ف الشبكة ورا بعضها
           (ثانيتين ونص ملي الكاش كيكون منتاهي). async = false كيخلي
           المتصفح يحمّل كلشي ف نفس الوقت وينفذ بالترتيب.

           inline script (ماكايناش دابا ف هاد الصفحات) كيتسنى اللي
           قبلو يتنفذ، وكيتسناه اللي من بعدو: نفس الترتيب القديم. */
        function runScripts(nodes) {
            const groups = [];
            nodes.forEach(function (node) {
                const last = groups[groups.length - 1];
                if (node.src && last && last.external) last.nodes.push(node);
                else groups.push({ external: !!node.src, nodes: [node] });
            });

            return groups.reduce(function (chain, group) {
                return chain.then(function () {
                    return Promise.all(group.nodes.map(function (node) {
                        return new Promise(function (done) {
                            const tag = document.createElement("script");
                            Array.prototype.forEach.call(node.attributes, function (a) {
                                tag.setAttribute(a.name, a.value);
                            });
                            if (node.src) {
                                tag.async = false;
                                tag.onload = tag.onerror = done;
                            } else {
                                tag.textContent = node.textContent;
                            }
                            document.body.appendChild(tag);
                            if (!node.src) done();
                        });
                    }));
                });
            }, Promise.resolve());
        }

        /* البار: القسم النشيط، المؤشر، وروابط المستوى */
        function setActive(key) {
            active = key;

            const lvl = (fileOf(location.pathname) || "").indexOf("b1-") === 0 ? "b1" : "b2";

            Array.prototype.forEach.call(nav.querySelectorAll("a"), function (link) {
                const mine = link.dataset.key === key;
                /* بدلنا المستوى؟ الروابط خاصها تتبع */
                /* غير الأقسام اللي عندها مستوى (Ultra لا) */
                if (isSection(link.dataset.key)) {
                    link.href = lvl + "-" + link.dataset.key + ".html";
                }
                link.classList.toggle("active", mine);
                if (mine) link.setAttribute("aria-current", "page");
                else link.removeAttribute("aria-current");
            });
            placePill();

            /* مبدّل المستوى كيبقى على نفس القسم: Lesen B1 ↔ Lesen B2 */
            if (levelWrap) {
                Array.prototype.forEach.call(levelWrap.querySelectorAll("a"), function (link) {
                    const mine = link.dataset.level === lvl;
                    if (isSection(key)) link.href = link.dataset.level + "-" + key + ".html";
                    link.classList.toggle("active", mine);
                    if (mine) link.setAttribute("aria-current", "page");
                    else link.removeAttribute("aria-current");
                });
            }
            placeLevel();
        }

        /* busy = كنبدلو المحتوى دابا (swap + السكريبتات): ما كيتقبل والو.
           قبل هادشي، كنتسناو غير الصفحة تجي: ضغطة جديدة كتغلب القديمة. */
        let busy = false;
        let seq = 0;
        let inflight = null;
        let queued = null;
        let herefile = fileOf(location.pathname);

        /* ما نبقاوش نتسناو شبكة ميتة: من بعد هاد المدة كنرجعو
           للتنقل العادي ديال المتصفح. */
        const FETCH_LIMIT = 8000;

        /* القسم الجديد كيبان نشيط والمؤشر كيزلق ليه دغيا، قبل ما تجي
           الصفحة. على شبكة بطيئة، بلا هادشي كتبرك وما كيوقع والو
           حتى تجي — كيبان بحال الموقع تعلّق. إلا طاحت الشبكة،
           bail() كيدير تنقل عادي وهاد الحالة ما كتهمش. */
        function preview(link) {
            Array.prototype.forEach.call(nav.querySelectorAll("a.active"), function (old) {
                old.classList.remove("active");
                old.removeAttribute("aria-current");
            });
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
            movePill(link);
        }

        function swap(doc) {
            leavePage();

            /* كنحيدو المحتوى القديم — غير البار وشريط المستوى
               كيبقاو. هوما نفس العناصر، ماكيتبناوش من جديد. */
            const keep = [header, levelWrap, netBar];
            Array.prototype.slice.call(document.body.childNodes).forEach(function (node) {
                if (keep.indexOf(node) === -1) node.remove();
            });

            const scripts = [];
            Array.prototype.slice.call(doc.body.children).forEach(function (node) {
                if (node.tagName === "SCRIPT") {
                    if (!PERSIST.test(node.getAttribute("src") || "")) scripts.push(node);
                    return;
                }
                /* الـmount ديال البار: عندنا وحدة حية، ماخاصناش ثانية */
                if (node.id === "site-header") {
                    active = node.dataset.active || active;
                    return;
                }
                document.body.appendChild(document.importNode(node, true));
            });

            document.title = doc.title || document.title;
            /* الاتجاه واللغة ديال الصفحة الجديدة (rtl/ltr). بلا هادي،
               الدخول من صفحة rtl كان كيخلي Lesen/Sprechen مقلوبين حتى
               يدير المستخدم refresh. */
            ["dir", "lang"].forEach(function (name) {
                const value = doc.documentElement.getAttribute(name);
                if (value) document.documentElement.setAttribute(name, value);
                else document.documentElement.removeAttribute(name);
            });
            setActive(active);
            return scripts;
        }

        /* من بعد الرجوع: اللائحة تقدر تترسم شوية من بعد (de-premium…).
           كنخليو الصفحة طويلة وكنبقاو ف البلاصة حتى يوصل المحتوى لتما
           (ولا 1.5 ث، ولا الطالب حرك الصفحة بيدو). */
        function holdPlace(y) {
            const root = document.documentElement;
            const t0 = Date.now();
            let moved = false;
            const stop = function () { moved = true; };
            ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
                window.addEventListener(ev, stop, { once: true, passive: true });
            });
            (function tick() {
                const ready = document.body.scrollHeight >= y + window.innerHeight * 0.6;
                if (!moved && Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
                if (ready || moved || Date.now() - t0 > 1500) {
                    root.style.minHeight = "";
                    if (!moved && ready) window.scrollTo(0, y);
                    return;
                }
                requestAnimationFrame(tick);
            })();
        }

        function go(url, push, link) {
            /* صفحة ما كيعرفهاش الراوتر (Hören Teil، Schreiben…): كنمشيو عادي.
               هكا المتصفح كيخليها ف الكاش ديال الرجوع (bfcache) — زر الرجوع
               كيرجعها ف اللحظة وف نفس البلاصة. قبل: الرجوع كان كيعاود يحمل
               الصفحة كاملة (reload) وكيطلع لفوق. */
            if (push && !routable(location.pathname)) { location.href = url; return; }
            /* زر الرجوع: البلاصة المحفوظة كنقراوها دابا — من بعد، الـhub ديال
               الصفحة اللي خارجين منها يقدر يبدل history.state ف نفس الـpopstate */
            const savedY = !push && history.state && typeof history.state.deY === "number"
                ? history.state.deY : 0;
            if (link) preview(link);
            if (busy) {
                /* وسط التبديل (السكريبتات كتتحمل): بركة جديدة ولا زر الرجوع
                 * ما كيتهملوش. الآخرة كتربح وكتتنفذ ملي يسالي التبديل — على
                 * تيليفون بطيء هاد المدة كتوصل لثانية، والبركة كانت كتضيع. */
                queued = { url: url, push: push, link: link };
                return;
            }

            if (inflight) inflight.abort();
            const mine = ++seq;
            const ctrl = window.AbortController ? new AbortController() : null;
            inflight = ctrl;
            const timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, FETCH_LIMIT);
            herefile = fileOf(url);

            const bail = function () { location.href = url; };
            /* ضغطة أحدث تفوقات علينا: هي اللي كتكمل، حنا كنسكتو */
            const superseded = function () { return mine !== seq; };

            fetch(url, { credentials: "same-origin", signal: ctrl ? ctrl.signal : undefined })
                .then(function (res) {
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    return res.text();
                })
                .then(function (html) {
                    clearTimeout(timer);
                    if (superseded()) return;
                    if (inflight === ctrl) inflight = null;
                    busy = true;

                    const doc = new DOMParser().parseFromString(html, "text/html");
                    if (!doc || !doc.body) throw new Error("ما تقراش");

                    return addStyles(doc).then(function () {
                        /* البلاصة ف الصفحة كتتحفظ ف الـ history: زر الرجوع كيرجع ليها */
                        if (push) {
                            try {
                                history.replaceState(Object.assign({}, history.state, { deY: Math.round(window.scrollY) }), "");
                            } catch (e) { /* */ }
                            history.pushState({ de: url }, "", url);
                        }
                        const backY = savedY;

                        const root = document.documentElement;
                        const paint = function () {
                            /* الرجوع: الصفحة كتبقى طويلة كفاية باش نوقفو ف البلاصة
                               القديمة دغيا (اللائحة كتترسم من بعد السكريبتات) —
                               بلا ما تبان لفوق وترجع تنزل */
                            if (backY) root.style.minHeight = (backY + window.innerHeight) + "px";
                            const scripts = swap(doc);
                            window.scrollTo(0, backY);
                            return Promise.resolve(runScripts(scripts)).then(function () {
                                if (backY) holdPlace(backY);
                            }, function (e) { root.style.minHeight = ""; throw e; });
                        };

                        /* الرجوع: بلا حركة — الطالب كيعرف فين راجع، والحركة
                           كتبان بحال إلا الصفحة كتقلب */
                        if (!push) return paint();

                        /* المتصفح كياخد صورة قبل وبعد وكيمزج بيناتهم.
                           البار عندها view-transition-name ديالها، إذن
                           ما كتدخلش فالحركة — كتبقى واقفة. */
                        if (document.startViewTransition && !compact.matches
                            && !(window.matchMedia
                                 && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
                            /* إلا تقطعات الحركة (برك على رابط آخر، الصفحة
                               تخبات…) المحتوى كيتبدل عادي — غير كنسكتو
                               الـ promises اللي كيرفضو باش ما يبانوش خطأ. */
                            const vt = document.startViewTransition(paint);
                            const quiet = function () {};
                            vt.ready.catch(quiet);
                            vt.updateCallbackDone.catch(quiet);
                            return vt.finished.catch(quiet);
                        }
                        return paint();
                    }).then(function () {
                        busy = false;
                        if (queued) {
                            const next = queued;
                            queued = null;
                            go(next.url, next.push, next.link);
                        }
                    });
                })
                .catch(function (error) {
                    clearTimeout(timer);
                    if (superseded()) return;
                    console.warn("Router: رجعنا للتنقل العادي", error);
                    busy = false;
                    queued = null;
                    bail();
                });
        }

        /* برْكة على صفحة راك فيها = ماشي تنقل. بلا هادشي،
           المتصفح كيعاود يحمل نفس الصفحة — وهادا بالضبط
           الـ"refresh" اللي ماكانش خاصو يكون. */
        function here(link) {
            const target = link.getAttribute("href");
            if (!target) return false;
            const u = new URL(target, location.href);
            return u.pathname === location.pathname && u.search === location.search;
        }

        /* البار */
        nav.addEventListener("click", function (event) {
            const link = event.target.closest("a");
            if (!link) return;
            if (event.button || event.metaKey || event.ctrlKey
                || event.shiftKey || event.altKey) return;
            if (link.classList.contains("active") || here(link)) {
                event.preventDefault();
                return;
            }
            if (event.defaultPrevented || event.button
                || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (!routable(link.getAttribute("href"))) return;
            event.preventDefault();
            go(link.href, true, link);
        }, true);

        /* مبدّل المستوى */
        if (levelWrap) {
            levelWrap.addEventListener("click", function (event) {
                const link = event.target.closest("a");
                if (!link) return;
                if (event.button || event.metaKey || event.ctrlKey
                    || event.shiftKey || event.altKey) return;
                if (link.classList.contains("active") || here(link)) {
                    event.preventDefault();
                    return;
                }
                if (event.defaultPrevented || event.button
                    || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                if (!routable(link.getAttribute("href"))) return;
                event.preventDefault();
                go(link.href, true);
            }, true);
        }

        /* زر الرجوع: إلا تبدل اسم الصفحة كنعاودو نجيبوها.
           إلا تبدل غير ?thema= ولا ?teil=، كنخليو hub ديال
           القسم يتكلف بيه — ماشي شغلنا. */
        window.addEventListener("popstate", function () {
            const now = fileOf(location.pathname);
            if (now === herefile) return;

            /* Teil 1 ↔ Teil 3 مثلا: hub ديال Lesen كيتكلف */
            /* نفس المستوى برك (B1 ↔ B2 عندهم داتا مختلفة) */
            if (lesenFamily(now) && lesenFamily(now) === lesenFamily(herefile)) {
                herefile = now;
                return;
            }

            if (routable(location.pathname)) { go(location.href, false); return; }

            /* صفحة ماشي ف اللائحة (Hören Teil…): الرابط ديجا
               تبدل، إذن reload كيحمل الصفحة الصحيحة. */
            herefile = now;
            location.reload();
        });

        return true;
    }());

    /* الزر العايم ديال الوضع ماعندوش معنى وهاد الزر كاين */
    const floating = document.querySelector(".de-theme-btn.is-floating");
    if (floating) floating.remove();
    document.documentElement.classList.add("has-site-header");

    /* ---- الطول ديال البار ----

       البار ولات fixed، إذن كتخرج من التدفق. خاص الصفحة
       تعرف شحال تخلي ليها من فوق — و التبويبات (Teil 1/2/3)
       خاصها تعرف فين تلصق تحتيها. الطول كيتبدل مع العرض
       ديال الشاشة، إذن كنقيسوه بدل ما نكتبو رقم ثابت. */
    function measure() {
        const h = Math.round(header.getBoundingClientRect().height);
        if (h > 0) {
            document.documentElement.style.setProperty("--site-header-h", h + "px");
        }
    }

    measure();
    requestAnimationFrame(measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(header);

    /* ---- حالة الحساب ---- */
    /* Firebase كيبدا يتحمل دغيا (modulepreload)، فاش كتحل الصفحة، ماشي
       حتى يوصل الكود لهنا */
    const FB = "https://www.gstatic.com/firebasejs/12.18.0/";
    /* Firestore (178 KB) ماشي هنا: كيتحمل من بعد الصفحة (شوف fsReady) */
    ["firebase-app.js", "firebase-auth.js"].forEach(function (f) {
        try {
            if (document.head.querySelector('link[href="' + FB + f + '"]')) return;
            const link = document.createElement("link");
            link.rel = "modulepreload";
            link.href = FB + f;
            link.crossOrigin = "anonymous";
            document.head.appendChild(link);
        } catch (e) { /* غير تسريع */ }
    });
    (async function () {
        try {
            /* التلاتة ف نفس الوقت (قبل كانو واحد من بعد واحد: ثانية زايدة
               قبل ما يتعرف الحساب ويتحلو مواضيع Premium) */
            const mods = await Promise.all([FB + "firebase-app.js", FB + "firebase-auth.js"]
                .map(function (url) { return import(url); }));
            const appMod = mods[0], authMod = mods[1];
            let fsMod = null, db = null;

            const app = appMod.getApps().length
                ? appMod.getApp()
                : appMod.initializeApp({
                      apiKey: "AIzaSyBNxr0ZQrqa2F-RVyfoAC9r7_S49Cb2S4s",
                      authDomain: "sehrgothe.firebaseapp.com",
                      projectId: "sehrgothe",
                      storageBucket: "sehrgothe.firebasestorage.app",
                      messagingSenderId: "1066728503518",
                      appId: "1:1066728503518:web:b350728d7b20f1064d2a4f",
                      measurementId: "G-GKNEV0ZQV5"
                  });

            const auth = authMod.getAuth(app);

            /* lesen-premium.js كيحتاج الـ ID token باش يجيب المواضيع
               المدفوعة من الـ Worker. كنعطيوه auth عوض ما يعاود يحمل
               Firebase من جديد. */
            window.__sehrgutAuth = auth;

            /* Firestore هو أثقل ملف ف الموقع (178 KB). ماخاصوش باش يبان
               الموضوع (الحساب من Auth، والمحتوى من Cloudflare)، إذن كيتحمل
               من بعد ما تكمل الصفحة — ف الأنترنت الضعيفة، المحتوى كياخد
               الشبكة بوحدو بلا ما يتقاسمها معاه. */
            /* كيبدا: 2.5 ثانية من بعد load (الوقت باش يوصل المحتوى)، ولا
               دغيا إلا الحساب ما معروفش (أول دخول) — التأكد من الاشتراك
               كيحتاجو. */
            let kickFs = null;
            const fsGate = new Promise(function (done) { kickFs = done; });
            /* assets/diag.js: من بعد ما يبان المحتوى (ولا 2.5 ث من بعد load) */
            if (window.__deAfterContent) window.__deAfterContent(kickFs);
            else setTimeout(kickFs, 2500);
            const fsReady = fsGate.then(function () {
                return import(FB + "firebase-firestore.js");
            }).then(function (mod) {
                fsMod = mod;
                db = mod.getFirestore(app);
                /* الكلمات المفتاحية ديال الأدمين (assets/kw-custom.js) كيقراو
                   ويكتبو ف Firestore بنفس الاتصال */
                window.__deFirebase = { fs: fsMod, db: db };
                document.dispatchEvent(new CustomEvent("de-firebase"));
                news.start(fsMod, db);
                return mod;
            });
            fsReady.catch(function (e) { console.warn("Header: Firestore ما تحملش", e); });

            authMod.onAuthStateChanged(auth, async function (person) {
                if (!person) {
                    /* خرج بصح — كنمسحو الذاكرة باش المرة الجاية
                       ما نرسموش ليه حساب ماكاينش. */
                    remember(null);
                    news.setUser(null);
                    news.setAdmin(false);
                    setAdmin(false);
                    guest.hidden = false;
                    account.hidden = true;
                    openMenu(false);
                    window.__sehrgutIsPremium = false;
                    /* زائر بلا حساب: إعلانات إلا الجهاز ماشي مغربي */
                    if (window.__sehrgutAds && window.__sehrgutRegion) {
                        window.__sehrgutAds.render(!window.__sehrgutRegion.looksMoroccan(window.__sehrgutRegion.hint()));
                    }
                    setPremiumState("ok");
                    document.dispatchEvent(new CustomEvent("de-premium", { detail: false }));
                    return;
                }

                guest.hidden = true;
                account.hidden = false;
                news.setUser(person.uid);

                let name = person.displayName
                    || (person.email || "").split("@")[0]
                    || "Student";
                let premium = false;
                let admin = false;
                let failed = false;

                /* البلاد (assets/region.js) كتتسول ف نفس الوقت ديال Firestore */
                const regionRun = window.__sehrgutRegion
                    ? window.__sehrgutRegion.check(person)
                    : Promise.resolve({ free: false });

                /* القراية ديال الحساب. أنترنت ضعيفة = كتطيح مرة مرة،
                   إذن كنعاودو جوج مرات قبل ما نقولو «مشكل ف الأنترنت». */
                async function readUser() {
                    for (let attempt = 0; ; attempt++) {
                        try {
                            return await fsMod.getDoc(fsMod.doc(db, "users", person.uid));
                        } catch (error) {
                            if (attempt >= 2) throw error;
                            await new Promise(function (go) { setTimeout(go, 1500 * (attempt + 1)); });
                        }
                    }
                }
                /* الأدمين عطاه كلمة سر مؤقتة (admin.html): خاصو يبدلها بديالو.
                   نافذة ما كتسدش حتى يبدلها (ولا يخرج من الحساب). */
                function askNewPassword() {
                    if (document.getElementById("de-newpw")) return;
                    const back = document.createElement("div");
                    back.id = "de-newpw";
                    back.setAttribute("role", "dialog");
                    back.setAttribute("aria-modal", "true");
                    back.style.cssText = "position:fixed;inset:0;z-index:2147483600;background:rgba(15,10,12,.6);display:flex;align-items:center;justify-content:center;padding:16px";
                    back.innerHTML =
                        '<form dir="rtl" style="width:min(420px,100%);background:#fff;color:#1c1a16;border-radius:20px;padding:22px 22px 18px;box-shadow:0 30px 80px rgba(0,0,0,.4);font-family:Cairo,system-ui,sans-serif">' +
                        '<h2 style="margin:0 0 6px;font-size:20px;font-weight:900">🔑 ختار كلمة سر جديدة</h2>' +
                        '<p style="margin:0 0 14px;color:#5e584c;font-size:14px;line-height:1.7">دخلتي بكلمة سر مؤقتة. كتب وحدة ديالك (8 حروف على الأقل) وحفظها مزيان.</p>' +
                        '<input type="password" autocomplete="new-password" minlength="8" required placeholder="كلمة السر الجديدة" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1.5px solid #ddd;border-radius:12px;font:inherit;font-size:16px;margin-bottom:10px;direction:ltr;text-align:left">' +
                        '<input type="password" autocomplete="new-password" minlength="8" required placeholder="عاود كتبها" style="width:100%;box-sizing:border-box;padding:12px 14px;border:1.5px solid #ddd;border-radius:12px;font:inherit;font-size:16px;margin-bottom:12px;direction:ltr;text-align:left">' +
                        '<p class="msg" style="margin:0 0 10px;font-size:13.5px;font-weight:700;min-height:1em"></p>' +
                        '<button type="submit" style="width:100%;border:0;border-radius:14px;padding:13px;background:#8a0f2b;color:#fff;font:inherit;font-weight:900;font-size:16px;cursor:pointer">حفظ</button>' +
                        '<button type="button" class="out" style="width:100%;border:0;background:transparent;color:#8a8f9c;font:inherit;font-size:13px;margin-top:8px;cursor:pointer">خروج من الحساب</button>' +
                        '</form>';
                    document.body.appendChild(back);
                    const form = back.querySelector("form");
                    const inputs = form.querySelectorAll("input");
                    const msg = form.querySelector(".msg");
                    const say = function (text, ok) { msg.textContent = text; msg.style.color = ok ? "#1e7d3a" : "#b42318"; };
                    inputs[0].focus();
                    form.querySelector(".out").addEventListener("click", function () {
                        authMod.signOut(auth).then(function () { location.href = "login.html"; });
                    });
                    form.addEventListener("submit", async function (event) {
                        event.preventDefault();
                        const pw = inputs[0].value;
                        if (pw.length < 8) { say("8 حروف على الأقل."); return; }
                        if (pw !== inputs[1].value) { say("الجوج ماشي بحال بحال."); return; }
                        if (/^Deutsch-\d{4}-[a-z]{2}$/.test(pw)) { say("هادي هي المؤقتة — كتب وحدة جديدة ديالك."); return; }
                        const btn = form.querySelector("button[type=submit]");
                        btn.disabled = true;
                        try {
                            await authMod.updatePassword(auth.currentUser, pw);
                            if (fsMod && db) {
                                await fsMod.updateDoc(fsMod.doc(db, "users", person.uid), { mustChangePassword: false })
                                    .catch(function () { /* المرة الجاية */ });
                            }
                            say("✓ تبدلات. استعملها ف المرة الجاية.", true);
                            setTimeout(function () { back.remove(); }, 1400);
                        } catch (e) {
                            btn.disabled = false;
                            say(e && e.code === "auth/requires-recent-login"
                                ? "خرج من الحساب ودخل بكلمة السر المؤقتة، ومن بعد بدلها."
                                : e && e.code === "auth/weak-password" ? "ضعيفة بزاف — زيد أرقام وحروف."
                                : "ما تبدلاتش: " + ((e && e.code) || e));
                        }
                    });
                }

                /* التصريح ديال الاستعمال بلا أنترنت: حتى لنهاية الاشتراك (ولا 7 أيام).
                   ماشي مشترك → كنمسحو المحتوى المدفوع من التيليفون. */
                function grantOffline(data, isPremium) {
                    const pass = window.__deOfflinePass;
                    if (!pass) return;
                    if (isPremium) {
                        const end = data.subscriptionEnd && data.subscriptionEnd.toDate
                            ? data.subscriptionEnd.toDate().getTime() : 0;
                        pass.grant(person.uid, end);
                    } else {
                        pass.revoke(person.uid);
                    }
                }
                function isActive(data) {
                    const notExpired = !data.subscriptionEnd
                        || (data.subscriptionEnd.toDate
                            && data.subscriptionEnd.toDate().getTime() > Date.now());
                    return data.subscriptionActive === true && notExpired;
                }

                try {
                    const known = recall();
                    if (!known || known.uid !== person.uid) kickFs();
                    await fsReady;
                    const snap = await readUser();
                    if (snap.exists()) {
                        const data = snap.data();
                        if (data.name) name = data.name;
                        premium = isActive(data);
                        grantOffline(data, premium);
                        if (data.mustChangePassword === true) askNewPassword();
                        admin = data.isAdmin === true;
                        news.setAdmin(admin);
                        setAdmin(admin);
                        /* وثيقة ناقصة (تخلقات من login بلا createdAt/email) */
                        if (!data.createdAt || !data.email) repairUser(data);
                    } else {
                        /* حساب ف Auth بلا وثيقة ف users (التسجيل طاح قبل) */
                        repairUser(null);
                    }

                    function repairUser(old) {
                        const fix = {};
                        if (!old || !old.email) fix.email = person.email || "";
                        if (!old || !old.name) fix.name = (old && old.displayName) || name;
                        if (!old || !old.createdAt) {
                            const born = person.metadata && person.metadata.creationTime
                                ? new Date(person.metadata.creationTime) : new Date();
                            fix.createdAt = fsMod.Timestamp.fromDate(born);
                        }
                        if (!old) { fix.plan = "free"; fix.subscriptionActive = false; fix.subscriptionEnd = null; }
                        fsMod.setDoc(fsMod.doc(db, "users", person.uid), fix, { merge: true })
                            .catch(function (e) { console.warn("Header: ماصلحناش الوثيقة", e && e.code); });
                    }
                } catch (error) {
                    console.warn("Header: ما قدرناش نقراو الحساب", error);
                    /* ماشي «ماشي مشترك» — ما عرفناش. كنخليو آخر حالة
                       معروفة لنفس الحساب، وما كنكتبوش فوقها. المحتوى
                       المدفوع على كل حال كيتحقق منو الـWorker. */
                    failed = true;
                    const known = recall();
                    if (known && known.uid === person.uid) {
                        /* بلا أنترنت: غير إلا التصريح باقي صالح */
                        premium = known.premium === true && passOk(person.uid);
                        if (known.premium === true && !premium && window.__deDiag && window.__deOfflinePass) {
                            window.__deDiag("error", "Premium بلا أنترنت تسد: " + window.__deOfflinePass.why(person.uid));
                        }
                        if (known.name) name = known.name;
                    }
                }

                /* برا المغرب: كلشي مجاني (مع إعلانات). المشترك ما كيشوفش إعلانات. */
                const subscribed = premium;
                let regionFree = false;
                try { regionFree = (await regionRun).free === true; } catch (e) { /* */ }
                if (regionFree) premium = true;
                if (window.__sehrgutAds) window.__sehrgutAds.render(regionFree && !subscribed);

                window.__sehrgutIsPremium = premium;

                /* باش المرة الجاية البار تبان صحيحة من أول رسمة */
                if (!failed) remember({ name: name, premium: premium, uid: person.uid });

                paint(name, premium);
                buildMenu(person, name, premium);
                setPremiumState(failed ? "error" : "ok", true);

                /* صفحات فيها محتوى مقفول كتسنى هاد الخبر */
                document.dispatchEvent(new CustomEvent("de-premium", { detail: premium }));

                /* طاحت القراية؟ كنعاودو بوحدنا ملي يرجع الاتصال (ولا كل
                   20 ثانية، 6 دالمرات) — بلا ما يحتاج المستعمل يبدل الصفحة. */
                if (failed) {
                    let tries = 0, busy = false, timer = 0;
                    const again = async function () {
                        if (busy || window.__dePremiumState !== "error") return;
                        if (!auth.currentUser || auth.currentUser.uid !== person.uid) return;
                        busy = true;
                        try {
                            const snap = await fsMod.getDoc(fsMod.doc(db, "users", person.uid));
                            const data = snap.exists() ? snap.data() : {};
                            if (data.name) name = data.name;
                            premium = isActive(data);
                            grantOffline(data, premium);
                            window.__sehrgutIsPremium = premium;
                            remember({ name: name, premium: premium, uid: person.uid });
                            paint(name, premium);
                            buildMenu(person, name, premium);
                            window.removeEventListener("online", again);
                            clearInterval(timer);
                            setPremiumState("ok");
                            document.dispatchEvent(new CustomEvent("de-premium", { detail: premium }));
                        } catch (error) {
                            if (++tries >= 6) { clearInterval(timer); window.removeEventListener("online", again); }
                        }
                        busy = false;
                    };
                    window.addEventListener("online", again);
                    timer = setInterval(again, 20000);
                }

                /* ---- القائمة ---- */
                function buildMenu(who, label, isPremium) {
                    menu.textContent = "";

                    /* الرأس: الاسم والإيميل */
                    const head = document.createElement("div");
                    head.className = "site-menu-head";

                    const big = document.createElement("span");
                    big.className = "site-avatar site-avatar-lg";
                    big.textContent = label.trim().charAt(0).toUpperCase() || "?";

                    const who2 = document.createElement("span");
                    who2.className = "site-menu-who";

                    const nameEl = document.createElement("strong");
                    nameEl.textContent = label;
                    const mailEl = document.createElement("span");
                    mailEl.textContent = who.email || "";
                    who2.append(nameEl, mailEl);

                    head.append(big, who2);
                    menu.appendChild(head);

                    if (!isPremium) {
                        const up = document.createElement("a");
                        up.className = "site-menu-item site-menu-up";
                        up.href = "payment.html";
                        up.append(icon("star"),
                                  document.createTextNode("ترقّى لـ Premium"));
                        menu.appendChild(up);
                    }

                    /* تبديل الاسم والنسب */
                    const rename = item("user", "بدّل الاسم والنسب");
                    menu.appendChild(rename);

                    const form = document.createElement("form");
                    form.className = "site-menu-form";
                    form.hidden = true;

                    const input = document.createElement("input");
                    input.type = "text";
                    input.className = "site-menu-input";
                    input.value = label;
                    input.maxLength = 60;
                    input.autocomplete = "name";
                    input.setAttribute("aria-label", "الاسم والنسب");

                    const save = document.createElement("button");
                    save.type = "submit";
                    save.className = "site-menu-save";
                    save.textContent = "حفظ";

                    const note = document.createElement("p");
                    note.className = "site-menu-note";
                    note.hidden = true;

                    form.append(input, save, note);
                    menu.appendChild(form);

                    rename.addEventListener("click", function () {
                        form.hidden = !form.hidden;
                        rename.classList.toggle("is-open", !form.hidden);
                        if (!form.hidden) { input.focus(); input.select(); }
                    });

                    form.addEventListener("submit", async function (event) {
                        event.preventDefault();

                        const next = input.value.trim().replace(/\s+/g, " ");
                        if (!next) {
                            say("عافاك كتب الاسم ديالك.", true);
                            return;
                        }
                        if (next === label) { form.hidden = true; return; }

                        save.disabled = true;
                        save.textContent = "…";

                        try {
                            await fsMod.setDoc(
                                fsMod.doc(db, "users", who.uid),
                                { name: next },
                                { merge: true });
                            try {
                                await authMod.updateProfile(who, { displayName: next });
                            } catch (error) { /* Firestore هو المرجع */ }

                            paint(next, isPremium);
                            nameEl.textContent = next;
                            big.textContent = next.charAt(0).toUpperCase();
                            say("تبدل الاسم ديالك.", false);
                            setTimeout(function () {
                                form.hidden = true;
                                rename.classList.remove("is-open");
                                note.hidden = true;
                            }, 1200);
                        } catch (error) {
                            console.warn("Header: ما تبدلش الاسم", error);
                            say("ما قدرناش نحفظو. عاود جرب.", true);
                        }

                        save.disabled = false;
                        save.textContent = "حفظ";
                    });

                    function say(text, bad) {
                        note.textContent = text;
                        note.hidden = false;
                        note.classList.toggle("is-bad", !!bad);
                    }

                    /* لوحة الإدارة: غير للأدمين */
                    if (admin) {
                        const adm = document.createElement("a");
                        adm.className = "site-menu-item";
                        adm.setAttribute("role", "menuitem");
                        adm.href = "admin.html";
                        adm.append(icon("star"), document.createTextNode("لوحة الإدارة (الاشتراكات)"));
                        menu.appendChild(adm);
                    }

                    /* تحميل التطبيق: نافذة «ثبت كتطبيق» (assets/app-install.js) */
                    const standaloneApp = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
                    if (!standaloneApp) {
                        const app = item("app", "تحميل التطبيق");
                        app.addEventListener("click", function () {
                            openMenu(false);
                            if (window.__deApp && window.__deApp.install) { window.__deApp.install(); return; }
                            const script = document.createElement("script");
                            script.src = "assets/app-install.js";
                            script.onload = function () { if (window.__deApp && window.__deApp.install) window.__deApp.install(); };
                            document.head.appendChild(script);
                        });
                        menu.appendChild(app);
                    }

                    /* تسجيل الخروج */
                    const out = item("out", "تسجيل الخروج");
                    out.classList.add("site-menu-out");
                    out.addEventListener("click", async function () {
                        out.disabled = true;
                        try {
                            /* نمسحو الذاكرة قبل ما نمشيو — وإلا
                               index.html كتبدا برسم حساب خارج. */
                            remember(null);
                            await authMod.signOut(auth);
                            location.href="./";
                        } catch (error) {
                            console.warn("Header: ما خرجناش", error);
                            out.disabled = false;
                        }
                    });
                    menu.appendChild(out);
                }

                function item(kind, label) {
                    const node = document.createElement("button");
                    node.type = "button";
                    node.className = "site-menu-item";
                    node.setAttribute("role", "menuitem");
                    node.append(icon(kind), document.createTextNode(label));
                    return node;
                }

                function icon(kind) {
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute("viewBox", "0 0 24 24");
                    svg.setAttribute("class", "site-menu-icon");
                    svg.setAttribute("aria-hidden", "true");
                    svg.setAttribute("fill", "none");
                    svg.setAttribute("stroke", "currentColor");
                    svg.setAttribute("stroke-width", "1.8");
                    svg.setAttribute("stroke-linecap", "round");
                    svg.setAttribute("stroke-linejoin", "round");

                    const paths = {
                        user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"],
                        out:  ["M15 17l5-5-5-5", "M20 12H9", "M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"],
                        app:  ["M12 4v11", "M7 10l5 5 5-5", "M5 20h14"],
                        star: ["M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"]
                    };

                    (paths[kind] || []).forEach(function (d) {
                        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        path.setAttribute("d", d);
                        svg.appendChild(path);
                    });
                    return svg;
                }
            });
        } catch (error) {
            console.warn("Header: Firebase ما تحملش", error);
            setPremiumState("error");

            /* كان هنا غير `guest.hidden = false` — بلا ما يخبي
               الحساب. النتيجة: البار كتبين الزوج ف نفس الوقت،
               الاسم ديال المستعمل *و* «تسجيل الدخول».

               وزيادة: ماقدرناش نتحققو من شكون داخل، إذن إلا
               كانت عندنا آخر حالة معروفة كنخليوها — أحسن من
               نوريو «تسجيل الدخول» لواحد داخل ومشترك. */
            if (recall()) {
                guest.hidden = true;
                account.hidden = false;
            } else {
                guest.hidden = false;
                account.hidden = true;
            }
        }
    })();

    /* ================= الجرس ديال الجديد =================
       - الكل كيقرا news (حتى الضيف). كنخبيو اللائحة فالمتصفح 20 دقيقة
         باش ما نقراوش Firestore ف كل صفحة (الخطة المجانية).
       - الرقم الأحمر = الأخبار اللي تنشرات من بعد آخر مرة حل فيها الجرس.
       - الأدمين كيشوف فوق اللائحة فورم «زيد إشعار» و✕ باش يمسح. */
    function newsBell() {
        const CACHE = "de-news-cache";
        const SEEN = "de-news-seen";
        const TTL = 30 * 60 * 1000;
        const DAY = 24 * 3600 * 1000;

        let fs = null, db = null, items = [], admin = false, loaded = false;

        const root = document.createElement("div");
        root.className = "site-news-wrap";

        const bell = document.createElement("button");
        bell.type = "button";
        bell.className = "site-btn site-btn-icon site-bell";
        bell.setAttribute("aria-label", "الإشعارات");
        bell.setAttribute("aria-expanded", "false");
        bell.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" '
            + 'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            + '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
        const dot = document.createElement("span");
        dot.className = "site-bell-dot";
        dot.hidden = true;
        bell.appendChild(dot);

        const panel = document.createElement("div");
        panel.className = "site-news";
        panel.hidden = true;

        root.append(bell, panel);

        function store(key, value) {
            try { localStorage.setItem(key, value); } catch (e) { /* وضع خاص */ }
        }
        function read(key) {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        }
        /* «شفتهم» كيتحفظ لكل حساب بوحدو (ماشي للمتصفح كامل): إلا دخل
           حساب آخر فنفس المتصفح كيشوف النقطة الحمرا ديالو.
           أول مرة (حتى للزائر الجديد): الأخبار ديال آخر 14 يوم كتبان جديدة. */
        /* الحساب ديال آخر مرة: بلا هادشي، ف كل refresh كان «guest» حتى
           يجاوب Firebase → النقطة كتبان برقم ومن بعد كتختفى. */
        let who = "guest", whoKnown = true;
        try {
            const lastAcc = JSON.parse(read("sehrgutLastAccount") || "null");
            if (lastAcc && lastAcc.name) {
                if (lastAcc.uid) who = lastAcc.uid;
                else whoKnown = false;   /* كاش قديم بلا uid: نتسناو Firebase */
            }
        } catch (e) { /* كاش خايب */ }
        const FRESH = 14 * 86400000;
        function seenKey() { return SEEN + ":" + who; }
        function seenAt() {
            const v = Number(read(seenKey()));
            return v || (Date.now() - FRESH);
        }

        try {
            const cached = JSON.parse(read(CACHE) || "null");
            if (cached && Array.isArray(cached.items)) { items = cached.items; loaded = true; }
        } catch (e) { /* كاش خايب */ }
        paintDot();

        function paintDot() {
            const seen = seenAt();
            const fresh = whoKnown ? items.filter(function (n) { return n.at > seen; }).length : 0;
            dot.hidden = !fresh;
            dot.textContent = fresh > 9 ? "9+" : String(fresh);
            bell.classList.toggle("has-news", !!fresh);
        }

        function when(ms) {
            const d = Math.floor((Date.now() - ms) / 86400000);
            if (d <= 0) return "اليوم";
            if (d === 1) return "البارح";
            if (d < 30) return "قبل " + d + " أيام";
            return new Date(ms).toLocaleDateString("fr-MA");
        }

        function el(tag, cls, text) {
            const n = document.createElement(tag);
            if (cls) n.className = cls;
            if (text !== undefined) n.textContent = text;
            return n;
        }

        function paint() {
            panel.textContent = "";
            const head = el("div", "site-news-head");
            head.appendChild(el("strong", "", "الجديد فالموقع"));
            panel.appendChild(head);

            if (admin) panel.appendChild(form());

            if (!loaded) { panel.appendChild(el("p", "site-news-empty", "كنجيبو الجديد…")); return; }
            if (!items.length) { panel.appendChild(el("p", "site-news-empty", "ماكاين حتى جديد دابا.")); return; }

            const seen = Number(panel.dataset.seen || 0);
            const list = el("div", "site-news-list");
            items.forEach(function (n) {
                const item = el("article", "site-news-item" + (n.at > seen ? " is-new" : ""));
                const top = el("div", "site-news-top");
                top.appendChild(el("strong", "site-news-title", n.title));
                top.appendChild(el("span", "site-news-date", when(n.at)));
                item.appendChild(top);
                if (n.body) item.appendChild(el("p", "site-news-body", n.body));
                if (n.link && /^(https?:\/\/|[a-z0-9-]+\.html)/i.test(n.link)) {
                    const a = el("a", "site-news-link", "شوف ←");
                    a.href = n.link;
                    item.appendChild(a);
                }
                if (admin) {
                    const del = el("button", "site-news-del", "✕");
                    del.type = "button";
                    del.title = "مسح";
                    del.addEventListener("click", async function () {
                        if (!confirm("نمسحو هاد الإشعار؟")) return;
                        try {
                            await fs.deleteDoc(fs.doc(db, "news", n.id));
                            await refresh(true);
                        } catch (e) { alert("ماقدرناش نمسحوه: " + (e.code || e.message)); }
                    });
                    item.appendChild(del);
                }
                list.appendChild(item);
            });
            panel.appendChild(list);
        }

        function form() {
            const box = el("form", "site-news-form");
            const title = el("input", "site-menu-input");
            title.placeholder = "العنوان (مثلا: زدنا 10 مواضيع Schreiben B1)";
            title.maxLength = 120;
            title.required = true;
            const body = el("textarea", "site-menu-input site-news-text");
            body.placeholder = "التفاصيل (اختياري)";
            body.maxLength = 1000;
            body.rows = 3;
            const link = el("input", "site-menu-input");
            link.placeholder = "رابط (اختياري): b1-sprechen.html";
            link.maxLength = 300;
            link.dir = "ltr";
            const send = el("button", "site-menu-save", "نشر الإشعار");
            send.type = "submit";
            const note = el("p", "site-menu-note");
            box.append(el("span", "site-news-form-label", "✍️ إشعار جديد (غير نتا كتشوف هادي)"), title, body, link, send, note);

            box.addEventListener("submit", async function (event) {
                event.preventDefault();
                const data = { title: title.value.trim(), createdAt: fs.serverTimestamp() };
                if (!data.title) return;
                if (body.value.trim()) data.body = body.value.trim();
                if (link.value.trim()) data.link = link.value.trim();
                send.disabled = true;
                note.textContent = "كنشرو…";
                try {
                    await fs.addDoc(fs.collection(db, "news"), data);
                    /* اللي كتب الخبر ماخاصوش يشوف النقطة الحمرا عليه */
                    store(seenKey(), String(Date.now() + 5000));
                    await refresh(true);
                } catch (e) {
                    send.disabled = false;
                    note.textContent = "ماتنشرش: " + (e.code || e.message)
                        + " — واش القواعد ديال Firestore محدثة؟";
                }
            });
            return box;
        }

        /* القراية ديال Firestore محسوبة (50.000 فالنهار فالخطة المجانية)
           وكل زائر كيشوف الجرس. إذن:
           - كل 30 دقيقة: كنقراو غير آخر خبر (قراءة وحدة). إلا هو نفسو
             اللي عندنا، الكاش صالح وماكنقراو والو آخر.
           - اللائحة كاملة (10) غير ملي يتزاد خبر جديد، ولا مرة فالنهار
             (باش الخبر اللي تمسح يغبر حتى هو). */
        async function refresh(force) {
            if (!fs) return;
            let cached = null;
            try { cached = JSON.parse(read(CACHE) || "null"); } catch (e) { cached = null; }
            const age = cached ? Date.now() - cached.t : Infinity;
            const fullAge = cached ? Date.now() - (cached.full || 0) : Infinity;
            if (!force && age < TTL) return;
            const col = fs.collection(db, "news");
            try {
                if (!force && cached && Array.isArray(cached.items) && fullAge < DAY) {
                    const top = await fs.getDocs(fs.query(col, fs.orderBy("createdAt", "desc"), fs.limit(1)));
                    const newest = top.docs[0] ? top.docs[0].id : null;
                    const known = cached.items[0] ? cached.items[0].id : null;
                    if (newest === known) {
                        cached.t = Date.now();
                        store(CACHE, JSON.stringify(cached));
                        loaded = true;
                        return;
                    }
                }
                const snap = await fs.getDocs(fs.query(col, fs.orderBy("createdAt", "desc"), fs.limit(10)));
                items = snap.docs.map(function (d) {
                    const v = d.data();
                    return {
                        id: d.id,
                        title: String(v.title || ""),
                        body: String(v.body || ""),
                        link: String(v.link || ""),
                        at: v.createdAt && v.createdAt.toMillis ? v.createdAt.toMillis() : Date.now()
                    };
                });
                loaded = true;
                store(CACHE, JSON.stringify({ t: Date.now(), full: Date.now(), items: items }));
            } catch (e) {
                console.warn("Header: ماقدرناش نجيبو الإشعارات", e);
                loaded = true;
            }
            paintDot();
            if (!panel.hidden) paint();
        }

        function open(show) {
            if (show) {
                /* كنحفظو شنو كان جديد قبل ما نعلمو عليه مشاف، باش يبان مميز */
                panel.dataset.seen = String(seenAt());
                paint();
                const newest = items.reduce(function (m, n) { return Math.max(m, n.at); }, 0);
                store(seenKey(), String(Math.max(Date.now(), newest)));
                paintDot();
                refresh(false);
            }
            panel.hidden = !show;
            root.classList.toggle("is-open", show);
            bell.setAttribute("aria-expanded", show ? "true" : "false");
        }

        bell.addEventListener("click", function () { open(panel.hidden); });
        /* capture: زر الحساب كيوقف الـclick، وخاص الجرس يتسد حتى ملي كيتحل الحساب */
        document.addEventListener("click", function (event) {
            if (!root.contains(event.target) && !panel.hidden) open(false);
        }, true);
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") open(false);
        });

        return {
            root: root,
            start: function (fsMod, database) {
                fs = fsMod;
                db = database;
                refresh(false);
            },
            setUser: function (uid) {
                who = uid || "guest";
                whoKnown = true;
                paintDot();
            },
            setAdmin: function (value) {
                if (admin === value) return;
                admin = value;
                if (!panel.hidden) paint();
            }
        };
    }
})();

/* ===== تنضيف Service Worker قديم =====

   الموقع كان فيه PWA كيسجل /sw.js. داك الملف تحيد، ولكن
   اللي زار الموقع من قبل ما زال داك الـ worker مركّب عندو
   وكيتحكم فالصفحات — يعني كيقدر يعطيه نسخ قدام حتى من بعد
   Ctrl+Shift+R، حيت هو اللي كيجاوب قبل الشبكة.

   كنحيدو أي worker ماشي ديال الإشعارات، وكنمسحو Cache Storage.
   firebase-messaging-sw.js كيبقى — الإشعارات كتحتاجو. */

(function () {
    "use strict";

    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then(function (regs) {
        let removed = 0;

        regs.forEach(function (reg) {
            const worker = reg.active || reg.waiting || reg.installing;
            const url = worker ? worker.scriptURL : "";
            if (url.indexOf("firebase-messaging-sw.js") !== -1) return;
            removed++;
            reg.unregister();
        });

        if (!removed || !window.caches || !caches.keys) return;

        /* الـ worker القديم خلا وراه ملفات مخزنة — خاصهم يمشيو حتى هوما */
        caches.keys().then(function (names) {
            return Promise.all(names.map(function (name) { return caches.delete(name); }));
        }).then(function () {
            /* تحميلة وحدة بلا worker باش الزائر يشوف النسخة الجديدة دغيا */
            if (!sessionStorage.getItem("de-sw-cleaned")) {
                sessionStorage.setItem("de-sw-cleaned", "1");
                location.reload();
            }
        }).catch(function () { /* الوضع الخاص كيمنع caches — ماشي مشكل */ });
    }).catch(function () { /* ماكاين باس */ });
})();

/* ===== الصفحة كتعرف بوحدها إلا كانت قديمة =====

   الملفات ديال assets عندهم ?v=<بصمة>، إذن ملي كتبدل شي ملف
   المتصفح كيجيب الجديد. ولكن صفحة HTML بوحدها ماعندهاش ?v=،
   والمتصفح كيخزنها. إذن كتبقى الصفحة القديمة كتطلب الملفات
   القدام — ومنو كيبان "ما زال ماكاينش تمارين" على موضوع
   راه مدفوع.

   الحل: version.json كيتجاب ديما من الشبكة. إلا كانت البصمات
   اللي فالصفحة مخالفة لللي فيه، كنعاودو نحملو الصفحة برابط
   فيه ?_v=<build> — رابط جديد، إذن المتصفح مايقدرش يعطينا
   النسخة المخزنة. ومن بعد كنمسحو _v من الرابط باش يبقى نقي.

   sessionStorage كيمنع التكرار: كل build كيتعاود مرة وحدة. */

(function () {
    "use strict";

    /* نمسحو _v من الرابط — كان غير باش نكسرو الكاش */
    try {
        const here = new URL(location.href);
        if (here.searchParams.has("_v")) {
            here.searchParams.delete("_v");
            history.replaceState(history.state, "", here.pathname + here.search + here.hash);
        }
    } catch (error) { /* متصفح قديم — ماشي مشكل */ }

    /* هاد الملف كيتحمل قبل باقي الـ <script> ديال الصفحة، إذن
       ف هاد اللحظة ما زال ماكاينينش فالـ DOM وماغاديش نشوفو
       البصمات ديالهم. خاصنا نتسناو حتى تسالي قراءة الصفحة. */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", check);
    } else {
        check();
    }

    function check() {

    const stamped = Array.prototype.slice
        .call(document.querySelectorAll("script[src], link[href]"))
        .map(function (node) { return node.getAttribute("src") || node.getAttribute("href"); })
        .filter(function (url) { return url && /^assets\/[^?]+\?v=[0-9a-f]+$/.test(url); });

    if (!stamped.length || typeof fetch !== "function") return;

    fetch("version.json?t=" + Date.now(), { cache: "no-store" })
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (manifest) {
            if (!manifest || !manifest.assets || !manifest.build) return;

            const stale = stamped.some(function (url) {
                const parts = url.split("?v=");
                const fresh = manifest.assets[parts[0]];
                return fresh && fresh !== parts[1];
            });
            if (!stale) return;

            /* عاودناها من قبل لهاد الـ build؟ ما نبقاوش ندورو. */
            try {
                if (sessionStorage.getItem("de-build") === manifest.build) return;
                sessionStorage.setItem("de-build", manifest.build);
            } catch (error) { return; }

            const next = new URL(location.href);
            next.searchParams.set("_v", manifest.build);
            location.replace(next.toString());
        })
        .catch(function () { /* ماكاين لا شبكة لا ملف — الصفحة كتبقى خدامة */ });

    }
})();
