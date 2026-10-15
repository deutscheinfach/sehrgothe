/* كيوفّر window.__deutschEinfachIdToken — Promise كيحل بـ ID token
   ديال Firebase، ولا null إلا ماشي مسجّل الدخول.

   الـ token كيتصيفط للـ Worker باش يتحقق من الاشتراك قبل ما يعطي
   نص موضوع Premium. */

window.__deutschEinfachIdToken = (async function () {
  try {
    /* جوج ف نفس الوقت (قبل كانو واحد من بعد واحد) */
    const mods = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js")
    ]);
    const appMod = mods[0], authMod = mods[1];

    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp({
      apiKey: "AIzaSyDHMmaHLYRRHfdRDj-hf7s5LOqeWPTiOxU",
      authDomain: "deutsch-einfach-4c81f.firebaseapp.com",
      projectId: "deutsch-einfach-4c81f",
      storageBucket: "deutsch-einfach-4c81f.firebasestorage.app",
      messagingSenderId: "152448766933",
      appId: "1:152448766933:web:f7824c4db8ab3caccbe35c",
      measurementId: "G-9QV234Z0KZ"
    });

    const auth = authMod.getAuth(app);

    return await new Promise(function (resolve) {
      authMod.onAuthStateChanged(auth, async function (user) {
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
