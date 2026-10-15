/* كيوفّر window.__sehrgutIdToken — Promise كيحل بـ ID token
   ديال Firebase، ولا null إلا ماشي مسجّل الدخول.

   الـ token كيتصيفط للـ Worker باش يتحقق من الاشتراك قبل ما يعطي
   نص موضوع Premium. */

window.__sehrgutIdToken = (async function () {
  try {
    /* جوج ف نفس الوقت (قبل كانو واحد من بعد واحد) */
    const mods = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const appMod = mods[0], authMod = mods[1];

    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp({
      apiKey: "AIzaSyBNxr0ZQrqa2F-RVyfoAC9r7_S49Cb2S4s",
      authDomain: "sehrgothe.firebaseapp.com",
      projectId: "sehrgothe",
      storageBucket: "sehrgothe.firebasestorage.app",
      messagingSenderId: "1066728503518",
      appId: "1:1066728503518:web:b350728d7b20f1064d2a4f",
      measurementId: "G-GKNEV0ZQV5"
    });

    const auth = authMod.getAuth(app);

    return await new Promise(function (resolve) {
      authMod.onAuthStateChanged(auth, async function (user) {
        /* الإعلانات (assets/region.js): الصفحات ديال Schreiben ما فيهمش
           site-header.js، إذن كنقررو هنا. */
        if (window.__sehrgutAds && window.__sehrgutRegion) {
          if (user) {
            window.__sehrgutRegion.check(user).then(function (r) {
              window.__sehrgutAds.render(r.free === true);
            });
          } else {
            window.__sehrgutAds.render(!window.__sehrgutRegion.looksMoroccan(window.__sehrgutRegion.hint()));
          }
        }

        if (!user) {
          resolve(null);
          return;
        }

        try {
          resolve(await user.getIdToken());
        } catch (error) {
          console.error("Could not get ID token:", error);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error("Auth load error:", error);
    return null;
  }
})();
