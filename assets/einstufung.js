/* ===== Einstufungstest — اختبار المستوى المجاني =====

   30 سؤال (A2 → B2) ف 10 دقايق تقريباً. النتيجة: المستوى،
   المهارة الضعيفة، وخطة ديال 30 يوم مع روابط للأقسام.
   كلشي ف المتصفح: بلا حساب وبلا سيرفر، باش أي زائر جا من
   Google يقدر يدوزو فالحين. */

(function () {
    "use strict";

    var root = document.getElementById("es-root");
    if (!root) return;

    var SKILLS = {
        G: { de: "Grammatik", ar: "القواعد" },
        W: { de: "Wortschatz", ar: "الكلمات" },
        S: { de: "Sprachbausteine", ar: "الروابط والتراكيب" },
        L: { de: "Lesen", ar: "القراءة" }
    };

    var T_A2 = "Liebe Anna,\nam Samstag mache ich eine kleine Party. Sie beginnt um 19 Uhr. " +
        "Kannst du bitte einen Salat mitbringen? Getränke habe ich schon gekauft.\nViele Grüße\nTom";
    var T_B1 = "Wegen Bauarbeiten bleibt die Stadtbibliothek vom 3. bis 14. März geschlossen. " +
        "Ausgeliehene Bücher können in dieser Zeit im Rathaus zurückgegeben werden. " +
        "Die Leihfrist aller Bücher wird automatisch um zwei Wochen verlängert.";
    var T_B2 = "Immer mehr Unternehmen bieten ihren Beschäftigten die Möglichkeit, teilweise von zu Hause aus zu arbeiten. " +
        "Befürworter verweisen vor allem auf die gewonnene Zeit, da der tägliche Arbeitsweg entfällt. " +
        "Kritiker hingegen befürchten, dass die Grenze zwischen Beruf und Privatleben zunehmend verschwimmt " +
        "und der Austausch im Team darunter leidet.";

    /* الجواب الصحيح ديما هو الأول هنا — كنخلطو الاختيارات ف العرض. */
    var Q = [
        /* ---- A2 ---- */
        { lv: "A2", sk: "G", q: "Gestern ___ ich mit meiner Schwester ins Kino gegangen.", o: ["bin", "habe", "war", "hat"] },
        { lv: "A2", sk: "G", q: "Ich wohne seit drei Jahren ___ Berlin.", o: ["in", "nach", "zu", "an"] },
        { lv: "A2", sk: "G", q: "Kannst du ___ bitte helfen?", o: ["mir", "mich", "ich", "mein"] },
        { lv: "A2", sk: "G", q: "Mein Bruder ist drei Jahre ___ als ich.", o: ["älter", "alt", "am ältesten", "älteste"] },
        { lv: "A2", sk: "W", q: "Ich habe großen Hunger. Ich möchte jetzt etwas ___.", o: ["essen", "trinken", "schlafen", "lesen"] },
        { lv: "A2", sk: "W", q: "Unser Zug fährt um 8 Uhr ab. Wir müssen pünktlich am ___ sein.", o: ["Bahnhof", "Flughafen", "Krankenhaus", "Supermarkt"] },
        { lv: "A2", sk: "S", q: "Ich gehe heute nicht zur Arbeit, ___ ich krank bin.", o: ["weil", "denn", "aber", "oder"] },
        { lv: "A2", sk: "L", text: T_A2, q: "Was soll Anna mitbringen?", o: ["Einen Salat", "Getränke", "Einen Kuchen", "Nichts"] },

        /* ---- B1 ---- */
        { lv: "B1", sk: "G", q: "Das ist die Frau, ___ ich gestern geholfen habe.", o: ["der", "die", "den", "dem"] },
        { lv: "B1", sk: "G", q: "Wenn ich mehr Zeit ___, würde ich öfter Sport machen.", o: ["hätte", "habe", "hatte", "gehabt"] },
        { lv: "B1", sk: "G", q: "Ich interessiere mich sehr ___ moderne Kunst.", o: ["für", "an", "auf", "über"] },
        { lv: "B1", sk: "G", q: "Der Brief ___ gestern abgeschickt.", o: ["wurde", "wird", "hat", "ist"] },
        { lv: "B1", sk: "W", q: "Ich suche eine neue ___. Die alte ist zu klein und zu teuer.", o: ["Wohnung", "Rechnung", "Meinung", "Erfahrung"] },
        { lv: "B1", sk: "W", q: "Können Sie mir bitte eine ___ geben? Ich muss die Kosten bei meiner Firma einreichen.", o: ["Quittung", "Kündigung", "Bewerbung", "Anmeldung"] },
        { lv: "B1", sk: "S", q: "Ich weiß nicht, ___ der Kurs morgen stattfindet.", o: ["ob", "dass", "wenn", "weil"] },
        { lv: "B1", sk: "S", q: "___ es regnet, gehen wir spazieren.", o: ["Obwohl", "Trotzdem", "Deshalb", "Denn"] },
        { lv: "B1", sk: "S", q: "Ich spare Geld, ___ mir ein Auto zu kaufen.", o: ["um", "damit", "weil", "dass"] },
        { lv: "B1", sk: "L", text: T_B1, q: "Wo kann man die Bücher im März zurückgeben?", o: ["Im Rathaus", "In der Bibliothek", "Bei der Post", "Gar nicht"] },
        { lv: "B1", sk: "L", text: T_B1, q: "Was passiert mit der Leihfrist?", o: ["Sie wird automatisch verlängert.", "Man muss eine Gebühr zahlen.", "Sie endet am 3. März.", "Man muss sie online verlängern."] },

        /* ---- B2 ---- */
        { lv: "B2", sk: "G", q: "Die Wohnung, ___ Miete sehr hoch ist, liegt im Zentrum.", o: ["deren", "dessen", "die", "der"] },
        { lv: "B2", sk: "G", q: "Er tut so, als ___ er alles verstanden.", o: ["hätte", "habe", "hat", "hatte"] },
        { lv: "B2", sk: "G", q: "___ des schlechten Wetters fand das Konzert statt.", o: ["Trotz", "Wegen", "Während", "Statt"] },
        { lv: "B2", sk: "G", q: "Der Antrag muss bis Freitag ___ werden.", o: ["eingereicht", "einreichen", "eingereichte", "einzureichen"] },
        { lv: "B2", sk: "W", q: "Nach langer Diskussion haben wir endlich eine Entscheidung ___.", o: ["getroffen", "gemacht", "genommen", "gestellt"] },
        { lv: "B2", sk: "W", q: "Ich möchte meinen Handyvertrag fristgerecht ___.", o: ["kündigen", "entlassen", "verlassen", "absagen"] },
        { lv: "B2", sk: "W", q: "Er hat sich bei der Firma um eine Stelle ___.", o: ["beworben", "beworfen", "geworben", "erworben"] },
        { lv: "B2", sk: "S", q: "Je mehr du übst, ___ besser wirst du.", o: ["desto", "als", "wie", "so"] },
        { lv: "B2", sk: "S", q: "Sie hat die Prüfung bestanden, ___ sie kaum gelernt hatte.", o: ["obwohl", "trotzdem", "dennoch", "weshalb"] },
        { lv: "B2", sk: "L", text: T_B2, q: "Was ist laut Text ein Vorteil des Homeoffice?", o: ["Der Arbeitsweg fällt weg.", "Man verdient mehr Geld.", "Man arbeitet weniger Stunden.", "Das Team kommuniziert besser."] },
        { lv: "B2", sk: "L", text: T_B2, q: "Welche Sorge haben die Kritiker?", o: ["Beruf und Privatleben vermischen sich.", "Die Mieten steigen.", "Die Firmen sparen zu viel.", "Die Technik ist zu teuer."] }
    ];

    var STORE = "de-einstufung";
    var state = null;   // { order: [[qi, [optIdx…]]…], i, answers: [], start }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function shuffle(a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function load() { try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return null; } }
    function save(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) { /* خاص */ } }

    /* ================= البداية ================= */
    function intro() {
        root.textContent = "";
        var card = el("section", "tr-card es-intro");
        card.dir = "rtl";
        card.appendChild(el("h2", "", "عرف المستوى ديالك ف الألمانية — بالمجان"));
        card.appendChild(el("p", "tr-muted",
            "30 سؤال من A2 حتى B2: القواعد، الكلمات، الروابط والقراءة. كياخد تقريباً 10 دقايق. " +
            "ف اللخر كتعرف المستوى ديالك، فين ضعيف، وشنو خاصك تخدم ف 30 يوم الجاية."));
        var ul = el("ul", "es-points");
        ["بلا تسجيل وبلا خلاص", "جاوب بلي عارف — إلا ماعرفتيش، ختار «ماعرفتش»", "النتيجة تقدر تشاركها ف WhatsApp"].forEach(function (t) {
            ul.appendChild(el("li", "", t));
        });
        card.appendChild(ul);
        var row = el("div", "tr-row");
        var go = el("button", "tr-btn tr-btn-gold es-go", "بدا الاختبار");
        go.type = "button";
        go.addEventListener("click", start);
        row.appendChild(go);
        var last = load();
        if (last && last.level) {
            var again = el("button", "tr-btn", "شوف النتيجة اللخرة (" + last.level + ")");
            again.type = "button";
            again.addEventListener("click", function () { result(last); });
            row.appendChild(again);
        }
        card.appendChild(row);
        root.appendChild(card);
    }

    function start() {
        state = {
            order: Q.map(function (q, i) { return [i, shuffle([0, 1, 2, 3])]; }),
            i: 0,
            answers: [],
            start: Date.now()
        };
        ask();
        window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
    }

    /* ================= السؤال ================= */
    function ask() {
        var pair = state.order[state.i], q = Q[pair[0]];
        root.textContent = "";

        var card = el("section", "tr-card es-q");
        var top = el("div", "es-top");
        top.dir = "rtl";
        top.appendChild(el("span", "tr-tag", SKILLS[q.sk].de + " · " + SKILLS[q.sk].ar));
        top.appendChild(el("span", "es-count", (state.i + 1) + " / " + Q.length));
        card.appendChild(top);

        var bar = el("div", "tr-bar es-bar");
        var fill = el("i");
        fill.style.width = (state.i / Q.length * 100) + "%";
        bar.appendChild(fill);
        card.appendChild(bar);

        if (q.text) {
            var tx = el("div", "es-text");
            tx.lang = "de"; tx.dir = "ltr";
            q.text.split("\n").forEach(function (line) { tx.appendChild(el("p", "", line)); });
            card.appendChild(tx);
        }

        var qq = el("p", "es-question", q.q);
        qq.lang = "de"; qq.dir = "ltr";
        card.appendChild(qq);

        var opts = el("div", "es-opts");
        opts.dir = "ltr";
        pair[1].forEach(function (oi) {
            var b = el("button", "es-opt", q.o[oi]);
            b.type = "button"; b.lang = "de";
            b.addEventListener("click", function () { answer(oi); });
            opts.appendChild(b);
        });
        card.appendChild(opts);

        var foot = el("div", "tr-row es-foot");
        foot.dir = "rtl";
        var skip = el("button", "tr-btn", "ماعرفتش");
        skip.type = "button";
        skip.addEventListener("click", function () { answer(-1); });
        foot.appendChild(skip);
        if (state.i > 0) {
            var back = el("button", "tr-btn", "السابق");
            back.type = "button";
            back.addEventListener("click", function () { state.i--; state.answers.pop(); ask(); });
            foot.appendChild(back);
        }
        card.appendChild(foot);
        root.appendChild(card);
    }

    function answer(oi) {
        state.answers[state.i] = oi;
        state.i++;
        if (state.i < Q.length) { ask(); return; }
        var r = score();
        save(r);
        result(r);
    }

    /* ================= الحساب ================= */
    function score() {
        var lv = { A2: [0, 0], B1: [0, 0], B2: [0, 0] };
        var sk = { G: [0, 0], W: [0, 0], S: [0, 0], L: [0, 0] };
        var wrong = [];
        state.order.forEach(function (pair, n) {
            var q = Q[pair[0]], ok = state.answers[n] === 0;
            lv[q.lv][1]++; sk[q.sk][1]++;
            if (ok) { lv[q.lv][0]++; sk[q.sk][0]++; }
            else wrong.push({ q: pair[0], a: state.answers[n] });
        });
        function p(x) { return x[1] ? x[0] / x[1] : 0; }
        var level;
        if (p(lv.B2) >= 0.65 && p(lv.B1) >= 0.7) level = "B2";
        else if (p(lv.B1) >= 0.6 && p(lv.A2) >= 0.65) level = "B1";
        else if (p(lv.A2) >= 0.6) level = "A2";
        else level = "A1";
        var right = Object.keys(lv).reduce(function (s, k) { return s + lv[k][0]; }, 0);
        return {
            level: level,
            near: level === "B1" && p(lv.B2) >= 0.45,
            right: right,
            total: Q.length,
            skills: Object.keys(sk).map(function (k) { return [k, sk[k][0], sk[k][1]]; }),
            wrong: wrong,
            minutes: Math.max(1, Math.round((Date.now() - state.start) / 60000)),
            date: new Date().toISOString()
        };
    }

    /* ================= النتيجة ================= */
    var LEVEL = {
        A1: { title: "A1 — البداية", text: "مازال خاصك الأساس: الأفعال، الأرتيكل وجمل بسيطة. بدا بالكلمات كل نهار، ومن بعد انتقل لـ telc B1.", target: "b1" },
        A2: { title: "A2 — الأساس كاين", text: "عندك الأساس، ولكن telc B1 باقي محتاج شغل ف القواعد والروابط. ب 2-3 شهور ديال التمرين المنظم توصل.", target: "b1" },
        B1: { title: "B1 — مستعد لـ telc B1", text: "المستوى ديالك مناسب لـ telc B1. دابا خاصك تتعود على شكل الامتحان والوقت ديالو.", target: "b1" },
        B2: { title: "B2 — مستعد لـ telc B2", text: "مستوى زوين! telc B2 ف المتناول. ركز على Sprachbausteine و Schreiben (Beschwerde) وعلى الوقت.", target: "b2" }
    };

    function planFor(r) {
        var t = LEVEL[r.level].target;
        var weak = r.skills.slice().sort(function (a, b) { return a[1] / a[2] - b[1] / b[2]; })[0][0];
        var weakLink = {
            G: [t + "-lesen-sprach1.html", "Sprachbausteine Teil 1 — القواعد ف السياق"],
            W: ["wortschatz.html", "Wortschatz — 10 كلمات كل نهار"],
            S: [t + "-lesen-sprach2.html", "Sprachbausteine Teil 2 — الروابط"],
            L: [t + "-lesen.html", "Leseverstehen — نصوص الامتحان"]
        }[weak];
        var plan = [
            ["الأسبوع 1", "قوّي النقطة الضعيفة: " + SKILLS[weak].de + " (" + SKILLS[weak].ar + ")", weakLink[0], weakLink[1]],
            ["كل نهار", "10 كلمات جداد + مراجعة البطاقات", "wortschatz.html", "Wortschatz"],
            ["الأسبوع 2-3", "Lesen و Hören ديال telc " + t.toUpperCase() + " — تيما كل نهار", t + "-hoeren.html", "Hörverstehen " + t.toUpperCase()],
            ["الأسبوع 3-4", "Schreiben و Sprechen: كتب واحد الموضوع وخد التصحيح", t + "-schreiben.html", "Schreiben " + t.toUpperCase()]
        ];
        if (t === "b2") plan.push(["اللخر", "دوز Modelltest كامل بالوقت", "modelltest.html", "Modelltest B2"]);
        return { weak: weak, plan: plan };
    }

    function result(r) {
        root.textContent = "";
        var info = LEVEL[r.level];
        var pp = planFor(r);

        var grid = el("div", "tr-grid es-result");
        grid.dir = "rtl";

        /* ---- المستوى ---- */
        var head = el("section", "tr-card tr-card-gold es-level");
        head.appendChild(el("span", "tr-tag", "النتيجة ديالك"));
        var big = el("div", "es-big", r.level);
        big.dir = "ltr";
        head.appendChild(big);
        head.appendChild(el("h2", "", info.title + (r.near ? " (قريب من B2)" : "")));
        head.appendChild(el("p", "tr-muted", info.text));
        head.appendChild(el("p", "es-sub", "جاوبتي صحيح على " + r.right + " من " + r.total + (r.minutes ? " ف " + r.minutes + " دقيقة" : "")));
        var row = el("div", "tr-row");
        var share = el("button", "tr-btn tr-btn-gold", "شارك النتيجة ف WhatsApp");
        share.type = "button";
        share.addEventListener("click", function () { shareCard(r); });
        row.appendChild(share);
        var again = el("button", "tr-btn", "عاود الاختبار");
        again.type = "button";
        again.addEventListener("click", start);
        row.appendChild(again);
        head.appendChild(row);
        grid.appendChild(head);

        /* ---- المهارات ---- */
        var sk = el("section", "tr-card");
        sk.appendChild(el("h2", "", "المهارات ديالك"));
        r.skills.forEach(function (s) {
            var pct = Math.round(s[1] / s[2] * 100);
            var line = el("div", "tr-skill");
            var nm = el("div", "tr-skill-name", SKILLS[s[0]].de);
            nm.appendChild(el("small", "", SKILLS[s[0]].ar + (s[0] === pp.weak ? " · خاصك تخدمها" : "")));
            line.appendChild(nm);
            var bar = el("div", "tr-bar");
            var i = el("i", pct < 50 ? "is-low" : pct < 75 ? "is-mid" : "is-good");
            i.style.width = pct + "%";
            bar.appendChild(i);
            line.appendChild(bar);
            line.appendChild(el("div", "tr-skill-pct", pct + "%"));
            sk.appendChild(line);
        });
        grid.appendChild(sk);

        /* ---- الخطة ---- */
        var plan = el("section", "tr-card es-plan");
        plan.appendChild(el("h2", "", "الخطة ديالك ل 30 يوم"));
        var ul = el("ul", "tr-plan");
        pp.plan.forEach(function (p) {
            var li = el("li");
            var a = el("a", "es-plan-link");
            a.href = p[2];
            var tag = el("span", "tr-tag", p[0]);
            a.appendChild(tag);
            var txt = el("span", "tr-plan-t", p[1]);
            txt.appendChild(el("span", "tr-plan-s", p[3]));
            a.appendChild(txt);
            li.appendChild(a);
            ul.appendChild(li);
        });
        plan.appendChild(ul);
        grid.appendChild(plan);

        /* ---- Premium ---- */
        var pr = el("section", "tr-card tr-card-gold es-premium");
        pr.appendChild(el("h2", "", "بغيتي توصل أسرع؟"));
        pr.appendChild(el("p", "tr-muted",
            "Premium كيحل ليك كاع المواضيع ديال telc " + info.target.toUpperCase() +
            ": Lesen، Hören، Sprechen و Schreiben مع التصحيح بالذكاء الاصطناعي، وModelltests كاملين."));
        var go = el("a", "tr-btn tr-btn-gold", "شوف العروض");
        go.href = "payment.html";
        pr.appendChild(go);
        grid.appendChild(pr);

        /* ---- الأخطاء ---- */
        if (r.wrong && r.wrong.length) {
            var rev = el("details", "tr-card es-review");
            rev.appendChild(el("summary", "", "شوف الأجوبة الصحيحة (" + r.wrong.length + ")"));
            r.wrong.forEach(function (w) {
                var q = Q[w.q];
                var item = el("div", "es-rev-item");
                item.dir = "ltr"; item.lang = "de";
                item.appendChild(el("p", "es-rev-q", q.q.replace("___", "…")));
                var p = el("p", "es-rev-a");
                if (w.a > 0) { p.appendChild(el("s", "", q.o[w.a])); p.appendChild(document.createTextNode("  →  ")); }
                p.appendChild(el("b", "", q.o[0]));
                item.appendChild(p);
                rev.appendChild(item);
            });
            grid.appendChild(rev);
        }

        root.appendChild(grid);
        window.scrollTo({ top: root.offsetTop - 90, behavior: "smooth" });
    }

    function shareCard(r) {
        if (!window.DEShare) return;
        window.DEShare.open({
            kind: "einstufungstest",
            title: "Einstufungstest",
            badge: "Niveau " + r.level,
            pass: r.level === "B1" || r.level === "B2",
            score: r.right,
            max: r.total,
            rows: r.skills.map(function (s) { return [SKILLS[s[0]].de, s[1], s[2]]; }),
            shareText: "عرفت المستوى ديالي ف الألمانية: " + r.level + " 🇩🇪 — دوز الاختبار بالمجان ف 10 دقايق:",
            url: "https://deutsch-einfach.online/einstufungstest.html"
        });
    }

    intro();
}());
