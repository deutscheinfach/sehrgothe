/* ===== لوحة Premium =====

   عوض سطر جاف "هاد الموضوع ديال Premium"، كنبنيو لوحة كاملة:
   قفل، شنو كيربح الطالب، وزر للعروض. ونحطو تحتها نموذج مغبّش
   من التمرين باش يشوف شنو كاين — بلا ما يقدر يقراه.

   الاستعمال:  window.__premiumGate(into, { title: "…" })
*/

(function () {
    "use strict";

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    /* عدد المواضيع كيتحسب من اللائحة، والجزء كيتبدل مع الصفحة —
       باش ما نبقاوش نكتبو "Teil 1" ف بلاصة كيهضر فيها على Teil 3. */
    function perks() {
        const part = (new URLSearchParams(location.search).get("teil"))
            || (location.pathname.match(/-(teil\d|sprach\d)\.html$/) || [])[1]
            || "teil1";
        const label = "Teil " + part.replace(/\D+/g, "");
        const topics = window.LESEN_B2_TOPICS || window.LESEN_B1_TOPICS || [];
        const count = topics.filter(function (t) {
            return !t.parts || t.parts.indexOf(part) !== -1;
        }).length;

        return [
            (count || "") + " موضوع ف Leseverstehen " + label,
            "نسخ متعددة لكل موضوع — نفس النص بترويسات مختلفة",
            "ملخص بالدارجة لكل نص",
            "تصحيح فوري مع الحلول"
        ];
    }

    /* ماشي مشكل اشتراك، مشكل اتصال: الحساب ما تأكدش (الأنترنت)، ولا
       المشترك ما وصلوش المحتوى. «شوف العروض» هنا كيغلّط المشترك. */
    function soonCard(into, config) {
        if (window.__deDiag) window.__deDiag("fail", "محتوى ناقص ف KV: " + (config.key || config.title || "?"));
        const card = el("section", "pg");
        const head = el("div", "pg-head");
        const badge = el("span", "pg-lock", "⏳");
        badge.setAttribute("aria-hidden", "true");
        head.appendChild(badge);
        const titles = el("div", "pg-titles");
        titles.appendChild(el("h2", "pg-title", "هاد الموضوع كنوجدوه دابا"));
        titles.appendChild(el("p", "pg-lead",
            "المحتوى ديال هاد الجزء ما زال ما تزادش — قريباً. جرب موضوع آخر ف الوقت الحاضر."));
        head.appendChild(titles);
        card.appendChild(head);
        into.appendChild(card);
    }

    function netCard(into) {
        if (window.__deDiag) window.__deDiag("fail", "بان «ما قدرناش نجيبو هاد الموضوع» (" + (window.__dePremiumState || "?") + ")");
        const card = el("section", "pg");
        const head = el("div", "pg-head");
        const badge = el("span", "pg-lock", "📶");
        badge.setAttribute("aria-hidden", "true");
        head.appendChild(badge);
        const titles = el("div", "pg-titles");
        titles.appendChild(el("h2", "pg-title", "ما قدرناش نجيبو هاد الموضوع"));
        titles.appendChild(el("p", "pg-lead",
            "غالبا المشكل ف الأنترنت (ضعيفة ولا مقطوعة) — ماشي ف الاشتراك ديالك. "
            + "تأكد من الاتصال وعاود المحاولة."));
        head.appendChild(titles);
        card.appendChild(head);

        const actions = el("div", "pg-actions");
        const again = el("button", "pg-btn pg-btn-main", "عاود المحاولة");
        again.type = "button";
        again.addEventListener("click", function () { location.reload(); });
        actions.appendChild(again);
        card.appendChild(actions);

        into.appendChild(card);
    }

    window.__premiumGate = function (into, options) {
        const config = options || {};
        /* السبب التقني (Worker، KV…) للـ console برك — الطالب ماخصوش يشوفو */
        if (config.note) console.warn("Premium:", config.note);

        /* المشترك، والموضوع ما زال ماكاينش ف المحتوى (KV 404): ماشي «الأنترنت» */
        if (config.missing && window.__sehrgutIsPremium === true) {
            soonCard(into, config);
            return;
        }

        /* site-header.js: "pending" · "ok" · "error" */
        const state = window.__dePremiumState || "ok";
        if (state === "error" || (window.__sehrgutIsPremium === true && config.note)) {
            netCard(into);
            return;
        }
        /* Firebase ما زال ما جاوبش: الصفحة كتعاود ترسم مع de-premium */
        if (state === "pending") {
            const wait = window.__deSkeleton ? window.__deSkeleton("topic") : el("div", "lesen-empty", "…");
            into.appendChild(wait);
            if (window.__deNetHint) window.__deNetHint(wait);
            return;
        }

        const card = el("section", "pg");

        /* ---- الرأس ---- */
        const head = el("div", "pg-head");

        const badge = el("span", "pg-lock");
        badge.setAttribute("aria-hidden", "true");
        badge.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
            ' stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="4" y="10" width="16" height="11" rx="2.5"></rect>' +
            '<path d="M8 10V7a4 4 0 0 1 8 0v3"></path>' +
            '<circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"></circle>' +
            "</svg>";
        head.appendChild(badge);

        const titles = el("div", "pg-titles");
        titles.appendChild(el("span", "pg-chip", "PREMIUM"));
        titles.appendChild(el("h2", "pg-title",
            config.title || "هاد الموضوع ديال المشتركين"));
        titles.appendChild(el("p", "pg-lead",
            config.lead || "المواضيع المجانية محلولة كاملة. باقي المواضيع كيفتحو مع الاشتراك."));
        head.appendChild(titles);
        card.appendChild(head);

        /* ---- شنو كيربح ---- */
        const list = el("ul", "pg-perks");
        perks().forEach(function (perk) {
            const row = el("li", "");
            row.appendChild(el("span", "pg-tick", "✓"));
            row.appendChild(document.createTextNode(perk));
            list.appendChild(row);
        });
        card.appendChild(list);

        /* ---- الأزرار ---- */
        const actions = el("div", "pg-actions");

        const buy = el("a", "pg-btn pg-btn-main", "شوف العروض");
        buy.href = "payment.html";
        actions.appendChild(buy);

        if (!window.__sehrgutUser) {
            const login = el("a", "pg-btn pg-btn-ghost", "عندك حساب؟ دخل");
            login.href = "login.html";
            actions.appendChild(login);
        }
        card.appendChild(actions);

        /* هادي كتبان غير إلا كان المستعمل مشترك وما وصلوش المحتوى —
           يعني كاين شي حاجة خايبة فالإعداد، ماشي فالاشتراك ديالو. */

        /* ---- نموذج مغبّش: كيوري الشكل بلا ما يعطي المحتوى ---- */
        const peek = el("div", "pg-peek");
        peek.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 3; i++) {
            const row = el("div", "pg-peek-row");
            row.appendChild(el("span", "pg-peek-num", String(i + 1)));
            const lines = el("div", "pg-peek-lines");
            lines.appendChild(el("span", "pg-peek-line"));
            lines.appendChild(el("span", "pg-peek-line"));
            lines.appendChild(el("span", "pg-peek-line short"));
            row.appendChild(lines);
            peek.appendChild(row);
        }
        card.appendChild(peek);

        into.appendChild(card);
    };
})();
