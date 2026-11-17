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
    const { text, voice = 'Puck', style = 'conversational', customApiKey } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Malayalam text is required.' });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error: 'No Gemini API key provided. Please enter your free Google AI Studio API key in the settings.',
        code: 'MISSING_API_KEY'
      });
    }

    const selectedStylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.conversational;

    let modelUsed = 'gemini-3.8-flash-tts';
    let result = await callGemini(apiKey, text, voice, selectedStylePrompt, modelUsed);

    if (!result.ok && result.data?.error?.message?.includes('not found')) {
      modelUsed = 'gemini-2.5-flash';
      result = await callGemini(apiKey, text, voice, selectedStylePrompt, modelUsed);
    }

    if (!result.ok) {
      const errMsg = result.data?.error?.message || 'Google Gemini API error';
      return res.status(result.status).json({
        error: errMsg,
        details: result.data?.error
      });
    }

    const candidate = result.data.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ error: 'No response candidate received from Gemini.' });
    }

    const audioPart = candidate.content?.parts?.find(p => p.inlineData);
    if (!audioPart || !audioPart.inlineData) {
      const textPart = candidate.content?.parts?.find(p => p.text);
      return res.status(500).json({
        error: 'Model did not return audio data.',
        returnedText: textPart ? textPart.text : null
      });
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
      modelUsed: modelUsed
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || 'An unexpected error occurred while generating audio.'
    });
  }
};
