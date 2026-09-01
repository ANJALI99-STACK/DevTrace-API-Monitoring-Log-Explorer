import { Response } from 'express';
import { Types } from 'mongoose';
import { Endpoint } from '../models/Endpoint';
import { HealthLog } from '../models/HealthLog';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';
import { cacheGet, cacheSet } from '../config/redis';

interface DashboardData {
  uptimePercent: number;
  avgLatency: number;
  healthyApis: number;
  failedToday: number;
  latencyTrend: { time: string; responseTime: number }[];
  uptimeTrend: { date: string; uptimePercent: number }[];
  statusDistribution: { status: string; count: number }[];
}

export const cacheKeyForUser = (userId: string): string => `dashboard:${userId}`;

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const cacheKey = cacheKeyForUser(userId);

  const cached = await cacheGet<DashboardData>(cacheKey);
  if (cached) {
    res.json({ success: true, data: cached, cached: true });
    return;
  }

  const userObjectId = new Types.ObjectId(userId);
  const endpoints = await Endpoint.find({ userId: userObjectId });
  const endpointIds = endpoints.map((e) => e._id);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [recentLogs, todayFailures] = await Promise.all([
    HealthLog.find({ endpointId: { $in: endpointIds }, checkedAt: { $gte: since24h } }).sort({
      checkedAt: 1,
    }),
    HealthLog.countDocuments({
      endpointId: { $in: endpointIds },
      checkedAt: { $gte: todayStart },
      success: false,
    }),
  ]);

  const totalChecks = recentLogs.length;
  const successfulChecks = recentLogs.filter((l) => l.success).length;
  const uptimePercent = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 1000) / 10 : 100;
  const avgLatency =
    totalChecks > 0
      ? Math.round(recentLogs.reduce((sum, l) => sum + l.responseTime, 0) / totalChecks)
      : 0;
  const healthyApis = endpoints.filter((e) => e.consecutiveFailures === 0 && e.isActive).length;

  const latencyTrend = recentLogs.slice(-30).map((l) => ({
    time: l.checkedAt.toISOString(),
    responseTime: l.responseTime,
  }));

  const uptimeByDay = new Map<string, { total: number; success: number }>();
  recentLogs.forEach((l) => {
    const day = l.checkedAt.toISOString().split('T')[0];
    const entry = uptimeByDay.get(day) || { total: 0, success: 0 };
    entry.total += 1;
    if (l.success) entry.success += 1;
    uptimeByDay.set(day, entry);
  });
  const uptimeTrend = Array.from(uptimeByDay.entries()).map(([date, v]) => ({
    date,
    uptimePercent: Math.round((v.success / v.total) * 1000) / 10,
  }));

  const statusMap = new Map<string, number>();
  recentLogs.forEach((l) => {
    const bucket = l.success ? '2xx/3xx' : l.statusCode >= 500 ? '5xx' : l.statusCode >= 400 ? '4xx' : 'timeout';
    statusMap.set(bucket, (statusMap.get(bucket) || 0) + 1);
  });
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  const data: DashboardData = {
    uptimePercent,
    avgLatency,
    healthyApis,
    failedToday: todayFailures,
    latencyTrend,
    uptimeTrend,
    statusDistribution,
  };

  await cacheSet(cacheKey, data, 60);
  res.json({ success: true, data, cached: false });
});
