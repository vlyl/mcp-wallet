const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create canvas
const width = 800;
const height = 400;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Draw background gradient
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#0f1219');
gradient.addColorStop(1, '#2d3748');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add subtle glow effect
const glowGradient1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 10, width * 0.8, height * 0.2, width * 0.6);
glowGradient1.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
glowGradient1.addColorStop(1, 'rgba(99, 102, 241, 0)');
ctx.fillStyle = glowGradient1;
ctx.fillRect(0, 0, width, height);

const glowGradient2 = ctx.createRadialGradient(width * 0.2, height * 0.8, 10, width * 0.2, height * 0.8, width * 0.6);
glowGradient2.addColorStop(0, 'rgba(236, 72, 153, 0.1)');
glowGradient2.addColorStop(1, 'rgba(236, 72, 153, 0)');
ctx.fillStyle = glowGradient2;
ctx.fillRect(0, 0, width, height);

// Draw title
ctx.font = 'bold 48px Arial';
ctx.textAlign = 'center';
const titleGradient = ctx.createLinearGradient(width * 0.3, 0, width * 0.7, 0);
titleGradient.addColorStop(0, '#60a5fa');
titleGradient.addColorStop(1, '#a78bfa');
ctx.fillStyle = titleGradient;
ctx.fillText('MCP Wallet', width / 2, height / 2 - 50);

// Draw subtitle
ctx.font = '20px Arial';
ctx.fillStyle = '#e2e8f0';
ctx.fillText('A seamless integration of AI-powered assistants', width / 2, height / 2);
ctx.fillText('with cryptocurrency wallet management', width / 2, height / 2 + 30);

// Draw tags
const tags = ['Next.js', 'React', 'TypeScript', 'Claude', 'Wagmi', 'Shadcn UI'];
const tagWidth = 90;
const tagHeight = 30;
const tagsPerRow = 3;
const tagSpacing = 10;
const tagsStartX = width / 2 - ((tagWidth + tagSpacing) * Math.min(tags.length, tagsPerRow) - tagSpacing) / 2;
const tagsStartY = height / 2 + 80;

tags.forEach((tag, index) => {
  const row = Math.floor(index / tagsPerRow);
  const col = index % tagsPerRow;
  const x = tagsStartX + col * (tagWidth + tagSpacing);
  const y = tagsStartY + row * (tagHeight + tagSpacing);

  // Draw tag background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(x, y, tagWidth, tagHeight, 6);
  ctx.fill();

  // Draw tag text
  ctx.font = '14px Arial';
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, x + tagWidth / 2, y + tagHeight / 2);
});

// Draw experimental badge
ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
ctx.beginPath();
ctx.roundRect(width - 150, 20, 120, 30, 4);
ctx.fill();

ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.roundRect(width - 150, 20, 120, 30, 4);
ctx.stroke();

ctx.font = '14px Arial';
ctx.fillStyle = '#fca5a5';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Experimental', width - 90, 35);

// Draw icons
const icons = ['🤖', '💰', '🔐', '💬'];
const iconWidth = 40;
const iconSpacing = 20;
const iconsStartX = width / 2 - ((iconWidth + iconSpacing) * icons.length - iconSpacing) / 2;
const iconsY = height - 60;

icons.forEach((icon, index) => {
  const x = iconsStartX + index * (iconWidth + iconSpacing);
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, x + iconWidth / 2, iconsY);
});

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'mcp-wallet-banner.png'), buffer);

console.log('Banner image created successfully at public/images/mcp-wallet-banner.png'); 