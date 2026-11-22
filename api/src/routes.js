import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { config } from './config.js';
import { analyzeBuffer, analyzeDemo, deleteRun, getRun, listRuns } from './analysis.js';
import { APP_CATALOG } from './pcap.js';
import { getRules, updateRules } from './rules.js';
import { openapi } from './openapi.js';
import { analyzeLimiter, requireOperator, writeLimiter } from './security.js';
import { validate } from './validate.js';
import { rulesSchema } from './schemas.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes }
});

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export const router = Router();

router.get('/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    ok: databaseReady,
    service: 'packet-analyzer-api',
    database: databaseReady ? 'connected' : 'disconnected',
    uptimeSeconds: Number(process.uptime().toFixed(1)),
    time: new Date().toISOString()
  });
});

router.get('/openapi.json', (_req, res) => {
  res.json(openapi);
});

router.get('/apps', (_req, res) => {
  res.json({ apps: APP_CATALOG });
});

router.get(
  '/rules',
  wrap(async (_req, res) => {
    res.json({ rules: await getRules(), apps: APP_CATALOG });
  })
);

router.put(
  '/rules',
  requireOperator,
  writeLimiter,
  validate(rulesSchema),
  wrap(async (req, res) => {
    res.json({ rules: await updateRules(req.body), apps: APP_CATALOG });
  })
);

router.post(
  '/analyze',
  analyzeLimiter,
  upload.single('file'),
  wrap(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'Choose a .pcap file to analyze' } });
    }
    const run = await analyzeBuffer(req.file.buffer, { filename: req.file.originalname || 'capture.pcap' });
    res.status(201).json({ run });
  })
);

router.post(
  '/analyze/demo',
  analyzeLimiter,
  wrap(async (_req, res) => {
    res.status(201).json({ run: await analyzeDemo() });
  })
);

router.get(
  '/runs',
  wrap(async (req, res) => {
    res.json({ items: await listRuns(req.query.limit) });
  })
);

router.get(
  '/runs/:id',
  wrap(async (req, res) => {
    const run = await getRun(req.params.id);
    if (!run) return res.status(404).json({ error: { message: 'Analysis not found' } });
    res.json({ run });
  })
);

router.delete(
  '/runs/:id',
  requireOperator,
  writeLimiter,
  wrap(async (req, res) => {
    const removed = await deleteRun(req.params.id);
    if (!removed) return res.status(404).json({ error: { message: 'Analysis not found' } });
    res.json({ ok: true });
  })
);
