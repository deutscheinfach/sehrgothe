/* ===== بين / خبي الكلمات المفتاحية =====

   من بعد التصحيح، الموقع كيلون بالصفر الكلمات المشتركين بين
   النص والجواب الصحيح (mark.kw). هادشي كيعاون، ولكن شي ناس
   كيبغيو يقراو النص نقي بلا تلوين.

   الزر: كيتحط ف رأس اللوحة حدا العداد (0/5 · 0/10)، ف
   Teil 1 و 2 و 3.

   كيخدم بالـCSS برك — الـmark كيبقى ف الصفحة، غير التلوين
   كيتحيد. يعني ماكيتبدلش شي حاجة فالتصحيح، ومنين تعاود
   تحلو كيرجع بحالو بلا ما تعاود تصحح.

   الاختيار كيتحفظ ف localStorage. */

(function () {
    "use strict";

    var KEY = "de-no-keys";
    var ON = "de-no-keys";
    var HOST = ".t1-panel-head";

    function stored() {
        try { return localStorage.getItem(KEY) === "1"; }
        catch (e) { return false; }
    }
    function remember(off) {
        try { off ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); }
        catch (e) { /* التصفح الخاص: كيخدم، غير ماكيتعاودش */ }
    }

    function apply(off) {
        document.documentElement.classList.toggle(ON, off);
    }
    apply(stored());

    function build() {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "keys-toggle";

        var ink = document.createElement("span");
        ink.className = "keys-toggle-ink";
        ink.textContent = "\ud83d\udd11";          /* 🔑 */
        ink.setAttribute("aria-hidden", "true");
        button.appendChild(ink);

        function paint() {
            /* الكلاس على <html> معناها "مخبيين" */
            var off = document.documentElement.classList.contains(ON);
            var label = off ? "بين الكلمات المفتاحية" : "خبي الكلمات المفتاحية";
            button.classList.toggle("is-off", off);
            button.setAttribute("aria-pressed", off ? "false" : "true");
            button.setAttribute("aria-label", label);
            button.title = label;
        }
        paint();

        button.addEventListener("click", function () {
            var next = !document.documentElement.classList.contains(ON);
            apply(next);
            remember(next);
            Array.prototype.forEach.call(
                document.querySelectorAll(".keys-toggle"),
                function (other) { other.__paint && other.__paint(); }
            );
        });

        button.__paint = paint;
        return button;
    }

    function install(head) {
        if (!head || head.querySelector(".keys-toggle")) return;
        var progress = head.querySelector(".t1-progress");
        var button = build();
        if (progress) head.insertBefore(button, progress);
        else head.appendChild(button);
    }

    function scan(root) {
        if (!root || root.nodeType !== 1) return;
        if (root.matches && root.matches(HOST)) install(root);
        if (root.querySelectorAll) {
            Array.prototype.forEach.call(root.querySelectorAll(HOST), install);
        }
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
