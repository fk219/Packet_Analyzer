import { Router } from 'express';
import multer from 'multer';
import { config } from './config.js';
import { analyzeBuffer, analyzeDemo, deleteRun, getRun, listRuns } from './analysis.js';
import { APP_CATALOG } from './pcap.js';
import { getRules, updateRules } from './rules.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes }
});

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'packet-analyzer-api', time: new Date().toISOString() });
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
  wrap(async (req, res) => {
    res.json({ rules: await updateRules(req.body || {}), apps: APP_CATALOG });
  })
);

router.post(
  '/analyze',
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
  wrap(async (req, res) => {
    const removed = await deleteRun(req.params.id);
    if (!removed) return res.status(404).json({ error: { message: 'Analysis not found' } });
    res.json({ ok: true });
  })
);
