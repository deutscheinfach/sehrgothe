/* ===== بطاقة النتيجة — باش تتشارك ف WhatsApp =====

   علاش: ملي كيسالي شي واحد Modelltest، النتيجة كتبقى حبيسة
   فالموقع. بهاد الملف كنرسمو صورة PNG فيها النتيجة والعلامة
   ديالنا، والمستخدم كيصيفطها لWhatsApp بضغطة وحدة. كل صورة
   كتمشي لشي گروپ = إشهار بالمجان عند بالضبط الناس اللي
   كنقلبو عليهم.

   بلا أي مكتبة خارجية: <canvas> برك، باش تخدم حتى بلا
   انترنت ومايكونش شي طلب زايد.

   الاستعمال:
       DEShare.open({
           kind:  "modelltest",
           title: "Modelltest 3",
           score: 148, max: 225, pass: true,
           rows:  [["Leseverstehen", 52, 75], …],
           streak: 12
       });

   الحجم 1080×1350 (4:5) — كيمشي مع WhatsApp وInstagram
   وFacebook بلا ما يتقص. */

(function () {
    "use strict";

    if (window.DEShare) return;

    var W = 1080, H = 1350;
    var SITE = "deutsch-einfach.online";

    /* ألوان مكتوبة بصريح العبارة: <canvas> ماكيقراش
       var(--brand) ديال CSS. */
    var C = {
        navy: "#2a0710",
        navy2: "#7a1426",
        brand: "#e3163f",
        brandLight: "#ff4a6b",
        sun: "#ffce00",
        good: "#2fbf71",
        mid: "#ffb703",
        low: "#ff5d6c",
        white: "#ffffff",
        dim: "rgba(255,255,255,.62)",
        line: "rgba(255,255,255,.14)"
    };

    function font(weight, size) {
        return weight + " " + size + 'px "Cairo", "Segoe UI", system-ui, sans-serif';
    }

    /* الخط خاصو يكون محمّل قبل ما نرسمو، وإلا كتخرج الصورة
       بخط النظام وكتبان مختلفة على كل جهاز. */
    function ready() {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        return Promise.all([
            document.fonts.load(font(900, 64)),
            document.fonts.load(font(700, 32)),
            document.fonts.load(font(400, 28))
        ]).catch(function () { /* الخط ماجاش: كنرسمو بالنظام */ });
    }

    function roundRect(ctx, x, y, w, h, r) {
        var k = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + k, y);
        ctx.arcTo(x + w, y, x + w, y + h, k);
        ctx.arcTo(x + w, y + h, x, y + h, k);
        ctx.arcTo(x, y + h, x, y, k);
        ctx.arcTo(x, y, x + w, y, k);
        ctx.closePath();
    }

    /* نفس الشكل ديال الموقع: 135,5 ماشي 135.5 */
    function num(n) {
        return (Math.round(Number(n) * 2) / 2).toString().replace(".", ",");
    }

    function barColor(p) {
        return p >= 0.8 ? C.good : p >= 0.6 ? C.mid : C.low;
    }

    /* الخلفية والعلامة — مشتركين بين بطاقة النتيجة وبطاقة التقدّم */
    function chrome(ctx) {
        /* ---- الخلفية ---- */
        var bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, C.navy2);
        bg.addColorStop(0.55, C.navy);
        bg.addColorStop(1, "#0a1330");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        /* شبكة خفيفة — نفس الإحساس ديال الموقع */
        ctx.strokeStyle = "rgba(255,255,255,.035)";
        ctx.lineWidth = 1;
        for (var g = 0; g < W; g += 60) {
            ctx.beginPath(); ctx.moveTo(g + .5, 0); ctx.lineTo(g + .5, H); ctx.stroke();
        }
        for (var gy = 0; gy < H; gy += 60) {
            ctx.beginPath(); ctx.moveTo(0, gy + .5); ctx.lineTo(W, gy + .5); ctx.stroke();
        }

        /* لمسة حمرا فالزاوية */
        var glow = ctx.createRadialGradient(W * 0.86, 90, 0, W * 0.86, 90, 520);
        glow.addColorStop(0, "rgba(227,22,63,.34)");
        glow.addColorStop(1, "rgba(227,22,63,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, 620);

        /* ---- العلامة ---- */
        var mx = 80, my = 84, ms = 92;
        var mg = ctx.createLinearGradient(mx, my, mx + ms, my + ms);
        mg.addColorStop(0, C.brandLight);
        mg.addColorStop(1, "#b30e30");
        ctx.fillStyle = mg;
        roundRect(ctx, mx, my, ms, ms, 26);
        ctx.fill();
        ctx.fillStyle = C.white;
        ctx.font = font(900, 44);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("DE", mx + ms / 2, my + ms / 2 + 2);

        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = C.white;
        ctx.font = font(900, 40);
        ctx.fillText("Deutsch Einfach", mx + ms + 26, my + 40);
        ctx.fillStyle = C.dim;
        ctx.font = font(700, 23);
        ctx.fillText("TELC PREP B1/B2", mx + ms + 26, my + 76);

    }

    /* الأسفل: الدومين + السطر ديال التعريف */
    function foot(ctx) {
        /* ---- الأسفل ---- */
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, H - 152);
        ctx.lineTo(W - 80, H - 152);
        ctx.stroke();

        ctx.fillStyle = C.white;
        ctx.font = font(900, 34);
        ctx.fillText(SITE, 80, H - 88);
        ctx.fillStyle = C.dim;
        ctx.font = font(700, 25);
        ctx.textAlign = "right";
        ctx.fillText("تمرّن على telc B1/B2 بالدارجة", W - 80, H - 88);
        ctx.textAlign = "left";

    }

    function draw(data) {
        var cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d");

        chrome(ctx);

        /* ---- عنوان الامتحان + شارة النجاح (نفس السطر) ---- */
        var pass = !!data.pass;
        var label = data.badge ? String(data.badge)
            : pass ? "BESTANDEN \u00b7 \u0646\u062c\u062d\u062a" : "\u0645\u0627\u0632\u0627\u0644 \u00b7 \u0642\u0631\u064a\u0628";
        ctx.font = font(900, 30);
        var lw = ctx.measureText(label).width;
        var pw = lw + 64, ph = 70, px = W - 80 - pw, py = 244;
        ctx.fillStyle = pass ? "rgba(47,191,113,.16)" : "rgba(255,183,3,.16)";
        roundRect(ctx, px, py, pw, ph, 35);
        ctx.fill();
        ctx.strokeStyle = pass ? "rgba(47,191,113,.55)" : "rgba(255,183,3,.55)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = pass ? C.good : C.sun;
        ctx.textAlign = "center";
        ctx.fillText(label, px + pw / 2, py + ph / 2 + 11);
        ctx.textAlign = "left";

        ctx.fillStyle = C.sun;
        ctx.font = font(800, 34);
        ctx.fillText(String(data.title || "Modelltest"), 80, py + ph / 2 + 12);

        /* ---- النتيجة الكبيرة ---- */
        var y = 500;
        ctx.fillStyle = C.white;
        ctx.font = font(900, 190);
        var big = num(data.score);
        ctx.fillText(big, 80, y);
        var bw = ctx.measureText(big).width;
        ctx.fillStyle = C.dim;
        ctx.font = font(800, 62);
        ctx.fillText("/ " + data.max, 80 + bw + 22, y);

        var pct = Math.round(data.score / data.max * 100);
        ctx.fillStyle = C.dim;
        ctx.font = font(700, 34);
        ctx.fillText(pct + "%", 82, y + 58);

        /* ---- تفصيل المهارات ---- */
        y = 672;
        var rows = data.rows || [];
        rows.forEach(function (r) {
            var name = r[0], got = r[1], max = r[2];
            var p = max ? Math.max(0, Math.min(1, got / max)) : 0;

            ctx.fillStyle = C.white;
            ctx.font = font(700, 31);
            ctx.fillText(name, 80, y);

            var txt = num(got) + " / " + max;
            ctx.fillStyle = C.dim;
            ctx.font = font(800, 29);
            ctx.textAlign = "right";
            ctx.fillText(txt, W - 80, y);
            ctx.textAlign = "left";

            var by = y + 22, bh = 16, bwFull = W - 160;
            ctx.fillStyle = "rgba(255,255,255,.10)";
            roundRect(ctx, 80, by, bwFull, bh, 8);
            ctx.fill();
            if (p > 0) {
                ctx.fillStyle = barColor(p);
                roundRect(ctx, 80, by, Math.max(bh, bwFull * p), bh, 8);
                ctx.fill();
            }
            y += 104;
        });

        /* ---- الـStreak ---- */
        if (data.streak && data.streak > 1) {
            ctx.fillStyle = C.sun;
            ctx.font = font(800, 30);
            ctx.fillText("🔥 " + data.streak + " يوم متتالي", 80, y + 14);
            y += 58;
        }

        foot(ctx);
        return cv;
    }

    /* JPEG ماشي PNG: نفس الشكل تقريباً (خلفية متدرجة + نص كبير)
       ولكن ~10 مرات أصغر. الداتا غالية عند بزاف ديال الناس،
       وWhatsApp على كل حال كيعاود يضغط الصورة. */
    /* ===== بطاقة التقدّم =====
       ماشي نتيجة امتحان: هادي للي كيقرا كل نهار. كيقدر يشاركها
       حتى إلا مادازش شي Modelltest — وهاد الشي كيخلي الصور
       كتخرج كل أسبوع ماشي كل شهر. */
    function drawProgress(data) {
        var cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d");

        chrome(ctx);

        /* ---- العنوان ---- */
        ctx.fillStyle = C.sun;
        ctx.font = font(800, 34);
        ctx.textAlign = "left";
        ctx.fillText("التقدّم ديالي · telc B2", 80, 290);

        /* ---- الـStreak الكبير ---- */
        var y = 470;
        ctx.fillStyle = C.white;
        ctx.font = font(900, 190);
        var big = String(data.streak || 0);
        ctx.fillText(big, 80, y);
        var bw = ctx.measureText(big).width;

        ctx.font = font(800, 54);
        ctx.fillText("🔥", 80 + bw + 26, y - 6);

        ctx.fillStyle = C.dim;
        ctx.font = font(700, 34);
        ctx.fillText("يوم متتالي ديال القراية", 82, y + 58);

        /* ---- عداد الامتحان ---- */
        if (data.daysToExam != null && data.daysToExam >= 0) {
            var t = data.daysToExam === 0
                ? "الامتحان اليوم"
                : "باقي " + data.daysToExam + " يوم للامتحان";
            ctx.font = font(900, 30);
            var lw = ctx.measureText(t).width;
            var pw = lw + 64, ph = 70, px = W - 80 - pw, py = 246;
            ctx.fillStyle = "rgba(227,22,63,.18)";
            roundRect(ctx, px, py, pw, ph, 35);
            ctx.fill();
            ctx.strokeStyle = "rgba(255,74,107,.55)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = C.brandLight;
            ctx.textAlign = "center";
            ctx.fillText(t, px + pw / 2, py + ph / 2 + 11);
            ctx.textAlign = "left";
        }

        /* ---- رقمين ديال التمارين ---- */
        y = 624;
        var kpis = [
            [String(data.count || 0), "تمرين مصحّح"],
            [(data.avg == null ? "–" : Math.round(data.avg * 100) + "%"), "المعدل"]
        ];
        kpis.forEach(function (k, i) {
            var x = 80 + i * 300;
            ctx.fillStyle = C.white;
            ctx.font = font(900, 62);
            ctx.fillText(k[0], x, y);
            ctx.fillStyle = C.dim;
            ctx.font = font(700, 26);
            ctx.fillText(k[1], x, y + 40);
        });

        /* ---- المهارات ---- */
        y = 742;
        (data.skills || []).forEach(function (s) {
            var name = s[0], p = s[1];
            ctx.fillStyle = C.white;
            ctx.font = font(700, 30);
            ctx.fillText(name, 80, y);

            ctx.fillStyle = C.dim;
            ctx.font = font(800, 28);
            ctx.textAlign = "right";
            ctx.fillText(p == null ? "–" : Math.round(p * 100) + "%", W - 80, y);
            ctx.textAlign = "left";

            var by = y + 20, bh = 14, bwFull = W - 160;
            ctx.fillStyle = "rgba(255,255,255,.10)";
            roundRect(ctx, 80, by, bwFull, bh, 7);
            ctx.fill();
            if (p > 0) {
                ctx.fillStyle = barColor(p);
                roundRect(ctx, 80, by, Math.max(bh, bwFull * p), bh, 7);
                ctx.fill();
            }
            y += 80;
        });

        foot(ctx);
        return cv;
    }

    function toBlob(cv) {
        return new Promise(function (res, rej) {
            if (!cv.toBlob) { rej(new Error("no toBlob")); return; }
            cv.toBlob(function (b) {
                if (b) { res(b); return; }
                cv.toBlob(function (p) { p ? res(p) : rej(new Error("no blob")); }, "image/png");
            }, "image/jpeg", 0.92);
        });
    }

    /* ---------- الواجهة ---------- */
    function open(data) {
        var wrap = document.createElement("div");
        wrap.className = "tr-modal ds-modal";
        wrap.innerHTML =
            '<div class="ds-box">' +
            '<div class="ds-preview"><div class="ds-spin"></div></div>' +
            '<div class="ds-actions">' +
            '<button type="button" class="tr-btn tr-btn-gold" data-ds="share" hidden>شارك النتيجة</button>' +
            '<button type="button" class="tr-btn" data-ds="save" hidden>حمّل الصورة</button>' +
            '<button type="button" class="tr-btn" data-ds="close">إغلاق</button>' +
            "</div>" +
            '<p class="ds-note"></p>' +
            "</div>";
        document.body.appendChild(wrap);

        var preview = wrap.querySelector(".ds-preview");
        var note = wrap.querySelector(".ds-note");
        var btnShare = wrap.querySelector('[data-ds="share"]');
        var btnSave = wrap.querySelector('[data-ds="save"]');

        function close() {
            if (url) URL.revokeObjectURL(url);
            wrap.remove();
        }
        wrap.querySelector('[data-ds="close"]').addEventListener("click", close);
        wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
        document.addEventListener("keydown", function esc(e) {
            if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
        });

        var url = null, file = null;

        ready().then(function () {
            var cv = (data.mode === "progress" ? drawProgress : draw)(data);
            return toBlob(cv);
        }).then(function (blob) {
            url = URL.createObjectURL(blob);
            var ext = blob.type === "image/png" ? ".png" : ".jpg";
            var name = (data.kind || "deutsch-einfach") + ext;
            file = new File([blob], name, { type: blob.type });

            var img = document.createElement("img");
            img.src = url;
            img.alt = "النتيجة";
            preview.innerHTML = "";
            preview.appendChild(img);

            btnSave.hidden = false;
            btnSave.addEventListener("click", function () {
                var a = document.createElement("a");
                a.href = url;
                a.download = name;
                a.click();
            });

            /* WhatsApp كيتسنا ملف — navigator.share هو الوحيد
               اللي كيصيفط صورة مباشرة. إلا مامكانش (PC عادة)،
               كنخليو غير التحميل. */
            var can = navigator.canShare && navigator.canShare({ files: [file] });
            if (can && navigator.share) {
                btnShare.hidden = false;
                btnShare.addEventListener("click", function () {
                    navigator.share({
                        files: [file],
                        text: (data.shareText || "") + "\n" + (data.url || "https://" + SITE)
                    }).catch(function () { /* المستخدم لغا: ماشي مشكل */ });
                });
                note.textContent = "صيفطها ل WhatsApp ولا حطها ف الـ Status.";
            } else {
                note.textContent = "حمّل الصورة و شاركها فين ما بغيتي.";
            }
        }).catch(function (err) {
            preview.innerHTML = "";
            note.textContent = "ما قدرناش نصاوبو الصورة.";
            if (window.console) console.warn("share-card:", err);
        });

        return wrap;
    }

    window.DEShare = { open: open, draw: draw, drawProgress: drawProgress };
}());
