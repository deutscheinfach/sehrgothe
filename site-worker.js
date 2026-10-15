/* ===== الموقع على Cloudflare: غير للطلبات اللي ما لقاوش ملف =====

   الملفات (صفحات .html، assets…) كيتعطاو مباشرة من Cloudflare بلا ما
   يخدم هاد السكريبت (html_handling: "none" → بلا redirect ديال .html).
   هاد السكريبت كيخدم غير ملي ما كاينش ملف بنفس الطريق:
     /  و  /dossier/  → index.html
     /b2-lesen        → b2-lesen.html (بحال GitHub Pages: الروابط القدام بلا .html)
     أي حاجة أخرى    → 404.html (status 404) */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname.endsWith("/")) {
            url.pathname += "index.html";
            return env.ASSETS.fetch(new Request(url, request));
        }
        if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
            const page = new URL(url);
            page.pathname += ".html";
            const res = await env.ASSETS.fetch(new Request(page, request));
            if (res.status !== 404) return res;
        }
        const res = await env.ASSETS.fetch(request);
        if (res.status !== 404) return res;
        const nf = await env.ASSETS.fetch(new Request(new URL("/404.html", url), request));
        return new Response(nf.body, { status: 404, headers: nf.headers });
    }
};
