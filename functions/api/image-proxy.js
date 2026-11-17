// Cloudflare Pages Function: /api/image-proxy (Instant 2D Vector Storybook Scene)

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
      <circle cx="640" cy="290" r="75" fill="#fef08a"/>
      <path d="M0 370 Q 250 300, 500 360 T 950 330 T 1280 360 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.45"/>
      <path d="M0 395 Q 320 335, 680 395 T 1280 370 L 1280 720 L 0 720 Z" fill="#334155" opacity="0.6"/>
      <rect x="0" y="420" width="1280" height="300" fill="url(#waterGrad)"/>
      <line x1="0" y1="420" x2="1280" y2="420" stroke="#111827" stroke-width="3.5"/>
      <ellipse cx="640" cy="470" rx="140" ry="7" fill="#bae6fd" opacity="0.55"/>
      <ellipse cx="640" cy="510" rx="110" ry="6" fill="#bae6fd" opacity="0.45"/>
      <ellipse cx="640" cy="560" rx="80" ry="5" fill="#bae6fd" opacity="0.35"/>
      <path d="M0 450 Q 180 430, 280 520 L 280 720 L 0 720 Z" fill="#0f172a"/>
      <path d="M 80 620 Q 120 480, 100 340" stroke="#78350f" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M 100 340 Q 50 310, 10 350 M 100 340 Q 80 285, 40 265 M 100 340 Q 145 270, 185 295 M 100 340 Q 155 325, 180 375" stroke="#047857" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g transform="translate(680, 520)">
        <ellipse cx="0" cy="25" rx="110" ry="8" fill="#075985" opacity="0.4"/>
        <path d="M -110 12 Q 0 48, 110 12 Q 80 -5, 0 0 Q -80 -5, -110 12 Z" fill="#5c3a1e" stroke="#111827" stroke-width="4.5"/>
        <path d="M -90 16 Q 0 34, 90 16" stroke="#3d2412" stroke-width="2.5" fill="none"/>
        <g transform="translate(0, 12)">
          <line x1="-5" y1="-75" x2="0" y2="0" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M -16 -15 L 16 -15 L 20 15 L 0 28 L -18 12 Z" fill="#8c572a" stroke="#111827" stroke-width="3.5"/>
          <circle cx="-5" cy="-110" r="32" fill="#ffffff" stroke="#111827" stroke-width="4.5"/>
          <g fill="#111827">
            <circle cx="-27" cy="-132" r="10"/><circle cx="-19" cy="-142" r="11"/>
            <circle cx="-7" cy="-146" r="12"/><circle cx="6" cy="-144" r="11"/>
            <circle cx="17" cy="-134" r="10"/><circle cx="-33" cy="-122" r="9"/>
            <circle cx="-35" cy="-110" r="9"/>
          </g>
          <circle cx="-2" cy="-113" r="3.8" fill="#111827"/>
          <circle cx="15" cy="-112" r="3.8" fill="#111827"/>
          <path d="M 5 -99 Q 12 -94, 18 -99" stroke="#111827" stroke-width="3" fill="none" stroke-linecap="round"/>
          <line x1="12" y1="-45" x2="45" y2="65" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
          <ellipse cx="45" cy="65" rx="10" ry="22" transform="rotate(20 45 65)" fill="#78350f"/>
        </g>
      </g>
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
      <g transform="translate(640, 540)">
        <line x1="-25" y1="8" x2="25" y2="-4" stroke="#78350f" stroke-width="8"/>
        <line x1="-25" y1="-4" x2="25" y2="8" stroke="#78350f" stroke-width="8"/>
        <circle cx="0" cy="-20" r="60" fill="#f97316" opacity="0.2"/>
        <path d="M -18 0 Q -10 -35, 0 -45 Q 10 -35, 18 0 Z" fill="#f97316"/>
        <path d="M -10 0 Q 0 -25, 10 0 Z" fill="#fde047"/>
      </g>
    `;
  } else {
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
      <rect width="1280" height="720" fill="url(#skyGrad)"/>
      <circle cx="680" cy="70" r="1.5" fill="#ffffff" opacity="0.8"/>
      <circle cx="850" cy="110" r="1.5" fill="#ffffff" opacity="0.7"/>
      <circle cx="1020" cy="55" r="2" fill="#ffffff" opacity="0.9"/>
      <circle cx="1180" cy="95" r="1.5" fill="#ffffff" opacity="0.6"/>

      <circle cx="960" cy="420" r="95" fill="#facc15" stroke="#111827" stroke-width="4.5"/>
      <circle cx="960" cy="420" r="140" fill="#fde047" opacity="0.2"/>

      <rect x="0" y="420" width="1280" height="300" fill="#e7c689"/>
      <line x1="0" y1="420" x2="1280" y2="420" stroke="#111827" stroke-width="4"/>

      <g transform="translate(1160, 420)">
        <path d="M -10 0 Q -5 -60, -2 -90 L -25 -130 M -2 -90 Q 5 -115, 25 -135 M -2 -90 L 0 -140" stroke="#78350f" stroke-width="7" fill="none" stroke-linecap="round"/>
        <ellipse cx="-25" cy="-135" rx="42" ry="12" fill="#6b9080" stroke="#111827" stroke-width="3"/>
        <ellipse cx="25" cy="-140" rx="38" ry="11" fill="#6b9080" stroke="#111827" stroke-width="3"/>
        <ellipse cx="0" cy="-146" rx="50" ry="14" fill="#84a98c" stroke="#111827" stroke-width="3"/>
      </g>

      <g fill="#84a98c" stroke="#111827" stroke-width="3.5">
        <path d="M 600 420 Q 590 385, 620 380 Q 640 360, 670 380 Q 700 385, 695 420 Z"/>
        <path d="M 780 420 Q 795 400, 815 400 Q 835 395, 850 420 Z"/>
        <path d="M 1060 420 Q 1050 390, 1080 385 Q 1105 365, 1130 385 Q 1155 390, 1150 420 Z"/>
      </g>

      <g stroke="#111827" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M 740 450 L 736 440 M 740 450 L 744 442"/>
        <path d="M 920 470 L 916 460 M 920 470 L 925 462"/>
        <line x1="560" y1="480" x2="585" y2="480"/>
        <line x1="840" y1="510" x2="870" y2="510"/>
      </g>

      <g>
        <path d="M -20 640 L 0 360 Q 180 330, 360 360 L 330 640 Z" fill="url(#hutWallGrad)" stroke="#111827" stroke-width="4.5"/>
        <g stroke="#8c5e34" stroke-width="3" stroke-linecap="round">
          <line x1="60" y1="390" x2="65" y2="510"/>
          <line x1="100" y1="430" x2="103" y2="550"/>
          <line x1="300" y1="420" x2="296" y2="530"/>
        </g>
        <path d="M 140 640 L 140 380 Q 200 360, 260 380 L 260 640 Z" fill="#2d1c10" stroke="#111827" stroke-width="4.5"/>
        <line x1="140" y1="370" x2="140" y2="640" stroke="#6e4222" stroke-width="7" stroke-linecap="round"/>
        <line x1="260" y1="370" x2="260" y2="640" stroke="#6e4222" stroke-width="7" stroke-linecap="round"/>
        <path d="M -40 370 Q 170 50, 390 370 Z" fill="url(#thatchGrad)" stroke="#111827" stroke-width="4.5"/>
        <path d="M -40 370 Q -20 385, 0 370 Q 20 385, 40 370 Q 60 385, 80 370 Q 100 385, 120 370 Q 140 385, 160 370 Q 180 385, 200 370 Q 220 385, 240 370 Q 260 385, 280 370 Q 300 385, 320 370 Q 340 385, 360 370 Q 380 385, 390 370" fill="none" stroke="#111827" stroke-width="4.5" stroke-linecap="round"/>
        <g stroke="#111827" stroke-width="2.5" stroke-linecap="round">
          <line x1="50" y1="190" x2="40" y2="230"/>
          <line x1="90" y1="140" x2="75" y2="195"/>
          <line x1="150" y1="120" x2="140" y2="200"/>
          <line x1="210" y1="130" x2="225" y2="205"/>
          <line x1="270" y1="160" x2="290" y2="235"/>
          <line x1="110" y1="250" x2="95" y2="310"/>
        </g>
      </g>

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
  const prompt = url.searchParams.get('prompt') || '';
  const subtitle = url.searchParams.get('subtitle') || '';

  const svgContent = getStorybookSceneSVG(prompt, subtitle);

  return new Response(svgContent, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
