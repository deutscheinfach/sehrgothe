/* ===== Sprechen B1 =====

   Teil 1 (Einander kennenlernen) ديما هو هو فالامتحان:
   جوج مترشحين كيتعرفو على بعضياتهم ~3 دقايق.
   لهذا كاين غير تمرين واحد ديال Teil 1.

   Teil 2 و Teil 3 غادي يتزادو من بعد فنفس الملف.

   شكل التمرين (كيبنيه sprechen-engine.js):
   {
     title, minutes,
     intro:  "…" ولا ["سطر", "سطر"],
     points: ["…"],  note: "…",
     ar:     { intro, points: [], note },       // ترجمة المهمة
     fragen: [{ head, items: [{ q, a, ar }] }], // أسئلة وأجوبة نموذجية
     redemittel: { label, groups: [{ head, items: [] }] }
   }
*/

window.SPRECHEN_B1_TOPICS = [
    { id: "kennenlernen", title: "Einander kennenlernen", ar: "التعارف", parts: ["teil1"], locked: true, pack: true, level: "B1" },

    /* ---- Teil 2 · Über ein Thema sprechen ----
       soon: true = المحتوى ما زال ماوصلش (البطاقة كتبان بلا رابط). */
    { id: "t2-01", title: "Bücherhören", ar: "الكتب الصوتية", parts: ["teil2"], locked: true, pack: true, level: "B1" },
    { id: "t2-02", title: "Tanzen", ar: "الرقص", parts: ["teil2"], locked: true, pack: true, level: "B1" },
    { id: "t2-03", title: "Schöner Wohnen", ar: "السكن الزوين", parts: ["teil2"], locked: true, pack: true, level: "B1" },
    { id: "t2-04", title: "Stress", ar: "الضغط", parts: ["teil2"], locked: true, pack: true, level: "B1" },
    { id: "t2-05", title: "Arbeitszeiten in der Gastronomie", ar: "أوقات الخدمة فالمطاعم", parts: ["teil2"], locked: true, pack: true, level: "B1" },
    { id: "t2-06", title: "Lebensmittel im Internet", ar: "شراء الماكلة من الإنترنت", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-07", title: "Essensgewohnheiten", ar: "عادات الماكلة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-08", title: "Geld sparen", ar: "توفير الفلوس", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-09", title: "Am Wochenende etwas unternehmen?", ar: "الخرجات فالويكاند", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-10", title: "Rapmusik", ar: "موسيقى الراب", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-11", title: "Auto, Bus oder Bahn", ar: "الطوموبيل، الطوبيس ولا التران", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-12", title: "Große Feier veranstalten", ar: "تنظيم حفلة كبيرة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-13", title: "TikTok", ar: "تيك توك", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-14", title: "Smartphone", ar: "السمارتفون", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-15", title: "Handynutzung in öffentlichen Verkehrsmitteln", ar: "التيليفون فالنقل العمومي", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-16", title: "Allein wohnen", ar: "السكن بوحدك", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-17", title: "Großeltern", ar: "الجدود", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-18", title: "Nachbarn", ar: "الجيران", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-19", title: "Geburtstag feiern", ar: "الاحتفال بعيد الميلاد", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-20", title: "Urlaub mit Freunden", ar: "العطلة مع الصحاب", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-21", title: "Gefahren im Internet", ar: "مخاطر الإنترنت", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-22", title: "Sport treiben", ar: "ممارسة الرياضة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-23", title: "Lebenslanges Lernen", ar: "التعلم مدى الحياة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-24", title: "Zukunftspläne", ar: "مخططات المستقبل", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-25", title: "Handy", ar: "التيليفون", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-26", title: "Umzug", ar: "الرحيل", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-27", title: "Bauernmarkt", ar: "سوق الفلاحة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-28", title: "Gemeinsame Mahlzeiten", ar: "الماكلة مجموعين", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-29", title: "Öffentliche Verkehrsmittel", ar: "النقل العمومي", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-30", title: "Essen kochen", ar: "الطياب", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-31", title: "Kleidung und Mode", ar: "الحوايج والموضة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-32", title: "Fernsehen", ar: "التلفزة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-33", title: "Beste Freunde", ar: "أعز الصحاب", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-34", title: "Kinofilm", ar: "فيلم فالسينما", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-35", title: "Rauchen", ar: "التدخين", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-36", title: "Mehr Zeit", ar: "وقت كثر", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-37", title: "Geschenkaustausch", ar: "تبادل الهدايا", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-38", title: "Haustier", ar: "حيوان الدار", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-39", title: "Wohnen in der Stadt oder auf dem Land", ar: "السكن فالمدينة ولا فالبادية", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-40", title: "Abenteuer", ar: "المغامرة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-41", title: "Kleidung", ar: "الحوايج", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-42", title: "Im Internet bestellen", ar: "الطلب من الإنترنت", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-43", title: "Smartphone in der Schule", ar: "السمارتفون فالمدرسة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-44", title: "Brief oder E-Mail", ar: "رسالة ولا إيميل", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-45", title: "Kinder im Freizeitstress – Ehrgeizige Eltern", ar: "الضغط على الدراري فوقت الفراغ", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-46", title: "Auto kaufen", ar: "شراء طوموبيل", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-47", title: "Gastfreundschaft", ar: "الضيافة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-48", title: "Ausziehen oder allein wohnen", ar: "الخروج من دار الوالدين", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-49", title: "Sammlungen und sammeln", ar: "جمع الحوايج", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-50", title: "Heiraten / Hochzeit", ar: "الزواج / العرس", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-51", title: "Gemeinschaftsgarten", ar: "جردة مشتركة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-52", title: "Serie oder Film", ar: "مسلسل ولا فيلم", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-53", title: "Sport im Fitnessstudio", ar: "الرياضة فالصالة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-54", title: "Klassentreffen", ar: "لقاء صحاب القسم", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-55", title: "Führerschein", ar: "البيرمي", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-56", title: "Immer online", ar: "ديما أونلاين", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-57", title: "Wohngemeinschaft", ar: "السكن المشترك", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-58", title: "Der ideale Urlaub", ar: "العطلة المثالية", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-59", title: "Alter und Lebenserfahrung", ar: "السن وتجربة الحياة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-60", title: "Verwandtschaft", ar: "العائلة والقرابة", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-61", title: "Hauskauf oder Mieten", ar: "شراء الدار ولا الكرا", parts: ["teil2"], locked: true, level: "B1" },
    { id: "t2-62", title: "Essen", ar: "الماكلة", parts: ["teil2"], locked: true, level: "B1" },

    /* ---- Teil 3 · Gemeinsam etwas planen ---- */
    { id: "t3-01", title: "Pflanzen auf dem Balkon", ar: "نباتات فالبالكون", parts: ["teil3"], locked: true, pack: true, level: "B1" },
    { id: "t3-02", title: "Nachbarin bei großem Familientreffen helfen", ar: "نعاونو الجارة فلقاء عائلي كبير", parts: ["teil3"], locked: true, pack: true, level: "B1" },
    { id: "t3-03", title: "Von Ihrer Heimatstadt erzählen", ar: "نحكيو على المدينة ديالنا", parts: ["teil3"], locked: true, pack: true, level: "B1" },
    { id: "t3-04", title: "Auf die Kinder aufpassen", ar: "نتهلاو فالدراري", parts: ["teil3"], locked: true, pack: true, level: "B1" },
    { id: "t3-05", title: "Gemeinsam einen Ausflug mit neuen Kollegen", ar: "خرجة مع جوج زملاء جداد", parts: ["teil3"], locked: true, pack: true, level: "B1" },
    { id: "t3-06", title: "Einen Spieleabend organisieren", ar: "نظمو عشية ديال الألعاب", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-07", title: "Eine Städtereise machen", ar: "رحلة لشي مدينة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-08", title: "Gruppenreise nach Berlin", ar: "رحلة جماعية لبرلين", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-09", title: "Tierpark besuchen", ar: "زيارة حديقة الحيوانات", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-10", title: "Einen kranken Freund besuchen", ar: "نزورو صاحب مريض", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-11", title: "Einen Computerkurs besuchen", ar: "نقراو كور ديال الحاسوب", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-12", title: "Treffen mit den ehemaligen Mitschülerinnen", ar: "لقاء مع صحاب القسم القدام", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-13", title: "Geburtstagsparty in einer anderen Stadt", ar: "حفلة عيد ميلاد فمدينة أخرى", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-14", title: "Firmenjubiläum", ar: "ذكرى تأسيس الشركة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-15", title: "Sich auf die Deutschprüfung vorbereiten", ar: "نوجدو راسنا لامتحان الألمانية", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-16", title: "Abschiedsparty feiern", ar: "حفلة الوداع", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-17", title: "Ein Tag im Wald mit den Familien", ar: "نهار فالغابة مع العائلات", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-18", title: "Sommerfest", ar: "حفلة الصيف", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-19", title: "Eine Spendenaktion organisieren", ar: "نظمو حملة تبرعات", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-20", title: "Ein Musikinstrument lernen", ar: "نتعلمو آلة موسيقية", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-21", title: "Ferienspiele für die Kinder", ar: "ألعاب العطلة للدراري", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-22", title: "Kindergarten verschönern", ar: "نزينو روض الأطفال", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-23", title: "Abschlussfest organisieren", ar: "نظمو حفلة آخر الكور", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-24", title: "Ein Haus zusammen renovieren", ar: "نرممو دار مجموعين", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-25", title: "Einen Sprachkurs planen", ar: "نخططو لكور ديال اللغة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-26", title: "Die alte Sprachschule besuchen", ar: "نزورو مدرسة اللغة القديمة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-27", title: "Hilfe bei der Hausarbeit", ar: "نعاونو فشغل الدار", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-28", title: "Kinderbetreuung während einer Hochzeit", ar: "نتهلاو فالدراري فالعرس", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-29", title: "Gemeinsam einen Fernsehabend organisieren", ar: "نظمو عشية ديال التلفزة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-30", title: "Ausflug mit dem Fahrrad", ar: "جولة بالبشكليط", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-31", title: "Menschen helfen, die wenig Glück hatten", ar: "نعاونو الناس اللي ما عندهمش الزهر", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-32", title: "Kochkurs: Die deutsche Küche", ar: "كور ديال الطياب: الماكلة الألمانية", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-33", title: "Kinder-Lesenacht", ar: "ليلة القراية للدراري", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-34", title: "Schiffsreise planen", ar: "نخططو لرحلة بالبابور", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-35", title: "Wanderung", ar: "خرجة ديال المشي", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-36", title: "Firmen-Olympiade", ar: "أولمبياد الشركة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-37", title: "Kindern beim Deutschlernen helfen", ar: "نعاونو الدراري يتعلمو الألمانية", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-38", title: "Straßenfest", ar: "حفلة الزنقة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-39", title: "Einen Kochkurs besuchen", ar: "نقراو كور ديال الطياب", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-40", title: "Zusammen kochen", ar: "نطيبو مجموعين", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-41", title: "Firmenfeier organisieren", ar: "نظمو حفلة للشركة", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-42", title: "Eine gewonnene Schiffsreise planen", ar: "نخططو لرحلة بحرية ربحناها", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-43", title: "Ausflug auf den höchsten Berg", ar: "خرجة لأعلى جبل", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-44", title: "Einen Tanzkurs besuchen", ar: "نقراو كور ديال الرقص", parts: ["teil3"], locked: true, level: "B1" },
    { id: "t3-45", title: "Gemeinsam Abendessen gehen", ar: "نمشيو نتعشاو مجموعين", parts: ["teil3"], locked: true, level: "B1" }
];

/* المحتوى ديال كاع المواضيع ف Cloudflare KV (الريبو عام):
   - المواضيع اللي كانو مجانيين (pack: true) → lesen-sprechen-b1-pack
   - Teil 2 / Teil 3 → lesen-sprechen-b1-t2 / lesen-sprechen-b1-t3 */
window.SPRECHEN_B1_CONTENT = {};
