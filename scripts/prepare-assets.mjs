import sharp from 'sharp';
await Promise.all([
  sharp('public/assets/world.png').resize(1536).webp({ quality: 85 }).toFile('public/assets/world.webp'),
  sharp('public/assets/logo.png').resize(800).webp({ quality: 90 }).toFile('public/assets/logo.webp'),
]);
console.log('Optimized launcher world and transparent logo.');
