/* ===== الوضع: فاتح (White Dove) ↔ مظلم =====

   كيتحمل ف <head> (قبل ما تبان الصفحة) باش ما يبانش وميض:
   كيحط <html data-theme="light|dark"> من localStorage ("de-theme").
   الافتراضي: فاتح.

   الزر:
   - الصفحات اللي فيها الهيدر المشترك: site-header.js كيزيد زر
     ☀️/🌙 حدا الجرس ويعيط لـ window.__deTheme.toggle().
   - الصفحات بلا هيدر (الدخول، Schreiben…): زر صغير عايم
     فالزاوية.
   theme.css كيقرا [data-theme="dark"] ويبدل الألوان. */

(function () {
    "use strict";

    var KEY = "de-theme";
    var root = document.documentElement;

    function stored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function remember(mode) {
        try { localStorage.setItem(KEY, mode); } catch (e) { /* تصفح خاص */ }
    }
    function current() {
        return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    var ICON = {
        dark: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
        light: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>'
    };

    /* الزر كيبين الوضع اللي غادي تمشي ليه */
    function paint(btn) {
        var dark = current() === "dark";
        btn.innerHTML = dark ? ICON.light : ICON.dark;
        btn.setAttribute("aria-label", dark ? "الوضع الفاتح" : "الوضع المظلم");
        btn.title = dark ? "الوضع الفاتح" : "الوضع المظلم";
    }
    function paintAll() {
        var all = document.querySelectorAll(".de-theme-btn");
        for (var i = 0; i < all.length; i++) paint(all[i]);
    }

    function apply(mode, save) {
        root.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
        if (document.body) document.body.setAttribute("data-theme", current());
        if (save) remember(current());
        paintAll();
    }
    function toggle() { apply(current() === "dark" ? "light" : "dark", true); }

    function makeButton(extraClass) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "de-theme-btn" + (extraClass ? " " + extraClass : "");
        btn.addEventListener("click", toggle);
        paint(btn);
        return btn;
    }

    /* 1. دغيا، قبل ما يتبنى الـbody */
    apply(stored() === "dark" ? "dark" : "light", false);

    /* 2. صفحة بلا هيدر مشترك: زر عايم */
    function install() {
        apply(current(), false);
        if (document.querySelector(".site-header, .de-theme-btn")) return;
        if (root.classList.contains("is-embed")) return;
        document.body.appendChild(makeButton("is-floating"));
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
    else install();

    window.__deTheme = { get: current, set: function (m) { apply(m, true); }, toggle: toggle, button: makeButton };
})();
