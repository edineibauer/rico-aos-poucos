const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a5f4a"/>
      <stop offset="100%" style="stop-color:#0d1117"/>
    </linearGradient>
    <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3fb950"/>
      <stop offset="100%" style="stop-color:#2d8a6e"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#bg)"/>
  <text x="10" y="68" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="url(#text)">R</text>
  <text x="38" y="68" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="#f0f6fc" opacity="0.7">a</text>
  <text x="56" y="68" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="url(#text)">P</text>
  <rect x="10" y="76" width="80" height="3" rx="1.5" fill="#3fb950" opacity="0.8"/>
</svg>`;

const sizes = [192, 512];
const outputDir = path.join(__dirname, '..');

async function generateIcons() {
  console.log('Gerando ícones PWA...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);

    try {
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ icon-${size}.png criado com sucesso`);
    } catch (error) {
      console.error(`✗ Erro ao criar icon-${size}.png:`, error.message);
    }
  }

  console.log('\nÍcones PWA gerados!');
}

generateIcons();
