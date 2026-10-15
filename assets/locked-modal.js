/* ===== "محتوى مقفل": نافذة وحدة لكل المواضيع ديال Premium =====

   قبل، البركة على موضوع مقفول كانت كتحل الموضوع وتبين لوحة وسط
   الصفحة (Lesen/Sprechen/Schreiben)، ولا نافذة قديمة كتصيفط
   لـ WhatsApp (Hören). دابا: نفس النافذة ف كل قسم، والزر ديالها
   كيدي لصفحة العروض (payment.html).

   كيخدم بوحدو:
   - أي بطاقة a.lesen-card.locked (Lesen، Sprechen، Schreiben، Prüfungen)
   - الأزرار ديال Hören (openHoerenPremium / openHoerenTeil2Premium /
     openHoerenTeil3Premium) — كنبدلوهم بهاد النافذة.

   window.__deLocked({ title: "…" }) باش تحلها من أي بلاصة. */

(function () {
    "use strict";

    var OFFERS = "payment.html";
    var modal = null;
    var lastFocus = null;

    function isPremium() { return !!window.__sehrgutIsPremium; }
    /* site-header.js: "pending" (Firebase ما جاوبش) · "ok" · "error" (الأنترنت) */
    function premiumState() { return window.__dePremiumState || "ok"; }

    function css() {
        if (document.getElementById("de-locked-css")) return;
        var style = document.createElement("style");
        style.id = "de-locked-css";
        style.textContent = [
            ".dl-back{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:16px;",
            "background:rgba(8,10,20,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);",
            "opacity:0;transition:opacity .18s ease}",
            ".dl-back.show{opacity:1}",
            ".dl-box,.dl-box *{box-sizing:border-box}",
            "@media (pointer:coarse){.dl-back{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(8,10,20,.7)}}",
            ".dl-box{position:relative;width:min(400px,100%);direction:rtl;text-align:center;",
            "padding:30px 24px 20px;border-radius:24px;background:var(--surface,#fff);color:var(--text,#101a36);",
            "border:1px solid var(--line,rgba(16,26,54,.11));",
            "box-shadow:0 30px 80px -20px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.04) inset;",
            "transform:translateY(12px) scale(.97);transition:transform .22s cubic-bezier(.22,.8,.3,1);overflow:hidden}",
            ".dl-back.show .dl-box{transform:none}",
            ".dl-box::before{content:\"\";position:absolute;inset:0 0 auto 0;height:120px;pointer-events:none;",
            "background:radial-gradient(70% 100% at 50% 0,color-mix(in srgb,var(--brand,#e3163f) 22%,transparent),transparent)}",
            ".dl-ico{position:relative;width:64px;height:64px;margin:0 auto 14px;border-radius:18px;display:grid;place-items:center;",
            "background:var(--grad-brand,linear-gradient(135deg,#ff4a6b,#e3163f 45%,#b30e30));color:#fff;",
            "box-shadow:0 12px 26px -10px var(--brand,#e3163f)}",
            ".dl-ico svg{width:30px;height:30px}",
            ".dl-title{position:relative;margin:0 0 4px;font-size:1.55rem;font-weight:900;letter-spacing:-.01em}",
            ".dl-sub{position:relative;margin:0 0 18px;color:var(--muted,#56607a);font-size:14.5px;line-height:1.7}",
            ".dl-topic{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;",
            "padding:11px 14px;margin:0 0 10px;border-radius:14px;background:var(--surface-2,#f4f6fb);",
            "border:1px solid var(--line,rgba(16,26,54,.11));font-weight:800;font-size:14.5px}",
            ".dl-topic b{direction:ltr;unicode-bidi:isolate}",
            ".dl-wa{position:relative;display:flex;align-items:flex-start;gap:10px;margin:0 0 14px;padding:11px 13px;border-radius:14px;text-align:right;",
            "background:color-mix(in srgb,#25d366 12%,transparent);border:1px solid color-mix(in srgb,#25d366 35%,transparent);font-size:13.5px;line-height:1.65;font-weight:700}",
            ".dl-wa svg{flex:none;width:20px;height:20px;margin-top:2px;color:#16a34a}",
            ".dl-wa b{display:block;font-weight:900}",
            ".dl-plan{display:inline-flex;align-items:center;gap:6px;margin:0 0 18px;font-size:13.5px;font-weight:800;color:var(--muted,#56607a)}",
            ".dl-plan span{padding:3px 10px;border-radius:999px;color:#fff;background:var(--brand,#e3163f);font-weight:900;letter-spacing:.02em}",
            ".dl-go{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 16px;border-radius:14px;",
            "background:var(--grad-brand,linear-gradient(135deg,#ff4a6b,#e3163f 45%,#b30e30));color:#fff !important;",
            "font-weight:900;font-size:16px;text-decoration:none;box-shadow:0 14px 30px -12px var(--brand,#e3163f);",
            "transition:transform .15s ease,box-shadow .15s ease}",
            ".dl-go:hover{transform:translateY(-1px);box-shadow:0 18px 34px -12px var(--brand,#e3163f)}",
            ".dl-go svg{width:19px;height:19px}",
            ".dl-login{display:block;margin:12px 0 0;color:var(--text,#101a36);font-weight:800;font-size:14px;text-decoration:underline}",
            ".dl-later{display:block;margin:10px auto 0;padding:6px 12px;border:0;background:none;cursor:pointer;",
            "color:var(--muted,#56607a);font:inherit;font-size:14px;font-weight:700}",
            ".dl-later:hover{color:var(--text,#101a36)}",
            "@media (prefers-reduced-motion:reduce){.dl-back,.dl-box{transition:none}}"
        ].join("");
        document.head.appendChild(style);
    }

    var CROWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        + 'stroke-linejoin="round" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>';
    var WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>';
    var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        + 'stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5"/>'
        + '<path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></svg>';

    function close() {
        if (!modal) return;
        var node = modal;
        modal = null;
        node.classList.remove("show");
        document.documentElement.style.overflow = "";
        document.removeEventListener("keydown", onKey, true);
        setTimeout(function () { node.remove(); }, 200);
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }

    function onKey(event) {
        if (event.key === "Escape") { event.stopPropagation(); close(); }
    }

    var WIFI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
        + 'stroke-linejoin="round" aria-hidden="true"><path d="M2 8.8a15 15 0 0 1 20 0"/><path d="M5 12.6a10 10 0 0 1 14 0"/>'
        + '<path d="M8.5 16.3a5 5 0 0 1 7 0"/><circle cx="12" cy="19.6" r="1" fill="currentColor"/><path d="M3 3l18 18"/></svg>';

    /* نافذة صغيرة: «مشكل ف الأنترنت» ولا «كنتأكدو من الحساب…».
       ماشي «خاصك Premium» — المستعمل يقدر يكون مشترك. */
    function notice(kind) {
        css();
        if (modal) close();
        lastFocus = document.activeElement;
        var net = kind === "net";

        var back = document.createElement("div");
        back.className = "dl-back";
        back.setAttribute("role", "dialog");
        back.setAttribute("aria-modal", "true");
        back.setAttribute("aria-labelledby", "dl-title");

        var box = document.createElement("div");
        box.className = "dl-box";
        box.innerHTML = '<div class="dl-ico">' + (net ? WIFI : LOCK) + '</div>'
            + '<h2 class="dl-title" id="dl-title"></h2><p class="dl-sub"></p>';
        box.querySelector(".dl-title").textContent = net ? "مشكل ف الأنترنت" : "كنتأكدو من الحساب ديالك…";
        box.querySelector(".dl-sub").textContent = net
            ? "ما قدرناش نتأكدو من الاشتراك ديالك حيت الاتصال ضعيف ولا مقطوع. "
              + "تأكد من الأنترنت (Wi-Fi / 4G) وعاود المحاولة."
            : "لحظة صغيرة، كنشوفو واش الحساب ديالك Premium.";

        var go = null;
        if (net) {
            go = document.createElement("button");
            go.type = "button";
            go.className = "dl-go";
            go.style.border = "0";
            go.style.cursor = "pointer";
            go.textContent = "عاود المحاولة";
            go.addEventListener("click", function () { location.reload(); });
            box.appendChild(go);
        }

        var later = document.createElement("button");
        later.type = "button";
        later.className = "dl-later";
        later.textContent = net ? "سد" : "إلغاء";
        later.addEventListener("click", close);
        box.appendChild(later);

        back.appendChild(box);
        back.addEventListener("click", function (event) { if (event.target === back) close(); });
        document.body.appendChild(back);
        document.documentElement.style.overflow = "hidden";
        document.addEventListener("keydown", onKey, true);
        modal = back;
        requestAnimationFrame(function () {
            back.classList.add("show");
            (go || later).focus({ preventScroll: true });
        });
        return back;
    }

    /* Firebase ما زال ما جاوبش: كنتسناو الجواب (حتى 15 ثانية) قبل ما
       نقررو. مشترك → كنحلو الموضوع · ماشي مشترك → القفل · طاح → الأنترنت. */
    function waitThenOpen(onPremium, onLocked) {
        var box = notice("wait");
        var done = false;
        function finish() {
            if (done) return;
            var state = premiumState();
            if (state === "pending") return;
            done = true;
            document.removeEventListener("de-premium-state", finish);
            clearTimeout(timer);
            if (modal !== box) return;   /* سدها المستعمل */
            if (isPremium()) { close(); onPremium(); }
            else if (state === "error") notice("net");
            else onLocked();
        }
        var timer = setTimeout(function () {
            if (done) return;
            done = true;
            document.removeEventListener("de-premium-state", finish);
            if (modal === box) notice("net");
        }, 15000);
        document.addEventListener("de-premium-state", finish);
    }

    /* الحالة قبل ما نوريو القفل: ok → القفل · error → الأنترنت · pending → نتسناو */
    function guard(onPremium, onLocked) {
        var state = premiumState();
        if (state === "error") { notice("net"); return; }
        if (state === "pending") { waitThenOpen(onPremium, onLocked); return; }
        onLocked();
    }

    window.__deLocked = function (options) {
        var config = options || {};
        css();
        if (modal) close();
        lastFocus = document.activeElement;

        var back = document.createElement("div");
        back.className = "dl-back";
        back.setAttribute("role", "dialog");
        back.setAttribute("aria-modal", "true");
        back.setAttribute("aria-labelledby", "dl-title");

        var box = document.createElement("div");
        box.className = "dl-box";
        box.innerHTML =
            '<div class="dl-ico">' + LOCK + '</div>'
            + '<h2 class="dl-title" id="dl-title"></h2><p class="dl-sub"></p>';
        box.querySelector(".dl-title").textContent = config.heading || "محتوى مقفل";
        box.querySelector(".dl-sub").textContent = config.text
            || "هاد الموضوع كيتفتح مع الاشتراك ف Premium — مع گاع المواضيع ديال Lesen، Hören، Schreiben و Sprechen.";

        if (config.title) {
            var topic = document.createElement("div");
            topic.className = "dl-topic";
            topic.appendChild(document.createTextNode("🔒 "));
            var name = document.createElement("b");
            name.textContent = config.title;
            topic.appendChild(name);
            box.appendChild(topic);
        }

        /* Premium فيه حتى مساعدة شخصية ف WhatsApp */
        var wa = document.createElement("div");
        wa.className = "dl-wa";
        wa.innerHTML = WA + "<div><b>+ مساعدة شخصية ف WhatsApp</b>"
            + "أي سؤال على Lesen، Hören، Schreiben و Sprechen، كيفاش تخدم بالموقع، ولا نهار الامتحان — كنجاوبوك.</div>";
        box.appendChild(wa);

        var plan = document.createElement("div");
        plan.className = "dl-plan";
        plan.innerHTML = "كيتطلب باقة: <span>Premium</span>";
        box.appendChild(plan);

        var go = document.createElement("a");
        go.className = "dl-go";
        go.href = OFFERS;
        go.innerHTML = "شوف العروض وفتح الحساب " + CROWN;
        box.appendChild(go);

        if (!window.__sehrgutUser) {
            var login = document.createElement("a");
            login.className = "dl-login";
            login.href = "login.html";
            login.textContent = "عندك حساب Premium؟ دخل";
            box.appendChild(login);
        }

        var later = document.createElement("button");
        later.type = "button";
        later.className = "dl-later";
        later.textContent = "ماشي دابا";
        later.addEventListener("click", close);
        box.appendChild(later);

        back.appendChild(box);
        back.addEventListener("click", function (event) { if (event.target === back) close(); });
        document.body.appendChild(back);
        document.documentElement.style.overflow = "hidden";
        document.addEventListener("keydown", onKey, true);
        modal = back;

        requestAnimationFrame(function () {
            back.classList.add("show");
            go.focus({ preventScroll: true });
        });
    };

    /* ---- البطاقات المقفولة (Lesen، Sprechen، Schreiben، Prüfungen) ----
       capture: قبل ما الـ hub يحل الموضوع ف نفس الصفحة. */
    document.addEventListener("click", function (event) {
        var card = event.target.closest && event.target.closest("a.lesen-card.locked");
        if (!card || isPremium()) return;
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        event.stopPropagation();
        var title = card.querySelector(".lesen-card-title");
        var text = title ? (title.firstChild && title.firstChild.nodeType === 3
            ? title.firstChild.nodeValue : title.textContent) : "";
        guard(function () { card.click(); },
              function () { window.__deLocked({ title: (text || "").trim() }); });
    }, true);

    /* ---- Hören: نبدلو النوافذ القديمة ديال كل Teil ---- */
    function hoeren(title) {
        /* مشترك تأكد من بعد الانتظار: الصفحة كتعاود ترسم مع de-premium */
        guard(function () {}, function () { window.__deLocked({ title: title }); });
    }
    function swap() {
        ["openHoerenPremium", "openHoerenTeil2Premium", "openHoerenTeil3Premium"].forEach(function (name) {
            if (typeof window[name] === "function" && window[name] !== hoeren) window[name] = hoeren;
        });
    }
    swap();
    /* شي صفحات كيعرفوهم ف DOMContentLoaded — نعاودو من بعد */
    document.addEventListener("DOMContentLoaded", function () { setTimeout(swap, 0); });
    window.addEventListener("load", swap);
})();
