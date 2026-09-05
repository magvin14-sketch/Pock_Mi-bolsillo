import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generate() {
  const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'pwa-192x192.png', size: 192 },
    { file: 'pwa-512x512.png', size: 512 },
    { file: 'pwa-maskable-512x512.png', size: 512 },
    { file: 'favicon.png', size: 64 },
  ];

  for (const t of targets) {
    const outPath = path.join(process.cwd(), 'public', t.file);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png({ quality: 95 })
      .toFile(outPath);
    console.log(`Generated ${t.file} (${t.size}x${t.size})`);
  }
  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
