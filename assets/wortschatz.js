/* ===== Wortschatz =====

   1) Heute lernen: كل نهار لائحة ديال 10 كلمات (Tag 1 … Tag 105،
      1050 كلمة فـassets/wortschatz-1000.js):
        Lernen   → كتشوف الـ10 بالمعنى والنطق
        Abfragen → بطاقات: خاصك تعرفهم كاملين (Nochmal كترجع الكلمة)
        Fertig   → النهار كيتسجل، والكلمات كيدخلو للمراجعة
      لائحة جديدة كل نهار، و"Bonus" إلا بغيتي أكثر.
   2) Wiederholung: البطاقات اللي حان وقتها (Leitner: 1→2→4→7→14 يوم)
      من اللوائح اليومية ومن المجموعات (Konnektoren، Verben…).
   3) Meine Wörter + لائحة الكلمات كاملة مع البحث. */

(function () {
    "use strict";

    const P = window.DEProgress;
    const V = window.DE_VOCAB;
    const W = window.DE_WORDS_1000;
    const root = document.getElementById("ws-root");
    if (!P || !V || !W || !root) return;

    const NEW_PER_SESSION = 10;
    const ICON = {
        speak: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
        check: '<path d="m5 12 5 5 9-10"/>',
        again: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        play: '<path d="M7 4v16l13-8z"/>',
        arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
        repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'
    };
    function svg(name, cls) {
        return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
    }
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }
    function level(id) {
        const box = (P.card(id) || {}).b || 0;
        return '<span class="ws-level" title="Box ' + box + '">' + [1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i <= box ? "on" : "") + '"></i>'; }).join("") + "</span>";
    }

    let speakQueue = [];
    function speak(text, onEnd) {
        if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
        try {
            const u = new SpeechSynthesisUtterance(String(text).replace(/\+ ?(Akk|Dat)\./g, "").replace(/…/g, ""));
            u.lang = "de-DE";
            u.rate = 0.9;
            const voice = speechSynthesis.getVoices().find(function (v) { return /^de/i.test(v.lang); });
            if (voice) u.voice = voice;
            if (onEnd) u.onend = onEnd;
            speechSynthesis.speak(u);
        } catch (e) { if (onEnd) onEnd(); }
    }
    function stopSpeak() { speakQueue = []; try { speechSynthesis.cancel(); } catch (e) { /* */ } }

    /* =====================================================
       1) Heute lernen
       ===================================================== */
    const DAYS = W.days();
    let daily = { phase: "learn", bonus: false, queue: [], flipped: false, wrong: {} };

    function doneToday() {
        const d = P.wordDays(), t = P.today();
        return Object.keys(d).filter(function (n) { return d[n] === t; }).length;
    }
    function nextDay() {
        return DAYS.find(function (d) { return !P.wordDayDone(d.n); }) || null;
    }
    function doneCount() { return Object.keys(P.wordDays()).length; }

    function dailyHtml() {
        const day = nextDay();
        const total = DAYS.length;
        const done = doneCount();
        const head = '<div class="ws-day-head"><div><span class="ws-day-kicker">' + svg("sun", "ico") + "Heute lernen · كلمات اليوم</span>" +
            '<h2 class="ws-day-title">' + (day ? "Tag " + day.n + " <small>/ " + total + "</small>" : "Alle " + total + " Tage geschafft!") + "</h2>" +
            (day ? '<p class="ws-day-theme">' + esc(day.theme) + ' · <span dir="rtl">' + esc(day.ar) + "</span></p>" : "") + "</div>" +
            '<div class="ws-day-meter"><b>' + done * 10 + "</b><span>/ " + total * 10 + " Wörter</span>" +
            '<div class="tr-bar"><i style="width:' + Math.round(done / total * 100) + '%"></i></div></div></div>';

        if (!day) {
            return '<section class="tr-card tr-card-gold ws-day">' + head + '<p class="tr-muted">مبروك! كملتي كاع اللوائح 🎉 كمل المراجعة تحت باش ما تنساهمش.</p></section>';
        }

        /* خدم لائحة اليوم؟ كنقترحو Bonus بلا ما نفرضوه */
        if (daily.phase !== "quiz" && doneToday() && !daily.bonus) {
            return '<section class="tr-card tr-card-gold ws-day">' + head +
                '<div class="ws-day-done">' + svg("check", "ws-done-ico") + "<div><b>Super! Die Liste von heute ist fertig.</b>" +
                '<p class="tr-muted">غدا كتسناك لائحة جديدة (Tag ' + day.n + '). الكلمات ديال اليوم غادي يرجعو ليك فالمراجعة غدا.</p></div></div>' +
                '<div class="tr-row"><button class="tr-btn" type="button" data-daily="bonus">' + svg("plus") + "Bonus: 10 weitere Wörter</button></div></section>";
        }

        if (daily.phase === "quiz") {
            const card = daily.queue[0];
            const left = daily.queue.length;
            return '<section class="tr-card tr-card-gold ws-day">' + head +
                '<div class="ws-progress"><span>Abfrage · باقي ' + left + '</span><div class="tr-bar"><i style="width:' + Math.round((10 - left) / 10 * 100) + '%"></i></div></div>' +
                flashHtml("wd", card, "Tag " + day.n, daily.flipped) +
                '<div class="ws-actions"><button class="tr-btn tr-btn-red" type="button" data-daily="again"' + (daily.flipped ? "" : " disabled") + ">" + svg("again") + "Nochmal</button>" +
                '<button class="tr-btn tr-btn-gold" type="button" data-daily="ok"' + (daily.flipped ? "" : " disabled") + ">" + svg("check") + "Gewusst</button></div>" +
                '<p class="ws-keys">Space = umdrehen · ← Nochmal · → Gewusst</p></section>';
        }

        return '<section class="tr-card tr-card-gold ws-day">' + head +
            '<p class="tr-muted">1) قرا الكلمات وسمع النطق. 2) من بعد دوز للاختبار: خاصك تعرف الـ10 كاملين.</p>' +
            '<ol class="ws-daylist">' + day.words.map(function (w, i) {
                return '<li><button type="button" class="ws-say" data-say="' + i + '" aria-label="Aussprache">' + svg("speak") + "</button>" +
                    '<span class="ws-dl-de">' + esc(w.de) + '</span><span class="ws-dl-ar" dir="rtl">' + esc(w.ar) + "</span></li>";
            }).join("") + "</ol>" +
            '<div class="tr-row"><button class="tr-btn" type="button" data-daily="listen">' + svg("play") + "Alle anhören</button>" +
            '<button class="tr-btn tr-btn-gold" type="button" data-daily="quiz">Ich kann sie → Abfragen' + svg("arrow") + "</button></div></section>";
    }

    function flashHtml(prefix, card, label, flipped) {
        return '<div class="ws-flash' + (flipped ? " is-flipped" : "") + '" data-flash="' + prefix + '" tabindex="0" role="button" aria-label="Karte umdrehen"><div class="ws-flash-in">' +
            '<div class="ws-face ws-front"><button type="button" class="ws-speak" data-speak="' + prefix + '" aria-label="Aussprache">' + svg("speak") + "</button>" +
            '<span class="ws-deck">' + esc(label) + '</span><span class="ws-word">' + esc(card.de) + '</span><span class="ws-hint">Tippen zum Umdrehen · برك باش تقلب</span></div>' +
            '<div class="ws-face ws-back"><button type="button" class="ws-speak" data-speak="' + prefix + '" aria-label="Aussprache">' + svg("speak") + "</button>" +
            '<span class="ws-word" style="font-size:20px">' + esc(card.de) + '</span><span class="ws-ar" dir="rtl">' + esc(card.ar) + "</span>" +
            (card.ex ? '<span class="ws-ex">„' + esc(card.ex) + "“</span>" : "") + "</div></div></div>";
    }

    function dailyAct(act, arg) {
        const day = nextDay();
        if (!day) return;
        if (act === "say") { stopSpeak(); speak(day.words[arg].de); return; }
        if (act === "listen") {
            stopSpeak();
            speakQueue = day.words.map(function (w) { return w.de; });
            (function next() { const t = speakQueue.shift(); if (t) speak(t, function () { setTimeout(next, 450); }); })();
            return;
        }
        if (act === "bonus") { daily = { phase: "learn", bonus: true, queue: [], flipped: false, wrong: {} }; renderDaily(); return; }
        if (act === "quiz") {
            stopSpeak();
            daily.phase = "quiz";
            daily.queue = shuffle(day.words.slice());
            daily.flipped = false;
            renderDaily();
            return;
        }
        if (daily.phase !== "quiz" || !daily.queue[0]) return;
        if (act === "flip") { daily.flipped = !daily.flipped; toggleFlip("wd", daily.flipped); return; }
        if (!daily.flipped) return;
        const card = daily.queue.shift();
        if (act === "ok") {
            P.grade(card.id, true);
        } else {
            daily.wrong[card.id] = true;
            daily.queue.splice(Math.min(3, daily.queue.length), 0, card);
        }
        daily.flipped = false;
        if (!daily.queue.length) {
            P.markWordDay(day.n);
            daily = { phase: "learn", bonus: false, queue: [], flipped: false, wrong: {} };
            renderAll();
            return;
        }
        renderDaily();
    }

    function toggleFlip(prefix, on) {
        const f = root.querySelector('[data-flash="' + prefix + '"]');
        if (f) f.classList.toggle("is-flipped", on);
        const sel = prefix === "wd" ? '[data-daily="again"],[data-daily="ok"]' : '[data-act="again"],[data-act="ok"]';
        root.querySelectorAll(sel).forEach(function (b) { b.disabled = !on; });
    }

    /* =====================================================
       2) Wiederholung (المراجعة)
       ===================================================== */
    let deck = "";
    try { deck = localStorage.getItem("de-ws-deck") || ""; } catch (e) { /* */ }
    let session = null;

    function all() { return V.cards(); }
    function inDeck(c) { return !deck || c.deck === deck; }
    /* بطاقات جداد كتدخل غير من المجموعات (اللوائح اليومية عندها الطريق ديالها) */
    function canAddNew() { return deck && deck !== "tag"; }

    function stats() {
        const cards = all();
        const due = cards.filter(function (c) { return P.card(c.id) && P.isDue(c.id); }).length;
        document.getElementById("ws-due").textContent = String(due);
        document.getElementById("ws-known").textContent = String(cards.filter(function (c) { const s = P.card(c.id); return s && s.b >= 1; }).length);
        document.getElementById("ws-total").textContent = String(cards.length);
    }

    function startSession() {
        const cards = all().filter(inDeck);
        const due = shuffle(cards.filter(function (c) { return P.card(c.id) && P.isDue(c.id); }));
        const fresh = canAddNew() ? cards.filter(function (c) { return !P.card(c.id); }).slice(0, NEW_PER_SESSION) : [];
        session = { queue: due.concat(fresh), done: 0, total: due.length + fresh.length, flipped: false, right: 0 };
    }

    function deckName(key) {
        const d = V.decks().find(function (x) { return x.key === key; });
        return d ? d.name : "";
    }

    function chipsHtml() {
        const cards = all();
        const chips = [{ key: "", name: "Alle fälligen", n: cards.filter(function (c) { return P.card(c.id) && P.isDue(c.id); }).length }]
            .concat(V.decks().map(function (d) {
                return { key: d.key, name: d.name, n: cards.filter(function (c) { return c.deck === d.key; }).length };
            })).filter(function (c) { return c.n > 0 || c.key === "meine" || c.key === ""; });
        return '<div class="ws-chips" role="tablist">' + chips.map(function (c) {
            return '<button type="button" class="ws-chip' + (c.key === deck ? " is-on" : "") + '" data-deck="' + esc(c.key) + '">' + esc(c.name) + "<span>" + c.n + "</span></button>";
        }).join("") + "</div>";
    }

    function stageHtml() {
        if (!session) startSession();
        const card = session.queue[0];
        if (!card) {
            const next = all().filter(inDeck).filter(function (c) { return P.card(c.id); })
                .map(function (c) { return P.card(c.id).d; }).sort()[0];
            const msg = session.total
                ? "صححتي " + session.right + " من " + session.total + " من المرة الأولى."
                : (deck ? "ما كاين حتى بطاقة كتسناك دابا فهاد المجموعة." : "ما كاين حتى بطاقة كتسناك دابا. تعلم كلمات اليوم فوق، وغدا كيرجعو ليك هنا.");
            return '<div class="tr-card ws-done"><b>' + (session.total ? "Super! Wiederholung fertig 🎉" : "Nichts zu wiederholen ✓") + "</b>" +
                '<p class="tr-muted">' + msg + (next ? " البطاقات الجايين: " + new Date(next + "T00:00:00").toLocaleDateString("de-DE") : "") + "</p>" +
                (canAddNew() ? '<div class="tr-row" style="justify-content:center;margin-top:12px"><button class="tr-btn tr-btn-gold" type="button" data-act="more">' + svg("plus") + "10 neue Karten aus " + esc(deckName(deck)) + "</button></div>" : "") +
                "</div>";
        }
        const pctDone = session.total ? Math.round(session.done / session.total * 100) : 0;
        return '<div class="ws-progress"><span>' + session.done + " / " + session.total + '</span><div class="tr-bar"><i style="width:' + pctDone + '%"></i></div>' + level(card.id) + "</div>" +
            flashHtml("rv", card, card.deck === "tag" ? "Tag " + card.day : deckName(card.deck), session.flipped) +
            '<div class="ws-actions"><button class="tr-btn tr-btn-red" type="button" data-act="again"' + (session.flipped ? "" : " disabled") + ">" + svg("again") + "Nochmal</button>" +
            '<button class="tr-btn tr-btn-gold" type="button" data-act="ok"' + (session.flipped ? "" : " disabled") + ">" + svg("check") + "Gewusst</button></div>";
    }

    function reviewAnswer(ok) {
        if (!session || !session.queue[0] || !session.flipped) return;
        const card = session.queue.shift();
        if (!card.retried && ok) session.right++;
        P.grade(card.id, ok);
        if (ok) session.done++;
        else { card.retried = true; session.queue.splice(Math.min(3, session.queue.length), 0, card); }
        session.flipped = false;
        renderStage();
    }

    /* =====================================================
       3) Meine Wörter + alle Wörter
       ===================================================== */
    function mineHtml() {
        const mine = P.custom();
        const list = mine.length
            ? '<ul class="ws-table">' + mine.slice().reverse().map(function (w) {
                return "<li><span><b>" + esc(w.de) + "</b> " + level(w.id) + '</span><span class="ar" dir="rtl">' + esc(w.ar) +
                    '</span><button type="button" class="ws-del" data-del="' + esc(w.id) + '" aria-label="Löschen">' + svg("trash") + "</button></li>";
            }).join("") + "</ul>"
            : '<p class="tr-muted">مازال ما زدتي حتى كلمة. زيد الكلمات اللي كتلقاهم فالنصوص وما كتعرفهمش.</p>';
        return '<div class="tr-card"><h2>' + svg("plus", "ico") + "Meine Wörter · زيد كلمة</h2>" +
            '<form class="ws-form" id="ws-form" autocomplete="off"><input name="de" placeholder="Deutsch, z. B. die Rechnung" required maxlength="80">' +
            '<input name="ar" placeholder="المعنى بالعربية" dir="rtl" maxlength="120">' +
            '<input class="full" name="ex" placeholder="Beispielsatz (optional)" maxlength="200">' +
            '<button class="tr-btn tr-btn-gold full" type="submit">' + svg("plus") + "Hinzufügen</button></form>" +
            '<div class="tr-section">' + list + "</div></div>";
    }

    let term = "";
    function browseRows() {
        const t = term.trim().toLowerCase();
        const done = P.wordDays();
        let shown = 0;
        const html = DAYS.map(function (d) {
            const words = t ? d.words.filter(function (w) { return w.de.toLowerCase().indexOf(t) !== -1 || w.ar.indexOf(term.trim()) !== -1; }) : d.words;
            if (!words.length) return "";
            shown += words.length;
            return '<li class="ws-bday"><span>Tag ' + d.n + " · " + esc(d.theme) + "</span>" + (done[d.n] ? '<span class="ws-bdone">' + svg("check") + "</span>" : "") + "</li>" +
                words.map(function (w) {
                    return "<li><span><b>" + esc(w.de) + "</b> " + level(w.id) + '</span><span class="ar" dir="rtl">' + esc(w.ar) + "</span><span></span></li>";
                }).join("");
        }).join("");
        return { html: html, shown: shown };
    }
    function browseHtml() {
        const r = browseRows();
        return '<details class="tr-card tr-section" id="ws-browse"' + (term ? " open" : "") + '><summary style="cursor:pointer;font-weight:800;display:flex;align-items:center;gap:8px">' +
            svg("list", "ico") + "Alle " + (DAYS.length * 10) + " Wörter · اللائحة كاملة</summary>" +
            '<label class="lesen-search tr-section">' + svg("search") + '<input id="ws-search" type="search" placeholder="Suchen · قلّب على كلمة" value="' + esc(term) + '"></label>' +
            '<p class="tr-muted" id="ws-browse-count">' + r.shown + " Wörter</p>" +
            '<ul class="ws-table" id="ws-browse-list">' + r.html + "</ul></details>";
    }

    /* =====================================================
       الرسم والأحداث
       ===================================================== */
    function renderDaily() {
        const box = document.getElementById("ws-daily");
        if (box) box.innerHTML = dailyHtml();
        stats();
    }
    function renderStage() {
        const stage = document.getElementById("ws-stage");
        if (stage) stage.innerHTML = stageHtml();
        stats();
    }
    function renderAll() {
        stats();
        root.innerHTML = '<div id="ws-daily">' + dailyHtml() + "</div>" +
            '<h2 class="ws-section-title">' + svg("repeat", "ico") + "Wiederholung · المراجعة</h2>" + chipsHtml() +
            '<div class="tr-grid ws-grid" id="ws-grid"><div class="ws-stage" id="ws-stage">' + stageHtml() + "</div>" + mineHtml() + "</div>" +
            browseHtml();
    }

    root.addEventListener("click", function (e) {
        const d = e.target.closest("[data-daily]");
        if (d) { dailyAct(d.dataset.daily); return; }
        const say = e.target.closest("[data-say]");
        if (say) { dailyAct("say", Number(say.dataset.say)); return; }
        const sp = e.target.closest("[data-speak]");
        if (sp) {
            e.stopPropagation();
            const card = sp.dataset.speak === "wd" ? daily.queue[0] : session && session.queue[0];
            if (card) { stopSpeak(); speak(card.de); }
            return;
        }
        const flash = e.target.closest("[data-flash]");
        if (flash) {
            if (flash.dataset.flash === "wd") dailyAct("flip");
            else if (session && session.queue[0]) { session.flipped = !session.flipped; toggleFlip("rv", session.flipped); }
            return;
        }
        const chip = e.target.closest(".ws-chip");
        if (chip) {
            deck = chip.dataset.deck;
            try { localStorage.setItem("de-ws-deck", deck); } catch (err) { /* */ }
            session = null;
            root.querySelectorAll(".ws-chip").forEach(function (c) { c.classList.toggle("is-on", c === chip); });
            renderStage();
            return;
        }
        const act = e.target.closest("[data-act]");
        if (act) {
            if (act.dataset.act === "again") reviewAnswer(false);
            if (act.dataset.act === "ok") reviewAnswer(true);
            if (act.dataset.act === "more") {
                const fresh = all().filter(inDeck).filter(function (c) { return !P.card(c.id); }).slice(0, NEW_PER_SESSION);
                session = { queue: fresh, done: 0, total: fresh.length, flipped: false, right: 0 };
                renderStage();
            }
            return;
        }
        const del = e.target.closest("[data-del]");
        if (del && confirm("Wort löschen? · نمسحو هاد الكلمة؟")) {
            P.removeCustom(del.dataset.del);
            session = null;
            renderAll();
        }
    });

    root.addEventListener("input", function (e) {
        if (e.target.id !== "ws-search") return;
        term = e.target.value;
        const r = browseRows();
        document.getElementById("ws-browse-list").innerHTML = r.html;
        document.getElementById("ws-browse-count").textContent = r.shown + " Wörter";
    });

    root.addEventListener("submit", function (e) {
        if (e.target.id !== "ws-form") return;
        e.preventDefault();
        const f = e.target;
        if (P.addCustom(f.de.value, f.ar.value, f.ex.value)) {
            deck = "meine";
            try { localStorage.setItem("de-ws-deck", deck); } catch (err) { /* */ }
            session = null;
            renderAll();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.target.closest && e.target.closest("input, textarea, select")) return;
        const quiz = daily.phase === "quiz";
        if (e.key === " " || e.key === "Enter") {
            if (quiz) { e.preventDefault(); dailyAct("flip"); }
            else if (session && session.queue[0]) { e.preventDefault(); session.flipped = !session.flipped; toggleFlip("rv", session.flipped); }
        } else if (e.key === "ArrowLeft") { if (quiz) dailyAct("again"); else reviewAnswer(false); }
        else if (e.key === "ArrowRight") { if (quiz) dailyAct("ok"); else reviewAnswer(true); }
    });

    renderAll();
    P.sync().then(function () {
        if (daily.phase === "quiz") { stats(); return; }
        if (!session || (session.done === 0 && !session.flipped)) { session = null; renderAll(); }
        else { stats(); renderDaily(); }
    });
})();
