import { config } from './config.js';
import { connectDb, disconnectDb } from './db.js';
import { seedRules } from './rules.js';
import { Analysis } from './models.js';
import { analyzeDemo } from './analysis.js';
import { createApp } from './app.js';

await connectDb(config.mongoUri);
await seedRules();
if ((await Analysis.countDocuments()) === 0) {
  await analyzeDemo();
}

const app = createApp();
const server = app.listen(config.port, () => {
  process.stdout.write(`Packet analyzer API listening on ${config.port}\n`);
});

const shutdown = async () => {
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
