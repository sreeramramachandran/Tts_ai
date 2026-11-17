// Vercel Serverless Function: /api/tts
const { createHash } = require('crypto');

const CHROMIUM_FULL_VERSION = '130.0.2849.68';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WINDOWS_FILE_TIME_EPOCH = 11644473600n;

function generateSecMsGecToken() {
  const ticks = BigInt(Math.floor((Date.now() / 1000) + Number(WINDOWS_FILE_TIME_EPOCH))) * 10000000n;
  const roundedTicks = ticks - (ticks % 3000000000n);
  const strToHash = `${roundedTicks}${TRUSTED_CLIENT_TOKEN}`;
  const hash = createHash('sha256');
  hash.update(strToHash, 'ascii');
  return hash.digest('hex').toUpperCase();
}

function generateEdgeTTS(text, voice = 'Sobhana') {
  return new Promise((resolve, reject) => {
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

    const voiceName = voice.toLowerCase().includes('midhun')
      ? 'Microsoft Server Speech Text to Speech Voice (ml-IN, MidhunNeural)'
      : 'Microsoft Server Speech Text to Speech Voice (ml-IN, SobhanaNeural)';

    const token = generateSecMsGecToken();
    const wssUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?trustedclientid=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${token}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`;

    const ws = new WebSocket(wssUrl, {
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_FULL_VERSION} Safari/537.36 Edg/${CHROMIUM_FULL_VERSION}`
      }
    });

    const audioChunks = [];
    const requestId = createHash('md5').update(Date.now().toString()).digest('hex');

    const timeout = setTimeout(() => {
      try { ws.close(); } catch (e) {}
      if (audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      } else {
        reject(new Error('Edge TTS timed out.'));
      }
    }, 20000);

    ws.onopen = () => {
      const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
              }
            }
          }
        });
      ws.send(configMsg);

      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n` +
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ml-IN'>` +
        `<voice name='${voiceName}'>${cleanText}</voice></speak>`;
      ws.send(ssmlMsg);
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          clearTimeout(timeout);
          ws.close();
          resolve(Buffer.concat(audioChunks));
        }
      } else if (event.data instanceof ArrayBuffer || Buffer.isBuffer(event.data)) {
        const buf = Buffer.isBuffer(event.data) ? event.data : Buffer.from(event.data);
        if (buf.length > 2) {
          const headerLength = buf.readUInt16BE(0);
          const header = buf.subarray(2, 2 + headerLength).toString('latin1');
          const body = buf.subarray(2 + headerLength);
          if (header.includes('Path:audio')) {
            audioChunks.push(body);
          }
        }
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timeout);
      if (audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      } else {
        reject(new Error('Edge TTS WebSocket connection failed.'));
      }
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      if (audioChunks.length > 0) {
        resolve(Buffer.concat(audioChunks));
      }
    };
  });
}

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

async function callGemini(apiKey, text, voice, stylePrompt, modelName) {
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
    throw err;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { text, voice = 'Sobhana', engine = 'edge', style = 'conversational', customApiKey } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Malayalam text is required.' });
    }

    const isEdge = engine === 'edge' || voice === 'Sobhana' || voice === 'Midhun';
    if (isEdge) {
      const audioBuffer = await generateEdgeTTS(text, voice);
      return res.json({
        success: true,
        audioBase64: audioBuffer.toString('base64'),
        mimeType: 'audio/mpeg',
        voiceUsed: voice,
        engineUsed: 'Microsoft Edge Neural (Unlimited Free)'
      });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error: 'No Gemini API key provided. Switch to Microsoft Edge (Unlimited Free) or enter your key in settings.',
        code: 'MISSING_API_KEY'
      });
    }

    const selectedStylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.conversational;
    let modelUsed = 'gemini-3.8-flash-tts';
    let result = await callGemini(apiKey, text, voice, selectedStylePrompt, modelUsed);

    if (!result.ok) {
      const errMsg = result.data?.error?.message || 'Google Gemini API error';
      return res.status(result.status).json({
        error: errMsg,
        details: result.data?.error
      });
    }

    const candidate = result.data.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData);
    if (!audioPart || !audioPart.inlineData) {
      return res.status(500).json({ error: 'Model did not return audio data.' });
    }

    let { mimeType, data: base64Data } = audioPart.inlineData;
    let audioBuffer = Buffer.from(base64Data, 'base64');

    const isWav = audioBuffer.slice(0, 4).toString() === 'RIFF';
    if (!isWav) {
      audioBuffer = pcmToWav(audioBuffer, 24000, 1, 16);
      mimeType = 'audio/wav';
      base64Data = audioBuffer.toString('base64');
    }

    return res.json({
      success: true,
      audioBase64: base64Data,
      mimeType: mimeType || 'audio/wav',
      voiceUsed: voice,
      engineUsed: 'Google Gemini 3.8 Flash TTS'
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred while generating audio.'
    });
  }
};
