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

// --- SCRIPT ANALYSIS & SCREENPLAY GENERATOR (AI + LOCAL MALAYALAM NLP) ---
function analyzeMalayalamScreenplayLocal(text = '') {
  const sentences = text
    .split(/([.!?।\n]+)/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !/^[.!?।\n]+$/.test(s));

  if (sentences.length === 0) {
    sentences.push(text.trim() || 'ഒരു മനോഹരമായ കഥ.');
  }

  const numScenes = Math.min(4, Math.max(1, sentences.length));
  const chunkSize = Math.ceil(sentences.length / numScenes);
  const screenplay = [];

  for (let i = 0; i < numScenes; i++) {
    const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    const dialogue = chunk.join(' ');
    const lower = dialogue.toLowerCase();

    // 1. Setting Analysis
    let setting = 'kerala_village';
    if (/വള്ളം|തോണി|പുഴയിലേക്ക്|പുഴയിൽ|തുഴഞ്ഞു|ഇറങ്ങി|കടലിൽ|വലയെറിഞ്ഞു/.test(lower) && i > 0) {
      setting = 'river_boat';
    } else if (/പുഴ|കടൽ|തീരം|തോണി|വള്ളം|മീൻ|മത്സ്യം|വെള്ളം|river|boat|fish/.test(lower)) {
      setting = i === 0 ? 'thatched_hut' : 'river_boat';
    } else if (/കുടിൽ|വീട്|ഗ്രാമം|താമസിച്ചിരുന്നു|മുറി|house|hut|village/.test(lower)) {
      setting = 'thatched_hut';
    } else if (/കാട്|മരം|തോട്ടം|വനം|forest|jungle|tree/.test(lower)) {
      setting = 'forest_jungle';
    } else if (/രാത്രി|ഇരുട്ട്|ചന്ദ്രൻ|തീ|campfire|night/.test(lower)) {
      setting = 'night_campfire';
    } else if (/പാറ|മല|കുന്ന്|rock|mountain/.test(lower)) {
      setting = 'rocky_mountain';
    }

    // 2. Time & Weather Analysis
    let timeOfDay = 'dawn_sunrise';
    if (/രാത്രി|ഇരുട്ട്|അർദ്ധരാത്രി|ചന്ദ്രൻ|night|dark/.test(lower)) {
      timeOfDay = 'night';
    } else if (/വൈകുന്നേരം|അസ്തമയം|സന്ധ്യ|sunset|evening/.test(lower)) {
      timeOfDay = 'sunset';
    } else if (/ഉച്ച|വെയിൽ|പകൽ|noon|day/.test(lower)) {
      timeOfDay = 'daylight';
    } else if (/രാവിലെ|സൂര്യൻ ഉദിക്കും|പ്രഭാതം|morning|sunrise/.test(lower)) {
      timeOfDay = 'dawn_sunrise';
    }

    let weather = 'clear';
    if (/മഴ|തുള്ളി|കാറ്റ്|ഇടിമിന്നൽ|rain|storm/.test(lower)) {
      weather = 'rain';
    }

    // 3. Character Analysis (Old Man, Hunter, Boy, etc.)
    let charType = 'man';
    if (/വയസ്സനായ|മുത്തശ്ശൻ|മീൻപിടുത്തക്കാരൻ|വൃദ്ധൻ|old/.test(lower)) {
      charType = 'old_man';
    } else if (/വേട്ടക്കാരൻ|വില്ല്|hunter/.test(lower)) {
      charType = 'hunter';
    } else if (/കുട്ടി|ബാലൻ|മകൻ|boy|child/.test(lower)) {
      charType = 'young_boy';
    } else if (/പെൺകുട്ടി|സ്ത്രീ|അമ്മ|girl|woman/.test(lower)) {
      charType = 'woman';
    }

    let charPose = 'walking';
    if (setting === 'river_boat' || /വള്ളത്തിൽ|തോണിയിൽ|തുഴഞ്ഞു/.test(lower)) {
      charPose = 'in_boat';
    } else if (/സംസാരിക്കാൻ തുടങ്ങി|പ്രത്യക്ഷപ്പെട്ടു|അത്ഭുത|ഞെട്ടി|പേടിച്ചു|ഭയന്നു|surprised|shocked/.test(lower)) {
      charPose = 'standing_surprised';
    } else if (/ഇരുന്നു|വിശ്രമിച്ചു|തീയുടെ അടുത്ത്|sitting/.test(lower)) {
      charPose = 'sitting';
    } else if (/നടന്നു|പോയി|ഇറങ്ങി|യാത്ര|walking/.test(lower)) {
      charPose = 'walking';
    }

    let charProp = 'none';
    if (setting === 'river_boat') {
      charProp = 'oar';
    } else if (/വില്ല്|അമ്പ്|bow/.test(lower)) {
      charProp = 'bow';
    } else if (/വല|മീൻപിടുത്ത/.test(lower)) {
      charProp = 'fishing_net';
    } else if (/വടി|ഊന്നുവടി|stick/.test(lower) || charType === 'old_man') {
      charProp = 'walking_stick';
    } else if (/മഴ|കുട|umbrella/.test(lower)) {
      charProp = 'umbrella';
    }

    let charEmotion = 'happy';
    if (/\[laugh\]|\[giggle\]|ചിരി|പൊട്ടിച്ചിരി|തമാശ/.test(lower)) {
      charEmotion = 'laughing';
    } else if (/സംസാരിക്കാൻ തുടങ്ങി|പ്രത്യക്ഷപ്പെട്ടു|അത്ഭുതം|ഞെട്ടി|shocked|amazed/.test(lower)) {
      charEmotion = 'shocked';
    } else if (/പേടി|ഭയം|ഭയന്നു|വിറച്ചു|scared/.test(lower)) {
      charEmotion = 'scared';
    } else if (/രഹസ്യം|whisper|മന്ത്രിച്ചു/.test(lower)) {
      charEmotion = 'curious';
    }

    // 4. Objects Detection
    const objects = [];
    if (/വള്ളം|തോണി|boat|canoe/.test(lower) || setting === 'river_boat') objects.push('wooden_boat');
    if (/മീൻ|മത്സ്യം|സ്വർണ്ണ മത്സ്യം|fish|golden/.test(lower)) objects.push('golden_fish');
    if (/കുടിൽ|വീട്|cottage|hut/.test(lower) || setting === 'thatched_hut') objects.push('thatched_hut');
    if (/പുഴ|കടൽ|വെള്ളം|river|water/.test(lower) || setting === 'river_boat') objects.push('river_water');
    if (/പാറ|കല്ല്|rock|boulder/.test(lower) || setting === 'rocky_mountain') objects.push('boulders_rocks');
    if (/തീ|campfire|fire/.test(lower) || setting === 'night_campfire') objects.push('campfire');
    if (/മരം|വൃക്ഷം|തോട്ടം|tree|forest/.test(lower) || setting === 'forest_jungle') objects.push('tall_trees');
    if (setting === 'kerala_village' || setting === 'thatched_hut' || setting === 'river_boat') objects.push('coconut_palms');

    // 5. Scene Title
    let title = `രംഗം ${i + 1}`;
    if (setting === 'river_boat') {
      title = objects.includes('golden_fish') ? `രംഗം ${i + 1}: അത്ഭുത സ്വർണ്ണ മത്സ്യത്തിന്റെ വരവ്` : `രംഗം ${i + 1}: പുഴയിലെ വള്ളത്തിൽ`;
    } else if (setting === 'thatched_hut') {
      title = `രംഗം ${i + 1}: പുഴയോരത്തെ ഗ്രാമവും കുടിലും`;
    } else if (setting === 'forest_jungle') {
      title = `രംഗം ${i + 1}: വനത്തിലൂടെയുള്ള യാത്ര`;
    } else if (setting === 'night_campfire') {
      title = `രംഗം ${i + 1}: രാത്രിയിലെ തീകൂമ്പാരം`;
    } else if (setting === 'rocky_mountain') {
      title = `രംഗം ${i + 1}: മലനിരകളും പാറക്കൂട്ടങ്ങളും`;
    } else {
      title = `രംഗം ${i + 1}: കഥയുടെ തുടക്കം`;
    }

    screenplay.push({
      scene_number: i + 1,
      title: title,
      dialogue: dialogue,
      subtitle: dialogue,
      prompt: `2D comic storybook style: ${charType} (${charPose}) in ${setting} with ${objects.join(', ')} at ${timeOfDay}`,
      setting: setting,
      time_of_day: timeOfDay,
      weather: weather,
      character: {
        type: charType,
        pose: charPose,
        prop: charProp,
        emotion: charEmotion
      },
      objects: objects,
      animation_notes: `2D comic animation of ${charType} (${charPose}, ${charEmotion}) in ${setting} with ${objects.join(', ')}.`
    });
  }

  return screenplay;
}

async function callGeminiScreenplay(apiKey, text) {
  const systemPrompt = `You are an expert 2D cartoon animator and screenwriter (Prehistoric Mallu comic storytelling style).
Analyze the provided Malayalam story script and break it down into a scene-by-scene screenplay (2 to 4 scenes).
For each scene, output a JSON object with:
- "scene_number": Integer starting from 1
- "title": Short Malayalam scene title (e.g. 'പുഴയോരത്തെ ഗ്രാമം', 'വള്ളത്തിലെ യാത്ര', 'സ്വർണ്ണ മത്സ്യത്തിന്റെ വരവ്')
- "dialogue": The exact Malayalam narration text for this scene
- "setting": One of ['thatched_hut', 'river_boat', 'kerala_village', 'forest_jungle', 'night_campfire', 'rocky_mountain', 'open_field']
- "time_of_day": One of ['dawn_sunrise', 'daylight', 'sunset', 'night']
- "weather": One of ['clear', 'rain', 'windy']
- "character": Object with:
    - "type": One of ['old_man', 'man', 'young_boy', 'woman', 'hunter']
    - "pose": One of ['walking', 'in_boat', 'standing_surprised', 'sitting', 'talking', 'casting_net']
    - "prop": One of ['oar', 'walking_stick', 'fishing_net', 'fishing_rod', 'bow', 'umbrella', 'none']
    - "emotion": One of ['happy', 'laughing', 'shocked', 'scared', 'curious', 'neutral']
- "objects": Array of specific items mentioned or relevant to the scene (e.g. ['wooden_boat', 'golden_fish', 'thatched_hut', 'coconut_palms'])
- "animation_notes": Brief 1-sentence note describing the action in this shot.

Output ONLY a valid JSON array of these scene objects.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt + '\n\nMalayalam Story Script:\n' + text }
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
      throw new Error(responseData.error?.message || 'Failed to extract screenplay');
    }

    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const screenplay = JSON.parse(cleanedJson);
    if (Array.isArray(screenplay) && screenplay.length > 0) {
      // Ensure backward compatibility
      screenplay.forEach(sc => {
        if (!sc.subtitle) sc.subtitle = sc.dialogue;
        if (!sc.prompt) sc.prompt = `2D comic storybook style: ${sc.character?.type || 'man'} in ${sc.setting || 'kerala_village'}`;
      });
      return screenplay;
    }
    return analyzeMalayalamScreenplayLocal(text);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Screenplay] Gemini error or timeout, using local screenplay analyzer:', err.message);
    return analyzeMalayalamScreenplayLocal(text);
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
  if (/രാത്രി|ചന്ദ്രൻ|നക്ഷത്രം|ഇരുട്ട്|രഹസ്യം|തീ|night|moon|star|dark|midnight|shadow|campfire|fire/.test(lower)) {
    return 'night';
  }
  // Default to the iconic prehistoric savannah hut scene (exact match to user YouTube reference)
  return 'savannah_hut';
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
        <stop offset="70%" stop-color="#f472b6"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="40%" stop-color="#0369a1"/>
        <stop offset="100%" stop-color="#075985"/>
      </linearGradient>
    `;
    content = `
      <!-- Sunrise Sun -->
      <circle cx="640" cy="290" r="75" fill="#fef08a"/>
      <!-- Misty Kerala Hills -->
      <path d="M0 370 Q 250 300, 500 360 T 950 330 T 1280 360 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.45"/>
      <path d="M0 395 Q 320 335, 680 395 T 1280 370 L 1280 720 L 0 720 Z" fill="#334155" opacity="0.6"/>
      <!-- Water Surface -->
      <rect x="0" y="420" width="1280" height="300" fill="url(#waterGrad)"/>
      <line x1="0" y1="420" x2="1280" y2="420" stroke="#111827" stroke-width="3.5"/>
      <!-- Water Ripples -->
      <ellipse cx="640" cy="470" rx="140" ry="7" fill="#bae6fd" opacity="0.55"/>
      <ellipse cx="640" cy="510" rx="110" ry="6" fill="#bae6fd" opacity="0.45"/>
      <ellipse cx="640" cy="560" rx="80" ry="5" fill="#bae6fd" opacity="0.35"/>
      <!-- Left Riverbank & Palm Tree -->
      <path d="M0 450 Q 180 430, 280 520 L 280 720 L 0 720 Z" fill="#0f172a"/>
      <path d="M 80 620 Q 120 480, 100 340" stroke="#78350f" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M 100 340 Q 50 310, 10 350 M 100 340 Q 80 285, 40 265 M 100 340 Q 145 270, 185 295 M 100 340 Q 155 325, 180 375" stroke="#047857" stroke-width="9" fill="none" stroke-linecap="round"/>
      <!-- Wooden Canoe (Vallam) & Prehistoric Mallu Fisherman -->
      <g transform="translate(680, 520)">
        <ellipse cx="0" cy="25" rx="110" ry="8" fill="#075985" opacity="0.4"/>
        <path d="M -110 12 Q 0 48, 110 12 Q 80 -5, 0 0 Q -80 -5, -110 12 Z" fill="#5c3a1e" stroke="#111827" stroke-width="4.5"/>
        <path d="M -90 16 Q 0 34, 90 16" stroke="#3d2412" stroke-width="2.5" fill="none"/>
        <!-- Fisherman Character -->
        <g transform="translate(0, 12)">
          <line x1="-5" y1="-75" x2="0" y2="0" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M -16 -15 L 16 -15 L 20 15 L 0 28 L -18 12 Z" fill="#8c572a" stroke="#111827" stroke-width="3.5"/>
          <circle cx="-5" cy="-110" r="32" fill="#ffffff" stroke="#111827" stroke-width="4.5"/>
          <!-- Curly Hair -->
          <g fill="#111827">
            <circle cx="-27" cy="-132" r="10"/><circle cx="-19" cy="-142" r="11"/>
            <circle cx="-7" cy="-146" r="12"/><circle cx="6" cy="-144" r="11"/>
            <circle cx="17" cy="-134" r="10"/><circle cx="-33" cy="-122" r="9"/>
            <circle cx="-35" cy="-110" r="9"/>
          </g>
          <circle cx="-2" cy="-113" r="3.8" fill="#111827"/>
          <circle cx="15" cy="-112" r="3.8" fill="#111827"/>
          <path d="M 5 -99 Q 12 -94, 18 -99" stroke="#111827" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- Paddle -->
          <line x1="12" y1="-45" x2="45" y2="65" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
          <ellipse cx="45" cy="65" rx="10" ry="22" transform="rotate(20 45 65)" fill="#78350f"/>
        </g>
      </g>
      <!-- Jumping Golden Fish -->
      <g transform="translate(890, 430) rotate(-20)">
        <ellipse cx="0" cy="0" rx="24" ry="12" fill="#f59e0b" stroke="#111827" stroke-width="3"/>
        <polygon points="-20,0 -34,-10 -30,0 -34,10" fill="#fbbf24" stroke="#111827" stroke-width="2"/>
        <circle cx="14" cy="-3" r="3.5" fill="#ffffff"/>
        <circle cx="15" cy="-3" r="2" fill="#111827"/>
      </g>
    `;
  } else if (theme === 'forest') {
    defs = `
      <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="50%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#6ee7b7"/>
      </linearGradient>
    `;
    content = `
      <rect width="1280" height="720" fill="url(#forestSky)"/>
      <polygon points="300,0 450,0 750,720 500,720" fill="#fef08a" opacity="0.12"/>
      <polygon points="650,0 800,0 1100,720 850,720" fill="#fef08a" opacity="0.10"/>
      <rect x="160" y="0" width="70" height="720" fill="#022c22"/>
      <rect x="720" y="0" width="85" height="720" fill="#022c22"/>
      <rect x="1040" y="0" width="95" height="720" fill="#022c22"/>
      <path d="M0 520 Q 350 470, 700 530 T 1280 510 L 1280 720 L 0 720 Z" fill="#065f46" stroke="#111827" stroke-width="4"/>
      <circle cx="195" cy="150" r="140" fill="#047857"/>
      <circle cx="760" cy="120" r="160" fill="#047857"/>
      <circle cx="1080" cy="160" r="170" fill="#047857"/>
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
      <circle cx="150" cy="120" r="2" fill="#fff" opacity="0.9"/>
      <circle cx="280" cy="80" r="2.5" fill="#fff" opacity="0.8"/>
      <circle cx="420" cy="150" r="2" fill="#fff" opacity="0.7"/>
      <circle cx="780" cy="90" r="2.5" fill="#fff" opacity="0.9"/>
      <circle cx="1100" cy="110" r="2" fill="#fff" opacity="0.95"/>
      <circle cx="1000" cy="160" r="55" fill="#fef08a"/>
      <circle cx="1020" cy="150" r="50" fill="#1e1b4b"/>
      <path d="M0 520 Q 600 470, 1280 500 L 1280 720 L 0 720 Z" fill="#020617" stroke="#111827" stroke-width="4"/>
      <!-- Campfire -->
      <g transform="translate(640, 540)">
        <line x1="-25" y1="8" x2="25" y2="-4" stroke="#78350f" stroke-width="8"/>
        <line x1="-25" y1="-4" x2="25" y2="8" stroke="#78350f" stroke-width="8"/>
        <circle cx="0" cy="-20" r="60" fill="#f97316" opacity="0.2"/>
        <path d="M -18 0 Q -10 -35, 0 -45 Q 10 -35, 18 0 Z" fill="#f97316"/>
        <path d="M -10 0 Q 0 -25, 10 0 Z" fill="#fde047"/>
      </g>
    `;
  } else {
    // Savannah Thatched Hut Scene (Exact Prehistoric Mallu Reference)
    defs = `
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#94a3b8"/>
        <stop offset="35%" stop-color="#cbd5e1"/>
        <stop offset="70%" stop-color="#fed7aa"/>
        <stop offset="100%" stop-color="#fef08a"/>
      </linearGradient>
      <linearGradient id="hutWallGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#b07d4b"/>
        <stop offset="40%" stop-color="#d4a36e"/>
        <stop offset="100%" stop-color="#a06e3d"/>
      </linearGradient>
      <linearGradient id="thatchGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e8bf7a"/>
        <stop offset="60%" stop-color="#d4a359"/>
        <stop offset="100%" stop-color="#b58238"/>
      </linearGradient>
    `;
    content = `
      <!-- Sky -->
      <rect width="1280" height="720" fill="url(#skyGrad)"/>
      <circle cx="680" cy="70" r="1.5" fill="#ffffff" opacity="0.8"/>
      <circle cx="850" cy="110" r="1.5" fill="#ffffff" opacity="0.7"/>
      <circle cx="1020" cy="55" r="2" fill="#ffffff" opacity="0.9"/>
      <circle cx="1180" cy="95" r="1.5" fill="#ffffff" opacity="0.6"/>

      <!-- Golden Semicircle Sun on Horizon -->
      <circle cx="960" cy="420" r="95" fill="#facc15" stroke="#111827" stroke-width="4.5"/>
      <circle cx="960" cy="420" r="140" fill="#fde047" opacity="0.2"/>

      <!-- Savannah Horizon Line & Ground Sand -->
      <rect x="0" y="420" width="1280" height="300" fill="#e7c689"/>
      <line x1="0" y1="420" x2="1280" y2="420" stroke="#111827" stroke-width="4"/>

      <!-- Acacia Tree -->
      <g transform="translate(1160, 420)">
        <path d="M -10 0 Q -5 -60, -2 -90 L -25 -130 M -2 -90 Q 5 -115, 25 -135 M -2 -90 L 0 -140" stroke="#78350f" stroke-width="7" fill="none" stroke-linecap="round"/>
        <ellipse cx="-25" cy="-135" rx="42" ry="12" fill="#6b9080" stroke="#111827" stroke-width="3"/>
        <ellipse cx="25" cy="-140" rx="38" ry="11" fill="#6b9080" stroke="#111827" stroke-width="3"/>
        <ellipse cx="0" cy="-146" rx="50" ry="14" fill="#84a98c" stroke="#111827" stroke-width="3"/>
      </g>

      <!-- Cartoon Bushes -->
      <g fill="#84a98c" stroke="#111827" stroke-width="3.5">
        <path d="M 600 420 Q 590 385, 620 380 Q 640 360, 670 380 Q 700 385, 695 420 Z"/>
        <path d="M 780 420 Q 795 400, 815 400 Q 835 395, 850 420 Z"/>
        <path d="M 1060 420 Q 1050 390, 1080 385 Q 1105 365, 1130 385 Q 1155 390, 1150 420 Z"/>
      </g>

      <!-- Ground details -->
      <g stroke="#111827" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M 740 450 L 736 440 M 740 450 L 744 442"/>
        <path d="M 920 470 L 916 460 M 920 470 L 925 462"/>
        <line x1="560" y1="480" x2="585" y2="480"/>
        <line x1="840" y1="510" x2="870" y2="510"/>
      </g>

      <!-- Thatched Mud Hut (Left) -->
      <g>
        <path d="M -20 640 L 0 360 Q 180 330, 360 360 L 330 640 Z" fill="url(#hutWallGrad)" stroke="#111827" stroke-width="4.5"/>
        <g stroke="#8c5e34" stroke-width="3" stroke-linecap="round">
          <line x1="60" y1="390" x2="65" y2="510"/>
          <line x1="100" y1="430" x2="103" y2="550"/>
          <line x1="300" y1="420" x2="296" y2="530"/>
        </g>
        <!-- Dark Doorway -->
        <path d="M 140 640 L 140 380 Q 200 360, 260 380 L 260 640 Z" fill="#2d1c10" stroke="#111827" stroke-width="4.5"/>
        <line x1="140" y1="370" x2="140" y2="640" stroke="#6e4222" stroke-width="7" stroke-linecap="round"/>
        <line x1="260" y1="370" x2="260" y2="640" stroke="#6e4222" stroke-width="7" stroke-linecap="round"/>
        <!-- Straw Conical Roof -->
        <path d="M -40 370 Q 170 50, 390 370 Z" fill="url(#thatchGrad)" stroke="#111827" stroke-width="4.5"/>
        <path d="M -40 370 Q -20 385, 0 370 Q 20 385, 40 370 Q 60 385, 80 370 Q 100 385, 120 370 Q 140 385, 160 370 Q 180 385, 200 370 Q 220 385, 240 370 Q 260 385, 280 370 Q 300 385, 320 370 Q 340 385, 360 370 Q 380 385, 390 370" fill="none" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Straw hatch lines -->
        <g stroke="#111827" stroke-width="2.5" stroke-linecap="round">
          <line x1="50" y1="190" x2="40" y2="230"/>
          <line x1="90" y1="140" x2="75" y2="195"/>
          <line x1="150" y1="120" x2="140" y2="200"/>
          <line x1="210" y1="130" x2="225" y2="205"/>
          <line x1="270" y1="160" x2="290" y2="235"/>
          <line x1="110" y1="250" x2="95" y2="310"/>
        </g>
      </g>

      <!-- Prehistoric Mallu Character (Walking out from the doorway) -->
      <g transform="translate(480, 560)">
        <path d="M 6 -70 L 41 -35 L 63 0" stroke="#111827" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="-4" y1="-140" x2="0" y2="-75" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M -16 -90 L 16 -90 L 20 -60 L 0 -47 L -18 -63 Z" fill="#8c572a" stroke="#111827" stroke-width="3.5"/>
        <path d="M -8 -72 L -46 -34 L -68 0" stroke="#111827" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="1" y1="-130" x2="-20" y2="-85" stroke="#111827" stroke-width="3"/>
        <ellipse cx="-20" cy="-83" rx="12" ry="14" fill="#78350f" stroke="#111827" stroke-width="3"/>
        <g fill="#ffffff" stroke="#111827" stroke-width="2">
          <circle cx="-16" cy="-132" r="2.5"/><circle cx="-10" cy="-130" r="2.5"/>
          <circle cx="-4" cy="-128" r="2.5"/><circle cx="2" cy="-130" r="2.5"/>
          <circle cx="8" cy="-132" r="2.5"/>
        </g>
        <circle cx="-4" cy="-175" r="32" fill="#ffffff" stroke="#111827" stroke-width="4.5"/>
        <g fill="#111827">
          <circle cx="-26" cy="-197" r="10"/><circle cx="-18" cy="-207" r="11"/>
          <circle cx="-6" cy="-211" r="12"/><circle cx="7" cy="-209" r="11"/>
          <circle cx="18" cy="-199" r="10"/><circle cx="-32" cy="-187" r="9"/>
          <circle cx="-34" cy="-175" r="9"/>
        </g>
        <circle cx="-5" cy="-178" r="3.8" fill="#111827"/>
        <circle cx="12" cy="-177" r="3.8" fill="#111827"/>
        <path d="M 2 -166 Q 8 -161, 14 -166" stroke="#111827" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M -12 -130 L -32 -102 L -36 -75" stroke="#111827" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M 4 -130 L 28 -102 L 51 -95" stroke="#111827" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <!-- Hunting Bow -->
        <g>
          <path d="M 85 -150 Q 25 -85, 8 -61" stroke="#6e4222" stroke-width="6.5" fill="none" stroke-linecap="round"/>
          <line x1="85" y1="-150" x2="8" y2="-61" stroke="#cbd5e1" stroke-width="2"/>
        </g>
      </g>
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

  // Endpoint: POST /api/screenplay or POST /api/scenes
  if ((pathname === '/api/screenplay' || pathname === '/api/scenes') && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');

    try {
      const body = await readJsonBody(req);
      const { text, customApiKey } = body;

      if (!text || !text.trim()) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Malayalam script text is required.' }));
        return;
      }

      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      let screenplay;

      if (apiKey) {
        screenplay = await callGeminiScreenplay(apiKey, text);
      } else {
        screenplay = analyzeMalayalamScreenplayLocal(text);
      }

      console.log(`[Screenplay] Analyzed script into ${screenplay.length} scenes.`);

      res.writeHead(200);
      res.end(JSON.stringify({ 
        success: true, 
        screenplay: screenplay,
        scenes: screenplay // backward compatibility
      }));
    } catch (err) {
      console.error('[Screenplay] Error:', err);
      const screenplay = analyzeMalayalamScreenplayLocal(text || '');
      res.writeHead(200);
      res.end(JSON.stringify({ 
        success: true, 
        screenplay: screenplay,
        scenes: screenplay
      }));
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
