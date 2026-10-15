/* ===== WhatsApp ديال Deutsch Einfach =====

   رقم واحد لكاع الموقع، ورسالة مرتبة بالدارجة كتوصل جاهزة:
   العرض، القسم، الموضوع، والإيميل ديال الحساب (إلا كان داخل)
   — هكا كنعرفو شكون وشنو بغا بلا ما نسولوه.

   الاستعمال:
     deWhatsAppUrl({ offer: "باقة شهر – 99 DH", section: "Hören B1 · Teil 2", topic: "…" })
     <a data-wa-offer="باقة شهر – 99 DH">…</a>   ← كيتفتح بوحدو
     <a data-wa-contact data-wa-section="Schreiben B1">…</a>
*/
(function () {
    "use strict";

    var NUMBER = "212776551898";          /* 0776551898 */
    window.DE_WHATSAPP_NUMBER = NUMBER;

    function accountEmail() {
        try {
            var auth = window.__deutschEinfachAuth;
            return (auth && auth.currentUser && auth.currentUser.email) || "";
        } catch (e) {
            return "";
        }
    }

    /* صفحات Hören كيكتبو العرض بالألمانية: "1 Monat – 99,99 DH" */
    function offerName(text) {
        return String(text || "")
            .replace(/^2 Monate\b/, "باقة شهرين")
            .replace(/^1 Monat\b/, "باقة شهر واحد")
            .replace(/^15 Tage\b/, "باقة 15 يوم");
    }

    window.deWhatsAppUrl = function (o) {
        o = o || {};
        o.offer = offerName(o.offer);
        var lines = ["السلام عليكم 👋"];

        if (o.offer) {
            lines.push("بغيت نشترك ف Premium ديال Deutsch Einfach.");
        } else {
            lines.push("عندي سؤال على Premium ديال Deutsch Einfach.");
        }
        lines.push("");
        if (o.offer) lines.push("📦 العرض: " + o.offer);
        if (o.section) lines.push("📚 القسم: " + o.section);
        if (o.topic) lines.push("📝 الموضوع: " + o.topic);
        lines.push("📧 الإيميل ديال الحساب: " + (o.email || accountEmail()));
        lines.push("");
        if (o.offer) {
            lines.push("عافاك وضّح ليا طريقة الأداء باش يتفعّل الحساب ديالي.");
            lines.push("شكراً 🙏");
        } else {
            lines.push("شكراً مسبقاً على الجواب 🙏");
        }

        return "https://wa.me/" + NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
    };

    /* روابط ثابتة فالـHTML (payment.html…) */
    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("[data-wa-offer], [data-wa-contact]");
        if (!link) return;
        event.preventDefault();
        window.open(window.deWhatsAppUrl({
            offer: link.getAttribute("data-wa-offer") || "",
            section: link.getAttribute("data-wa-section") || "",
            topic: link.getAttribute("data-wa-topic") || ""
        }), "_blank", "noopener");
    });
})();
