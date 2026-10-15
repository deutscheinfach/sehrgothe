/* ===== التقدم ديال المستخدم (Mein Fortschritt) =====

   كيتسجل هنا:
   - نتائج التمارين: Lesen، Sprachbausteine، Hören، Schreiben، Sprechen
     وModelltest (كتجي من الأحداث lesen-points، hoeren-points…)
   - الأيام اللي خدم فيهم (باش نحسبو الـStreak 🔥)
   - تاريخ الامتحان (العد التنازلي)
   - بطاقات Wortschatz (Leitner) والكلمات اللي زادهم المستخدم

   كيتخزن فـlocalStorage ديما، وإلا كان المستخدم داخل كيتزامن مع
   Firestore فـusers/{uid}/progress/main باش يلقاه فأي جهاز.

   ?embed=1 فالرابط = الصفحة داخل Modelltest: كنخبيو البار
   والتنقل (html.is-embed فـtheme.css). */

(function () {
    "use strict";

    try {
        if (new URLSearchParams(location.search).get("embed") === "1") {
            document.documentElement.classList.add("is-embed");
            /* ?nav=0: «اختبر نفسك» (selbsttest.html) هو اللي كيسوق التنقل */
            if (new URLSearchParams(location.search).get("nav") === "0") {
                document.documentElement.classList.add("is-embed-nonav");
            }
        }
    } catch (e) { /* */ }

    if (window.DEProgress) return;

    const KEY = "de-progress-v1";
    const MAX_RESULTS = 500;
    const SAME_ATTEMPT_MS = 30 * 60 * 1000;
    const listeners = [];

    function today(d) {
        const x = d ? new Date(d) : new Date();
        return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
    }
    function empty() {
        return { v: 1, results: [], days: {}, examDate: "", examDateAt: 0, vocab: {}, custom: [], wl: {}, updatedAt: 0 };
    }
    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) || "null");
            if (raw && raw.v === 1) return Object.assign(empty(), raw);
        } catch (e) { /* */ }
        return empty();
    }
    let state = load();

    function save(skipSync) {
        /* صفحة أخرى (iframe ديال Modelltest، ولا tab آخر) يقدر
           يكون كتب من بعدنا — كنجمعو قبل ما نكتبو باش ما يضيع والو */
        state = merge(load(), state);
        state.updatedAt = Date.now();
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* */ }
        listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
        if (!skipSync) scheduleSync();
    }
    function touchDay() {
        const d = today();
        state.days[d] = (state.days[d] || 0) + 1;
    }
    function half(n) { return Math.round(n * 2) / 2; }

    /* ---------- النتائج ---------- */
    function add(r) {
        if (!r || !r.skill || !(r.max > 0)) return null;
        const now = Date.now();
        const key = r.skill + "|" + (r.part || "") + "|" + (r.topic || "");
        /* نفس التمرين فأقل من 30 دقيقة = نفس المحاولة (مثلا Sprechen
           كيصيفط النقط كل مرة كيتبدل الـSelbstcheck) */
        let hit = null;
        for (let i = state.results.length - 1; i >= 0; i--) {
            const x = state.results[i];
            if (x.key === key && now - x.at < SAME_ATTEMPT_MS) { hit = x; break; }
        }
        const entry = hit || { id: now.toString(36) + Math.random().toString(36).slice(2, 7), key: key };
        entry.skill = String(r.skill);
        entry.part = String(r.part || "");
        entry.topic = String(r.topic || "").slice(0, 80);
        entry.title = String(r.title || "").slice(0, 120);
        entry.points = half(Math.max(0, Math.min(Number(r.points) || 0, Number(r.max))));
        entry.max = Number(r.max);
        entry.at = now;
        if (r.detail) entry.detail = r.detail;
        if (!hit) {
            state.results.push(entry);
            if (state.results.length > MAX_RESULTS) state.results = state.results.slice(-MAX_RESULTS);
            touchDay();
        }
        save();
        return entry;
    }

    /* ---------- الـStreak ---------- */
    function streak() {
        let n = 0;
        const d = new Date();
        /* إلا مازال ما خدمش اليوم، الـStreak ديال البارح باقي حي */
        if (!state.days[today(d)]) d.setDate(d.getDate() - 1);
        while (state.days[today(d)]) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }

    /* ---------- تاريخ الامتحان ---------- */
    function setExamDate(value) {
        state.examDate = /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : "";
        state.examDateAt = Date.now();
        save();
    }
    function daysToExam() {
        if (!state.examDate) return null;
        const a = new Date(today() + "T00:00:00"), b = new Date(state.examDate + "T00:00:00");
        return Math.round((b - a) / 86400000);
    }

    /* ---------- Wortschatz (Leitner) ----------
       الصندوق 1 → كل نهار، 2 → 2 أيام، 3 → 4، 4 → 7، 5 → 14 */
    const INTERVALS = [0, 1, 2, 4, 7, 14];
    function card(id) { return state.vocab[id] || null; }
    function isDue(id) {
        const c = card(id);
        return !c || c.d <= today();
    }
    function grade(id, ok) {
        const c = card(id) || { b: 0 };
        const box = ok ? Math.min(5, (c.b || 0) + 1) : 1;
        const due = new Date();
        due.setDate(due.getDate() + (ok ? INTERVALS[box] : 0));
        state.vocab[id] = { b: box, d: today(due), u: Date.now() };
        touchDayOncePerSession();
        save();
    }
    let touchedVocab = false;
    function touchDayOncePerSession() {
        if (touchedVocab) return;
        touchedVocab = true;
        touchDay();
    }
    function addCustom(de, ar, ex) {
        de = String(de || "").trim().slice(0, 80);
        ar = String(ar || "").trim().slice(0, 120);
        if (!de) return null;
        const exists = state.custom.find(function (w) { return !w.del && w.de.toLowerCase() === de.toLowerCase(); });
        if (exists) return exists;
        const w = { id: "u-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), de: de, ar: ar, ex: String(ex || "").slice(0, 200), at: Date.now() };
        state.custom.push(w);
        save();
        return w;
    }
    function removeCustom(id) {
        const w = state.custom.find(function (x) { return x.id === id; });
        if (!w) return;
        w.del = true;
        w.at = Date.now();
        delete state.vocab[id];
        save();
    }

    /* ---------- اللائحة اليومية (10 كلمات فالنهار) ----------
       wl = { "7": "2026-09-25" } → Tag 7 تكمل فهاد التاريخ */
    function wordDayDone(n) { return !!(state.wl || {})[n]; }
    function markWordDay(n) {
        state.wl = state.wl || {};
        if (!state.wl[n]) state.wl[n] = today();
        touchDay();
        save();
    }
    function wordDays() { return Object.assign({}, state.wl || {}); }

    /* ---------- المزامنة مع Firestore ---------- */
    function merge(a, b) {
        const out = empty();
        const byId = {};
        a.results.concat(b.results).forEach(function (r) {
            if (!r || !r.id) return;
            if (!byId[r.id] || byId[r.id].at < r.at) byId[r.id] = r;
        });
        out.results = Object.keys(byId).map(function (k) { return byId[k]; })
            .sort(function (x, y) { return x.at - y.at; }).slice(-MAX_RESULTS);
        [a.days, b.days].forEach(function (days) {
            Object.keys(days || {}).forEach(function (d) { out.days[d] = Math.max(out.days[d] || 0, days[d]); });
        });
        const ex = (a.examDateAt || 0) >= (b.examDateAt || 0) ? a : b;
        out.examDate = ex.examDate || "";
        out.examDateAt = ex.examDateAt || 0;
        [a.vocab, b.vocab].forEach(function (v) {
            Object.keys(v || {}).forEach(function (id) {
                if (!out.vocab[id] || (out.vocab[id].u || 0) < (v[id].u || 0)) out.vocab[id] = v[id];
            });
        });
        const cw = {};
        (a.custom || []).concat(b.custom || []).forEach(function (w) {
            if (!cw[w.id] || cw[w.id].at < w.at) cw[w.id] = w;
        });
        out.custom = Object.keys(cw).map(function (k) { return cw[k]; });
        out.custom.forEach(function (w) { if (w.del) delete out.vocab[w.id]; });
        out.wl = {};
        [a.wl, b.wl].forEach(function (wl) {
            Object.keys(wl || {}).forEach(function (n) {
                if (!out.wl[n] || wl[n] < out.wl[n]) out.wl[n] = wl[n];
            });
        });
        out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
        return out;
    }

    let fb = null;
    let syncTimer = 0;
    let syncing = null;
    let user = null;
    const FB = "https://www.gstatic.com/firebasejs/12.18.0/";

    function firebase() {
        if (fb) return fb;
        fb = Promise.all([
            import(FB + "firebase-app.js"),
            import(FB + "firebase-auth.js"),
            import(FB + "firebase-firestore.js")
        ]).then(function (mods) {
            const appMod = mods[0], authMod = mods[1], fsMod = mods[2];
            const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp({
                apiKey: "AIzaSyDHMmaHLYRRHfdRDj-hf7s5LOqeWPTiOxU",
                authDomain: "deutsch-einfach-4c81f.firebaseapp.com",
                projectId: "deutsch-einfach-4c81f",
                storageBucket: "deutsch-einfach-4c81f.firebasestorage.app",
                messagingSenderId: "152448766933",
                appId: "1:152448766933:web:f7824c4db8ab3caccbe35c",
                measurementId: "G-9QV234Z0KZ"
            });
            const auth = authMod.getAuth(app);
            return new Promise(function (resolve) {
                const stop = authMod.onAuthStateChanged(auth, function (u) {
                    user = u;
                    resolve({ auth: auth, db: fsMod.getFirestore(app), fs: fsMod });
                    if (typeof stop === "function") stop();
                });
            });
        });
        fb.catch(function () { fb = null; });
        return fb;
    }

    function sync() {
        if (syncing) return syncing;
        syncing = firebase().then(function (f) {
            if (!user) return false;
            const ref = f.fs.doc(f.db, "users", user.uid, "progress", "main");
            return f.fs.getDoc(ref).then(function (snap) {
                const remote = snap.exists() ? Object.assign(empty(), snap.data()) : empty();
                state = merge(load(), remote);
                save(true);
                return f.fs.setDoc(ref, JSON.parse(JSON.stringify(state)));
            }).then(function () { return true; });
        }).catch(function (e) {
            console.warn("Fortschritt: Sync ما خدمش", e && e.message);
            return false;
        }).then(function (ok) { syncing = null; return ok; });
        return syncing;
    }
    function scheduleSync() {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(sync, 2500);
    }

    /* ---------- الأحداث ديال التمارين ---------- */
    function params() {
        try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); }
    }
    function pageTitle() {
        const node = document.querySelector(".t1-title, .e1-stage-title, .lesen-detail-title, .task-title-block h1, h1");
        return node ? node.textContent.trim().replace(/\s+/g, " ") : document.title;
    }
    function topicFromUrl() {
        const p = params();
        if (p.get("thema")) return p.get("thema");
        if (p.get("pruefung")) return "pruefung-" + p.get("pruefung");
        return (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
    }

    window.addEventListener("lesen-points", function (e) {
        const d = e.detail || {};
        add({ skill: d.part && d.part.indexOf("sprach") === 0 ? "sprach" : "lesen", part: d.part,
              topic: topicFromUrl(), title: pageTitle(), points: d.points, max: d.max });
    });
    window.addEventListener("sprechen-points", function (e) {
        const d = e.detail || {};
        add({ skill: "sprechen", part: d.part, topic: topicFromUrl(), title: pageTitle(), points: d.points, max: d.max });
    });
    window.addEventListener("hoeren-points", function (e) {
        const d = e.detail || {};
        if (!(d.total > 0)) return;
        add({ skill: "hoeren", part: d.teil, topic: d.id, title: d.title,
              points: half(d.right / d.total * 25), max: 25 });
    });
    window.addEventListener("schreiben-points", function (e) {
        const d = e.detail || {};
        add({ skill: "schreiben", part: "brief", topic: d.id || topicFromUrl(), title: d.title || pageTitle(),
              points: d.score, max: 45 });
    });

    window.addEventListener("storage", function (e) {
        if (e.key !== KEY) return;
        state = merge(load(), state);
        listeners.forEach(function (fn) { try { fn(state); } catch (err) { console.error(err); } });
    });

    window.DEProgress = {
        get state() { return state; },
        add: add,
        results: function () { return state.results.slice(); },
        streak: streak,
        today: today,
        setExamDate: setExamDate,
        daysToExam: daysToExam,
        card: card, isDue: isDue, grade: grade,
        custom: function () { return state.custom.filter(function (w) { return !w.del; }); },
        addCustom: addCustom, removeCustom: removeCustom,
        wordDayDone: wordDayDone, markWordDay: markWordDay, wordDays: wordDays,
        sync: sync,
        signedIn: function () { return firebase().then(function () { return !!user; }).catch(function () { return false; }); },
        onChange: function (fn) { listeners.push(fn); }
    };
})();
