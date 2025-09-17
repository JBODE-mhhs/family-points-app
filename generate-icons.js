import { readFileSync, writeFileSync } from 'fs';
import { createCanvas, loadImage } from 'canvas';

// Simple PNG generation from SVG using data URL
const svgContent = readFileSync('./public/icon.svg', 'utf8');
const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

// Canvas-based PNG generation
async function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create a simple icon using canvas
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4f46e5');
  gradient.addColorStop(1, '#06b6d4');

  // Background circle
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 4, 0, 2 * Math.PI);
  ctx.fill();

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Star shape
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  const centerX = size/2;
  const centerY = size/2;
  const starSize = size * 0.15;

  // Draw a simple star
  for (let i = 0; i < 5; i++) {
    const angle = (i * 144 - 90) * Math.PI / 180;
    const x = centerX + Math.cos(angle) * starSize;
    const y = centerY + Math.sin(angle) * starSize;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size/16}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FP', centerX, centerY + starSize * 2);

  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`./public/${filename}`, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

// Generate required icons
async function main() {
  try {
    await generateIcon(192, 'icon-192.png');
    await generateIcon(512, 'icon-512.png');
    await generateIcon(180, 'apple-touch-icon.png');
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

main();