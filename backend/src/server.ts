import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './config/db';
import { ensureIndex } from './config/opensearch';

const PORT = process.env.PORT || 4000;

const start = async (): Promise<void> => {
  await connectDB();
  await ensureIndex();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] DevTrace API listening on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
