const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const BLUE = '#3277d6';
const DOT = '#e6e6e6';

function bubbleSvg({ fill = BLUE, dot = DOT, includeDots = true, scale = 1 }) {
  const tx = 512 * (1 - scale);
  const ty = 512 * (1 - scale);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(${tx} ${ty}) scale(${scale})">
    <rect x="85" y="150" width="854" height="620" rx="180" fill="${fill}" />
    <polygon points="265,770 425,770 265,930" fill="${fill}" />
    ${includeDots ? `<circle cx="340" cy="460" r="65" fill="${dot}" />` : ''}
    ${includeDots ? `<circle cx="512" cy="460" r="65" fill="${dot}" />` : ''}
    ${includeDots ? `<circle cx="684" cy="460" r="65" fill="${dot}" />` : ''}
  </g>
</svg>`;
}

async function saveTransparentIcon(outPath, scale) {
  const svg = Buffer.from(bubbleSvg({ scale }));
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: await sharp(svg).png().toBuffer() }])
    .png()
    .toFile(outPath);
}

async function saveAndroidForeground(outPath) {
  const svg = Buffer.from(
    bubbleSvg({
      fill: '#ffffff',
      dot: BLUE,
      includeDots: true,
      scale: 0.64
    })
  );

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: await sharp(svg).png().toBuffer() }])
    .png()
    .toFile(outPath);
}

async function saveMonochrome(outPath) {
  const svg = Buffer.from(bubbleSvg({ fill: '#000000', includeDots: false, scale: 0.72 }));
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: await sharp(svg).png().toBuffer() }])
    .png()
    .toFile(outPath);
}

async function saveSolidBackground(outPath, color) {
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: color
    }
  })
    .png()
    .toFile(outPath);
}

async function saveSplash(outPath) {
  const logo = await sharp(Buffer.from(bubbleSvg({ scale: 0.8 })))
    .resize(460, 460, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: '#ffffff'
    }
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath);
}

async function saveFavicon(outPath) {
  const logo = Buffer.from(bubbleSvg({ scale: 0.95 }));
  await sharp(logo).resize(64, 64, { fit: 'contain' }).png().toFile(outPath);
}

async function main() {
  const assetsDir = path.join(process.cwd(), 'assets');

  await fs.mkdir(assetsDir, { recursive: true });

  await saveTransparentIcon(path.join(assetsDir, 'icon.png'), 0.9);
  await saveAndroidForeground(path.join(assetsDir, 'adaptive-icon.png'));
  await saveAndroidForeground(path.join(assetsDir, 'android-icon-foreground.png'));
  await saveSolidBackground(path.join(assetsDir, 'android-icon-background.png'), BLUE);
  await saveMonochrome(path.join(assetsDir, 'android-icon-monochrome.png'));
  await saveTransparentIcon(path.join(assetsDir, 'splash-icon.png'), 0.8);
  await saveSplash(path.join(assetsDir, 'splash.png'));
  await saveFavicon(path.join(assetsDir, 'favicon.png'));

  console.log('Generated Expo icon and splash assets in /assets');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
