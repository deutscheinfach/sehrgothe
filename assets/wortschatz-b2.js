/* ===== Wortschatz B2: البطاقات =====

   جوج مصادر:
   1) لائحة هنا (DECKS): الكلمات والعبارات اللي كتدور بزاف فـtelc B2 —
      Konnektoren، أفعال بحروف الجر، Nomen-Verb-Verbindungen،
      وعبارات جاهزة للـSchreiben والـSprechen.
   2) الكلمات اللي ديجا فالموقع: Wortschatz ديال Sprechen Teil 1
      والـGlossar ديال Sprechen Teil 2 (إلا تحملو الملفات ديالهم).
   + الكلمات اللي زادهم المستخدم (DEProgress.custom()).

   window.DE_VOCAB.cards() كترجع لائحة وحدة:
   { id, deck, de, ar, ex } — الـid ثابت باش يبقى التقدم ديالو. */

(function () {
    "use strict";

    const DECKS = [
        {
            key: "konnektoren", name: "Konnektoren", ar: "أدوات الربط",
            words: [
                ["obwohl", "واخا / رغم أن", "Obwohl es regnet, gehe ich spazieren."],
                ["trotzdem", "ومع ذلك", "Es war teuer. Trotzdem habe ich es gekauft."],
                ["deshalb", "لهذا / على هاد الشي", "Ich war krank, deshalb bin ich zu Hause geblieben."],
                ["außerdem", "زيادة على ذلك", "Die Wohnung ist hell. Außerdem ist sie günstig."],
                ["jedoch", "ولكن / غير أن", "Das Angebot klang gut, jedoch war der Service schlecht."],
                ["sodass", "حتى / بحيث", "Es war laut, sodass ich nicht schlafen konnte."],
                ["damit", "باش / لكي", "Ich lerne jeden Tag, damit ich die Prüfung bestehe."],
                ["während", "فحين / بينما", "Während ich koche, höre ich Musik."],
                ["sobald", "غير / بمجرد ما", "Sobald ich Zeit habe, rufe ich dich an."],
                ["falls", "إلا / فحالة", "Falls du Fragen hast, schreib mir."],
                ["indem", "بواسطة / ب…", "Man lernt am besten, indem man viel spricht."],
                ["je … desto", "كلما … كلما", "Je mehr ich übe, desto sicherer werde ich."],
                ["sowohl … als auch", "سواء … أو / حتى … حتى", "Sowohl Kinder als auch Erwachsene waren begeistert."],
                ["weder … noch", "لا … ولا", "Ich habe weder Zeit noch Geld."],
                ["nicht nur … sondern auch", "ماشي غير … ولكن حتى", "Das Hotel war nicht nur teuer, sondern auch schmutzig."],
                ["zwar … aber", "صحيح … ولكن", "Der Kurs ist zwar teuer, aber sehr gut."],
                ["einerseits … andererseits", "من جهة … ومن جهة أخرى", "Einerseits ist Homeoffice bequem, andererseits fehlt der Kontakt."],
                ["stattdessen", "فبلاصة هادشي", "Ich fahre nicht mit dem Auto, stattdessen nehme ich das Rad."],
                ["allerdings", "غير أن / ولكن", "Das Essen war lecker, allerdings sehr teuer."],
                ["folglich", "إذن / بالتالي", "Der Zug fiel aus, folglich kam ich zu spät."],
                ["dennoch", "ومع ذلك", "Die Aufgabe war schwer, dennoch habe ich sie gelöst."],
                ["anstatt … zu", "عوض ما", "Anstatt zu lernen, hat er gespielt."]
            ]
        },
        {
            key: "verben", name: "Verben + Präposition", ar: "أفعال بحروف الجر",
            words: [
                ["sich bewerben um + Akk.", "قدّم ترشيحو لـ", "Ich bewerbe mich um die Stelle als Pfleger."],
                ["sich beschweren über + Akk.", "شكا من", "Ich möchte mich über den Service beschweren."],
                ["sich erkundigen nach + Dat.", "سوّل على / استفسر", "Ich möchte mich nach den Kurszeiten erkundigen."],
                ["sich kümmern um + Akk.", "تهلّا فـ", "Wer kümmert sich um die Getränke?"],
                ["sich gewöhnen an + Akk.", "تعوّد على", "Ich habe mich an das Wetter gewöhnt."],
                ["sich entscheiden für + Akk.", "ختار / قرر", "Wir haben uns für das Restaurant entschieden."],
                ["teilnehmen an + Dat.", "شارك فـ", "Ich nehme an einem Deutschkurs teil."],
                ["abhängen von + Dat.", "كيتعلق بـ", "Das hängt vom Wetter ab."],
                ["sich beziehen auf + Akk.", "كيرجع لـ / كيخص", "Ich beziehe mich auf Ihre Anzeige vom 3. Mai."],
                ["verzichten auf + Akk.", "تخلّى على", "Ich kann auf mein Auto nicht verzichten."],
                ["sich beschäftigen mit + Dat.", "تلها بـ / اشتغل على", "In der Freizeit beschäftige ich mich mit Musik."],
                ["sich interessieren für + Akk.", "مهتم بـ", "Ich interessiere mich für Technik."],
                ["sich freuen auf + Akk.", "فرحان بشي حاجة جاية", "Ich freue mich auf den Urlaub."],
                ["sich freuen über + Akk.", "فرحان بشي حاجة وقعات", "Ich habe mich über dein Geschenk gefreut."],
                ["warnen vor + Dat.", "حذّر من", "Die Polizei warnt vor Glatteis."],
                ["bestehen aus + Dat.", "مكوّن من", "Die Prüfung besteht aus vier Teilen."],
                ["sorgen für + Akk.", "تكلّف بـ / ضمن", "Ich sorge für das Essen."],
                ["beitragen zu + Dat.", "ساهم فـ", "Jeder kann zum Umweltschutz beitragen."],
                ["sich verlassen auf + Akk.", "اتّكل على", "Auf ihn kann man sich verlassen."],
                ["hinweisen auf + Akk.", "نبّه على", "Ich möchte Sie darauf hinweisen, dass …"],
                ["sich einsetzen für + Akk.", "دافع على", "Sie setzt sich für Tierschutz ein."],
                ["sich erinnern an + Akk.", "تفكّر", "Ich erinnere mich gern an diese Reise."],
                ["sich bedanken für + Akk.", "شكر على", "Ich bedanke mich für Ihre Hilfe."],
                ["überzeugen von + Dat.", "قنع بـ", "Er hat mich von seiner Idee überzeugt."]
            ]
        },
        {
            key: "nvv", name: "Nomen-Verb-Verbindungen", ar: "عبارات اسم + فعل",
            words: [
                ["eine Entscheidung treffen", "اتخذ قرار", "Wir müssen bald eine Entscheidung treffen."],
                ["in Frage kommen", "ممكن / داخل فالحساب", "Ein Umzug kommt für mich nicht in Frage."],
                ["zur Verfügung stehen", "رهن الإشارة / متوفر", "Ich stehe Ihnen gern zur Verfügung."],
                ["Rücksicht nehmen auf + Akk.", "راعى", "Bitte nehmen Sie Rücksicht auf die Nachbarn."],
                ["in Kauf nehmen", "قبل (عيب) رغماً عليه", "Für die Lage nehme ich die hohe Miete in Kauf."],
                ["einen Beitrag leisten", "ساهم", "Jeder kann einen Beitrag leisten."],
                ["Kritik üben an + Dat.", "انتقد", "Viele üben Kritik an dem neuen Gesetz."],
                ["zum Ausdruck bringen", "عبّر على", "Ich möchte meine Unzufriedenheit zum Ausdruck bringen."],
                ["in Anspruch nehmen", "استفاد من / استعمل", "Ich möchte Ihr Angebot in Anspruch nehmen."],
                ["eine Rolle spielen", "لعب دور / مهم", "Geld spielt dabei keine Rolle."],
                ["Bescheid geben", "علّم / خبّر", "Gib mir bitte Bescheid, wenn du ankommst."],
                ["einen Antrag stellen", "قدّم طلب", "Ich habe einen Antrag auf ein Visum gestellt."],
                ["Maßnahmen ergreifen", "اتخذ إجراءات", "Die Stadt muss Maßnahmen gegen den Lärm ergreifen."],
                ["in Kontakt treten mit + Dat.", "تواصل مع", "Bitte treten Sie mit uns in Kontakt."],
                ["zur Sprache bringen", "طرح موضوع", "Ich möchte ein Problem zur Sprache bringen."],
                ["Einfluss nehmen auf + Akk.", "أثّر على", "Die Medien nehmen Einfluss auf unsere Meinung."],
                ["in Betracht ziehen", "خدا بعين الاعتبار", "Wir sollten auch andere Lösungen in Betracht ziehen."],
                ["Verantwortung übernehmen", "تحمّل المسؤولية", "Er übernimmt die Verantwortung für das Projekt."],
                ["eine Lösung finden", "لقى حل", "Wir finden bestimmt eine Lösung."],
                ["Wert legen auf + Akk.", "عطى أهمية لـ", "Ich lege großen Wert auf Pünktlichkeit."]
            ]
        },
        {
            key: "schreiben", name: "Redemittel Schreiben", ar: "عبارات الرسالة",
            words: [
                ["Sehr geehrte Damen und Herren,", "السادة المحترمين،", ""],
                ["ich beziehe mich auf Ihre Anzeige …", "كنكتب ليكم بخصوص الإعلان ديالكم…", "Ich beziehe mich auf Ihre Anzeige in der Zeitung vom 5. Juni."],
                ["Leider muss ich mich über … beschweren.", "للأسف خاصني نشكي من…", "Leider muss ich mich über Ihren Service beschweren."],
                ["Laut Ihrer Anzeige sollte …", "حسب الإعلان ديالكم كان خاص…", "Laut Ihrer Anzeige sollte das Zimmer ruhig sein."],
                ["Es war vereinbart, dass …", "كان متفق أن…", "Es war vereinbart, dass die Lieferung am Montag kommt."],
                ["Ich erwarte, dass …", "كنتسنى أن…", "Ich erwarte, dass Sie mir einen Teil des Preises erstatten."],
                ["Ich bitte Sie um eine Erstattung.", "كنطلب منكم ترجعو الفلوس.", ""],
                ["Darüber hinaus …", "زيادة على هادشي…", "Darüber hinaus war das Personal unfreundlich."],
                ["Ich möchte Sie darauf hinweisen, dass …", "بغيت ننبهكم أن…", ""],
                ["Ich wäre Ihnen dankbar, wenn …", "غادي نكون شاكر ليكم إلا…", "Ich wäre Ihnen dankbar, wenn Sie mir schnell antworten."],
                ["Ich würde mich über eine baldige Antwort freuen.", "غادي نفرح بجواب قريب.", ""],
                ["Mit freundlichen Grüßen", "مع التحيات", ""],
                ["Könnten Sie mir bitte mitteilen, …", "واش ممكن تخبروني…", "Könnten Sie mir bitte mitteilen, wann der Kurs beginnt?"],
                ["Ich interessiere mich für Ihr Angebot.", "مهتم بالعرض ديالكم.", ""],
                ["Im Voraus vielen Dank!", "شكراً مسبقاً!", ""]
            ]
        },
        {
            key: "sprechen", name: "Redemittel Sprechen", ar: "عبارات الهضرة",
            words: [
                ["Meiner Meinung nach …", "فرأيي…", "Meiner Meinung nach ist Homeoffice sinnvoll."],
                ["Ich bin der Ansicht, dass …", "كنظن / كنشوف أن…", ""],
                ["Da stimme ich dir zu.", "متفق معاك.", ""],
                ["Da bin ich anderer Meinung.", "عندي رأي آخر.", ""],
                ["Das sehe ich ein bisschen anders.", "كنشوفها شوية بطريقة أخرى.", ""],
                ["Was hältst du davon, wenn …?", "شنو رأيك إلا…؟", "Was hältst du davon, wenn wir am Samstag feiern?"],
                ["Wie wäre es, wenn …?", "كيفاش تجي إلا…؟", "Wie wäre es, wenn wir ein Buffet machen?"],
                ["Ich schlage vor, dass …", "كنقترح أن…", ""],
                ["Das ist eine gute Idee, aber …", "فكرة مزيانة، ولكن…", ""],
                ["Einverstanden!", "متفق!", ""],
                ["Wer kümmert sich um …?", "شكون غادي يتهلا فـ…؟", "Wer kümmert sich um die Einladungen?"],
                ["Lass uns festhalten: …", "يالاه نثبتو: …", "Lass uns festhalten: Wir treffen uns um 18 Uhr."],
                ["Ich habe die Erfahrung gemacht, dass …", "عندي تجربة أن…", ""],
                ["In meinem Heimatland ist es so, dass …", "فبلادي كيكون…", ""],
                ["Könnten Sie die Frage bitte wiederholen?", "واش ممكن تعاود السؤال؟", ""],
                ["Zusammenfassend kann man sagen, dass …", "باختصار نقدرو نقولو أن…", ""]
            ]
        },
        {
            key: "woerter", name: "Wichtige Wörter", ar: "كلمات مهمة",
            words: [
                ["die Herausforderung", "التحدي", "Die Prüfung ist eine echte Herausforderung für mich."],
                ["die Erfahrung", "التجربة", "Welche Erfahrungen hast du mit Deutsch gemacht?"],
                ["vermeiden", "تفادى", "Ich versuche, Fehler beim Sprechen zu vermeiden."],
                ["der Vorteil", "الإيجابية / الميزة", "Ein Vorteil von Online-Kursen ist die Flexibilität."],
                ["der Nachteil", "السلبية", "Der Nachteil ist, dass man allein lernt."],
                ["überzeugen", "أقنع", "Mit guten Argumenten kannst du jeden überzeugen."],
                ["die Voraussetzung", "الشرط", "B2 ist eine Voraussetzung für mein Studium."],
                ["zuverlässig", "كيتّكل عليه", "Mein Lernpartner ist sehr zuverlässig."],
                ["die Möglichkeit", "الإمكانية / الفرصة", "Gibt es die Möglichkeit, heute zusammen zu üben?"],
                ["beeindruckend", "مؤثر / كيبهر", "Die Stadt war wirklich beeindruckend."],
                ["die Umwelt", "البيئة", "Wir sollten mehr für die Umwelt tun."],
                ["verantwortlich", "مسؤول", "Wer ist für die Organisation verantwortlich?"],
                ["die Entscheidung", "القرار", "Das war eine schwierige Entscheidung."],
                ["unterstützen", "ساند / عاون", "Kannst du mich beim Schreiben unterstützen?"],
                ["der Termin", "الموعد", "Mein Prüfungstermin ist im Juni."],
                ["die Absicht", "النية", "Ich habe die Absicht, in Deutschland zu arbeiten."],
                ["nachvollziehen", "فهم / تفهّم", "Deine Meinung kann ich gut nachvollziehen."],
                ["der Zusammenhang", "العلاقة / السياق", "In diesem Zusammenhang möchte ich etwas sagen."],
                ["anstrengend", "متعب", "Der Tag war anstrengend, aber schön."],
                ["empfehlen", "نصح بـ", "Welches Buch kannst du mir empfehlen?"],
                ["die Geduld", "الصبر", "Beim Sprachenlernen braucht man viel Geduld."],
                ["zufrieden", "راضي", "Ich bin mit meinem Ergebnis zufrieden."],
                ["vorschlagen", "اقترح", "Ich schlage vor, dass wir morgen üben."],
                ["die Rückerstattung", "استرجاع الفلوس", "Ich bitte um eine Rückerstattung."],
                ["die Unterkunft", "بلاصة المبيت", "Die Unterkunft war sauber und ruhig."],
                ["die Gesellschaft", "المجتمع", "Das Handy verändert unsere Gesellschaft."],
                ["die Ausbildung", "التكوين المهني", "Nach der Schule beginne ich eine Ausbildung."],
                ["die Bewerbung", "طلب الترشيح", "Meine Bewerbung war erfolgreich."],
                ["der Verbraucher", "المستهلك", "Verbraucher sollten Preise vergleichen."],
                ["nachhaltig", "مستدام", "Wir müssen nachhaltiger leben."]
            ]
        }
    ];

    function slug(s) {
        return String(s).toLowerCase()
            .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    }

    function fromSite() {
        const out = [];
        const seen = {};
        const content = window.SPRECHEN_B2_CONTENT || {};
        Object.keys(content).forEach(function (id) {
            const t = content[id] || {};
            const lists = [];
            if (t.teil1 && Array.isArray(t.teil1.wortschatz)) lists.push(t.teil1.wortschatz);
            ["teil2", "teil3"].forEach(function (k) { if (t[k] && Array.isArray(t[k].glossar)) lists.push(t[k].glossar); });
            lists.forEach(function (list) {
                list.forEach(function (w) {
                    if (!w || !w.de || !w.ar) return;
                    /* الأسئلة (فيهم ?) ماشي كلمات */
                    if (/\?$/.test(w.de) || w.de.split(" ").length > 5) return;
                    const key = slug(w.de);
                    if (seen[key]) return;
                    seen[key] = true;
                    out.push({ id: "s-" + key, deck: "themen", de: w.de, ar: w.ar, ex: "" });
                });
            });
        });
        return out;
    }

    function cards() {
        const list = [];
        DECKS.forEach(function (d) {
            d.words.forEach(function (w) {
                list.push({ id: "c-" + d.key + "-" + slug(w[0]), deck: d.key, de: w[0], ar: w[1], ex: w[2] || "" });
            });
        });
        fromSite().forEach(function (c) { list.push(c); });
        /* اللائحة اليومية (1050 كلمة) */
        if (window.DE_WORDS_1000) {
            window.DE_WORDS_1000.words().forEach(function (w) {
                list.push({ id: w.id, deck: "tag", de: w.de, ar: w.ar, ex: "", day: w.day });
            });
        }
        if (window.DEProgress) {
            window.DEProgress.custom().forEach(function (w) {
                list.push({ id: w.id, deck: "meine", de: w.de, ar: w.ar, ex: w.ex || "" });
            });
        }
        return list;
    }

    function decks() {
        return [{ key: "tag", name: "Tageslisten", ar: "اللوائح اليومية" }]
            .concat(DECKS.map(function (d) { return { key: d.key, name: d.name, ar: d.ar }; }))
            .concat([{ key: "themen", name: "Aus den Themen", ar: "من المواضيع" },
                     { key: "meine", name: "Meine Wörter", ar: "الكلمات ديالي" }]);
    }

    function dueCount() {
        if (!window.DEProgress) return 0;
        return cards().filter(function (c) {
            const s = window.DEProgress.card(c.id);
            return s && window.DEProgress.isDue(c.id);
        }).length;
    }

    window.DE_VOCAB = { cards: cards, decks: decks, dueCount: dueCount };
})();
