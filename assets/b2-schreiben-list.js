/* كيبني لائحة مواضيع B2 Schreiben من schreiben-topics-b2.js.
   قبل كانت 41 كارت مكتوبين باليد — كل موضوع جديد كان خاصو تعديل
   فجوج بلايص، وهادشي هو اللي خلا موضوع 05 يتناقض. */

(function () {
    const WHATSAPP_NUMBER = "212776551898";

    /* نفس العروض ديال payment.html — خاصهم يبقاو متطابقين. */
    const OFFERS = [
        {
            name: "15 Tage",
            sub: "بداية سريعة ومميزة",
            price: "49 DH",
            period: "/ 15 يوم",
            tag: "",
            label: "باقة 15 يوم بثمن 49 DH",
        },
        {
            name: "1 Monat",
            sub: "تحضير أقوى ووقت أكثر",
            price: "99 DH",
            period: "/ شهر",
            tag: "الأكثر طلباً",
            label: "باقة شهر واحد بثمن 99 DH",
        },
        {
            name: "2 Monate",
            sub: "أفضل اختيار للتحضير المكثف",
            price: "150 DH",
            period: "/ شهرين",
            tag: "",
            label: "باقة شهرين بثمن 150 DH",
        },
    ];

    const FEATURES = [
        "وصول كامل لمواضيع Lesen و Hören و Schreiben",
        "تصحيح Schreiben بالذكاء الاصطناعي (لامحدود)",
        "المساعد الذكي للقراءة (لامحدود)",
    ];

    const modal = document.getElementById("premiumModal");
    const topicLine = document.getElementById("premiumTopic");
    const grid = document.getElementById("topics-grid");

    let selectedTopic = "";

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function openPremium(label) {
        selectedTopic = label;
        topicLine.innerHTML =
            "🔒 <strong>" + escapeHtml(label) + "</strong><br>" +
            "🇩🇪 Dieses Thema ist Premium.<br>" +
            "🇲🇦 هاد الموضوع Premium.";
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closePremium() {
        modal.classList.remove("show");
        document.body.style.overflow = "";
    }

    document.getElementById("premiumClose").addEventListener("click", closePremium);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) closePremium();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closePremium();
    });

    /* ---------- العروض ---------- */
    document.getElementById("offerGrid").innerHTML = OFFERS.map(function (offer) {
        return (
            '<div class="offer-card' + (offer.tag ? " best" : "") + '">' +
            (offer.tag ? '<span class="offer-tag">' + offer.tag + "</span>" : "") +
            "<h4>" + offer.name + "</h4>" +
            '<p class="sub">' + offer.sub + "</p>" +
            '<div class="offer-price">' + offer.price + "</div>" +
            '<div class="offer-period">' + offer.period + "</div>" +
            "<ul>" + FEATURES.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>" +
            '<a href="#" class="offer-btn" data-offer="' + escapeHtml(offer.label) + '">WhatsApp</a>' +
            "</div>"
        );
    }).join("");

    document.querySelectorAll("[data-offer]").forEach(function (btn) {
        btn.addEventListener("click", function (event) {
            event.preventDefault();

            const message =
                "السلام عليكم، بغيت نشترك في " + btn.getAttribute("data-offer") + "." +
                (selectedTopic ? "\nThema: " + selectedTopic : "");

            window.open(
                "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message),
                "_blank"
            );
        });
    });

    /* ---------- الكارتات ---------- */
    const ids = Object.keys(SCHREIBEN_B2_TOPICS).sort();

    document.getElementById("stat-count").textContent = String(ids.length);

    grid.innerHTML = ids.map(function (id) {
        const topic = SCHREIBEN_B2_TOPICS[id];
        const label = "Thema " + id + " – " + topic.title;

        const button = topic.locked
            ? '<button class="start-btn premium" type="button" data-premium="' +
              escapeHtml(label) + '">🔒 Premium – Entsperren</button>'
            : '<a class="start-btn" href="b2-schreiben-' + id + '.html">Aufgabe öffnen →</a>';

        return (
            '<article class="topic-card" data-id="' + id + '">' +
            '<div class="topic-number">Thema ' + id + (topic.locked ? " 🔒" : "") + "</div>" +
            '<div class="topic-content">' +
            '<div class="topic-title">' + escapeHtml(topic.title) + "</div>" +
            '<div class="badges">' +
            '<span class="badge type">' + escapeHtml(topic.type) + "</span>" +
            '<span class="badge">' + escapeHtml(topic.time) + "</span>" +
            '<span class="badge">' + escapeHtml(topic.level) + "</span>" +
            "</div>" +
            button +
            "</div></article>"
        );
    }).join("");

    grid.addEventListener("click", function (event) {
        const btn = event.target.closest("[data-premium]");
        if (btn) openPremium(btn.getAttribute("data-premium"));
    });

    /* ---------- فتح الأقفال للمشتركين ---------- */
    (async function () {
        const isPremium = await (window.__deutschEinfachPremiumReady || Promise.resolve(false));
        if (!isPremium) return;

        grid.querySelectorAll("[data-premium]").forEach(function (btn) {
            const card = btn.closest(".topic-card");
            const id = card.getAttribute("data-id");

            const link = document.createElement("a");
            link.className = "start-btn";
            link.href = "b2-schreiben-" + id + ".html";
            link.textContent = "Aufgabe öffnen →";
            btn.replaceWith(link);

            const number = card.querySelector(".topic-number");
            number.textContent = number.textContent.replace("🔒", "").trim();
        });
    })();
})();
