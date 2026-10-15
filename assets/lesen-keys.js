/* ===== كلمات مفتاحية بالإيد ل Teil 1 =====

   الخوارزمية (lesen-engine.js) كتلقى غير الكلمات المشتركين بين النص
   والترويسة. اللي ماكتلقاهش — جملة كاملة، رقم، كلمة قصيرة، مرادف —
   كتزاد هنا. كيبانو بالأصفر ف نفس اللحظة اللي كيبانو فيها الباقي:
   ملي المستعمل كيدير «تحقق من الإجابات» ولا «شوف الحل».

   الشكل:   المستوى → id ديال الموضوع → رقم النص (1…5) → لائحة الجمل

   · الجملة كتتقلب عليها ف النص ديالها غير، وكل ظهور كيتلون.
   · الحروف الكبار والصغار، الجمع والتصريف (Tauschrings ↔ Tauschring)
     وغلطة وحدة ف كلمة طويلة ما كيهمّوش.
   · المواضيع Premium نصوصهم ف Cloudflare KV، ماشي هنا. هاد الملف فيه غير
     الجمل المفتاحية (كلمتين تلاتة ف كل نص)، وكيخدم لكل المواضيع.
   · إلا جملة ما بانتش، الغالب الكتابة ف النص مختلفة. ف Console كيبان:
     «Lesen: كلمات مفتاحية ما لقيناهاش ف …».
   · الأرقام ف التعاليق (سطر …) هي سطر الجملة ف النص كيف كان كيبان
     ملي تكتبو — مرجع غير، الكود ما كيستعملهاش.

   تقدر زيد حقل keys ف النص نفسو (texts[i].keys = ["…"]) بحال هادي. */

window.LESEN_KEYS = {
    b1: {
        "b1-alex-cora": {
            1: ["Mitarbeiter",            /* ↔ Angestellte */
                "E-Bikes"]                /* ↔ Elektromobilität */
        }
    },

    b2: {
        umwelt: {
            1: ["seit den 80er Jahren",   /* سطر 1 */
                "Tauschrings",            /* سطر 2 */
                "Tauschen"]               /* سطر 3 */
        },

        spiele: {
            3: ["Gedruckten Büchern",     /* سطر 1 */
                "die Hand"]               /* سطر 3 */
        },

        batata: {
            4: ["Schlank",                /* سطر 1 */
                "Diät"],                  /* سطر 2 */
            5: ["deutsch",                /* سطر 1 */
                "populäre Kartoffel"]     /* سطر 2 */
        },

        geld: {
            2: ["Museum für Kommunikation", /* سطر 2 */
                "die Besucher"]             /* سطر 3 */
        },

        drogen: {
            1: ["Fresenius-Klinik"]       /* سطر 4 */
        },

        wahlen: {
            1: ["Gymnasium",
                "ihr Diplom",
                "Abschluss",
                "Die junge Frau"],        /* سطر 1 → 3 */
            2: ["die Französin Olympe",   /* سطر 2 */
                "Dass Frauen",            /* سطر 1 */
                "in Europa"],             /* سطر 5 */
            3: ["Wahlverhalten",          /* سطر 1 */
                "im Wahlverhalten"],      /* سطر 3 */
            4: ["Studierenden",           /* سطر 1 */
                "erfolgreich"]            /* سطر 4 */
        },

        keinezeit: {
            4: ["den richtigen Partner",  /* ↔ Wer sucht, der findet */
                "zu finden",
                "den oder die Richtige",
                "Ausgehen"],
            2: ["Zweisamkeit",            /* سطر 1 */
                "Vermittlungsagenturen",  /* ↔ Kontaktagenturen */
                "Partnervermittlungsagentur",
                "schwarze Schafe",        /* ↔ zweifelhaft */
                "Aufgepasst"]             /* ↔ Vorsicht */
        },

        aufdemweg: {
            1: ["Fitness",                /* سطر 1 */
                "Pferde"],                /* سطر 2 */
            2: ["Nationalmannschaft",     /* سطر 2 */
                "Olympischen",            /* سطر 3 */
                "Sport"],                 /* سطر 2 */
            4: ["Trampolin",              /* سطر 1 */
                "Trainingsgerät"]         /* سطر 1 */
        },

        baeder: {
            3: ["Urlaubstrend",           /* سطر 1 */
                "dem Fluss"]              /* سطر 4 */
        },

        babytv: {
            4: ["Flora und Fauna",        /* سطر 1 */
                "Ginseng-Kosmetiklinie"]  /* سطر 5 */
        },

        autos: {
            3: ["Autos",                  /* سطر 1 */
                "Rost"]                   /* سطر 3 */
        },

        computer: {
            4: ["World Wide Web",         /* سطر 1 */
                "im Netz",                /* سطر 5 */
                "Internetnutzer"]         /* سطر 1 */
        },

        altesleben: {
            4: ["Arno Schneider hat",     /* سطر 1 */
                "Unzufriedenheit"]        /* سطر 3 */
        },

        lebensmodelle: {
            3: ["zwei Menschen",          /* سطر 1 */
                "Gemeinschaft"],          /* سطر 1 */
            5: ["Metropole",              /* سطر 1 */
                "Lebensqualität"]         /* سطر 4 */
        },

        wohnen: {
            2: ["junger"],                /* سطر 1 */
            4: ["die Menschen",           /* سطر 1 */
                "Eine neue"]              /* سطر 2 */
        },

        tanzkurs: {
            1: ["Extremsport"],           /* سطر 1 و 4 */
            4: ["Tanja Kleist",           /* سطر 1 */
                "Teilnehmerinnen und Teilnehmer"], /* سطر 5 */
            5: ["montags", "dienstags", "mittwochs",  /* سطر 1 */
                "langweilig"]                         /* سطر 8 */
        },

        insel: {
            4: ["Die südamerikanischen Galapagosinseln", /* سطر 1 */
                "fernen Inseln"],                        /* سطر 2 */
            5: ["Elefanten in Thailand"]                 /* سطر 1 */
        },

        benzin: {
            5: ["Flugzeug"]               /* سطر 1 */
        },

        kaffee: {
            2: ["Die Altstadt",           /* سطر 2 */
                "Museum",                 /* سطر 2 */
                "Alte Universität"]       /* سطر 5 */
        },

        bonbon: {
            1: ["Bonbons",
                "Süßigkeit",
                "über 1.000 Jahren",
                "seit 1828"],
            3: ["die römische Badekultur",   /* سطر 4–6 */
                "Römische Badehäuser",
                "mit Mosaikböden"],
            4: ["Süßigkeiten",               /* سطر 1 و 2 */
                "die Stimmung"]
        }
    }
};
