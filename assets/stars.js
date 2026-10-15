/* ===== الخلفية: سما ديال النجوم (ذهبي وأسود) =====

   canvas وحدة ثابتة ورا المحتوى (z-index:-1، pointer-events:none):
   - نجوم فـ3 طبقات عمق، كيلمعو بشوية (twinkle)
   - كيتحركو شوية مع السكرول والماوس (parallax) → إحساس بالعمق
   - النجوم الكبار عندهم بريق صغير + خطوط رقيقة بحال الكوكبات
   - نجمة هاربة (شهاب) ذهبية من وقت لوقت

   خفيفة: 30 صورة فالثانية، كتوقف ملي الصفحة مخبية، وكتبقى ثابتة
   لللي مفعّلين "تقليل الحركة". كتتزاد فـ<html> ماشي فـ<body>
   باش الراوتر ديال site-header.js مايحيدهاش ملي كيبدل الصفحة. */

(function () {
    "use strict";
    if (window.__deStars) return;
    /* داخل Modelltest (iframe) ما كاين لاش */
    if (document.documentElement.classList.contains("is-embed")) return;
    window.__deStars = true;

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    canvas.className = "de-stars";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLORS = ["243,234,211", "240,213,140", "214,178,94", "255,250,240"];
    let W = 0, H = 0, dpr = 1;
    let stars = [];
    let links = [];
    let meteor = null;
    let nextMeteor = 0;
    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(300, Math.round(W * H / 5200));
        stars = [];
        for (let i = 0; i < count; i++) {
            const depth = Math.random() < .6 ? 0 : (Math.random() < .7 ? 1 : 2);
            const bright = depth === 2 && Math.random() < .45;
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                depth: depth,
                r: depth === 0 ? rand(.35, .8) : depth === 1 ? rand(.7, 1.2) : rand(1.1, 1.8),
                a: depth === 0 ? rand(.3, .6) : depth === 1 ? rand(.5, .8) : rand(.7, 1),
                speed: rand(.4, 1.6),
                phase: Math.random() * Math.PI * 2,
                color: COLORS[bright ? 1 : (Math.random() * COLORS.length) | 0],
                bright: bright
            });
        }

        /* الكوكبات: كنربطو النجوم الكبار القراب من بعضياتهم */
        links = [];
        const big = stars.filter(function (s) { return s.depth === 2; });
        for (let i = 0; i < big.length; i++) {
            for (let j = i + 1; j < big.length; j++) {
                const dx = big[i].x - big[j].x, dy = big[i].y - big[j].y;
                if (dx * dx + dy * dy < 130 * 130 && links.length < 26) links.push([big[i], big[j]]);
            }
        }
    }

    function spawnMeteor(now) {
        const fromLeft = Math.random() < .5;
        const angle = rand(.35, .6);
        meteor = {
            x: fromLeft ? rand(-40, W * .5) : rand(W * .5, W + 40),
            y: rand(-40, H * .35),
            vx: (fromLeft ? 1 : -1) * Math.cos(angle) * 11,
            vy: Math.sin(angle) * 11,
            life: 0,
            max: rand(55, 80)
        };
        nextMeteor = now + rand(7000, 16000);
    }

    function wrap(v, max) { return ((v % max) + max) % max; }

    function draw(now) {
        ctx.clearRect(0, 0, W, H);
        const t = now / 1000;
        const scroll = window.scrollY || 0;
        curX += (mouseX - curX) * .04;
        curY += (mouseY - curY) * .04;

        function pos(s) {
            const k = (s.depth + 1);
            return {
                x: wrap(s.x + curX * k * 4 + t * k * 1.2, W),
                y: wrap(s.y - scroll * k * .04 + curY * k * 4, H)
            };
        }

        /* خطوط الكوكبات */
        ctx.lineWidth = .6;
        for (let i = 0; i < links.length; i++) {
            const a = pos(links[i][0]), b = pos(links[i][1]);
            const dx = a.x - b.x, dy = a.y - b.y;
            if (dx * dx + dy * dy > 140 * 140) continue;
            ctx.strokeStyle = "rgba(214,178,94,.07)";
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const p = pos(s);
            const tw = reduce ? 1 : .55 + .45 * Math.sin(t * s.speed + s.phase);
            const alpha = s.a * tw;
            ctx.fillStyle = "rgba(" + s.color + "," + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.arc(p.x, p.y, s.r, 0, Math.PI * 2);
            ctx.fill();

            if (s.bright) {
                /* هالة + بريق بحال صليب رقيق */
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s.r * 6);
                g.addColorStop(0, "rgba(240,213,140," + (alpha * .35).toFixed(3) + ")");
                g.addColorStop(1, "rgba(240,213,140,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, s.r * 6, 0, Math.PI * 2);
                ctx.fill();
                const len = s.r * 5 * tw;
                ctx.strokeStyle = "rgba(255,244,214," + (alpha * .45).toFixed(3) + ")";
                ctx.lineWidth = .7;
                ctx.beginPath();
                ctx.moveTo(p.x - len, p.y); ctx.lineTo(p.x + len, p.y);
                ctx.moveTo(p.x, p.y - len); ctx.lineTo(p.x, p.y + len);
                ctx.stroke();
            }
        }

        if (reduce) return;

        /* الشهاب */
        if (!meteor && now > nextMeteor) spawnMeteor(now);
        if (meteor) {
            meteor.life++;
            meteor.x += meteor.vx;
            meteor.y += meteor.vy;
            const fade = Math.sin(Math.PI * meteor.life / meteor.max);
            const tx = meteor.x - meteor.vx * 12, ty = meteor.y - meteor.vy * 12;
            const g = ctx.createLinearGradient(meteor.x, meteor.y, tx, ty);
            g.addColorStop(0, "rgba(255,244,214," + (.9 * fade).toFixed(3) + ")");
            g.addColorStop(.3, "rgba(240,213,140," + (.45 * fade).toFixed(3) + ")");
            g.addColorStop(1, "rgba(214,178,94,0)");
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.6;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();
            if (meteor.life >= meteor.max) meteor = null;
        }
    }

    let last = 0;
    let running = false;
    function loop(now) {
        if (!running) return;
        if (now - last > 33) {
            last = now;
            draw(now);
        }
        requestAnimationFrame(loop);
    }
    function start() {
        if (reduce) { draw(performance.now()); return; }
        if (running) return;
        running = true;
        requestAnimationFrame(loop);
    }
    function stop() { running = false; }

    function init() {
        document.documentElement.appendChild(canvas);
        /* التصميم الحالي مخبي النجوم (theme.css: .de-stars {display:none}).
           بلا هاد الفحص كانت الأنيميشن كتخدم 30 مرة ف الثانية بلا ما تبان،
           وكتعاود تبني الـcanvas ف كل resize — ف التيليفون (البار ديال
           العنوان كيبان ويغبر) هادشي كان كيدير lag وكيوقف السكرول. */
        if (getComputedStyle(canvas).display === "none") { canvas.remove(); return; }
        build();
        nextMeteor = performance.now() + rand(2500, 6000);
        start();

        let timer = 0;
        window.addEventListener("resize", function () {
            clearTimeout(timer);
            timer = setTimeout(function () { build(); if (reduce) draw(performance.now()); }, 150);
        });
        window.addEventListener("pointermove", function (e) {
            if (e.pointerType !== "mouse") return;
            mouseX = (e.clientX / W - .5) * 2;
            mouseY = (e.clientY / H - .5) * 2;
        }, { passive: true });
        if (reduce) window.addEventListener("scroll", function () { draw(performance.now()); }, { passive: true });
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) stop(); else start();
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
