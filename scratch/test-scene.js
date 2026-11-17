// Test script to verify SVG scene generation
function getStorybookSceneSVG(theme = 'river', subtitle = '') {
  // Color Palettes
  let skyGradient = '';
  let sunOrMoon = '';
  let hills = '';
  let midground = '';
  let foreground = '';

  if (theme === 'river') {
    // Kerala River Sunrise with Wooden Canoe & Fisherman
    skyGradient = `
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fdba74"/>
        <stop offset="35%" stop-color="#fb923c"/>
        <stop offset="65%" stop-color="#f43f5e"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f43f5e"/>
        <stop offset="30%" stop-color="#fb923c"/>
        <stop offset="70%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
    `;
    sunOrMoon = `
      <!-- Glowing Morning Sun -->
      <circle cx="640" cy="310" r="75" fill="#fef08a" opacity="0.95" filter="drop-shadow(0 0 40px #fde047)"/>
      <circle cx="640" cy="310" r="140" fill="#fde047" opacity="0.25"/>
    `;
    hills = `
      <!-- Faraway Misty Kerala Hills -->
      <path d="M0 380 Q 250 310, 500 370 T 950 330 T 1280 370 L 1280 720 L 0 720 Z" fill="#64748b" opacity="0.45"/>
      <path d="M0 400 Q 320 340, 680 400 T 1280 370 L 1280 720 L 0 720 Z" fill="#475569" opacity="0.6"/>
    `;
    midground = `
      <!-- Water Surface -->
      <rect x="0" y="420" width="1280" height="300" fill="url(#waterGrad)"/>
      <!-- Sun Reflection on Water -->
      <ellipse cx="640" cy="480" rx="110" ry="8" fill="#fef08a" opacity="0.5"/>
      <ellipse cx="640" cy="520" rx="80" ry="6" fill="#fef08a" opacity="0.4"/>
      <ellipse cx="640" cy="560" rx="55" ry="4" fill="#fef08a" opacity="0.3"/>
      <!-- Riverbank Silhouette with Coconut Palms -->
      <path d="M0 450 Q 180 420, 360 480 L 360 720 L 0 720 Z" fill="#1e293b"/>
      <!-- Coconut Palm Left -->
      <path d="M 90 620 Q 130 500, 110 360" stroke="#0f172a" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 110 360 Q 60 330, 20 370 M 110 360 Q 90 310, 60 290 M 110 360 Q 150 300, 190 320 M 110 360 Q 160 350, 180 390 M 110 360 Q 110 290, 120 270" stroke="#047857" stroke-width="8" fill="none" stroke-linecap="round"/>
    `;
    foreground = `
      <!-- Wooden Canoe (Vallam) and Fisherman Silhouette -->
      <g transform="translate(680, 480) scale(1.1)">
        <!-- Boat Hull -->
        <path d="M -90 20 Q 0 45, 90 20 Q 70 5, 0 8 Q -70 5, -90 20 Z" fill="#0f172a"/>
        <!-- Fisherman Silhouette -->
        <circle cx="15" cy="-22" r="10" fill="#0f172a"/>
        <path d="M 15 -12 Q 10 5, 5 15 L 25 15 Z" fill="#0f172a"/>
        <!-- Oar / Pole -->
        <line x1="-30" y1="-25" x2="35" y2="45" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Reflection in water -->
        <ellipse cx="0" cy="35" rx="85" ry="5" fill="#0f172a" opacity="0.3"/>
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        ${skyGradient}
      </defs>
      <rect width="1280" height="720" fill="url(#skyGrad)"/>
      ${sunOrMoon}
      ${hills}
      ${midground}
      ${foreground}
    </svg>
  `.trim();
}

const svg = getStorybookSceneSVG('river', 'test');
console.log('SVG generated! Length:', svg.length);
