const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico').default || require('png-to-ico');

const SOURCE_IMAGE = 'C:\\Users\\LAPTOP\\.gemini\\antigravity-ide\\brain\\9b90c5f0-85f2-4819-96be-134144915a58\\overtone_badge_icon_1786923110209.jpg';
const ROOT_DIR = path.resolve(__dirname, '..');

async function generateAllIcons() {
  console.log('🔄 Generating Overtone App Brand Icons...');

  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error(`Source image not found: ${SOURCE_IMAGE}`);
  }

  // Ensure directories exist
  const buildDir = path.join(ROOT_DIR, 'build');
  const publicDir = path.join(ROOT_DIR, 'public');
  const appDir = path.join(ROOT_DIR, 'src', 'app');

  [buildDir, publicDir, appDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // 1. Generate 512x512 High-Res Master PNG
  const masterPngPath = path.join(buildDir, 'icon.png');
  await sharp(SOURCE_IMAGE)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toFile(masterPngPath);
  console.log('✔ Generated master build/icon.png');

  // Copy to public/icon.png, public/logo.png, and src/app/icon.png
  fs.copyFileSync(masterPngPath, path.join(publicDir, 'icon.png'));
  fs.copyFileSync(masterPngPath, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(masterPngPath, path.join(appDir, 'icon.png'));
  console.log('✔ Copied to public/icon.png and src/app/icon.png');

  // 2. Generate PNG sizes for ICO multi-resolution package
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(SOURCE_IMAGE)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toBuffer()
    )
  );

  // 3. Generate Windows .ICO containing all sizes
  const icoBuffer = await pngToIco(pngBuffers);

  const buildIcoPath = path.join(buildDir, 'icon.ico');
  const publicFaviconPath = path.join(publicDir, 'favicon.ico');
  const appFaviconPath = path.join(appDir, 'favicon.ico');
  const installerIconPath = path.join(buildDir, 'installerIcon.ico');
  const uninstallerIconPath = path.join(buildDir, 'uninstallerIcon.ico');

  fs.writeFileSync(buildIcoPath, icoBuffer);
  fs.writeFileSync(publicFaviconPath, icoBuffer);
  fs.writeFileSync(appFaviconPath, icoBuffer);
  fs.writeFileSync(installerIconPath, icoBuffer);
  fs.writeFileSync(uninstallerIconPath, icoBuffer);

  console.log('✔ Generated Windows .ICO:');
  console.log('  - build/icon.ico');
  console.log('  - build/installerIcon.ico');
  console.log('  - build/uninstallerIcon.ico');
  console.log('  - public/favicon.ico');
  console.log('  - src/app/favicon.ico');
  console.log('🎉 All brand icons created successfully!');
}

generateAllIcons().catch((err) => {
  console.error('❌ Failed to generate icons:', err);
  process.exit(1);
});
