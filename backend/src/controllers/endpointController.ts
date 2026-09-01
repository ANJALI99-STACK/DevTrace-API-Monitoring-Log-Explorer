import { Response } from 'express';
import { z } from 'zod';
import { Endpoint } from '../models/Endpoint';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../middleware/auth';

const endpointSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  interval: z.number().int().min(30, 'Minimum interval is 30 seconds').default(60),
});

export const listEndpoints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const endpoints = await Endpoint.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: endpoints });
});

export const createEndpoint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = endpointSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  const endpoint = await Endpoint.create({ ...parsed.data, userId: req.userId });
  res.status(201).json({ success: true, data: endpoint });
});

export const updateEndpoint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = endpointSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }

  const endpoint = await Endpoint.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    parsed.data,
    { new: true }
  );
  if (!endpoint) throw new ApiError(404, 'Endpoint not found');

  res.json({ success: true, data: endpoint });
});

export const deleteEndpoint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const endpoint = await Endpoint.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!endpoint) throw new ApiError(404, 'Endpoint not found');
  res.json({ success: true, message: 'Endpoint deleted' });
});

export const toggleEndpoint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const endpoint = await Endpoint.findOne({ _id: req.params.id, userId: req.userId });
  if (!endpoint) throw new ApiError(404, 'Endpoint not found');

  endpoint.isActive = !endpoint.isActive;
  await endpoint.save();

  res.json({ success: true, data: endpoint });
});
