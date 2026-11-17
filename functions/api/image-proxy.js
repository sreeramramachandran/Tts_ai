// Cloudflare Pages Function: /api/image-proxy

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const prompt = url.searchParams.get('prompt');
  const seed = url.searchParams.get('seed') || Math.floor(Math.random() * 100000);

  if (!prompt) {
    return new Response('Prompt is required', { status: 400 });
  }

  try {
    const fullPrompt = `${prompt}, vibrant 2D anime storybook illustration, Ghibli style, detailed scenery, cinematic lighting, 16:9 widescreen`;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;

    const imgRes = await fetch(pollinationsUrl);
    if (!imgRes.ok) {
      return new Response('Pollinations error: ' + imgRes.status, { status: 502 });
    }

    const imageBytes = await imgRes.arrayBuffer();

    return new Response(imageBytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response('Image proxy error: ' + err.message, { status: 500 });
  }
}
