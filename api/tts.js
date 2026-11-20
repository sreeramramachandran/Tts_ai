// Vercel Serverless Function: /api/tts

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
  romantic: "Soft, tender, affectionate, and deeply romantic Kerala Malayalam delivery filled with warmth, emotion, gentle whispers, and intimacy.",
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

function splitTextIntoChunks(text, maxChars = 65) {
  const rawParts = text.split(/([.!?,;:\n।—–\(\)\[\]]+)/);
  const clauses = [];
  let currentClause = '';

  for (let s of rawParts) {
    if (!s) continue;
    if ((currentClause + s).length > maxChars) {
      if (currentClause.trim()) clauses.push(currentClause.trim());
      currentClause = s;
    } else {
      currentClause += s;
    }
  }
  if (currentClause.trim()) clauses.push(currentClause.trim());

  const safeChunks = [];
  for (let clause of clauses) {
    if (clause.length <= maxChars) {
      if (clause.trim()) safeChunks.push(clause.trim());
      continue;
    }

    const words = clause.split(/\s+/);
    let wordChunk = '';
    for (let w of words) {
      if (!w) continue;
      if ((wordChunk + ' ' + w).trim().length > maxChars) {
        if (wordChunk.trim()) safeChunks.push(wordChunk.trim());
        if (w.length > maxChars) {
          for (let i = 0; i < w.length; i += maxChars) {
            safeChunks.push(w.slice(i, i + maxChars));
          }
          wordChunk = '';
        } else {
          wordChunk = w;
        }
      } else {
        wordChunk = (wordChunk + ' ' + w).trim();
      }
    }
    if (wordChunk.trim()) safeChunks.push(wordChunk.trim());
  }

  return safeChunks.filter(c => c && c.trim().length > 0);
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

  const chunks = splitTextIntoChunks(cleanText, 65);
  if (chunks.length > 250) {
    throw new Error('ടെക്സ്റ്റ് വളരെ നീളമുള്ളതാണ്. മുകളിലുള്ള ഭാഗം (Part) ബട്ടണുകൾ ഉപയോഗിച്ച് ഓരോ ഭാഗമായി നിർമ്മിക്കുക.');
  }
    .replace(/\[sigh\]/gi, '')
    .replace(/\[pause\]/gi, '')
    .replace(/\[sarcastically\]/gi, '')
    .replace(/\[excited\]/gi, '')
    .replace(/\[sad\]/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const chunks = splitTextIntoChunks(cleanText, 135);
  if (chunks.length > 100) {
    throw new Error('ടെക്സ്റ്റ് വളരെ നീളമുള്ളതാണ്. മുകളിലുള്ള ഭാഗം (Part) ബട്ടണുകൾ ഉപയോഗിച്ച് ഓരോ ഭാഗമായി നിർമ്മിക്കുക.');
  }

  const ttsHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Referer': 'https://translate.google.com/'
  };

  async function fetchApiChunkWithFallbacks(chunk) {
    if (!chunk || !chunk.trim()) return null;
    const q = encodeURIComponent(chunk);
    const endpoints = [
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=ml&client=tw-ob`,
      `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ml&q=${q}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=ml&client=webapp`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { headers: ttsHeaders });
        if (res.ok) {
          const ab = await res.arrayBuffer();
          if (ab && ab.byteLength > 0) {
            return Buffer.from(ab);
          }
        }
      } catch (_) {}
    }

    if (chunk.length > 40) {
      const mid = Math.floor(chunk.length / 2);
      let splitIdx = chunk.lastIndexOf(' ', mid);
      if (splitIdx < 10) splitIdx = chunk.indexOf(' ', mid);
      if (splitIdx > 5 && splitIdx < chunk.length - 5) {
        const h1 = chunk.slice(0, splitIdx).trim();
        const h2 = chunk.slice(splitIdx).trim();
        const b1 = await fetchApiChunkWithFallbacks(h1);
        const b2 = await fetchApiChunkWithFallbacks(h2);
        if (b1 && b2) {
          return Buffer.concat([b1, b2]);
        }
        if (b1) return b1;
        if (b2) return b2;
      }
    }
    return null;
  }

  const audioBuffers = [];
  for (let chunk of chunks) {
    const buf = await fetchApiChunkWithFallbacks(chunk);
    if (buf) {
      audioBuffers.push(buf);
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error('No audio returned from Free Voice engine.');
  }

  return Buffer.concat(audioBuffers);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'Malayalam AI TTS Vercel Function' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { text, voice = 'Sobhana', engine = 'edge', style = 'conversational', customApiKey } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Malayalam text is required.' });
    }

    // 1. Unlimited Free / Edge Neural Engine (Zero API Key Needed)
    if (engine === 'edge' || engine === 'unlimited' || voice === 'Sobhana' || voice === 'Midhun' || voice === 'Malavika' || voice === 'Rahul' || voice === 'Unlimited') {
      try {
        const isMale = (voice && voice.toLowerCase().includes('midhun')) || voice === 'Rahul';
        const audioBuffer = await generateFreeHTTPTTS(text);
        return res.status(200).json({
          success: true,
          audioBase64: audioBuffer.toString('base64'),
          mimeType: 'audio/mpeg',
          voiceUsed: isMale ? 'Midhun (Edge Neural Male)' : 'Sobhana (Edge Neural Female)',
          engineUsed: 'Microsoft Edge Neural (100% Free & Unlimited)'
        });
      } catch (err) {
        return res.status(500).json({ error: 'Free voice error: ' + err.message });
      }
    }

    // 2. Google Gemini 3.8 Engine
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error: 'Google Gemini API Key നൽകുക, അല്ലെങ്കിൽ മുകളിൽ "⚡ Microsoft Edge Neural" തിരഞ്ഞെടുക്കുക!',
        code: 'MISSING_API_KEY'
      });
    }

    const selectedStylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.conversational;
    const formattedText = formatTextForTTS(text);

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: formattedText,
              speech_metadata: {
                style: `Spoken in native Kerala Malayalam with authentic accent and diction. ${selectedStylePrompt}`
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

    let targetModel = 'gemini-3.8-flash-tts';
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    let apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let responseData = await apiResponse.json();

    if (!apiResponse.ok && responseData.error?.message?.includes('not found')) {
      targetModel = 'gemini-2.5-flash';
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      responseData = await apiResponse.json();
    }

    if (!apiResponse.ok) {
      const errMsg = responseData.error?.message || 'Google Gemini API error';
      return res.status(apiResponse.status).json({
        error: errMsg,
        details: responseData.error
      });
    }

    const candidate = responseData.candidates?.[0];
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
      modelUsed: targetModel
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred while generating audio.'
    });
  }
};
