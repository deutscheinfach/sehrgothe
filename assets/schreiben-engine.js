/* Deutsch Einfach — Schreiben Engine (B1 و B2)
   Requires: schreiben-topics-b2.js (SCHREIBEN_B2_TOPICS) ولا
   schreiben-topics-b1.js (SCHREIBEN_B1_TOPICS) loaded first,
   a global TOPIC_ID string ("01".."41") set on the page,
   و TOPIC_LEVEL = "b1" فالصفحات ديال B1 (بلاه = b2). */

/* ==========================================================
   ⚙️ CONFIG — set this to your deployed Cloudflare Worker URL
   Example: "https://deutscheinfach-correction.YOURNAME.workers.dev"
   See /worker/cloudflare-worker.js + SETUP-GUIDE.md
   ========================================================== */
const CORRECTION_ENDPOINT = "https://deutsch-einfach-correction.soufianemouyr.workers.dev";

/* فتح الاتصال مع الـ Worker من دابا.
   الـ handshake (DNS + TCP + TLS) كياخذ نص ثانية تقريبا ف 4G،
   ومنين يبرك الطالب على "تصحيح" أو "ترجمة" كيكون ديجا محلول. */
(function preconnectToWorker() {
    try {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = CORRECTION_ENDPOINT;
        link.crossOrigin = "";
        document.head.appendChild(link);
    } catch (error) {
        /* ماشي مشكل: هادي غير تسريع. */
    }
})();

/* العروض — نفس اللي فـ payment.html */
const PREMIUM_OFFERS = [
    {
        name: "باقة 15 يوم",
        sub: "بداية سريعة ومميزة.",
        amount: "49 DH",
        per: "/ 15 يوم",
        tag: "",
    },
    {
        name: "باقة شهر واحد",
        sub: "تحضير أقوى ووقت أكثر.",
        amount: "99 DH",
        per: "/ شهر",
        tag: "الأكثر طلباً",
    },
    {
        name: "باقة شهرين",
        sub: "أفضل اختيار للتحضير المكثف.",
        amount: "150 DH",
        per: "/ شهرين",
        tag: "",
    },
];

const OFFER_FEATURES = [
    "وصول كامل لمواضيع Lesen و Hören و Schreiben",
    "تصحيح Schreiben بالذكاء الاصطناعي (لامحدود)",
    "المساعد الذكي للقراءة (لامحدود)",
    "المقاطع الصوتية ديال Hören",
];

/* WhatsApp: الرقم والرسالة المرتبة كيجيو من assets/whatsapp.js.
   إلا ماتحملش لشي سبب، كيبقى غير الرابط للرقم. */
function waUrl(options) {
    return typeof window.deWhatsAppUrl === "function"
        ? window.deWhatsAppUrl(options)
        : "https://wa.me/212776551898";
}

/* المستوى ديال الصفحة */
const LEVEL = (typeof TOPIC_LEVEL !== "undefined" && TOPIC_LEVEL) ? TOPIC_LEVEL : "b2";
const HUB = LEVEL + "-schreiben.html";
const TOPICS = window["SCHREIBEN_" + LEVEL.toUpperCase() + "_TOPICS"]
    || (LEVEL === "b2" && typeof SCHREIBEN_B2_TOPICS !== "undefined" ? SCHREIBEN_B2_TOPICS : null);

/* الطالب كيخرج من الصفحة: الطلبات اللي باقين كيتقطعو («Failed to fetch») */
let leaving = false;
window.addEventListener("pagehide", function () { leaving = true; });
window.addEventListener("pageshow", function () { leaving = false; });

/* زر الوضع المظلم: ف الشريط ديال فوق (قبل كان عايم لتحت وكيغطي النص).
   theme-toggle.js ما كيزيدش الزر العايم إلا لقا .de-theme-btn ف الصفحة. */
(function headerTools() {
    /* طول الشريط → --hdr (خانة الكتابة كتبقى لاصقة تحتو ف PC) */
    const bar = document.querySelector(".task-header");
    if (bar) {
        const setH = function () { document.documentElement.style.setProperty("--hdr", bar.offsetHeight + "px"); };
        setH();
        if (window.ResizeObserver) new ResizeObserver(setH).observe(bar);
    }
    const right = document.querySelector(".task-header .right");
    if (!right || !window.__deTheme || document.querySelector(".de-theme-btn")) return;
    const btn = window.__deTheme.button("icon-btn");
    right.insertBefore(btn, right.firstChild);
})();

/* نص الإعلان / الرسالة: بلا تنسيق كان كيبان سطور مكدسين.
   B2: إعلان → عنوان، لائحة (•)، فقرات، ومعلومات الاتصال صغار لتحت.
   B1: رسالة (Liebe…) → ورقة بخط عادي. */
function renderAd(box, text) {
    box.textContent = "";
    const src = String(text || "").replace(/\r/g, "").trim();
    if (!src) { box.hidden = true; return; }
    const letter = /^(liebe|lieber|hallo|hi |sehr geehrte)/i.test(src);
    box.className = letter ? "ad-letter" : "ad-flyer";
    if (!letter) {
        const tag = document.createElement("span");
        tag.className = "ad-tag";
        tag.textContent = "Anzeige";
        box.appendChild(tag);
    }
    const contact = /(www\.|https?:|@|\+\d|\btel\.?|\btelefon|\b\d{5}\b)/i;
    let first = !letter;
    src.split(/\n\s*\n/).forEach(function (para) {
        const lines = para.split("\n").map(function (l) { return l.trim(); }).filter(Boolean);
        let list = null;
        lines.forEach(function (line) {
            if (/^[•·\-–]\s*/.test(line) && line.length > 2) {
                if (!list) { list = document.createElement("ul"); list.className = "ad-list"; box.appendChild(list); }
                const li = document.createElement("li");
                li.textContent = line.replace(/^[•·\-–]\s*/, "");
                list.appendChild(li);
                return;
            }
            list = null;
            const el = document.createElement(first ? "h3" : "p");
            if (first) el.className = "ad-title";
            else if (!letter && contact.test(line) && line.length < 90) el.className = "ad-contact";
            else if (!letter && line.length < 60 && line === line.toUpperCase() && /[A-ZÄÖÜ]{3}/.test(line)) el.className = "ad-shout";
            el.textContent = line;
            box.appendChild(el);
            first = false;
        });
    });
}

(async function () {
    const meta = (TOPICS || {})[TOPIC_ID];
    if (!meta) {
        showNotice("❓", "Thema nicht gefunden.", "هاد الموضوع ماكاينش.", '<a class="premium-btn ghost" href="' + HUB + '">← رجع للمواضيع</a>', false);
        return;
    }

    /* المواضيع Premium ما كيجيوش فالملف العام (الـ repo عام):
       كنجيبو النص من الـ Worker من بعد ما يتحقق من الاشتراك. */
    let topic = meta;

    /* الموضوع ما زال ماوصلش المحتوى ديالو */
    if (meta.soon) {
        showNotice("⏳", "Dieses Thema wird gerade vorbereitet.",
            "المحتوى ديال هاد الموضوع كنوجدوه دابا. تسنانا شوية 🙏",
            '<a class="premium-btn ghost" href="' + HUB + '">← رجع للمواضيع</a>', false);
        return;
    }

    if (!Array.isArray(meta.points) || meta.points.length === 0) {
        /* قبل كانت الصفحة كتبقى خاوية حتى يجاوب Firebase والـ Worker */
        const titleEl = document.getElementById("task-title");
        if (titleEl && meta.title) titleEl.textContent = meta.title;
        const waitEl = document.getElementById("situation-text");
        if (waitEl) {
            /* هيكل رمادي بلاصة «كنجيبو…» (diag.js) — كيتمسح ملي يوصل النص */
            waitEl.textContent = "";
            const skel = window.__deSkeleton ? window.__deSkeleton("text") : null;
            if (skel) {
                waitEl.appendChild(skel);
                if (window.__deNetHint) window.__deNetHint(skel);
            }
        }

        const saved = cacheGet();
        if (saved) {
            topic = Object.assign({}, meta, saved);
        } else {
            /* صفحة محضرة ف الخفا (prerender): ما كنسولوش الـ Worker حتى
               يدخل الطالب بصح — ممكن ما يدخلش، والطلب كيتقطع ف الوسط. */
            if (document.prerendering) {
                await new Promise(function (go) {
                    document.addEventListener("prerenderingchange", go, { once: true });
                });
            }
            const t0 = Date.now();
            /* بلا أنترنت: النسخة المحفوظة ف التيليفون (__deStore، diag.js) */
            const KEY = LEVEL === "b2" ? "t:" + TOPIC_ID : "l:schreiben-" + LEVEL + "-" + TOPIC_ID;
            const stored = function () {
                return window.__deStore ? window.__deStore.get(KEY) : Promise.resolve(null);
            };
            const off = navigator.onLine === false ? await stored() : null;
            if (off && Array.isArray(off.points)) {
                topic = Object.assign({}, meta, off);
            } else try {
                const data = await loadPremiumTopic(TOPIC_ID).catch(async function (error) {
                    /* الـ Worker ما جاوبش (الشبكة): المحفوظة إلا كاينة */
                    if (error && (error.code === "network" || /fetch|network|abort|timeout/i.test(String(error.message || error)))) {
                        const late = await stored();
                        if (late && Array.isArray(late.points)) return Object.assign({ __offline: true }, late);
                    }
                    throw error;
                });
                if (window.__deStore && !data.__offline) window.__deStore.put(KEY, data);
                if (window.__deDiag && Date.now() - t0 > 8000) window.__deDiag("slow", "Schreiben " + LEVEL + "-" + TOPIC_ID + " بطا: " + Math.round((Date.now() - t0) / 1000) + "s", { ms: Date.now() - t0 });
                if (!data.__offline) cacheSet(data);
                topic = Object.assign({}, meta, data);
            } catch (error) {
                showPremiumNotice(error.code || String(error.message || error));
                return;
            }
        }
    }

    // ---------- render header ----------
    document.title = "Telc " + (topic.level || LEVEL.toUpperCase()) + " Schreiben: " + topic.title + " | Deutsch Einfach";
    document.getElementById("task-title").textContent = topic.title;
    document.getElementById("task-sub").textContent =
        topic.level + " · " + topic.type;

    // ---------- render situation ----------
    renderAd(document.getElementById("situation-ad"), topic.ad);
    document.getElementById("situation-text").textContent = topic.situation;

    // ---------- render aufgabe points ----------
    const pointsWrap = document.getElementById("aufgabe-points");
    topic.points.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "point-row";
        row.innerHTML =
            '<span class="point-num">' + (i + 1) + "</span><span>" + p + "</span>";
        pointsWrap.appendChild(row);
    });

    // ---------- aufgabe intro (اختياري: B1 عندو جملة خاصة) ----------
    if (topic.intro) {
        const introEl = document.querySelector(".aufgabe-intro");
        if (introEl) introEl.textContent = topic.intro;
    }
    if (!topic.situation) {
        const sit = document.getElementById("situation-text");
        if (sit) sit.hidden = true;
    }

    // ---------- expected length ----------
    /* TELC كيحدد عدد الكلمات، والتصحيح كيحسبو. */
    if (topic.words) {
        const intro = document.querySelector(".aufgabe-intro");
        if (intro) {
            const badge = document.createElement("span");
            badge.className = "words-badge";
            badge.textContent = topic.words + " Wörter";
            intro.appendChild(badge);
        }
    }

    const CORRECT_LABEL = document.getElementById("correct-btn").innerHTML;

    // ---------- timer ----------
    const timerEl = document.getElementById("timer-pill");
    let totalSeconds = (parseInt(topic.time, 10) || 30) * 60;
    function tick() {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        const timerT = document.getElementById("timer-t") || timerEl;
        timerT.textContent =
            (timerT === timerEl ? "⏱ " : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
        if (totalSeconds <= 120) timerEl.classList.add("low");
        if (totalSeconds > 0) totalSeconds--;
    }
    /* الصفحة تقدر تكون محضرة من قبل (prerender من اللائحة): المؤقت ما
       كيبداش حتى يشوفها الطالب بصح. */
    function startTimer() { tick(); setInterval(tick, 1000); }
    if (document.prerendering) {
        tick();
        totalSeconds++;
        document.addEventListener("prerenderingchange", startTimer, { once: true });
    } else startTimer();


    // ---------- fullscreen ----------
    document.getElementById("fullscreen-toggle").addEventListener("click", function () {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    });

    // ---------- back ----------
    /* جينا من اللائحة؟ نرجعو ليها بالـ history: المتصفح كيرجعها كيف ما
       كانت (نفس البلاصة، بلا ما تتعاود تتحمل). وإلا (رابط مباشر):
       كنحلو اللائحة، وهي كترجع للبلاصة المحفوظة (schreiben-hub.js). */
    document.getElementById("back-btn").addEventListener("click", function () {
        let fromHub = false;
        try {
            const ref = new URL(document.referrer);
            fromHub = ref.origin === location.origin && ref.pathname.replace(/^\//, "") === HUB;
        } catch (e) { /* ماكاينش referrer */ }
        if (fromHub && history.length > 1) history.back();
        else window.location.href = HUB;
    });

    // ---------- textarea + word count + placeholder ----------
    const textarea = document.getElementById("answer-text");
    const placeholder = document.getElementById("editor-placeholder");
    const wordCountEl = document.getElementById("word-count");

    /* الهدف ديال TELC (مثلا "150–180"): العداد كيولي «45 / 150» مع شريط */
    const target = parseInt(String(topic.words || "").match(/\d+/) || "0", 10) || (LEVEL === "b2" ? 150 : 80);
    const meter = document.createElement("span");
    meter.className = "wc-meter";
    meter.innerHTML = '<span class="wc-meter-fill"></span>';
    wordCountEl.after(meter);
    function updateWordCount() {
        const text = textarea.value.trim();
        const words = text.length ? text.split(/\s+/).length : 0;
        wordCountEl.innerHTML = "<b>" + words + "</b> / " + target + " كلمة";
        wordCountEl.classList.toggle("is-done", words >= target);
        meter.firstChild.style.width = Math.min(100, Math.round(words / target * 100)) + "%";
        meter.classList.toggle("is-done", words >= target);
        placeholder.classList.toggle("hidden", text.length > 0);
    }
    textarea.addEventListener("input", updateWordCount);
    updateWordCount();

    // ---------- umlaut insert buttons ----------
    document.querySelectorAll("[data-umlaut]").forEach((btn) => {
        btn.addEventListener("click", function () {
            const ch = btn.getAttribute("data-umlaut");
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value =
                textarea.value.slice(0, start) + ch + textarea.value.slice(end);
            textarea.selectionStart = textarea.selectionEnd = start + ch.length;
            textarea.focus();
            updateWordCount();
        });
    });

    // ---------- translation ----------
    /* كنخزنو الترجمة باش الضغطة الثانية تخبي/تبين بلا ما نعاودو الطلب،
       وكنحتافضو بيها ف localStorage حتى من بعد ما يسد الصفحة:
       الترجمة ديال نفس النص ماكتبدلش، إذن ماكاين علاش نعاودو نسولو Gemini. */
    const TRANSLATION_STORE_PREFIX = "de-translation:";

    function translationKey(kind, source) {
        /* hash بسيط على النص: إلا تبدل النص، الترجمة القديمة كتسقط وحدها. */
        let hash = 5381;
        for (let i = 0; i < source.length; i++) {
            hash = ((hash << 5) + hash + source.charCodeAt(i)) | 0;
        }
        return TRANSLATION_STORE_PREFIX + TOPIC_ID + ":" + kind + ":" + (hash >>> 0).toString(36);
    }

    function readStoredTranslation(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function writeStoredTranslation(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            /* الذاكرة عامرة ولا الـ navigateur حاصر التخزين: ماشي مشكل. */
        }
    }

    const translationCache = {};

    const translationSources = {
        situation: () => topic.ad + "\n\n" + topic.situation,
        aufgabe: () => topic.points.map((p, i) => (i + 1) + ". " + p).join("\n"),
    };

    document.querySelectorAll("[data-translate]").forEach((btn) => {
        const kind = btn.getAttribute("data-translate");
        const box = document.getElementById("translation-" + kind);
        if (!box || !translationSources[kind]) return;

        btn.addEventListener("click", async function () {
            const source = translationSources[kind]();
            const storeKey = translationKey(kind, source);

            // عندنا الترجمة ديجا: غير نبينوها/نخبيوها.
            if (!translationCache[kind]) {
                const stored = readStoredTranslation(storeKey);
                if (stored) {
                    translationCache[kind] = stored;
                    box.textContent = stored;
                }
            }
            if (translationCache[kind]) {
                box.hidden = !box.hidden;
                return;
            }

            btn.setAttribute("aria-busy", "true");
            box.classList.remove("error");
            box.innerHTML =
                'جاري الترجمة <span class="loading-dots"><span></span><span></span><span></span></span>';
            box.hidden = false;

            try {
                const res = await fetch(CORRECTION_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        translate: { text: source },
                    }),
                });

                const raw = await res.text();
                let data = null;
                try {
                    data = JSON.parse(raw);
                } catch (parseError) {
                    data = null;
                }

                if (!res.ok || !data || !data.translation) {
                    const serverMessage = data
                        ? [data.error, data.details].filter(Boolean).join(" — ")
                        : raw.slice(0, 200);
                    throw new Error("HTTP " + res.status + (serverMessage ? " · " + serverMessage : ""));
                }

                translationCache[kind] = data.translation;
                writeStoredTranslation(storeKey, data.translation);
                box.textContent = data.translation;
            } catch (err) {
                const message = String(err && err.message ? err.message : err);
                box.classList.add("error");
                box.textContent = "ما قدرناش نترجمو. " + message + "\n" + errorHint(message);
            } finally {
                btn.removeAttribute("aria-busy");
            }
        });
    });

    // ---------- AI correction ----------
    const correctBtn = document.getElementById("correct-btn");
    const overlay = document.getElementById("result-overlay");
    const resultBody = document.getElementById("result-body");

    correctBtn.addEventListener("click", async function () {
        const studentText = textarea.value.trim();
        if (studentText.length < 20) {
            alert("كتب جواب أطول قبل ما تصحح.");
            return;
        }

        correctBtn.disabled = true;
        correctBtn.innerHTML =
            'كيتصحح <span class="loading-dots"><span></span><span></span><span></span></span>';

        overlay.classList.remove("hidden");
        resultBody.innerHTML =
            '<p style="text-align:center;padding:30px 0">جاري التصحيح…</p>';

        try {
            const res = await fetch(CORRECTION_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    level: topic.level,
                    taskType: topic.type,
                    situation: topic.situation,
                    ad: topic.ad,
                    points: topic.points,
                    words: topic.words || "",
                    studentText: studentText,
                }),
            });

            // كنقراو الجواب ديما، حتى ملي كيكون خطأ،
            // باش نوريو الرسالة الحقيقية اللي كيرجع الـ Worker.
            const raw = await res.text();

            let data = null;
            try {
                data = JSON.parse(raw);
            } catch (parseError) {
                data = null;
            }

            if (!res.ok) {
                const serverMessage = data
                    ? [data.error, data.details].filter(Boolean).join(" — ")
                    : raw.slice(0, 300);

                throw new Error(
                    "HTTP " + res.status + (serverMessage ? " · " + serverMessage : "")
                );
            }

            if (!data) throw new Error("الـ Worker رجّع جواب ماشي JSON: " + raw.slice(0, 300));

            renderResult(data);
        } catch (err) {
            const message = String(err && err.message ? err.message : err);

            resultBody.innerHTML =
                '<div class="error-banner"><strong>وقع مشكل فالتصحيح.</strong><br>' +
                escapeHtml(message) +
                "<br><br>" +
                escapeHtml(errorHint(message)) +
                "</div>";
        } finally {
            correctBtn.disabled = false;
            correctBtn.innerHTML = CORRECT_LABEL;
        }
    });

    // زر الإغلاق اختياري: شي صفحات ماعندهاش، وخاصنا ما نطيحوش السكريبت كامل.
    const resultClose = document.getElementById("result-close");
    if (resultClose) {
        resultClose.addEventListener("click", function () {
            overlay.classList.add("hidden");
        });
    }

    // الإغلاق بالضغط برّا الكارد ولا بـ Escape
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) overlay.classList.add("hidden");
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") overlay.classList.add("hidden");
    });

    function renderResult(data) {
        // Expected shape from the worker/AI:
        // { score: number (0-45), summary: string,
        //   strengths: string[], improvements: string[],
        //   corrected_text: string }
        const score = Math.max(0, Math.min(45, Number(data.score) || 0));
        const pct = Math.round((score / 45) * 100);

        /* Fortschritt و Modelltest كيسمعو لهاد الحدث */
        try {
            window.dispatchEvent(new CustomEvent("schreiben-points", {
                detail: { id: (LEVEL === "b2" ? "schreiben-" : "schreiben-" + LEVEL + "-") + TOPIC_ID, title: "Thema " + TOPIC_ID + " – " + (topic.title || ""), score: score }
            }));
        } catch (e) { /* */ }

        let html = "";
        html += '<div class="result-score"><span class="num">' + score +
            '</span><span class="max">/ 45</span></div>';
        html += '<div class="result-bar"><div class="result-bar-fill" style="width:' +
            pct + '%"></div></div>';

        /* شبكة telc: 3 معايير (A/B/C/D) — كيرجعها الـ Worker الجديد */
        const crit = data.criteria || {};
        const critRows = [
            ["inhalt", "المضمون", "Aufgabenbewältigung"],
            ["kommunikation", "التواصل والتنظيم", "Kommunikative Gestaltung"],
            ["form", "القواعد والكلمات", "Formale Richtigkeit"],
        ].filter((r) => crit[r[0]]);
        if (critRows.length) {
            html += '<div class="result-section"><h3>📊 التقييم بحال telc</h3><div class="crit-list">' +
                critRows.map((r) => {
                    const c = crit[r[0]];
                    const g = String(c.grade || "D");
                    return '<div class="crit-row crit-' + escapeHtml(g) + '">' +
                        '<span class="crit-grade">' + escapeHtml(g) + "</span>" +
                        '<div class="crit-body"><b>' + r[1] + ' <small dir="ltr">' + r[2] + "</small></b>" +
                        (c.reason ? "<p>" + escapeHtml(c.reason) + "</p>" : "") + "</div>" +
                        '<span class="crit-pts">' + (Number(c.points) || 0) + "/15</span></div>";
                }).join("") + "</div></div>";
        }

        if (Array.isArray(data.leitpunkte) && data.leitpunkte.length) {
            const icon = { ja: "✅", teilweise: "⚠️", nein: "❌" };
            const label = { ja: "مجاوب", teilweise: "قصير بزاف", nein: "ناقص" };
            html += '<div class="result-section"><h3>📌 النقط ديال المهمة</h3><ul class="lp-list">' +
                data.leitpunkte.map((p, i) =>
                    "<li>" + (icon[p.status] || "❌") + " <span dir=\"ltr\">" +
                    escapeHtml((topic.points && topic.points[i]) || p.punkt || "") + "</span> <small>" +
                    (label[p.status] || "") + "</small></li>").join("") + "</ul></div>";
        }

        if (Number(data.word_count) > 0) {
            const wc = Number(data.word_count), min = Number(data.min_words) || 0;
            const ok = !min || wc >= min;
            html += '<p class="wc-note ' + (ok ? "ok" : "short") + '">📝 ' + wc + " كلمة" +
                (min ? (ok ? " — العدد مزيان." : " — خاصك على الأقل " + min + " كلمة.") : "") + "</p>";
        }

        if (data.summary) {
            html += '<div class="result-section"><h3>📝 ملاحظة عامة</h3><p>' +
                escapeHtml(data.summary) + "</p></div>";
        }
        if (data.strengths && data.strengths.length) {
            html += '<div class="result-section"><h3>✅ نقاط قوية</h3><ul>' +
                data.strengths.map((s) => "<li>" + escapeHtml(s) + "</li>").join("") +
                "</ul></div>";
        }
        if (data.improvements && data.improvements.length) {
            html += '<div class="result-section"><h3>🔧 نقاط للتحسين</h3><ul>' +
                data.improvements.map((s) => "<li>" + escapeHtml(s) + "</li>").join("") +
                "</ul></div>";
        }
        if (data.corrected_text) {
            html += '<div class="result-section"><h3>✍️ نسخة مصححة</h3><p style="white-space:pre-wrap">' +
                escapeHtml(data.corrected_text) + "</p></div>";
        }
        html += '<button class="result-close-btn result-close" id="result-close-2">فهمت، شكراً</button>';

        resultBody.innerHTML = html;
        document.getElementById("result-close-2").addEventListener("click", function () {
            overlay.classList.add("hidden");
        });
    }

    /* كتعطي شرح بالدارجة حسب نوع الخطأ */
    function errorHint(message) {
        const m = message.toLowerCase();

        if (m.indexOf("failed to fetch") !== -1 || m.indexOf("networkerror") !== -1) {
            return "💡 ما وصلناش للـ Worker: تأكد من CORRECTION_ENDPOINT، وأن الـ Worker مـ deployé، وأن ALLOWED_ORIGIN موافق للدومين ديال الموقع.";
        }
        if (m.indexOf("gemini_api_key") !== -1) {
            return "💡 المفتاح ما مضاف والو: زيد Secret سميتو GEMINI_API_KEY فـ Cloudflare (Workers → Settings → Variables → Secrets) وعاود Deploy.";
        }
        if (m.indexOf("api key not valid") !== -1 || m.indexOf("api_key_invalid") !== -1 || m.indexOf("http 401") !== -1 || m.indexOf("http 403") !== -1) {
            return "💡 المفتاح خايب ولا expiré: جيب واحد جديد من https://aistudio.google.com/apikey وبدّلو فـ Cloudflare.";
        }
        if (m.indexOf("high demand") !== -1 || m.indexOf("overloaded") !== -1 || m.indexOf("http 503") !== -1) {
            return "💡 السيرفرات ديال Gemini معمّرين دابا. تسنا شي دقيقة وعاود — المشكل مؤقت وماشي منك.";
        }
        if (m.indexOf("quota") !== -1 || m.indexOf("resource_exhausted") !== -1 || m.indexOf("http 429") !== -1) {
            return "💡 سالا الـ quota المجاني ديال اليوم. تسنا شوية ولا استعمل مفتاح آخر.";
        }
        if (m.indexOf("http 500") !== -1 || m.indexOf("http 502") !== -1) {
            return "💡 مشكل من جيهة الـ Worker. شوف اللوغ: npx wrangler tail";
        }

        return "💡 عاود المحاولة، وإلا بقا المشكل شوف اللوغ ديال الـ Worker: npx wrangler tail";
    }

    /* ===== كاش ف المتصفح =====
       الموضوع اللي تجاب مرة كيبقى عند المشترك 3 أيام (مربوط بالحساب)،
       وكيبان دغيا بلا ما نتسناو Firebase والـ Worker. */
    function cacheKey() {
        try {
            const a = JSON.parse(localStorage.getItem("deutschEinfachLastAccount") || "null");
            if (!a || a.premium !== true || !a.uid) return "";
            /* بلا أنترنت والتصريح سالا (diag.js): ما كنعطيوش المحفوظ */
            if (navigator.onLine === false && window.__deOfflinePass && !window.__deOfflinePass.ok(a.uid)) return "";
            return "de-sp:" + a.uid + "|" + LEVEL + "-" + TOPIC_ID;
        } catch (e) { return ""; }
    }
    function cacheGet() {
        const key = cacheKey();
        if (!key) return null;
        try {
            const v = JSON.parse(localStorage.getItem(key) || "null");
            if (v && v.data && Array.isArray(v.data.points) && Date.now() - v.t < 3 * 24 * 3600 * 1000) return v.data;
        } catch (e) { /* */ }
        return null;
    }
    function cacheSet(data) {
        const key = cacheKey();
        if (!key) return;
        try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: data })); } catch (e) { /* المساحة عامرة */ }
    }

    async function loadPremiumTopic(id) {
        /* Firebase ما جاوبش ف 15 ثانية = مشكل ف الأنترنت (ماشي صفحة خاوية للأبد) */
        const idToken = await Promise.race([
            window.__deutschEinfachIdToken || Promise.resolve(null),
            new Promise(function (_, fail) {
                setTimeout(function () { const e = new Error("timeout"); e.code = "network"; fail(e); }, 15000);
            })
        ]);

        /* text/plain بدل application/json: المتصفح كيعتابرو "طلب بسيط" وما كيديرش
           preflight (OPTIONS) قبل — رحلة كاملة أقل. الـ Worker كيقرا الجسم
           بـ request.json() ومايهمّوش الـ Content-Type. */
        const guard = typeof AbortController === "function" ? new AbortController() : null;
        const timer = guard ? setTimeout(function () { guard.abort(); }, 20000) : 0;
        const res = await fetch(CORRECTION_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            signal: guard ? guard.signal : undefined,
            /* B2: topicId → KV "topic-NN" / "premium-topics".
               B1: الطريق ديال Lesen → KV "lesen-schreiben-b1-NN"
               (بلا ما نبدلو الـ Worker). */
            body: JSON.stringify(LEVEL === "b2"
                ? { topicId: id, idToken: idToken || "" }
                : { lesenId: "schreiben-" + LEVEL + "-" + id, idToken: idToken || "" }),
        });

        const raw = await res.text();
        clearTimeout(timer);
        let data = null;
        try {
            data = JSON.parse(raw);
        } catch (parseError) {
            data = null;
        }

        if (res.ok && data && Array.isArray(data.points)) return data;

        const error = new Error("HTTP " + res.status);
        error.code = data && data.error ? data.error : "HTTP " + res.status;
        throw error;
    }


    function offerHtml(offer) {
        return (
            '<div class="offer-box' + (offer.tag ? " best" : "") + '">' +
            (offer.tag ? '<span class="offer-tag">' + offer.tag + "</span>" : "") +
            "<h3>" + offer.name + "</h3>" +
            '<p class="sub">' + offer.sub + "</p>" +
            '<div><span class="amount">' + offer.amount + '</span> ' +
            '<span class="per">' + offer.per + "</span></div>" +
            "<ul>" +
            OFFER_FEATURES.map(function (f) { return "<li>" + f + "</li>"; }).join("") +
            "</ul>" +
            '<a class="premium-btn whatsapp" style="margin-top:18px" target="_blank" ' +
            'rel="noopener noreferrer" href="' + waUrl({
                offer: offer.name + " – " + offer.amount,
                section: "Schreiben " + LEVEL.toUpperCase(),
                topic: meta.title || ""
            }) + '">الترقية عبر WhatsApp</a>' +
            "</div>"
        );
    }

    /* كنبدلو الصفحة كاملة: ما خاصش المحتوى يبان ولو للحظة. */
    function showNotice(lock, titleText, bodyText, actionsHtml, withOffers) {
        document.body.innerHTML =
            '<div class="premium-screen">' +
            '<div class="premium-card">' +
            '<div class="premium-lock">' + lock + "</div>" +
            "<h1>" + titleText + "</h1>" +
            "<p>" + bodyText + "</p>" +
            '<div class="premium-actions">' + actionsHtml + "</div>" +
            "</div>" +
            (withOffers
                ? '<div class="offers-sheet" id="offers-sheet" hidden><div class="offers-grid">' +
                  PREMIUM_OFFERS.map(offerHtml).join("") +
                  "</div></div>"
                : "") +
            "</div>";

        const toggle = document.getElementById("offers-toggle");
        const sheet = document.getElementById("offers-sheet");

        if (toggle && sheet) {
            toggle.addEventListener("click", function () {
                sheet.hidden = !sheet.hidden;
                toggle.textContent = sheet.hidden ? "📦 شوف العروض" : "✕ خبي العروض";
                if (!sheet.hidden) sheet.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
    }

    function showPremiumNotice(code) {
        const back = '<a class="premium-btn ghost" href="' + HUB + '">← رجع للمواضيع</a>';

        if (code === "not_signed_in") {
            showNotice(
                "🔒",
                "خاصك تسجل الدخول",
                "هاد الموضوع ديال المشتركين. دخل لحسابك باش تكمل، وإلا ما عندكش حساب صايب واحد فدقيقة.",
                '<a class="premium-btn gold" href="login.html">تسجيل الدخول</a>' +
                '<button class="premium-btn ghost" id="offers-toggle" type="button">📦 شوف العروض</button>' +
                back,
                true
            );
            return;
        }

        if (code === "not_subscribed") {
            showNotice(
                "🔒",
                "هاد الموضوع Premium",
                "باش تفتح هاد الموضوع وجميع المواضيع الأخرى، فعّل الاشتراك ديالك. ختار العرض اللي يناسبك.",
                '<button class="premium-btn gold" id="offers-toggle" type="button">📦 شوف العروض</button>' +
                '<a class="premium-btn whatsapp" href="' + waUrl({
                    section: "Schreiben " + LEVEL.toUpperCase(),
                    topic: meta.title || ""
                }) + '" target="_blank" rel="noopener noreferrer">💬 تواصل معنا</a>' +
                back,
                true
            );
            return;
        }

        /* السبب التقني (Worker…) للـ console برك */
        console.warn("Schreiben:", code, errorHint(code));
        /* الطالب خرج من الصفحة والطلب تقطع (Failed to fetch): ماشي مشكل */
        if (window.__deDiag && !leaving) window.__deDiag("fail", "Schreiben " + LEVEL + "-" + TOPIC_ID + ": " + code);
        showNotice(
            "📶",
            "ما قدرناش نجيبو الموضوع",
            "غالبا المشكل ف الأنترنت (ضعيفة ولا مقطوعة). تأكد من الاتصال وعاود المحاولة.",
            '<button class="premium-btn gold" type="button" onclick="location.reload()">عاود المحاولة</button>' + back,
            false
        );
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
})();