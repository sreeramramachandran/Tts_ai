// Cloudflare Pages Function: /api/tts

function pcmToWav(pcmArrayBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmArrayBuffer.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmView = new Uint8Array(pcmArrayBuffer);
  const fullView = new Uint8Array(buffer, 44);
  fullView.set(pcmView);

  return buffer;
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
  const buffers = [];

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
    const ab = await res.arrayBuffer();
    buffers.push(new Uint8Array(ab));
  }

  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (let b of buffers) {
    merged.set(b, offset);
    offset += b.length;
  }
  return arrayBufferToBase64(merged.buffer);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json();
    const { text, voice = 'Malavika', engine = 'unlimited', style = 'conversational', customApiKey } = body || {};

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Malayalam text is required.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Unlimited Free Engine (Zero API Key Needed)
    if (engine === 'unlimited' || voice === 'Malavika' || voice === 'Rahul' || voice === 'Unlimited') {
      try {
        const base64Data = await generateFreeHTTPTTS(text);
        return new Response(
          JSON.stringify({
            success: true,
            audioBase64: base64Data,
            mimeType: 'audio/mpeg',
            voiceUsed: voice === 'Rahul' ? 'Rahul (Unlimited Free)' : 'Malavika (Unlimited Free)',
            engineUsed: 'Unlimited Free Engine (No Key Needed)',
          }),
          { status: 200, headers: corsHeaders }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Free voice error: ' + err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // 2. Google Gemini 3.8 Flash TTS
    const apiKey = customApiKey || context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No Gemini API key provided. Switch to "Unlimited Free Engine" tab or enter your key in settings.',
          code: 'MISSING_API_KEY',
        }),
        { status: 401, headers: corsHeaders }
      );
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
                style: `Spoken in native Kerala Malayalam with authentic accent and diction. ${selectedStylePrompt}`,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    };

    let targetModel = 'gemini-3.8-flash-tts';
    let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    let apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let responseData = await apiResponse.json();

    if (!apiResponse.ok && responseData.error?.message?.includes('not found')) {
      targetModel = 'gemini-2.5-flash';
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      responseData = await apiResponse.json();
    }

    if (!apiResponse.ok) {
      const errMsg = responseData.error?.message || 'Google Gemini API error';
      return new Response(
        JSON.stringify({ error: errMsg, details: responseData.error }),
        { status: apiResponse.status, headers: corsHeaders }
      );
    }

    const candidate = responseData.candidates?.[0];
    if (!candidate) {
      return new Response(JSON.stringify({ error: 'No response candidate received from Gemini.' }));
    }

    const audioPart = candidate.content?.parts?.find((p) => p.inlineData);
    if (!audioPart || !audioPart.inlineData) {
      const textPart = candidate.content?.parts?.find((p) => p.text);
      return new Response(
        JSON.stringify({
          error: 'Model did not return audio data.',
          returnedText: textPart ? textPart.text : null,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    let { mimeType, data: base64Data } = audioPart.inlineData;
    let arrayBuffer = base64ToArrayBuffer(base64Data);

    const first4 = new Uint8Array(arrayBuffer.slice(0, 4));
    const isWav = String.fromCharCode(...first4) === 'RIFF';
    if (!isWav) {
      arrayBuffer = pcmToWav(arrayBuffer, 24000, 1, 16);
      mimeType = 'audio/wav';
      base64Data = arrayBufferToBase64(arrayBuffer);
    }

    return new Response(
      JSON.stringify({
        success: true,
        audioBase64: base64Data,
        mimeType: mimeType || 'audio/wav',
        voiceUsed: voice,
        modelUsed: targetModel,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message || 'An unexpected error occurred while generating audio.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
