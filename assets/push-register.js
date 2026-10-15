/* ===== تسجيل الجهاز فالإشعارات =====

   كنجيبو token ديال FCM وكنحفظوه ف users/{uid}.fcmTokens.
   ملي شي واحد كيعيط ليك، الـ Worker كيصيفط الإشعار لهاد
   الـ tokens — والأبيل كيوصل حتى والموقع مسدود.

   باش يخدم، خاصك تحط المفتاح ديالك (VAPID key من
   Firebase Console → Cloud Messaging → Web Push certificates)
   ف window.__DE_VAPID_KEY (assets/app-install.js).

   ماكيخدمش بوحدو: المتصفح كيطلب الإذن غير من بعد ضغطة.
   assets/app-install.js كيعيط window.__dePushEnable({ daily: true })
   ملي يضغط المستخدم «فكرني كل نهار». */

window.__dePushEnable = async function (options) {
    "use strict";

    options = options || {};
    const VAPID_PUBLIC_KEY = window.__DE_VAPID_KEY || "";

    if (!VAPID_PUBLIC_KEY) {
        console.info(
            "Push: ماكاينش VAPID key — الإشعارات خدامة غير ملي يكون الموقع محلول.");
        return null;
    }

    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        console.info("Push: هاد المتصفح ماكيدعمش الإشعارات.");
        return null;
    }

    /* iOS ماكيخدمش Web Push إلا إلا كان الموقع مزيد فالشاشة
       الرئيسية (Add to Home Screen). كنعرفوها هكا. */
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        || window.navigator.standalone === true;

    if (isIOS && !isStandalone) {
        console.info(
            "Push: ف iPhone خاص الموقع يتزاد فالشاشة الرئيسية باش يوصلو الإشعارات.");
        return { needsHomeScreen: true };
    }

    try {
        const registration =
            await navigator.serviceWorker.register("firebase-messaging-sw.js");

        if (Notification.permission === "default") {
            const granted = await Notification.requestPermission();
            if (granted !== "granted") return null;
        }
        if (Notification.permission !== "granted") return null;

        const appMod = await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js");
        const msgMod = await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js");
        const authMod = await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js");
        const fsMod = await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js");

        const app = appMod.getApps().length
            ? appMod.getApp()
            : appMod.initializeApp({
                  apiKey: "AIzaSyDHMmaHLYRRHfdRDj-hf7s5LOqeWPTiOxU",
                  authDomain: "deutsch-einfach-4c81f.firebaseapp.com",
                  projectId: "deutsch-einfach-4c81f",
                  storageBucket: "deutsch-einfach-4c81f.firebasestorage.app",
                  messagingSenderId: "152448766933",
                  appId: "1:152448766933:web:f7824c4db8ab3caccbe35c",
                      measurementId: "G-9QV234Z0KZ"
              });

        if (!(await msgMod.isSupported())) {
            console.info("Push: ماكيتدعمش ف هاد المتصفح.");
            return null;
        }

        const messaging = msgMod.getMessaging(app);
        const auth = authMod.getAuth(app);
        const db = fsMod.getFirestore(app);

        const token = await msgMod.getToken(messaging, {
            vapidKey: VAPID_PUBLIC_KEY,
            serviceWorkerRegistration: registration
        });

        if (!token) return null;

        /* كنحفظو الـ token ملي نعرفو شكون داخل */
        const user = auth.currentUser || await new Promise(function (resolve) {
            const stop = authMod.onAuthStateChanged(auth, function (u) { stop(); resolve(u); });
        });
        if (!user) return { token: token, needsLogin: true };
        {
            try {
                /* ماشي ف users/{uid} نيشان: داك الوثيقة أي واحد
                   مسجل كيقدر يقراها (الشات محتاج الأسماء).
                   هنا حتى شي كليان ماكيقرا — غير حساب الخدمة
                   ديال الـ Worker كيوصل ليها. */
                await fsMod.setDoc(
                    fsMod.doc(db, "users", user.uid, "private", "push"),
                    {
                        /* خريطة بدل لائحة: نفس الجهاز ماكيتزادش مرتين */
                        tokens: { [token]: true },
                        updatedAt: new Date()
                    },
                    { merge: true }
                );
                /* التذكير اليومي: لائحة بوحدها باش الـ Worker يقراها بلا index */
                if (typeof options.daily === "boolean") {
                    await fsMod.setDoc(
                        fsMod.doc(db, "reminders", user.uid),
                        { tokens: { [token]: true }, on: options.daily, updatedAt: fsMod.serverTimestamp() },
                        { merge: true }
                    );
                }
            } catch (error) {
                console.warn("Push: ما قدرناش نحفظو الـ token:", error);
                return null;
            }
        }

        return { token: token, registration: registration, ok: true };
    } catch (error) {
        console.warn("Push: التسجيل فشل:", error);
        return null;
    }
};
