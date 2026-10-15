/* ===== Sprechen B2 · Teil 2 و Teil 3 =====

   Teil 2 — "Über ein Thema sprechen": كتقرا نص قصير، ومن بعد
            كتلخصو (Inhalt)، كتعطي رأيك (Meinung)، وكتحكي
            التجربة ديالك (Erfahrung). الـPrüfer كيسولك على
            أي وحدة فيهم.

   Teil 3 — "Gemeinsam planen": نتا والـPartner كتخططو لشي
            حاجة مع بعضياتكم (حفلة، خرجة…) نقطة بنقطة، وفاللخر
            كتتفقو على plan.

   شكل Teil 2:
   {
     kind: "text",
     title, text: { title, de, ar },
     glossar:  [{ de, ar }],              // كلمات كيتلونو فالنص
     kern:     { frage, optionen: [], richtig, warum },   // الفكرة الأساسية
     punkte:   [{ de, ar }],              // النقط المهمة ديال النص
     meinung:  { pro: [{de,ar}], contra: [{de,ar}] },
     erfahrung:[{ de, ar }],              // أسئلة كيعاونوك تحكي
     muster:   { inhalt:{de,ar}, meinung:{de,ar}, erfahrung:{de,ar} },
     fragen:   { inhalt:[{de,ar}], meinung:[{de,ar}], erfahrung:[{de,ar}] }
   }

   شكل Teil 3:
   {
     kind: "plan",
     title, situation: { de, ar },
     punkte: [{
       key, label, ar,
       ideen: ["…", "…"],                 // اختيارات للقرار
       partner: { vorschlag, reaktion }   // شنو كيقترح الـPartner / كيف كيرد
     }],
     dialog: [{ who: "A"|"B", de, ar }]    // حوار نموذجي
   }

   ⚠️ هادو مواضيع مثال باش يخدم المحرك. غادي يتبدلو بالنصوص
   ديال الـPDF ملي توصل.
*/

(function () {
    "use strict";

    const TOPICS = [];

    /* المحتوى ف KV: lesen-sprechen-b2-pack (الريبو عام) */
    const CONTENT = {};

    window.SPRECHEN_B2_TOPICS = TOPICS.concat(window.SPRECHEN_B2_TOPICS || []);
    const all = window.SPRECHEN_B2_CONTENT = window.SPRECHEN_B2_CONTENT || {};
    Object.keys(CONTENT).forEach(function (id) {
        all[id] = Object.assign({}, all[id], CONTENT[id]);
    });
})();
