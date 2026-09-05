const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Generate SVG string for each variant
function generateIconSvg({ theme = 'dark', variant = 'desktop', size = 512, includeCard = true, fullBleed = false }) {
  const isDark = theme === 'dark';
  const isDesktop = variant === 'desktop';

  // Colors based on user specifications
  const colors = isDark
    ? {
        cardBg: '#092224',
        cardBorder: '#14B8A6',
        cardBorderOpacity: 0.25,
        coinFillStart: '#FDE047',
        coinFillEnd: '#F59E0B',
        coinRim: '#06423E',
        coinSymbol: '#063834',
        shineRays: '#35D0BA',
        pocketFill: '#043A37',
        pocketStroke: '#00BFA5',
        pocketHem: '#00BFA5',
        stitching: '#FFFFFF',
        titleColor: '#FFFFFF',
        subtitleColor: '#5EEAD4',
      }
    : {
        cardBg: '#FFFFFF',
        cardBorder: '#E2E8F0',
        cardBorderOpacity: 0.8,
        coinFillStart: '#FDE047',
        coinFillEnd: '#F59E0B',
        coinRim: '#08423E',
        coinSymbol: '#08423E',
        shineRays: '#00A896',
        pocketFill: '#FFFFFF',
        pocketStroke: '#08423E',
        pocketHem: '#08423E',
        stitching: '#08423E',
        titleColor: '#111827',
        subtitleColor: '#64748B',
      };

  // Proportions: Desktop has more breathing room around the pocket, Mobile has larger pocket for touch icons
  const scale = fullBleed ? 0.92 : (isDesktop ? 1.0 : 1.12);
  const pocketYOffset = fullBleed ? -6 : (isDesktop ? 0 : -8);
  const squircleRadius = size * 0.24;

  let backgroundMarkup = '';
  if (fullBleed) {
    // Full bleed solid background with NO outer stroke, NO transparent margin, NO white contours
    backgroundMarkup = `<!-- Full Bleed Solid Dark Canvas -->
  <rect
    x="0"
    y="0"
    width="${size}"
    height="${size}"
    fill="${colors.cardBg}"
  />`;
  } else if (includeCard) {
    backgroundMarkup = `<!-- Squircle Card Background -->
  <rect
    x="${size * 0.05}"
    y="${size * 0.05}"
    width="${size * 0.9}"
    height="${size * 0.9}"
    rx="${squircleRadius}"
    fill="${colors.cardBg}"
    stroke="${colors.cardBorder}"
    stroke-width="${size * 0.005}"
    stroke-opacity="${colors.cardBorderOpacity}"
    filter="url(#cardShadow-${theme}-${variant})"
  />`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <!-- Coin Gradient -->
    <radialGradient id="coinGradient-${theme}-${variant}" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${colors.coinFillStart}" />
      <stop offset="65%" stop-color="${colors.coinFillEnd}" />
      <stop offset="100%" stop-color="#D97706" />
    </radialGradient>

    <!-- Card Shadow -->
    <filter id="cardShadow-${theme}-${variant}" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="${isDark ? '#000000' : '#0F172A'}" flood-opacity="${isDark ? '0.45' : '0.10'}" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${isDark ? '#000000' : '#0F172A'}" flood-opacity="${isDark ? '0.25' : '0.06'}" />
    </filter>

    <!-- Coin Glow -->
    <filter id="coinShine-${theme}-${variant}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${colors.shineRays}" flood-opacity="0.3" />
    </filter>
  </defs>

  ${backgroundMarkup}

  <!-- Graphic Center Group -->
  <g transform="translate(${size / 2}, ${(size / 2) + pocketYOffset}) scale(${scale * (size / 512)}) translate(-256, -256)">
    
    <!-- ==================== COIN & SHINE ==================== -->
    <g id="coin-group">
      <!-- Shine Rays top right of coin -->
      <line
        x1="324" y1="126"
        x2="338" y2="112"
        stroke="${colors.shineRays}"
        stroke-width="7"
        stroke-linecap="round"
      />
      <line
        x1="344" y1="148"
        x2="358" y2="134"
        stroke="${colors.shineRays}"
        stroke-width="7"
        stroke-linecap="round"
      />

      <!-- Colón Coin Body -->
      <circle
        cx="256"
        cy="176"
        r="56"
        fill="url(#coinGradient-${theme}-${variant})"
        stroke="${colors.coinRim}"
        stroke-width="7"
      />

      <!-- Coin Inner Groove -->
      <circle
        cx="256"
        cy="176"
        r="47"
        fill="none"
        stroke="${colors.coinFillStart}"
        stroke-width="1.8"
        stroke-opacity="0.8"
      />

      <!-- Costa Rican Colón '₡' Symbol -->
      <!-- Capital C curve with vertical stroke -->
      <path
        d="M 272 159 C 242 159, 234 170, 234 176 C 234 182, 242 193, 272 193"
        fill="none"
        stroke="${colors.coinSymbol}"
        stroke-width="7.5"
        stroke-linecap="round"
      />
      <!-- Colón vertical bisecting stroke -->
      <line
        x1="256"
        y1="150"
        x2="256"
        y2="202"
        stroke="${colors.coinSymbol}"
        stroke-width="6.5"
        stroke-linecap="round"
      />
    </g>

    <!-- ==================== POCKET ==================== -->
    <g id="pocket-group">
      <!-- Pocket Pouch Body -->
      <path
        d="M 160 206 
           L 352 206 
           L 346 304 
           C 342 354, 298 386, 256 394 
           C 214 386, 170 354, 166 304 
           Z"
        fill="${colors.pocketFill}"
        stroke="${colors.pocketStroke}"
        stroke-width="11"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- Pocket Top Folded Cuff / Hem -->
      <rect
        x="154"
        y="196"
        width="204"
        height="22"
        rx="10"
        fill="${colors.pocketHem}"
      />

      <!-- U-Shaped Dashed Stitching Line -->
      <path
        d="M 180 232 
           L 180 300 
           C 183 340, 218 368, 256 374 
           C 294 368, 329 340, 332 300 
           L 332 232"
        fill="none"
        stroke="${colors.stitching}"
        stroke-width="5"
        stroke-dasharray="8 6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>

    <!-- ==================== WORDMARK ==================== -->
    <text
      x="256"
      y="432"
      text-anchor="middle"
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      font-size="34"
      font-weight="800"
      letter-spacing="-0.5"
      fill="${colors.titleColor}"
    >Pock</text>

    <text
      x="256"
      y="456"
      text-anchor="middle"
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      font-size="16"
      font-weight="500"
      letter-spacing="0.2"
      fill="${colors.subtitleColor}"
    >Mi bolsillo</text>
  </g>
</svg>
`.trim();
}

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  const assetsDir = path.join(publicDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const variants = [
    { theme: 'light', variant: 'desktop', size: 1024, filename: 'icon-light-desktop.svg' },
    { theme: 'light', variant: 'mobile', size: 512, filename: 'icon-light-mobile.svg' },
    { theme: 'dark', variant: 'desktop', size: 1024, filename: 'icon-dark-desktop.svg' },
    { theme: 'dark', variant: 'mobile', size: 512, filename: 'icon-dark-mobile.svg' },
  ];

  for (const v of variants) {
    const svgContent = generateIconSvg({
      theme: v.theme,
      variant: v.variant,
      size: v.size,
      includeCard: true,
    });
    fs.writeFileSync(path.join(assetsDir, v.filename), svgContent);
    console.log(`Wrote ${v.filename}`);
  }

  // Also write generic icon-light.svg and full-bleed permanent clean dark icons
  const lightSvg = generateIconSvg({ theme: 'light', variant: 'mobile', size: 512 });
  
  // Full-bleed clean permanent dark app icon (No transparent border, no white contour, solid #092224 background)
  const cleanAppIconDarkSvg = generateIconSvg({
    theme: 'dark',
    variant: 'mobile',
    size: 512,
    fullBleed: true,
  });

  fs.writeFileSync(path.join(publicDir, 'icon-light.svg'), lightSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-dark.svg'), cleanAppIconDarkSvg);

  // Responsive icon.svg defaults permanently to clean dark icon
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), cleanAppIconDarkSvg);

  // Generate PNG icons using sharp for PWA and Apple Touch Icon with full-bleed clean dark design
  console.log('Rendering permanent clean dark PNG icons via sharp...');
  await sharp(Buffer.from(cleanAppIconDarkSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp(Buffer.from(cleanAppIconDarkSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  await sharp(Buffer.from(cleanAppIconDarkSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  await sharp(Buffer.from(cleanAppIconDarkSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(cleanAppIconDarkSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // Also generate light PNG icon for optional browser tab switching if desired
  await sharp(Buffer.from(lightSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-light.png'));

  await sharp(Buffer.from(cleanAppIconDarkSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon-dark.png'));

  console.log('All icons generated successfully!');
}

main().catch(console.error);
