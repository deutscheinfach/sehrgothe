/* ===== حساب واحد = جهاز واحد =====

   ملي كيدخل شي واحد بالحساب ديالو، كنكتبو sessionId جديد ف
   users/{uid}. كل جهاز آخر واقف فنفس الحساب كيشوف التبديل
   مباشرة (onSnapshot) وكيخرج بوحدو.

   هاد الملف كيتزاد ف كل الصفحات المحمية.

   ---------------------------------------------------------
   جوج تصليحات مهمين:

   1) نفس المتصفح ما كيطردش راسو.
      login.html كيكتب deviceId حدا sessionId. إلا كان الـ
      deviceId اللي ف Firestore هو ديالنا، راه نفس الجهاز —
      غير تبويب آخر دخل من جديد. فهاد الحالة كنحدثو الـ
      sessionId المحلي وكنكملو، ماكنخرجوش.

      قبل، كنا كنقارنو غير sessionId: تدخل من جديد ف تبويب،
      وكل التبويبات الأخرى ديال نفس المتصفح كيتطردو.

   2) الخروج ماكيبقاش بلا تفسير.
      قبل كان alert() من بعد signOut(). ولكن signOut كيوقظ
      onAuthStateChanged ديال الصفحة (صفحة فيها حارس الدخول مثلا) اللي
      كيدير location.href="login.html" دغيا — إذن التنقل
      كيسبق الـ alert والمستخدم كيلقى راسو ف صفحة الدخول
      بلا ما يفهم علاش.

      دابا: كنسجلو السبب ف sessionStorage قبل signOut،
      وكنرفعو window.__deSessionKick باش الصفحة تخليه
      ليا، وlogin.html هي اللي كتبين الرسالة.

   ملاحظة: إلا ماكانش sessionId محلي (مستخدم دخل قبل ما
   نزيدو هاد الخاصية، ولا التخزين مسدود)، ماكنخرجوش حتى واحد —
   ماعندناش باش نتأكدو، والخروج بلا سبب أسوأ. */

(function () {
    "use strict";

    var SESSION_KEY = "sehrgutSessionId";
    var DEVICE_KEY = "sehrgutDeviceId";
    var KICK_KEY = "sehrgutKicked";
    var LOGIN_PAGE = "login.html";

    /* الصفحات اللي خاصها تبقى بلا حارس: الدخول والتسجيل. */
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (page === "login.html" || page === "signup.html" || page === "forgot-password.html") {
        return;
    }

    function read(key) {
        try { return localStorage.getItem(key); }
        catch (error) { return null; }
    }
    function write(key, value) {
        try { localStorage.setItem(key, value); }
        catch (error) { /* التصفح الخاص: ماشي مشكل */ }
    }
    function drop(key) {
        try { localStorage.removeItem(key); }
        catch (error) { /* التصفح الخاص: ماشي مشكل */ }
    }
    function markKick() {
        try { sessionStorage.setItem(KICK_KEY, "1"); }
        catch (error) { /* ماشي مشكل — غير الرسالة اللي ماغاتبانش */ }
    }

    if (!read(SESSION_KEY)) return;

    /* من بعد ما يبان المحتوى (assets/diag.js) — Firestore ثقيل */
    (window.__deAfterContent || function (fn) { setTimeout(fn, 2500); })(async function () {
        try {
            var mods = await Promise.all([
                import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
                import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js"),
                import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js")
            ]);
            var appMod = mods[0], authMod = mods[1], fsMod = mods[2];

            /* الصفحة يمكن تكون ديجا دارت initializeApp. إلا عاودنا،
               Firebase كيرمي خطأ، إذن كنعاودو نستعملو اللي كاين. */
            var app = appMod.getApps().length
                ? appMod.getApp()
                : appMod.initializeApp({
                      apiKey: "AIzaSyBNxr0ZQrqa2F-RVyfoAC9r7_S49Cb2S4s",
                      authDomain: "sehrgothe.firebaseapp.com",
                      projectId: "sehrgothe",
                      storageBucket: "sehrgothe.firebasestorage.app",
                      messagingSenderId: "1066728503518",
                      appId: "1:1066728503518:web:b350728d7b20f1064d2a4f",
                      measurementId: "G-GKNEV0ZQV5"
                  });

            var auth = authMod.getAuth(app);
            var db = fsMod.getFirestore(app);
            var stop = null;

            authMod.onAuthStateChanged(auth, function (user) {
                if (stop) {
                    stop();
                    stop = null;
                }
                if (!user) return;
                if (!read(SESSION_KEY)) return;

                stop = fsMod.onSnapshot(
                    fsMod.doc(db, "users", user.uid),
                    async function (snapshot) {
                        if (!snapshot.exists()) return;

                        var data = snapshot.data();
                        var theirSession = data.sessionId;
                        var theirDevice = data.deviceId;

                        /* الـ id يقدر يكون تبدل ملي كان الـ auth كيتحمل. */
                        var mySession = read(SESSION_KEY);
                        var myDevice = read(DEVICE_KEY);

                        if (!mySession) return;
                        if (!theirSession || theirSession === mySession) return;

                        /* نفس المتصفح: تبويب آخر دخل من جديد.
                           كنتماشاو معاه بدل ما نطردو راسنا. */
                        if (theirDevice && myDevice && theirDevice === myDevice) {
                            write(SESSION_KEY, theirSession);
                            return;
                        }

                        if (stop) {
                            stop();
                            stop = null;
                        }
                        drop(SESSION_KEY);

                        /* السبب كيتسجل قبل signOut: signOut كيوقظ
                           المستمعين ديال الصفحة وهوما كيديرو التنقل
                           ديالهم قبل ما نكملو حنا. */
                        markKick();
                        window.__deSessionKick = true;

                        try {
                            await authMod.signOut(auth);
                        } catch (error) {
                            console.error("Auto logout error:", error);
                        }

                        location.replace(LOGIN_PAGE);
                    },
                    function (error) {
                        console.error("Session guard listener error:", error);
                    }
                );
            });
        } catch (error) {
            console.error("Session guard load error:", error);
        }
    });
})();
