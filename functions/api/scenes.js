// Cloudflare Pages Function: /api/scenes

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
    const { text, customApiKey } = body || {};
    const apiKey = customApiKey || context.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key is required.', code: 'MISSING_API_KEY' }),
        { status: 401, headers: corsHeaders }
      );
    }

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
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\nMalayalam Story:\n' + text }] }]
    };

    const targetModel = 'gemini-2.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseData = await apiResponse.json();
    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: responseData.error?.message || 'Error extracting scenes' }), {
        status: apiResponse.status,
        headers: corsHeaders
      });
    }

    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const scenes = JSON.parse(cleanedJson);

    return new Response(JSON.stringify({ success: true, scenes }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate visual scenes.' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
