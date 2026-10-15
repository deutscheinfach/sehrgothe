/* حالة الاشتراك للواجهة: window.__sehrgutPremiumReady → Promise<boolean>

   ⚠️ هادي كوسمétique بس — كتقرر واش الكارت يبان مقفول ولا لا.
   الحماية الحقيقية ديال النص كاينة فالـ Worker، اللي كيتحقق من الـ ID
   token والاشتراك قبل ما يعطي أي محتوى. */

window.__sehrgutPremiumReady = (async function () {
  try {
    const appMod = await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js");
    const authMod = await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js");
    const fsMod = await import("https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");

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
    const db = fsMod.getFirestore(app);

    return await new Promise(function (resolve) {
      authMod.onAuthStateChanged(auth, async function (user) {
        if (!user) {
          resolve(false);
          return;
        }

        try {
          const snap = await fsMod.getDoc(fsMod.doc(db, "users", user.uid));
          if (!snap.exists()) {
            resolve(false);
            return;
          }

          const data = snap.data();
          const active = data.subscriptionActive === true;

          let notExpired = true;
          if (data.subscriptionEnd && typeof data.subscriptionEnd.toDate === "function") {
            notExpired = data.subscriptionEnd.toDate().getTime() > Date.now();
          }

          resolve(active && notExpired);
        } catch (error) {
          console.error("Premium check error:", error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("Premium check load error:", error);
    return false;
  }
})();
