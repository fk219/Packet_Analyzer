import 'dotenv/config';

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: number(process.env.PORT, 4200),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/packetanalyzer',
  corsOrigin: process.env.CORS_ORIGIN || '',
  maxUploadBytes: number(process.env.MAX_UPLOAD_BYTES, 8 * 1024 * 1024),
  nodeEnv: process.env.NODE_ENV || 'development'
};
