# മലയാളം AI വോയ്സ് (Malayalam AI Text-to-Speech)

A 100% free, mobile-responsive Malayalam Text-to-Speech web app powered by **Google Gemini 3.8 Flash Audio Output**. It supports natural Kerala colloquial slang, deep emotional variations, and genuine human laughter via tags like `[laugh]`, `[giggles]`, `[whispers]`, and `[sarcastically]`.

---

## 🌟 Key Features

- **100% Free**: Powered by Google AI Studio Free Tier (15 requests/minute, 1,500 requests/day).
- **Mobile-First & Responsive**: Access from any smartphone browser (iPhone / Android) or PC.
- **Natural Malayalam Slang**: Understands authentic Kerala dialects (Thrissur, Kochi, Malabar).
- **Real Human Laughter & Emotions**:
  - `[laugh]` → Generates authentic human chuckles & belly laughs.
  - `[whispers]` → Intimate, low-volume whispering.
  - `[sarcastically]` → Witty, sarcastic inflection.
  - `[sigh]` → Deep emotional exhale.
  - `[excited]` → Joyous, energetic delivery.
- **5 Distinct Voices**:
  - **Puck** (Male): Playful, lively, comedy & colloquial slang.
  - **Aoede** (Female): Warm, resonant, dramatic storytelling.
  - **Charon** (Male): Deep, cinematic narration.
  - **Kore** (Female): Soft, gentle, natural conversational.
  - **Fenrir** (Male): Bold, assertive, clear conversational.
- **Built-in Audio Player & 1-Click Download**: Play directly in the browser and download `.wav` audio.
- **Zero Cost Hosting**: Ready to deploy in 1 click to **Vercel** or **Cloudflare Pages**.

---

## 🚀 Quick Start (Running Locally on PC & Phone)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The server will start on `http://localhost:3000`.

### 3. Open on Mobile Phone (Same Wi-Fi)
1. Find your PC's local IP address (e.g. `192.168.1.15`). On Windows, run `ipconfig`.
2. Open Chrome/Safari on your phone and go to:
   ```
   http://192.168.1.15:3000
   ```
3. Tap the **Settings (⚙️)** button and enter your free Google Gemini API Key. It will be stored safely on your phone.

---

## 🔑 Getting Your Free Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API Key"** and copy the key.
4. In the app, click the **Settings (⚙️)** button at the top right, paste the key, and click **Save**.

*Note: The free tier allows 15 requests per minute, which is more than enough for personal audio generation at zero cost.*

---

## 🌐 Free Cloud Hosting (Access from Anywhere)

### Option A: Deploy to Vercel (Recommended)
1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. *(Optional)* In Environment Variables, you can add `GEMINI_API_KEY = your_api_key` (or just input it directly inside the app on your phone).
5. Click **Deploy**. You will get a free `https://your-app.vercel.app` URL accessible from anywhere on the internet!

### Option B: Deploy to Cloudflare Pages
1. Push this folder to GitHub.
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages**.
3. Connect your repository.
4. Set Build output directory to `public`.
5. The API is automatically powered by `functions/api/tts.js`.
6. Click **Deploy**.

---

## 🎭 How Emotion & Laughter Tags Work

Unlike old robotic TTS systems that pronounce "ഹാഹാഹാ" flatly as "haa-haa-haa", **Gemini 3.8 Flash is a generative audio model**. It understands the text context and acts like a voice actor:

| Tag | Malayalam Meaning | Effect on Voice |
| :--- | :--- | :--- |
| `[laugh]` | പൊട്ടിച്ചിരി | Laughs aloud naturally with vocal breath |
| `[giggles]` | ചെറുചിരി | Subtle chuckle or playful giggle |
| `[whispers]` | രഹസ്യമായി | Drops to a soft, hushed whisper |
| `[sarcastically]` | പരിഹാസത്തോടെ | Sarcastic, teasing inflection |
| `[sigh]` | നിശ്വാസം | Audible sigh or relief exhale |
| `[excited]` | ആവേശത്തോടെ | Higher pitch, energetic tempo |
| `[sad]` | സങ്കടത്തോടെ | Trembling, sorrowful delivery |

### Sample Prompt:
```
പ്രാചീന എൽഡോണിയ എന്ന ഭൂമിയിൽ സെഫിറോസ് എന്ന ഒരു ഡ്രാഗൺ ജീവിച്ചിരുന്നു. [sarcastically] എല്ലാം കത്തിച്ച് നശിപ്പിക്കുന്ന തരത്തിലുള്ളവനല്ല കേട്ടോ... [giggles] പക്ഷേ അവൻ സ്നേഹപൂർവ്വവും അതിബുദ്ധിമാനുമായിരുന്നു! [laugh] അവൻ കൂട്ടുകാരോട് തമാശകൾ പറഞ്ഞ് പൊട്ടിച്ചിരിക്കുമായിരുന്നു. [whispers] അവൻ കടന്നുപോകുമ്പോൾ പക്ഷികളും മൗനമാകുകയായിരുന്നു.
```
