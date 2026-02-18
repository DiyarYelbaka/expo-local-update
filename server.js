import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Expo OTA sunucusu ${PORT} portunda çalışıyor`);
  console.log(`Dist klasörü: ${path.join(__dirname, 'dist')}`);
});
