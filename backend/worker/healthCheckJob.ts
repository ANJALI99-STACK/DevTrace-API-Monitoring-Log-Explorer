import axios from 'axios';
import { Endpoint, IEndpoint } from '../src/models/Endpoint';
import { HealthLog } from '../src/models/HealthLog';
import { Alert } from '../src/models/Alert';
import { cacheDel } from '../src/config/redis';
import { cacheKeyForUser } from '../src/controllers/dashboardController';
import { indexHealthLog } from '../src/config/opensearch';
import { sendAlertEmail } from './mailer';

const FAILURE_THRESHOLD = 3;

const checkOne = async (endpoint: IEndpoint): Promise<void> => {
  const startedAt = Date.now();
  let statusCode = 0;
  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await axios.request({
      url: endpoint.url,
      method: endpoint.method,
      timeout: 10_000,
      validateStatus: () => true, // we compare manually against expectedStatus
    });
    statusCode = response.status;
    success = response.status === endpoint.expectedStatus;
    if (!success) {
      errorMessage = `Expected status ${endpoint.expectedStatus}, got ${response.status}`;
    }
  } catch (err) {
    const axiosErr = err as { code?: string; message: string };
    statusCode = 0;
    success = false;
    errorMessage = axiosErr.code === 'ECONNABORTED' ? 'Request timed out' : axiosErr.message;
  }

  const responseTime = Date.now() - startedAt;
  const checkedAt = new Date();

  endpoint.lastCheckedAt = checkedAt;

  await HealthLog.create({
    endpointId: endpoint._id,
    userId: endpoint.userId,
    statusCode,
    responseTime,
    success,
    errorMessage,
    checkedAt,
  });

  await indexHealthLog({
    endpointId: endpoint._id.toString(),
    endpointName: endpoint.name,
    userId: endpoint.userId.toString(),
    statusCode,
    responseTime,
    success,
    errorMessage,
    timestamp: checkedAt.toISOString(),
  });

  // Invalidate the cached dashboard so the next request recomputes fresh metrics.
  await cacheDel(cacheKeyForUser(endpoint.userId.toString()));

  if (success) {
    endpoint.consecutiveFailures = 0;
    await endpoint.save();
    return;
  }

  endpoint.consecutiveFailures += 1;
  await endpoint.save();

  if (endpoint.consecutiveFailures === FAILURE_THRESHOLD) {
    const message = `${endpoint.name} has failed ${FAILURE_THRESHOLD} consecutive health checks. Last error: ${
      errorMessage || 'unknown'
    }`;

    const alert = await Alert.create({
      endpointId: endpoint._id,
      userId: endpoint.userId,
      message,
    });

    await sendAlertEmail(endpoint.userId.toString(), endpoint.name, message).catch((err) =>
      console.error('[worker] failed to send alert email', err)
    );

    console.log(`[worker] alert created for endpoint ${endpoint.name} (${alert._id})`);
  }
};

/**
 * Runs one sweep over all active endpoints whose `interval` has elapsed
 * since their last check. Intended to be invoked on a fixed tick (see
 * worker/index.ts) rather than scheduled per-endpoint, to keep this
 * demonstrable and simple for an interview walkthrough.
 */
export const runHealthCheckSweep = async (): Promise<void> => {
  const endpoints = await Endpoint.find({ isActive: true });

  if (endpoints.length === 0) return;

  const now = Date.now();
  const dueEndpoints = endpoints.filter((e) => {
    if (!e.lastCheckedAt) return true;
    const elapsedSeconds = (now - e.lastCheckedAt.getTime()) / 1000;
    return elapsedSeconds >= e.interval;
  });

  if (dueEndpoints.length === 0) return;

  console.log(`[worker] sweep: ${dueEndpoints.length}/${endpoints.length} endpoints due`);
  await Promise.allSettled(dueEndpoints.map(checkOne));
};
