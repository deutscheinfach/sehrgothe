# sehrgut — setup

sehrgut howa nfs l-site dyal Deutsch Einfach (telc B1 & B2), walakin b backend bo7do:

| L-bled | Chno kaychouf |
|---|---|
| 🇲🇦 Lmaghrib | B7al Deutsch Einfach: themat majaniya + Premium b flouss 3la WhatsApp (+212 776 551 898) |
| Ay bled akhor (DZ, TN, EG, ga3 d-dowal) | Kolchi majani, m3a l-ads |

## Kifach kan3rfo l-bled (w 3lach l-VPN ma kaynf3ch)

L-Worker (`cloudflare-worker.js` → `resolveRegion`) kayjm3 bzaf dyal l-3alamat. Ila wa7da mnhom galt "Lmaghrib", l-compte kayweli **MA**:

1. L-IP (Cloudflare `request.cf.country`)
2. **L-fuseau horaire dyal t-tilifoun** (`Africa/Casablanca`). L-VPN kaybddl l-IP walakin ma kaybddlch l-fuseau.
3. R-raqm li dkhl f l-inscription (+212)
4. Lugha dyal l-browser (`ar-MA`, `fr-MA`…)
5. L-jihaz deja tsjjl fih chi compte maghribi

**MA kayt9ffel:** mlli kaywli l-compte MA, ma kayrj3ch. Ila tsjjel chi wa7d b VPN, ghadi ytbddel l MA awl ma y7ll l-site bla VPN, wla awl ma t-tilifoun ybyyn l-fuseau dyalo.

Bach trj3 chi compte (b7al wa7d dzayri safr l l-Maghrib): ms7 l-key `region-<uid>` mn KV `REGIONS`.

> Ma kaynch chi 7all 100% bla SMS. Wa7d 3ndo khbra y9der ybddl l-fuseau dyal t-tilifoun, ydir VPN, ykteb raqm khor, w ykhdm b browser jdid. Walakin l-user l-3adi li kaydir ghir VPN ghadi ytchd.

## 1. Firebase (projet `sehrgothe`)

1. **Authentication → Sign-in method:** fe3el Email/Password.
2. **Authentication → Settings → Authorized domains:** zid `deutscheinfach.github.io` (w d-domain dyalk ila chriti chi wa7d).
3. **Firestore Database:** create database, w mn ba3d 7tt l-contenu dyal `firebase/firestore.rules` f Rules → Publish.
4. **Admin:** f Firestore, `users/<uid dyalk>` → zid `isAdmin: true` (boolean).
5. **Service account** (l-admin w les notifications): Project settings → Service accounts → Generate new private key. Ghadi t7tajo f l-step 2.
6. **Notifications (optionnel):** Project settings → Cloud Messaging → Web Push certificates. 7tt l-VAPID key f `assets/app-install.js`.

## 2. Cloudflare Worker (`sehrgut-api`)

1. Workers & Pages → Create → Worker → smih `sehrgut-api` → 7tt l-contenu dyal `cloudflare-worker.js` → Deploy.
2. **KV** (Storage & Databases → KV): create juj namespaces:
   - `SEHRGUT_TOPICS`: l-themat premium
   - `SEHRGUT_REGIONS`: l-bled dyal kol compte
3. Worker → Settings → Bindings → KV: rbt `TOPICS` → `SEHRGUT_TOPICS`, w `REGIONS` → `SEHRGUT_REGIONS`.
4. Worker → Settings → Variables and Secrets:
   - `GEMINI_API_KEY` (secret): bach t-tss7i7 dyal Schreiben ykhdm
   - `FIREBASE_SERVICE_ACCOUNT` (secret): l-JSON kaml mn l-step 1.5
   - `ALLOWED_ORIGIN`: `https://deutscheinfach.github.io` (w d-domain dyalk ila kan)
5. Rbt s-site b l-Worker:
   ```bash
   bash tools/set-api-url.sh sehrgut-api.<subdomain-dyalk>.workers.dev
   ```

## 3. Nsakh l-themat premium mn Deutsch Einfach

L-themat premium ma kaynch f l-repo, kaysknu f KV dyal Deutsch Einfach. Bach tnskhhom (khass juj namespaces ykuno f nfs l-compte dyal Cloudflare):

```bash
npx wrangler login
node tools/copy-kv.mjs <ID dyal KV Deutsch Einfach> <ID dyal SEHRGUT_TOPICS>
```

## 4. Ads (Google AdSense)

Mlli yt9bel l-compte dyalk:

1. 7tt `ca-pub-…` f `ADSENSE_CLIENT` f `assets/region.js`.
2. Zid fichier `ads.txt` f l-racine dyal l-repo:
   ```
   google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```
3. F AdSense, fe3el **Auto ads**.

Ga3 l-ads kaybanu ghir l:
- L-comptes li l-bled dyalhom majani (machi MA) w ma 3ndhomch abonnement
- Z-zuwwar bla compte ila kan l-jihaz dyalhom ma bayench maghribi

## 5. L-hosting

GitHub Pages (`.github/workflows/static.yml`) kaynshr `main` f `https://deutscheinfach.github.io/sehrgothe/`. Ila chriti domain, bddl `deutscheinfach.github.io/sehrgothe` f ga3 l-fichiers (canonical, sitemap, og:image), w zid fichier `CNAME`.
