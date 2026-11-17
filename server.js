const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

const STYLE_PROMPTS = {
  conversational: "Natural, casual, relaxed Kerala Malayalam conversational tone as if speaking to a close friend.",
  slang: "Authentic, colorful colloquial Kerala slang with natural regional inflections (Kochi/Thrissur/Malabar flavor).",
  storyteller: "Engaging and dramatic Malayalam storytelling narration, rich with suspense, emotional variations, and vivid atmosphere.",
  comedy: "Humorous, lighthearted, cheerful, and witty Malayalam delivery. Laugh and chuckle with authentic human warmth.",
  suspense: "Mysterious, dark, whispered, suspenseful Malayalam thriller tone with deliberate dramatic pauses.",
  excited: "High-energy, joyous, enthusiastic Malayalam delivery with bright vocal expressions."
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function formatTextForTTS(rawText) {
  return rawText
    .replace(/\[laugh\]/gi, ' <laugh> ')
    .replace(/\[giggle[s]?\]/gi, ' <giggle> ')
    .replace(/\[whisper[s]?\]/gi, ' <whisper> ')
    .replace(/\[sigh\]/gi, ' <sigh> ')
    .replace(/\[pause\]/gi, ' <short pause> ')
    .replace(/\[sarcastically\]/gi, '')
    .replace(/\[excited\]/gi, '')
    .replace(/\[sad\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- MICROSOFT EDGE NEURAL TTS (SOBHANA & MIDHUN - 100% FREE & UNLIMITED) ---
let MsEdgeTTS, OUTPUT_FORMAT;
try {
  const edgeModule = require('msedge-tts');
  MsEdgeTTS = edgeModule.MsEdgeTTS;
  OUTPUT_FORMAT = edgeModule.OUTPUT_FORMAT;
} catch (e) {
  console.warn('msedge-tts module not loaded:', e.message);
}

async function generateEdgeTTS(text, voice = 'Sobhana') {
  if (!MsEdgeTTS) {
    return generateFreeHTTPTTS(text);
  }

  const cleanText = text
    .replace(/\[laugh\]/gi, '')
    .replace(/\[giggle[s]?\]/gi, '')
    .replace(/\[whisper[s]?\]/gi, '')
    .replace(/\[sigh\]/gi, '')
    .replace(/\[pause\]/gi, '')
    .replace(/\[sarcastically\]/gi, '')
    .replace(/\[excited\]/gi, '')
    .replace(/\[sad\]/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isMale = voice && voice.toLowerCase().includes('midhun');
  const voiceName = isMale ? 'ml-IN-MidhunNeural' : 'ml-IN-SobhanaNeural';

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  return new Promise((resolve, reject) => {
    const { audioStream } = tts.toStream(cleanText);
    const chunks = [];
    audioStream.on('data', chunk => chunks.push(chunk));
    audioStream.on('end', () => {
      try { tts.close(); } catch (_) {}
      resolve(Buffer.concat(chunks));
    });
    audioStream.on('error', err => {
      try { tts.close(); } catch (_) {}
      reject(err);
    });
  });
}

// --- UNLIMITED FREE MALAYALAM HTTP VOICE (FALLBACK) ---
function splitTextIntoChunks(text, maxLength = 160) {
  const parts = text.split(/([.!?।\n]+)/);
  const chunks = [];
  let current = '';

  for (let part of parts) {
    if ((current + part).length > maxLength) {
      if (current.trim()) chunks.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

async function generateFreeHTTPTTS(text) {
  const cleanText = text
    .replace(/\[laugh\]/gi, '')
    .replace(/\[giggle[s]?\]/gi, '')
    .replace(/\[whisper[s]?\]/gi, '')
    .replace(/\[sigh\]/gi, '')
    .replace(/\[pause\]/gi, '')
    .replace(/\[sarcastically\]/gi, '')
    .replace(/\[excited\]/gi, '')
    .replace(/\[sad\]/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const chunks = splitTextIntoChunks(cleanText, 140);
  const audioBuffers = [];

  for (let chunk of chunks) {
    if (!chunk.trim()) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=ml&client=tw-ob`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!res.ok) {
      throw new Error(`Free Voice HTTP returned status ${res.status}`);
    }

    const arrayBuf = await res.arrayBuffer();
    audioBuffers.push(Buffer.from(arrayBuf));
  }

  if (audioBuffers.length === 0) {
    throw new Error('No audio returned from Free Voice engine.');
  }

  return Buffer.concat(audioBuffers);
}

// --- GOOGLE GEMINI 3.8 FLASH TTS (EMOTIONS & LAUGHTER) ---
async function callGeminiTTS(apiKey, text, voice, stylePrompt) {
  const formattedText = formatTextForTTS(text);

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: formattedText,
            speech_metadata: {
              style: `Spoken in native Kerala Malayalam with authentic accent and diction. ${stylePrompt}`
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice
          }
        }
      }
    }
  };

  const modelName = 'gemini-3.8-flash-tts';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseData = await apiResponse.json();
    return { ok: apiResponse.ok, status: apiResponse.status, data: responseData };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Google Gemini API request timed out after 35 seconds. Please try again.');
    }
    throw err;
  }
}

// --- 2D SCENE BREAKDOWN ---
async function callGeminiSceneBreakdown(apiKey, text) {
  const systemPrompt = `You are an expert 2D animator and art director.
Analyze the following Malayalam story and break it down into 2 to 3 chronological visual scenes.
For each scene, output:
1. "prompt": A detailed English prompt describing a 2D animated storybook / Ghibli-inspired art style. Explicitly mention the objects, characters, environment, colors, lighting, and action from this part of the story (e.g. forest, river, wooden boat, fisherman, rocks, dragon, castle, morning fog, etc.).
2. "subtitle": The segment of Malayalam text that corresponds to this scene.

Format your response as a valid JSON array of objects:
[
  {
    "prompt": "2D animated storybook art style, Studio Ghibli aesthetic, an old fisherman on a small wooden canoe in a misty river surrounded by green trees at sunrise, 16:9 widescreen",
    "subtitle": "പണ്ട് പണ്ട്, പുഴയോരത്തെ ഒരു ചെറിയ ഗ്രാമത്തിൽ ഒരു വയസ്സനായ മീൻപിടുത്തക്കാരൻ താമസിച്ചിരുന്നു."
  }
]
Output ONLY the raw JSON array.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt + '\n\nMalayalam Story:\n' + text }
        ]
      }
    ]
  };

  const targetModel = 'gemini-3.8-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(responseData.error?.message || 'Failed to extract visual scenes');
    }

    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const scenes = JSON.parse(cleanedJson);
    return scenes;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Scenes] Gemini error, using fallback scene divider:', err.message);
    return fallbackSceneExtractor(text);
  }
}

function detectTheme(text = '') {
  const lower = text.toLowerCase();
  if (/പുഴ|തോണി|മീൻ|വള്ളം|കടൽ|തീരം|വെള്ളം|river|boat|canoe|fisherman|water|sea|lake|ocean|stream|shore|fishing/.test(lower)) {
    return 'river';
  }
  if (/കാട്|മരം|തോട്ടം|പച്ചപ്പ്|പ്രകൃതി|മൃഗം|forest|tree|wood|jungle|nature|green|animal|wild/.test(lower)) {
    return 'forest';
  }
  if (/സൂര്യൻ|പ്രഭാതം|രാവിലെ|വയൽ|വെളിച്ചം|sunrise|morning|dawn|sun|day|field/.test(lower)) {
    return 'sunrise';
  }
  if (/രാത്രി|ചന്ദ്രൻ|നക്ഷത്രം|ഇരുട്ട്|രഹസ്യം|night|moon|star|dark|midnight|shadow/.test(lower)) {
    return 'night';
  }
  if (/ഗ്രാമം|വീട്|കുടിര|വഴി|ക്ഷേത്രം|village|house|home|cottage|road|path|temple/.test(lower)) {
    return 'village';
  }
  return 'river';
}

function getStorybookSceneSVG(prompt = '', subtitle = '') {
  const combined = (prompt + ' ' + subtitle);
  const theme = detectTheme(combined);

  let defs = '';
  let content = '';

  if (theme === 'river') {
    defs = `
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fdba74"/>
        <stop offset="35%" stop-color="#fb923c"/>
        <stop offset="65%" stop-color="#f43f5e"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f43f5e"/>
        <stop offset="25%" stop-color="#fb923c"/>
        <stop offset="65%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#075985"/>
      </linearGradient>
    `;
    content = `
      <!-- Sunrise Sun -->
      <circle cx="640" cy="300" r="75" fill="#fef08a" opacity="0.95"/>
      <circle cx="640" cy="300" r="140" fill="#fde047" opacity="0.25"/>
      <circle cx="640" cy="300" r="220" fill="#fb923c" opacity="0.12"/>
      <!-- Faraway Kerala Misty Hills -->
      <path d="M0 370 Q 250 300, 500 360 T 950 320 T 1280 360 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.45"/>
      <path d="M0 390 Q 320 330, 680 390 T 1280 360 L 1280 720 L 0 720 Z" fill="#334155" opacity="0.6"/>
      <!-- Water Surface -->
      <rect x="0" y="415" width="1280" height="305" fill="url(#waterGrad)"/>
      <!-- Water Ripples / Reflections -->
      <ellipse cx="640" cy="460" rx="140" ry="8" fill="#fef08a" opacity="0.55"/>
      <ellipse cx="640" cy="500" rx="110" ry="6" fill="#fef08a" opacity="0.45"/>
      <ellipse cx="640" cy="545" rx="80" ry="5" fill="#fef08a" opacity="0.35"/>
      <ellipse cx="640" cy="590" rx="50" ry="4" fill="#fef08a" opacity="0.25"/>
      <!-- Left Riverbank & Coconut Palm -->
      <path d="M0 450 Q 180 430, 320 490 L 320 720 L 0 720 Z" fill="#0f172a"/>
      <path d="M 80 620 Q 120 480, 95 340" stroke="#0f172a" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M 95 340 Q 50 310, 10 350 M 95 340 Q 75 285, 40 265 M 95 340 Q 140 270, 180 295 M 95 340 Q 150 325, 175 375 M 95 340 Q 95 260, 105 240" stroke="#047857" stroke-width="9" fill="none" stroke-linecap="round"/>
      <!-- Wooden Canoe (Vallam) & Fisherman Silhouette -->
      <g transform="translate(680, 480) scale(1.15)">
        <path d="M -90 18 Q 0 42, 90 18 Q 70 3, 0 6 Q -70 3, -90 18 Z" fill="#0f172a"/>
        <circle cx="15" cy="-22" r="11" fill="#0f172a"/>
        <path d="M 15 -11 Q 10 5, 5 15 L 25 15 Z" fill="#0f172a"/>
        <line x1="-30" y1="-25" x2="35" y2="45" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="0" cy="32" rx="85" ry="5" fill="#0f172a" opacity="0.35"/>
      </g>
      <!-- Flying Birds -->
      <path d="M 400 180 Q 410 170, 420 180 Q 430 170, 440 180" stroke="#78350f" stroke-width="3" fill="none"/>
      <path d="M 450 200 Q 458 192, 466 200 Q 474 192, 482 200" stroke="#78350f" stroke-width="2.5" fill="none"/>
    `;
  } else if (theme === 'forest') {
    defs = `
      <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="50%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#6ee7b7"/>
      </linearGradient>
      <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#065f46"/>
        <stop offset="100%" stop-color="#022c22"/>
      </linearGradient>
    `;
    content = `
      <rect width="1280" height="720" fill="url(#forestSky)"/>
      <polygon points="300,0 450,0 750,720 500,720" fill="#fef08a" opacity="0.12"/>
      <polygon points="650,0 800,0 1100,720 850,720" fill="#fef08a" opacity="0.10"/>
      <path d="M 100 720 L 100 200 Q 200 120, 300 200 L 300 720 Z" fill="#047857" opacity="0.5"/>
      <path d="M 450 720 L 450 180 Q 550 90, 650 180 L 650 720 Z" fill="#047857" opacity="0.5"/>
      <path d="M 800 720 L 800 220 Q 900 140, 1000 220 L 1000 720 Z" fill="#047857" opacity="0.5"/>
      <rect x="180" y="0" width="70" height="720" fill="#022c22"/>
      <rect x="750" y="0" width="85" height="720" fill="#022c22"/>
      <rect x="1050" y="0" width="100" height="720" fill="#022c22"/>
      <path d="M0 560 Q 350 480, 700 550 T 1280 520 L 1280 720 L 0 720 Z" fill="url(#groundGrad)"/>
      <circle cx="215" cy="180" r="140" fill="#065f46" opacity="0.9"/>
      <circle cx="790" cy="150" r="160" fill="#065f46" opacity="0.9"/>
      <circle cx="1100" cy="190" r="180" fill="#065f46" opacity="0.9"/>
      <circle cx="350" cy="420" r="6" fill="#fef08a" opacity="0.8"/>
      <circle cx="550" cy="380" r="8" fill="#fde047" opacity="0.9"/>
      <circle cx="900" cy="450" r="5" fill="#fef08a" opacity="0.8"/>
    `;
  } else if (theme === 'night') {
    defs = `
      <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#090a0f"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
    `;
    content = `
      <rect width="1280" height="720" fill="url(#nightSky)"/>
      <circle cx="150" cy="120" r="3" fill="#fff" opacity="0.9"/>
      <circle cx="280" cy="80" r="2.5" fill="#fff" opacity="0.8"/>
      <circle cx="420" cy="150" r="2" fill="#fff" opacity="0.7"/>
      <circle cx="780" cy="90" r="3" fill="#fff" opacity="0.9"/>
      <circle cx="920" cy="160" r="2.5" fill="#fff" opacity="0.8"/>
      <circle cx="1100" cy="110" r="3" fill="#fff" opacity="0.95"/>
      <circle cx="960" cy="200" r="65" fill="#fef08a"/>
      <circle cx="985" cy="190" r="60" fill="#1e1b4b"/>
      <path d="M0 460 Q 300 390, 600 450 T 1280 430 L 1280 720 L 0 720 Z" fill="#0f172a" opacity="0.85"/>
      <path d="M0 520 Q 350 470, 750 530 T 1280 500 L 1280 720 L 0 720 Z" fill="#020617"/>
      <path d="M 220 540 Q 240 450, 230 360" stroke="#020617" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 230 360 Q 180 320, 140 360 M 230 360 Q 210 300, 175 280 M 230 360 Q 280 290, 310 310 M 230 360 Q 290 340, 305 385" stroke="#064e3b" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="450" cy="550" r="6" fill="#a7f3d0" opacity="0.85"/>
      <circle cx="650" cy="510" r="7" fill="#6ee7b7" opacity="0.9"/>
    `;
  } else if (theme === 'village') {
    defs = `
      <linearGradient id="villageSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fdba74"/>
        <stop offset="45%" stop-color="#f472b6"/>
        <stop offset="100%" stop-color="#818cf8"/>
      </linearGradient>
    `;
    content = `
      <rect width="1280" height="720" fill="url(#villageSky)"/>
      <circle cx="320" cy="280" r="70" fill="#fef08a" opacity="0.9"/>
      <path d="M0 420 Q 300 350, 600 410 T 1280 380 L 1280 720 L 0 720 Z" fill="#475569" opacity="0.6"/>
      <!-- Village Ground & Path -->
      <path d="M0 480 Q 400 450, 800 510 L 1280 500 L 1280 720 L 0 720 Z" fill="#15803d"/>
      <path d="M 400 720 L 520 480 L 600 480 L 680 720 Z" fill="#b45309" opacity="0.7"/>
      <!-- Traditional Kerala House -->
      <g transform="translate(720, 360)">
        <!-- Walls -->
        <rect x="0" y="70" width="160" height="90" fill="#fef3c7"/>
        <!-- Sloping Tile Roof -->
        <polygon points="-25,70 80,10 185,70" fill="#b91c1c"/>
        <!-- Door & Glowing Window -->
        <rect x="60" y="105" width="35" height="55" fill="#78350f"/>
        <rect x="115" y="95" width="30" height="30" fill="#fde047"/>
      </g>
      <!-- Coconut Palm -->
      <path d="M 220 620 Q 260 480, 240 340" stroke="#0f172a" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 240 340 Q 190 300, 150 340 M 240 340 Q 220 280, 180 260 M 240 340 Q 290 270, 330 290 M 240 340 Q 300 320, 320 370" stroke="#047857" stroke-width="8" fill="none" stroke-linecap="round"/>
    `;
  } else {
    // Universal Scenic Kerala Sunrise
    defs = `
      <linearGradient id="scenicSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fed7aa"/>
        <stop offset="40%" stop-color="#fdba74"/>
        <stop offset="70%" stop-color="#f472b6"/>
        <stop offset="100%" stop-color="#60a5fa"/>
      </linearGradient>
      <linearGradient id="scenicWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f472b6"/>
        <stop offset="40%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    `;
    content = `
      <rect width="1280" height="720" fill="url(#scenicSky)"/>
      <circle cx="640" cy="320" r="85" fill="#fef08a" opacity="0.9"/>
      <circle cx="640" cy="320" r="160" fill="#fde047" opacity="0.2"/>
      <path d="M0 380 Q 300 300, 640 370 T 1280 340 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.5"/>
      <rect x="0" y="440" width="1280" height="280" fill="url(#scenicWater)"/>
      <ellipse cx="640" cy="490" rx="120" ry="8" fill="#fef08a" opacity="0.5"/>
      <ellipse cx="640" cy="540" rx="90" ry="6" fill="#fef08a" opacity="0.4"/>
      <path d="M0 480 Q 200 450, 360 520 L 360 720 L 0 720 Z" fill="#0f172a"/>
      <path d="M 110 650 Q 150 510, 130 370" stroke="#0f172a" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 130 370 Q 80 330, 40 370 M 130 370 Q 110 310, 70 290 M 130 370 Q 180 300, 210 320" stroke="#047857" stroke-width="8" fill="none" stroke-linecap="round"/>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        ${defs}
      </defs>
      ${content}
    </svg>
  `.trim();
}

function fallbackSceneExtractor(text) {
  const sentences = text.split(/[.!?।]+/).map(s => s.trim()).filter(s => s.length > 5);
  if (sentences.length === 0) {
    sentences.push(text);
  }

  const numScenes = Math.min(3, Math.max(1, sentences.length));
  const scenes = [];
  const chunkSize = Math.ceil(sentences.length / numScenes);

  for (let i = 0; i < numScenes; i++) {
    const chunkSentences = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    const subtitle = chunkSentences.join('. ');
    scenes.push({
      prompt: `2D animated storybook art style, vibrant Ghibli aesthetic, scenic landscape in Kerala with lush green trees, water, and warm atmospheric lighting, cinematic 16:9`,
      subtitle: subtitle
    });
  }
  return scenes;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  // Endpoint: POST /api/tts
  if (pathname === '/api/tts' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');

    try {
      const body = await readJsonBody(req);
      const { text, voice = 'Sobhana', engine = 'unlimited', style = 'conversational', customApiKey } = body;

      if (!text || !text.trim()) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Malayalam text is required.' }));
        return;
      }

      // 1. Microsoft Edge Neural Engine (Sobhana & Midhun - 100% Free & Unlimited)
      if (engine === 'edge' || engine === 'unlimited' || voice === 'Sobhana' || voice === 'Midhun') {
        const isMale = voice && voice.toLowerCase().includes('midhun');
        const selectedVoiceLabel = isMale ? 'Midhun (Edge Neural Male)' : 'Sobhana (Edge Neural Female)';
        console.log(`[TTS] Using Microsoft Edge Neural TTS | Voice: ${selectedVoiceLabel}`);

        try {
          const audioBuffer = await generateEdgeTTS(text, isMale ? 'Midhun' : 'Sobhana');
          console.log(`[TTS] Edge Neural audio generated: ${Math.round(audioBuffer.length / 1024)} KB`);

          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            audioBase64: audioBuffer.toString('base64'),
            mimeType: 'audio/mpeg',
            voiceUsed: selectedVoiceLabel,
            engineUsed: 'Microsoft Edge Neural (Unlimited Free)'
          }));
          return;
        } catch (err) {
          console.error('[TTS] Edge Neural error, trying HTTP fallback:', err.message);
          try {
            const fallbackBuffer = await generateFreeHTTPTTS(text);
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              audioBase64: fallbackBuffer.toString('base64'),
              mimeType: 'audio/mpeg',
              voiceUsed: 'Malayalam Free Voice (Fallback)',
              engineUsed: 'Free HTTP Fallback'
            }));
            return;
          } catch (fbErr) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Edge TTS error: ' + err.message }));
            return;
          }
        }
      }

      // 2. Google Gemini 3.8 Engine
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.writeHead(401);
        res.end(JSON.stringify({
          error: 'No Gemini API key provided. Switch to "Unlimited Free Engine" tab or enter your key in settings.',
          code: 'MISSING_API_KEY'
        }));
        return;
      }

      const selectedStylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.conversational;
      console.log(`[TTS] Using Gemini 3.8 Flash TTS | Voice: ${voice}`);

      const result = await callGeminiTTS(apiKey, text, voice, selectedStylePrompt);

      if (!result.ok) {
        const errMsg = result.data?.error?.message || 'Google Gemini API error';
        console.error('[TTS] Gemini API Error:', result.data);
        res.writeHead(result.status);
        res.end(JSON.stringify({
          error: errMsg,
          details: result.data?.error
        }));
        return;
      }

      const candidate = result.data.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find(p => p.inlineData);
      if (!audioPart || !audioPart.inlineData) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Model did not return audio data.' }));
        return;
      }

      let { mimeType, data: base64Data } = audioPart.inlineData;
      let audioBuffer = Buffer.from(base64Data, 'base64');

      const isWav = audioBuffer.slice(0, 4).toString() === 'RIFF';
      if (!isWav) {
        audioBuffer = pcmToWav(audioBuffer, 24000, 1, 16);
        mimeType = 'audio/wav';
        base64Data = audioBuffer.toString('base64');
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        audioBase64: base64Data,
        mimeType: mimeType || 'audio/wav',
        voiceUsed: voice,
        engineUsed: 'Google Gemini 3.8 Flash TTS'
      }));

    } catch (err) {
      console.error('[TTS] Error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        error: err.message || 'An unexpected error occurred while generating audio.'
      }));
    }
    return;
  }

  // Endpoint: POST /api/scenes
  if (pathname === '/api/scenes' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');

    try {
      const body = await readJsonBody(req);
      const { text, customApiKey } = body;

      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      let scenes;

      if (apiKey) {
        scenes = await callGeminiSceneBreakdown(apiKey, text);
      } else {
        scenes = fallbackSceneExtractor(text);
      }

      res.writeHead(200);
      res.end(JSON.stringify({ success: true, scenes }));
    } catch (err) {
      console.error('[Scenes] Error:', err);
      const scenes = fallbackSceneExtractor(text || '');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, scenes }));
    }
    return;
  }

  // Endpoint: GET /api/image-proxy (Instant 2D Vector Storybook Scene)
  if (pathname === '/api/image-proxy' && req.method === 'GET') {
    const prompt = urlObj.searchParams.get('prompt') || '';
    const subtitle = urlObj.searchParams.get('subtitle') || '';

    // Generate Instant, crisp 1280x720 2D Storybook Scene matching the story keywords
    const svgContent = getStorybookSceneSVG(prompt, subtitle);

    res.writeHead(200, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400'
    });
    res.end(svgContent);
    return;
  }

  // Static File Serving
  if (req.method === 'GET' || req.method === 'HEAD') {
    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        filePath = path.join(PUBLIC_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Malayalam AI Voice & 2D Video TTS Server running!`);
  console.log(`Local Access: http://localhost:${PORT}`);
  console.log(`Network/Mobile Access: http://0.0.0.0:${PORT}`);
});
