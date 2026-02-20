import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS ayarları - her yerden erişim
app.use(cors());

// Tüm isteklere Expo header'larını ekle
app.use((req, res, next) => {
  res.setHeader('expo-protocol-version', '1');
  res.setHeader('expo-sfv-version', '0');
  next();
});

// dist klasörünü statik olarak servis et
app.use(express.static(path.join(__dirname, 'dist')));

// Manifest endpoint - Expo Updates için gerekli
app.get('/manifest', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, 'dist', 'metadata.json');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Platform'u query parametresinden al (android veya ios)
    const platform = req.query.platform || 'android';
    const runtimeVersion = req.query.runtimeVersion || '1.0.0';
    
    // Platform'a göre fileMetadata seç
    const fileMetadata = metadata.fileMetadata[platform];
    if (!fileMetadata) {
      return res.status(404).json({ error: 'Platform not found' });
    }
    
    // Base URL'i oluştur
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // Manifest objesini oluştur
    const manifest = {
      id: `${Date.now()}-${platform}`,
      createdAt: new Date().toISOString(),
      runtimeVersion: runtimeVersion,
      assets: fileMetadata.assets.map(asset => {
        const fileName = asset.path.split('/').pop();
        const hash = fileName.split('.')[0]; // Dosya adından hash al (örn: 983f76f089603a6a022d4a5b06b2f669)
        return {
          hash: hash,
          key: asset.path,
          contentType: getContentType(asset.ext),
          url: `${baseUrl}/${asset.path}`
        };
      }),
      launchAsset: {
        hash: fileMetadata.bundle.split('/').pop().split('.')[0],
        key: fileMetadata.bundle,
        contentType: 'application/javascript',
        url: `${baseUrl}/${fileMetadata.bundle}`
      }
    };
    
    res.json(manifest);
  } catch (error) {
    console.error('Manifest hatası:', error);
    res.status(500).json({ error: 'Failed to generate manifest', message: error.message });
  }
});

// Content type helper
function getContentType(ext) {
  const types = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'ttf': 'font/ttf',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'json': 'application/json',
    'js': 'application/javascript',
    'hbc': 'application/javascript'
  };
  return types[ext] || 'application/octet-stream';
}

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Expo OTA sunucusu ${PORT} portunda çalışıyor`);
  console.log(`Dist klasörü: ${path.join(__dirname, 'dist')}`);
});
