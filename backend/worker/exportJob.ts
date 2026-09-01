import { Worker, Job } from 'bullmq';
import { Parser } from 'json2csv';
import AWS from 'aws-sdk';
import { Types } from 'mongoose';
import { connection } from './queue';
import { HealthLog } from '../src/models/HealthLog';
import { Endpoint } from '../src/models/Endpoint';

interface ExportJobData {
  userId: string;
  from?: string;
  to?: string;
  endpointId?: string;
}

const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'ap-south-1' });
const BUCKET = process.env.S3_BUCKET_NAME || 'devtrace-exports';

const processExport = async (job: Job<ExportJobData>): Promise<{ url: string }> => {
  const { userId, from, to, endpointId } = job.data;

  const endpoints = await Endpoint.find({ userId: new Types.ObjectId(userId) }).select('_id name');
  const endpointIds = endpointId ? [new Types.ObjectId(endpointId)] : endpoints.map((e) => e._id);
  const nameById = new Map(endpoints.map((e) => [e._id.toString(), e.name]));

  const filter: Record<string, unknown> = { endpointId: { $in: endpointIds } };
  if (from || to) {
    filter.checkedAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const logs = await HealthLog.find(filter).sort({ checkedAt: -1 }).limit(10_000);

  const rows = logs.map((l) => ({
    endpoint: nameById.get(l.endpointId.toString()) || 'Unknown',
    statusCode: l.statusCode,
    responseTime: l.responseTime,
    success: l.success,
    errorMessage: l.errorMessage || '',
    checkedAt: l.checkedAt.toISOString(),
  }));

  const parser = new Parser({
    fields: ['endpoint', 'statusCode', 'responseTime', 'success', 'errorMessage', 'checkedAt'],
  });
  const csv = parser.parse(rows);

  const key = `exports/${userId}/${job.id}.csv`;

  await s3
    .putObject({
      Bucket: BUCKET,
      Key: key,
      Body: csv,
      ContentType: 'text/csv',
    })
    .promise();

  const url = s3.getSignedUrl('getObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: 60 * 60, // 1 hour
  });

  console.log(`[worker] export ${job.id} complete: ${rows.length} rows -> s3://${BUCKET}/${key}`);
  return { url };
};

export const startExportWorker = (): Worker<ExportJobData> => {
  const worker = new Worker<ExportJobData>('csv-export', processExport, { connection });

  worker.on('failed', (job, err) => {
    console.error(`[worker] export job ${job?.id} failed:`, err.message);
  });

  return worker;
};
