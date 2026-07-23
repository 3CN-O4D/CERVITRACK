const fs = require('fs');
const path = require('path');

function createPlaceholderPNG(width, height, bgColor, text) {
  // Create a minimal valid PNG file
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.floor(width / 6)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  return canvas.toBuffer('image/png');
}

// We don't have canvas, so create simple placeholder SVGs instead
const svgTemplate = (size, label, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${color}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="${size * 0.25}" font-weight="bold" font-family="system-ui">${label}</text>
</svg>`;

const dir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(dir, { recursive: true });

['lab', 'workspace'].forEach((name) => {
  const color = name === 'lab' ? '#0891b2' : '#0369a1';
  const label = name === 'lab' ? 'CTL' : 'CTW';
  [192, 512].forEach((size) => {
    fs.writeFileSync(path.join(dir, `${name}-${size}.png`), svgTemplate(size, label, color));
  });
});

console.log('Icons created');
