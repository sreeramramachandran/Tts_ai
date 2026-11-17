// Test all themes in scratch/test-themes.js
function detectTheme(text = '') {
  const lower = text.toLowerCase();
  if (/പുഴ|തോണി|മീൻ|വള്ളം|കടൽ|തീരം|river|boat|canoe|fisherman|water|sea|lake|ocean|stream|shore/.test(lower)) {
    return 'river';
  }
  if (/കാട്|മരം|തോട്ടം|പച്ചപ്പ്|പ്രകൃതി|മൃഗം|forest|tree|wood|jungle|nature|green|animal/.test(lower)) {
    return 'forest';
  }
  if (/സൂര്യൻ|പ്രഭാതം|രാവിലെ|വയൽ|വെളിച്ചം|sunrise|morning|dawn|sun|day|field/.test(lower)) {
    return 'sunrise';
  }
  if (/രാത്രി|ചന്ദ്രൻ|നക്ഷത്രം|ഇരുട്ട്|രഹസ്യം|night|moon|star|dark|midnight|shadow/.test(lower)) {
    return 'night';
  }
  if (/ഗ്രാമം|വീട്|കുടിര|വഴി|ക്ഷേത്രം|village|house|home|cottage|road|path|temple/.test(lower)) {
    return 'village';
  }
  return 'landscape';
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
        <stop offset="65%" stop-color="#f43f5e"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f43f5e"/>
        <stop offset="25%" stop-color="#fb923c"/>
        <stop offset="65%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#075985"/>
      </linearGradient>
    `;
    content = `
      <!-- Sunrise Sun -->
      <circle cx="640" cy="300" r="75" fill="#fef08a" opacity="0.95"/>
      <circle cx="640" cy="300" r="140" fill="#fde047" opacity="0.25"/>
      <circle cx="640" cy="300" r="220" fill="#fb923c" opacity="0.12"/>
      <!-- Faraway Kerala Misty Hills -->
      <path d="M0 370 Q 250 300, 500 360 T 950 320 T 1280 360 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.45"/>
      <path d="M0 390 Q 320 330, 680 390 T 1280 360 L 1280 720 L 0 720 Z" fill="#334155" opacity="0.6"/>
      <!-- Water Surface -->
      <rect x="0" y="415" width="1280" height="305" fill="url(#waterGrad)"/>
      <!-- Water Ripples / Reflections -->
      <ellipse cx="640" cy="460" rx="140" ry="8" fill="#fef08a" opacity="0.55"/>
      <ellipse cx="640" cy="500" rx="110" ry="6" fill="#fef08a" opacity="0.45"/>
      <ellipse cx="640" cy="545" rx="80" ry="5" fill="#fef08a" opacity="0.35"/>
      <ellipse cx="640" cy="590" rx="50" ry="4" fill="#fef08a" opacity="0.25"/>
      <!-- Left Riverbank & Coconut Palm -->
      <path d="M0 450 Q 180 430, 320 490 L 320 720 L 0 720 Z" fill="#0f172a"/>
      <path d="M 80 620 Q 120 480, 95 340" stroke="#0f172a" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M 95 340 Q 50 310, 10 350 M 95 340 Q 75 285, 40 265 M 95 340 Q 140 270, 180 295 M 95 340 Q 150 325, 175 375 M 95 340 Q 95 260, 105 240" stroke="#047857" stroke-width="9" fill="none" stroke-linecap="round"/>
      <!-- Wooden Canoe (Vallam) & Fisherman Silhouette -->
      <g transform="translate(680, 480) scale(1.15)">
        <path d="M -90 18 Q 0 42, 90 18 Q 70 3, 0 6 Q -70 3, -90 18 Z" fill="#0f172a"/>
        <circle cx="15" cy="-22" r="11" fill="#0f172a"/>
        <path d="M 15 -11 Q 10 5, 5 15 L 25 15 Z" fill="#0f172a"/>
        <line x1="-30" y1="-25" x2="35" y2="45" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="0" cy="32" rx="85" ry="5" fill="#0f172a" opacity="0.35"/>
      </g>
      <!-- Flying Birds -->
      <path d="M 400 180 Q 410 170, 420 180 Q 430 170, 440 180" stroke="#78350f" stroke-width="3" fill="none"/>
      <path d="M 450 200 Q 458 192, 466 200 Q 474 192, 482 200" stroke="#78350f" stroke-width="2.5" fill="none"/>
    `;
  } else if (theme === 'forest') {
    defs = `
      <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="50%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#6ee7b7"/>
      </linearGradient>
      <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#065f46"/>
        <stop offset="100%" stop-color="#022c22"/>
      </linearGradient>
    `;
    content = `
      <!-- Background Trees & Canopy -->
      <rect width="1280" height="720" fill="url(#forestSky)"/>
      <!-- Sunbeams / God Rays -->
      <polygon points="300,0 450,0 750,720 500,720" fill="#fef08a" opacity="0.12"/>
      <polygon points="650,0 800,0 1100,720 850,720" fill="#fef08a" opacity="0.10"/>
      <!-- Distant Trees -->
      <path d="M 100 720 L 100 200 Q 200 120, 300 200 L 300 720 Z" fill="#047857" opacity="0.5"/>
      <path d="M 450 720 L 450 180 Q 550 90, 650 180 L 650 720 Z" fill="#047857" opacity="0.5"/>
      <path d="M 800 720 L 800 220 Q 900 140, 1000 220 L 1000 720 Z" fill="#047857" opacity="0.5"/>
      <!-- Foreground Giant Forest Trunks -->
      <rect x="180" y="0" width="70" height="720" fill="#022c22"/>
      <rect x="750" y="0" width="85" height="720" fill="#022c22"/>
      <rect x="1050" y="0" width="100" height="720" fill="#022c22"/>
      <!-- Forest Floor / Hills -->
      <path d="M0 560 Q 350 480, 700 550 T 1280 520 L 1280 720 L 0 720 Z" fill="url(#groundGrad)"/>
      <!-- Foliage & Grass -->
      <circle cx="215" cy="180" r="140" fill="#065f46" opacity="0.9"/>
      <circle cx="790" cy="150" r="160" fill="#065f46" opacity="0.9"/>
      <circle cx="1100" cy="190" r="180" fill="#065f46" opacity="0.9"/>
      <!-- Glowing Spores / Fireflies -->
      <circle cx="350" cy="420" r="6" fill="#fef08a" opacity="0.8"/>
      <circle cx="550" cy="380" r="8" fill="#fde047" opacity="0.9"/>
      <circle cx="900" cy="450" r="5" fill="#fef08a" opacity="0.8"/>
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
      <!-- Twinkling Stars -->
      <circle cx="150" cy="120" r="3" fill="#fff" opacity="0.9"/>
      <circle cx="280" cy="80" r="2.5" fill="#fff" opacity="0.8"/>
      <circle cx="420" cy="150" r="2" fill="#fff" opacity="0.7"/>
      <circle cx="780" cy="90" r="3" fill="#fff" opacity="0.9"/>
      <circle cx="920" cy="160" r="2.5" fill="#fff" opacity="0.8"/>
      <circle cx="1100" cy="110" r="3" fill="#fff" opacity="0.95"/>
      <circle cx="1180" cy="220" r="2" fill="#fff" opacity="0.75"/>
      <!-- Crescent Moon -->
      <circle cx="960" cy="200" r="65" fill="#fef08a"/>
      <circle cx="985" cy="190" r="60" fill="#1e1b4b"/>
      <!-- Distant Hills -->
      <path d="M0 460 Q 300 390, 600 450 T 1280 430 L 1280 720 L 0 720 Z" fill="#0f172a" opacity="0.85"/>
      <path d="M0 520 Q 350 470, 750 530 T 1280 500 L 1280 720 L 0 720 Z" fill="#020617"/>
      <!-- Tree Silhouettes -->
      <path d="M 220 540 Q 240 450, 230 360" stroke="#020617" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 230 360 Q 180 320, 140 360 M 230 360 Q 210 300, 175 280 M 230 360 Q 280 290, 310 310 M 230 360 Q 290 340, 305 385" stroke="#064e3b" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Fireflies -->
      <circle cx="450" cy="550" r="6" fill="#a7f3d0" opacity="0.85"/>
      <circle cx="650" cy="510" r="7" fill="#6ee7b7" opacity="0.9"/>
      <circle cx="820" cy="570" r="5" fill="#a7f3d0" opacity="0.85"/>
    `;
  } else {
    // Universal Scenic Kerala Sunrise / Landscape
    defs = `
      <linearGradient id="scenicSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fed7aa"/>
        <stop offset="40%" stop-color="#fdba74"/>
        <stop offset="70%" stop-color="#f472b6"/>
        <stop offset="100%" stop-color="#60a5fa"/>
      </linearGradient>
      <linearGradient id="scenicWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f472b6"/>
        <stop offset="40%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    `;
    content = `
      <rect width="1280" height="720" fill="url(#scenicSky)"/>
      <circle cx="640" cy="320" r="85" fill="#fef08a" opacity="0.9"/>
      <circle cx="640" cy="320" r="160" fill="#fde047" opacity="0.2"/>
      <path d="M0 380 Q 300 300, 640 370 T 1280 340 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.5"/>
      <rect x="0" y="440" width="1280" height="280" fill="url(#scenicWater)"/>
      <ellipse cx="640" cy="490" rx="120" ry="8" fill="#fef08a" opacity="0.5"/>
      <ellipse cx="640" cy="540" rx="90" ry="6" fill="#fef08a" opacity="0.4"/>
      <path d="M0 480 Q 200 450, 360 520 L 360 720 L 0 720 Z" fill="#0f172a"/>
      <path d="M 110 650 Q 150 510, 130 370" stroke="#0f172a" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 130 370 Q 80 330, 40 370 M 130 370 Q 110 310, 70 290 M 130 370 Q 180 300, 210 320 M 130 370 Q 180 350, 200 395" stroke="#047857" stroke-width="8" fill="none" stroke-linecap="round"/>
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

console.log('River theme length:', getStorybookSceneSVG('river fisherman boat').length);
console.log('Forest theme length:', getStorybookSceneSVG('dense green forest trees').length);
console.log('Night theme length:', getStorybookSceneSVG('night stars moon').length);
console.log('Default theme length:', getStorybookSceneSVG('something else').length);
