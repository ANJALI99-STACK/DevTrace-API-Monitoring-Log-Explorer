import { Response } from 'express';
import { Types } from 'mongoose';
import { Endpoint } from '../models/Endpoint';
import { HealthLog } from '../models/HealthLog';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth';
import { osClient, OPENSEARCH_INDEX } from '../config/opensearch';

/**
 * GET /logs?search=&status=&endpointId=&from=&to=&page=&limit=
 *
 * Full-text search and filtering is delegated to OpenSearch, since that is
 * what it's built for (see PROJECT spec: "Searching logs must use
 * OpenSearch, not MongoDB"). If OpenSearch is unreachable (e.g. running the
 * API without the Docker stack up), we fall back to a Mongo query so the
 * Log Explorer still works locally.
 */
export const searchLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string;
  const { search, status, endpointId, from, to, page = '1', limit = '25' } = req.query as Record<
    string,
    string
  >;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 25, 100);

  try {
    const must: unknown[] = [{ term: { userId } }];
    if (search) {
      must.push({
        multi_match: { query: search, fields: ['endpointName', 'errorMessage'] },
      });
    }
    if (status) {
      if (status === 'success') must.push({ term: { success: true } });
      if (status === 'failure') must.push({ term: { success: false } });
    }
    if (endpointId) must.push({ term: { endpointId } });
    if (from || to) {
      must.push({
        range: {
          timestamp: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        },
      });
    }

    const result = await osClient.search({
      index: OPENSEARCH_INDEX,
      body: {
        query: { bool: { must } },
        sort: [{ timestamp: { order: 'desc' } }],
        from: (pageNum - 1) * limitNum,
        size: limitNum,
      },
    });

    const hits = result.body.hits.hits.map((h: { _source: unknown }) => h._source);
    res.json({ success: true, data: hits, total: result.body.hits.total.value, source: 'opensearch' });
  } catch (err) {
    console.warn('[logs] OpenSearch unavailable, falling back to MongoDB', (err as Error).message);

    const userObjectId = new Types.ObjectId(userId);
    const endpoints = await Endpoint.find({ userId: userObjectId }).select('_id name');
    const endpointIds = endpoints.map((e) => e._id);
    const nameById = new Map(endpoints.map((e) => [e._id.toString(), e.name]));

    const filter: Record<string, unknown> = { endpointId: { $in: endpointIds } };
    if (status === 'success') filter.success = true;
    if (status === 'failure') filter.success = false;
    if (endpointId) filter.endpointId = new Types.ObjectId(endpointId);
    if (from || to) {
      filter.checkedAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }
    if (search) {
      filter.errorMessage = { $regex: search, $options: 'i' };
    }

    const [logs, total] = await Promise.all([
      HealthLog.find(filter)
        .sort({ checkedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      HealthLog.countDocuments(filter),
    ]);

    const data = logs.map((l) => ({
      endpointName: nameById.get(l.endpointId.toString()) || 'Unknown',
      statusCode: l.statusCode,
      responseTime: l.responseTime,
      success: l.success,
      errorMessage: l.errorMessage,
      timestamp: l.checkedAt,
    }));

    res.json({ success: true, data, total, source: 'mongodb-fallback' });
  }
});
