// sehrgut - Schreiben Correction Worker (B1 + B2)
// Gemini API backend
//
// Required Cloudflare secret:
// GEMINI_API_KEY
//
// Optional environment variables:
// ALLOWED_ORIGIN = https://deutscheinfach.github.io
//                  (يقدر يكون أكثر من واحد، مفصولين بفاصلة)
// GEMINI_MODEL   = gemini-3.6-flash

// gemini-2.5-flash بقا محجور على الحسابات الجداد، و Gemini نفسها
// كتوصي بـ gemini-3.6-flash. تأكدنا منو عبر ListModels.
// يقدر يتبدل بلا ما نعاودو الكود: زيد variable سميتها GEMINI_MODEL.
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

export default {
  /* التذكير اليومي: Cloudflare → Paramètres → Déclencheurs → Cron
     «0 18 * * *» (18:00 UTC = 19:00 ف المغرب). */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDailyReminders(env).then(
      (r) => console.log("daily reminders:", JSON.stringify(r)),
      (e) => console.log("daily reminders failed:", e.message)
    ));
  },

  async fetch(request, env) {
    /* ===== شكون مسموح ليه يعيّط =====

       كان هنا دومين واحد. ملي تزاد دومين جديد، الدومين القديم
       كيوقف — ولا العكس. والزائر اللي جاي من www كيتسد حتى هو،
       حيت المتصفح كيشوف www.x.com و x.com بحال جوج مواقع.

       دابا كنقبلو لائحة. كنرجعو بالضبط الدومين اللي جا منو
       الطلب (إلا كان فاللائحة) — CORS ماكيقبلش لائحة فالجواب،
       كيقبل واحد برك.

       ALLOWED_ORIGIN فالـdashboard: دومينات مفصولين بفاصلة. */
    const ALLOWED = (env.ALLOWED_ORIGIN
        || "https://deutscheinfach.github.io")
      .split(",")
      .map((one) => one.trim())
      .filter(Boolean);

    const asked = request.headers.get("Origin") || "";
    const allowedOrigin = ALLOWED.includes(asked) ? asked : ALLOWED[0];

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    /* ===== المواضيع المجانية (GET ?free=lesen-b2) =====
       كانو ف assets/lesen-b?-content.js — ولا واحد كيشوفهم ف View source.
       دابا كيسكنو ف KV (free-lesen-b1 / free-lesen-b2) وكيتعطاو لأي واحد
       بلا حساب، بحال API. الجواب كيتحفظ 10 دقايق ف المتصفح. */
    if (request.method === "GET") {
      const freeKey = new URL(request.url).searchParams.get("free") || "";
      if (/^lesen-b[12]$/.test(freeKey)) {
        if (!env.TOPICS) {
          return jsonResponse({ error: "KV binding TOPICS is not configured." }, 500, allowedOrigin);
        }
        const text = await env.TOPICS.get("free-" + freeKey, { type: "text", cacheTtl: KV_EDGE_TTL });
        if (!text) {
          return jsonResponse({ error: "free_key_missing", key: "free-" + freeKey }, 404, allowedOrigin);
        }
        const headers = corsHeaders(allowedOrigin);
        headers["Cache-Control"] = "public, max-age=600";
        return new Response(text, { status: 200, headers });
      }
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed" },
        405,
        allowedOrigin
      );
    }

    try {
      const body = await request.json();

      /*
       * أداة تشخيص: POST {"listModels": true}
       * كترجع الموديلات المتاحة للمفتاح. المفتاح كيبقى فالسيرفر.
       */
      if (body.listModels === true) {
        if (!env.GEMINI_API_KEY) {
          return jsonResponse(
            { error: "GEMINI_API_KEY is not configured." },
            500,
            allowedOrigin
          );
        }

        const listResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
          { headers: { "x-goog-api-key": env.GEMINI_API_KEY } }
        );

        const listData = await listResponse.json();

        if (!listResponse.ok) {
          return jsonResponse(
            {
              error: "ListModels failed.",
              details: listData?.error?.message || "Unknown error.",
            },
            502,
            allowedOrigin
          );
        }

        // غير اللي كيدعمو generateContent — هوما اللي كينفعونا.
        const usable = (listData.models || [])
          .filter((m) =>
            (m.supportedGenerationMethods || []).includes("generateContent")
          )
          .map((m) => m.name);

        return jsonResponse(
          { currentModel: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL, usable },
          200,
          allowedOrigin
        );
      }

      /*
       * البلاد ديال الحساب: POST {"region": {tz, langs, phone, seen}, idToken}
       * كيرجع {region, free}. الصفحات كيعيطو ليه مرة ف كل جلسة.
       */
      if (body.region && typeof body.region === "object") {
        let regionClaims;
        try {
          regionClaims = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse(
            { error: "not_signed_in", details: authError.message },
            401,
            allowedOrigin
          );
        }
        if (!regionStore(env)) {
          return jsonResponse({ error: "KV binding REGIONS is not configured." }, 500, allowedOrigin);
        }
        const region = await resolveRegion(env, request, regionClaims.sub, body.region);
        return jsonResponse({ region, free: regionIsFree(region) }, 200, allowedOrigin);
      }

      /*
       * نص موضوع Premium. كيرجع غير للمشتركين.
       * النصوص كيسكنو فـ KV، ماشي فالـ repo — الـ repo عام.
       */
      if (typeof body.topicId === "string") {
        const topicId = body.topicId;

        if (!/^\d{2}$/.test(topicId)) {
          return jsonResponse({ error: "Invalid topic id." }, 400, allowedOrigin);
        }

        if (!env.TOPICS) {
          return jsonResponse(
            { error: "KV binding TOPICS is not configured." },
            500,
            allowedOrigin
          );
        }

        let claims;
        try {
          claims = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse(
            { error: "not_signed_in", details: authError.message },
            401,
            allowedOrigin
          );
        }

        /* الـKV وFirestore ماكيتسناوش بعضياتهم */
        const allPending = kvJson(env, "premium-topics");
        allPending.catch(() => {}); /* الخطأ كيبان ملي كنتسناو الجواب، ماشي هنا */

        let subscribed;
        try {
          subscribed = await hasAccess(env, request, claims.sub, body.idToken);
        } catch (lookupError) {
          return jsonResponse(
            { error: "subscription_lookup_failed", details: lookupError.message },
            502,
            allowedOrigin
          );
        }

        if (!subscribed) {
          return jsonResponse({ error: "not_subscribed" }, 403, allowedOrigin);
        }

        /*
         * مفتاح واحد "premium-topics" فيه جميع المواضيع: تحديث واحد
         * فالـ dashboard بدل 36. وإلا ما كانش، كنقلبو على مفتاح خاص
         * بالموضوع، باش يمكن تحديث واحد بوحدو.
         */
        const all = await allPending;
        const topic = all?.[topicId] || (await kvJson(env, "topic-" + topicId));

        if (!topic) {
          return jsonResponse({ error: "Topic not found." }, 404, allowedOrigin);
        }

        return jsonResponse(topic, 200, allowedOrigin);
      }

      /*
       * موضوع Lesen ديال Premium. نفس المنطق ديال topicId، ولكن
       * المفاتيح هنا حروف (insel, bilder…) والمحتوى كيسكن فـ KV
       * تحت "premium-lesen". الـ repo عام، إذن النصوص ماكايناش فيه.
       */
      if (typeof body.lesenId === "string") {
        const lesenId = body.lesenId;

        if (!/^[a-z0-9-]{2,40}$/.test(lesenId)) {
          return jsonResponse({ error: "Invalid lesen id." }, 400, allowedOrigin);
        }

        if (!env.TOPICS) {
          return jsonResponse(
            { error: "KV binding TOPICS is not configured." },
            500,
            allowedOrigin
          );
        }

        let lesenClaims;
        try {
          lesenClaims = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse(
            { error: "not_signed_in", details: authError.message },
            401,
            allowedOrigin
          );
        }

        /* مفتاح الموضوع كيتقرا فنفس الوقت ديال التحقق من الاشتراك */
        const ownPending = kvJson(env, "lesen-" + lesenId);
        ownPending.catch(() => {}); /* نفس الشي: الخطأ كيبان ملي كنتسناو الجواب */

        let lesenSubscribed;
        try {
          lesenSubscribed = await hasAccess(env, request, lesenClaims.sub, body.idToken);
        } catch (lookupError) {
          return jsonResponse(
            { error: "subscription_lookup_failed", details: lookupError.message },
            502,
            allowedOrigin
          );
        }

        if (!lesenSubscribed) {
          return jsonResponse({ error: "not_subscribed" }, 403, allowedOrigin);
        }

        /* مفتاح خاص بكل موضوع أولا — خفيف وسريع.
           الـ blobs الكبار كيبقاو غير كحل احتياطي. */
        let lesenTopic = await ownPending;

        /* Sprechen عندو blob ديالو باش ما نخلطوش المحتوى ديالو
           مع premium-lesen — هادوك جوج لوائح مختلفة وكل وحدة
           كتتحدث بوحدها. */
        if (!lesenTopic && lesenId.startsWith("sprechen-")) {
          const sprechenAll = await kvJson(env, "premium-sprechen");
          lesenTopic = sprechenAll?.[lesenId];
        }

        if (!lesenTopic) {
          const lesenAll = await kvJson(env, "premium-lesen");
          lesenTopic = lesenAll?.[lesenId];
        }

        if (!lesenTopic) {
          /* رسالة مختلفة لـSprechen — كتخدم كعلامة باش نعرفو
             واش هاد النسخة ديال الـWorker هي اللي خدامة.
             إلا شفتي "Topic not found." ف موضوع Sprechen، يعني
             الـDeploy ما دازش والـWorker القديم مازال خدام. */
          if (lesenId.startsWith("sprechen-")) {
            return jsonResponse({
              error: "sprechen_key_missing",
              details: "الـWorker جديد وخدام. المفتاح premium-sprechen ماكاينش ف KV، " +
                       "ولا كاين وماكاينش فيه " + lesenId + "، ولا ماشي ف نفس الـNamespace."
            }, 404, allowedOrigin);
          }
          return jsonResponse({ error: "Topic not found." }, 404, allowedOrigin);
        }

        return jsonResponse(lesenTopic, 200, allowedOrigin);
      }

      /*
       * إشعار مكالمة: كيوصل حتى للناس اللي الموقع مسدود عندهم.
       * كنتحققو من هوية اللي كيعيط، من بعد كنقراو الـ tokens
       * ديال المستقبل وكنصيفطو عبر FCM.
       */
      /*
       * admin.html: كنجيبو جميع الحسابات من Authentication وكنكمّلو
       * users/{uid} اللي ناقصين (بلا وثيقة، ولا بلا email/name).
       * الكليان ماكيقدرش يشوف لائحة Auth — غير حساب الخدمة.
       */
      /* الأدمين كيجرب التذكير: كيوصل غير للأجهزة ديالو هو */
      /* الأدمين كيصيفط إشعار ديالو (تمرين جديد، عرض…) للي فعلو التذكير.
         test: true = غير للأجهزة ديال الأدمين. */
      if (body.adminBroadcast && typeof body.adminBroadcast === "object") {
        if (!env.FIREBASE_SERVICE_ACCOUNT) {
          return jsonResponse({ error: "push_not_configured" }, 500, allowedOrigin);
        }
        const b = body.adminBroadcast;
        const title = String(b.title || "").trim().slice(0, 70);
        const text = String(b.body || "").trim().slice(0, 200);
        let url = String(b.url || "index.html").trim();
        if (!/^[A-Za-z0-9][A-Za-z0-9._\-\/?=&#%]*$/.test(url) || url.includes("//")) url = "index.html";
        if (!title) return jsonResponse({ error: "empty_title" }, 400, allowedOrigin);
        let caller;
        try {
          caller = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse({ error: "not_signed_in", details: authError.message }, 401, allowedOrigin);
        }
        try {
          const accessToken = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
          const me = await readUserFields(caller.sub, accessToken);
          if (!me || me.isAdmin?.booleanValue !== true) {
            return jsonResponse({ error: "not_admin" }, 403, allowedOrigin);
          }
          const tokens = b.test === true
            ? await readPushTokens(caller.sub, accessToken)
            : Array.from(new Set(await listDailySubscribers(accessToken)));
          const msg = { kind: "news", title, body: text, url };
          let sent = 0, gone = 0, failed = 0;
          for (let i = 0; i < tokens.length; i += 25) {
            const rs = await Promise.all(tokens.slice(i, i + 25).map((t) => sendDailyFcm(accessToken, t, msg)));
            for (const r of rs) { if (r === true) sent++; else if (r === "gone") gone++; else failed++; }
          }
          return jsonResponse({ tokens: tokens.length, sent, gone, failed }, 200, allowedOrigin);
        } catch (e) {
          return jsonResponse({ error: "broadcast_failed", details: e.message }, 502, allowedOrigin);
        }
      }

      if (body.adminTestDaily === true) {
        if (!env.FIREBASE_SERVICE_ACCOUNT) {
          return jsonResponse({ error: "push_not_configured" }, 500, allowedOrigin);
        }
        let caller;
        try {
          caller = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse({ error: "not_signed_in", details: authError.message }, 401, allowedOrigin);
        }
        try {
          const accessToken = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
          const me = await readUserFields(caller.sub, accessToken);
          if (!me || me.isAdmin?.booleanValue !== true) {
            return jsonResponse({ error: "not_admin" }, 403, allowedOrigin);
          }
          const tokens = await readPushTokens(caller.sub, accessToken);
          const msg = dailyMessage(new Date());
          const sent = await Promise.all(tokens.slice(0, 10).map((t) => sendDailyFcm(accessToken, t, msg)));
          return jsonResponse({ tokens: tokens.length, sent: sent.filter((x) => x === true).length }, 200, allowedOrigin);
        } catch (e) {
          return jsonResponse({ error: "test_failed", details: e.message }, 502, allowedOrigin);
        }
      }

      /*
       * الأدمين كيعطي كلمة سر مؤقتة لطالب نسا ديالو (admin.html).
       * كلمات السر ما كتتخزنش ف حتى بلاصة — غير المؤقتة كترجع للأدمين
       * مرة وحدة، وكنحطو mustChangePassword: true ف users/{uid} باش
       * الطالب يبدلها بديالو ملي يدخل (site-header.js).
       */
      if (body.adminResetPassword && typeof body.adminResetPassword.uid === "string") {
        if (!env.FIREBASE_SERVICE_ACCOUNT) {
          return jsonResponse({ error: "reset_not_configured",
            details: "FIREBASE_SERVICE_ACCOUNT secret is missing." }, 500, allowedOrigin);
        }
        const target = body.adminResetPassword.uid;
        if (!/^[A-Za-z0-9]{6,128}$/.test(target)) {
          return jsonResponse({ error: "Invalid uid." }, 400, allowedOrigin);
        }
        let caller;
        try {
          caller = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse({ error: "not_signed_in", details: authError.message }, 401, allowedOrigin);
        }
        try {
          const accessToken = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
          const me = await readUserFields(caller.sub, accessToken);
          if (!me || me.isAdmin?.booleanValue !== true) {
            return jsonResponse({ error: "not_admin" }, 403, allowedOrigin);
          }
          /* حساب أدمين آخر (ولا راسو): ما كنبدلوش من هنا */
          const them = await readUserFields(target, accessToken);
          if (target === caller.sub || them?.isAdmin?.booleanValue === true) {
            return jsonResponse({ error: "admin_account" }, 403, allowedOrigin);
          }
          const password = tempPassword();
          const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:update`,
            {
              method: "POST",
              headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
              body: JSON.stringify({ localId: target, password }),
            }
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error("Auth update: " + (data.error?.message || res.status));

          await fetch(
            `${FIRESTORE_DOCS}/users/${target}?updateMask.fieldPaths=mustChangePassword&updateMask.fieldPaths=passwordResetAt`,
            {
              method: "PATCH",
              headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
              body: JSON.stringify({ fields: {
                mustChangePassword: { booleanValue: true },
                passwordResetAt: { timestampValue: new Date().toISOString() },
              } }),
            }
          );
          return jsonResponse({ password, email: data.email || "" }, 200, allowedOrigin);
        } catch (e) {
          return jsonResponse({ error: "reset_failed", details: e.message }, 502, allowedOrigin);
        }
      }

      if (body.adminSyncUsers === true) {
        if (!env.FIREBASE_SERVICE_ACCOUNT) {
          return jsonResponse({ error: "sync_not_configured",
            details: "FIREBASE_SERVICE_ACCOUNT secret is missing." }, 500, allowedOrigin);
        }
        let caller;
        try {
          caller = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse({ error: "not_signed_in", details: authError.message }, 401, allowedOrigin);
        }
        try {
          const accessToken = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
          const me = await readUserFields(caller.sub, accessToken);
          if (!me || me.isAdmin?.booleanValue !== true) {
            return jsonResponse({ error: "not_admin" }, 403, allowedOrigin);
          }
          const result = await syncAuthUsers(accessToken);
          return jsonResponse(result, 200, allowedOrigin);
        } catch (syncError) {
          return jsonResponse({ error: "sync_failed", details: syncError.message }, 502, allowedOrigin);
        }
      }

      if (body.notify && typeof body.notify.toUid === "string") {
        if (!env.FIREBASE_SERVICE_ACCOUNT) {
          return jsonResponse(
            { error: "push_not_configured",
              details: "FIREBASE_SERVICE_ACCOUNT secret is missing." },
            500,
            allowedOrigin
          );
        }

        let caller;
        try {
          caller = await verifyIdToken(body.idToken);
        } catch (authError) {
          return jsonResponse(
            { error: "not_signed_in", details: authError.message },
            401,
            allowedOrigin
          );
        }

        const toUid = body.notify.toUid;
        if (!/^[A-Za-z0-9]{1,128}$/.test(toUid)) {
          return jsonResponse({ error: "Invalid uid." }, 400, allowedOrigin);
        }

        /* ماكنخليوش شي واحد يصيفط إشعار لراسو باش يجرب النظام */
        if (toUid === caller.sub) {
          return jsonResponse({ error: "self_notify" }, 400, allowedOrigin);
        }

        let accessToken;
        try {
          accessToken = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
        } catch (tokenError) {
          return jsonResponse(
            { error: "service_account_failed", details: tokenError.message },
            500,
            allowedOrigin
          );
        }

        let tokens;
        try {
          tokens = await readPushTokens(toUid, accessToken);
        } catch (lookupError) {
          return jsonResponse(
            { error: "token_lookup_failed", details: lookupError.message },
            502,
            allowedOrigin
          );
        }

        if (!tokens.length) {
          return jsonResponse({ sent: 0, reason: "no_tokens" }, 200, allowedOrigin);
        }

        const data = {
          kind: "call",
          fromName: String(body.notify.fromName || "").slice(0, 60),
          callType: body.notify.callType === "video" ? "video" : "audio",
          url: "chat.html",
        };

        const results = await Promise.all(
          tokens.slice(0, 10).map((token) => sendFcm(accessToken, token, data))
        );

        return jsonResponse(
          { sent: results.filter(Boolean).length, tried: results.length },
          200,
          allowedOrigin
        );
      }

      /* ترجمة الـ Anzeige والمهام للدارجة. ماشي محتاجة حساب. */
      if (body.translate && typeof body.translate.text === "string") {
        if (!env.GEMINI_API_KEY) {
          return jsonResponse(
            { error: "GEMINI_API_KEY is not configured." },
            500,
            allowedOrigin
          );
        }

        const sourceText = body.translate.text.trim().slice(0, 4000);

        if (sourceText.length < 2) {
          return jsonResponse(
            { error: "Nothing to translate." },
            400,
            allowedOrigin
          );
        }

        /* نفس النص (Anzeige ولا المهام) كيترجم مرة وحدة للجميع:
           الترجمة كتتحفظ ف كاش Cloudflare 30 يوم، والمرة الجاية كترجع دغيا. */
        const cacheKey = await translationCacheKey(sourceText);
        const cached = await cacheGet(cacheKey);
        if (cached) {
          return jsonResponse({ translation: cached, cached: true }, 200, allowedOrigin);
        }

        const translatePayload = {
          systemInstruction: {
            parts: [
              {
                text:
                  "ترجم النص الألماني للدارجة المغربية بالحروف العربية.\n" +
                  "- ترجمة مفهومة لطالب مغربي كيتعلم الألمانية، ماشي حرفية.\n" +
                  "- خلي الأرقام، الأسماء، العناوين والأثمنة كيف ما هوما.\n" +
                  "- حافظ على نفس تقسيم الأسطر والنقط.\n" +
                  "- رد غير بالترجمة، بلا شرح وبلا مقدمة.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: sourceText }] }],
          generationConfig: {
            temperature: 0.3,
            // الترجمة ماكتحتاجش التفكير: كيجاوب دغيا بزاف
            thinkingConfig: { thinkingLevel: "minimal" },
          },
        };

        const translateResult = await callGeminiWithRetry(
          [env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL].concat(FALLBACK_MODELS),
          translatePayload,
          env.GEMINI_API_KEY
        );

        if (!translateResult.response.ok) {
          return jsonResponse(
            {
              error: "Translation failed.",
              details:
                translateResult.data?.error?.message ||
                "Unknown Gemini API error.",
            },
            502,
            allowedOrigin
          );
        }

        const translation =
          translateResult.data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("")
            .trim();

        if (!translation) {
          return jsonResponse(
            { error: "Gemini returned an empty translation." },
            502,
            allowedOrigin
          );
        }

        await cachePut(cacheKey, translation);
        return jsonResponse({ translation }, 200, allowedOrigin);
      }

      const {
        level,
        taskType,
        situation,
        ad,
        points,
        words,
        studentText,
      } = body;

      // Basic validation
      if (!studentText || studentText.trim().length < 10) {
        return jsonResponse(
          { error: "Student text is too short." },
          400,
          allowedOrigin
        );
      }

      if (!env.GEMINI_API_KEY) {
        return jsonResponse(
          { error: "GEMINI_API_KEY is not configured." },
          500,
          allowedOrigin
        );
      }

      // Limit input size
      const safeStudentText = studentText
        .trim()
        .slice(0, 4000);

      const safeSituation = String(situation || "")
        .slice(0, 2000);

      const safeAd = String(ad || "")
        .slice(0, 2000);

      const safePoints = Array.isArray(points)
        ? points.slice(0, 8)
        : [];

      /* عدد الكلمات كنحسبوه حنا (دقيق)، وكنعطيوه لـ Gemini */
      const wordCount = (safeStudentText.match(/[A-Za-zÄÖÜäöüß0-9]+(?:[-'][A-Za-zÄÖÜäöüß0-9]+)*/g) || []).length;
      const wordsHint = String(words || "").slice(0, 40);
      const minWords = parseInt((wordsHint.match(/\d+/) || [0])[0], 10) || 0;

      /* النقطة كتتحسب بحال telc: 3 معايير، كل واحد A/B/C/D
         (A=5، B=3، C=1، D=0) × 3 = من 0 حتى 45.
         Gemini كيعطي غير الحروف + السبب، والحساب كيديرو الـ Worker
         — هكا نفس النص كياخد ديما نفس النقطة تقريبا. */
      const systemPrompt = `
Du bist ein erfahrener, strenger aber fairer telc-Prüfer für den
Schriftlichen Ausdruck auf Niveau ${level || "B2"}.

Bewerte den Text mit dem offiziellen telc-Raster. Vergib für jedes der
drei Kriterien genau eine Stufe A, B, C oder D:

I. Aufgabenbewältigung (Inhalt)
  A = alle Leitpunkte angemessen und ausführlich behandelt, Textsorte erfüllt
  B = alle Leitpunkte behandelt, aber einer nur knapp; oder drei Leitpunkte angemessen
  C = nur zwei Leitpunkte behandelt, oder mehrere nur sehr knapp
  D = höchstens ein Leitpunkt behandelt oder Thema verfehlt

II. Kommunikative Gestaltung
  A = passende Anrede und Gruß, klarer Aufbau, gute Verbindungen (weil, deshalb, außerdem …),
      Register dem Empfänger angemessen, Wortschatz dem Niveau entsprechend
  B = im Großen und Ganzen angemessen, kleinere Schwächen im Aufbau oder Register
  C = deutliche Schwächen: kaum Verbindungen, Register unpassend, Wiederholungen
  D = kein zusammenhängender Text / nicht verständlich

III. Formale Richtigkeit (Grammatik, Wortschatz, Rechtschreibung)
  A = keine oder nur vereinzelte Fehler, die das Verständnis nicht stören
  B = einige Fehler, das Verständnis wird kaum beeinträchtigt
  C = viele Fehler, das Verständnis wird stellenweise beeinträchtigt
  D = so viele Fehler, dass der Text kaum verständlich ist

Regeln:
- Bewerte NUR den tatsächlich geschriebenen Text. Erfinde nichts.
- Prüfe jeden Leitpunkt einzeln: "ja" (angemessen), "teilweise" (zu knapp), "nein" (fehlt).
- Die Wortanzahl ist vorgegeben (vom System gezählt). Ist der Text deutlich
  zu kurz (unter der Hälfte des erwarteten Umfangs), kann Kriterium I höchstens C sein.
- Sei konsistent: derselbe Text muss immer dieselben Stufen bekommen.
- summary, strengths, improvements und alle "reason"-Felder auf Marokkanischem
  Darija (arabische Schrift), kurz und konkret, mit Beispielen aus dem Text.
- improvements: die wichtigsten Fehler mit Korrektur, z. B. «ich habe gegangen» ← «ich bin gegangen».
- corrected_text: verbesserte, natürliche deutsche Version des Textes, gleiche
  Aussage und Absicht, gleiches Niveau. Vollständig auf Deutsch.
- Gib ausschließlich JSON gemäß Schema zurück.
`;

      const userPrompt = `
Prüfungsniveau: ${level || "B2"}
Aufgabentyp: ${taskType || "Schreiben"}

Situation:
${safeSituation}

Anzeige / Kontext:
${safeAd}

Leitpunkte (in dieser Reihenfolge prüfen):
${safePoints.map((p, i) => (i + 1) + ". " + p).join("\n")}
${wordsHint ? `Erwarteter Umfang: ${wordsHint} Wörter` : ""}
Gezählte Wörter im Text des Studenten: ${wordCount}

Text des Studenten:
${safeStudentText}
`;

      const GRADE = { type: "STRING", enum: ["A", "B", "C", "D"] };
      const CRIT = {
        type: "OBJECT",
        properties: { grade: GRADE, reason: { type: "STRING" } },
        required: ["grade", "reason"],
      };

      // Gemini REST API
      const requestPayload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            // 0 = نفس النص كياخد نفس التقييم
            temperature: 0,
            // تفكير قليل: أسرع بزاف، والجودة كتبقى مزيانة
            thinkingConfig: { thinkingLevel: "low" },
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                inhalt: CRIT,
                kommunikation: CRIT,
                form: CRIT,
                leitpunkte: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      punkt: { type: "STRING" },
                      status: { type: "STRING", enum: ["ja", "teilweise", "nein"] },
                    },
                    required: ["punkt", "status"],
                  },
                },
                summary: { type: "STRING" },
                strengths: { type: "ARRAY", items: { type: "STRING" } },
                improvements: { type: "ARRAY", items: { type: "STRING" } },
                corrected_text: { type: "STRING" },
              },
              required: ["inhalt", "kommunikation", "form", "leitpunkte",
                         "summary", "strengths", "improvements", "corrected_text"],
            },
          },
        };

      const primaryModel = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

      // ديما كنبداو بالموديل الأساسي، ومن بعد الاحتياطيين إلا كان معمّر.
      const candidates = [primaryModel].concat(
        FALLBACK_MODELS.filter((m) => m !== primaryModel)
      );

      const { response: geminiResponse, data: geminiData } =
        await callGeminiWithRetry(
          candidates,
          requestPayload,
          env.GEMINI_API_KEY
        );

      if (!geminiResponse.ok) {
        console.error("Gemini API error:", geminiData);

        return jsonResponse(
          {
            error: "Gemini API request failed.",
            details:
              (geminiData?.error?.message ||
                "Unknown Gemini API error.") +
              " (Gemini HTTP " + geminiResponse.status + ")",
            retryable:
              geminiResponse.status === 503 || geminiResponse.status === 429,
          },
          502,
          allowedOrigin
        );
      }

      // Extract Gemini generated text
      const generatedText =
        geminiData?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

      if (!generatedText) {
        console.error("Empty Gemini response:", geminiData);

        return jsonResponse(
          { error: "Gemini returned an empty response." },
          502,
          allowedOrigin
        );
      }

      let result;

      try {
        result = JSON.parse(generatedText);
      } catch (parseError) {
        console.error(
          "Failed to parse Gemini JSON:",
          generatedText
        );

        return jsonResponse(
          {
            error: "Gemini returned invalid JSON.",
          },
          502,
          allowedOrigin
        );
      }

      // النقطة: كنحسبوها من الحروف (A=5، B=3، C=1، D=0) × 3
      const PTS = { A: 5, B: 3, C: 1, D: 0 };
      const crit = {};
      for (const k of ["inhalt", "kommunikation", "form"]) {
        const g = String(result?.[k]?.grade || "").toUpperCase();
        crit[k] = {
          grade: PTS[g] !== undefined ? g : "D",
          points: (PTS[g] || 0) * 3,
          reason: String(result?.[k]?.reason || ""),
        };
      }
      let score = crit.inhalt.points + crit.kommunikation.points + crit.form.points;

      /* موديل قديم رجع score مباشرة؟ كنقبلوه (0–45) */
      if (!result?.inhalt && Number.isFinite(Number(result?.score))) {
        score = Math.max(0, Math.min(45, Math.round(Number(result.score))));
      }

      const finalResult = {
        score,
        criteria: crit,
        leitpunkte: Array.isArray(result.leitpunkte)
          ? result.leitpunkte.slice(0, 8).map((x) => ({
              punkt: String(x?.punkt || ""),
              status: ["ja", "teilweise", "nein"].includes(x?.status) ? x.status : "nein",
            }))
          : [],
        word_count: wordCount,
        min_words: minWords,
        summary: String(result.summary || ""),
        strengths: Array.isArray(result.strengths)
          ? result.strengths.map(String)
          : [],
        improvements: Array.isArray(result.improvements)
          ? result.improvements.map(String)
          : [],
        corrected_text: String(result.corrected_text || ""),
      };

      return jsonResponse(
        finalResult,
        200,
        allowedOrigin
      );

    } catch (error) {
      console.error("Worker error:", error);

      /* JSON مكسور ف KV: كنقولو شمن مفتاح (الأدمين كيشوفو ف «مشاكل الطلبة») */
      if (String(error && error.message).startsWith("bad_json ")) {
        return jsonResponse(
          { error: "bad_json", details: String(error.message).slice(9, 300) },
          500,
          allowedOrigin
        );
      }

      return jsonResponse(
        {
          error: "Internal server error.",
        },
        500,
        allowedOrigin
      );
    }
  },
};


function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    /* الجواب كيتبدل حسب الـOrigin ديال الطلب. بلا Vary، شي كاش
       فالطريق كيقدر يعطي جواب محفوظ لدومين آخر — والمتصفح
       كيرفضو. */
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    /* المتصفح يحفظ الـpreflight (Chrome حتى ساعتين). بلاها، كل طلب
       JSON كيدير طلب OPTIONS قبل. */
    "Access-Control-Max-Age": "7200",
    "Content-Type": "application/json; charset=utf-8",
  };
}


function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}


/*
 * 503 = الموديل معمّر، و 429 = تجاوزنا المعدل. بجوج مؤقتين،
 * علا هاكدا كنعاودو المحاولة قبل ما نيأسو، ومن بعد كنجربو موديل احتياطي.
 */
/* flash-latest غالبا هو نفس الموديل الأساسي، ف إلا كان معمّر كيكون معمّر
   حتى هو. lite عندو ضغط قليل، ف كنخليوه آخر احتياط باش التصحيح ديما يخرج. */
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

// جوج محاولات فقط لكل موديل: إلا كان معمّر، الأحسن ندوزو للموديل الجاي بسرعة.
const MAX_ATTEMPTS_PER_MODEL = 2;

function isTransient(status) {
  return status === 503 || status === 429 || status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(models, payload, apiKey) {
  let last = null;

  for (const model of models) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) return { response, data };

      /* شي موديلات ماكيعرفوش thinkingLevel (ولا "minimal"):
         كنحيدوه وكنعاودو فنفس الموديل، بلا ما نحسبوها محاولة. */
      if (response.status === 400 && payload.generationConfig?.thinkingConfig
          && /thinking/i.test(JSON.stringify(data))) {
        payload = { ...payload, generationConfig: { ...payload.generationConfig } };
        delete payload.generationConfig.thinkingConfig;
        attempt--;
        continue;
      }

      /* موديل ماكاينش (404) ما يمسحش الخطأ المفيد ديال موديل قبلو. */
      if (!last || response.status !== 404) last = { response, data };

      // خطأ دائم (مفتاح خايب، موديل ماكاينش): ما كاين علاش نعاودو.
      if (!isTransient(response.status)) break;

      console.error(
        `Gemini ${model} attempt ${attempt} failed with ${response.status}`
      );

      // 1s بين المحاولتين — الـ Worker عندو حدود ديال الوقت، ف ما نطولوش.
      if (attempt < MAX_ATTEMPTS_PER_MODEL) await sleep(attempt * 1000);
    }
  }

  return last;
}

/* ================= كاش الترجمة =================
 * Cloudflare Cache API (مجاني). كل ترجمة كتتحفظ 30 يوم بمفتاح
 * SHA-256 ديال النص. إلا ماكانش الكاش (مثلا فالتجارب)، كنكملو عادي.
 */
async function translationCacheKey(text) {
  const bytes = new TextEncoder().encode("v1|" + text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return "https://translate-cache.sehrgut.invalid/" + hex;
}

async function cacheGet(key) {
  try {
    if (typeof caches === "undefined") return null;
    const hit = await caches.default.match(key);
    return hit ? await hit.text() : null;
  } catch (e) {
    return null;
  }
}

async function cachePut(key, value) {
  try {
    if (typeof caches === "undefined") return;
    await caches.default.put(key, new Response(value, {
      headers: { "Cache-Control": "public, max-age=2592000", "Content-Type": "text/plain; charset=utf-8" },
    }));
  } catch (e) { /* الكاش اختياري */ }
}

/* ================= Firebase auth =================
 * الـ Worker ما كيثقش فالمتصفح: كيتحقق من توقيع الـ ID token
 * بالمفاتيح العمومية ديال Google، ومن بعد كيقرا الاشتراك من Firestore.
 */

const FIREBASE_PROJECT_ID = "sehrgothe";

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let jwksCache = { keys: null, expiresAt: 0 };

async function getSigningKeys() {
  if (jwksCache.keys && Date.now() < jwksCache.expiresAt) return jwksCache.keys;

  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) throw new Error("Could not fetch Google signing keys.");

  const data = await res.json();

  // Google كيقول شحال يعيش الكاش؛ كنحترموه بدل ما نخمنو.
  const maxAge = (res.headers.get("cache-control") || "").match(/max-age=(\d+)/);
  const ttl = maxAge ? Number(maxAge[1]) * 1000 : 3600 * 1000;

  jwksCache = { keys: data.keys, expiresAt: Date.now() + ttl };
  return data.keys;
}

function base64UrlToBytes(value) {
  let text = value.replace(/-/g, "+").replace(/_/g, "/");
  while (text.length % 4) text += "=";

  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeSegment(segment) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

async function verifyIdToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Malformed token.");

  const header = decodeSegment(parts[0]);
  const claims = decodeSegment(parts[1]);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unexpected token algorithm.");
  }

  if (claims.aud !== FIREBASE_PROJECT_ID) throw new Error("Token audience mismatch.");
  if (claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    throw new Error("Token issuer mismatch.");
  }
  if (!claims.sub) throw new Error("Token has no subject.");
  if (claims.exp <= Math.floor(Date.now() / 1000)) throw new Error("Token expired.");

  const keys = await getSigningKeys();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("Unknown signing key.");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(parts[2]),
    new TextEncoder().encode(parts[0] + "." + parts[1])
  );

  if (!valid) throw new Error("Invalid token signature.");

  return claims;
}

/* ===== ذاكرة قصيرة =====

   كل طلب ديال محتوى مدفوع كان كيدير طلب لـFirestore باش يعرف واش الحساب
   مشترك — نفس الجواب ف كل مرة. كنحفظوه ف ذاكرة الـisolate: 10 دقايق
   للمشترك (المواضيع كتتجاب من قبل بالعشرات، وكل قراءة Firestore = ~0.3 ث)،
   15 ثانية لغير المشترك (باش اللي دفع للتو ما يتسناش). إلا الأدمين وقف
   اشتراك، كيوقف ف ظرف 10 دقايق. الأخطاء ما كنحفظوهاش. */
const SUB_MEMO = new Map();
const SUB_TTL_YES = 10 * 60 * 1000;
const SUB_TTL_NO = 15 * 1000;

/* الـKV: نفس الشي. وثيقة كبيرة (premium-lesen كتفوت 900 KB) كانت كتتقرا
   وكتتحلل (JSON.parse) ف كل طلب. دابا كتتحلل مرة ف الدقيقة، وكنطلبو من
   الـKV أن يحتفظ بيها 5 دقايق ف الحافة (cacheTtl). تبديل المحتوى ف KV
   كيبان ف ظرف 5 دقايق. */
const KV_MEMO = new Map();
const KV_MEMO_TTL = 60 * 1000;
const KV_EDGE_TTL = 300;

/* طلبين ف نفس اللحظة لنفس الشي (الكليان كيطلب جوج مفاتيح بالتوازي)
   كيتقاسمو نفس القراءة، ماشي كل واحد يقرا بوحدو. */
const KV_PENDING = new Map();
const SUB_PENDING = new Map();

function kvJson(env, key) {
  const hit = KV_MEMO.get(key);
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.value);

  const running = KV_PENDING.get(key);
  if (running) return running;

  const pending = (async () => {
    /* نص ونحللوه حنا: JSON مكسور ف KV (فاصلة ناقصة…) كان كيطيح الطلب
       بـ "Internal server error" بلا ما نعرفو شمن مفتاح. دابا الخطأ كيقول
       المفتاح باش يتصلح ف KV. */
    const raw = await env.TOPICS.get(key, { type: "text", cacheTtl: KV_EDGE_TTL });
    let value = null;
    if (raw != null) {
      try {
        value = JSON.parse(raw);
      } catch (parseError) {
        throw new Error("bad_json " + key + ": " + parseError.message);
      }
    }

    /* الغايب ما كنحفظوهش: الموضوع الجديد خاصو يبان دغيا */
    if (value != null) {
      if (KV_MEMO.size >= 80) KV_MEMO.delete(KV_MEMO.keys().next().value);
      KV_MEMO.set(key, { value, exp: Date.now() + KV_MEMO_TTL });
    }
    return value;
  })().finally(() => KV_PENDING.delete(key));

  KV_PENDING.set(key, pending);
  return pending;
}

function hasActiveSubscription(uid, idToken) {
  const memo = SUB_MEMO.get(uid);
  if (memo && memo.exp > Date.now()) return Promise.resolve(memo.ok);

  const running = SUB_PENDING.get(uid);
  if (running) return running;

  const pending = (async () => {
    const ok = await lookupSubscription(uid, idToken);

    if (SUB_MEMO.size >= 500) SUB_MEMO.delete(SUB_MEMO.keys().next().value);
    SUB_MEMO.set(uid, { ok, exp: Date.now() + (ok ? SUB_TTL_YES : SUB_TTL_NO) });
    return ok;
  })().finally(() => SUB_PENDING.delete(uid));

  SUB_PENDING.set(uid, pending);
  return pending;
}

/* ===== البلاد: المغرب بالاشتراك، الباقي مجاني مع الإعلانات =====

   المغرب: Premium بالفلوس عبر WhatsApp (بحال قبل).
   أي بلاد أخرى: المحتوى كامل مجاني، والصفحات كيبينو إعلانات.

   الـVPN كيبدل غير الـIP. إذن ما كنعتامدوش عليه بوحدو — كنجمعو
   علامات بزاف، وإلا وحدة منهم قالت «المغرب» → الحساب مغربي:
     1. البلاد ديال الـIP (Cloudflare: request.cf.country)
     2. المنطقة الزمنية ديال الجهاز (Africa/Casablanca) — الـVPN ما كيبدلهاش
     3. الرقم ديال التيليفون (+212) اللي تعطى ف التسجيل
     4. لغة المتصفح (ar-MA, fr-MA…) من الطلب ومن الجهاز
     5. الجهاز سبق ليه تعرّف بلي مغربي (حساب آخر ف نفس المتصفح)

   «المغرب» كيتقفل: ملي الحساب ولا MA ما كيرجعش. حساب تسجل بالـVPN
   كيولي MA أول ما يتحل بلا VPN، ولا أول ما الجهاز يبين المنطقة ديالو.
   باش ترجع حساب (مثلا واحد سافر للمغرب): مسح region-<uid> من KV. */

const MA_TIMEZONES = ["Africa/Casablanca", "Africa/El_Aaiun"];
/* XX = ما معروفش، T1 = Tor. بجوج ماشي مجانيين. */
const UNKNOWN_REGIONS = ["", "??", "XX", "T1"];
const REGION_MEMO = new Map();
const REGION_MEMO_TTL = 60 * 1000;

function regionStore(env) {
  return env.REGIONS || env.TOPICS || null;
}

function regionIsFree(region) {
  return /^[A-Z]{2}$/.test(region || "") && region !== "MA" && !UNKNOWN_REGIONS.includes(region);
}

function moroccoSignals(request, hint) {
  const why = [];
  const cf = request.cf || {};
  if (cf.country === "MA") why.push("ip");
  if (MA_TIMEZONES.includes(cf.timezone)) why.push("ip-tz");

  const header = request.headers.get("Accept-Language") || "";
  if (/(^|[,\s])[a-z]{2,3}-MA\b/i.test(header)) why.push("accept-language");

  if (hint && typeof hint === "object") {
    if (MA_TIMEZONES.includes(String(hint.tz || ""))) why.push("device-tz");
    const langs = Array.isArray(hint.langs) ? hint.langs.slice(0, 10) : [];
    if (langs.some((l) => /^[a-z]{2,3}-MA$/i.test(String(l)))) why.push("device-lang");
    const phone = String(hint.phone || "").replace(/[^\d+]/g, "");
    if (/^(\+|00)212/.test(phone)) why.push("phone");
    if (hint.seen === true) why.push("device-seen");
  }
  return why;
}

async function resolveRegion(env, request, uid, hint) {
  const store = regionStore(env);
  const key = "region-" + uid;

  const memo = REGION_MEMO.get(uid);
  let stored = memo && memo.exp > Date.now()
    ? memo.value
    : ((await store.get(key)) || "");

  let next = stored;
  if (stored !== "MA") {
    if (moroccoSignals(request, hint).length) {
      next = "MA";
    } else if (!stored || UNKNOWN_REGIONS.includes(stored)) {
      next = String((request.cf && request.cf.country) || "XX").toUpperCase();
    }
  }

  if (next !== stored) await store.put(key, next);

  if (REGION_MEMO.size >= 500) REGION_MEMO.delete(REGION_MEMO.keys().next().value);
  REGION_MEMO.set(uid, { value: next, exp: Date.now() + REGION_MEMO_TTL });
  return next;
}

/* المحتوى المدفوع: بلاد مجانية، ولا اشتراك. */
async function hasAccess(env, request, uid, idToken) {
  if (regionStore(env)) {
    const region = await resolveRegion(env, request, uid, null);
    if (regionIsFree(region)) return true;
  }
  return hasActiveSubscription(uid, idToken);
}

async function lookupSubscription(uid, idToken) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/users/${uid}`;

  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + idToken },
  });

  // ما كاينش وثيقة = ما كاينش اشتراك، ماشي خطأ.
  if (res.status === 404) return false;
  if (!res.ok) throw new Error("Could not read the subscription record.");

  const fields = (await res.json()).fields || {};

  if (fields.subscriptionActive?.booleanValue !== true) return false;

  const end = fields.subscriptionEnd?.timestampValue;
  if (end && new Date(end).getTime() <= Date.now()) return false;

  return true;
}


/* =====================================================
   FCM — إرسال إشعار المكالمة
   ===================================================== */

/*
 * كنقراو الـ tokens بحساب الخدمة، ماشي بالـ token ديال اللي
 * كيعيط. علاش: القاعدة ديال users كتخلي أي واحد مسجل يقرا
 * وثيقة أي واحد آخر (الشات محتاج الأسماء والصور). لو حطينا
 * الـ tokens تما، كل طالب يقدر يقرا tokens ديال الآخرين.
 * إذن كنخبيوهم ف users/{uid}/private/push — حتى شي كليان
 * ماكيقدر يقراها، وحساب الخدمة كيعدا فوق القواعد.
 */
async function readPushTokens(uid, accessToken) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/users/${uid}/private/push`;

  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + accessToken },
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Could not read the push tokens.");

  const fields = (await res.json()).fields || {};
  const map = fields.tokens?.mapValue?.fields || {};

  return Object.keys(map);
}


/* =====================================================
   Admin — مزامنة Authentication مع users/{uid}
   ===================================================== */

const FIRESTORE_DOCS =
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
  `/databases/(default)/documents`;

async function readUserFields(uid, accessToken) {
  const res = await fetch(`${FIRESTORE_DOCS}/users/${uid}`, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not read users/" + uid);
  return (await res.json()).fields || {};
}

async function listAuthUsers(accessToken) {
  const all = [];
  let page = "";
  do {
    const url =
      `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
      `/accounts:batchGet?maxResults=500` + (page ? "&nextPageToken=" + encodeURIComponent(page) : "");
    const res = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
    const data = await res.json();
    if (!res.ok) throw new Error("Auth list: " + (data.error?.message || res.status));
    all.push(...(data.users || []));
    page = data.nextPageToken || "";
  } while (page && all.length < 5000);
  return all;
}

async function listUserDocs(accessToken) {
  const docs = new Map();
  let page = "";
  do {
    const url = `${FIRESTORE_DOCS}/users?pageSize=300` +
      "&mask.fieldPaths=email&mask.fieldPaths=name&mask.fieldPaths=displayName" +
      "&mask.fieldPaths=createdAt&mask.fieldPaths=plan" +
      (page ? "&pageToken=" + encodeURIComponent(page) : "");
    const res = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
    const data = await res.json();
    if (!res.ok) throw new Error("Firestore list: " + (data.error?.message || res.status));
    for (const d of data.documents || []) docs.set(d.name.split("/").pop(), d.fields || {});
    page = data.nextPageToken || "";
  } while (page);
  return docs;
}

/* كلمة سر مؤقتة ساهلة تتقرا وتتكتب ف WhatsApp: Deutsch-4821-km */
function tempPassword() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const digits = Array.from(bytes.slice(0, 4), (b) => b % 10).join("");
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const tail = Array.from(bytes.slice(4), (b) => letters[b % letters.length]).join("");
  return "Deutsch-" + digits + "-" + tail;
}

async function syncAuthUsers(accessToken) {
  const [authUsers, docs] = await Promise.all([
    listAuthUsers(accessToken),
    listUserDocs(accessToken),
  ]);

  const writes = [];
  for (const u of authUsers) {
    const old = docs.get(u.localId);
    const email = u.email || "";
    const name =
      old?.displayName?.stringValue || u.displayName || email.split("@")[0] || "User";
    const born = u.createdAt ? new Date(Number(u.createdAt)).toISOString() : new Date().toISOString();

    const fields = {};
    if (!old?.email?.stringValue && email) fields.email = { stringValue: email };
    if (!old?.name?.stringValue) fields.name = { stringValue: name };
    if (!old?.createdAt) fields.createdAt = { timestampValue: born };
    /* وثيقة ما كايناش (ولا خاوية): الحساب مجاني. ماكنمسّوش الاشتراك إلا كان. */
    if (!old) {
      fields.plan = { stringValue: "free" };
      fields.subscriptionActive = { booleanValue: false };
      fields.subscriptionEnd = { nullValue: null };
    }
    if (!Object.keys(fields).length) continue;

    writes.push({
      update: {
        name: `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${u.localId}`,
        fields,
      },
      updateMask: { fieldPaths: Object.keys(fields) },
    });
  }

  for (let i = 0; i < writes.length; i += 400) {
    const res = await fetch(`${FIRESTORE_DOCS}:commit`, {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ writes: writes.slice(i, i + 400) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error("Firestore commit: " + (data.error?.message || res.status));
    }
  }

  return {
    authCount: authUsers.length,
    docCount: docs.size,
    fixed: writes.length,
  };
}


/* =====================================================
   التذكير اليومي (scheduled)
   ===================================================== */

const DAILY_MESSAGES = [
  ["🔥 حافظ على السلسلة ديالك", "10 دقايق اليوم كافيين. دير تمرين واحد وسالي النهار مرتاح."],
  ["📚 5 كلمات جداد كيتسناوك", "Wortschatz ديال اليوم واجد. الكلمات هوما المفتاح ديال Lesen و Hören."],
  ["🎧 تمرين Hören صغير؟", "تيما وحدة Richtig/Falsch مع الترجمة — 5 دقايق وبان الفرق."],
  ["✍️ رسالة وحدة اليوم", "كتب Schreiben وخد التصحيح: كل غلطة كتعرفها اليوم ما كتعاودهاش ف الامتحان."],
  ["📖 Lesen Teil 1 كيتسناك", "النصوص والعناوين — والكلمات المفتاحية كيبينو ليك الحل."],
  ["🗣 تمرن على Sprechen", "ختار موضوع وهضر دقيقتين بالألمانية. الثقة كتجي بالتكرار."],
  ["⏱ واش واجد للامتحان؟", "دوز جزء من Modelltest بالوقت وشوف فين وصلتي."],
  ["🧩 Sprachbausteine", "10 فراغات = 10 دقايق. القواعد كتولي ساهلة بالتمرين."],
  ["💪 نتا أقرب مما كتظن", "كل تمرين كيقربك من Bestanden. يلاه نكملو اليوم."],
  ["🌙 قبل ما تنعس…", "مراجعة قصيرة ديال الكلمات كتثبتهم ف الذاكرة. 5 دقايق برك."],
  ["🎯 هدف اليوم", "تمرين واحد ف الجزء اللي ضعيف فيه. هادا هو السر ديال النجاح."],
  ["🇩🇪 Guten Abend!", "Hast du heute schon geübt? — واش تمرنتي اليوم؟ يلاه، 10 دقايق."],
  ["📈 شوف التقدم ديالك", "دخل لـ «التقدم ديالي» وشوف شحال تحسنتي هاد السيمانة."],
  ["🏁 الامتحان كيقرب", "اللي كيتمرن كل نهار كيدخل الامتحان مرتاح. دير الحصة ديالك دابا."],
];

function dailyMessage(now) {
  const day = Math.floor(now.getTime() / 86400000);
  const [title, body] = DAILY_MESSAGES[day % DAILY_MESSAGES.length];
  return { kind: "daily", title, body, url: "index.html" };
}

async function sendDailyFcm(accessToken, token, data) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          data,
          webpush: { headers: { Urgency: "normal", TTL: String(6 * 3600) } },
        },
      }),
    }
  );
  if (res.ok) return true;
  /* الجهاز تمسح ولا لغا الإشعارات */
  if (res.status === 404 || res.status === 410) return "gone";
  return false;
}

/* reminders/{uid} = { tokens: {token: true}, on: true } — كيكتبها
   assets/push-register.js ملي يضغط «فكرني كل نهار». */
async function listDailySubscribers(accessToken) {
  const out = [];
  let page = "";
  do {
    const url = `${FIRESTORE_DOCS}/reminders?pageSize=300&mask.fieldPaths=tokens&mask.fieldPaths=on` +
      (page ? "&pageToken=" + encodeURIComponent(page) : "");
    const res = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
    const data = await res.json();
    if (!res.ok) throw new Error("reminders list: " + (data?.error?.message || res.status));
    for (const d of data.documents || []) {
      if (d.fields?.on?.booleanValue !== true) continue;
      for (const t of Object.keys(d.fields?.tokens?.mapValue?.fields || {})) out.push(t);
    }
    page = data.nextPageToken || "";
  } while (page && out.length < 20000);
  return out;
}

async function sendDailyReminders(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return { skipped: "no service account" };
  const accessToken = await getGoogleAccessToken(env.FIREBASE_SERVICE_ACCOUNT);
  const tokens = Array.from(new Set(await listDailySubscribers(accessToken)));
  const msg = dailyMessage(new Date());
  let sent = 0, gone = 0, failed = 0;
  for (let i = 0; i < tokens.length; i += 25) {
    const results = await Promise.all(tokens.slice(i, i + 25).map((t) => sendDailyFcm(accessToken, t, msg)));
    for (const r of results) { if (r === true) sent++; else if (r === "gone") gone++; else failed++; }
  }
  return { tokens: tokens.length, sent, gone, failed };
}

/* توقيع JWT بالمفتاح ديال service account، وتبديلو بـ access token.
   نفس المنطق ديال verifyIdToken ولكن بالمقلوب: هنا كنوقعو. */
async function getGoogleAccessToken(serviceAccountJson) {
  const account =
    typeof serviceAccountJson === "string"
      ? JSON.parse(serviceAccountJson)
      : serviceAccountJson;

  if (!account.client_email || !account.private_key) {
    throw new Error("The service account JSON is missing client_email or private_key.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: account.client_email,
    scope:
      "https://www.googleapis.com/auth/firebase.messaging" +
      " https://www.googleapis.com/auth/datastore" +
      " https://www.googleapis.com/auth/identitytoolkit",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsigned = `${encode(header)}.${encode(claims)}`;

  const pem = account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  const signed =
    unsigned +
    "." +
    btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + signed,
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || "Could not mint an access token.");
  }

  return data.access_token;
}

async function sendFcm(accessToken, token, data) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          /* data فقط، بلا notification: باش الـ service worker
             هو اللي يبني الإشعار ويزيد الهزاز والإلحاح. */
          data,
          webpush: {
            headers: { Urgency: "high", TTL: "60" },
          },
          android: { priority: "high" },
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    console.log("FCM send failed:", res.status, detail.slice(0, 200));
    return false;
  }

  return true;
}
