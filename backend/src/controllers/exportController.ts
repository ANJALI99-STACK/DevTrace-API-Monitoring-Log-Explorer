import { Response } from 'express';
import { Queue } from 'bullmq';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

export const exportQueue = new Queue('csv-export', { connection });

/**
 * POST /export/logs
 * Enqueues a CSV export job. The worker service (worker/exportJob.ts)
 * generates the CSV, uploads it to S3, and the client polls GET
 * /export/logs/:jobId for the resulting URL.
 */
export const exportLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { from, to, endpointId } = req.body as { from?: string; to?: string; endpointId?: string };

  const job = await exportQueue.add('export-logs', {
    userId: req.userId,
    from,
    to,
    endpointId,
  });

  res.status(202).json({
    success: true,
    message: 'Export job queued',
    data: { jobId: job.id },
  });
});

export const getExportStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await exportQueue.getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  const state = await job.getState();
  const returnValue = job.returnvalue as { url?: string } | undefined;

  res.json({
    success: true,
    data: { jobId: job.id, state, downloadUrl: returnValue?.url ?? null },
  });
});
