/* ===== Sprechen B2 · Teil 1 — Über Erfahrungen sprechen =====

   فالامتحان: كتختار موضوع (سفر، كتاب، فيلم…) وكتهضر عليه
   بوحدك بين 90 و180 ثانية. من بعد الـPrüfer كيسولك جوج أسئلة
   على داكشي اللي حكيتي.

   هاد الملف فيه المواضيع ديال Teil 1 بوحدهم. كيتزادو
   لـ SPRECHEN_B2_TOPICS و SPRECHEN_B2_CONTENT باش الشبكة
   ديال b2-sprechen.html تبينهم تحت "Teil 1".

   شكل الموضوع:
   {
     kind: "erfahrung",
     aufgabe:   "…",  aufgabeAr: "…",
     leitfragen: [{ de, ar }],     // على شنو خاصك تهضر
     wortschatz: [{ de, ar }],     // كلمات كتنفع فهاد الموضوع
     muster:     { de, ar },       // نموذج ديال الكلام (~150 كلمة)
     fragen:     [{ de, ar }]      // أسئلة الـPrüfer — كيتختارو جوج بالصدفة
   }

   ملاحظة: هادو تمارين تحضيرية على شكل الامتحان، ماشي أوراق رسمية.
*/

(function () {
    "use strict";

    const TOPICS = [
        { id: "e-reise",      title: "Reise",                     ar: "رحلة أو عطلة",   parts: ["teil1"], locked: true, pack: true },
        { id: "e-buch",       title: "Buch",                      ar: "كتاب أو رواية",  parts: ["teil1"], locked: true, pack: true },
        { id: "e-film",       title: "Film",                      ar: "فيلم سينمائي",   parts: ["teil1"], locked: true, pack: true },
        { id: "e-sport",      title: "Sportereignis",             ar: "حدث رياضي",      parts: ["teil1"], locked: true, pack: true },
        { id: "e-musik",      title: "Musikveranstaltung",        ar: "حفل موسيقي",     parts: ["teil1"], locked: true },
        { id: "e-person",     title: "Wichtige Person im Leben",  ar: "شخصية مهمة",     parts: ["teil1"], locked: true },
        { id: "e-erfahrung",  title: "Wichtige Erfahrung",        ar: "تجربة مهمة",     parts: ["teil1"], locked: true },
        { id: "e-fest",       title: "Fest oder Feier",           ar: "عرس أو حفلة",    parts: ["teil1"], locked: true }
    ];

    /* المحتوى ف KV: lesen-sprechen-b2-pack (الريبو عام) */
    const CONTENT = {};

    window.SPRECHEN_B2_TOPICS = TOPICS.concat(window.SPRECHEN_B2_TOPICS || []);
    const all = window.SPRECHEN_B2_CONTENT = window.SPRECHEN_B2_CONTENT || {};
    Object.keys(CONTENT).forEach(function (id) {
        all[id] = Object.assign({}, all[id], { teil1: CONTENT[id] });
    });
})();
