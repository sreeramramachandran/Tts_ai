// Vercel Serverless Function: /api/image-proxy

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { prompt, seed = Math.floor(Math.random() * 100000) } = req.query || {};
  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  try {
    const fullPrompt = `${prompt}, vibrant 2D anime storybook illustration, Ghibli style, detailed scenery, cinematic lighting, 16:9 widescreen`;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;

    const imgRes = await fetch(pollinationsUrl);
    if (!imgRes.ok) {
      throw new Error(`Pollinations error: ${imgRes.status}`);
    }

    const buffer = await imgRes.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).send('Image proxy failed: ' + err.message);
  }
};
