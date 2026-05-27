const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192
};

async function writeIconSet(density, size, source, resBase) {
  const dir = path.join(resBase, `mipmap-${density}`);
  await fs.mkdir(dir, { recursive: true });

  await sharp(source.icon)
    .resize(size, size, { fit: 'contain' })
    .webp({ quality: 100 })
    .toFile(path.join(dir, 'ic_launcher.webp'));

  await sharp(source.icon)
    .resize(size, size, { fit: 'contain' })
    .webp({ quality: 100 })
    .toFile(path.join(dir, 'ic_launcher_round.webp'));

  await sharp(source.foreground)
    .resize(size, size, { fit: 'contain' })
    .webp({ quality: 100 })
    .toFile(path.join(dir, 'ic_launcher_foreground.webp'));

  await sharp(source.background)
    .resize(size, size, { fit: 'cover' })
    .webp({ quality: 100 })
    .toFile(path.join(dir, 'ic_launcher_background.webp'));

  await sharp(source.monochrome)
    .resize(size, size, { fit: 'contain' })
    .webp({ quality: 100 })
    .toFile(path.join(dir, 'ic_launcher_monochrome.webp'));
}

async function main() {
  const root = process.cwd();
  const source = {
    icon: path.join(root, 'assets', 'icon.png'),
    foreground: path.join(root, 'assets', 'android-icon-foreground.png'),
    background: path.join(root, 'assets', 'android-icon-background.png'),
    monochrome: path.join(root, 'assets', 'android-icon-monochrome.png')
  };

  const resBase = path.join(root, 'android', 'app', 'src', 'main', 'res');

  for (const [density, size] of Object.entries(SIZES)) {
    await writeIconSet(density, size, source, resBase);
  }

  console.log('Synced Android launcher icons into native mipmap folders.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
