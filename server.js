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

// --- UNLIMITED FREE MALAYALAM VOICE (ZERO API KEY, ZERO LIMITS) ---
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

      // 1. Unlimited Free Engine (Zero API key needed)
      if (engine === 'unlimited' || voice === 'Sobhana' || voice === 'Malavika' || voice === 'Rahul' || voice === 'Unlimited') {
        console.log(`[TTS] Using Unlimited Free Malayalam Engine (Zero Key Needed)`);
        try {
          const audioBuffer = await generateFreeHTTPTTS(text);
          console.log(`[TTS] Free audio generated: ${Math.round(audioBuffer.length / 1024)} KB`);

          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            audioBase64: audioBuffer.toString('base64'),
            mimeType: 'audio/mpeg',
            voiceUsed: voice === 'Rahul' ? 'Rahul (Unlimited Free)' : 'Malavika (Unlimited Free)',
            engineUsed: 'Unlimited Free Engine (No Key Needed)'
          }));
          return;
        } catch (err) {
          console.error('[TTS] Free Voice error:', err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Free voice error: ' + err.message }));
          return;
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

  // Endpoint: GET /api/image-proxy
  if (pathname === '/api/image-proxy' && req.method === 'GET') {
    const prompt = urlObj.searchParams.get('prompt');
    const seed = urlObj.searchParams.get('seed') || Math.floor(Math.random() * 100000);

    if (!prompt) {
      res.writeHead(400);
      res.end('Prompt is required');
      return;
    }

    try {
      const fullPrompt = `${prompt}, vibrant 2D anime storybook illustration, Ghibli style, detailed scenery, cinematic lighting, 16:9 widescreen`;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;

      const imgRes = await fetch(pollinationsUrl);
      if (!imgRes.ok) {
        throw new Error(`Pollinations error: ${imgRes.status}`);
      }

      const buffer = await imgRes.arrayBuffer();
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      res.end(Buffer.from(buffer));
    } catch (err) {
      console.error('[Image Proxy] Error:', err);
      res.writeHead(500);
      res.end('Failed to fetch scene image');
    }
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
