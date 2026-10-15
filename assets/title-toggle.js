/* ===== خبي عنوان الموضوع =====

   المشكل: العنوان كيفضح الجواب. مثلا ف Lesen Teil 1، سميّة
   الموضوع "Sport ist gesund" هي بحالها وحدة من الـÜberschriften
   اللي خاصك تختار.

   الزر: غير عين صغيرة حدا العنوان الكبير ديال التمرين.
   كيخبي:
     - العنوان الكبير (.t1-title) والسطر اللي تحتو (.t1-kicker)
     - وسميّة الموضوع ف الشريط ديال فوق (.lesen-detail-title)

   مهم: الزر كيتحط حدا الـ.t1-title ف سطر مشترك، ماشي جواه —
   وإلا كيتخبى هو حتى هو ملي كيتخبى العنوان.

   الاختيار كيتحفظ ف localStorage، إذن كيبقى ف كل المواضيع
   وكل الصفحات.

   الزر كيتزاد بوحدو ف أي رأس كيطلع (MutationObserver) حيت
   الرؤوس كيتعاودو يتبناو ف كل paint. */

(function () {
    "use strict";

    var KEY = "de-hide-title";
    var ON = "de-hide-title";
    var HOST = ".t1-head";

    function stored() {
        try { return localStorage.getItem(KEY) === "1"; }
        catch (e) { return false; }
    }
    function remember(on) {
        try { on ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); }
        catch (e) { /* التصفح الخاص: كيخدم، غير ماكيتعاودش */ }
    }

    /* كنطبقو دغيا — بلا هادشي العنوان كيبان شي لحظة
       من بعد كيختافى، وهادشي كيفضح الجواب. */
    function apply(on) {
        document.documentElement.classList.toggle(ON, on);
    }
    apply(stored());

    var SVG = '<svg class="title-toggle-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" '
        + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var EYE = SVG + '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    var EYE_OFF = SVG + '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/>'
        + '<path d="M6.61 6.61A18.5 18.5 0 0 0 2 11s3.6 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/>'
        + '<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M2 2l20 20"/></svg>';

    function build() {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "title-toggle";

        function paint() {
            var on = document.documentElement.classList.contains(ON);
            /* العنوان باين: عين مشطبة (خبي). مخبي: عين (بين). */
            button.innerHTML = on ? EYE : EYE_OFF;
            var label = on ? "بين العنوان" : "خبي العنوان";
            button.classList.toggle("is-on", on);
            button.setAttribute("aria-pressed", on ? "true" : "false");
            button.setAttribute("aria-label", label);
            button.title = label;
        }
        paint();

        button.addEventListener("click", function () {
            var next = !document.documentElement.classList.contains(ON);
            apply(next);
            remember(next);
            /* ممكن يكون كثر من زر ف الصفحة — كنحدثوهم كاملين */
            Array.prototype.forEach.call(
                document.querySelectorAll(".title-toggle"),
                function (other) { other.__paint && other.__paint(); }
            );
        });

        button.__paint = paint;
        return button;
    }

    function install(head) {
        if (!head || head.querySelector(".title-toggle")) return;

        var title = head.querySelector(".t1-title");
        if (!title) { head.appendChild(build()); return; }

        /* سطر مشترك: العنوان + العين. ملي كيتخبى العنوان
           كيبقى السطر فيه غير العين. */
        var row = document.createElement("div");
        row.className = "t1-title-row";
        title.parentNode.insertBefore(row, title);
        row.appendChild(title);
        row.appendChild(build());
    }

    function pick(root) {
        var out = [];
        if (root.nodeType !== 1) return out;
        if (root.matches && root.matches(HOST)) out.push(root);
        if (root.querySelectorAll) {
            out = out.concat(Array.prototype.slice.call(root.querySelectorAll(HOST)));
        }
        return out;
    }

    function scan(root) {
        pick(root).forEach(install);
    }

    function start() {
        scan(document.body);
        new MutationObserver(function (records) {
            records.forEach(function (record) {
                Array.prototype.forEach.call(record.addedNodes, scan);
            });
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
}());
