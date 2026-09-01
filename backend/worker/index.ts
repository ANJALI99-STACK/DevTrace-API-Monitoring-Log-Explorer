import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/db';
import { ensureIndex } from '../src/config/opensearch';
import { runHealthCheckSweep } from './healthCheckJob';
import { startExportWorker } from './exportJob';

const SWEEP_INTERVAL_MS = 15_000; // check for due endpoints every 15s; per-endpoint interval is enforced inside the sweep

const start = async (): Promise<void> => {
  await connectDB();
  await ensureIndex();

  startExportWorker();
  console.log('[worker] CSV export worker listening on queue "csv-export"');

  console.log('[worker] health-check sweep starting, interval =', SWEEP_INTERVAL_MS, 'ms');
  const tick = async (): Promise<void> => {
    try {
      await runHealthCheckSweep();
    } catch (err) {
      console.error('[worker] sweep failed', err);
    }
  };

  await tick();
  setInterval(tick, SWEEP_INTERVAL_MS);
};

start().catch((err) => {
  console.error('[worker] failed to start', err);
  process.exit(1);
});
