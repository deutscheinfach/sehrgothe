/* ===== زر «شوف شنو كاين ↓» =====

   زر ذهبي صغير لتحت ف الوسط (PC والتيليفون) كيقول للزائر بلي كاين
   محتوى تحت. ملي يبرك عليه كينزل للقسم. كيختفي ملي الزائر كيسكرولي،
   وكيرجع ملي يحبس.

   الاستعمال:
     <script src="assets/scroll-cue.js" data-target="#explore" defer></script>
   data-target = القسم اللي كينزل ليه. ولا بزاف مفرقين بفاصلة
   ("#plans,#whatsapp-premium,#ultra"): الزر كيدي للقسم الجاي، ومن بعد
   كيبان عاوتاني للي من بعدو، حتى يساليو — عاد كيختفي. */
(function () {
    "use strict";

    var me = document.currentScript;
    var target = (me && me.getAttribute("data-target")) || "";
    var label = (me && me.getAttribute("data-label")) || "شوف شنو كاين";

    function init() {
        var list = target.split(",").map(function (sel) { return document.querySelector(sel.trim()); })
            .filter(Boolean);
        if (!list.length) return;

        var css = document.createElement("style");
        css.textContent =
            ".scroll-cue{display:inline-flex;align-items:center;gap:6px;position:fixed;z-index:800;left:50%;" +
            "bottom:calc(16px + env(safe-area-inset-bottom));transform:translateX(-50%);padding:11px 20px;border-radius:999px;" +
            "direction:rtl;white-space:nowrap;font:900 14.5px/1 'Cairo',system-ui,sans-serif;text-decoration:none;color:#2a1500;" +
            "background:linear-gradient(135deg,#ffe58a,#f2b705);box-shadow:0 12px 26px -10px rgba(120,80,0,.7);" +
            "transition:opacity .25s,transform .25s;cursor:pointer}" +
            ".scroll-cue:hover{filter:brightness(1.05)}" +
            ".scroll-cue svg{width:18px;height:18px;animation:cue-bob 1.4s ease-in-out infinite}" +
            ".scroll-cue.is-gone{opacity:0;pointer-events:none;transform:translate(-50%,20px)}" +
            "@keyframes cue-bob{0%,100%{transform:translateY(-2px)}50%{transform:translateY(3px)}}" +
            "@media (prefers-reduced-motion:reduce){.scroll-cue svg{animation:none}}";
        document.head.appendChild(css);

        var cue = document.createElement("a");
        cue.className = "scroll-cue";
        cue.href = "#";
        cue.setAttribute("aria-label", label + " تحت");
        cue.innerHTML = label + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
        document.body.appendChild(cue);

        function head() {
            return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-h")) || 0;
        }
        /* القسم الجاي: أول واحد مازال الراس ديالو تحت نص الشاشة */
        function next() {
            var line = window.innerHeight * 0.5;
            for (var i = 0; i < list.length; i++) {
                if (list[i].getBoundingClientRect().top > line) return list[i];
            }
            return null;
        }
        cue.addEventListener("click", function (e) {
            e.preventDefault();
            var to = next();
            if (!to) return;
            var y = to.getBoundingClientRect().top + window.pageYOffset - head() - 14;
            window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        });

        /* كيختفي ملي الزائر كينزل/كيطلع، وكيرجع ملي يحبس */
        var moving = false, idle = 0, ticking = false;
        function paint() {
            ticking = false;
            var to = next();
            cue.classList.toggle("is-gone", moving || !to);
            if (to && to.id) cue.href = "#" + to.id;
        }
        window.addEventListener("scroll", function () {
            moving = true;
            clearTimeout(idle);
            idle = setTimeout(function () { moving = false; paint(); }, 450);
            if (!ticking) { ticking = true; requestAnimationFrame(paint); }
        }, { passive: true });
        window.addEventListener("resize", paint);
        paint();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
