// Vercel Serverless Function: /api/scenes

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, customApiKey } = req.body || {};
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: 'Gemini API key is required.', code: 'MISSING_API_KEY' });
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

    const targetModel = 'gemini-3.8-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseData = await apiResponse.json();
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ error: responseData.error?.message || 'Error extracting scenes' });
    }

    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const scenes = JSON.parse(cleanedJson);

    return res.json({ success: true, scenes });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to generate visual scenes.' });
  }
};
